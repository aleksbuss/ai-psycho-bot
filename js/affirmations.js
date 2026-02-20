// 🃏 AFFIRMATION CARDS
// ============================================

const AFFIRMATIONS = [
    { emoji: '🌿', text: 'Я в безопасности. Моё тело расслабляется с каждым вдохом.' },
    { emoji: '💛', text: 'Я заслуживаю спокойствия и заботы о себе.' },
    { emoji: '🌊', text: 'Тревога — это волна. Она приходит и уходит. Я остаюсь.' },
    { emoji: '☀️', text: 'Сегодня я выбираю мягкость к себе.' },
    { emoji: '🦋', text: 'Я меняюсь. Каждый маленький шаг — это прогресс.' },
    { emoji: '🏔️', text: 'Я сильнее, чем мои страхи. Я уже доказывал(а) это.' },
    { emoji: '🌸', text: 'Я разрешаю себе чувствовать. Все мои эмоции важны.' },
    { emoji: '✨', text: 'Этот момент пройдёт. Я справлялся(ась) раньше — справлюсь и сейчас.' },
    { emoji: '🌙', text: 'Я отпускаю контроль. Мне не нужно всё предвидеть.' },
    { emoji: '🫂', text: 'Просить о помощи — это проявление силы, а не слабости.' },
    { emoji: '🍃', text: 'Я не моя тревога. Она — часть опыта, но не весь я.' },
    { emoji: '💎', text: 'Я выбираю верить, что всё сложится хорошо.' },
    { emoji: '🕊️', text: 'Мне не нужно быть идеальным(ой). Я достаточен(чна) такой, какой есть.' },
    { emoji: '🌈', text: 'После каждой бури выходит солнце. Мой свет — впереди.' },
    { emoji: '🫀', text: 'Моё сердце бьётся. Я живу. Это уже достижение.' },
    { emoji: '🧘', text: 'Прямо сейчас я в безопасности. Это всё, что важно.' },
    { emoji: '🌻', text: 'Я расту в своём темпе. Сравнение — враг покоя.' },
    { emoji: '💫', text: 'Каждый день — новая возможность почувствовать себя лучше.' },
    { emoji: '🤍', text: 'Я заслуживаю такой же доброты, какую дарю другим.' },
    { emoji: '🔥', text: 'Тревога пытается меня защитить. Но сейчас я в безопасности.' }
];

const CARD_CLASSES = ['aff-card-1','aff-card-2','aff-card-3','aff-card-4','aff-card-5','aff-card-6'];
let currentAffIdx = 0;
let savedAffirmations = JSON.parse(localStorage.getItem('saved_affirmations') || '[]');

function initAffirmations() {
    // Rotate daily — pick starting index based on day of year
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    currentAffIdx = dayOfYear % AFFIRMATIONS.length;
    
    renderAffirmationCards();
    updateAffCounter();
    
    // Preview on menu
    const preview = document.getElementById('menuAffirmationPreview');
    if (preview) {
        const aff = AFFIRMATIONS[currentAffIdx];
        preview.textContent = aff.text.substring(0, 40) + '...';
    }
}

function renderAffirmationCards() {
    const stack = document.getElementById('affCardStack');
    if (!stack) return;
    
    const aff = AFFIRMATIONS[currentAffIdx];
    const nextIdx = (currentAffIdx + 1) % AFFIRMATIONS.length;
    const nextAff = AFFIRMATIONS[nextIdx];
    
    const cls1 = CARD_CLASSES[currentAffIdx % CARD_CLASSES.length];
    const cls2 = CARD_CLASSES[nextIdx % CARD_CLASSES.length];
    
    stack.innerHTML = `
        <div class="affirmation-card next ${cls2}">
            <div class="affirmation-emoji">${nextAff.emoji}</div>
            <div class="affirmation-text">${nextAff.text}</div>
        </div>
        <div class="affirmation-card active ${cls1}" id="activeAffCard">
            <div class="affirmation-emoji">${aff.emoji}</div>
            <div class="affirmation-text">${aff.text}</div>
            <div class="affirmation-hint">← листайте →</div>
        </div>
    `;
    
    // Swipe support
    let startX = 0;
    const card = document.getElementById('activeAffCard');
    if (card) {
        card.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
        card.addEventListener('touchend', e => {
            const diff = e.changedTouches[0].clientX - startX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) prevAffirmation();
                else nextAffirmation();
            }
        });
    }
}

function nextAffirmation() {
    const card = document.getElementById('activeAffCard');
    if (card) {
        card.style.transform = 'translateX(-120%) rotate(-10deg)';
        card.style.opacity = '0';
    }
    setTimeout(() => {
        currentAffIdx = (currentAffIdx + 1) % AFFIRMATIONS.length;
        renderAffirmationCards();
        updateAffCounter();
    }, 300);
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

function prevAffirmation() {
    const card = document.getElementById('activeAffCard');
    if (card) {
        card.style.transform = 'translateX(120%) rotate(10deg)';
        card.style.opacity = '0';
    }
    setTimeout(() => {
        currentAffIdx = (currentAffIdx - 1 + AFFIRMATIONS.length) % AFFIRMATIONS.length;
        renderAffirmationCards();
        updateAffCounter();
    }, 300);
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

function saveAffirmation() {
    const aff = AFFIRMATIONS[currentAffIdx];
    const idx = savedAffirmations.indexOf(currentAffIdx);
    if (idx >= 0) {
        savedAffirmations.splice(idx, 1);
    } else {
        savedAffirmations.push(currentAffIdx);
    }
    localStorage.setItem('saved_affirmations', JSON.stringify(savedAffirmations));
    
    const btn = document.querySelector('.aff-save-btn .material-icons-round');
    if (btn) btn.style.color = savedAffirmations.includes(currentAffIdx) ? '#FF6B6B' : 'var(--text-muted)';
    
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

function updateAffCounter() {
    const el = document.getElementById('affCounter');
    if (el) el.textContent = (currentAffIdx + 1) + ' / ' + AFFIRMATIONS.length;
    
    const btn = document.querySelector('.aff-save-btn .material-icons-round');
    if (btn) btn.style.color = savedAffirmations.includes(currentAffIdx) ? '#FF6B6B' : 'var(--text-muted)';
}
