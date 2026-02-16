// ☀️ RITUAL — Утренний / Вечерний ритуал
// ============================================

const MORNING_STEPS = [
    { icon: '🌅', title: 'Доброе утро!', desc: 'Как вы себя чувствуете прямо сейчас?', type: 'mood' },
    { icon: '🙏', title: 'Благодарность', desc: 'За что вы благодарны сегодня?', type: 'text', placeholder: 'Я благодарен(на) за...' },
    { icon: '🎯', title: 'Намерение', desc: 'Одна цель на сегодня — чего хотите достичь?', type: 'text', placeholder: 'Сегодня я хочу...' },
    { icon: '💪', title: 'Аффирмация', desc: 'Скажите себе что-то хорошее', type: 'text', placeholder: 'Я верю, что...' }
];

const EVENING_STEPS = [
    { icon: '🌙', title: 'Добрый вечер!', desc: 'Как прошёл ваш день?', type: 'mood' },
    { icon: '✨', title: 'Лучший момент', desc: 'Что было хорошего сегодня?', type: 'text', placeholder: 'Лучший момент дня...' },
    { icon: '📝', title: 'Урок дня', desc: 'Чему вы научились или что заметили?', type: 'text', placeholder: 'Сегодня я понял(а)...' },
    { icon: '🌿', title: 'Отпустить', desc: 'Что хотите отпустить перед сном?', type: 'text', placeholder: 'Я отпускаю...' }
];

let ritualStep = -1;
let ritualAnswers = [];
let ritualSteps = [];
let ritualMoodSelected = 0;

function initRitual() {
    const hour = new Date().getHours();
    ritualSteps = (hour >= 5 && hour < 17) ? MORNING_STEPS : EVENING_STEPS;
    ritualStep = -1;
    ritualAnswers = [];
    ritualMoodSelected = 0;
    
    const icon = document.getElementById('ritualIcon');
    const title = document.getElementById('ritualTitle');
    const desc = document.getElementById('ritualDesc');
    const btn = document.getElementById('ritualBtn');
    const complete = document.getElementById('ritualComplete');
    const input = document.getElementById('ritualInput');
    const moodGrid = document.getElementById('ritualMoodGrid');
    
    if (icon) { icon.textContent = ritualSteps === MORNING_STEPS ? '🌅' : '🌙'; icon.style.display = ''; icon.style.animation = 'fadeInScale 0.5s forwards'; }
    if (title) { title.textContent = ritualSteps === MORNING_STEPS ? 'Утренний ритуал' : 'Вечерний ритуал'; title.style.display = ''; }
    if (desc) { desc.textContent = 'Несколько минут для себя. Готовы?'; desc.style.display = ''; }
    if (btn) { btn.textContent = 'Начать'; btn.style.display = 'block'; }
    if (complete) complete.style.display = 'none';
    if (input) input.style.display = 'none';
    if (moodGrid) moodGrid.style.display = 'none';
    if (document.getElementById('ritualProgress')) document.getElementById('ritualProgress').style.display = 'flex';
    
    renderRitualProgress();
}

function renderRitualProgress() {
    const container = document.getElementById('ritualProgress');
    if (!container) return;
    container.innerHTML = ritualSteps.map((_, i) => {
        let cls = 'ritual-dot';
        if (i < ritualStep) cls += ' done';
        else if (i === ritualStep) cls += ' current';
        return `<div class="${cls}"></div>`;
    }).join('');
}

function nextRitualStep() {
    const input = document.getElementById('ritualInput');
    const moodGrid = document.getElementById('ritualMoodGrid');
    
    // Save current answer
    if (ritualStep >= 0) {
        const step = ritualSteps[ritualStep];
        if (step.type === 'mood') {
            ritualAnswers.push({ type: 'mood', value: ritualMoodSelected });
        } else {
            ritualAnswers.push({ type: 'text', value: input?.value?.trim() || '' });
        }
    }
    
    ritualStep++;
    
    if (ritualStep >= ritualSteps.length) {
        finishRitual();
        return;
    }
    
    const step = ritualSteps[ritualStep];
    const icon = document.getElementById('ritualIcon');
    const title = document.getElementById('ritualTitle');
    const desc = document.getElementById('ritualDesc');
    const btn = document.getElementById('ritualBtn');
    
    if (icon) { icon.textContent = step.icon; icon.style.animation = 'none'; icon.offsetHeight; icon.style.animation = 'fadeInScale 0.5s forwards'; }
    if (title) title.textContent = step.title;
    if (desc) desc.textContent = step.desc;
    if (btn) btn.textContent = ritualStep === ritualSteps.length - 1 ? 'Завершить' : 'Далее';
    
    if (step.type === 'mood') {
        if (input) input.style.display = 'none';
        if (moodGrid) {
            moodGrid.style.display = 'flex';
            moodGrid.innerHTML = ['😫','😕','😐','😊','🤩'].map((e, i) =>
                `<div class="ritual-mood-item" onclick="selectRitualMood(${i+1})" id="rmood${i+1}">${e}</div>`
            ).join('');
        }
        ritualMoodSelected = 0;
    } else {
        if (moodGrid) moodGrid.style.display = 'none';
        if (input) { input.style.display = 'block'; input.value = ''; input.placeholder = step.placeholder || ''; input.focus(); }
    }
    
    renderRitualProgress();
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

function selectRitualMood(level) {
    ritualMoodSelected = level;
    document.querySelectorAll('.ritual-mood-item').forEach(el => el.classList.remove('selected'));
    const el = document.getElementById('rmood' + level);
    if (el) el.classList.add('selected');
    if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function finishRitual() {
    const complete = document.getElementById('ritualComplete');
    const btn = document.getElementById('ritualBtn');
    const input = document.getElementById('ritualInput');
    const moodGrid = document.getElementById('ritualMoodGrid');
    const icon = document.getElementById('ritualIcon');
    const title = document.getElementById('ritualTitle');
    const desc = document.getElementById('ritualDesc');
    const progress = document.getElementById('ritualProgress');
    
    if (icon) icon.style.display = 'none';
    if (title) title.style.display = 'none';
    if (desc) desc.style.display = 'none';
    if (btn) btn.style.display = 'none';
    if (input) input.style.display = 'none';
    if (moodGrid) moodGrid.style.display = 'none';
    if (progress) progress.style.display = 'none';
    if (complete) { complete.style.display = 'flex'; complete.style.animation = 'fadeInScale 0.5s forwards'; }
    
    // Save ritual data
    const rituals = JSON.parse(localStorage.getItem('rituals') || '[]');
    rituals.unshift({
        date: new Date().toISOString(),
        type: ritualSteps === MORNING_STEPS ? 'morning' : 'evening',
        answers: ritualAnswers
    });
    if (rituals.length > 60) rituals.length = 60;
    localStorage.setItem('rituals', JSON.stringify(rituals));
    
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    playSound('receive');
}
