// 📊 ANALYTICS
// ============================================

function initAnalytics() {
    drawMoodChart('moodLineChart', 7);
    drawMoodChart('moodMonthChart', 30);
    updateAnalyticsStats();
}

function getMoodHistory(days) {
    const entries = [];
    const now = new Date();
    const h = JSON.parse(localStorage.getItem('mood_history_v2') || '{}');
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const val = h[key];
        entries.push({
            date: d,
            label: d.toLocaleDateString('ru', { weekday: 'short', day: 'numeric' }),
            mood: val ? parseInt(val) : null
        });
    }
    return entries;
}

function drawMoodChart(canvasId, days) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement;
    canvas.width = rect.clientWidth * dpr;
    canvas.height = 160 * dpr;
    canvas.style.width = rect.clientWidth + 'px';
    canvas.style.height = '160px';
    ctx.scale(dpr, dpr);
    
    const w = rect.clientWidth, h = 160;
    const entries = getMoodHistory(days);
    const padding = { top: 20, right: 15, bottom: 30, left: 15 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    
    ctx.clearRect(0, 0, w, h);
    
    // Grid lines
    ctx.strokeStyle = document.body.classList.contains('dark-mode') ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
        const y = padding.top + chartH - (i / 5) * chartH;
        ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(w - padding.right, y); ctx.stroke();
    }
    
    // Find valid points
    const points = [];
    entries.forEach((e, i) => {
        if (e.mood !== null) {
            const x = padding.left + (i / (entries.length - 1)) * chartW;
            const y = padding.top + chartH - (e.mood / 5) * chartH;
            points.push({ x, y, mood: e.mood });
        }
    });
    
    if (points.length < 2) {
        ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#6E727A' : '#9B9488';
        ctx.font = '14px Manrope'; ctx.textAlign = 'center';
        ctx.fillText('Недостаточно данных', w / 2, h / 2);
        return;
    }
    
    // Gradient fill
    const grad = ctx.createLinearGradient(0, padding.top, 0, h);
    const isDark = document.body.classList.contains('dark-mode');
    grad.addColorStop(0, isDark ? 'rgba(108,93,211,0.3)' : 'rgba(77,182,172,0.2)');
    grad.addColorStop(1, isDark ? 'rgba(108,93,211,0)' : 'rgba(77,182,172,0)');
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, h - padding.bottom);
    points.forEach((p, i) => {
        if (i === 0) ctx.lineTo(p.x, p.y);
        else {
            const prev = points[i - 1];
            const cpx = (prev.x + p.x) / 2;
            ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y);
        }
    });
    ctx.lineTo(points[points.length - 1].x, h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    
    // Line
    ctx.beginPath();
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else {
            const prev = points[i - 1];
            const cpx = (prev.x + p.x) / 2;
            ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y);
        }
    });
    ctx.strokeStyle = isDark ? '#9B8CE8' : '#4DB6AC';
    ctx.lineWidth = 2.5; ctx.stroke();
    
    // Dots
    points.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#9B8CE8' : '#4DB6AC'; ctx.fill();
        ctx.strokeStyle = isDark ? '#1F2229' : '#FFFBF5'; ctx.lineWidth = 2; ctx.stroke();
    });
    
    // X-axis labels (show some)
    ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#6E727A' : '#9B9488';
    ctx.font = '10px Manrope'; ctx.textAlign = 'center';
    const step = days <= 7 ? 1 : Math.ceil(days / 7);
    entries.forEach((e, i) => {
        if (i % step === 0 || i === entries.length - 1) {
            const x = padding.left + (i / (entries.length - 1)) * chartW;
            ctx.fillText(e.label, x, h - 5);
        }
    });
}

function updateAnalyticsStats() {
    const entries = getMoodHistory(30).filter(e => e.mood !== null);
    const avgEl = document.getElementById('statAvg');
    const bestEl = document.getElementById('statBest');
    const countEl = document.getElementById('statEntries');
    const insightEl = document.getElementById('analyticsInsight');
    const insightText = document.getElementById('analyticsInsightText');
    
    if (entries.length === 0) {
        if (avgEl) avgEl.textContent = '—';
        if (bestEl) bestEl.textContent = '—';
        if (countEl) countEl.textContent = '0';
        return;
    }
    
    const avg = entries.reduce((s, e) => s + e.mood, 0) / entries.length;
    const best = ['', '😫', '😕', '😐', '😊', '🤩'];
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    
    if (avgEl) avgEl.textContent = avg.toFixed(1);
    if (bestEl) {
        const maxMood = Math.max(...entries.map(e => e.mood));
        bestEl.textContent = best[maxMood] || maxMood;
    }
    if (countEl) countEl.textContent = entries.length;
    
    // Insight
    if (entries.length >= 5 && insightEl && insightText) {
        const recent5 = entries.slice(-5);
        const avgRecent = recent5.reduce((s, e) => s + e.mood, 0) / 5;
        const older = entries.slice(0, -5);
        if (older.length > 0) {
            const avgOld = older.reduce((s, e) => s + e.mood, 0) / older.length;
            if (avgRecent > avgOld + 0.3) insightText.textContent = '📈 Ваше настроение улучшается! Последние дни были лучше среднего.';
            else if (avgRecent < avgOld - 0.3) insightText.textContent = '💛 Последние дни были непростыми. Помните — это временно. Попробуйте дыхательное упражнение.';
            else insightText.textContent = '🌿 Ваше состояние стабильно. Продолжайте отслеживать — это помогает осознанности.';
            insightEl.style.display = 'block';
        }
    }
}
