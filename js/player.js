const video = document.getElementById("video");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");

const channel = JSON.parse(localStorage.getItem("current"));
let player;
const SEEK_INTERVAL = 10; 

async function init() {
  if (!channel) {
    errorBox.innerText = "لم يتم اختيار مادة للتشغيل";
    return;
  }

  loading.style.display = "block";

  try {
    player = new shaka.Player(video);
    player.addEventListener("error", onError);

    video.addEventListener("waiting", () => { loading.style.display = "block"; });
    video.addEventListener("playing", () => { loading.style.display = "none"; });

    await player.load(channel.url);
    video.play();

  } catch (e) {
    onError(e);
  }
}

function onError(error) {
  console.error("Shaka Player Error:", error);
  errorBox.innerText = "حدث خطأ في البث.. جاري إعادة المحاولة تلقائياً";
  loading.style.display = "none";

  setTimeout(() => {
    errorBox.innerText = "";
    init(); 
  }, 3000);
}

// الملاحة والتحكم بالمشغل بالريموت
document.addEventListener("keydown", function(e) {
  if (e.key === "Backspace" || e.key === "Escape") {
    window.location.href = "index.html";
  }

  if (e.key === "Enter" || e.key === " ") {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  if (e.key === "ArrowLeft") {
    video.currentTime = Math.max(0, video.currentTime - SEEK_INTERVAL);
  }

  if (e.key === "ArrowRight") {
    video.currentTime = Math.min(video.duration || Infinity, video.currentTime + SEEK_INTERVAL);
  }
});

init();
