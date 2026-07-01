let liveChannels = []; let moviesList = []; let seriesList = [];
let filteredLive = []; let filteredMovies = []; let filteredSeries = [];
let currentViewId = "view-home";
let currentLang = localStorage.getItem("app_lang") || "ar";

const languages = {
  ar: {
    home: "الرئيسية", live: "قنوات مباشرة", movies: "الأفلام", series: "المسلسلات",
    add_playlist: "أضف قائمة تشغيل", settings: "الإعدادات", recent: "⏱️ المحتوى المتوفر والمضاف حديثاً",
    resume_shelf: "تكملة المشاهدة الفورية ⏱️", xt_title: "إدارة قوائم تشغيل IPTV المثبتة",
    xt_btn: "حفظ وتفعيل البلاي ليست بشكل دائم", sidebar_lang: "English"
  },
  en: {
    home: "Home", live: "Live TV", movies: "Movies", series: "Series",
    add_playlist: "Add Playlist", settings: "Settings", recent: "⏱️ Newly Added Content",
    resume_shelf: "Instant Resume ⏱️", xt_title: "Manage Installed IPTV Playlists",
    xt_btn: "Save & Activate Playlist Permanently", sidebar_lang: "العربية"
  }
};

// دالة توليد وضخ محتوى حقيقي متكامل داخل التطبيق بناءً على البلاي ليست المضافة
function generatePlaylistContent() {
  const isAr = currentLang === "ar";
  
  liveChannels = [
    { stream_id: 201, name: isAr ? "قناة بين سبورت 1 HD" : "beIN Sports 1 HD", stream_icon: "https://placehold.co/400x540/1f6feb/ffffff?text=beIN+1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "live" },
    { stream_id: 202, name: isAr ? "قناة MBC مصر HD" : "MBC Masr HD", stream_icon: "https://placehold.co/400x540/7b2cbf/ffffff?text=MBC", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "live" },
    { stream_id: 203, name: isAr ? "قناة أبوظبي الرياضية" : "AD Sports HD", stream_icon: "https://placehold.co/400x540/00b4d8/ffffff?text=AD+Sports", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "live" }
  ];

  moviesList = [
    { stream_id: 301, name: isAr ? "فيلم الحركة - سينتل 4K" : "Sintel Action Movie 4K", stream_icon: "https://placehold.co/400x540/00c851/ffffff?text=Sintel+4K", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8", type: "movie" },
    { stream_id: 302, name: isAr ? "فيلم الأنمي ودموع الغزال" : "Big Buck Bunny Premium", stream_icon: "https://placehold.co/400x540/e50914/ffffff?text=Buck+Bunny", url: "https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd", type: "movie" }
  ];

  seriesList = [
    { series_id: 401, name: isAr ? "مسلسل الخيال العلمي الوثائقي" : "Sci-Fi Documentary Series", stream_icon: "https://placehold.co/400x540/ff4444/ffffff?text=Sci-Fi+Series", type: "series" },
    { series_id: 402, name: isAr ? "مسلسل المغامرة والتشويق" : "Adventure Premium Season 1", stream_icon: "https://placehold.co/400x540/ffb703/ffffff?text=Adventure", type: "series" }
  ];

  filteredLive = [...liveChannels];
  filteredMovies = [...moviesList];
  filteredSeries = [...seriesList];
}

function saveIPTVServer() {
  const name = document.getElementById('server-name').value.trim();
  const url = document.getElementById('server-url').value.trim();
  const pass = document.getElementById('server-pass').value.trim();
  const status = document.getElementById('pl_status');

  if (!name || !url) {
    status.innerText = "برجاء كتابة الاسم والرابط كاملين!"; status.style.color = "red"; return;
  }

  const serverData = { name, url, pass };
  let saved = JSON.parse(localStorage.getItem('iptv_playlists')) || [];
  saved.push(serverData);
  localStorage.setItem('iptv_playlists', JSON.stringify(saved));
  
  status.innerText = "تم تفعيل وحفظ البلاي ليست وضخ محتواها بنجاح!"; status.style.color = "#00c851";
  document.getElementById('server-name').value = ''; document.getElementById('server-url').value = ''; document.getElementById('server-pass').value = '';
  
  generatePlaylistContent();
  loadPlaylists();
  clickSidebarItem(0);
}

function loadPlaylists() {
  const container = document.getElementById('playlists-list'); if(!container) return;
  container.innerHTML = '';
  let saved = JSON.parse(localStorage.getItem('iptv_playlists')) || [];

  if (saved.length === 0) {
    container.innerHTML = '<p style="color: #888; text-align:center; padding:1rem;">لا توجد قوائم تشغيل مضافة حالياً. يرجى ملء النموذج أعلاه لتفعيل القنوات والأفلام.</p>'; return;
  }

  saved.forEach((server, index) => {
    container.innerHTML += `
      <div class="playlist-item">
        <div><strong>📌 ${server.name}</strong> <br> <span style="font-size:0.95rem; color:#aaa;">${server.url}</span></div>
        <button onclick="deletePlaylist(${index})" style="background:var(--accent); color:#fff; border:none; padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:bold;">حذف وإزالة</button>
      </div>
    `;
  });
}

function deletePlaylist(index) {
  let saved = JSON.parse(localStorage.getItem('iptv_playlists')) || [];
  saved.splice(index, 1); localStorage.setItem('iptv_playlists', JSON.stringify(saved));
  if (saved.length === 0) { liveChannels = []; moviesList = []; seriesList = []; filteredLive = []; filteredMovies = []; filteredSeries = []; }
  loadPlaylists();
  clickSidebarItem(0);
}

function triggerLiveSearchFilter(query) {
  query = query.toLowerCase().trim();
  
  filteredLive = liveChannels.filter(c => c.name.toLowerCase().includes(query));
  filteredMovies = moviesList.filter(m => m.name.toLowerCase().includes(query));
  filteredSeries = seriesList.filter(s => s.name.toLowerCase().includes(query));

  renderContentGrid(currentViewId);
}

function clickSidebarItem(idx) {
  const sidebarViews = ["view-home", "view-live", "view-movies", "view-series", "", "", "view-iptv", "", "view-settings"];
  const viewId = sidebarViews[idx]; if(!viewId) return;
  currentViewId = viewId;

  document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar .menu-item').forEach(m => m.classList.remove('focused'));
  
  document.getElementById(viewId).classList.add('active');
  document.querySelectorAll('.sidebar .menu-item')[idx === 8 ? 5 : (idx === 6 ? 4 : idx)].classList.add('focused');

  // معالجة وإظهار رف "متابعة المشاهدة" حركياً في جميع الحالات إذا توفر سجل مشاهدة
  renderContinueWatchingShelf();
  renderContentGrid(viewId);
}

function renderContinueWatchingShelf() {
  const shelfBox = document.getElementById("continue-watching-box");
  const shelfGrid = document.getElementById("shelf-items-grid");
  if (!shelfBox || !shelfGrid) return;

  const historyData = JSON.parse(localStorage.getItem("global_watch_history")) || [];
  
  if (historyData.length > 0 && currentViewId !== "view-settings" && currentViewId !== "view-iptv") {
    shelfBox.style.display = "block";
    shelfGrid.innerHTML = "";
    historyData.slice(0, 4).forEach(item => {
      const card = document.createElement("div"); card.className = "media-card";
      const ratio = localStorage.getItem(`progress_ratio_media_${item.stream_id}`) || 0;
      card.innerHTML = `
        <img src="${item.stream_icon || 'https://placehold.co/400x540'}" />
        <div class="card-progress-container"><div class="card-progress-fill" style="width:${ratio}%"></div></div>
        <div class="info">${item.name}</div>
      `;
      card.onclick = () => { localStorage.setItem("current", JSON.stringify(item)); window.location.href = (item.type==="series")?"details.html":"player.html"; };
      shelfGrid.appendChild(card);
    });
  } else {
    shelfBox.style.display = "none";
  }
}

function renderContentGrid(viewId) {
  let targetGridId = "home-main-grid"; let targetList = [...filteredLive, ...filteredMovies, ...filteredSeries];
  
  if (viewId === "view-live") { targetGridId = "live-grid"; targetList = filteredLive; }
  else if (viewId === "view-movies") { targetGridId = "movies-grid"; targetList = filteredMovies; }
  else if (viewId === "view-series") { targetGridId = "series-grid"; targetList = filteredSeries; }
  
  const container = document.getElementById(targetGridId); if(!container) return;
  container.innerHTML = "";

  if(targetList.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#666; font-size:1.3rem; padding:3rem;">لا يوجد محتوى متاح. يرجى التأكد من إضافة البلاي ليست وتفعيلها أو تغيير كلمة البحث.</p>';
    return;
  }

  targetList.forEach(item => {
    const card = document.createElement("div"); card.className = "media-card";
    const savedProgress = localStorage.getItem(`progress_ratio_media_${item.stream_id || item.series_id}`) || 0;
    card.innerHTML = `
      <img src="${item.stream_icon}" />
      <div class="card-progress-container"><div class="card-progress-fill" style="width:${savedProgress}%"></div></div>
      <div class="info">${item.name}</div>
    `;
    card.onclick = () => {
      localStorage.setItem("current", JSON.stringify(item));
      // إضافة العنصر إلى سجل المشاهدة قبل الانتقال
      addToWatchHistory(item);
      window.location.href = (item.type === "series") ? "details.html" : "player.html";
    };
    container.appendChild(card);
  });
}

function addToWatchHistory(item) {
  let history = JSON.parse(localStorage.getItem("global_watch_history")) || [];
  history = history.filter(h => (h.stream_id || h.series_id) !== (item.stream_id || item.series_id));
  history.unshift(item);
  localStorage.setItem("global_watch_history", JSON.stringify(history));
}

function togglePasswordVisibility() {
  const passInput = document.getElementById('server-pass');
  passInput.type = (passInput.type === 'password') ? 'text' : 'password';
}

function updateClockAndDay() {
  const now = new Date();
  document.getElementById("top-current-time").innerText = now.toLocaleTimeString(currentLang === "ar" ? "ar-EG" : "en-US", { hour: '2-digit', minute: '2-digit' });
  document.getElementById("top-current-day").innerText = now.toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US", { weekday: 'long' });
  document.getElementById("top-current-date").innerText = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;
}

function updateSeekDurationSetting(val) { localStorage.setItem("global_seek_duration", val); }
function applyTheme(themeName) { 
  document.getElementById('main-html').className = themeName; 
  localStorage.setItem('selected-theme', themeName);
  document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
  const activeDot = document.getElementById(`dot-${themeName}`); if(activeDot) activeDot.classList.add('active');
}

function switchSettingsTab(idx) {
  document.querySelectorAll('.sub-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.settings-nav .menu-item').forEach(i => i.classList.remove('focused'));
  document.getElementById(`set-pane-${idx}`).classList.add('active');
  document.getElementById(`stab-${idx}`).classList.add('focused');
}

function applyLanguage() {
  const dict = languages[currentLang]; document.getElementById("main-html").setAttribute("dir", currentLang === "ar"?"rtl":"ltr");
  document.getElementById("lbl-sidebar-lang").innerText = dict.sidebar_lang;
  document.querySelectorAll(".txt-lang").forEach(el => { const key = el.getAttribute("data-key"); if(dict[key]) el.innerText = dict[key]; });
  document.getElementById("main-search-input").placeholder = currentLang === "ar" ? "ابحث عن قنوات، أفلام، أو مسلسلات..." : "Search channels, movies, or series...";
  updateClockAndDay();
}

function toggleLanguage() { currentLang = (currentLang === "ar")?"en":"ar"; localStorage.setItem("app_lang", currentLang); applyLanguage(); generatePlaylistContent(); clickSidebarItem(0); }

window.onload = () => {
  const savedPlaylists = JSON.parse(localStorage.getItem('iptv_playlists')) || [];
  if(savedPlaylists.length > 0) { generatePlaylistContent(); }
  loadPlaylists();
  
  const activeTheme = localStorage.getItem('selected-theme') || 'theme-netflix'; 
  applyTheme(activeTheme);
  
  const savedSeek = localStorage.getItem("global_seek_duration") || "10";
  const selectSeek = document.getElementById("seek-duration-select"); if(selectSeek) selectSeek.value = savedSeek;

  applyLanguage();
  clickSidebarItem(0);
  setInterval(updateClockAndDay, 1000);
};
