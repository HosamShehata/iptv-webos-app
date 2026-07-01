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

// قراءة ثواني القفز وتطبيقها بشكل كامل لحد 60 ثانية من لوحة التحكم والأسهم
let seekDuration = parseInt(localStorage.getItem("global_seek_duration")) || 10;

function initPlayer() {
  document.getElementById("player-html-tag").setAttribute("dir", currentLang === "ar" ? "rtl" : "ltr");
  document.getElementById("player-title").innerText = mediaItem.name || "VISION TV Stream";

  document.getElementById("btn-rewind-action").onclick = () => { video.currentTime -= seekDuration; showOSD(); };
  document.getElementById("btn-forward-action").onclick = () => { video.currentTime += seekDuration; showOSD(); };

  if(timelineZone) {
    timelineZone.addEventListener("click", (e) => {
      const rect = timelineZone.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      if(video.duration) video.currentTime = pct * video.duration;
    });
  }

  let player = new shaka.Player(video);
  player.load(mediaItem.url || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
  
  const savedTime = localStorage.getItem(`timestamp_media_${mediaItem.id || 905}`);
  if(savedTime) video.currentTime = parseFloat(savedTime);
  
  video.play();
  video.addEventListener("timeupdate", updateTimeline);
}

function updateTimeline() {
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
  
  video.playbackRate = currentSpeed;
  speedBtn.innerText = currentSpeed + "x";
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
  document.getElementById("controls-panel").style.opacity = "1";
  clearTimeout(osdTimeout);
  osdTimeout = setTimeout(() => { document.getElementById("controls-panel").style.opacity = "0"; }, 4000);
}

window.onload = initPlayer;
