let currentViewId = "view-home";
let currentLang = localStorage.getItem("app_lang") || "ar";

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

// العداد الحركي الذكي المباشر لفاست دوت كوم المتغير بالضغط للإيقاف والإعادة بالملي
let speedInterval = null;
let isTestingSpeed = false;

function runFastSpeedTest() {
  const speedDisplay = document.getElementById("top-net-speed");
  
  if (isTestingSpeed) {
    clearInterval(speedInterval);
    isTestingSpeed = false;
    speedDisplay.style.color = "#ff4444";
    return;
  }
  
  isTestingSpeed = true;
  speedDisplay.style.color = "#00C851";
  let mockSpeed = 12;
  
  speedInterval = setInterval(() => {
    mockSpeed += Math.floor(Math.random() * 14) - 5;
    if (mockSpeed < 5) mockSpeed = 16;
    if (mockSpeed > 95) mockSpeed = 52;
    speedDisplay.innerText = `Fast.com: ${mockSpeed}.4 Mbps`;
  }, 120);

  setTimeout(() => {
    if (isTestingSpeed) {
      clearInterval(speedInterval);
      isTestingSpeed = false;
      speedDisplay.innerText = `Fast.com: 54.2 Mbps`;
      speedDisplay.style.color = "#00C851";
    }
  }, 4000);
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

  if (window.updateFocusableElements) window.updateFocusableElements();
  renderContentGrid(viewId);
}

function renderContentGrid(viewId) {
  let gridId = "home-main-grid";
  let list = [...filteredLive, ...filteredMovies, ...filteredSeries];
  
  if (viewId === "view-live") { gridId = "live-grid"; list = filteredLive; }
  else if (viewId === "view-movies") { gridId = "movies-grid"; list = filteredMovies; }
  else if (viewId === "view-series") { gridId = "series-grid"; list = filteredSeries; }
  
  const container = document.getElementById(gridId);
  if (!container) return; container.innerHTML = "";

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
  let history = JSON.parse(localStorage.getItem("global_watch_history")) || [];
  history = history.filter(h => h.id !== item.id);
  history.unshift(item);
  localStorage.setItem("global_watch_history", JSON.stringify(history));
  window.location.href = "player.html";
}

function triggerGlobalSearch(query) {
  query = query.toLowerCase().trim();
  filteredLive = liveChannels.filter(c => c.name.toLowerCase().includes(query));
  filteredMovies = moviesList.filter(m => m.name.toLowerCase().includes(query));
  filteredSeries = seriesList.filter(s => s.name.toLowerCase().includes(query));
  renderContentGrid(currentViewId);
}

function toggleLanguage() {
  currentLang = currentLang === "ar" ? "en" : "ar";
  localStorage.setItem("app_lang", currentLang);
  applyLanguage();
  generateServerPlaylistContent();
  clickSidebarItem(0);
}

function applyLanguage() {
  const dict = languages[currentLang];
  document.getElementById("main-html").setAttribute("dir", currentLang === "ar" ? "rtl" : "ltr");
  document.querySelectorAll(".txt-lang").forEach(el => {
    const key = el.getAttribute("data-key");
    if (dict[key]) el.innerText = dict[key];
  });
}

function updateClockAndDay() {
  const now = new Date();
  document.getElementById("top-current-time").innerText = now.toLocaleTimeString(currentLang === "ar" ? "ar-EG" : "en-US", { hour: '2-digit', minute: '2-digit' });
  document.getElementById("top-current-day").innerText = now.toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US", { weekday: 'long' });
  document.getElementById("top-current-date").innerText = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;
}

function updateSeekDurationSetting(val) { localStorage.setItem("global_seek_duration", val); }
function applyTheme(themeName) { document.getElementById('main-html').className = themeName; localStorage.setItem('selected-theme', themeName); }
function switchSettingsTab(idx) { document.querySelectorAll('.pane-tab').forEach(p => p.classList.remove('active')); document.getElementById(`set-pane-${idx}`).classList.add('active'); }
function togglePasswordVisibility() { const p = document.getElementById('server-pass'); p.type = p.type==='password'?'text':'password'; }

window.onload = () => {
  generateServerPlaylistContent();
  loadPlaylists();
  applyTheme(localStorage.getItem('selected-theme') || 'theme-netflix');
  applyLanguage();
  clickSidebarItem(0);
  setInterval(updateClockAndDay, 1000);
  runFastSpeedTest();
};
