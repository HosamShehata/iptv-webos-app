let channels = [];
let filtered = [];
let categories = ["All", "Sports", "Movies", "News"];
let currentCategory = "All";

// تحميل M3U
function loadPlaylist() {

  const url = document.getElementById("m3uUrl").value;

  fetch(url)
    .then(res => res.text())
    .then(data => {

      channels = parseM3U(data);
      filtered = channels;

      renderCategories();
      renderChannels();

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

      // تصنيف بسيط (تجريبي)
      let category = "Movies";
      if (name.toLowerCase().includes("sport")) category = "Sports";
      if (name.toLowerCase().includes("news")) category = "News";

      result.push({ name, url, category });

    }

  }

  return result;
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
    };

    box.appendChild(div);

  });

}

// Channels
function renderChannels() {

  const search = document.getElementById("search")?.value || "";

  const container = document.getElementById("channels");
  container.innerHTML = "";

  filtered = channels.filter(ch => {

    const matchCategory = currentCategory === "All" || ch.category === currentCategory;
    const matchSearch = ch.name.toLowerCase().includes(search.toLowerCase());

    return matchCategory && matchSearch;

  });

  filtered.forEach(ch => {

    const div = document.createElement("div");
    div.className = "channel";
    div.innerText = ch.name;

    div.onclick = function () {
      localStorage.setItem("current", JSON.stringify(ch));
      window.location.href = "player.html";
    };

    container.appendChild(div);

  });

}
