// 🎵 MUSIC PLAYER
// ============================================
const meditationTracks = [
    { title: "Глубокая декомпрессия", author: "Релакс", file: "готовый.mp3", duration: "12:49" },
    { title: "Нейросброс", author: "Релакс", file: "2.mp3", duration: "10:53" },
    { title: "Внутренняя тишина", author: "Релакс", file: "третий.mp3", duration: "13:27" },
    { title: "Телесная свобода", author: "Релакс", file: "третий.mp3", duration: "13:27" },
    { title: "Внутренняя тишина", author: "Релакс", file: "четвертый.mp3", duration: "11:07" },
    { title: "Источник тепла", author: "Релакс", file: "пятый.mp3", duration: "12:57" },
    { title: "Снятие зажимов", author: "Релакс", file: "шестой.mp3", duration: "14:02" },
    { title: "Точка баланса", author: "Релакс", file: "седьмой.mp3", duration: "13:17" },
    { title: "Абсолютная прозрачность", author: "Релакс", file: "восьмой.mp3", duration: "13:51" },
];
let currentTrackIndex = -1, audioPlayer = new Audio(), isPlaying = false;

function initMusicPlayer() {
    const list = document.getElementById('playlist-box'); if(!list) return; list.innerHTML = '';
    meditationTracks.forEach((track, index) => {
        const div = document.createElement('div'); div.className = 'track-item'; div.id = `track-${index}`; div.onclick = () => playTrack(index);
        div.innerHTML = `<div class="track-icon-box"><span class="material-icons-round">play_arrow</span></div><div class="track-info"><h4>${track.title}</h4><span>${track.author} • ${track.duration}</span></div>`;
        list.appendChild(div);
    });
    audioPlayer.onended = () => { if (currentTrackIndex < meditationTracks.length - 1) playTrack(currentTrackIndex + 1); else { isPlaying = false; updatePlayerUI(); } };
    audioPlayer.ontimeupdate = updateProgressBar;
}
function playTrack(index) { if (currentTrackIndex === index && isPlaying) { pauseMusic(); return; } currentTrackIndex = index; audioPlayer.src = `./audio/${meditationTracks[index].file}`; audioPlayer.volume = (document.getElementById('volumeSlider')?.value || 80) / 100; audioPlayer.play().then(() => { isPlaying = true; updatePlayerUI(); }).catch(e => {}); }
function toggleMusic() { if (currentTrackIndex === -1) { playTrack(0); return; } if (isPlaying) pauseMusic(); else audioPlayer.play().then(() => { isPlaying = true; updatePlayerUI(); }); }
function pauseMusic() { audioPlayer.pause(); isPlaying = false; updatePlayerUI(); }
function updatePlayerUI() {
    const titleEl = document.getElementById('player-track-title'); const authorEl = document.getElementById('player-track-author'); const iconEl = document.getElementById('player-btn-icon'); const artEl = document.getElementById('playerArt');
    if (currentTrackIndex !== -1) { titleEl.innerText = meditationTracks[currentTrackIndex].title; authorEl.innerText = meditationTracks[currentTrackIndex].author; }
    if (isPlaying) { iconEl.innerText = 'pause'; artEl.classList.add('playing'); } else { iconEl.innerText = 'play_arrow'; artEl.classList.remove('playing'); }
    document.querySelectorAll('.track-item').forEach((el, idx) => { if (idx === currentTrackIndex) { el.classList.add('active-track'); el.querySelector('.material-icons-round').innerText = isPlaying ? 'graphic_eq' : 'play_arrow'; } else { el.classList.remove('active-track'); el.querySelector('.material-icons-round').innerText = 'play_arrow'; } });
}
function formatTime(s) { if (!s || isNaN(s)) return '0:00'; const m = Math.floor(s/60); const sec = Math.floor(s%60); return m + ':' + (sec<10?'0':'') + sec; }
function updateProgressBar() { if (!audioPlayer.duration) return; const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100; document.getElementById('player-progress').style.width = pct + '%'; document.getElementById('playerCurrentTime').innerText = formatTime(audioPlayer.currentTime); document.getElementById('playerDuration').innerText = '-' + formatTime(audioPlayer.duration - audioPlayer.currentTime); }
function seekAudio(e) { if (!audioPlayer.duration) return; audioPlayer.currentTime = (e.offsetX / e.currentTarget.clientWidth) * audioPlayer.duration; }
function setVolume(val) { audioPlayer.volume = val / 100; }
function toggleMute() { if (audioPlayer.volume > 0) { audioPlayer._prevVol = audioPlayer.volume; audioPlayer.volume = 0; document.getElementById('volumeSlider').value = 0; } else { audioPlayer.volume = audioPlayer._prevVol || 0.8; document.getElementById('volumeSlider').value = audioPlayer.volume * 100; } }

// ============================================
