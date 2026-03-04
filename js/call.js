// 📞 CALL / VAD LOGIC — v2.0 (Interactive)
// ============================================
// Улучшения:
// - Порог тишины 800ms (было 1200ms) — быстрее реагирует
// - Мгновенное прерывание бота с fade-out
// - Визуальные статусы: Слушаю → Обрабатываю → Отвечает
// - Возобновление записи сразу после прерывания
// ============================================

let vadContext, vadAnalyser, vadSource, vadStream, vadInterval;
let isSpeaking = false, silenceStart = Date.now(), callMediaRecorder = null, callChunks = [], currentBotAudio = null;
let isBotSpeaking = false, isProcessing = false;

const VAD_THRESHOLD = 30;
const SILENCE_TIMEOUT = 800;

// ============================================
// 🎙️ INIT
// ============================================
async function initCallUI() {
    setCallStatus("Подключение...");
    try {
        if (!vadStream || !vadStream.active) {
            vadStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        if (!vadContext || vadContext.state === 'closed') {
            vadContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (vadContext.state === 'suspended') await vadContext.resume();
        if (!vadAnalyser) vadAnalyser = vadContext.createAnalyser();
        vadAnalyser.fftSize = 512;

        try { if (vadSource) vadSource.disconnect(); } catch(e) {}
        vadSource = vadContext.createMediaStreamSource(vadStream);
        vadSource.connect(vadAnalyser);

        callMediaRecorder = new MediaRecorder(vadStream);
        callMediaRecorder.ondataavailable = e => callChunks.push(e.data);
        callMediaRecorder.onstop = handleRecordingComplete;

        isBotSpeaking = false;
        isProcessing = false;
        startListening();
    } catch (e) {
        alert("Ошибка микрофона: " + e);
        navigateTo('menu');
    }
}

// ============================================
// 🔊 VOLUME ANALYSIS (VAD)
// ============================================
function analyzeVolume() {
    if (!vadAnalyser || !document.getElementById('call-screen').classList.contains('active')) return;

    const data = new Uint8Array(vadAnalyser.frequencyBinCount);
    vadAnalyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    const avg = sum / data.length;

    const circle = document.querySelector('.ai-avatar-circle');
    if (circle) circle.style.transform = `scale(${1 + (avg / 200)})`;

    if (avg > VAD_THRESHOLD) {
        if (!isSpeaking && !isProcessing) {
            isSpeaking = true;
            callChunks = [];

            // Мгновенное прерывание бота с fade-out
            if (isBotSpeaking) {
                interruptBotAudio();
            }

            if (callMediaRecorder && callMediaRecorder.state === 'inactive') {
                callMediaRecorder.start();
            }
        }
        silenceStart = Date.now();
    } else {
        if (isSpeaking && Date.now() - silenceStart > SILENCE_TIMEOUT) {
            isSpeaking = false;
            if (callMediaRecorder && callMediaRecorder.state === 'recording') {
                callMediaRecorder.stop();
                clearInterval(vadInterval);
            }
        }
    }
}

// ============================================
// 🛑 ПРЕРЫВАНИЕ БОТА (fade-out 150ms)
// ============================================
function interruptBotAudio() {
    if (!currentBotAudio) return;

    isBotSpeaking = false;
    const audio = currentBotAudio;

    const fadeSteps = 10;
    const fadeInterval = 15;
    let step = 0;
    const startVolume = audio.volume;
    const fade = setInterval(() => {
        step++;
        audio.volume = Math.max(0, startVolume * (1 - step / fadeSteps));
        if (step >= fadeSteps) {
            clearInterval(fade);
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 1;
        }
    }, fadeInterval);

    currentBotAudio = null;
    const circle = document.querySelector('.ai-avatar-circle');
    if (circle) circle.style.animation = 'none';
}

// ============================================
// 📤 ОБРАБОТКА ЗАПИСИ
// ============================================
async function handleRecordingComplete() {
    if (!document.getElementById('call-screen').classList.contains('active')) return;

    const blob = new Blob(callChunks, { type: 'audio/webm' });
    if (blob.size < 1000) {
        startListening();
        return;
    }

    isProcessing = true;
    setCallStatus("Обрабатываю...");
    const circle = document.querySelector('.ai-avatar-circle');
    if (circle) circle.style.transform = 'scale(0.8)';

    const base64 = await blobToBase64(blob);

    try {
        const res = await fetch(GOOGLE_SCRIPT_URL + '?act=api', {
            method: 'POST',
            body: JSON.stringify({ audio: base64, initData: tg.initData, text: '' })
        });
        const d = await res.json();

        if (!document.getElementById('call-screen').classList.contains('active')) return;

        if (d.error_code === 'not_subscribed') {
            showSubscriptionGate(d.channel || _requiredChannel || '@channel');
            endCall();
            return;
        }
        if (d.error_code === 'limit_reached' || d.error_code === 'no_credits' || d.error_code === 'voice_blocked') {
            showPaywall('voice');
            endCall();
            return;
        }

        if (d.balance !== undefined) updateLocalBalance(d.balance);

        if (d.status === 'success' && d.audio) {
            isProcessing = false;
            setCallStatus("Отвечает...");
            playAudioResponseInCall(d.audio);
        } else {
            isProcessing = false;
            startListening();
        }
    } catch (e) {
        isProcessing = false;
        startListening();
    }
}

// ============================================
// 🔊 ВОСПРОИЗВЕДЕНИЕ ОТВЕТА
// ============================================
function playAudioResponseInCall(base64) {
    if (!document.getElementById('call-screen').classList.contains('active')) return;

    try {
        if (currentBotAudio) {
            currentBotAudio.pause();
            currentBotAudio.currentTime = 0;
        }

        currentBotAudio = new Audio("data:audio/mp3;base64," + base64);
        isBotSpeaking = true;

        const circle = document.querySelector('.ai-avatar-circle');
        if (circle) circle.style.animation = 'pulse-avatar 1s infinite';

        currentBotAudio.play().catch(() => {
            isBotSpeaking = false;
            startListening();
        });

        currentBotAudio.onended = () => {
            isBotSpeaking = false;
            if (circle) circle.style.animation = 'none';
            startListening();
        };
    } catch (e) {
        isBotSpeaking = false;
        startListening();
    }
}

// ============================================
// 🎧 УПРАВЛЕНИЕ СОСТОЯНИЕМ
// ============================================
function startListening() {
    if (!document.getElementById('call-screen').classList.contains('active')) return;
    setCallStatus("Слушаю...");
    callChunks = [];
    isSpeaking = false;
    isProcessing = false;
    clearInterval(vadInterval);
    vadInterval = setInterval(analyzeVolume, 50);
}

function setCallStatus(text) {
    const el = document.getElementById('callStatus');
    if (el) el.innerText = text;
}

// ============================================
// 📞 КОНЕЦ ЗВОНКА
// ============================================
function endCall() {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('heavy');
    clearInterval(vadInterval);
    isBotSpeaking = false;
    isProcessing = false;

    if (currentBotAudio) {
        currentBotAudio.pause();
        currentBotAudio = null;
    }
    if (callMediaRecorder && callMediaRecorder.state === 'recording') {
        callMediaRecorder.stop();
        callChunks = [];
    }
    if (vadContext) vadContext.suspend();
    navigateTo('menu');
}

// ============================================
// 🎛️ КНОПКИ УПРАВЛЕНИЯ
// ============================================
function toggleSpeaker() {
    document.getElementById('speakerBtn').classList.toggle('btn-active-state');
    if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function toggleMicMute(btn) {
    btn.classList.toggle('btn-active-state');
    btn.querySelector('span').innerText = btn.classList.contains('btn-active-state') ? 'mic_off' : 'mic';
    if (vadStream) vadStream.getAudioTracks()[0].enabled = !btn.classList.contains('btn-active-state');
    if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

// ============================================
