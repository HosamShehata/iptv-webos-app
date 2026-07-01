const video = document.getElementById("video");
const fillBar = document.getElementById("fill-bar");
const knob = document.getElementById("progress-knob");
const currTimeLbl = document.getElementById("current-time");
const totalTimeLbl = document.getElementById("total-time");
const playIcon = document.getElementById("icon-play");
const speedBtn = document.getElementById("speed-label-btn");
const timelineZone = document.getElementById("timeline-click-zone");

let mediaItem = JSON.parse(localStorage.getItem("current")) || {};
let currentSpeed = 1.0; let osdTimeout;
let currentLang = localStorage.getItem("app_lang") || "ar";
let isDraggingSlider = false;

// جلب وتطبيق ثواني القفز بدقة شديدة تصل لـ 60 ثانية حقيقية بالملي
let seekDuration = parseInt(localStorage.getItem("global_seek_duration")) || 10;

function initPlayer() {
  document.getElementById("player-html").setAttribute("dir", currentLang === "ar" ? "rtl" : "ltr");
  document.getElementById("player-title").innerText = mediaItem.name || "VISION TV Stream";

  document.getElementById("btn-rewind-action").onclick = () => { video.currentTime -= seekDuration; showOSD(); };
  document.getElementById("btn-forward-action").onclick = () => { video.currentTime += seekDuration; showOSD(); };

  // معالجة النقر المباشر والسحب للـ Slider نسبة وتناسب لمنع مشاكل التحجيم
  if(timelineZone) {
    timelineZone.addEventListener("mousedown", (e) => { isDraggingSlider = true; handleSliderSeekUpdate(e); });
    window.addEventListener("mousemove", (e) => { if(isDraggingSlider) handleSliderSeekUpdate(e); });
    window.addEventListener("mouseup", () => { isDraggingSlider = false; });

    // دعم كامل لشاشات اللمس الخاصة بالتلفزيونات الذكية
    timelineZone.addEventListener("touchstart", (e) => { isDraggingSlider = true; handleSliderSeekUpdate(e); });
    window.addEventListener("touchmove", (e) => { if(isDraggingSlider) handleSliderSeekUpdate(e); });
    window.addEventListener("touchend", () => { isDraggingSlider = false; });
  }

  let player = new shaka.Player(video);
  player.load(mediaItem.url || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
  
  const savedTime = localStorage.getItem(`timestamp_media_${mediaItem.id || 905}`);
  if(savedTime) video.currentTime = parseFloat(savedTime);
  
  video.play();
  video.addEventListener("timeupdate", updateTimeline);
}

function handleSliderSeekUpdate(e) {
  const rect = timelineZone.getBoundingClientRect();
  let clientX = e.clientX || (e.touches && e.touches[0].clientX);
  let percentage = (clientX - rect.left) / rect.width;
  if(percentage < 0) percentage = 0; if(percentage > 1) percentage = 1;

  fillBar.style.width = (percentage * 100) + '%';
  knob.style.left = (percentage * 100) + '%';
  if(video.duration) video.currentTime = percentage * video.duration;
  showOSD();
}

function updateTimeline() {
  if(isDraggingSlider) return; // منع التداخل أثناء السحب
  currTimeLbl.innerText = formatTime(video.currentTime);
  totalTimeLbl.innerText = formatTime(video.duration);
  if (video.duration) {
    const pct = (video.currentTime / video.duration) * 100;
    fillBar.style.width = `${pct}%`;
    knob.style.left = `${pct}%`;
    
    localStorage.setItem(`timestamp_media_${mediaItem.id}`, video.currentTime);
    localStorage.setItem(`progress_ratio_media_${mediaItem.id}`, pct);
  }
}

function togglePlayPause() {
  if (video.paused) { video.play(); playIcon.innerText = "pause"; }
  else { video.pause(); playIcon.innerText = "play_arrow"; }
}

function changePlaybackSpeed() {
  if (currentSpeed === 1.0) currentSpeed = 1.25;
  else if (currentSpeed === 1.25) currentSpeed = 1.5;
  else if (currentSpeed === 1.5) currentSpeed = 2.0;
  else if (currentSpeed === 2.0) currentSpeed = 0.5;
  else currentSpeed = 1.0;
  video.playbackRate = currentSpeed; speedBtn.innerText = currentSpeed + "x";
}

function navigatePlaylistEpisodes(direction) {
  let currentIndex = parseInt(localStorage.getItem("current_ep_index")) || 0;
  let nextIndex = currentIndex + direction;
  if(nextIndex < 0) { alert("أنت في الحلقة الأولى!"); return; }
  
  localStorage.setItem("current_ep_index", nextIndex);
  alert("جاري الانتقال للحلقة التالية..."); window.location.reload();
}

function formatTime(secs) {
  if (isNaN(secs)) return "00:00:00";
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

document.addEventListener("keydown", (e) => {
  showOSD();
  if (e.key === "Enter" || e.key === " ") { togglePlayPause(); e.preventDefault(); }
  if (e.key === "ArrowLeft") { video.currentTime -= seekDuration; }
  if (e.key === "ArrowRight") { video.currentTime += seekDuration; }
  if (e.key === "Backspace") { window.location.href = "details.html"; }
});

function showOSD() {
  document.getElementById("controls-panel").style.opacity = "1"; clearTimeout(osdTimeout);
  osdTimeout = setTimeout(() => { document.getElementById("controls-panel").style.opacity = "0"; }, 4000);
}

window.onload = function() {
  const activeTheme = localStorage.getItem('selected-theme') || 'theme-netflix';
  document.getElementById('player-html').className = activeTheme; initPlayer();
};
