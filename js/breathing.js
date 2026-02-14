// 🌬️ BREATH LOGIC
// ============================================
const breathCanvas = document.getElementById('breathCanvas'), breathCtx = breathCanvas ? breathCanvas.getContext('2d') : null;
const breathLabel = document.getElementById('breathLabel'), breathInstr = document.getElementById('breathInstruction');
const playIconEl = document.getElementById('playIcon'), playText = document.getElementById('playText');
let breathAnimId, breathParticles = [], isBreathing = false, breathTimer = 0, breathInterval;
let currentR = 110, targetR = 110;
let screenScale = Math.min(window.innerWidth, window.innerHeight);
let minBaseR = screenScale * 0.22, maxBaseR = screenScale * 0.38;

window.addEventListener('resize', () => { if(breathCanvas) { breathCanvas.width = window.innerWidth; breathCanvas.height = window.innerHeight; screenScale = Math.min(window.innerWidth, window.innerHeight); minBaseR = screenScale * 0.22; maxBaseR = screenScale * 0.38; if (!isBreathing) targetR = minBaseR; } });

class Particle { constructor() { this.angle = Math.random() * Math.PI * 2; this.r = Math.min(window.innerWidth, window.innerHeight) * 0.25 + Math.random() * 20; this.size = Math.random() * 6 + 2; this.speed = Math.random() * 0.02 + 0.005; this.color = `rgba(100,181,246,${Math.random()*0.5})`; } update(r) { this.angle += this.speed; let d = r + Math.sin(Date.now()/500) * 10; this.r += (d - this.r) * 0.05; this.x = breathCanvas.width / 2 + Math.cos(this.angle) * this.r; this.y = (breathCanvas.height * 0.42) + Math.sin(this.angle) * this.r; } draw() { breathCtx.fillStyle = this.color; breathCtx.beginPath(); breathCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2); breathCtx.fill(); } }
function resizeBreathCanvas() { if(!breathCanvas)return; breathCanvas.width=window.innerWidth; breathCanvas.height=window.innerHeight; breathParticles=Array.from({length:120},()=>new Particle()); }
function animateBreath() { if(!breathCtx)return; breathCtx.clearRect(0,0,breathCanvas.width,breathCanvas.height); currentR+=(targetR-currentR)*0.02; breathParticles.forEach(p=>{p.update(currentR);p.draw()}); breathAnimId=requestAnimationFrame(animateBreath); }

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

function updateBreathMode(val) { currentPresetIdx = parseInt(val); const p = BREATH_PRESETS[currentPresetIdx]; if(document.getElementById('breathModeName')) document.getElementById('breathModeName').innerText = p.name; if(document.getElementById('breathTotalTime')) document.getElementById('breathTotalTime').innerText = (p.in + p.hold + p.out) + " сек/цикл"; if (isBreathing) { resetBreathingStateOnly(); startBreathingTimer(); } if(tg.HapticFeedback) tg.HapticFeedback.selectionChanged(); }

function toggleBreathing() {
    if (isBreathing) { clearInterval(breathInterval); isBreathing = false; if(playIconEl) playIconEl.innerText = 'play_arrow'; if(playText) playText.innerText = 'Продолжить'; }
    else { isBreathing = true; if(playIconEl) playIconEl.innerText = 'pause'; if(playText) playText.innerText = 'Пауза'; startBreathingTimer(); }
}

function startBreathingTimer() {
    clearInterval(breathInterval);
    const p = BREATH_PRESETS[currentPresetIdx];
    const orb = document.getElementById('breathOrb');
    breathInterval = setInterval(() => {
        breathTimeElapsed += 0.1;
        const totalCycle = p.in + p.hold + p.out;
        const t = breathTimeElapsed % totalCycle;
        let phase = '';
        if (t < p.in) { targetR = maxBaseR; phase = 'in'; if(breathLabel) breathLabel.innerText = "ВДОХ"; if(breathInstr) breathInstr.innerText = "Носом"; if(orb) { orb.className = 'breath-orb inhale'; } }
        else if (t < (p.in + p.hold)) { targetR = maxBaseR + 10; phase = 'hold'; if(breathLabel) breathLabel.innerText = "ПАУЗА"; if(breathInstr) breathInstr.innerText = "Держим"; if(orb) { orb.className = 'breath-orb hold'; } }
        else { targetR = minBaseR; phase = 'out'; if(breathLabel) breathLabel.innerText = "ВЫДОХ"; if(breathInstr) breathInstr.innerText = "Ртом"; if(orb) { orb.className = 'breath-orb exhale'; } }
        if (phase !== lastBreathPhase) { playSound('breathe'); lastBreathPhase = phase; }
    }, 100);
}

function resetBreathingStateOnly() { clearInterval(breathInterval); breathTimeElapsed = 0; targetR = minBaseR; lastBreathPhase = ''; if(breathLabel) breathLabel.innerText = 'ДЫШИМ'; if(breathInstr) breathInstr.innerText = 'Нажми Старт'; }
function resetBreathing() { resetBreathingStateOnly(); isBreathing = false; breathTimeElapsed = 0; if(playIconEl) playIconEl.innerText = 'play_arrow'; if(playText) playText.innerText = 'Старт'; if(breathLabel) breathLabel.innerText = 'ДЫШИМ'; if(breathInstr) breathInstr.innerText = 'Нажми Старт'; }

// ============================================
