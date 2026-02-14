// 🧠 CBT — Дневник мыслей
// ============================================

function getCbtAdvice() {
    const sit = document.getElementById('cbtSituation')?.value?.trim();
    const thought = document.getElementById('cbtThought')?.value?.trim();
    const emotion = document.getElementById('cbtEmotion')?.value?.trim();
    const box = document.getElementById('cbtAiSuggestion');
    
    if (!sit || !thought) {
        if (box) box.textContent = 'Заполните хотя бы «Ситуацию» и «Мысль»';
        return;
    }
    
    if (box) box.innerHTML = '<span class="material-icons-round balance-loader">refresh</span> AI анализирует...';
    
    fetch(GOOGLE_SCRIPT_URL + '?act=api', {
        method: 'POST',
        body: JSON.stringify({
            initData: tg.initData,
            action: 'chat',
            message: `[КПТ-УПРАЖНЕНИЕ] Помоги найти альтернативную мысль.\nСитуация: ${sit}\nАвтоматическая мысль: ${thought}\nЭмоция: ${emotion || 'не указана'}\n\nДай краткий (2-3 предложения) альтернативный взгляд на ситуацию, используя технику когнитивной реструктуризации. Будь тёплым и поддерживающим.`
        })
    })
    .then(r => r.json())
    .then(d => {
        if (d.reply) {
            if (box) box.textContent = d.reply;
            if (d.balance !== undefined) updateLocalBalance(d.balance);
        } else if (d.error_code === 'not_subscribed') {
            showSubscriptionGate(d.channel || _requiredChannel || '@channel');
        } else if (d.error_code === 'no_credits') {
            showPaywall('cbt');
        } else {
            if (box) box.textContent = 'Не удалось получить ответ. Попробуйте позже.';
        }
    })
    .catch(() => { if (box) box.textContent = 'Ошибка сети'; });
}

function saveCbtEntry() {
    const sit = document.getElementById('cbtSituation')?.value?.trim();
    const thought = document.getElementById('cbtThought')?.value?.trim();
    const emotion = document.getElementById('cbtEmotion')?.value?.trim();
    const alt = document.getElementById('cbtAiSuggestion')?.textContent?.trim();
    
    if (!sit && !thought) return;
    
    const entries = JSON.parse(localStorage.getItem('cbt_entries') || '[]');
    entries.unshift({
        date: new Date().toISOString(),
        situation: sit,
        thought: thought,
        emotion: emotion,
        alternative: alt && alt !== 'Заполните поля выше и нажмите «Получить совет» — AI предложит альтернативный взгляд' ? alt : ''
    });
    if (entries.length > 50) entries.length = 50;
    localStorage.setItem('cbt_entries', JSON.stringify(entries));
    
    // Clear fields
    if (document.getElementById('cbtSituation')) document.getElementById('cbtSituation').value = '';
    if (document.getElementById('cbtThought')) document.getElementById('cbtThought').value = '';
    if (document.getElementById('cbtEmotion')) document.getElementById('cbtEmotion').value = '';
    if (document.getElementById('cbtAiSuggestion')) document.getElementById('cbtAiSuggestion').textContent = 'Запись сохранена ✓';
    
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    renderCbtHistory();
}

function renderCbtHistory() {
    const container = document.getElementById('cbtHistory');
    if (!container) return;
    const entries = JSON.parse(localStorage.getItem('cbt_entries') || '[]');
    
    if (entries.length === 0) { container.innerHTML = ''; return; }
    
    container.innerHTML = '<h3 style="font-size:16px;font-weight:700;color:var(--text-header);margin-bottom:12px;">Записи</h3>' +
        entries.slice(0, 10).map(e => {
            const d = new Date(e.date);
            return `<div class="cbt-history-item">
                <div class="cbt-date">${d.toLocaleDateString('ru', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
                <div class="cbt-thought"><strong>Мысль:</strong> ${e.thought || '—'}</div>
                ${e.alternative ? `<div class="cbt-thought" style="color:var(--primary-main);margin-top:4px;"><strong>Альтернатива:</strong> ${e.alternative}</div>` : ''}
            </div>`;
        }).join('');
}

function initCbt() { renderCbtHistory(); }
