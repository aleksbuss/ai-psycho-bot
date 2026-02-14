// 📞 CALL / VAD LOGIC
// ============================================
let vadContext, vadAnalyser, vadSource, vadStream, vadInterval;
let isSpeaking = false, silenceStart = Date.now(), callMediaRecorder = null, callChunks = [], currentBotAudio = null;
const VAD_THRESHOLD = 30;

async function initCallUI() {
    document.getElementById('callStatus').innerText = "Подключение...";
    try {
        if (!vadStream || !vadStream.active) vadStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!vadContext || vadContext.state === 'closed') vadContext = new (window.AudioContext || window.webkitAudioContext)();
        if (vadContext.state === 'suspended') await vadContext.resume();
        if (!vadAnalyser) vadAnalyser = vadContext.createAnalyser(); vadAnalyser.fftSize = 512;
        try { if (vadSource) vadSource.disconnect(); } catch(e) {}
        vadSource = vadContext.createMediaStreamSource(vadStream); vadSource.connect(vadAnalyser);
        callMediaRecorder = new MediaRecorder(vadStream);
        callMediaRecorder.ondataavailable = e => callChunks.push(e.data);
        callMediaRecorder.onstop = async () => {
            if (!document.getElementById('call-screen').classList.contains('active')) return;
            const blob = new Blob(callChunks, { type: 'audio/webm' }); if (blob.size < 1000) { resetListening(); return; }
            document.getElementById('callStatus').innerText = "Думаю..."; document.querySelector('.ai-avatar-circle').style.transform = 'scale(0.8)';
            const base64 = await blobToBase64(blob);
            fetch(GOOGLE_SCRIPT_URL + '?act=api', { method: 'POST', body: JSON.stringify({ audio: base64, initData: tg.initData, text: '' }) }).then(r=>r.json()).then(d => { if (d.status==='success'&&d.audio) { document.getElementById('callStatus').innerText = "Говорит..."; playAudioResponseInCall(d.audio); } else { resetListening(); } }).catch(e => { resetListening(); });
        };
        document.getElementById('callStatus').innerText = "Слушаю...";
        clearInterval(vadInterval); vadInterval = setInterval(analyzeVolume, 50);
    } catch (e) { alert("Ошибка микрофона: " + e); navigateTo('menu'); }
}

function analyzeVolume() {
    if (!vadAnalyser || !document.getElementById('call-screen').classList.contains('active')) return;
    const data = new Uint8Array(vadAnalyser.frequencyBinCount); vadAnalyser.getByteFrequencyData(data);
    let sum = 0; for (let i=0;i<data.length;i++) sum += data[i]; const avg = sum / data.length;
    const circle = document.querySelector('.ai-avatar-circle'); if(circle) circle.style.transform = `scale(${1 + (avg / 200)})`;
    if (avg > VAD_THRESHOLD) { if (!isSpeaking) { isSpeaking = true; callChunks = []; if (currentBotAudio && !currentBotAudio.paused) { currentBotAudio.pause(); currentBotAudio = null; } if (callMediaRecorder && callMediaRecorder.state === 'inactive') callMediaRecorder.start(); } silenceStart = Date.now(); }
    else { if (isSpeaking && Date.now() - silenceStart > 1200) { isSpeaking = false; if (callMediaRecorder && callMediaRecorder.state === 'recording') { callMediaRecorder.stop(); clearInterval(vadInterval); } } }
}

function playAudioResponseInCall(base64) {
    if (!document.getElementById('call-screen').classList.contains('active')) return;
    try { if (currentBotAudio) { currentBotAudio.pause(); currentBotAudio.currentTime = 0; } currentBotAudio = new Audio("data:audio/mp3;base64," + base64); currentBotAudio.play(); document.querySelector('.ai-avatar-circle').style.animation = 'pulse-avatar 1s infinite'; currentBotAudio.onended = () => { document.querySelector('.ai-avatar-circle').style.animation = 'none'; resetListening(); }; } catch (e) { resetListening(); }
}
function resetListening() { if (!document.getElementById('call-screen').classList.contains('active')) return; document.getElementById('callStatus').innerText = "Слушаю..."; callChunks = []; isSpeaking = false; clearInterval(vadInterval); vadInterval = setInterval(analyzeVolume, 50); }
function endCall() { if(tg.HapticFeedback) tg.HapticFeedback.impactOccurred('heavy'); clearInterval(vadInterval); if (currentBotAudio) { currentBotAudio.pause(); currentBotAudio = null; } if (callMediaRecorder && callMediaRecorder.state === 'recording') { callMediaRecorder.stop(); callChunks = []; } if (vadContext) vadContext.suspend(); navigateTo('menu'); }
function toggleSpeaker() { document.getElementById('speakerBtn').classList.toggle('btn-active-state'); if(tg.HapticFeedback) tg.HapticFeedback.selectionChanged(); }
function toggleMicMute(btn) { btn.classList.toggle('btn-active-state'); btn.querySelector('span').innerText = btn.classList.contains('btn-active-state') ? 'mic_off' : 'mic'; if (vadStream) vadStream.getAudioTracks()[0].enabled = !btn.classList.contains('btn-active-state'); if(tg.HapticFeedback) tg.HapticFeedback.selectionChanged(); }

// ============================================
