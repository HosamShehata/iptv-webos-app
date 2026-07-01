const video = document.getElementById("video");

const channel = JSON.parse(localStorage.getItem("current"));

if (channel) {

  async function initPlayer() {

    const player = new shaka.Player(video);

    player.addEventListener('error', (e) => {
      console.error('Error', e);
    });

    try {
      await player.load(channel.url);
      video.play();
    } catch (e) {
      console.error("Load failed", e);
    }

  }

  initPlayer();
}
