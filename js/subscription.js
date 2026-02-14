// 📢 SUBSCRIPTION GATE — проверяем подписку при запуске
(async function initWithSubscriptionCheck() {
    try {
        const resp = await fetch(GOOGLE_SCRIPT_URL + '?act=api', {
            method: 'POST',
            body: JSON.stringify({ initData: tg.initData, action: 'check_subscription' })
        });
        const d = await resp.json();
        
        if (d.status === 'ok' && d.subscribed === false) {
            // Не подписан — показываем gate
            _requiredChannel = d.channel || '@channel';
            showSubscriptionGate(_requiredChannel);
            return; // НЕ загружаем приложение
        }
    } catch(e) {
        // При ошибке сети — пропускаем проверку, не блокируем
    }
    
    // Подписан или ошибка — загружаем как обычно
    loadChatHistory();
})();

function showSubscriptionGate(channel) {
    document.getElementById('subChannelName').textContent = channel;
    document.getElementById('subOverlay').style.display = 'flex';
    _requiredChannel = channel;
}

function openRequiredChannel() {
    // Открываем канал через Telegram deeplink
    var username = _requiredChannel.replace('@', '');
    if (tg.openTelegramLink) {
        tg.openTelegramLink('https://t.me/' + username);
    } else {
        window.open('https://t.me/' + username, '_blank');
    }
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

async function recheckSubscription() {
    var btn = document.getElementById('subCheckBtn');
    var txt = document.getElementById('subCheckText');
    btn.classList.add('checking');
    txt.textContent = 'Проверяю...';
    
    try {
        const resp = await fetch(GOOGLE_SCRIPT_URL + '?act=api', {
            method: 'POST',
            body: JSON.stringify({ initData: tg.initData, action: 'check_subscription' })
        });
        const d = await resp.json();
        
        if (d.status === 'ok' && d.subscribed === true) {
            // Подписался! Скрываем overlay с анимацией
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            var overlay = document.getElementById('subOverlay');
            overlay.classList.add('hiding');
            setTimeout(function() { overlay.style.display = 'none'; }, 400);
            
            // Запускаем приложение
            loadChatHistory();
        } else {
            // Всё ещё не подписан
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
            txt.textContent = 'Вы ещё не подписаны 😔';
            setTimeout(function() { txt.textContent = 'Я подписался — проверить'; }, 2500);
        }
    } catch(e) {
        txt.textContent = 'Ошибка сети. Попробуйте ещё раз';
        setTimeout(function() { txt.textContent = 'Я подписался — проверить'; }, 2500);
    }
    
    btn.classList.remove('checking');
}

