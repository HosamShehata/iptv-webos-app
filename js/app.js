let liveChannels = [];
let moviesList = [];
let seriesList = [];
let globalFiltered = [];
let activeSubCategories = ["الكل"];

const sidebarViews = ["view-home", "view-live", "view-movies", "view-series", "view-favorites", "view-history", "view-playlist", "view-search", "view-settings"];
const subSettingsIds = ["sub-set-account", "sub-set-theme", "sub-set-language", "sub-set-parental", "sub-set-remote"];

let focusMode = "sidebar"; 
let sidebarIdx = 0; let filterIdx = 0; let cardIdx = 0; let formIndex = 0; let settingsIdx = 0; let plMenuIdx = 0;
let columnsCount = 5;
let currentPlaylistType = "xtream"; 
let currentLang = localStorage.getItem("app_lang") || "ar";

const languages = {
  ar: {
    home: "الرئيسية", live: "قنوات مباشرة", movies: "الأفلام", series: "المسلسلات", favorites: "المفضلة",
    history: "تابع المشاهدة", add_playlist: "أضف قائمة تشغيل", search: "البحث المتقدم", settings: "الإعدادات",
    recent: "⏱️ تابع المشاهدة مؤخراً", xt_title: "أضف قائمة تشغيل", xt_btn: "إضافة",
    set_acc: "الحساب والاشتراك", set_theme: "المظهر والسمات", set_parent: "الرقابة الأبوية والقفل", sidebar_lang: "English"
  },
  en: {
    home: "Home", live: "Live TV", movies: "Movies", series: "Series", favorites: "Favorites",
    history: "Continue Watching", add_playlist: "Add Playlist", search: "Advanced Search", settings: "Settings",
    recent: "⏱️ Continue Watching", xt_title: "Add Playlist", xt_btn: "Add",
    set_acc: "Account & Subscription", set_theme: "Appearance", set_parent: "Parental Control", sidebar_lang: "العربية"
  }
};

