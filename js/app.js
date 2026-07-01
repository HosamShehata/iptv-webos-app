let channels = [];
let filtered = [];

let categories = ["All", "Sports", "Movies", "News"];
let currentCategory = "All";

let focusMode = "channels"; // categories | channels
let catIndex = 0;
let channelIndex = 0;

// تحميل M3U
function loadPlaylist() {

  const url = document.getElementById("m3uUrl").value;

  fetch(url)
    .then(res => res.text())
    .then(data => {

      channels = parseM3U(data);

      renderCategories();
      renderChannels();
      updateFocus();

    });

}

// M3U parser
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

// categories
function renderCategories() {

  const box = document.getElementById("categories");
  box.innerHTML = "";

  categories.forEach((cat, i) => {

    const div = document.createElement("div");
    div.className = "category";
    div.innerText = cat;

    box.appendChild(div);

  });

}

// channels
function renderChannels() {

  const search = document.getElementById("search").value.toLowerCase();

  const container = document.getElementById("channels");
  container.innerHTML = "";

  filtered = channels.filter(ch => {

    const matchCategory = currentCategory === "All" || ch.category === currentCategory;
    const matchSearch = ch.name.toLowerCase().includes(search);

    return matchCategory && matchSearch;

  });

  filtered.forEach((ch, i) => {

    const div = document.createElement("div");
    div.className = "card";
    div.innerText = ch.name;

    container.appendChild(div);

  });

}

// focus system
function updateFocus() {

  // categories
  document.querySelectorAll(".category").forEach((el, i) => {
    el.classList.toggle("focused", focusMode === "categories" && i === catIndex);
  });

  // channels
  document.querySelectorAll(".card").forEach((el, i) => {
    el.classList.toggle("focused", focusMode === "channels" && i === channelIndex);
  });

}

// open channel
function openChannel(ch) {

  localStorage.setItem("current", JSON.stringify(ch));
  window.location.href = "player.html";

}

// remote control
document.addEventListener("keydown", function(e) {

  const cats = document.querySelectorAll(".category");
  const chs = document.querySelectorAll(".card");

  if (e.key === "ArrowLeft") focusMode = "categories";
  if (e.key === "ArrowRight") focusMode = "channels";

  if (e.key === "ArrowDown") {

    if (focusMode === "categories") {
      catIndex = Math.min(catIndex + 1, cats.length - 1);
      currentCategory = categories[catIndex];
      renderChannels();
    } else {
      channelIndex = Math.min(channelIndex + 1, chs.length - 1);
    }

  }

  if (e.key === "ArrowUp") {

    if (focusMode === "categories") {
      catIndex = Math.max(catIndex - 1, 0);
      currentCategory = categories[catIndex];
      renderChannels();
    } else {
      channelIndex = Math.max(channelIndex - 1, 0);
    }

  }

  if (e.key === "Enter") {

    if (focusMode === "channels" && filtered[channelIndex]) {
      openChannel(filtered[channelIndex]);
    }
  }

  updateFocus();

});
