let liveChannels = []; let moviesList = []; let seriesList = []; let globalFiltered = [];
let activeSubCategories = ["الكل"];
const sidebarViews = ["view-home", "view-live", "view-movies", "view-series", "view-favorites", "view-history", "view-playlist", "view-search", "view-settings"];
const subSettingsIds = ["sub-set-account", "sub-set-theme", "sub-set-remote"];
let focusMode = "sidebar"; let sidebarIdx = 0; let filterIdx = 0; let cardIdx = 0; let settingsIdx = 0;
let columnsCount = 5; let currentLang = localStorage.getItem("app_lang") || "ar";

const languages = {
  ar: {
    home: "الرئيسية", live: "قنوات مباشرة", movies: "الأفلام", series: "المسلسلات", favorites: "المفضلة",
    history: "تابع المشاهدة", add_playlist: "أضف قائمة تشغيل", search: "البحث المتقدم", settings: "الإعدادات",
    recent: "⏱️ تابع المشاهدة مؤخراً", resume_shelf: "تكملة المشاهدة الفورية ⏱️", sidebar_lang: "English"
  },
  en: {
    home: "Home", live: "Live TV", movies: "Movies", series: "Series", favorites: "Favorites",
    history: "Continue Watching", add_playlist: "Add Playlist", search: "Advanced Search", settings: "Settings",
    recent: "⏱️ Continue Watching", resume_shelf: "Instant Resume ⏱️", sidebar_lang: "العربية"
  }
};

