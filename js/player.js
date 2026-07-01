const video = document.getElementById("video");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const fillBar = document.getElementById("fill-bar");
const currTimeLbl = document.getElementById("current-time");
const totalTimeLbl = document.getElementById("total-time");
const timelineZone = document.getElementById("timeline-click-zone");
const playIcon = document.getElementById("icon-play");

const channel = JSON.parse(localStorage.getItem("current"));
let player;

// جلب قيمة وقت التقديم والتأخير المخصصة من الإعدادات (الافتراضي 10 ثوانٍ)
let seekDuration = parseInt(localStorage.getItem("global_seek_duration")) || 10;

async function initPlayer() {
  if (!channel) return;
  document.getElementById("player-title").innerText = channel.name;
  loading.style.display = "block";

  // تمكين التقديم والتأخير بنظام الضغط باللمس أو الماوس مباشرة على أي نقطة في البار
  if(timelineZone) {
    timelineZone.addEventListener("click", function(e) {
      const rect = timelineZone.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      if(video.duration) {
        video.currentTime = clickPosition * video.duration;
      }
    });
  }

  try {
    player = new shaka.Player(video);
    player.addEventListener("error", (e) => onPlayerError(e));

    video.addEventListener("waiting", () => loading.style.display = "block");
    video.addEventListener("playing", () => loading.style.display = "none");
    video.addEventListener("timeupdate", updateTimeline);
    
    // تشغيل الحلقة التالية تلقائياً عند انتهاء الحالية
    video.addEventListener("ended", playNextEpisodeAutomatically);

    await player.load(channel.url);
    
    // استدعاء ميزة استكمال القراءة الذكية من نفس الثانية المفقودة
    const savedTime = localStorage.getItem(`timestamp_media_${channel.id || 905}`);
    if (savedTime) {
      const isAr = localStorage.getItem("app_lang") === "ar";
      if (confirm(isAr ? "هل تريد الاستمرار من حيث توقفت؟" : "Do you want to resume from where you left?")) {
        video.currentTime = parseFloat(savedTime);
      }
    }
    video.play();
  } catch (e) { onPlayerError(e); }
}

function updateTimeline() {
  currTimeLbl.innerText = formatTime(video.currentTime);
  totalTimeLbl.innerText = formatTime(video.duration);
  if (video.duration) {
    fillBar.style.width = `${(video.currentTime / video.duration) * 100}%`;
    // تخزين الموضع الحالي للمادة بالثانية دورياً
    localStorage.setItem(`timestamp_media_${channel.id || 905}`, video.currentTime);
  }
}

function togglePlayPause() {
  if (video.paused) { video.play(); playIcon.innerText = "pause"; }
  else { video.pause(); playIcon.innerText = "play_arrow"; }
}

function seekBack() { video.currentTime = Math.max(0, video.currentTime - seekDuration); }
function seekForward() { video.currentTime = Math.min(video.duration || Infinity, video.currentTime + seekDuration); }

function playNextEpisodeAutomatically() {
  let currentIndex = parseInt(localStorage.getItem("current_ep_index"));
  let episodes = JSON.parse(localStorage.getItem("episodes_pack"));
  
  if(episodes && currentIndex + 1 < episodes.length) {
    let nextEp = episodes[currentIndex + 1];
    localStorage.setItem("current_ep_index", currentIndex + 1);
    localStorage.setItem(`last_ep_for_series_905`, nextEp.id); // حفظ التنشيط للمسلسل
    
    const media = { name: nextEp.title, url: nextEp.url, id: nextEp.id };
    localStorage.setItem("current", JSON.stringify(media));
    window.location.reload();
  } else {
    alert(localStorage.getItem("app_lang") === "ar" ? "وصلت لنهاية المسلسل" : "End of series reached");
  }
}

function onPlayerError(e) {
  console.error(e);
  errorBox.innerText = "خطأ في تشغيل البث، جاري المحاولة...";
  loading.style.display = "none";
}

function formatTime(secs) {
  if (isNaN(secs)) return "00:00:00";
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// السيطرة المباشرة على الأزرار وضغط الـ OK
document.addEventListener("keydown", function(e) {
  if (e.key === "Enter" || e.key === " ") { togglePlayPause(); }
  if (e.key === "ArrowLeft") { seekBack(); }
  if (e.key === "ArrowRight") { seekForward(); }
  if (e.key === "Backspace" || e.key === "Escape") { window.location.href = "details.html"; }
});

window.onload = initPlayer;
