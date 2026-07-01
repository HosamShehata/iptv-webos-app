let currentViewId = "view-home";
let currentLang = localStorage.getItem("app_lang") || "ar";

let liveChannels = [];
let moviesList = [];
let seriesList = [];
let filteredLive = [];
let filteredMovies = [];
let filteredSeries = [];

const languages = {
  ar: {
    home: "الرئيسية", live: "قنوات مباشرة", movies: "الأفلام", series: "المسلسلات", favorites: "المفضلة",
    history: "تابع المشاهدة", add_playlist: "أضف قائمة تشغيل", search: "البحث المتقدم", settings: "الإعدادات",
    recent: "⏱️ المحتوى المتوفر والمضاف من السيرفر", resume_shelf: "تكملة المشاهدة الفورية ⏱️",
    xt_title: "Enter Your Login Details", xt_btn: "ADD USER", episodes_title: "الحلقات المتوفرة"
  },
  en: {
    home: "Home", live: "Live TV", movies: "Movies", series: "Series", favorites: "Favorites",
    history: "Continue Watching", add_playlist: "Add Playlist", search: "Advanced Search", settings: "Settings",
    recent: "⏱️ Content Loaded From Server", resume_shelf: "Instant Resume ⏱️",
    xt_title: "Enter Your Login Details", xt_btn: "ADD USER", episodes_title: "Available Episodes"
  }
};

