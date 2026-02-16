// 📔 DIARY LOGIC (Enhanced with streaks & comments)
// ============================================
function getStreak() {
    const h = JSON.parse(localStorage.getItem('mood_history_v2') || '{}');
    const dates = Object.keys(h).sort().reverse();
    let streak = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i = 0; i < dates.length; i++) {
        const d = new Date(dates[i]); d.setHours(0,0,0,0);
        const expected = new Date(today); expected.setDate(expected.getDate() - i);
        if (d.getTime() === expected.getTime()) streak++;
        else break;
    }
    return streak;
}

function checkDiaryStatus() {
    const h = JSON.parse(localStorage.getItem('mood_history_v2') || '{}');
    const today = new Date().toISOString().split('T')[0];
    const icon = document.getElementById('diary-icon');
    if (icon) { if (!h[today]) { icon.classList.add('heart-alert'); icon.innerText = 'favorite'; } else { icon.classList.remove('heart-alert'); icon.innerText = 'favorite_border'; } }
    const streak = getStreak();
    const badge = document.getElementById('streakBadge');
    if (badge) { if (streak >= 2) { badge.style.display = 'block'; badge.innerText = '🔥 ' + streak; } else { badge.style.display = 'none'; } }
}

function selectMood(level) {
    selectedMoodLevel = level;
    const row = document.getElementById('moodCommentRow');
    row.classList.add('show');
    document.getElementById('moodCommentInput').focus();
    if(tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

function confirmMood() {
    if (!selectedMoodLevel) return;
    const comment = document.getElementById('moodCommentInput').value.trim();
    saveMood(selectedMoodLevel, comment);
    selectedMoodLevel = null;
    document.getElementById('moodCommentInput').value = '';
    document.getElementById('moodCommentRow').classList.remove('show');
}

function saveMood(level, comment) {
    const h = JSON.parse(localStorage.getItem('mood_history_v2') || '{}');
    const comments = JSON.parse(localStorage.getItem('mood_comments') || '{}');
    const date = new Date().toISOString().split('T')[0];
    h[date] = level;
    if (comment) comments[date] = comment;
    localStorage.setItem('mood_history_v2', JSON.stringify(h));
    localStorage.setItem('mood_comments', JSON.stringify(comments));
    if(tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    renderDiary(); checkDiaryStatus(); checkAchievements();
}

function renderDiary() {
    const h = JSON.parse(localStorage.getItem('mood_history_v2') || '{}');
    const comments = JSON.parse(localStorage.getItem('mood_comments') || '{}');
    const dates = Object.keys(h).sort();
    const c = document.getElementById('history-container'); if(c) c.innerHTML = '';
    const moodMap = { 5: {text:'Отлично',color:'#4DB6AC',bg:'#E0F2F1',shadow:'#398E86'}, 4: {text:'Хорошо',color:'#80CBC4',bg:'#E0F2F1',shadow:'#63A39D'}, 3: {text:'Нормально',color:'#64B5F6',bg:'#E3F2FD',shadow:'#4295D1'}, 2: {text:'Так себе',color:'#FFE082',bg:'#FFF8E1',shadow:'#D3B765'}, 1: {text:'Плохо',color:'#FFB74D',bg:'#FFF3E0',shadow:'#D6963B'} };

    // Streak
    const streak = getStreak();
    const sc = document.getElementById('streakContainer');
    if (sc) { if (streak >= 1) { sc.style.display = 'flex'; document.getElementById('streakText').innerText = streak + (streak === 1 ? ' день' : streak < 5 ? ' дня' : ' дней') + ' подряд'; document.getElementById('streakNumber').innerText = streak; } else { sc.style.display = 'none'; } }

    // History
    [...dates].reverse().forEach(date => {
        const val = h[date]; const m = moodMap[val]; if(!c||!m) return;
        let commentHtml = comments[date] ? `<div class="history-comment">"${comments[date]}"</div>` : '';
        c.innerHTML += `<div class="history-item"><div><span style="font-weight:600;color:var(--text-header)">${new Date(date).toLocaleDateString()}</span>${commentHtml}</div><span style="padding:4px 10px;border-radius:8px;font-size:13px;font-weight:600;background:${m.bg};color:${m.color};">${m.text}</span></div>`;
    });

    // Chart
    const recentDates = dates.slice(-30);
    const pieChart = document.getElementById('pieChart');
    if (pieChart && recentDates.length > 0) {
        const counts = {5:0,4:0,3:0,2:0,1:0}; recentDates.forEach(d => counts[h[d]]++);
        const legend = document.getElementById('chart-legend'); if(legend) legend.innerHTML = '';
        const slices = [];
        [5,4,3,2,1].forEach(lvl => { if(counts[lvl] > 0) { const pct = Math.round((counts[lvl] / recentDates.length) * 100); slices.push({ value: counts[lvl], color: moodMap[lvl].color, shadow: moodMap[lvl].shadow }); if(legend) legend.innerHTML += `<div class="legend-item"><div style="display:flex;align-items:center;"><span class="legend-marker" style="background:${moodMap[lvl].color}"></span><span>${moodMap[lvl].text}</span></div><span>${pct}%</span></div>`; } });
        draw3DPieChart(slices); document.getElementById('empty-chart-msg').style.display = 'none';
    } else if(pieChart) { const ctx = pieChart.getContext('2d'); ctx.clearRect(0,0,300,150); document.getElementById('empty-chart-msg').style.display = 'block'; }
}

function draw3DPieChart(slices) {
    const canvas = document.getElementById('pieChart'); if(!canvas) return; const ctx = canvas.getContext('2d'); const dpr = window.devicePixelRatio || 1; const rect = canvas.getBoundingClientRect(); canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; ctx.scale(dpr, dpr);
    const cx = rect.width / 2, cy = rect.height / 2, rx = 120, ry = 75, depth = 35; ctx.clearRect(0, 0, rect.width, rect.height); const total = slices.reduce((a, s) => a + s.value, 0); let currentAngle = -Math.PI / 2;
    slices.forEach(slice => { const sa = (slice.value / total) * 2 * Math.PI; const ea = currentAngle + sa; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, currentAngle, ea); ctx.lineTo(cx + rx * Math.cos(ea), cy + ry * Math.sin(ea) + depth); ctx.ellipse(cx, cy + depth, rx, ry, 0, ea, currentAngle, true); ctx.lineTo(cx + rx * Math.cos(currentAngle), cy + ry * Math.sin(currentAngle)); ctx.fillStyle = slice.shadow; ctx.fill(); currentAngle += sa; });
    currentAngle = -Math.PI / 2; slices.forEach(slice => { const sa = (slice.value / total) * 2 * Math.PI; const ea = currentAngle + sa; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.ellipse(cx, cy, rx, ry, 0, currentAngle, ea); ctx.closePath(); ctx.fillStyle = slice.color; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = document.body.classList.contains('dark-mode') ? '#1E1E1E' : '#FFFFFF'; ctx.stroke(); currentAngle += sa; });
}

// ============================================
// 📊 WEEKLY AI REPORT
// ============================================
function requestWeeklyReport() {
    const currentBal = parseInt(localStorage.getItem('user_balance_cache') || '0');
    if (currentBal < 1) { showPaywall('report'); return; }
    
    const modal = document.getElementById('reportModal');
    const content = document.getElementById('reportContent');
    modal.style.display = 'flex';
    content.innerHTML = '<div class="report-loading"><span class="material-icons-round">sync</span><p style="margin-top:12px;color:var(--text-muted);">AI анализирует вашу неделю...</p></div>';
    
    const h = JSON.parse(localStorage.getItem('mood_history_v2') || '{}');
    const comments = JSON.parse(localStorage.getItem('mood_comments') || '{}');
    const moodSummary = Object.entries(h).slice(-7).map(([d,v]) => `${d}: ${v}/5${comments[d] ? ' — "'+comments[d]+'"' : ''}`).join(', ');
    
    fetch(GOOGLE_SCRIPT_URL + '?act=api', { method: 'POST', body: JSON.stringify({ initData: tg.initData, action: 'weekly_report', moodData: moodSummary }) })
    .then(r => r.json()).then(d => {
        if (d.status === 'success' && d.text) {
            content.innerHTML = '<div class="report-content">' + parseMd(d.text) + '</div>';
            if (d.balance !== undefined) updateLocalBalance(d.balance);
        }
        else { content.innerHTML = '<p style="color:var(--text-muted);text-align:center;">Недостаточно данных для отчёта. Пользуйтесь дневником хотя бы 3 дня.</p>'; }
    }).catch(() => { content.innerHTML = '<p style="color:var(--text-muted);text-align:center;">Ошибка сети</p>'; });
}

// ============================================
// 🎁 REFERRAL
// ============================================
function showReferral() {
    document.getElementById('referralLink').innerText = `https://t.me/${botUsername}?start=ref_${userId}`;
    document.getElementById('referralModal').style.display = 'flex';
}
function copyReferralLink() {
    const link = document.getElementById('referralLink').innerText;
    navigator.clipboard.writeText(link).then(() => { if(tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success'); alert('Ссылка скопирована!'); });
}

// ============================================
