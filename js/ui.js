// 🌙 OFFLINE DETECTION
// ============================================
window.addEventListener('online', () => document.getElementById('offlineBanner').classList.remove('show'));
window.addEventListener('offline', () => document.getElementById('offlineBanner').classList.add('show'));

// ============================================
// 💰 PAYWALL & BILLING
// ============================================
function showPaywall(reason) {
    const textEl = document.getElementById('paywall-reason-text');
    if (reason === 'voice') textEl.innerText = "Голосовой режим и Звонки доступны только при положительном балансе.";
    else if (reason === 'report') textEl.innerText = "Для AI-отчёта необходима 1 ⭐. Пополните баланс.";
    else textEl.innerText = "Для продолжения общения необходимо пополнить баланс.";
    document.getElementById('paywall-modal').style.display = 'flex';
    if(tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning');
}
function closePaywall() { document.getElementById('paywall-modal').style.display = 'none'; }

function buySubscription(plan) {
    tg.MainButton.showProgress();
    fetch(GOOGLE_SCRIPT_URL + '?act=api', { method: 'POST', body: JSON.stringify({ action: 'get_invoice', initData: tg.initData, plan: plan }) })
    .then(r => r.json()).then(data => {
        tg.MainButton.hideProgress();
        if (data.status === 'ok' && data.link) {
            tg.openInvoice(data.link, (status) => { if (status === 'paid') { closePaywall(); tg.showAlert("Баланс пополнен! 🎉"); loadChatHistory(); } });
        } else { alert("Ошибка создания счета."); }
    }).catch(e => { tg.MainButton.hideProgress(); alert("Ошибка сети"); });
}

// ============================================
// 🎨 THEME
// ============================================
function initTheme() {
    if (localStorage.getItem('app_theme') === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-icon').classList.add('nav-icon-active');
    }
}
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('theme-icon').classList.toggle('nav-icon-active', isDark);
    localStorage.setItem('app_theme', isDark ? 'dark' : 'light');
    if(tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    if (document.getElementById('music-screen').classList.contains('active')) renderDiary();
}

// ============================================
// 👋 GREETING
// ============================================
const hour = new Date().getHours();
let greeting = (hour < 5) ? 'Доброй ночи' : (hour < 12) ? 'Доброе утро' : (hour < 17) ? 'Добрый день' : 'Добрый вечер';
document.getElementById('greetingText').innerText = greeting;
document.getElementById('userNameDisplay').innerText = userName;

// ============================================
// 🧭 NAVIGATION (Cover Vertical)
// ============================================
const screens = { menu:document.getElementById('menu-screen'), chat:document.getElementById('chat-screen'), video:document.getElementById('video-screen'), music:document.getElementById('music-screen'), game:document.getElementById('game-screen'), sos:document.getElementById('sos-screen'), balloons:document.getElementById('balloon-game-screen'), call:document.getElementById('call-screen'), profile:document.getElementById('profile-screen'), analytics:document.getElementById('analytics-screen'), cbt:document.getElementById('cbt-screen'), ritual:document.getElementById('ritual-screen'), sleep:document.getElementById('sleep-screen'), affirmations:document.getElementById('affirmations-screen') };
const header = document.getElementById('main-header');
const pageTitle = document.getElementById('page-title');
let currentScreen = 'menu';
let isAnimating = false;

function navigateTo(n) {
    if (isAnimating || n === currentScreen) return;
    try {
        if (n === 'call' && !window.isUserPremium) { showPaywall('voice'); return; }
        isAnimating = true;
        stopBalloonGame();
        if (isBreathing) resetBreathing();
        resetSos();
        const targetScreen = screens[n];
        const prevScreen = screens[currentScreen];
        const nav = document.querySelector('.bottom-nav');
        const titles = { chat:'Чат', video:'Медитации', music:'Дневник', game:'Дыхание', sos:'Заземление', profile:'Профиль', analytics:'Аналитика', cbt:'Дневник мыслей', ritual:'Ритуал', sleep:'Сон', affirmations:'Аффирмации' };

        if (n === 'menu') {
            if (header) header.style.display = 'none';
            if (tg && tg.BackButton) tg.BackButton.hide();
            if (nav) nav.style.display = 'flex';
            if (prevScreen && prevScreen !== screens.menu) {
                prevScreen.classList.add('screen-exit');
                prevScreen.addEventListener('animationend', function handler() {
                    prevScreen.removeEventListener('animationend', handler);
                    prevScreen.classList.remove('active', 'screen-overlay', 'screen-exit', 'screen-enter');
                    screens.menu.classList.add('active');
                    currentScreen = 'menu'; isAnimating = false;
                    checkDiaryStatus(); sendUserIdToServer();
                }, { once: true });
                setTimeout(() => { if (isAnimating && currentScreen !== 'menu') { prevScreen.classList.remove('active', 'screen-overlay', 'screen-exit', 'screen-enter'); screens.menu.classList.add('active'); currentScreen = 'menu'; isAnimating = false; checkDiaryStatus(); } }, 500);
            } else { screens.menu.classList.add('active'); currentScreen = 'menu'; isAnimating = false; checkDiaryStatus(); sendUserIdToServer(); }
        } else {
            if (currentScreen !== 'menu' && prevScreen) prevScreen.classList.remove('active', 'screen-overlay', 'screen-exit', 'screen-enter');
            if (targetScreen) {
                targetScreen.classList.remove('screen-exit', 'screen-enter');
                targetScreen.classList.add('active', 'screen-overlay', 'screen-enter');
                targetScreen.addEventListener('animationend', function handler() { targetScreen.removeEventListener('animationend', handler); targetScreen.classList.remove('screen-enter'); isAnimating = false; }, { once: true });
                setTimeout(() => { if (isAnimating) isAnimating = false; }, 600);
            }
            if (n === 'call') { if(nav) nav.style.display = 'none'; if(header) header.style.display = 'none'; initCallUI(); }
            else if (n === 'balloons') { if(nav) nav.style.display = 'flex'; if(header) header.style.display = 'none'; initBalloonGame(); }
            else { if(nav) nav.style.display = 'flex'; if(header) { header.style.display = 'flex'; header.classList.remove('header-animate'); void header.offsetWidth; header.classList.add('header-animate'); } if(tg && tg.BackButton) { tg.BackButton.show(); tg.BackButton.onClick(goBack); } }
            if (pageTitle && titles[n]) pageTitle.innerText = titles[n];
            currentScreen = n;
        }
        if (n === 'chat') setTimeout(scrollToBottom, 300);
        if (n === 'game') { resizeBreathCanvas(); animateBreath(); }
        if (n === 'music') renderDiary();
        if (n === 'sos') startSos();
        if (n === 'profile') renderProfile();
        if (n === 'analytics') initAnalytics();
        if (n === 'ritual') initRitual();
        if (n === 'sleep') initSleep();
        if (n === 'affirmations') initAffirmations();
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    } catch(e) { console.error("Nav Error:", e); isAnimating = false; }
}
function goBack() { if (isAnimating) return; if (currentScreen === 'menu') return; if(screens.game && screens.game.classList.contains('active')) resetBreathing(); navigateTo('menu'); }

// ============================================
