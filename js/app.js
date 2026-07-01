let liveChannels = []; let moviesList = []; let seriesList = []; let globalFiltered = [];
let activeSubCategories = ["الكل"];
const sidebarViews = ["view-home", "view-live", "view-movies", "view-series", "view-favorites", "view-history", "view-playlist", "view-search", "view-settings"];
const subSettingsIds = ["sub-set-account", "sub-set-theme", "sub-set-remote"];

let focusMode = "sidebar"; 
let sidebarIdx = 0; let filterIdx = 0; let cardIdx = 0; let formIndex = 0; let settingsIdx = 0; let plMenuIdx = 0;
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
    { stream_id: 901, name: isAr ? "قناة بين سبورت 1 HD" : "beIN Sports 1 HD", category_name: isAr ? "رياضة" : "Sports", stream_icon: "https://placehold.co/200x270/1f6feb/ffffff?text=beIN+1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type:"live" },
    { stream_id: 902, name: isAr ? "قناة أبوظبي الرياضية" : "AD Sports Test", category_name: isAr ? "رياضة" : "Sports", stream_icon: "https://placehold.co/200x270/00c851/ffffff?text=AD+SPORTS", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type:"live" }
  ];
  moviesList = [
    { stream_id: 903, name: "Sintel (4K Movie Demo)", category_name: isAr ? "أفلام حركة" : "Action Movies", stream_icon: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8", container_extension: "m3u8", type:"movie" }
  ];
  seriesList = [
    { series_id: 905, name: isAr ? "مسلسل خيال علمي وثائقي" : "Sci-Fi Documentary", category_name: isAr ? "مسلسلات" : "Series", stream_icon: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400", type:"series" }
  ];
}

function openPlaylistInputForm(type) {
  focusMode = "playlist_form"; formIndex = 0;
  document.getElementById("pl-main-menu-grid").style.display = "none";
  document.getElementById("playlist-input-form-box").classList.add("active");
  const rowUser = document.getElementById("row-user");
  const rowPass = document.getElementById("row-pass");
  if(type === "m3u_url" || type === "m3u_file") { rowUser.style.display = "none"; rowPass.style.display = "none"; }
  else { rowUser.style.display = "flex"; rowPass.style.display = "flex"; }
  updateFocus();
}

function backToPlaylistMenu() {
  focusMode = "playlist_grid"; document.getElementById("playlist-input-form-box").classList.remove("active");
  document.getElementById("pl-main-menu-grid").style.display = "grid"; updateFocus();
}

function updateClockAndDay() {
  const now = new Date();
  document.getElementById("top-current-time").innerText = now.toLocaleTimeString(currentLang === "ar" ? "ar-EG" : "en-US", { hour: '2-digit', minute: '2-digit' });
  document.getElementById("top-current-day").innerText = now.toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US", { weekday: 'long' });
  document.getElementById("top-current-date").innerText = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
}

function measureConnectionSpeed() { document.getElementById("top-net-speed").innerText = "48.5 Mbps"; }
function updateSeekDurationSetting(val) { localStorage.setItem("global_seek_duration", val); }

function changeGlobalAppTheme(themeName) {
  const mainHtml = document.getElementById("main-html"); mainHtml.className = "";
  if(themeName !== "default") mainHtml.classList.add(themeName);
  localStorage.setItem("global_app_theme_css", themeName);
}

function clickSidebarItem(idx) { focusMode = "sidebar"; sidebarIdx = idx; switchView(sidebarViews[sidebarIdx]); updateFocus(); }
function clickSettingsItem(idx) { focusMode = "settings"; settingsIdx = idx; showSubSettings(idx); updateFocus(); }

function showSubSettings(idx) {
  document.querySelectorAll(".sub-settings-panel").forEach(p => p.classList.remove("active"));
  const activePanel = document.getElementById(subSettingsIds[idx]);
  if(activePanel) activePanel.classList.add("active");
}

function clearPlaylistData() { localStorage.clear(); window.location.reload(); }

function saveToGlobalHistory(item) {
  let history = JSON.parse(localStorage.getItem("global_watch_history")) || [];
  history = history.filter(h => h.stream_id !== item.stream_id && h.series_id !== item.series_id);
  history.unshift(item); localStorage.setItem("global_watch_history", JSON.stringify(history.slice(0, 15)));
}

function switchView(viewId) {
  document.querySelectorAll(".view-panel").forEach(panel => panel.classList.remove("active"));
  const activePanel = document.getElementById(viewId); if(activePanel) activePanel.classList.add("active");

  const shelf = document.getElementById("continue-watching-sub-shelf");
  const historyData = JSON.parse(localStorage.getItem("global_watch_history")) || [];
  if(viewId !== "view-settings" && viewId !== "view-playlist" && historyData.length > 0) {
    shelf.style.display = "block"; renderSubShelf(historyData);
  } else { shelf.style.display = "none"; }

  if(viewId === "view-playlist") { focusMode = "playlist_grid"; plMenuIdx = 0; document.getElementById("playlist-input-form-box").classList.remove("active"); document.getElementById("pl-main-menu-grid").style.display = "grid"; return; }
  if(viewId === "view-settings") { focusMode = "settings"; showSubSettings(settingsIdx); return; }

  const defaultAll = (currentLang === "ar") ? "الكل" : "All"; const set = new Set([defaultAll]);
  if (viewId === "view-live") liveChannels.forEach(ch => { if(ch.category_name) set.add(ch.category_name); });
  if (viewId === "view-movies") moviesList.forEach(m => { if(m.category_name) set.add(m.category_name); });
  if (viewId === "view-series") seriesList.forEach(s => { if(s.category_name) set.add(s.category_name); });
  activeSubCategories = Array.from(set); renderSubFilters(); renderContentGrid(viewId);
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
  if(activeSubCategories.length <= 1 || sidebarViews[sidebarIdx] === "view-playlist" || sidebarViews[sidebarIdx] === "view-settings") { bar.style.display = "none"; return; }
  bar.style.display = "flex";
  activeSubCategories.forEach((cat, idx) => {
    const div = document.createElement("div"); div.className = "filter-item";
    if(focusMode === "sub_filters" && idx === filterIdx) div.classList.add("focused"); div.innerText = cat;
    bar.appendChild(div);
  });
}

function renderContentGrid(viewId) {
  let targetGridId = ""; let dataList = [];
  if (viewId === "view-live") { targetGridId = "live-grid"; dataList = liveChannels; }
  else if (viewId === "view-movies") { targetGridId = "movies-grid"; dataList = moviesList; }
  else if (viewId === "view-series") { targetGridId = "series-grid"; dataList = seriesList; }
  else if (viewId === "view-favorites") { targetGridId = "favorites-grid"; dataList = JSON.parse(localStorage.getItem("favorites_list")) || []; }
  else if (viewId === "view-history" || viewId === "view-home") { targetGridId = (viewId === "view-home") ? "home-history-grid" : "history-grid"; dataList = JSON.parse(localStorage.getItem("global_watch_history")) || []; }
  else return;

  const container = document.getElementById(targetGridId); if(!container) return; container.innerHTML = "";
  const defaultAll = (currentLang === "ar") ? "الكل" : "All"; const activeCat = activeSubCategories[filterIdx] || defaultAll;
  globalFiltered = dataList.filter(item => activeCat === defaultAll || item.category_name === activeCat);

  globalFiltered.forEach((item, idx) => {
    const card = document.createElement("div"); card.className = "media-card";
    const savedProgress = localStorage.getItem(`progress_ratio_media_${item.stream_id || 905}`) || 0;
    card.innerHTML = `<img src="${item.stream_icon}" /><div class="card-progress-container"><div class="card-progress-fill" style="width:${savedProgress}%"></div></div><div class="info">${item.name}</div>`;
    card.onclick = () => {
      localStorage.setItem("current", JSON.stringify(item)); saveToGlobalHistory(item);
      localStorage.setItem("current_playlist_context", JSON.stringify(globalFiltered)); localStorage.setItem("current_playlist_index", idx);
      window.location.href = (item.type === "series") ? "details.html" : "player.html";
    };
    container.appendChild(card);
  });
  if (container.clientWidth) columnsCount = Math.floor(container.clientWidth / 220) || 1;
}

function updateFocus() {
  document.querySelectorAll(".menu-item").forEach((el, i) => { el.classList.toggle("focused", focusMode === "sidebar" && i === sidebarIdx); });
  const langBtn = document.getElementById("sidebarLangBtn"); if(langBtn) langBtn.classList.toggle("focused", focusMode === "sidebar_lang");
  renderSubFilters();
  document.querySelectorAll(".view-panel.active .media-card").forEach((el, i) => { el.classList.toggle("focused", focusMode === "cards" && i === cardIdx); });
  document.querySelectorAll(".playlist-menu-card").forEach((el, i) => { el.classList.toggle("focused", focusMode === "playlist_grid" && i === plMenuIdx); });
  document.querySelectorAll(".view-panel.active .settings-focusable").forEach((el, i) => { el.classList.toggle("focused", focusMode === "settings" && i === settingsIdx); });
}

function applyLanguage() {
  const dict = languages[currentLang]; document.getElementById("main-html").setAttribute("dir", currentLang === "ar" ? "rtl" : "ltr");
  document.getElementById("lbl-sidebar-lang").innerText = dict.sidebar_lang;
  document.querySelectorAll(".txt-lang").forEach(el => { const key = el.getAttribute("data-key"); if(dict[key]) el.innerText = dict[key]; });
  updateClockAndDay();
}
function toggleLanguage() { currentLang = (currentLang === "ar") ? "en" : "ar"; localStorage.setItem("app_lang", currentLang); applyLanguage(); loadTestData(); switchView(sidebarViews[sidebarIdx]); }

document.addEventListener("keydown", function(e) {
  const activeView = sidebarViews[sidebarIdx];
  let leftKey = (currentLang === "en") ? "ArrowRight" : "ArrowLeft"; let rightKey = (currentLang === "en") ? "ArrowLeft" : "ArrowRight";

  if (e.key === leftKey) {
    if (focusMode === "cards" && cardIdx % columnsCount === 0) focusMode = "sidebar";
    else if (focusMode === "cards") cardIdx = Math.max(0, cardIdx - 1);
    else if (focusMode === "playlist_grid" || focusMode === "settings" || focusMode === "sidebar_lang") focusMode = "sidebar";
  }
  if (e.key === rightKey) { if (focusMode === "sidebar") switchView(activeView); }
  if (e.key === "ArrowDown") {
    if (focusMode === "sidebar") { if (sidebarIdx < sidebarViews.length - 1) { sidebarIdx++; switchView(sidebarViews[sidebarIdx]); } }
    else if (focusMode === "cards" && cardIdx + columnsCount < globalFiltered.length) { cardIdx += columnsCount; }
    else if (focusMode === "settings") { settingsIdx = Math.min(settingsIdx + 1, 2); showSubSettings(settingsIdx); }
  }
  if (e.key === "ArrowUp") {
    if (focusMode === "sidebar") { sidebarIdx = Math.max(0, sidebarIdx - 1); switchView(sidebarViews[sidebarIdx]); }
    else if (focusMode === "cards" && cardIdx - columnsCount >= 0) { cardIdx -= columnsCount; }
    else if (focusMode === "settings") { settingsIdx = Math.max(0, settingsIdx - 1); showSubSettings(settingsIdx); }
  }
  if (e.key === "Enter") {
    if (focusMode === "sidebar_lang") toggleLanguage();
    if (focusMode === "cards" && globalFiltered[cardIdx]) {
      const item = globalFiltered[cardIdx]; localStorage.setItem("current", JSON.stringify(item));
      window.location.href = (item.type === "series") ? "details.html" : "player.html";
    }
  }
  updateFocus();
});

window.onload = () => {
  const savedTheme = localStorage.getItem("global_app_theme_css") || "default"; changeGlobalAppTheme(savedTheme);
  loadTestData(); applyLanguage(); switchView(sidebarViews[sidebarIdx]); setInterval(updateClockAndDay, 1000); measureConnectionSpeed();
};
