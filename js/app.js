const channels = [
  {
    name: "Big Buck Bunny",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  },
  {
    name: "Sintel",
    url: "https://test-streams.mux.dev/test_001/stream.m3u8"
  },
  {
    name: "Caminandes",
    url: "https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8"
  }
];

const container = document.getElementById("channels");

// عرض القنوات
channels.forEach((ch, index) => {

  const btn = document.createElement("div");

  btn.innerText = ch.name;

  btn.style.padding = "15px";
  btn.style.margin = "10px";
  btn.style.background = "#222";
  btn.style.color = "white";
  btn.style.cursor = "pointer";

  btn.onclick = function () {
    localStorage.setItem("current", JSON.stringify(ch));
    window.location.href = "player.html";
  };

  container.appendChild(btn);

});
