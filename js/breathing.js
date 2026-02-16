// 🌬️ BREATH LOGIC
// ============================================
const breathLabel = document.getElementById('breathLabel'), breathInstr = document.getElementById('breathInstruction');
const playIconEl = document.getElementById('playIcon'), playText = document.getElementById('playText');
let isBreathing = false, breathInterval;

const BREATH_PRESETS = [
    { name: "Сон (4-7-8)", in: 4, hold: 7, out: 8 },
    { name: "Квадрат (4-4-4)", in: 4, hold: 4, out: 4 },
    { name: "Когерентность", in: 5, hold: 0, out: 5 },
    { name: "Равновесие", in: 4, hold: 0, out: 4 },
    { name: "Легкость", in: 3, hold: 0, out: 3 },
    { name: "Тонус", in: 2.5, hold: 0, out: 2.5 },
    { name: "Энергия", in: 2, hold: 0, out: 2 },
    { name: "Вим Хоф", in: 1.5, hold: 0, out: 1.5 }
];
let currentPresetIdx = 0, breathTimeElapsed = 0, lastBreathPhase = '';

function updateBreathMode(val) {
    currentPresetIdx = parseInt(val);
    const p = BREATH_PRESETS[currentPresetIdx];
    if(document.getElementById('breathModeName')) document.getElementById('breathModeName').innerText = p.name;
    if(document.getElementById('breathTotalTime')) document.getElementById('breathTotalTime').innerText = (p.in + p.hold + p.out) + " сек/цикл";
    if (isBreathing) { resetBreathingStateOnly(); startBreathingTimer(); }
    if(tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function toggleBreathing() {
    if (isBreathing) {
        clearInterval(breathInterval); isBreathing = false;
        if(playIconEl) playIconEl.innerText = 'play_arrow';
        if(playText) playText.innerText = 'Продолжить';
    } else {
        isBreathing = true;
        if(playIconEl) playIconEl.innerText = 'pause';
        if(playText) playText.innerText = 'Пауза';
        startBreathingTimer();
    }
}

function startBreathingTimer() {
    clearInterval(breathInterval);
    const p = BREATH_PRESETS[currentPresetIdx];
    const sphere = document.getElementById('breathSphere');
    breathInterval = setInterval(() => {
        breathTimeElapsed += 0.1;
        const totalCycle = p.in + p.hold + p.out;
        const t = breathTimeElapsed % totalCycle;
        let phase = '';
        if (t < p.in) {
            phase = 'in';
            if(breathLabel) breathLabel.innerText = "ВДОХ";
            if(breathInstr) breathInstr.innerText = "Носом";
            if(sphere) sphere.className = 'breath-sphere inhale';
        } else if (t < (p.in + p.hold)) {
            phase = 'hold';
            if(breathLabel) breathLabel.innerText = "ПАУЗА";
            if(breathInstr) breathInstr.innerText = "Держим";
            if(sphere) sphere.className = 'breath-sphere hold';
        } else {
            phase = 'out';
            if(breathLabel) breathLabel.innerText = "ВЫДОХ";
            if(breathInstr) breathInstr.innerText = "Ртом";
            if(sphere) sphere.className = 'breath-sphere exhale';
        }
        if (phase !== lastBreathPhase) { playSound('breathe'); lastBreathPhase = phase; }
    }, 100);
}

function resetBreathingStateOnly() {
    clearInterval(breathInterval); breathTimeElapsed = 0; lastBreathPhase = '';
    if(breathLabel) breathLabel.innerText = 'ДЫШИМ';
    if(breathInstr) breathInstr.innerText = 'Нажми Старт';
    const sphere = document.getElementById('breathSphere');
    if(sphere) sphere.className = 'breath-sphere';
}

function resetBreathing() {
    resetBreathingStateOnly(); isBreathing = false; breathTimeElapsed = 0;
    if(playIconEl) playIconEl.innerText = 'play_arrow';
    if(playText) playText.innerText = 'Старт';
}

// Dummy functions for compatibility (canvas removed)
function resizeBreathCanvas() {}
function animateBreath() {}

// ============================================
