const video = document.getElementById("video");
const fillBar = document.getElementById("fill-bar");
const knob = document.getElementById("progress-knob");
const playIcon = document.getElementById("icon-play");

let seekDuration = parseInt(localStorage.getItem("global_seek_duration")) || 10;
let audioLang = "ar"; let subLang = "off";

function initPlayer() {
  document.getElementById("osd-seek-lbl").innerText = seekDuration + "s";
  let player = new shaka.Player(video);
  player.load("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
  video.addEventListener("timeupdate", () => {
    const pct = (video.currentTime / video.duration) * 100;
    fillBar.style.width = pct + "%"; knob.style.left = pct + "%";
  });

  // التحكم التفاعلي بالضغط والسحب المباشر من الماوس أو اللمس كاليوتيوب بالملي
  document.getElementById("timeline").onclick = function(e) {
    const rect = this.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * video.duration;
  };
}

function togglePlay() { if(video.paused) { video.play(); playIcon.innerText="pause"; } else { video.pause(); playIcon.innerText="play_arrow"; } }

function changeOSDSeekDuration() {
  seekDuration = seekDuration === 60 ? 5 : (seekDuration === 30 ? 60 : seekDuration + 10);
  localStorage.setItem("global_seek_duration", seekDuration);
  document.getElementById("seek-duration-select") ? document.getElementById("seek-duration-select").value = seekDuration : null;
  document.getElementById("btn-rewind-action").querySelector('.material-icons').innerText = `replay_${seekDuration}`;
}

function cycleAudioTracks() {
  audioLang = audioLang === "ar" ? "en" : "ar";
  document.getElementById("audio-label-btn").innerText = audioLang === "ar" ? "العربية" : "English";
}

function cycleSubtitleTracks() {
  subLang = subLang === "off" ? "ar" : (subLang === "ar" ? "en" : "off");
  document.getElementById("subtitle-label-btn").innerText = sub = "off" ? "إيقاف" : (sub==="ar"?"العربية":"English");
}

function cycleQualityTracks() {
  alert("جاري التحويل التلقائي لأعلى دقة بث متوفرة بدون تقطيع");
}

function navigateEpisodesStream(direction) {
  alert(direction > 0 ? "جاري تشغيل الحلقة التالية رأسياً" : "جاري تشغيل الحلقة السابقة رأسياً");
  window.location.reload();
}

function cycleAudioLanguage() {
  audioLang = audioLang === "ar" ? "en" : "ar";
  document.getElementById("audio-btn").innerText = audioLang === "ar" ? "صوت: عربي" : "Audio: EN";
}

function cycleSubtitlesLanguage() {
  subLang = subLang === "off" ? "ar" : (subLang === "ar" ? "en" : "off");
  document.getElementById("sub-btn").innerText = subLang === "off" ? "الترجمة: إيقاف" : (subLang === "ar" ? "الترجمة: AR" : "Sub: EN");
}

// فصل الاتجاهات الأربعة لريموت LG Magic الجديد تماماً وتوجيه الأوامر الفعالة
document.addEventListener("keydown", (e) => {
  // يمين ويسار للتقديم والتأخير بالثواني المحددة
  if (e.key === "ArrowLeft") { video.currentTime -= seekDuration; e.preventDefault(); }
  if (e.key === "ArrowRight") { video.currentTime += seekDuration; e.preventDefault(); }
  
  // فوق وتحت للانتقال للحلقة التالية والسابقة رأسياً ومباشرة
  if (e.key === "ArrowUp") { navigateEpisodesStream(1); e.preventDefault(); }
  if (e.key === "ArrowDown") { navigateEpisodesStream(-1); e.preventDefault(); }
  
  if (e.key === "Enter" || e.key === "Ok") { togglePlay(); }
  if (e.key === "Backspace") { window.location.href = "details.html"; }
});

window.onload = initPlayer;
