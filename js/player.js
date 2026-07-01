const video = document.getElementById("video");
const fillBar = document.getElementById("fill-bar");
const knob = document.getElementById("progress-knob");
const currTimeLbl = document.getElementById("current-time");
const totalTimeLbl = document.getElementById("total-time");
const nextPopup = document.getElementById("next-ep-popup");
let mediaItem = JSON.parse(localStorage.getItem("current")) || {};
let osdTimeout;

function initPlayer() {
  document.getElementById("player-title").innerText = mediaItem.name || "VISION TV";
  let shakaInstance = new shaka.Player(video);
  shakaInstance.load(mediaItem.url).catch(() => {
    shakaInstance.load("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
  });
  video.addEventListener("timeupdate", () => {
    currTimeLbl.innerText = formatTime(video.currentTime);
    totalTimeLbl.innerText = formatTime(video.duration);
    if(video.duration) {
      const pct = (video.currentTime / video.duration) * 100;
      fillBar.style.width = pct + "%"; knob.style.left = pct + "%";
      const timeLeft = video.duration - video.currentTime;
      if (timeLeft <= 60 && timeLeft > 2 && document.getElementById("controls-panel").style.opacity === "1") {
        nextPopup.style.display = "block";
      } else { nextPopup.style.display = "none"; }
    }
  });
  window.addEventListener("wheel", showOSD);
  document.addEventListener("keydown", (e) => {
    showOSD();
    if(e.key === "ArrowLeft") video.currentTime -= 10;
    if(e.key === "ArrowRight") video.currentTime += 10;
    if(e.key === "Enter" || e.key === "Ok") togglePlay();
    if(e.key === "Backspace") window.location.href = "index.html";
  });
}

function togglePlay() {
  if(video.paused) { video.play(); document.getElementById("icon-play").innerText = "pause"; }
  else { video.pause(); document.getElementById("icon-play").innerText = "play_arrow"; }
}

function showOSD() {
  document.getElementById("controls-panel").style.opacity = "1";
  clearTimeout(osdTimeout);
  osdTimeout = setTimeout(() => {
    document.getElementById("controls-panel").style.opacity = "0";
    nextPopup.style.display = "none";
  }, 3000);
}

function formatTime(secs) {
  if(isNaN(secs)) return "00:00:00";
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

window.onload = () => { initPlayer(); showOSD(); };
