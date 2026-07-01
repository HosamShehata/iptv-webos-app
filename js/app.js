let channels = [];
let filtered = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let lastWatched = JSON.parse(localStorage.getItem("lastWatched")) || null;

let categories = ["All", "Sports", "Movies", "News"];
let currentCategory = "All";

// EPG تجريبي
const epgData = {
  "Sports": [
    { time: "10:00", title: "Football Live" },
    { time: "12:00", title: "Sports News" }
  ],
  "Movies": [
    { time: "11:00", title: "Action Movie" },
    { time: "13:00", title: "Comedy Film" }
  ],
  "News": [
    { time: "09:00", title: "Morning News" },
    { time: "18:00", title: "Evening Update" }
  ]
};

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

// M3U Parser
function parseM3U(data) {

  const lines = data.split("\n");
  const result = [];

  for (let i = 0; i < lines.length; i++) {

    if (lines[i].startsWith("#EXTINF")) {

      const name = lines[i].split(",")[1];
      const url = lines[i + 1];

      let category = "Movies";

      if (name.toLowerCase().includes("sport")) category = "Sports";
      if (name.toLowerCase().includes("news")) category = "News";

      result.push({ name, url, category });

    }

  }

  return result;
}

// Render All
function renderAll() {
  renderCategories();
  renderChannels();
  renderFavorites();
  renderEPG();
}

// Categories
function renderCategories() {

  const box = document.getElementById("categories");
  box.innerHTML = "";

  categories.forEach(cat => {

    const div = document.createElement("div");
    div.className = "category";
    div.innerText = cat;

    div.onclick = function () {
      currentCategory = cat;
      renderChannels();
      renderEPG();
    };

    box.appendChild(div);

  });

}

// Channels
function renderChannels() {

  const search = document.getElementById("search").value.toLowerCase();

  const container = document.getElementById("channels");
  container.innerHTML = "";

  filtered = channels.filter(ch => {

    const matchCategory = currentCategory === "All" || ch.category === currentCategory;
    const matchSearch = ch.name.toLowerCase().includes(search);

    return matchCategory && matchSearch;

  });

  filtered.forEach(ch => {

    const div = document.createElement("div");
    div.className = "channel";

    const isFav = favorites.some(f => f.url === ch.url);

    div.innerHTML = `
      <span>▶ ${ch.name}</span>
      <span class="star">${isFav ? "★" : "☆"}</span>
    `;

    // تشغيل القناة
    div.onclick = function () {

      localStorage.setItem("current", JSON.stringify(ch));

      // حفظ آخر مشاهدة
      localStorage.setItem("lastWatched", JSON.stringify(ch));

      window.location.href = "player.html";
    };

    // إضافة/حذف من المفضلة
    div.querySelector(".star").onclick = function (e) {
      e.stopPropagation();
      toggleFavorite(ch);
    };

    container.appendChild(div);

  });

}

// Favorites
function toggleFavorite(ch) {

  const index = favorites.findIndex(f => f.url === ch.url);

  if (index === -1) {
    favorites.push(ch);
  } else {
    favorites.splice(index, 1);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));

  renderFavorites();
  renderChannels();

}

function renderFavorites() {

  const box = document.getElementById("favorites");
  box.innerHTML = "";

  favorites.forEach(ch => {

    const div = document.createElement("div");
    div.className = "channel";
    div.innerText = "⭐ " + ch.name;

    div.onclick = function () {
      localStorage.setItem("current", JSON.stringify(ch));
      localStorage.setItem("lastWatched", JSON.stringify(ch));
      window.location.href = "player.html";
    };

    box.appendChild(div);

  });

}

// EPG
function renderEPG() {

  const box = document.getElementById("epg");
  box.innerHTML = "";

  const data = epgData[currentCategory] || [];

  data.forEach(item => {

    const div = document.createElement("div");
    div.className = "epg-item";
    div.innerText = `${item.time} - ${item.title}`;

    box.appendChild(div);

  });

}