function loadTestData() {
  const isAr = currentLang === "ar";
  liveChannels = [
    { stream_id: 901, name: isAr ? "قناة بين سبورت 1 HD" : "beIN Sports 1 HD", category_name: isAr ? "رياضة" : "Sports", stream_icon: "https://placehold.co/200x270/1f6feb/ffffff?text=beIN+1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type:"live" }
  ];
  moviesList = [
    { stream_id: 903, name: "Sintel Movie Demo", category_name: isAr ? "أفلام حركة" : "Action Movies", stream_icon: "https://placehold.co/200x270/00c851/ffffff?text=Sintel", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8", type:"movie" }
  ];
  seriesList = [
    { series_id: 905, name: isAr ? "مسلسل خيال علمي وثائقي" : "Sci-Fi Documentary", category_name: isAr ? "مسلسلات" : "Series", stream_icon: "https://placehold.co/200x270/ff4444/ffffff?text=SciFi", type:"series" }
  ];
}

function updateClockAndDay() {
  const now = new Date();
  document.getElementById("top-current-time").innerText = now.toLocaleTimeString(currentLang === "ar" ? "ar-EG" : "en-US", { hour: '2-digit', minute: '2-digit' });
  document.getElementById("top-current-day").innerText = now.toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US", { weekday: 'long' });
  document.getElementById("top-current-date").innerText = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;
}

function updateSeekDurationSetting(val) { localStorage.setItem("global_seek_duration", val); }

// محرك تبديل المظاهر الخمسة الحديثة عالية الجودة تلقائياً بالملي
function changeGlobalAppTheme(themeName) {
  const mainHtml = document.getElementById("main-html");
  mainHtml.className = ""; // تنظيف السمات السابقة
  if(themeName !== "default") {
    mainHtml.classList.add(themeName);
  }
  localStorage.setItem("global_app_theme_css", themeName);
}

function clickSidebarItem(idx) { focusMode = "sidebar"; sidebarIdx = idx; switchView(sidebarViews[sidebarIdx]); updateFocus(); }
function clickSettingsItem(idx) { focusMode = "settings"; settingsIdx = idx; showSubSettings(idx); updateFocus(); }

function showSubSettings(idx) {
  document.querySelectorAll(".sub-settings-panel").forEach(p => p.classList.remove("active"));
  if(document.getElementById(subSettingsIds[idx])) document.getElementById(subSettingsIds[idx]).classList.add("active");
}

function clearPlaylistData() { localStorage.clear(); window.location.reload(); }

function saveToGlobalHistory(item) {
  let history = JSON.parse(localStorage.getItem("global_watch_history")) || [];
  history = history.filter(h => h.stream_id !== item.stream_id && h.series_id !== item.series_id);
  history.unshift(item); localStorage.setItem("global_watch_history", JSON.stringify(history.slice(0, 15)));
}

function switchView(viewId) {
  document.querySelectorAll(".view-panel").forEach(panel => panel.classList.remove("active"));
  if(document.getElementById(viewId)) document.getElementById(viewId).classList.add("active");
  
  const shelf = document.getElementById("continue-watching-sub-shelf");
  const historyData = JSON.parse(localStorage.getItem("global_watch_history")) || [];
  if(viewId !== "view-settings" && viewId !== "view-playlist" && historyData.length > 0) {
    shelf.style.display = "block"; renderSubShelf(historyData);
  } else { shelf.style.display = "none"; }

  const defaultAll = (currentLang === "ar") ? "الكل" : "All";
  activeSubCategories = [defaultAll];
  renderSubFilters(); renderContentGrid(viewId);
}

function renderSubShelf(data) {
  const grid = document.getElementById("sub-shelf-grid"); grid.innerHTML = "";
  data.slice(0, 4).forEach(item => {
    const card = document.createElement("div"); card.className = "media-card";
    card.innerHTML = `<img src="${item.stream_icon || 'https://placehold.co/200x270'}" /><div class="info">${item.name}</div>`;
    card.onclick = () => { localStorage.setItem("current", JSON.stringify(item)); window.location.href = (item.type==="series")?"details.html":"player.html"; };
    grid.appendChild(card);
  });
}

function renderSubFilters() {
  const bar = document.getElementById("subFilterBar"); bar.innerHTML = "";
  if(activeSubCategories.length <= 1) { bar.style.display = "none"; return; }
  bar.style.display = "flex";
  activeSubCategories.forEach((cat, idx) => {
    const div = document.createElement("div"); div.className = "filter-item";
    if(idx === filterIdx) div.classList.add("focused"); div.innerText = cat;
    bar.appendChild(div);
  });
}

function renderContentGrid(viewId) {
  let gridId = "live-grid"; let list = liveChannels;
  if(viewId === "view-movies") { gridId = "movies-grid"; list = moviesList; }
  if(viewId === "view-series") { gridId = "series-grid"; list = seriesList; }
  if(viewId === "view-home" || viewId === "view-history") { gridId = (viewId === "view-home")?"home-history-grid":"history-grid"; list = JSON.parse(localStorage.getItem("global_watch_history")) || []; }
  
  const container = document.getElementById(gridId); if(!container) return; container.innerHTML = "";
  globalFiltered = list;
  globalFiltered.forEach((item, idx) => {
    const card = document.createElement("div"); card.className = "media-card";
    const savedProgress = localStorage.getItem(`progress_ratio_media_${item.stream_id || 905}`) || 0;
    card.innerHTML = `
      <img src="${item.stream_icon}" />
      <div class="card-progress-container"><div class="card-progress-fill" style="width:${savedProgress}%"></div></div>
      <div class="info">${item.name}</div>
    `;
    card.onclick = () => {
      localStorage.setItem("current", JSON.stringify(item));
      window.location.href = (item.type === "series") ? "details.html" : "player.html";
    };
    container.appendChild(card);
  });
}

function applyLanguage() {
  const dict = languages[currentLang];
  document.getElementById("main-html").setAttribute("dir", currentLang === "ar"?"rtl":"ltr");
  document.getElementById("lbl-sidebar-lang").innerText = dict.sidebar_lang;
  document.querySelectorAll(".txt-lang").forEach(el => { const key = el.getAttribute("data-key"); if(dict[key]) el.innerText = dict[key]; });
  updateClockAndDay();
}
function toggleLanguage() { currentLang = (currentLang === "ar")?"en":"ar"; localStorage.setItem("app_lang", currentLang); applyLanguage(); loadTestData(); switchView(sidebarViews[sidebarIdx]); }

document.addEventListener("keydown", function(e) {
  const activeView = sidebarViews[sidebarIdx];
  let leftKey = (currentLang === "en") ? "ArrowRight" : "ArrowLeft";
  let rightKey = (currentLang === "en") ? "ArrowLeft" : "ArrowRight";

  if (e.key === leftKey) {
    if (focusMode === "cards" && cardIdx % columnsCount === 0) focusMode = "sidebar";
    else if (focusMode === "cards") cardIdx = Math.max(0, cardIdx - 1);
    else if (focusMode === "sidebar_lang") focusMode = "sidebar";
  }
  if (e.key === rightKey) {
    if (focusMode === "sidebar") switchView(activeView);
  }
  updateFocus();
});

window.onload = () => {
  const savedTheme = localStorage.getItem("global_app_theme_css") || "default";
  changeGlobalAppTheme(savedTheme);
  loadTestData(); applyLanguage(); switchView(sidebarViews[sidebarIdx]); setInterval(updateClockAndDay, 1000);
};
