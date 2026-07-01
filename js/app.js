let channels = [];

function loadPlaylist() {

  const url = document.getElementById("m3uUrl").value;

  fetch(url)
    .then(res => res.text())
    .then(data => {

      channels = parseM3U(data);
      renderChannels();

    });

}

// تحويل M3U إلى قنوات
function parseM3U(data) {

  const lines = data.split("\n");
  const result = [];

  for (let i = 0; i < lines.length; i++) {

    if (lines[i].startsWith("#EXTINF")) {

      const name = lines[i].split(",")[1];
      const url = lines[i + 1];

      result.push({ name, url });

    }

  }

  return result;
}

// عرض القنوات
function renderChannels() {

  const container = document.getElementById("channels");
  container.innerHTML = "";

  channels.forEach(ch => {

    const div = document.createElement("div");

    div.innerText = ch.name;

    div.style.padding = "15px";
    div.style.margin = "10px";
    div.style.background = "#222";
    div.style.color = "white";
    div.style.cursor = "pointer";

    div.onclick = function () {
      localStorage.setItem("current", JSON.stringify(ch));
      window.location.href = "player.html";
    };

    container.appendChild(div);

  });

}
