// 🏆 ACHIEVEMENTS
// ============================================
const ACHIEVEMENTS = [
    { id: 'first_msg', icon: '💬', name: 'Первый шаг', desc: 'Отправил первое сообщение', check: () => messageCount >= 1 },
    { id: 'chatter', icon: '🗣️', name: 'Общительный', desc: '50 сообщений', check: () => messageCount >= 50 },
    { id: 'mood_1', icon: '📝', name: 'Осознанность', desc: 'Первая запись настроения', check: () => Object.keys(JSON.parse(localStorage.getItem('mood_history_v2')||'{}')).length >= 1 },
    { id: 'streak_3', icon: '🔥', name: 'На волне', desc: '3 дня подряд', check: () => getStreak() >= 3 },
    { id: 'streak_7', icon: '⭐', name: 'Неделя заботы', desc: '7 дней подряд', check: () => getStreak() >= 7 },
    { id: 'breath_1', icon: '🌬️', name: 'Глубокий вдох', desc: 'Первая дыхательная сессия', check: () => localStorage.getItem('breath_done') === '1' },
    { id: 'sos_1', icon: '🛟', name: 'Заземление', desc: 'Прошёл технику SOS', check: () => localStorage.getItem('sos_done') === '1' },
    { id: 'mood_30', icon: '🏅', name: 'Марафонец', desc: '30 записей настроения', check: () => Object.keys(JSON.parse(localStorage.getItem('mood_history_v2')||'{}')).length >= 30 },
];

function checkAchievements() {
    const unlocked = JSON.parse(localStorage.getItem('achievements') || '[]');
    ACHIEVEMENTS.forEach(a => {
        if (!unlocked.includes(a.id) && a.check()) {
            unlocked.push(a.id);
            localStorage.setItem('achievements', JSON.stringify(unlocked));
            showAchievementToast(a);
        }
    });
}

function showAchievementToast(a) {
    playSound('achievement');
    const toast = document.getElementById('achievementToast');
    document.getElementById('achievementText').innerText = `${a.icon} ${a.name}`;
    toast.style.display = 'flex';
    toast.style.animation = 'none'; void toast.offsetWidth; toast.style.animation = 'achievement-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
    setTimeout(() => { toast.style.display = 'none'; }, 3500);
    if(tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

function renderAchievements() {
    const grid = document.getElementById('achievementsGrid'); if(!grid) return;
    const unlocked = JSON.parse(localStorage.getItem('achievements') || '[]');
    grid.innerHTML = '';
    ACHIEVEMENTS.forEach(a => {
        const isUnlocked = unlocked.includes(a.id);
        grid.innerHTML += `<div class="achievement-badge ${isUnlocked ? '' : 'locked'}"><div class="badge-icon">${a.icon}</div><div class="badge-name">${a.name}</div></div>`;
    });
}

// ============================================
// 👤 PROFILE
// ============================================
function renderProfile() {
    document.getElementById('profileName').innerText = userName;
    document.getElementById('profileAvatarLetter').innerText = userName.charAt(0).toUpperCase();
    document.getElementById('profileId').innerText = 'ID: ' + userId;
    document.getElementById('statBalance').innerText = localStorage.getItem('user_balance_cache') || '0';
    document.getElementById('statMessages').innerText = messageCount;
    document.getElementById('statStreak').innerText = getStreak();
    document.getElementById('soundIcon').innerText = soundsEnabled ? 'volume_up' : 'volume_off';
    document.getElementById('soundStatus').innerText = soundsEnabled ? 'Вкл' : 'Выкл';
    renderAchievements();
}

// ============================================
