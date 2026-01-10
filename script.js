// ============================================
// ⚙️ CONFIGURATION
// ============================================

// 🔴 ВАЖНО: Вставьте сюда URL вашего Web App из Google Apps Script
// Пример: "https://script.google.com/macros/s/AKfy.../exec"
const GOOGLE_SCRIPT_URL = "ВСТАВЬТЕ_СЮДА_ВАШ_URL_НОВОГО_РАЗВЕРТЫВАНИЯ";

// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp; 
tg.expand();

// Данные пользователя
const userId = tg.initDataUnsafe?.user?.id || 'test_' + Math.floor(Math.random()*1000);
const userName = tg.initDataUnsafe?.user?.first_name || 'Друг';

// Глобальные флаги
window.isUserPremium = false;

// ============================================
// 🛡️ ERROR HANDLING
// ============================================
window.onerror = function(msg, url, line) {
   const consoleEl = document.getElementById('error-console');
   if (consoleEl) {
       consoleEl.style.display = 'block';
       consoleEl.innerHTML += `Error: ${msg} (Line ${line})<br>`;
   }
   return false;
};

// ============================================
// 💎 BILLING & PAYWALL
// ============================================

function showPaywall(reason) {
    const textEl = document.getElementById('paywall-reason-text');
    if (reason === 'voice') {
        textEl.innerText = "Голосовой режим и Звонки доступны только при положительном балансе.";
    } else {
        textEl.innerText = "Бесплатный лимит (3 сообщения) исчерпан. Пополните баланс.";
    }
    document.getElementById('paywall-modal').style.display = 'flex';
    if(tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning');
}

function closePaywall() { 
    document.getElementById('paywall-modal').style.display = 'none'; 
}

function buySubscription(plan) {
    tg.MainButton.showProgress();
    
    // Используем initData для безопасной генерации ссылки
    fetch(GOOGLE_SCRIPT_URL + '?act=api', {
        method: 'POST',
        body: JSON.stringify({ 
            action: 'get_invoice', 
            initData: tg.initData, // <--- БЕЗОПАСНАЯ АВТОРИЗАЦИЯ
            plan: plan 
        })
    })
    .then(r => r.json())
    .then(data => {
        tg.MainButton.hideProgress();
        if (data.status === 'ok' && data.link) {
            tg.openInvoice(data.link, (status) => {
                if (status === 'paid') {
                    closePaywall();
                    tg.showAlert("Баланс пополнен! 🎉");
                    loadChatHistory(); // Обновляем статус и баланс
                }
            });
        } else { 
            alert("Ошибка создания счета."); 
        }
    })
    .catch(e => { 
        tg.MainButton.hideProgress(); 
        alert("Ошибка сети"); 
    });
}

// ============================================
// 🎨 THEME MANAGER
// ============================================

function initTheme() {
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'dark') {
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
    
    // Если открыт экран дневника, перерисовываем график (цвета меняются)
    if (document.getElementById('music-screen').classList.contains('active')) {
        renderDiary();
    }
}

// ============================================
// 🧭 NAVIGATION
// ============================================

// Установка приветствия
const hour = new Date().getHours();
let greeting = (hour >= 0 && hour < 5) ? 'Доброй ночи' : 
               (hour >= 5 && hour < 12) ? 'Доброе утро' : 
               (hour >= 12 && hour < 17) ? 'Добрый день' : 'Добрый вечер';

const greetingEl = document.getElementById('greetingText');
if(greetingEl) greetingEl.innerText = greeting;

const userNameEl = document.getElementById('userNameDisplay');
if(userNameEl) userNameEl.innerText = userName;

// Экраны
const screens = {
    menu: document.getElementById('menu-screen'),
    chat: document.getElementById('chat-screen'),
    video: document.getElementById('video-screen'),
    music: document.getElementById('music-screen'),
    game: document.getElementById('game-screen'),
    sos: document.getElementById('sos-screen'),
    balloons: document.getElementById('balloon-game-screen'),
    call: document.getElementById('call-screen')
};

const header = document.getElementById('main-header');
const pageTitle = document.getElementById('page-title');

function navigateTo(n) {
    try {
        // Проверка прав для звонка
        if (n === 'call' && !window.isUserPremium) { 
            showPaywall('voice'); 
            return; 
        }

        // Скрываем все экраны
        Object.values(screens).forEach(e => { if(e) e.classList.remove('active'); });
        
        // Останавливаем активности
        stopBalloonGame();
        stopBreathingAnimationLoop();
        resetSos();

        // Показываем нужный экран
        if(screens[n]) screens[n].classList.add('active');

        // Управление навбаром
        const nav = document.querySelector('.bottom-nav');
        if (n === 'call') {
            if(nav) nav.style.display = 'none';
            initCallUI();
        } else {
            if(nav) nav.style.display = 'flex';
        }

        // Логика Header и BackButton
        if (n === 'menu') {
            if(header) header.style.display = 'none';
            if(tg.BackButton) tg.BackButton.hide();
            checkDiaryStatus();
            sendUserIdToServer(); 
        } else if (n === 'balloons') {
            if(header) header.style.display = 'none';
            initBalloonGame();
        } else if (n !== 'call') {
            if(header) header.style.display = 'flex';
            if(tg.BackButton) {
                tg.BackButton.show();
                tg.BackButton.onClick(goBack);
            }
        }

        // Заголовки
        const titles = {chat:'Чат', video:'Медитации', music:'Дневник', game:'Дыхание', sos:'Заземление'};
        if (pageTitle && titles[n]) pageTitle.innerText = titles[n];

        // Инициализация экранов
        if (n === 'chat') setTimeout(scrollToBottom, 200);
        if (n === 'game') {
            resizeBreathCanvas();
            startBreathingAnimationLoop();
        }
        if (n === 'music') renderDiary();
        if (n === 'sos') startSos();

    } catch(e) {
        console.error("Navigation Error:", e);
    }
}    

function goBack() {
    if(screens.game && screens.game.classList.contains('active')) resetBreathing();
    navigateTo('menu');
}

// ============================================
// 💬 CHAT LOGIC
// ============================================

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const typingIndicator = document.getElementById('typing');

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

function scrollToBottom() {
    if(chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addMessage(text, isUser) {
    const div = document.createElement('div');
    div.className = `message ${isUser ? 'msg-user' : 'msg-bot'} msg-enter`;
    div.innerHTML = text;
    if(chatContainer) chatContainer.insertBefore(div, typingIndicator);
    scrollToBottom();
}

function showTyping(show) {
    if(typingIndicator) typingIndicator.style.display = show ? 'block' : 'none';
    scrollToBottom();
}

// ОТПРАВКА ТЕКСТА
function sendMessage() {
    const text = userInput.value.trim();
    if(!text) return;
    
    addMessage(text, true);
    userInput.value = '';
    sendBtn.disabled = true;
    showTyping(true);

    // ВАЖНО: Отправляем initData для проверки на сервере
    fetch(GOOGLE_SCRIPT_URL + '?act=api', {
        method: 'POST',
        body: JSON.stringify({
            text: text,
            initData: tg.initData // <--- Безопасная отправка
        })
    })
    .then(r => r.json())
    .then(handleResponse)
    .catch(handleError);
}

// ЗАПИСЬ ГОЛОСА
async function toggleRecording() {
    if(!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio:true});
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const blob = new Blob(audioChunks, {type:'audio/webm'});
                const base64 = await blobToBase64(blob);
                sendVoiceRequest(base64);
            };
            mediaRecorder.start();
            isRecording = true;
            micBtn.classList.add('recording');
            if(tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
        } catch(e) {
            alert("Нет доступа к микрофону");
        }
    } else {
        if(mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(t => t.stop());
        }
        isRecording = false;
        micBtn.classList.remove('recording');
        if(tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    }
}

function sendVoiceRequest(base64Audio) {
    addMessage("🎤 <i>Аудио...</i>", true);
    showTyping(true);
    sendBtn.disabled = true;
    micBtn.disabled = true;

    fetch(GOOGLE_SCRIPT_URL + '?act=api', {
        method: 'POST',
        body: JSON.stringify({
            audio: base64Audio,
            initData: tg.initData, // <--- Безопасная отправка
            text: ''
        })
    })
    .then(r => r.json())
    .then(handleResponse)
    .catch(handleError);
}

function handleResponse(data) {
    showTyping(false); 
    sendBtn.disabled = false; 
    micBtn.disabled = false;
    
    if (data.status === 'success') {
        addMessage(data.text, false);
        if (typeof data.isPremium !== 'undefined') window.isUserPremium = data.isPremium;
        if (data.audio) playAudioResponse(data.audio);
    } else if (data.status === 'error') {
        if (data.error_code === 'limit_reached') showPaywall('limit');
        else if (data.error_code === 'voice_blocked') showPaywall('voice');
        else addMessage("⚠️ " + data.text, false);
    } else { 
        addMessage("⚠️ " + data.text, false); 
    }
}

function handleError() {
    showTyping(false);
    sendBtn.disabled = false;
    micBtn.disabled = false;
    addMessage("⚠️ Ошибка сети", false);
}

function loadChatHistory() {
    // Безопасная загрузка истории
    if(!tg.initData) return; 

    fetch(GOOGLE_SCRIPT_URL + '?act=api', {
        method: 'POST',
        body: JSON.stringify({
            initData: tg.initData, // <--- Безопасная отправка
            action: 'load_history'
        })
    })
    .then(r => r.json())
    .then(data => {
        if(data.status === 'success') {
            if (data.balance > 0) window.isUserPremium = true;
            if (data.history && Array.isArray(data.history)) {
                data.history.forEach(m => {
                   if(m.role !== 'system' && m.parts && m.parts[0]) {
                       addMessage(m.parts[0].text, m.role === 'user');
                   }
                });
            }
        }
    });
}

function playAudioResponse(base64) {
    if(!base64) return;
    try {
        const audio = new Audio("data:audio/mp3;base64," + base64);
        // Визуализация говорения (иконка звука)
        const messages = document.querySelectorAll('.msg-bot');
        const lastMsg = messages[messages.length-1];
        let icon = null;
        if(lastMsg) {
            icon = document.createElement('span');
            icon.className = 'material-icons-round';
            icon.innerText = 'volume_up';
            icon.style.cssText = "margin-left:8px;vertical-align:middle;color:var(--primary-main);font-size:20px;";
            icon.animate([{opacity:0.5},{opacity:1},{opacity:0.5}], {duration:1000, iterations:Infinity});
            lastMsg.appendChild(icon);
        }
        audio.play().catch(e => {});
        audio.onended = () => { if(icon) icon.remove(); };
    } catch(e) {}
}

function blobToBase64(blob) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

// Listeners
if(sendBtn) sendBtn.addEventListener('click', sendMessage);
if(micBtn) micBtn.addEventListener('click', toggleRecording);
if(userInput) userInput.addEventListener('keydown', e => { if(e.key==='Enter') sendMessage(); });

// ============================================
// 🆘 SOS LOGIC
// ============================================
const sosSteps = [
    {n:5, t:'ВЕЩЕЙ', d:'Найди 5 предметов одного цвета'},
    {n:4, t:'ОЩУЩЕНИЯ', d:'Почувствуй 4 касания'},
    {n:3, t:'ЗВУКА', d:'Услышь 3 звука вокруг'},
    {n:2, t:'ЗАПАХА', d:'Почувствуй 2 аромата'},
    {n:1, t:'ВКУС', d:'Ощути 1 вкус'}
]; 
let sosIdx = 0;

function resetSos() { 
    sosIdx = 0; 
    const content = document.getElementById('sos-content-area');
    const desc = document.getElementById('sos-desc-area');
    const btn = document.getElementById('sos-main-btn');
    if(content) content.innerHTML = ''; 
    if(desc) desc.innerHTML = ''; 
    if(btn){ 
        btn.querySelector('span').innerText = 'Я НАШЕЛ'; 
        btn.onclick = nextSos; 
    } 
}

function startSos() { renderSosStep(); }

function renderSosStep() { 
    const s = sosSteps[sosIdx]; 
    const content = document.getElementById('sos-content-area'); 
    if(!content) return; 
    content.innerHTML = ''; 
    
    const numDiv = document.createElement('div'); 
    numDiv.className = 'sos-big-number'; 
    numDiv.innerText = s.n; 
    numDiv.style.animation = 'pop-up-letter 0.5s ease forwards'; 
    content.appendChild(numDiv); 
    
    const textLine = document.createElement('div'); 
    textLine.className = 'sos-text-line'; 
    s.t.split('').forEach((char, index) => { 
        const span = document.createElement('span'); 
        span.className = 'sos-letter'; 
        span.innerText = char; 
        span.style.animation = `pop-up-letter 0.4s ease forwards`; 
        span.style.animationDelay = `${0.2 + (index * 0.05)}s`; 
        textLine.appendChild(span); 
    }); 
    content.appendChild(textLine); 
    
    const desc = document.getElementById('sos-desc-area'); 
    desc.className = 'sos-desc'; 
    desc.innerText = s.d; 
    desc.style.animation = 'none'; 
    desc.offsetHeight; 
    desc.style.animation = 'fadeIn 0.5s ease forwards 0.5s'; 
    
    const btn = document.getElementById('sos-main-btn'); 
    btn.classList.remove('sos-btn-enter'); 
    void btn.offsetWidth; 
    btn.classList.add('sos-btn-enter'); 
}

function nextSos() { 
    if(tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium'); 
    if (sosIdx < sosSteps.length - 1) { 
        sosIdx++; 
        renderSosStep(); 
    } else { 
        document.getElementById('sos-content-area').innerHTML = `<span class="material-icons-round" style="font-size:100px; color:var(--primary-main); animation:pop-up-letter 0.6s forwards;">check_circle</span><div class="sos-text-line" style="margin-top:20px; color:var(--text-header)">ТЫ МОЛОДЕЦ</div>`; 
        document.getElementById('sos-desc-area').innerText = 'Ты справился. Дыши спокойно.'; 
        const btn = document.getElementById('sos-main-btn'); 
        btn.querySelector('span').innerText = 'В МЕНЮ'; 
        btn.onclick = goBack; 
        btn.classList.remove('sos-btn-enter'); 
        void btn.offsetWidth; 
        btn.classList.add('sos-btn-enter'); 
        if(tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success'); 
    } 
}

function sendUserIdToServer() { 
    if (userId.toString().startsWith('test_')) return; 
    fetch(GOOGLE_SCRIPT_URL + '?act=api', { 
        method: 'POST', 
        body: JSON.stringify({ action: 'user_joined', initData: tg.initData }) 
    }); 
}

// ============================================
// 🌬️ BREATHING GAME
// ============================================

const breathCanvas = document.getElementById('breathCanvas');
const breathCtx = breathCanvas ? breathCanvas.getContext('2d') : null;
const breathLabel = document.getElementById('breathLabel');
const breathInstr = document.getElementById('breathInstruction');
const playIcon = document.getElementById('playIcon');
const playText = document.getElementById('playText');

let breathAnimId, breathParticles = [], isBreathing = false, breathTimer = 0, breathInterval;
let currentR = 110, targetR = 110;

class Particle {
    constructor(){
        this.angle = Math.random() * Math.PI * 2;
        this.r = 110 + Math.random() * 20;
        this.size = Math.random() * 6 + 2; 
        this.speed = Math.random() * 0.02 + 0.005;
        this.color = `rgba(100,181,246,${Math.random() * 0.5})`;
    }
    update(r){
        this.angle += this.speed;
        let d = r + Math.sin(Date.now() / 500) * 10;
        this.r += (d - this.r) * 0.05;
        this.x = breathCanvas.width / 2 + Math.cos(this.angle) * this.r;
        this.y = (breathCanvas.height * 0.35) + Math.sin(this.angle) * this.r;
    }
    draw(){
        if(!breathCtx) return;
        breathCtx.fillStyle = this.color;
        breathCtx.beginPath();
        breathCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        breathCtx.fill();
    }
}

function resizeBreathCanvas() {
    if(!breathCanvas) return; 
    breathCanvas.width = window.innerWidth;
    breathCanvas.height = window.innerHeight;
    breathParticles = Array.from({length:150}, () => new Particle());
}

function startBreathingAnimationLoop() {
    if(!breathAnimId && breathCanvas) animateBreath();
}

function stopBreathingAnimationLoop() {
    if(breathAnimId) cancelAnimationFrame(breathAnimId);
    breathAnimId = null;
}

function animateBreath() {
    if(!breathCtx) return; 
    breathCtx.clearRect(0, 0, breathCanvas.width, breathCanvas.height);
    currentR += (targetR - currentR) * 0.02;
    breathParticles.forEach(p => { p.update(currentR); p.draw(); });
    breathAnimId = requestAnimationFrame(animateBreath);
}

function toggleBreathing() {
    if(isBreathing) {
        clearInterval(breathInterval);
        isBreathing = false;
        if(playIcon) playIcon.innerText = 'play_arrow';
        if(playText) playText.innerText = 'Продолжить';
    } else {
        isBreathing = true;
        if(playIcon) playIcon.innerText = 'pause';
        if(playText) playText.innerText = 'Пауза';
        breathInterval = setInterval(() => {
            breathTimer++;
            const t = breathTimer % 19;
            if(t < 4) { targetR = 180; breathLabel.innerText = "ВДОХ"; breathInstr.innerText = "Носом"; }
            else if(t < 11) { targetR = 190; breathLabel.innerText = "ПАУЗА"; breathInstr.innerText = "Держим"; }
            else { targetR = 110; breathLabel.innerText = "ВЫДОХ"; breathInstr.innerText = "Ртом"; }
        }, 1000);
    }
}

function resetBreathing() {
    clearInterval(breathInterval);
    isBreathing = false;
    breathTimer = 0;
    targetR = 110;
    if(playIcon) playIcon.innerText = 'play_arrow';
    if(playText) playText.innerText = 'Старт';
    if(breathLabel) breathLabel.innerText = 'ДЫШИМ';
    if(breathInstr) breathInstr.innerText = 'Нажми Старт';
}

// ============================================
// 📔 DIARY LOGIC
// ============================================

function checkDiaryStatus() { 
    const h = JSON.parse(localStorage.getItem('mood_history_v2') || '{}'); 
    const today = new Date().toISOString().split('T')[0]; 
    const icon = document.getElementById('diary-icon'); 
    if(icon){ 
        if (!h[today]) { 
            icon.classList.add('heart-alert'); icon.innerText = 'favorite'; 
        } else { 
            icon.classList.remove('heart-alert'); icon.innerText = 'favorite_border'; 
        } 
    } 
}

function saveMood(level) { 
    const h = JSON.parse(localStorage.getItem('mood_history_v2') || '{}'); 
    const date = new Date().toISOString().split('T')[0]; 
    h[date] = level; 
    localStorage.setItem('mood_history_v2', JSON.stringify(h)); 
    if(tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success'); 
    renderDiary(); 
    checkDiaryStatus(); 
}

function renderDiary() {
    const h = JSON.parse(localStorage.getItem('mood_history_v2') || '{}'); 
    const dates = Object.keys(h).sort(); 
    const c = document.getElementById('history-container'); 
    if(c) c.innerHTML = '';
    
    const moodMap = { 
        5: {text: 'Отлично', color: '#4DB6AC', bg: '#E0F2F1', shadow: '#398E86'}, 
        4: {text: 'Хорошо', color: '#80CBC4', bg: '#E0F2F1', shadow: '#63A39D'}, 
        3: {text: 'Нормально', color: '#64B5F6', bg: '#E3F2FD', shadow: '#4295D1'}, 
        2: {text: 'Так себе', color: '#FFE082', bg: '#FFF8E1', shadow: '#D3B765'}, 
        1: {text: 'Плохо', color: '#FFB74D', bg: '#FFF3E0', shadow: '#D6963B'} 
    };

    [...dates].reverse().forEach(date => { 
        const val = h[date]; 
        const m = moodMap[val]; 
        if(c) c.innerHTML += `<div class="history-item"><span style="font-weight:600;color:var(--text-header)">${new Date(date).toLocaleDateString()}</span><span style="padding:4px 10px;border-radius:8px;font-size:13px;font-weight:600;background:${m.bg};color:${m.color};">${m.text}</span></div>`; 
    });

    const recentDates = dates.slice(-30);
    const pieChart = document.getElementById('pieChart');
    const legend = document.getElementById('chart-legend');
    const emptyMsg = document.getElementById('empty-chart-msg');

    if (pieChart && recentDates.length > 0) {
        const counts = {5:0, 4:0, 3:0, 2:0, 1:0}; 
        recentDates.forEach(d => counts[h[d]]++); 
        if(legend) legend.innerHTML = ''; 
        const slices = [];
        
        [5,4,3,2,1].forEach(lvl => { 
            if(counts[lvl] > 0) { 
                const pct = Math.round((counts[lvl] / recentDates.length) * 100); 
                slices.push({ value: counts[lvl], color: moodMap[lvl].color, shadow: moodMap[lvl].shadow }); 
                if(legend) legend.innerHTML += `<div class="legend-item"><div style="display:flex;align-items:center;"><span class="legend-marker" style="background:${moodMap[lvl].color}"></span><span>${moodMap[lvl].text}</span></div><span>${pct}%</span></div>`; 
            } 
        });
        draw3DPieChart(slices); 
        if(emptyMsg) emptyMsg.style.display = 'none';
    } else if(pieChart) { 
        const ctx = pieChart.getContext('2d'); 
        ctx.clearRect(0,0,300,150); 
        if(emptyMsg) emptyMsg.style.display = 'block'; 
    }
}

function draw3DPieChart(slices) {
    const canvas = document.getElementById('pieChart'); 
    if(!canvas) return; 
    const ctx = canvas.getContext('2d'); 
    const dpr = window.devicePixelRatio || 1; 
    const rect = canvas.getBoundingClientRect(); 
    canvas.width = rect.width * dpr; 
    canvas.height = rect.height * dpr; 
    ctx.scale(dpr, dpr);
    
    const cx = rect.width / 2; 
    const cy = rect.height / 2; 
    const rx = 120; 
    const ry = 75; 
    const depth = 35; 
    
    ctx.clearRect(0, 0, rect.width, rect.height); 
    const total = slices.reduce((acc, s) => acc + s.value, 0); 
    let startAngle = -Math.PI / 2; 
    let currentAngle = startAngle;
    
    // Draw 3D sides
    slices.forEach(slice => { 
        const sliceAngle = (slice.value / total) * 2 * Math.PI; 
        const endAngle = currentAngle + sliceAngle; 
        ctx.beginPath(); 
        ctx.ellipse(cx, cy, rx, ry, 0, currentAngle, endAngle); 
        ctx.lineTo(cx + rx * Math.cos(endAngle), cy + ry * Math.sin(endAngle) + depth); 
        ctx.ellipse(cx, cy + depth, rx, ry, 0, endAngle, currentAngle, true); 
        ctx.lineTo(cx + rx * Math.cos(currentAngle), cy + ry * Math.sin(currentAngle)); 
        ctx.fillStyle = slice.shadow; 
        ctx.fill(); 
        currentAngle += sliceAngle; 
    });
    
    // Draw tops
    currentAngle = startAngle; 
    slices.forEach(slice => { 
        const sliceAngle = (slice.value / total) * 2 * Math.PI; 
        const endAngle = currentAngle + sliceAngle; 
        ctx.beginPath(); 
        ctx.moveTo(cx, cy); 
        ctx.ellipse(cx, cy, rx, ry, 0, currentAngle, endAngle); 
        ctx.closePath(); 
        ctx.fillStyle = slice.color; 
        ctx.fill(); 
        ctx.lineWidth = 1; 
        ctx.strokeStyle = document.body.classList.contains('dark-mode') ? '#1E1E1E' : '#FFFFFF'; 
        ctx.stroke(); 
        currentAngle += sliceAngle; 
    });
}

// ============================================
// 🎈 BALLOON GAME
// ============================================

const ballCanvas = document.getElementById('balloon-game-canvas'); 
const bCtx = ballCanvas ? ballCanvas.getContext('2d') : null; 
const dpr2 = Math.min(window.devicePixelRatio || 1, 1.5); 

// Pre-render balloons for performance
const cachedTarget = document.createElement('canvas'); 
const cachedDummy = document.createElement('canvas'); 
const balloonSize = 80; 
cachedTarget.width = balloonSize * dpr2; cachedTarget.height = (balloonSize + 60) * dpr2; 
cachedDummy.width = balloonSize * dpr2; cachedDummy.height = (balloonSize + 60) * dpr2;

function preDrawBalloon(ctx, type) { 
    ctx.scale(dpr2, dpr2); 
    const cx = balloonSize/2; const cy = balloonSize/2; const r = 35; 
    ctx.beginPath(); ctx.moveTo(cx, cy+r); ctx.bezierCurveTo(cx+10, cy+r+20, cx-10, cy+r+40, cx, cy+r+60); ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 2; ctx.stroke(); 
    if (type === 'target') { 
        let g = ctx.createLinearGradient(cx, cy-r, cx, cy+r); g.addColorStop(0, '#81D4FA'); g.addColorStop(1, '#FFF59D'); ctx.fillStyle = g; 
    } else { ctx.fillStyle = '#CFD8DC'; } 
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill(); 
    ctx.beginPath(); ctx.moveTo(cx, cy+r-2); ctx.lineTo(cx-6, cy+r+8); ctx.lineTo(cx+6, cy+r+8); ctx.fill(); 
    ctx.beginPath(); ctx.arc(cx, cy, r-10, -0.2*Math.PI, 0.1*Math.PI); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke(); 
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
}

preDrawBalloon(cachedTarget.getContext('2d'), 'target'); 
preDrawBalloon(cachedDummy.getContext('2d'), 'dummy');

const MAX_BALLOONS = 100; 
const pool = new Array(MAX_BALLOONS).fill(null).map(() => ({active: false, x: 0, y: 0, baseX: 0, baseSpeed: 0, wobble: 0, type: 'dummy'})); 
const MAX_PARTICLES = 150; 
const particles = new Array(MAX_PARTICLES).fill(null).map(()=>({active:false, x:0, y:0, vx:0, vy:0, life:0, color:'#000'})); 
const particleColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1']; 

let bScore = 0, gameStartTime = 0, isGameRunning = false, lastFrameTime = 0;

function initBalloonGame() { 
    document.getElementById('game-over-modal').style.display = 'none'; 
    document.getElementById('record-badge').style.display = 'none'; 
    document.getElementById('game-icon').style.display = 'none'; 
    if(ballCanvas) {
        ballCanvas.width = window.innerWidth * dpr2; 
        ballCanvas.height = window.innerHeight * dpr2; 
        bCtx.scale(dpr2, dpr2); 
    }
    pool.forEach(b => b.active = false); 
    particles.forEach(p => p.active = false); 
    bScore = 0; 
    document.getElementById('balloon-score').innerText = 0; 
    document.getElementById('game-timer').innerText = "02:00"; 
    
    if(ballCanvas) {
        ballCanvas.addEventListener('touchstart', popBalloon, {passive: false}); 
        ballCanvas.addEventListener('mousedown', popBalloon); 
    }
    gameStartTime = Date.now(); 
    lastFrameTime = performance.now(); 
    isGameRunning = true; 
    requestAnimationFrame(runBalloonLoop); 
}

function stopBalloonGame() { 
    isGameRunning = false; 
    if(ballCanvas) {
        ballCanvas.removeEventListener('touchstart', popBalloon); 
        ballCanvas.removeEventListener('mousedown', popBalloon); 
    }
}

function endGame() { 
    isGameRunning = false; 
    const savedScore = parseInt(localStorage.getItem('balloon_highscore') || '0'); 
    let isNewRecord = bScore > savedScore; 
    if (isNewRecord) { localStorage.setItem('balloon_highscore', bScore); } 
    document.getElementById('final-score').innerText = bScore; 
    if (isNewRecord) { 
        document.getElementById('record-badge').style.display = 'inline-block'; 
        document.getElementById('game-icon').style.display = 'block'; 
        if(tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success'); 
    } else { 
        if(tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning'); 
    } 
    document.getElementById('game-over-modal').style.display = 'flex'; 
}

function spawnBalloon() { 
    const b = pool.find(p => !p.active); 
    if (!b) return; 
    const type = Math.random() < 0.6 ? 'target' : 'dummy'; 
    b.active = true; 
    b.baseX = Math.random() * (window.innerWidth - 70) + 35; 
    b.x = b.baseX; 
    b.y = window.innerHeight + 50; 
    b.baseSpeed = Math.random() * 2 + 2; 
    b.wobble = Math.random() * Math.PI * 2; 
    b.type = type; 
}

function explodeConfetti(x, y) { 
    let count = 0; 
    for(let i=0; i<MAX_PARTICLES; i++) { 
        const p = particles[i]; 
        if(!p.active) { 
            p.active = true; p.x = x; p.y = y; 
            p.vx = (Math.random() - 0.5) * 10; 
            p.vy = (Math.random() - 0.5) * 10 - 2; 
            p.life = 1.0; 
            p.color = particleColors[Math.floor(Math.random()*particleColors.length)]; 
            count++; if(count >= 15) break; 
        } 
    } 
}

function runBalloonLoop(timestamp) { 
    if (!isGameRunning) return; 
    const elapsedTotal = (Date.now() - gameStartTime) / 1000; 
    const timeLeft = Math.max(0, 120 - elapsedTotal); 
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0'); 
    const s = Math.floor(timeLeft % 60).toString().padStart(2, '0'); 
    document.getElementById('game-timer').innerText = `${m}:${s}`; 
    if (timeLeft <= 0) { endGame(); return; } 
    
    let dt = (timestamp - lastFrameTime) / 1000; 
    lastFrameTime = timestamp; 
    if (dt > 0.1) dt = 0.1; 
    
    bCtx.clearRect(0, 0, window.innerWidth, window.innerHeight); 
    const speedMultiplier = 1 + (Math.floor(elapsedTotal / 30) * 0.2); 
    if (Math.random() < 0.06 * (dt * 60)) { spawnBalloon(); } 
    
    for (let i = 0; i < MAX_BALLOONS; i++) { 
        const b = pool[i]; 
        if (!b.active) continue; 
        const moveStep = b.baseSpeed * speedMultiplier * (dt * 60); 
        b.y -= moveStep; 
        b.x = b.baseX + Math.sin(timestamp * 0.005 + b.wobble) * 50; 
        const img = b.type === 'target' ? cachedTarget : cachedDummy; 
        bCtx.drawImage(img, 0, 0, img.width, img.height, (b.x - 40)|0, (b.y - 40)|0, 80, 140); 
        if (b.y < -150) b.active = false; 
    } 
    
    for(let i=0; i<MAX_PARTICLES; i++){ 
        const p=particles[i]; 
        if(!p.active)continue; 
        p.x += p.vx * (dt*60); p.y += p.vy * (dt*60); 
        p.vy += 0.5 * (dt*60); p.life -= 0.02 * (dt*60); 
        bCtx.globalAlpha = p.life; bCtx.fillStyle = p.color; 
        bCtx.fillRect((p.x)|0, (p.y)|0, 6, 6); 
        bCtx.globalAlpha = 1.0; 
        if(p.life <= 0) p.active = false; 
    } 
    requestAnimationFrame(runBalloonLoop); 
}

function popBalloon(e) { 
    e.preventDefault(); 
    const rect = ballCanvas.getBoundingClientRect(); 
    let points = []; 
    if (e.changedTouches) { 
        for (let i = 0; i < e.changedTouches.length; i++) { 
            points.push({ x: e.changedTouches[i].clientX - rect.left, y: e.changedTouches[i].clientY - rect.top }); 
        } 
    } else { 
        points.push({ x: e.clientX - rect.left, y: e.clientY - rect.top }); 
    } 
    points.forEach(p => { 
        for (let i = 0; i < MAX_BALLOONS; i++) { 
            const b = pool[i]; 
            if (!b.active) continue; 
            const dist = Math.sqrt((p.x - b.x)**2 + (p.y - b.y)**2); 
            if (dist < 70) { 
                if (b.type === 'target') { 
                    b.active = false; 
                    bScore++; 
                    document.getElementById('balloon-score').innerText = bScore; 
                    explodeConfetti(b.x, b.y); 
                    if(tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light'); 
                } 
                break; 
            } 
        } 
    }); 
}

// ============================================
// 📞 CALL LOGIC (VAD)
// ============================================

let vadContext, vadAnalyser, vadSource, vadStream;
let vadInterval;
let isSpeaking = false;
let silenceStart = Date.now();
let callMediaRecorder = null;
let callChunks = [];
let currentBotAudio = null; 
const VAD_THRESHOLD = 30; 

async function initCallUI() {
    document.getElementById('callStatus').innerText = "Подключение...";
    try {
        if (!vadStream || !vadStream.active) vadStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!vadContext || vadContext.state === 'closed') vadContext = new (window.AudioContext || window.webkitAudioContext)();
        if (vadContext.state === 'suspended') await vadContext.resume();
        if (!vadAnalyser) vadAnalyser = vadContext.createAnalyser();
        vadAnalyser.fftSize = 512;
        try { if (vadSource) vadSource.disconnect(); } catch(e) {}
        vadSource = vadContext.createMediaStreamSource(vadStream);
        vadSource.connect(vadAnalyser);
        callMediaRecorder = new MediaRecorder(vadStream);
        callMediaRecorder.ondataavailable = e => callChunks.push(e.data);
        callMediaRecorder.onstop = async () => {
            if (!document.getElementById('call-screen').classList.contains('active')) return;
            const blob = new Blob(callChunks, { type: 'audio/webm' });
            if (blob.size < 1000) { resetListening(); return; }
            document.getElementById('callStatus').innerText = "Думаю...";
            document.querySelector('.ai-avatar-circle').style.transform = 'scale(0.8)';
            const base64 = await blobToBase64(blob);
            
            fetch(GOOGLE_SCRIPT_URL + '?act=api', { 
                method: 'POST', 
                body: JSON.stringify({ 
                    audio: base64, 
                    initData: tg.initData, // <--- Безопасная отправка
                    text: '' 
                }) 
            })
            .then(r => r.json())
            .then(d => { 
                if (d.status === 'success' && d.audio) { 
                    document.getElementById('callStatus').innerText = "Говорит..."; 
                    playAudioResponseInCall(d.audio); 
                } else { 
                    resetListening(); 
                } 
            })
            .catch(e => { resetListening(); });
        };
        document.getElementById('callStatus').innerText = "Слушаю...";
        clearInterval(vadInterval);
        vadInterval = setInterval(analyzeVolume, 50);
    } catch (e) { 
        alert("Ошибка доступа к микрофону: " + e); 
        vadStream = null; 
        navigateTo('menu'); 
    }
}

function analyzeVolume() {
    if (!vadAnalyser || !document.getElementById('call-screen').classList.contains('active')) return;
    const dataArray = new Uint8Array(vadAnalyser.frequencyBinCount);
    vadAnalyser.getByteFrequencyData(dataArray);
    let sum = 0; for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
    const average = sum / dataArray.length;
    const scale = 1 + (average / 200); 
    const circle = document.querySelector('.ai-avatar-circle');
    if(circle) circle.style.transform = `scale(${scale})`;
    if (average > VAD_THRESHOLD) {
        if (!isSpeaking) {
            isSpeaking = true; callChunks = [];
            if (currentBotAudio && !currentBotAudio.paused) { currentBotAudio.pause(); currentBotAudio = null; }
            if (callMediaRecorder && callMediaRecorder.state === 'inactive') callMediaRecorder.start();
        }
        silenceStart = Date.now();
    } else {
        if (isSpeaking) {
            if (Date.now() - silenceStart > 1200) {
                isSpeaking = false;
                if (callMediaRecorder && callMediaRecorder.state === 'recording') { callMediaRecorder.stop(); clearInterval(vadInterval); }
            }
        }
    }
}

function playAudioResponseInCall(base64) {
    if (!document.getElementById('call-screen').classList.contains('active')) return;
    try {
        if (currentBotAudio) { currentBotAudio.pause(); currentBotAudio.currentTime = 0; }
        currentBotAudio = new Audio("data:audio/mp3;base64," + base64);
        currentBotAudio.play();
        document.querySelector('.ai-avatar-circle').style.animation = 'pulse-avatar 1s infinite';
        currentBotAudio.onended = () => { document.querySelector('.ai-avatar-circle').style.animation = 'none'; resetListening(); };
    } catch (e) { resetListening(); }
}

function resetListening() {
    if (!document.getElementById('call-screen').classList.contains('active')) return;
    document.getElementById('callStatus').innerText = "Слушаю...";
    callChunks = []; isSpeaking = false;
    clearInterval(vadInterval); vadInterval = setInterval(analyzeVolume, 50);
}

function endCall() {
    if(tg.HapticFeedback) tg.HapticFeedback.impactOccurred('heavy');
    clearInterval(vadInterval);
    if (currentBotAudio) { currentBotAudio.pause(); currentBotAudio.currentTime = 0; currentBotAudio = null; }
    if (callMediaRecorder && callMediaRecorder.state === 'recording') { callMediaRecorder.stop(); callChunks = []; }
    if (vadContext) vadContext.suspend();
    const circle = document.querySelector('.ai-avatar-circle');
    if(circle) { circle.style.animation = 'pulse-avatar 2s infinite ease-in-out'; circle.style.transform = 'scale(1)'; }
    navigateTo('menu');
}

function toggleSpeaker() {
    const btn = document.getElementById('speakerBtn');
    btn.classList.toggle('btn-active-state');
    if(tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function toggleMicMute(btn) {
    btn.classList.toggle('btn-active-state');
    const icon = btn.querySelector('span');
    icon.innerText = btn.classList.contains('btn-active-state') ? 'mic_off' : 'mic';
    if (vadStream) vadStream.getAudioTracks()[0].enabled = !btn.classList.contains('btn-active-state');
    if(tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

// ============================================
// 🚀 STARTUP
// ============================================

checkDiaryStatus();
initTheme();
loadChatHistory();
