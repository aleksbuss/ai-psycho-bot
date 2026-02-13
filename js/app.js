// 🚀 INIT
// ============================================
checkDiaryStatus();
initTheme();
initBalanceDisplay();
initMusicPlayer();
initOnboarding();
checkAchievements();

// Mark breath done on first use
const origToggle = toggleBreathing;
// We handle breath achievement in startBreathingTimer already - just set flag:
const _origStartBreath = startBreathingTimer;
startBreathingTimer = function() { localStorage.setItem('breath_done', '1'); _origStartBreath(); };

// Mark SOS done
const _origNextSos = nextSos;
