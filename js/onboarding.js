// 🎓 ONBOARDING
// ============================================
let currentObSlide = 0;
function initOnboarding() {
    if (!localStorage.getItem('onboarding_done')) {
        document.getElementById('onboardingOverlay').style.display = 'flex';
    }
}
function nextOnboardingSlide() {
    const slides = document.querySelectorAll('.onboarding-slide');
    const dots = document.querySelectorAll('.ob-dot');
    if (currentObSlide >= slides.length - 1) { finishOnboarding(); return; }
    slides[currentObSlide].classList.remove('active'); slides[currentObSlide].classList.add('prev');
    dots[currentObSlide].classList.remove('active');
    currentObSlide++;
    slides[currentObSlide].classList.remove('next'); slides[currentObSlide].classList.add('active');
    dots[currentObSlide].classList.add('active');
    if (currentObSlide === slides.length - 1) document.getElementById('obBtn').innerText = 'Начать';
}
function finishOnboarding() {
    localStorage.setItem('onboarding_done', '1');
    document.getElementById('onboardingOverlay').style.display = 'none';
    if(tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

// ============================================
