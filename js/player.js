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
let isDraggingSlider = false;
let shakaPlayerInstance;

let seekDuration = parseInt(localStorage.getItem("global_seek_duration")) || 10;

function initPlayerEngine() {
  document.getElementById("player-title").innerText = mediaItem.name || "VISION TV Live Premium";

  document.getElementById("btn-rewind-action").onclick = () => { video.currentTime -= seekDuration; triggerOSDVisibility(); };
  document.getElementById("btn-forward-action").onclick = () => { video.currentTime += seekDuration; triggerOSDVisibility(); };

  // معالجة وإحكام سحب شريط تقدم البث بالماوس أو اللمس نسبة وتناسب بالملي
  if(timelineZone) {
    timelineZone.addEventListener("mousedown", (e) => { isDraggingSlider = true; updateSliderPositionOnEvent(e); });
    window.addEventListener("mousemove", (e) => { if(isDraggingSlider) updateSliderPositionOnEvent(e); });
    window.addEventListener("mouseup", () => { isDraggingSlider = false; });

    timelineZone.addEventListener("touchstart", (e) => { isDraggingSlider = true; updateSliderPositionOnEvent(e); });
    window.addEventListener("touchmove", (e) => { if(isDraggingSlider) updateSliderPositionOnEvent(e); });
    window.addEventListener("touchend", () => { isDraggingSlider = false; });
  }

  // تهيئة Shaka Player مع إعدادات متقدمة تمنع التقطيع (توسيع البافر)
  shakaPlayerInstance = new shaka.Player(video);
  
  // ضبط البافر لمنع التقطيع نهائياً في الاتصالات المتوسطة وقصيرة المدى
  shakaPlayerInstance.configure({
    streaming: {
      bufferingGoal: 30, // تخزين 30 ثانية مسبقاً لمنع التقطيع
      rebufferingGoal: 10,
      bufferBehind: 15
    }
  });

  shakaPlayerInstance.load(mediaItem.url || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8").then(() => {
    populateQualityTracks();
  }).catch(err => console.error("Error loading stream safely", err));
  
  const savedTime = localStorage.getItem(`timestamp_media_${mediaItem.id || 201}`);
  if(savedTime && mediaItem.type !== "live") video.currentTime = parseFloat(savedTime);
  
  video.play();
  video.addEventListener("timeupdate", onVideoTimeUpdateSync);
}

function populateQualityTracks() {
  const selector = document.getElementById("quality-selector"); if(!selector) return;
  if(!shakaPlayerInstance) return;
  
  // جلب مسارات الجودة المتوفرة ديناميكياً من البث
  const tracks = shakaPlayerInstance.getVariantTracks();
  // تصفية الجودات الفريدة لتجنب تكرار الخيارات في التلفزيون
  const resolutions = new Set();
  tracks.forEach(t => { if(t.height) resolutions.add(t.height); });
  
  resolutions.forEach(res => {
    const opt = document.createElement("option"); opt.value = res; opt.innerText = res + "p";
    selector.appendChild(opt);
  });
}

function switchVideoQuality(heightValue) {
  if(!shakaPlayerInstance) return;
  if(heightValue === "auto") {
    shakaPlayerInstance.configure({ abr: { enabled: true } });
  } else {
    shakaPlayerInstance.configure({ abr: { enabled: false } });
    const targetHeight = parseInt(heightValue);
    const tracks = shakaPlayerInstance.getVariantTracks().filter(t => t.height === targetHeight);
    if(tracks.length > 0) shakaPlayerInstance.selectVariantTrack(tracks[0], true);
  }
}

function updateSliderPositionOnEvent(e) {
  const rect = timelineZone.getBoundingClientRect();
  let clientX = e.clientX || (e.touches && e.touches[0].clientX);
  let percentage = (clientX - rect.left) / rect.width;
  if(percentage < 0) percentage = 0; if(percentage > 1) percentage = 1;

  fillBar.style.width = (percentage * 100) + '%';
  knob.style.left = (percentage * 100) + '%';
  if(video.duration) video.currentTime = percentage * video.duration;
  triggerOSDVisibility();
}

function onVideoTimeUpdateSync() {
  if(isDraggingSlider) return;
  currTimeLbl.innerText = formatSecondsToTimeStr(video.currentTime);
  totalTimeLbl.innerText = formatSecondsToTimeStr(video.duration);
  if (video.duration) {
    const pct = (video.currentTime / video.duration) * 100;
    fillBar.style.width = `${pct}%`;
    knob.style.left = `${pct}%`;
    
    localStorage.setItem(`timestamp_media_${mediaItem.id || 201}`, video.currentTime);
    localStorage.setItem(`progress_ratio_media_${mediaItem.id || 201}`, pct);
  }
}

function togglePlayPauseState() {
  if (video.paused) { video.play(); playIcon.innerText = "pause"; }
  else { video.pause(); playIcon.innerText = "play_arrow"; }
}

function triggerPlaybackSpeedCycle() {
  if (currentSpeed === 1.0) currentSpeed = 1.25;
  else if (currentSpeed === 1.25) currentSpeed = 1.5;
  else if (currentSpeed === 1.5) currentSpeed = 2.0;
  else if (currentSpeed === 2.0) currentSpeed = 0.5;
  else currentSpeed = 1.0;
  video.playbackRate = currentSpeed; speedBtn.innerText = currentSpeed + "x";
}

function navigateEpisodesStream(direction) {
  let currentIndex = parseInt(localStorage.getItem("current_ep_index")) || 0;
  let nextIndex = currentIndex + direction;
  if(nextIndex < 0) return;
  localStorage.setItem("current_ep_index", nextIndex);
  window.location.reload();
}

function formatSecondsToTimeStr(secs) {
  if (isNaN(secs)) return "00:00:00";
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

document.addEventListener("keydown", (e) => {
  triggerOSDVisibility();
  if (e.key === "Enter" || e.key === " ") { togglePlayPauseState(); e.preventDefault(); }
  if (e.key === "ArrowLeft") { video.currentTime -= seekDuration; }
  if (e.key === "ArrowRight") { video.currentTime += seekDuration; }
  if (e.key === "Backspace") { window.location.href = "index.html"; }
});

function triggerOSDVisibility() {
  document.getElementById("controls-panel").style.opacity = "1"; clearTimeout(osdTimeout);
  osdTimeout = setTimeout(() => { document.getElementById("controls-panel").style.opacity = "0"; }, 4000);
}

window.onload = function() {
  const activeTheme = localStorage.getItem('selected-theme') || 'theme-netflix';
  document.getElementById('player-html').className = activeTheme; 
  initPlayerEngine();
};
