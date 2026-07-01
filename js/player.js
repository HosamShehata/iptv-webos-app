const video = document.getElementById("video");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");

const channel = JSON.parse(localStorage.getItem("current"));

let player;

async function init() {

  if (!channel) {
    errorBox.innerText = "No channel selected";
    return;
  }

  loading.style.display = "block";

  try {

    // تشغيل Shaka
    player = new shaka.Player(video);

    // error handling
    player.addEventListener("error", onError);

    // buffering indicator
    video.addEventListener("waiting", () => {
      loading.style.display = "block";
    });

    video.addEventListener("playing", () => {
      loading.style.display = "none";
    });

    // load stream
    await player.load(channel.url);

    video.play();

    // حفظ آخر مشاهدة
    localStorage.setItem("lastWatched", JSON.stringify(channel));

  } catch (e) {
    onError(e);
  }

}

// Error handler + retry
function onError(error) {

  console.error(error);

  errorBox.innerText = "Stream error... retrying in 3s";

  loading.style.display = "none";

  setTimeout(() => {

    errorBox.innerText = "";
    init();

  }, 3000);

}

// back button support
document.addEventListener("keydown", function(e) {

  if (e.key === "Backspace") {
    window.location.href = "index.html";
  }

});

init();
