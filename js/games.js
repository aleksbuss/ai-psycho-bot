// 🎈 BALLOON GAME
// ============================================
const ballCanvas = document.getElementById('balloon-game-canvas'); const bCtx = ballCanvas ? ballCanvas.getContext('2d') : null;
const dpr2 = Math.min(window.devicePixelRatio || 1, 1.5);
const cachedTarget = document.createElement('canvas'); const cachedDummy = document.createElement('canvas'); const balloonSize = 80;
cachedTarget.width = balloonSize * dpr2; cachedTarget.height = (balloonSize + 60) * dpr2;
cachedDummy.width = balloonSize * dpr2; cachedDummy.height = (balloonSize + 60) * dpr2;

function preDrawBalloon(ctx, type) { ctx.scale(dpr2, dpr2); const cx = balloonSize/2, cy = balloonSize/2, r = 35; ctx.beginPath(); ctx.moveTo(cx, cy+r); ctx.bezierCurveTo(cx+10, cy+r+20, cx-10, cy+r+40, cx, cy+r+60); ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 2; ctx.stroke(); if (type === 'target') { let g = ctx.createLinearGradient(cx, cy-r, cx, cy+r); g.addColorStop(0, '#81D4FA'); g.addColorStop(1, '#FFF59D'); ctx.fillStyle = g; } else { ctx.fillStyle = '#CFD8DC'; } ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx, cy+r-2); ctx.lineTo(cx-6, cy+r+8); ctx.lineTo(cx+6, cy+r+8); ctx.fill(); ctx.beginPath(); ctx.arc(cx, cy, r-10, -0.2*Math.PI, 0.1*Math.PI); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke(); ctx.setTransform(1, 0, 0, 1, 0, 0); }
preDrawBalloon(cachedTarget.getContext('2d'), 'target'); preDrawBalloon(cachedDummy.getContext('2d'), 'dummy');

const MAX_BALLOONS = 100; const pool = new Array(MAX_BALLOONS).fill(null).map(() => ({active:false,x:0,y:0,baseX:0,baseSpeed:0,wobble:0,type:'dummy'}));
const MAX_PARTICLES = 150; const particles = new Array(MAX_PARTICLES).fill(null).map(() => ({active:false,x:0,y:0,vx:0,vy:0,life:0,color:'#000'}));
const particleColors = ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1'];
let bScore = 0, gameStartTime = 0, isGameRunning = false, lastFrameTime = 0;

