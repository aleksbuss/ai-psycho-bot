// 🔊 SOUND EFFECTS (Web Audio API)
// ============================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function getAudioCtx() { if (!audioCtx) audioCtx = new AudioCtx(); return audioCtx; }

function playSound(type) {
    if (!soundsEnabled) return;
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        
        if (type === 'send') { osc.frequency.value = 600; gain.gain.value = 0.08; osc.type = 'sine'; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); osc.start(); osc.stop(ctx.currentTime + 0.15); }
        else if (type === 'receive') { osc.frequency.value = 800; gain.gain.value = 0.06; osc.type = 'sine'; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25); osc.start(); osc.stop(ctx.currentTime + 0.25); }
        else if (type === 'breathe') { osc.frequency.value = 440; gain.gain.value = 0.04; osc.type = 'triangle'; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); osc.start(); osc.stop(ctx.currentTime + 0.5); }
        else if (type === 'achievement') { osc.frequency.value = 523; gain.gain.value = 0.1; osc.type = 'sine'; setTimeout(() => { try { const o2 = ctx.createOscillator(); const g2 = ctx.createGain(); o2.connect(g2); g2.connect(ctx.destination); o2.frequency.value = 659; g2.gain.value = 0.1; g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); o2.start(); o2.stop(ctx.currentTime + 0.3); } catch(e){} }, 150); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2); osc.start(); osc.stop(ctx.currentTime + 0.2); }
        else if (type === 'pop') { osc.frequency.value = 300; gain.gain.value = 0.1; osc.type = 'sine'; osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); osc.start(); osc.stop(ctx.currentTime + 0.1); }
    } catch(e) {}
}

function toggleSounds() {
    soundsEnabled = !soundsEnabled;
    localStorage.setItem('sounds_enabled', soundsEnabled);
    document.getElementById('soundIcon').innerText = soundsEnabled ? 'volume_up' : 'volume_off';
    document.getElementById('soundStatus').innerText = soundsEnabled ? 'Вкл' : 'Выкл';
    if (soundsEnabled) playSound('receive');
}

// ============================================
