let channels = [];
let filtered = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

let categories = ["All", "Sports", "Movies", "News"];
let currentCategory = "All";

let selectedIndex = 0;

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

      renderCategories();
      renderChannels();
      renderEPG();

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

      let category = "Movies";

      if (name.toLowerCase().includes("sport")) category = "Sports";
      if (name.toLowerCase().includes("news")) category = "News";

      result.push({ name, url, category });

    }

  }

  return result;
}

// عرض الأقسام
function renderCategories() {

  const box = document.getElementById("categories");
  box.innerHTML = "";

  categories.forEach(cat => {

    const div = document.createElement("div");
    div.className = "category";
    div.innerText = cat;

    div.onclick = function () {
      currentCategory = cat;
      selectedIndex = 0;
      renderChannels();
      renderEPG();
    };

    box.appendChild(div);

  });

}

// عرض القنوات
function renderChannels() {

  const search = document.getElementById("search").value.toLowerCase();

  const container = document.getElementById("channels");
  container.innerHTML = "";

  filtered = channels.filter(ch => {

    const matchCategory = currentCategory === "All" || ch.category === currentCategory;
    const matchSearch = ch.name.toLowerCase().includes(search);

    return matchCategory && matchSearch;

  });

  filtered.forEach((ch, index) => {

    const div = document.createElement("div");
    div.className = "channel";

    div.innerText = "▶ " + ch.name;

    if (index === selectedIndex) {
      div.style.background = "#0d6efd";
    }

    div.onclick = function () {
      openChannel(ch);
    };

    container.appendChild(div);

  });

}

// فتح قناة
function openChannel(ch) {

  localStorage.setItem("current", JSON.stringify(ch));
  localStorage.setItem("lastWatched", JSON.stringify(ch));

  window.location.href = "player.html";

}

// Favorites toggle
function toggleFavorite(ch) {

  const index = favorites.findIndex(f => f.url === ch.url);

  if (index === -1) {
    favorites.push(ch);
  } else {
    favorites.splice(index, 1);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));

  renderChannels();

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

// ريموت كنترول
document.addEventListener("keydown", function(e) {

  if (!filtered.length) return;

  if (e.key === "ArrowDown") {
    selectedIndex++;
    if (selectedIndex >= filtered.length) selectedIndex = 0;
    renderChannels();
  }

  if (e.key === "ArrowUp") {
    selectedIndex--;
    if (selectedIndex < 0) selectedIndex = filtered.length - 1;
    renderChannels();
  }

  if (e.key === "Enter") {
    if (filtered[selectedIndex]) {
      openChannel(filtered[selectedIndex]);
    }
  }

});