function loadTestData() {
  const isAr = currentLang === "ar";
  liveChannels = [
    { stream_id: 901, name: isAr ? "قناة بين سبورت 1 HD" : "beIN Sports 1 HD", category_name: isAr ? "رياضة" : "Sports", stream_icon: "https://placehold.co/200x270/1f6feb/ffffff?text=beIN+1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type:"live" },
    { stream_id: 902, name: isAr ? "قناة أبوظبي الرياضية" : "AD Sports Test", category_name: isAr ? "رياضة" : "Sports", stream_icon: "https://placehold.co/200x270/00c851/ffffff?text=AD+SPORTS", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type:"live" }
  ];
  moviesList = [
    { stream_id: 903, name: "Sintel (4K Movie Demo)", category_name: isAr ? "أفلام حركة" : "Action Movies", stream_icon: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8", container_extension: "m3u8", type:"movie", rating: "⭐ 8.8", year: "2025" }
  ];
  seriesList = [
    { series_id: 905, name: "Tears of Steel (Sci-Fi Series)", category_name: isAr ? "مسلسلات خيال" : "Sci-Fi Series", stream_icon: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400", type:"series", rating: "⭐ 8.5", year: "2026" }
  ];
}

function openPlaylistInputForm(type) {
  focusMode = "playlist_form"; formIndex = 0;
  document.getElementById("pl-main-menu-grid").style.display = "none";
  document.getElementById("playlist-input-form-box").classList.add("active");
  const rowUser = document.getElementById("row-user");
  const rowPass = document.getElementById("row-pass");
  if(type === "m3u_url" || type === "m3u_file") {
    rowUser.style.display = "none"; rowPass.style.display = "none";
  } else {
    rowUser.style.display = "flex"; rowPass.style.display = "flex";
  }
  updateFocus();
}

function backToPlaylistMenu() {
  focusMode = "playlist_grid";
  document.getElementById("playlist-input-form-box").classList.remove("active");
  document.getElementById("pl-main-menu-grid").style.display = "grid";
  updateFocus();
}

function updateClockAndDay() {
  const now = new Date();
  let optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true };
  document.getElementById("top-current-time").innerText = now.toLocaleTimeString(currentLang === "ar" ? "ar-EG" : "en-US", optionsTime);
  let optionsDay = { weekday: 'long' };
  document.getElementById("top-current-day").innerText = now.toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US", optionsDay);
  document.getElementById("top-current-date").innerText = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
}

function measureConnectionSpeed() { document.getElementById("top-net-speed").innerText = "48.5 Mbps"; }
function updateSeekDurationSetting(val) { localStorage.setItem("global_seek_duration", val); }
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
  const activePanel = document.getElementById(viewId);
  if(activePanel) activePanel.classList.add("active");

  if(viewId === "view-playlist") { focusMode = "playlist_grid"; plMenuIdx = 0; document.getElementById("playlist-input-form-box").classList.remove("active"); document.getElementById("pl-main-menu-grid").style.display = "grid"; return; }
  if(viewId === "view-settings") { focusMode = "settings"; showSubSettings(settingsIdx); return; }

  const defaultAll = (currentLang === "ar") ? "الكل" : "All";
  const set = new Set([defaultAll]);
  if (viewId === "view-live") liveChannels.forEach(ch => { if(ch.category_name) set.add(ch.category_name); });
  if (viewId === "view-movies") moviesList.forEach(m => { if(m.category_name) set.add(m.category_name); });
  if (viewId === "view-series") seriesList.forEach(s => { if(s.category_name) set.add(s.category_name); });
  
  activeSubCategories = Array.from(set); renderSubFilters(); renderContentGrid(viewId);
}

function togglePasswordVisibility() {
  const passInput = document.getElementById("pl_pass");
  passInput.type = (passInput.type === "password") ? "text" : "password";
}

async function processPlaylistAddition() {
  const name = document.getElementById("pl_name").value.trim();
  const url = document.getElementById("pl_url").value.trim().replace(/\/$/, "");
  const user = document.getElementById("pl_user").value.trim();
  const pass = document.getElementById("pl_pass").value.trim();
  const status = document.getElementById("pl_status");

  if(!name || !url) { status.innerText = "برجاء كتابة البيانات كاملة."; status.style.color = "#ff4444"; return; }
  status.innerText = "جاري الفحص والسحب الحركي..."; status.style.color = "#ffffff";

  const baseUrl = `${url}/player_api.php?username=${user}&password=${pass}`;
  try {
    const authRes = await fetch(baseUrl); const authData = await authRes.json();
    if(authData.user_info && authData.user_info.auth === 1) {
      status.innerText = "تمت المزامنة بنجاح!";
      liveChannels = await (await fetch(`${baseUrl}&action=get_live_streams`)).json();
      moviesList = await (await fetch(`${baseUrl}&action=get_vod_streams`)).json();
      seriesList = await (await fetch(`${baseUrl}&action=get_series`)).json();

      localStorage.setItem("xt_live", JSON.stringify(liveChannels));
      localStorage.setItem("xt_movies", JSON.stringify(moviesList));
      localStorage.setItem("xt_series", JSON.stringify(seriesList));
      localStorage.setItem("active_playlist_mode", "xtream");
      localStorage.setItem("xtream_creds", JSON.stringify({url, user, pass}));
      setTimeout(() => { sidebarIdx = 1; focusMode = "sidebar"; switchView(sidebarViews[sidebarIdx]); updateFocus(); }, 1000);
    } else { status.innerText = "البيانات خاطئة."; status.style.color = "#ff4444"; }
  } catch(e) { status.innerText = "فشل الاتصال بالسيرفر."; status.style.color = "#ff4444"; }
}

function renderSubFilters() {
  const bar = document.getElementById("subFilterBar"); bar.innerHTML = "";
  if(activeSubCategories.length <= 1 || sidebarViews[sidebarIdx] === "view-playlist" || sidebarViews[sidebarIdx] === "view-settings") { bar.style.display = "none"; return; }
  bar.style.display = "flex";
  activeSubCategories.forEach((cat, idx) => {
    const div = document.createElement("div"); div.className = "filter-item";
    if(focusMode === "sub_filters" && idx === filterIdx) div.classList.add("focused");
    div.innerText = cat; 
    div.onclick = function() { filterIdx = idx; renderContentGrid(sidebarViews[sidebarIdx]); updateFocus(); };
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
  const defaultAll = (currentLang === "ar") ? "الكل" : "All";
  const activeCat = activeSubCategories[filterIdx] || defaultAll;
  globalFiltered = dataList.filter(item => activeCat === defaultAll || item.category_name === activeCat);

  if (globalFiltered.length === 0) { container.innerHTML = `<div style='padding:20px; color:#666;'>${languages[currentLang].no_content}</div>`; return; }
  
  globalFiltered.forEach((item, idx) => {
    const card = document.createElement("div"); card.className = "media-card";
    const imgUrl = item.stream_icon || item.cover || "https://placehold.co/200x270/1a1a1a/ffffff?text=VISION";
    card.innerHTML = `<div class="badge">${item.container_extension || 'HD'}</div><img src="${imgUrl}" /><div class="info">${item.name}</div>`;
    
    card.onclick = function() {
      cardIdx = idx; focusMode = "cards";
      localStorage.setItem("current", JSON.stringify(item));
      saveToGlobalHistory(item);
      localStorage.setItem("current_playlist_context", JSON.stringify(globalFiltered));
      localStorage.setItem("current_playlist_index", idx);
      window.location.href = (item.url || item.type === "live") ? "player.html" : "details.html";
    };
    container.appendChild(card);
  });
  if (container.clientWidth) columnsCount = Math.floor(container.clientWidth / 220) || 1;
}

function triggerGlobalSearch() {
  const query = document.getElementById("search-input").value.toLowerCase().trim();
  const container = document.getElementById("search-results-grid"); container.innerHTML = "";
  if(!query) return;
  const all = [...liveChannels, ...moviesList, ...seriesList];
  globalFiltered = all.filter(i => (i.name || "").toLowerCase().includes(query) || (i.category_name || "").toLowerCase().includes(query)).slice(0, 40);
  globalFiltered.forEach((item) => {
    const card = document.createElement("div"); card.className = "media-card";
    card.innerHTML = `<img src="${item.stream_icon || item.cover || 'https://placehold.co/200x270/1a1a1a/ffffff?text=VISION'}" /><div class="info">${item.name}</div>`;
    card.onclick = function() { localStorage.setItem("current", JSON.stringify(item)); saveToGlobalHistory(item); window.location.href = item.url ? "player.html" : "details.html"; };
    container.appendChild(card);
  });
}

function updateFocus() {
  document.querySelectorAll(".menu-item").forEach((el, i) => { el.classList.toggle("focused", focusMode === "sidebar" && i === sidebarIdx); });
  const langBtn = document.getElementById("sidebarLangBtn");
  if(langBtn) langBtn.classList.toggle("focused", focusMode === "sidebar_lang");
  renderSubFilters();

  document.querySelectorAll(".view-panel.active .media-card").forEach((el, i) => { el.classList.toggle("focused", focusMode === "cards" && i === cardIdx); });
  document.querySelectorAll(".playlist-menu-card").forEach((el, i) => { el.classList.toggle("focused", focusMode === "playlist_grid" && i === plMenuIdx); });
  
  const formFields = document.querySelectorAll(".form-focusable");
  formFields.forEach((el, i) => {
    const isFocused = focusMode === "playlist_form" && i === formIndex;
    el.classList.toggle("focused", isFocused);
    if(isFocused && el.tagName === "INPUT") el.focus();
    if(!isFocused && el.tagName === "INPUT") el.blur();
  });
  document.querySelectorAll(".view-panel.active .settings-focusable").forEach((el, i) => { el.classList.toggle("focused", focusMode === "settings" && i === settingsIdx); });
}

function applyLanguage() {
  const dict = languages[currentLang];
  const htmlTag = document.getElementById("main-html");
  htmlTag.setAttribute("dir", currentLang === "ar" ? "rtl" : "ltr");
  htmlTag.setAttribute("lang", currentLang);
  document.getElementById("lbl-sidebar-lang").innerText = dict.sidebar_lang;
  document.querySelectorAll(".txt-lang").forEach(el => { const key = el.getAttribute("data-key"); if(dict[key]) el.innerText = dict[key]; });
  updateClockAndDay();
}

function toggleLanguage() {
  currentLang = (currentLang === "ar") ? "en" : "ar"; localStorage.setItem("app_lang", currentLang);
  applyLanguage(); loadTestData(); switchView(sidebarViews[sidebarIdx]);
}

document.addEventListener("keydown", function(e) {
  const activeView = sidebarViews[sidebarIdx];
  let leftKey = (currentLang === "en") ? "ArrowRight" : "ArrowLeft";
  let rightKey = (currentLang === "en") ? "ArrowLeft" : "ArrowRight";

  if (e.key === leftKey) {
    if (focusMode === "cards" && cardIdx % columnsCount === 0) focusMode = "sidebar";
    else if (focusMode === "cards") cardIdx = Math.max(0, cardIdx - 1);
    else if (focusMode === "sub_filters" && filterIdx === 0) focusMode = "sidebar";
    else if (focusMode === "sub_filters") filterIdx = Math.max(0, filterIdx - 1);
    else if (focusMode === "playlist_grid" || focusMode === "playlist_form" || focusMode === "settings" || focusMode === "sidebar_lang") focusMode = "sidebar";
  }
  if (e.key === rightKey) {
    if (focusMode === "sidebar" || focusMode === "sidebar_lang") { switchView(activeView); } 
    else if (focusMode === "sub_filters" && filterIdx < activeSubCategories.length - 1) { filterIdx++; } 
    else if (focusMode === "sub_filters") { focusMode = "cards"; cardIdx = 0; } 
    else if (focusMode === "cards" && (cardIdx + 1) % columnsCount !== 0 && cardIdx < globalFiltered.length - 1) { cardIdx++; }
  }
  if (e.key === "ArrowDown") {
    if (focusMode === "sidebar_lang") { focusMode = "sidebar"; sidebarIdx = 0; switchView(sidebarViews[sidebarIdx]); } 
    else if (focusMode === "sidebar") { if (sidebarIdx < sidebarViews.length - 1) { sidebarIdx++; switchView(sidebarViews[sidebarIdx]); } } 
    else if (focusMode === "sub_filters") { focusMode = "cards"; cardIdx = 0; } 
    else if (focusMode === "cards" && cardIdx + columnsCount < globalFiltered.length) { cardIdx += columnsCount; } 
    else if (focusMode === "playlist_grid") { plMenuIdx = Math.min(plMenuIdx + 2, 3); }
    else if (focusMode === "playlist_form") { formIndex = Math.min(formIndex + 1, 5); }
    else if (focusMode === "settings") { settingsIdx = Math.min(settingsIdx + 1, 4); showSubSettings(settingsIdx); }
  }
  if (e.key === "ArrowUp") {
    if (focusMode === "sidebar" && sidebarIdx === 0) { focusMode = "sidebar_lang"; } 
    else if (focusMode === "sidebar") { sidebarIdx = Math.max(0, sidebarIdx - 1); switchView(sidebarViews[sidebarIdx]); } 
    else if (focusMode === "cards" && cardIdx - columnsCount >= 0) { cardIdx -= columnsCount; } 
    else if (focusMode === "cards" && activeSubCategories.length > 1) { focusMode = "sub_filters"; } 
    else if (focusMode === "playlist_grid") { plMenuIdx = Math.max(0, plMenuIdx - 2); }
    else if (focusMode === "playlist_form") { formIndex = Math.max(0, formIndex - 1); }
    else if (focusMode === "settings") { settingsIdx = Math.max(0, settingsIdx - 1); showSubSettings(settingsIdx); }
  }
  if (e.key === "Enter") {
    if (focusMode === "sidebar_lang") toggleLanguage();
    if (focusMode === "playlist_grid") {
      const types = ["xtream", "m3u_url", "m3u_file", "qr"]; openPlaylistInputForm(types[plMenuIdx]);
    }
    else if (focusMode === "playlist_form") {
      const fields = document.querySelectorAll(".form-focusable"); fields[formIndex].click();
    }
    if (focusMode === "settings" && settingsIdx === 2) toggleLanguage();
    if (focusMode === "cards" && globalFiltered[cardIdx]) {
      const item = globalFiltered[cardIdx]; localStorage.setItem("current", JSON.stringify(item));
      window.location.href = (item.url || item.type === "live") ? "player.html" : "details.html";
    }
  }
  updateFocus();
});

window.onload = () => {
  const savedLive = JSON.parse(localStorage.getItem("xt_live"));
  if(savedLive && savedLive.length > 0) {
    liveChannels = savedLive; moviesList = JSON.parse(localStorage.getItem("xt_movies")) || []; seriesList = JSON.parse(localStorage.getItem("xt_series")) || [];
    sidebarIdx = 1; focusMode = "sidebar";
  } else { loadTestData(); }
  applyLanguage(); switchView(sidebarViews[sidebarIdx]); updateFocus();
  setInterval(updateClockAndDay, 1000); measureConnectionSpeed();
};