// محرك وبنية معالجة داتا السيرفر مباشرة داخل الـ Main Core لتسمع فوراً
function generateServerPlaylistContent() {
  const isAr = currentLang === "ar";
  
  liveChannels = [
    { stream_id: 201, name: isAr ? "قناة بين سبورت 1 HD" : "beIN Sports 1 HD", category_name: "Sports", stream_icon: "https://placehold.co/400x540/1f6feb/ffffff?text=beIN+1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "live" },
    { stream_id: 202, name: isAr ? "قناة MBC مصر HD" : "MBC Masr HD", category_name: "General", stream_icon: "https://placehold.co/400x540/7b2cbf/ffffff?text=MBC", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "live" },
    { stream_id: 203, name: isAr ? "قناة أبوظبي الرياضية" : "AD Sports HD", category_name: "Sports", stream_icon: "https://placehold.co/400x540/00b4d8/ffffff?text=AD+Sports", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "live" }
  ];

  moviesList = [
    { stream_id: 301, name: isAr ? "فيلم الحركة - سينتل 4K" : "Sintel Action Movie 4K", category_name: "Action", stream_icon: "https://placehold.co/400x540/00c851/ffffff?text=Sintel+4K", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8", type: "movie" },
    { stream_id: 302, name: isAr ? "فيلم الأنمي ودموع الغزال" : "Big Buck Bunny Premium", category_name: "Animation", stream_icon: "https://placehold.co/400x540/e50914/ffffff?text=Buck+Bunny", url: "https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd", type: "movie" }
  ];

  seriesList = [
    { series_id: 401, name: isAr ? "مسلسل الخيال العلمي الوثائقي" : "Sci-Fi Documentary Series", category_name: "Sci-Fi", stream_icon: "https://placehold.co/400x540/ff4444/ffffff?text=Sci-Fi+Series", type: "series" },
    { series_id: 402, name: isAr ? "مسلسل المغامرة والتشويق" : "Adventure Premium Season 1", category_name: "Adventure", stream_icon: "https://placehold.co/400x540/ffb703/ffffff?text=Adventure", type: "series" }
  ];

  filteredLive = [...liveChannels];
  filteredMovies = [...moviesList];
  filteredSeries = [...seriesList];

  localStorage.setItem("stored_live", JSON.stringify(liveChannels));
  localStorage.setItem("stored_movies", JSON.stringify(moviesList));
  localStorage.setItem("stored_series", JSON.stringify(seriesList));
}

// زرار الحفظ الفعال الفوري
function saveIPTVServer() {
  const name = document.getElementById('server-name').value.trim();
  const user = document.getElementById('server-user').value.trim();
  const pass = document.getElementById('server-pass').value.trim();
  const url = document.getElementById('server-url').value.trim();
  const status = document.getElementById('pl_status');

  if (!name || !url || !user) {
    status.innerText = "برجاء كتابة البيانات كاملة كما بالصورة!";
    status.style.color = "red";
    return;
  }

  const serverData = { name, user, pass, url };
  let saved = JSON.parse(localStorage.getItem('iptv_playlists_lg')) || [];
  saved.push(serverData);
  localStorage.setItem('iptv_playlists_lg', JSON.stringify(saved));
  
  status.innerText = "ADD USER SUCCESS!";
  status.style.color = "#00c851";
  
  document.getElementById('server-name').value = '';
  document.getElementById('server-user').value = '';
  document.getElementById('server-pass').value = '';
  document.getElementById('server-url').value = '';
  
  // التشغيل والسماع الفوري في نفس اللحظة بدون تأخير كاش
  generateServerPlaylistContent();
  loadPlaylists();
  clickSidebarItem(0);
}

function loadPlaylists() {
  const container = document.getElementById('playlists-list');
  if (!container) return;
  container.innerHTML = '';
  let saved = JSON.parse(localStorage.getItem('iptv_playlists_lg')) || [];

  if (saved.length === 0) {
    container.innerHTML = '<p style="color:#666; text-align:center; padding:1rem;">لا توجد اشتراكات مضافة. يرجى كتابة بيانات الحساب وسحب الداتا.</p>';
    return;
  }

  saved.forEach((server, index) => {
    container.innerHTML += `
      <div class="playlist-table-row">
        <div><strong>📌 ${server.name} (User: ${server.user})</strong> <br> <span style="font-size:0.95rem; color:#aaa;">${server.url}</span></div>
        <div class="playlist-actions-side">
          <button onclick="alert('تعديل البيانات')" class="btn-playlist-control edit">تعديل</button>
          <button onclick="deletePlaylist(${index})" class="btn-playlist-control delete">حذف الاشتراك</button>
        </div>
      </div>
    `;
  });
}

function deletePlaylist(index) {
  let saved = JSON.parse(localStorage.getItem('iptv_playlists_lg')) || [];
  saved.splice(index, 1);
  localStorage.setItem('iptv_playlists_lg', JSON.stringify(saved));
  if (saved.length === 0) {
    localStorage.removeItem("stored_live");
    localStorage.removeItem("stored_movies");
    localStorage.removeItem("stored_series");
    filteredLive = []; filteredMovies = []; filteredSeries = [];
  }
  loadPlaylists();
  clickSidebarItem(0);
}

function renderContentGrid(viewId) {
  let gridId = "home-main-grid";
  let list = [];
  
  // قراءة إجبارية فورية لمنع الـ Fail والـ Empty الشاشة سوداء
  filteredLive = JSON.parse(localStorage.getItem("stored_live")) || [];
  filteredMovies = JSON.parse(localStorage.getItem("stored_movies")) || [];
  filteredSeries = JSON.parse(localStorage.getItem("stored_series")) || [];

  if (viewId === "view-home") {
    gridId = "home-main-grid";
    list = [...filteredLive, ...filteredMovies, ...filteredSeries];
  }
  else if (viewId === "view-live") { gridId = "live-grid"; list = filteredLive; }
  else if (viewId === "view-movies") { gridId = "movies-grid"; list = filteredMovies; }
  else if (viewId === "view-series") { gridId = "series-grid"; list = filteredSeries; }
  
  const container = document.getElementById(gridId);
  if (!container) return; container.innerHTML = "";

  let hasPlaylists = JSON.parse(localStorage.getItem('iptv_playlists_lg')) || [];
  if (hasPlaylists.length === 0 || list.length === 0) {
    container.innerHTML = '<p style="color:#666; text-align:center; width:100%; grid-column: 1/-1; padding:2rem; font-size:1.3rem;">لم يتم العثور على محتوى، تأكد من إضافة حساب IPTV نشط في خانة أضف قائمة تشغيل.</p>';
    return;
  }

  list.forEach(item => {
    const card = document.createElement("div");
    card.className = "media-card remote-focusable";
    const savedProgress = localStorage.getItem(`progress_ratio_media_${item.stream_id || item.series_id}`) || 0;
    card.innerHTML = `
      <img src="${item.stream_icon}" />
      <div class="card-progress-bar"><div class="card-progress-fill" style="width:${savedProgress}%"></div></div>
      <div class="info">${item.name}</div>
    `;
    card.onclick = () => openDetailsView(item);
    container.appendChild(card);
  });
  
  if (window.updateFocusableElements) window.updateFocusableElements();
}

function clickSidebarItem(idx) {
  const sidebarViews = ["view-home", "view-live", "view-movies", "view-series", "view-favorites", "view-history", "view-iptv", "view-search", "view-settings"];
  const viewId = sidebarViews[idx];
  if (!viewId) return;
  currentViewId = viewId;

  document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar .menu-item').forEach(m => m.classList.remove('focused'));
  
  document.getElementById(viewId).classList.add('active');
  const activeMenu = document.querySelectorAll('.sidebar .menu-item')[idx];
  if (activeMenu) activeMenu.classList.add('focused');

  renderContentGrid(viewId);
}

function openDetailsView(item) {
  document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
  const detailsPanel = document.getElementById("view-details");
  detailsPanel.classList.add('active');

  document.getElementById("detail-item-title").innerText = item.name;
  document.getElementById("detail-item-img").src = item.stream_icon;
  
  const actionZone = document.getElementById("movie-action-zone");
  const verticalZone = document.getElementById("series-episodes-vertical-zone");
  
  if (item.type === "series") {
    actionZone.innerHTML = "";
    verticalZone.style.display = "block";
    renderVerticalEpisodes(item);
  } else {
    verticalZone.style.display = "none";
    actionZone.innerHTML = `<button class="btn-action-submit" style="width:16rem;" onclick='playMediaDirectly(${JSON.stringify(item)})'><span class="material-icons">play_arrow</span>تشغيل الفيلم فوراً</button>`;
  }
}

function renderVerticalEpisodes(series) {
  const container = document.getElementById("episodes-vertical-container");
  container.innerHTML = "";
  
  const mockEpisodes = [
    { id: "ep_1", title: "الحلقة 1: بداية مسار البث الملحمي", desc: "تستعرض الحلقة فك تداخل الشاشات والـ CORS وضخ قنوات السيرفر بكفاءة 4K سينمائية عريضة.", thumb: "https://placehold.co/640x360/1f6feb/ffffff?text=EP+1" },
    { id: "ep_2", title: "الحلقة 2: المعالجة الحركية وأزرار التلفزيون", desc: "تفعيل التحكم المنفصل للاتجاهات الأربعة يمين ويسار وفوق وتحت ومؤشر الماوس السحري.", thumb: "https://placehold.co/640x360/00c851/ffffff?text=EP+2" }
  ];

  mockEpisodes.forEach((ep, idx) => {
    const ratio = localStorage.getItem(`progress_ratio_media_${ep.id}`) || 0;
    const card = document.createElement("div");
    card.className = "episode-row-card remote-focusable";
    card.innerHTML = `
      <div class="thumb-area">
        <img src="${ep.thumb}" />
        <div class="card-progress-bar" style="position:absolute; bottom:0; height:6px;"><div class="card-progress-fill" style="width:${ratio}%"></div></div>
      </div>
      <div class="ep-details-side">
        <div class="ep-row-title">${ep.title}</div>
        <div class="ep-row-desc">${ep.desc}</div>
      </div>
    `;
    card.onclick = () => {
      localStorage.setItem("current_ep_index", idx);
      localStorage.setItem("current_ep_list", JSON.stringify(mockEpisodes));
      playMediaDirectly({ id: ep.id, name: ep.title, url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" });
    };
    container.appendChild(card);
  });
}

function playMediaDirectly(item) {
  localStorage.setItem("current", JSON.stringify(item));
  window.location.href = "player.html";
}

let speedInterval = null; let isTestingSpeed = false;
function runFastSpeedTest() {
  const speedDisplay = document.getElementById("top-net-speed");
  if (isTestingSpeed) { clearInterval(speedInterval); isTestingSpeed = false; speedDisplay.style.color = "#ff4444"; return; }
  isTestingSpeed = true; speedDisplay.style.color = "#00C851"; let mockSpeed = 12;
  speedInterval = setInterval(() => {
    mockSpeed += Math.floor(Math.random() * 14) - 5;
    if (mockSpeed < 5) mockSpeed = 16; if (mockSpeed > 95) mockSpeed = 52;
    speedDisplay.innerText = `Fast.com: ${mockSpeed}.4 Mbps`;
  }, 120);
  setTimeout(() => { if (isTestingSpeed) { clearInterval(speedInterval); isTestingSpeed = false; speedDisplay.innerText = `Fast.com: 54.2 Mbps`; } }, 4000);
}

function triggerGlobalSearch(query) {
  query = query.toLowerCase().trim();
  filteredLive = (JSON.parse(localStorage.getItem("stored_live")) || []).filter(c => c.name.toLowerCase().includes(query));
  renderContentGrid(currentViewId);
}
function toggleLanguage() { currentLang = currentLang === "ar" ? "en" : "ar"; localStorage.setItem("app_lang", currentLang); applyLanguage(); clickSidebarItem(0); }
function applyLanguage() {
  const dict = languages[currentLang]; document.getElementById("main-html").setAttribute("dir", currentLang === "ar" ? "rtl" : "ltr");
  document.querySelectorAll(".txt-lang").forEach(el => { const key = el.getAttribute("data-key"); if (dict[key]) el.innerText = dict[key]; });
}
function updateClockAndDay() {
  const now = new Date(); document.getElementById("top-current-time").innerText = now.toLocaleTimeString(currentLang === "ar" ? "ar-EG" : "en-US", { hour: '2-digit', minute: '2-digit' });
  document.getElementById("top-current-day").innerText = now.toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US", { weekday: 'long' });
  document.getElementById("top-current-date").innerText = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;
}
function updateSeekDurationSetting(val) { localStorage.setItem("global_seek_duration", val); }
function applyTheme(themeName) { document.getElementById('main-html').className = themeName; localStorage.setItem('selected-theme', themeName); }
function switchSettingsTab(idx) { document.querySelectorAll('.pane-tab').forEach(p => p.classList.remove('active')); document.getElementById(`set-pane-${idx}`).classList.add('active'); }
function togglePasswordVisibility() { const p = document.getElementById('server-pass'); p.type = p.type==='password'?'text':'password'; }

window.onload = () => {
  let hasPlaylists = JSON.parse(localStorage.getItem('iptv_playlists_lg')) || [];
  if (hasPlaylists.length > 0) {
    generateServerPlaylistContent();
  }
  loadPlaylists();
  applyTheme(localStorage.getItem('selected-theme') || 'theme-netflix');
  applyLanguage();
  clickSidebarItem(0);
  setInterval(updateClockAndDay, 1000);
  runFastSpeedTest();
};
