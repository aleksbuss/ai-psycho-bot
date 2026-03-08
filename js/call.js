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
    const { source, gainNode } = currentBotAudio;
    currentBotAudio = null;

    const fadeSteps = 10;
    const fadeInterval = 15;
    let step = 0;
    const fade = setInterval(() => {
        step++;
        gainNode.gain.value = Math.max(0, 1 - step / fadeSteps);
        if (step >= fadeSteps) {
            clearInterval(fade);
            try { source.stop(); } catch(e) {}
        }
    }, fadeInterval);

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
            playAudioResponseInCall(d.audio, d.audioMime);
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
// 🔊 ВОСПРОИЗВЕДЕНИЕ ОТВЕТА (через Web Audio API)
// ============================================
function playAudioResponseInCall(base64, _mime) {
    if (!document.getElementById('call-screen').classList.contains('active')) return;

    if (currentBotAudio) {
        try { currentBotAudio.source.stop(); } catch(e) {}
        currentBotAudio = null;
    }

    try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        vadContext.resume().then(() => {
            vadContext.decodeAudioData(bytes.buffer, (audioBuffer) => {
                if (!document.getElementById('call-screen').classList.contains('active')) return;

                const source = vadContext.createBufferSource();
                const gainNode = vadContext.createGain();
                source.buffer = audioBuffer;
                source.connect(gainNode);
                gainNode.connect(vadContext.destination);

                currentBotAudio = { source, gainNode };
                isBotSpeaking = true;

                const circle = document.querySelector('.ai-avatar-circle');
                if (circle) circle.style.animation = 'pulse-avatar 1s infinite';

                source.onended = () => {
                    if (currentBotAudio && currentBotAudio.source === source) {
                        currentBotAudio = null;
                    }
                    isBotSpeaking = false;
                    if (circle) circle.style.animation = 'none';
                    startListening();
                };

                source.start(0);
            }, () => {
                isBotSpeaking = false;
                startListening();
            });
        });
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
        try { currentBotAudio.source.stop(); } catch(e) {}
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
