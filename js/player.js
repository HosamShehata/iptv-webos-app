const video = document.getElementById("video");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const fillBar = document.getElementById("fill-bar");
const currTimeLbl = document.getElementById("current-time");
const totalTimeLbl = document.getElementById("total-time");
const playIcon = document.getElementById("icon-play");

const channel = JSON.parse(localStorage.getItem("current"));
let player;
const SEEK_SEC = 10; // القفز 10 ثوانٍ عند التقديم/الترجيع

async function initPlayer() {
  if (!channel) { errorBox.innerText = "Error fetching stream URL."; return; }
  document.getElementById("player-title").innerText = channel.name;
  loading.style.display = "block";

  try {
    player = new shaka.Player(video);
    player.addEventListener("error", (e) => onPlayerError(e));

    video.addEventListener("waiting", () => loading.style.display = "block");
    video.addEventListener("playing", () => loading.style.display = "none");
    video.addEventListener("timeupdate", updateTimeline);

    // تشغيل الرابط الحي (سواء كان تيست أو حقيقي من السيرفر)
    await player.load(channel.url);
    video.play();
    
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

// دوال التحكم القابلة للنقر المباشر باللمس والماوس
function togglePlayPause() {
  if (video.paused) { video.play(); playIcon.innerText = "pause"; }
  else { video.pause(); playIcon.innerText = "play_arrow"; }
}

function seekBack() {
  video.currentTime = Math.max(0, video.currentTime - SEEK_SEC);
}

function seekForward() {
  video.currentTime = Math.min(video.duration || Infinity, video.currentTime + SEEK_SEC);
}

function onPlayerError(e) {
  console.error(e);
  errorBox.innerText = "حدث خطأ في البث.. جاري إعادة المحاولة تلقائياً";
  loading.style.display = "none";
  setTimeout(() => { errorBox.innerText = ""; initPlayer(); }, 3000);
}

// ربط أزرار الريموت كنترول للـ TV مع الأيقونات المضيئة
document.addEventListener("keydown", function(e) {
  document.getElementById("icon-play").classList.remove("active-focus");
  document.getElementById("icon-rewind").classList.remove("active-focus");
  document.getElementById("icon-forward").classList.remove("active-focus");

  if (e.key === "Enter" || e.key === " ") {
    document.getElementById("icon-play").classList.add("active-focus");
    togglePlayPause();
  }
  if (e.key === "ArrowLeft") {
    document.getElementById("icon-rewind").classList.add("active-focus");
    seekBack();
  }
  if (e.key === "ArrowRight") {
    document.getElementById("icon-forward").classList.add("active-focus");
    seekForward();
  }
  if (e.key === "Backspace" || e.key === "Escape") {
    window.location.href = "details.html";
  }
});

window.onload = initPlayer;
