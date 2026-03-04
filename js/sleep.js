// 💤 SLEEP TRACKER
// ============================================

let sleepQuality = 0;

function selectSleepQuality(q) {
    sleepQuality = q;
    document.querySelectorAll('.sleep-quality-btn').forEach((btn, i) => {
        btn.classList.toggle('selected', i + 1 === q);
    });
    if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function saveSleep() {
    const bedtime = document.getElementById('sleepBedtime')?.value;
    const wakeup = document.getElementById('sleepWakeup')?.value;
    
    if (!bedtime || !wakeup || !sleepQuality) {
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
        return;
    }
    
    // Calculate duration
    const [bH, bM] = bedtime.split(':').map(Number);
    const [wH, wM] = wakeup.split(':').map(Number);
    let duration = (wH * 60 + wM) - (bH * 60 + bM);
    if (duration < 0) duration += 24 * 60; // overnight
    
    const entries = JSON.parse(localStorage.getItem('sleep_entries') || '[]');
    
    // Одна запись в день — заменяем если уже есть
    const todayKey = new Date().toISOString().split('T')[0];
    const existingIdx = entries.findIndex(e => e.date.split('T')[0] === todayKey);
    
    const newEntry = {
        date: new Date().toISOString(),
        bedtime: bedtime,
        wakeup: wakeup,
        duration: duration,
        quality: sleepQuality
    };
    
    if (existingIdx >= 0) {
        entries[existingIdx] = newEntry;
    } else {
        entries.unshift(newEntry);
    }
    
    if (entries.length > 60) entries.length = 60;
    localStorage.setItem('sleep_entries', JSON.stringify(entries));
    
    // Reset
    sleepQuality = 0;
    document.querySelectorAll('.sleep-quality-btn').forEach(btn => btn.classList.remove('selected'));
    
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    playSound('receive');
    
    renderSleepHistory();
    drawSleepChart();
}

function renderSleepHistory() {
    const container = document.getElementById('sleepHistory');
    if (!container) return;
    const entries = JSON.parse(localStorage.getItem('sleep_entries') || '[]');
    
    if (entries.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:13px;padding:16px;">Нет данных. Запишите свой первый сон!</div>';
        return;
    }
    
    const qualityEmoji = ['', '😫', '😴', '🙂', '😊', '🤩'];
    container.innerHTML = entries.slice(0, 14).map(e => {
        const d = new Date(e.date);
        const h = Math.floor(e.duration / 60);
        const m = e.duration % 60;
        return `<div class="sleep-history-item">
            <div>
                <div style="font-size:14px;font-weight:700;color:var(--text-header)">${d.toLocaleDateString('ru', { day:'numeric', month:'short' })}</div>
                <div style="font-size:12px;color:var(--text-muted)">${e.bedtime} → ${e.wakeup}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:14px;font-weight:700;color:var(--text-header)">${h}ч ${m > 0 ? m + 'м' : ''}</div>
                <div style="font-size:16px">${qualityEmoji[e.quality]}</div>
            </div>
        </div>`;
    }).join('');
}

function drawSleepChart() {
    const canvas = document.getElementById('sleepChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const entries = JSON.parse(localStorage.getItem('sleep_entries') || '[]').slice(0, 14).reverse();
    
    if (entries.length < 2) return;
    
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth;
    const h = 120;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    
    const pad = { top: 15, right: 24, bottom: 25, left: 24 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;
    const isDark = document.body.classList.contains('dark-mode');
    
    // Draw bars — равномерно внутри области, не выходя за padding
    const barW = Math.min(cw / entries.length * 0.65, 30);
    const maxH = 10 * 60; // 10 hours max
    const step = cw / entries.length;
    
    entries.forEach((e, i) => {
        const cx = pad.left + step * i + step / 2;
        const x = cx - barW / 2;
        const barH = Math.min(e.duration / maxH, 1) * ch;
        const y = pad.top + ch - barH;
        
        const colors = [
            '', 'rgba(239,83,80,0.6)', 'rgba(255,183,77,0.6)', 
            isDark ? 'rgba(108,93,211,0.5)' : 'rgba(77,182,172,0.5)',
            isDark ? 'rgba(108,93,211,0.7)' : 'rgba(77,182,172,0.7)',
            isDark ? 'rgba(108,93,211,0.9)' : 'rgba(77,182,172,0.9)'
        ];
        
        ctx.fillStyle = colors[e.quality] || colors[3];
        ctx.beginPath();
        const r = 4;
        ctx.moveTo(x + r, y); ctx.lineTo(x + barW - r, y);
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
        ctx.lineTo(x + barW, pad.top + ch);
        ctx.lineTo(x, pad.top + ch);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.fill();
        
        // Duration label
        ctx.fillStyle = isDark ? '#6E727A' : '#9B9488';
        ctx.font = '9px Manrope'; ctx.textAlign = 'center';
        const hrs = Math.floor(e.duration / 60);
        ctx.fillText(hrs + 'ч', cx, h - 5);
    });
}

function initSleep() {
    renderSleepHistory();
    drawSleepChart();
}
