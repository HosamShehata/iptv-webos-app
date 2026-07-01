let liveChannels = [];
let moviesList = [];
let seriesList = [];
let globalFiltered = [];
let activeSubCategories = ["الكل"];

const sidebarViews = ["view-home", "view-live", "view-movies", "view-series", "view-favorites", "view-history", "view-playlist", "view-search", "view-settings"];
const subSettingsIds = ["sub-set-account", "sub-set-theme", "sub-set-language", "sub-set-parental", "sub-set-about"];

let focusMode = "sidebar"; 
let sidebarIdx = 0; 
let filterIdx = 0;
let cardIdx = 0;
let formIndex = 2;         
let settingsIdx = 0;
let columnsCount = 5;

let currentPlaylistType = "xtream"; 
let currentLang = localStorage.getItem("app_lang") || "ar";

const languages = {
  ar: {
    home: "الرئيسية", live: "قنوات مباشرة", movies: "الأفلام", series: "المسلسلات", favorites: "المفضلة",
    history: "تابع المشاهدة", add_playlist: "أضف قائمة تشغيل", search: "البحث المتقدم", settings: "الإعدادات",
    hero_desc: "استمتع بـ تجربة مشاهدة لا حدود لها بدقة 4K ULTRA HD وأحدث تقنيات الصوت الرقمي.",
    recent: "⏱️ تابع المشاهدة مؤخراً", xt_title: "أضف قائمة تشغيل", xt_btn: "إضافة",
    set_acc: "الحساب والاشتراك", set_theme: "المظهر والسمات", set_parent: "الرقابة الأبوية والقفل", set_about: "حول التطبيق",
    set_lang_menu: "اللغة والترجمة", no_content: "القائمة فارغة. برجاء إضافة قائمة تشغيل حية من القسم المختص.",
    sidebar_lang: "English"
  },
  en: {
    home: "Home", live: "Live TV", movies: "Movies", series: "Series", favorites: "Favorites",
    history: "Continue Watching", add_playlist: "Add Playlist", search: "Advanced Search", settings: "Settings",
    hero_desc: "Enjoy an unlimited viewing experience with 4K ULTRA HD and the latest digital sound technologies.",
    recent: "⏱️ Continue Watching", xt_title: "Add Playlist", xt_btn: "Add",
    set_acc: "Account & Subscription", set_theme: "Appearance", set_parent: "Parental Control", set_about: "About App",
    set_lang_menu: "Language / الترجمة", no_content: "The list is empty. Please add a live playlist from the dedicated section.",
    sidebar_lang: "العربية"
  }
};

