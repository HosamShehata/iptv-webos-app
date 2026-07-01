let channels = [];
let favorites = JSON.parse(localStorage.getItem("fav")) || [];

// تحميل M3U
function loadPlaylist() {

  const url = document.getElementById("m3uUrl").value;

  fetch(url)
    .then(res => res.text())
    .then(data => {

      channels = parseM3U(data);
      renderAll();

    });

}

// تحويل M3U
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

// عرض الكل
function renderAll() {
  renderChannels();
  renderFavorites();
}

// عرض القنوات
function renderChannels() {

  const container = document.getElementById("channels");
  container.innerHTML = "";

  channels.forEach(ch => {

    const div = document.createElement("div");

    div.innerText = "▶ " + ch.name;

    div.style.padding = "15px";
    div.style.margin = "10px";
    div.style.background = "#222";
    div.style.color = "white";
    div.style.cursor = "pointer";

    // تشغيل القناة
    div.onclick = function () {
      localStorage.setItem("current", JSON.stringify(ch));
      window.location.href = "player.html";
    };

    // إضافة للمفضلة (ضغط مطول)
    div.oncontextmenu = function (e) {
      e.preventDefault();
      addFavorite(ch);
    };

    container.appendChild(div);

  });

}

// Favorites
function addFavorite(ch) {

  if (!favorites.find(f => f.url === ch.url)) {
    favorites.push(ch);
    localStorage.setItem("fav", JSON.stringify(favorites));
    renderFavorites();
  }

}

function renderFavorites() {

  const container = document.getElementById("favorites");
  container.innerHTML = "";

  favorites.forEach(ch => {

    const div = document.createElement("div");

    div.innerText = "⭐ " + ch.name;

    div.style.padding = "10px";
    div.style.margin = "5px";
    div.style.background = "#444";
    div.style.color = "white";

    div.onclick = function () {
      localStorage.setItem("current", JSON.stringify(ch));
      window.location.href = "player.html";
    };

    container.appendChild(div);

  });

}
