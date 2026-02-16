// 📊 ANALYTICS
// ============================================

function initAnalytics() {
    // Small delay to ensure DOM is laid out
    setTimeout(() => {
        drawMoodChart('moodLineChart', 7);
        drawMoodChart('moodMonthChart', 30);
        updateAnalyticsStats();
    }, 50);
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
            shortLabel: d.getDate().toString(),
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
    const container = canvas.parentElement;
    const availW = container.clientWidth;
    const chartH = 160;
    canvas.width = availW * dpr;
    canvas.height = chartH * dpr;
    canvas.style.width = availW + 'px';
    canvas.style.height = chartH + 'px';
    canvas.style.display = 'block';
    ctx.scale(dpr, dpr);
    
    const w = availW, h = chartH;
    const entries = getMoodHistory(days);
    const isDark = document.body.classList.contains('dark-mode');
    // Extra right padding so last label fits
    const pad = { top: 16, right: 28, bottom: 28, left: 10 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;
    
    ctx.clearRect(0, 0, w, h);
    
    // Grid lines
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
        const y = pad.top + ch - (i / 5) * ch;
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    }
    
    // Map ALL entries to x positions (evenly spaced across full width)
    const totalSlots = entries.length;
    const mapped = entries.map((e, i) => {
        const x = pad.left + (totalSlots === 1 ? cw / 2 : (i / (totalSlots - 1)) * cw);
        return { ...e, x, y: e.mood !== null ? pad.top + ch - (e.mood / 5) * ch : null };
    });
    
    // Only entries with data
    const points = mapped.filter(m => m.y !== null);
    
    if (points.length < 2) {
        ctx.fillStyle = isDark ? '#6E727A' : '#9CA3AF';
        ctx.font = '13px Manrope'; ctx.textAlign = 'center';
        ctx.fillText('Недостаточно данных', w / 2, h / 2);
        // Still draw labels
        drawXLabels(ctx, mapped, days, w, h, pad, cw, isDark);
        return;
    }
    
    // Gradient fill under the curve
    const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
    grad.addColorStop(0, isDark ? 'rgba(108,93,211,0.25)' : 'rgba(77,182,172,0.18)');
    grad.addColorStop(1, isDark ? 'rgba(108,93,211,0)' : 'rgba(77,182,172,0)');
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, h - pad.bottom);
    points.forEach((p, i) => {
        if (i === 0) { ctx.lineTo(p.x, p.y); }
        else {
            const prev = points[i - 1];
            const cpx = (prev.x + p.x) / 2;
            ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y);
        }
    });
    ctx.lineTo(points[points.length - 1].x, h - pad.bottom);
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
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#9B8CE8' : '#4DB6AC'; ctx.fill();
        ctx.strokeStyle = isDark ? '#1F2229' : '#FFFFFF'; ctx.lineWidth = 2; ctx.stroke();
    });
    
    // Labels
    drawXLabels(ctx, mapped, days, w, h, pad, cw, isDark);
}

function drawXLabels(ctx, mapped, days, w, h, pad, cw, isDark) {
    ctx.fillStyle = isDark ? '#6E727A' : '#9CA3AF';
    ctx.font = '9px Manrope'; ctx.textAlign = 'center';
    
    if (days <= 7) {
        // Show all 7 days
        mapped.forEach(m => {
            ctx.fillText(m.label, m.x, h - 4);
        });
    } else {
        // 30 days: show ~6 labels evenly
        const step = Math.ceil(mapped.length / 6);
        mapped.forEach((m, i) => {
            if (i % step === 0 || i === mapped.length - 1) {
                ctx.fillText(m.label, Math.min(m.x, w - pad.right), h - 4);
            }
        });
    }
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
