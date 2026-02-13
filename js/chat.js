// 💬 CHAT LOGIC
// ============================================
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const typingIndicator = document.getElementById('typing');
const typingStatus = document.getElementById('typingStatus');
let mediaRecorder = null, audioChunks = [], isRecording = false;
let fetchTimeout = null;

function scrollToBottom() { if(chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight; }

function addMessage(t, isUser, useTypewriter) {
    const d = document.createElement('div');
    d.className = `message ${isUser ? 'msg-user' : 'msg-bot'} msg-enter`;
    
    if (isUser) {
        d.textContent = t;
    } else if (useTypewriter) {
        const html = parseMd(t);
        chatContainer.insertBefore(d, typingIndicator);
        typewriterEffect(d, html, () => { playSound('receive'); scrollToBottom(); });
        return;
    } else {
        d.innerHTML = parseMd(t);
    }
    chatContainer.insertBefore(d, typingIndicator);
    scrollToBottom();
}

function showTyping(show) {
    typingIndicator.style.display = show ? 'block' : 'none';
    typingStatus.style.display = show ? 'block' : 'none';
    if (show) {
        typingStatus.innerText = 'Думаю...';
        clearTimeout(fetchTimeout);
        fetchTimeout = setTimeout(() => { typingStatus.innerText = 'Думаю глубже...'; }, 10000);
        setTimeout(() => { if (typingIndicator.style.display !== 'none') typingStatus.innerText = 'Почти готово...'; }, 20000);
    }
    scrollToBottom();
}

function hidePromptChips() {
    const chips = document.getElementById('promptChips');
    if (chips) chips.style.display = 'none';
}

function sendPromptChip(text) {
    hidePromptChips();
    userInput.value = text;
    sendMessage();
}

function sendMessage() {
    const t = userInput.value.trim();
    if (!t) return;
    hidePromptChips();
    addMessage(t, true);
    userInput.value = '';
    userInput.blur(); // Скрыть клавиатуру
    sendBtn.disabled = true;
    showTyping(true);
    playSound('send');
    messageCount++; localStorage.setItem('message_count', messageCount);
    checkAchievements();

    fetch(GOOGLE_SCRIPT_URL + '?act=api', { method: 'POST', body: JSON.stringify({ text: t, initData: tg.initData }) })
    .then(r => r.json()).then(handleResponse).catch(handleError);
}

async function toggleRecording() {
    if (!isRecording) {
        try {
            const s = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(s); audioChunks = [];
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = async () => { const b = new Blob(audioChunks, { type: 'audio/webm' }); const z = await blobToBase64(b); sendVoiceRequest(z); };
            mediaRecorder.start(); isRecording = true; micBtn.classList.add('recording');
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
        } catch (e) { alert("Нет микрофона"); }
    } else {
        if (mediaRecorder) { mediaRecorder.stop(); mediaRecorder.stream.getTracks().forEach(t => t.stop()); }
        isRecording = false; micBtn.classList.remove('recording');
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    }
}

function sendVoiceRequest(z) {
    hidePromptChips();
    addMessage("🎤 Аудио...", true);
    showTyping(true); sendBtn.disabled = true; micBtn.disabled = true;
    fetch(GOOGLE_SCRIPT_URL + '?act=api', { method: 'POST', body: JSON.stringify({ audio: z, initData: tg.initData, text: '' }) })
    .then(r => r.json()).then(handleResponse).catch(handleError);
}

function handleResponse(d) {
    showTyping(false); sendBtn.disabled = false; micBtn.disabled = false;
    if (d.status === 'success') {
        addMessage(d.text, false, true); // typewriter enabled
        if (d.balance !== undefined) updateLocalBalance(d.balance);
        if (typeof d.isPremium !== 'undefined') window.isUserPremium = d.isPremium;
        if (d.audio) playAudioResponse(d.audio);
        checkAchievements();
    } else if (d.status === 'error') {
        if (d.error_code === 'not_subscribed') { showSubscriptionGate(d.channel || _requiredChannel || '@channel'); return; }
        if (d.error_code === 'limit_reached') showPaywall('limit');
        else if (d.error_code === 'voice_blocked') showPaywall('voice');
        else addMessage("⚠️ " + d.text, false);
    } else { addMessage("⚠️ " + d.text, false); }
}

function handleError() { showTyping(false); sendBtn.disabled = false; micBtn.disabled = false; addMessage("⚠️ Ошибка сети. Проверьте подключение.", false); }

// --- BALANCE ---
function initBalanceDisplay() {
    const balEl = document.getElementById('userBalanceDisplay');
    if (!balEl) return;
    const cachedBal = localStorage.getItem('user_balance_cache');
    if (cachedBal !== null && cachedBal !== "undefined") { balEl.innerText = cachedBal; window.isUserPremium = parseInt(cachedBal) > 0; }
    else { balEl.innerHTML = '<span class="material-icons-round balance-loader">sync</span>'; }
}
function updateLocalBalance(val) {
    if (val === undefined || val === null) return;
    localStorage.setItem('user_balance_cache', val);
    const balEl = document.getElementById('userBalanceDisplay');
    if (balEl) balEl.innerText = val;
    window.isUserPremium = parseInt(val) > 0;
}

function loadChatHistory() {
    fetch(GOOGLE_SCRIPT_URL + '?act=api', { method: 'POST', body: JSON.stringify({ initData: tg.initData, action: 'load_history' }) })
    .then(r => r.json()).then(d => {
        if (d.status === 'success') {
            if (d.balance !== undefined) updateLocalBalance(d.balance);
            if (d.history && Array.isArray(d.history) && d.history.length > 0) {
                hidePromptChips();
                d.history.forEach(m => { if (m.role !== 'system' && m.parts && m.parts[0]) addMessage(m.parts[0].text, m.role === 'user'); });
            }
        }
    }).catch(e => {});
}

function clearChatHistory() {
    if (confirm('Очистить всю историю чата?')) {
        fetch(GOOGLE_SCRIPT_URL + '?act=api', { method: 'POST', body: JSON.stringify({ initData: tg.initData, action: 'clear_history' }) });
        const msgs = chatContainer.querySelectorAll('.message');
        msgs.forEach(m => m.remove());
        addMessage("Я рядом. Вы можете рассказать мне все, что вас тревожит. 🌿", false);
        const chips = document.getElementById('promptChips');
        if (chips) chips.style.display = 'flex';
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    }
}

function playAudioResponse(z) {
    if (!z) return;
    try {
        const a = new Audio("data:audio/mp3;base64," + z);
        const m = document.querySelectorAll('.msg-bot');
        const l = m[m.length - 1];
        let i = null;
        if (l) { i = document.createElement('span'); i.className = 'material-icons-round'; i.innerText = 'volume_up'; i.style.cssText = "margin-left:8px;vertical-align:middle;color:var(--primary-main);font-size:20px;"; i.animate([{opacity:0.5},{opacity:1},{opacity:0.5}], {duration:1000,iterations:Infinity}); l.appendChild(i); }
        a.play().catch(e => {}); a.onended = () => { if(i) i.remove(); };
    } catch(e) {}
}

function blobToBase64(b) { return new Promise(r => { const z = new FileReader(); z.onloadend = () => r(z.result); z.readAsDataURL(b); }); }
sendBtn.addEventListener('click', sendMessage);
micBtn.addEventListener('click', toggleRecording);
userInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

// ============================================
