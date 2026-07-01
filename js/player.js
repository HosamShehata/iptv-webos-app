const video = document.getElementById("video");

const channel = JSON.parse(localStorage.getItem("current"));

if (channel) {
  video.src = channel.url;
  video.play();
}