function loadTestData() {
  const isAr = currentLang === "ar";
  
  liveChannels = [
    { stream_id: 901, name: isAr ? "قناة حية تجريبية 1" : "Live Demo Stream 1", category_name: isAr ? "بث تجريبي" : "Demo Live", stream_icon: "https://placehold.co/200x270/1f6feb/ffffff?text=LIVE+1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "live" },
    { stream_id: 902, name: isAr ? "قناة بي إن تيست حية" : "beIN Test Stream", category_name: isAr ? "بث تجريبي" : "Demo Live", stream_icon: "https://placehold.co/200x270/00c851/ffffff?text=beIN", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "live" }
  ];

  moviesList = [
    { stream_id: 903, name: "Sintel (Movie Test)", category_name: isAr ? "أفلام تيست" : "Demo Movies", stream_icon: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8", container_extension: "m3u8", type: "movie" },
    { stream_id: 904, name: "Big Buck Bunny", category_name: isAr ? "أفلام تيست" : "Demo Movies", stream_icon: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", container_extension: "m3u8", type: "movie" }
  ];

  seriesList = [
    { series_id: 905, name: "Tears of Steel (Series Test)", category_name: isAr ? "مسلسلات تيست" : "Demo Series", stream_icon: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400", type: "series" }
  ];
}

function updateClockAndDay() {
  const now = new Date();
  let optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true };
  document.getElementById("top-current-time").innerText = now.toLocaleTimeString(currentLang === "ar" ? "ar-EG" : "en-US", optionsTime);
  let optionsDay = { weekday: 'long' };
  document.getElementById("top-current-day").innerText = now.toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US", optionsDay);
  let dayNum = String(now.getDate()).padStart(2, '0');
  let monthNum = String(now.getMonth() + 1).padStart(2, '0');
  document.getElementById("top-current-date").innerText = `${dayNum}/${monthNum}/${now.getFullYear()}`;
}

function measureConnectionSpeed() {
  document.getElementById("top-net-speed").innerText = "48.5 Mbps";
}

function clickSidebarItem(idx) {
  focusMode = "sidebar";
  sidebarIdx = idx;
  switchView(sidebarViews[sidebarIdx]);
  updateFocus();
}

function clickSettingsItem(idx) {
  focusMode = "settings";
  settingsIdx = idx;
  showSubSettings(idx);
  updateFocus();
}

function showSubSettings(idx) {
  document.querySelectorAll(".sub-settings-panel").forEach(p => p.classList.remove("active"));
  const activePanel = document.getElementById(subSettingsIds[idx]);
  if(activePanel) { activePanel.classList.add("active"); }
}

function updateSeekDurationSetting(sec) {
  localStorage.setItem("global_seek_duration", sec);
  alert(currentLang === "ar" ? `تم تحديد مدة قفز الريموت: ${sec} ثانية` : `Seek duration set to ${sec} seconds`);
}

function switchView(viewId) {
  document.querySelectorAll(".view-panel").forEach(panel => panel.classList.remove("active"));
  const activePanel = document.getElementById(viewId);
  if(activePanel) { activePanel.classList.add("active"); }

  if(viewId === "view-playlist") { focusMode = "playlist_form"; switchPlaylistType(currentPlaylistType); return; }
  if(viewId === "view-settings") { focusMode = "settings"; showSubSettings(settingsIdx); return; }

  const defaultAll = (currentLang === "ar") ? "الكل" : "All";
  const set = new Set([defaultAll]);
  if (viewId === "view-live") liveChannels.forEach(ch => { if(ch.category_name) set.add(ch.category_name); });
  if (viewId === "view-movies") moviesList.forEach(m => { if(m.category_name) set.add(m.category_name); });
  if (viewId === "view-series") seriesList.forEach(s => { if(s.category_name) set.add(s.category_name); });
  
  activeSubCategories = Array.from(set);
  renderSubFilters();
  renderContentGrid(viewId);
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

function saveToGlobalHistory(item) {
  let history = JSON.parse(localStorage.getItem("global_watch_history")) || [];
  history = history.filter(h => h.stream_id !== item.stream_id && h.series_id !== item.series_id);
  history.unshift(item);
  localStorage.setItem("global_watch_history", JSON.stringify(history.slice(0, 15)));
}

function renderContentGrid(viewId) {
  let targetGridId = ""; let dataList = [];
  if (viewId === "view-live") { targetGridId = "live-grid"; dataList = liveChannels; }
  else if (viewId === "view-movies") { targetGridId = "movies-grid"; dataList = moviesList; }
  else if (viewId === "view-series") { targetGridId = "series-grid"; dataList = seriesList; }
  else if (viewId === "view-favorites") { targetGridId = "favorites-grid"; dataList = JSON.parse(localStorage.getItem("favorites_list")) || []; }
  else if (viewId === "view-history") { targetGridId = "history-grid"; dataList = JSON.parse(localStorage.getItem("global_watch_history")) || []; }
  else if (viewId === "view-home") { targetGridId = "home-history-grid"; dataList = JSON.parse(localStorage.getItem("global_watch_history")) || []; }
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
      if (item.type === "live") {
        if(!item.url) {
          const creds = JSON.parse(localStorage.getItem("xtream_creds")) || {url:"", user:"", pass:""};
          item.url = `${creds.url}/live/${creds.user}/${creds.pass}/${item.stream_id}.ts`;
        }
        localStorage.setItem("current", JSON.stringify(item)); window.location.href = "player.html";
      } else { window.location.href = "details.html"; }
    };
    container.appendChild(card);
  });
}

// استكمال بقية وظائف الريموت والبحث...
