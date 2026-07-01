const video = document.getElementById("video");
const fillBar = document.getElementById("fill-bar");
const knob = document.getElementById("progress-knob");
const currTimeLbl = document.getElementById("current-time");
const totalTimeLbl = document.getElementById("total-time");
const playIcon = document.getElementById("icon-play");
const speedBtn = document.getElementById("speed-label-btn");
const timelineZone = document.getElementById("timeline-click-zone");
const nextPopup = document.getElementById("next-ep-popup");

let mediaItem = JSON.parse(localStorage.getItem("current")) || {};
let currentSpeed = 1.0; let osdTimeout;
let isDraggingSlider = false; let shakaPlayerInstance;
let seekDuration = parseInt(localStorage.getItem("global_seek_duration")) || 10;
let subMode = "ar";

function initPlayerEngine() {
  document.getElementById("player-title").innerText = mediaItem.name || "VISION TV Premium";
  document.getElementById("seek-lbl-osd").innerText = seekDuration + "s";

  document.getElementById("btn-rewind-action").onclick = () => { video.currentTime -= seekDuration; showOSD(); };
  document.getElementById("btn-forward-action").onclick = () => { video.currentTime += seekDuration; showOSD(); };

  if(timelineZone) {
    timelineZone.addEventListener("mousedown", (e) => { isDraggingSlider = true; updateSliderPositionOnEvent(e); });
    window.addEventListener("mousemove", (e) => { if(isDraggingSlider) updateSliderPositionOnEvent(e); });
    window.addEventListener("mouseup", () => { isDraggingSlider = false; });
  }

  shakaPlayerInstance = new shaka.Player(video);
  shakaPlayerInstance.configure({ streaming: { bufferingGoal: 30, rebufferingGoal: 10, bufferBehind: 15 } });
  shakaPlayerInstance.load(mediaItem.url || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8").catch(err => console.error(err));
  
  video.addEventListener("timeupdate", onVideoTimeUpdateSync);
  
  // تفعيل وإظهار البار الـ OSD فوراً عند عمل سكرول (Scroll) بالماوس أو الريموت الماجيك
  window.addEventListener("wheel", () => { showOSD(); });
}

function updateSliderPositionOnEvent(e) {
  const rect = timelineZone.getBoundingClientRect();
  let percentage = (e.clientX - rect.left) / rect.width;
  if(percentage < 0) percentage = 0; if(percentage > 1) percentage = 1;
  fillBar.style.width = (percentage * 100) + '%';
  knob.style.left = (percentage * 100) + '%';
  if(video.duration) video.currentTime = percentage * video.duration;
  showOSD();
}

function onVideoTimeUpdateSync() {
  if(isDraggingSlider) return;
  currTimeLbl.innerText = formatSecondsToTimeStr(video.currentTime);
  totalTimeLbl.innerText = formatSecondsToTimeStr(video.duration);
  if (video.duration) {
    const pct = (video.currentTime / video.duration) * 100;
    fillBar.style.width = `${pct}%`; knob.style.left = `${pct}%`;
    localStorage.setItem(`timestamp_media_${mediaItem.id || 201}`, video.currentTime);
    localStorage.setItem(`progress_ratio_media_${mediaItem.id || 201}`, pct);

    // مراقبة آخر 60 ثانية واقتراح الحلقة القادمة باسمها الصريح بالتزامن مع الـ OSD بالملي
    const timeLeft = video.duration - video.currentTime;
    if (timeLeft <= 60 && timeLeft > 2) {
      if (document.getElementById("controls-panel").style.opacity === "1") {
        nextPopup.style.display = "block";
      } else {
        nextPopup.style.display = "none";
      }
    } else {
      nextPopup.style.display = "none";
    }
  }
}

function togglePlayPauseState() {
  if (video.paused) { video.play(); playIcon.innerText = "pause"; }
  else { video.pause(); playIcon.innerText = "play_arrow"; }
}

function triggerPlaybackSpeedCycle() {
  currentSpeed = currentSpeed === 2.0 ? 0.5 : currentSpeed + 0.5;
  video.playbackRate = currentSpeed; speedBtn.innerText = currentSpeed + "x";
}

function cycleSubtitles() {
  subMode = subMode === "ar" ? "en" : (subMode === "en" ? "off" : "ar");
  document.getElementById("sub-label-btn").innerText = subMode === "off" ? "الترجمة: إيقاف" : `الترجمة: ${subMode.toUpperCase()}`;
}

function changeOSDSeekStep() {
  seekDuration = seekDuration === 60 ? 5 : (seekDuration === 30 ? 60 : seekDuration + 10);
  localStorage.setItem("global_seek_duration", seekDuration);
  document.getElementById("seek-lbl-osd").innerText = seekDuration + "s";
}

function navigateEpisodesStream(direction) {
  alert(direction > 0 ? "جاري قفز وتشغيل الحلقة التالية رأسياً..." : "جاري تشغيل الحلقة السابقة...");
  window.location.reload();
}

function formatSecondsToTimeStr(secs) {
  if (isNaN(secs)) return "00:00:00";
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// السيطرة على الاتجاهات الأربعة لريموت LG وفصلها لتعمل كأوامر صريحة
document.addEventListener("keydown", (e) => {
  showOSD();
  // يمين ويسار للتقديم والتأخير
  if (e.key === "ArrowLeft") { video.currentTime -= seekDuration; e.preventDefault(); }
  if (e.key === "ArrowRight") { video.currentTime += seekDuration; e.preventDefault(); }
  // فوق وتحت للانتقال للحلقة التالية والسابقة فورا
  if (e.key === "ArrowUp") { navigateEpisodesStream(1); e.preventDefault(); }
  if (e.key === "ArrowDown") { navigateEpisodesStream(-1); e.preventDefault(); }
  
  if (e.key === "Enter" || e.key === "Ok") { togglePlayPauseState(); e.preventDefault(); }
  if (e.key === "Backspace") { window.location.href = "index.html"; }
});

function showOSD() {
  document.getElementById("controls-panel").style.opacity = "1";
  const timeLeft = video.duration - video.currentTime;
  if (timeLeft <= 60 && timeLeft > 2) nextPopup.style.display = "block";
  
  clearTimeout(osdTimeout);
  // اختفاء تلقائي ناعم بعد 3 ثوانٍ بالضبط من الثبات كالمطلوب بالملي
  osdTimeout = setTimeout(() => {
    document.getElementById("controls-panel").style.opacity = "0";
    nextPopup.style.display = "none";
  }, 3000);
}

window.onload = function() {
  const activeTheme = localStorage.getItem('selected-theme') || 'theme-netflix';
  document.getElementById('player-html').className = activeTheme;
  initPlayerEngine();
  showOSD();
};
