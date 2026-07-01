const video = document.getElementById("video");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const fillBar = document.getElementById("fill-bar");
const currTimeLbl = document.getElementById("current-time");
const totalTimeLbl = document.getElementById("total-time");

const channel = JSON.parse(localStorage.getItem("current"));
let player;
const SEEK_SEC = 10; 

async function initPlayer() {
  if (!channel) { errorBox.innerText = "خطأ في جلب الرابط."; return; }
  document.getElementById("player-title").innerText = channel.name;
  loading.style.display = "block";

  try {
    player = new shaka.Player(video);
    player.addEventListener("error", (e) => onPlayerError(e));

    video.addEventListener("waiting", () => loading.style.display = "block");
    video.addEventListener("playing", () => loading.style.display = "none");
    
    // تحديث التايم لاين تلقائياً (شاشة 7)
    video.addEventListener("timeupdate", updateTimeline);

    await player.load(channel.url);
    video.play();
    
    // إضافة لتابع المشاهدة في الرئيسية
    let history = JSON.parse(localStorage.getItem("watch_history")) || [];
    history = history.filter(h => h.url !== channel.url);
    history.unshift(channel);
    localStorage.setItem("watch_history", JSON.stringify(history.slice(0, 30)));

  } catch (e) { onPlayerError(e); }
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return "00:00:00";
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours().toString().padStart(2, '0');
  const mm = date.getUTCMinutes().toString().padStart(2, '0');
  const ss = date.getUTCSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function updateTimeline() {
  currTimeLbl.innerText = formatTime(video.currentTime);
  totalTimeLbl.innerText = formatTime(video.duration);
  if (video.duration) {
    const pct = (video.currentTime / video.duration) * 100;
    fillBar.style.width = `${pct}%`;
  }
}

function onPlayerError(e) {
  console.error(e);
  errorBox.innerText = "خطأ في البث.. جاري إعادة المحاولة تلقائياً بعد 3 ثوانٍ";
  loading.style.display = "none";
  setTimeout(() => { errorBox.innerText = ""; initPlayer(); }, 3000);
}

document.addEventListener("keydown", function(e) {
  const playIcon = document.getElementById("icon-play");

  if (e.key === "Enter" || e.key === " ") {
    if (video.paused) { video.play(); playIcon.innerText = "pause"; }
    else { video.pause(); playIcon.innerText = "play_arrow"; }
  }
  if (e.key === "ArrowLeft") {
    video.currentTime = Math.max(0, video.currentTime - SEEK_SEC);
  }
  if (e.key === "ArrowRight") {
    video.currentTime = Math.min(video.duration || Infinity, video.currentTime + SEEK_SEC);
  }
  if (e.key === "Backspace" || e.key === "Escape") {
    window.location.href = "index.html";
  }
});

window.onload = initPlayer;
