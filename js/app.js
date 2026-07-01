let channels = [];
let filtered = [];
let categories = ["All", "Sports", "Movies", "News"];
let currentCategory = "All";
let selectedIndex = 0;

let epg = {}; // هيتملأ من الإنترنت

// تحميل M3U
function loadPlaylist() {

  const url = document.getElementById("m3uUrl").value;

  fetch(url)
    .then(res => res.text())
    .then(data => {

      channels = parseM3U(data);

      renderCategories();
      renderChannels();

      // نحاول نجيب EPG لو موجود
      loadEPG(url);

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

// 🔥 محاولة تحميل EPG (XMLTV)
function loadEPG(m3uUrl) {

  // بعض السيرفرات بتكون جنبها epg.xml
  const epgUrl = m3uUrl.replace("playlist.m3u", "epg.xml");

  fetch(epgUrl)
    .then(res => res.text())
    .then(data => {

      epg = parseXMLTV(data);
      renderEPG();

    })
    .catch(() => {
      console.log("EPG not found, using fallback");
      epg = {};
      renderEPG();
    });

}

// XMLTV parser (تبسيط)
function parseXMLTV(xml) {

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "text/xml");

  const programmes = xmlDoc.getElementsByTagName("programme");

  const result = {};

  for (let i = 0; i < programmes.length; i++) {

    const prog = programmes[i];

    const title = prog.getElementsByTagName("title")[0]?.textContent;
    const channel = prog.getAttribute("channel");

    if (!result[channel]) result[channel] = [];

    result[channel].push(title);

  }

  return result;
}

// categories
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

  filtered.forEach((ch, index) => {

    const div = document.createElement("div");
    div.className = "card";

    div.innerText = ch.name;

    if (index === selectedIndex) {
      div.style.outline = "2px solid #1f6feb";
    }

    div.onclick = function () {
      openChannel(ch);
    };

    container.appendChild(div);

  });

}

// open player
function openChannel(ch) {

  localStorage.setItem("current", JSON.stringify(ch));
  window.location.href = "player.html";

}

// EPG عرض حقيقي أو fallback
function renderEPG() {

  const box = document.getElementById("epg");
  box.innerHTML = "";

  const current = filtered[selectedIndex];

  if (!current) return;

  const channelEPG = epg[current.name] || ["No EPG available"];

  channelEPG.forEach(item => {

    const div = document.createElement("div");
    div.className = "epg-item";
    div.innerText = item;

    box.appendChild(div);

  });

}

// remote control
document.addEventListener("keydown", function(e) {

  if (!filtered.length) return;

  if (e.key === "ArrowDown") {
    selectedIndex++;
    if (selectedIndex >= filtered.length) selectedIndex = 0;
    renderChannels();
    renderEPG();
  }

  if (e.key === "ArrowUp") {
    selectedIndex--;
    if (selectedIndex < 0) selectedIndex = filtered.length - 1;
    renderChannels();
    renderEPG();
  }

  if (e.key === "Enter") {
    if (filtered[selectedIndex]) {
      openChannel(filtered[selectedIndex]);
    }
  }

});