function initBalloonGame() {
    document.getElementById('game-over-modal').style.display = 'none';
    document.getElementById('record-badge').style.display = 'none';
    document.getElementById('game-icon').style.display = 'none';
    // Show tooltip first time
    if (!localStorage.getItem('game_tooltip_shown')) {
        document.getElementById('gameTooltip').style.display = 'block';
        return;
    }
    startBalloonGame();
}
function dismissTooltip() {
    localStorage.setItem('game_tooltip_shown', '1');
    document.getElementById('gameTooltip').style.display = 'none';
    startBalloonGame();
}
function startBalloonGame() {
    if (!ballCanvas || !bCtx) return;
    ballCanvas.width = window.innerWidth * dpr2; ballCanvas.height = window.innerHeight * dpr2; bCtx.scale(dpr2, dpr2);
    pool.forEach(b => b.active = false); particles.forEach(p => p.active = false);
    bScore = 0; document.getElementById('balloon-score').innerText = 0; document.getElementById('game-timer').innerText = "02:00";
    ballCanvas.addEventListener('touchstart', popBalloon, {passive: false}); ballCanvas.addEventListener('mousedown', popBalloon);
    gameStartTime = Date.now(); lastFrameTime = performance.now(); isGameRunning = true;
    requestAnimationFrame(runBalloonLoop);
}
function stopBalloonGame() { isGameRunning = false; if(ballCanvas) { ballCanvas.removeEventListener('touchstart', popBalloon); ballCanvas.removeEventListener('mousedown', popBalloon); } }
function endGame() { isGameRunning = false; const saved = parseInt(localStorage.getItem('balloon_highscore') || '0'); let isNew = bScore > saved; if (isNew) localStorage.setItem('balloon_highscore', bScore); document.getElementById('final-score').innerText = bScore; if (isNew) { document.getElementById('record-badge').style.display = 'inline-block'; document.getElementById('game-icon').style.display = 'block'; if(tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success'); } else { if(tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning'); } document.getElementById('game-over-modal').style.display = 'flex'; }
function spawnBalloon() { const b = pool.find(p => !p.active); if (!b) return; b.active = true; b.baseX = Math.random() * (window.innerWidth - 70) + 35; b.x = b.baseX; b.y = window.innerHeight + 50; b.baseSpeed = Math.random() * 2 + 2; b.wobble = Math.random() * Math.PI * 2; b.type = Math.random() < 0.6 ? 'target' : 'dummy'; }
function explodeConfetti(x, y) { let count = 0; for(let i=0;i<MAX_PARTICLES;i++) { const p = particles[i]; if(!p.active) { p.active=true;p.x=x;p.y=y;p.vx=(Math.random()-0.5)*10;p.vy=(Math.random()-0.5)*10-2;p.life=1.0;p.color=particleColors[Math.floor(Math.random()*particleColors.length)]; count++; if(count>=15)break; } } }
function runBalloonLoop(timestamp) { if (!isGameRunning) return; const elapsed = (Date.now() - gameStartTime) / 1000; const timeLeft = Math.max(0, 120 - elapsed); document.getElementById('game-timer').innerText = `${Math.floor(timeLeft/60).toString().padStart(2,'0')}:${Math.floor(timeLeft%60).toString().padStart(2,'0')}`; if (timeLeft <= 0) { endGame(); return; } let dt = (timestamp - lastFrameTime) / 1000; lastFrameTime = timestamp; if (dt > 0.1) dt = 0.1; bCtx.clearRect(0, 0, window.innerWidth, window.innerHeight); const speedMult = 1 + (Math.floor(elapsed / 30) * 0.2); if (Math.random() < 0.06 * (dt * 60)) spawnBalloon(); for (let i = 0; i < MAX_BALLOONS; i++) { const b = pool[i]; if (!b.active) continue; b.y -= b.baseSpeed * speedMult * (dt * 60); b.x = b.baseX + Math.sin(timestamp * 0.005 + b.wobble) * 50; bCtx.drawImage(b.type==='target'?cachedTarget:cachedDummy, 0, 0, cachedTarget.width, cachedTarget.height, (b.x-40)|0, (b.y-40)|0, 80, 140); if (b.y < -150) b.active = false; } for(let i=0;i<MAX_PARTICLES;i++) { const p=particles[i]; if(!p.active)continue; p.x+=p.vx*(dt*60);p.y+=p.vy*(dt*60);p.vy+=0.5*(dt*60);p.life-=0.02*(dt*60); bCtx.globalAlpha=p.life;bCtx.fillStyle=p.color;bCtx.fillRect((p.x)|0,(p.y)|0,6,6);bCtx.globalAlpha=1.0; if(p.life<=0)p.active=false; } requestAnimationFrame(runBalloonLoop); }
function popBalloon(e) { e.preventDefault(); const rect = ballCanvas.getBoundingClientRect(); let points = []; if (e.changedTouches) { for (let i=0;i<e.changedTouches.length;i++) points.push({x:e.changedTouches[i].clientX-rect.left, y:e.changedTouches[i].clientY-rect.top}); } else { points.push({x:e.clientX-rect.left, y:e.clientY-rect.top}); } points.forEach(p => { for (let i=0;i<MAX_BALLOONS;i++) { const b=pool[i]; if(!b.active)continue; if(Math.sqrt((p.x-b.x)**2+(p.y-b.y)**2)<70) { if(b.type==='target') { b.active=false;bScore++;document.getElementById('balloon-score').innerText=bScore;explodeConfetti(b.x,b.y);playSound('pop');if(tg.HapticFeedback)tg.HapticFeedback.impactOccurred('light'); } break; } } }); }

// ============================================
