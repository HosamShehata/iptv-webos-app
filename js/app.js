let liveChannels = []; let moviesList = []; let seriesList = []; let globalFiltered = [];
let activeSubCategories = ["الكل"];
const sidebarViews = ["view-home", "view-live", "view-movies", "view-series", "", "", "view-iptv", "", "view-settings"];
let sidebarIdx = 0; let filterIdx = 0; let cardIdx = 0;
let currentLang = localStorage.getItem("app_lang") || "ar";

const languages = {
  ar: {
    home: "الرئيسية", live: "قنوات مباشرة", movies: "الأفلام", series: "المسلسلات", favorites: "المفضلة",
    history: "تابع المشاهدة", add_playlist: "أضف قائمة تشغيل", search: "البحث المتقدم", settings: "الإعدادات",
    recent: "⏱️ تابع المشاهدة مؤخراً", resume_shelf: "تكملة المشاهدة الفورية ⏱️", xt_title: "أضف قائمة تشغيل IPTV", xt_btn: "حفظ وإضافة البلاي ليست بشكل دائم", sidebar_lang: "English"
  },
  en: {
    home: "Home", live: "Live TV", movies: "Movies", series: "Series", favorites: "Favorites",
    history: "Continue Watching", add_playlist: "Add Playlist", search: "Advanced Search", settings: "Settings",
    recent: "⏱️ Continue Watching", resume_shelf: "Instant Resume ⏱️", xt_title: "Add IPTV Playlist", xt_btn: "Save Playlist Permanently", sidebar_lang: "العربية"
  }
};

function loadTestData() {
  const isAr = currentLang === "ar";
  liveChannels = [
    { stream_id: 901, name: isAr ? "قناة بين سبورت 1 HD" : "beIN Sports 1 HD", category_name: isAr ? "رياضة" : "Sports", stream_icon: "https://placehold.co/400x540/1f6feb/ffffff?text=beIN+1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type:"live" }
  ];
  moviesList = [
    { stream_id: 903, name: "Sintel Movie 4K", category_name: isAr ? "أفلام حركة" : "Action Movies", stream_icon: "https://placehold.co/400x540/00c851/ffffff?text=Sintel", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8", type:"movie" }
  ];
  seriesList = [
    { series_id: 905, name: isAr ? "مسلسل خيال علمي وثائقي" : "Sci-Fi Documentary", category_name: isAr ? "مسلسلات" : "Series", stream_icon: "https://placehold.co/400x540/ff4444/ffffff?text=SciFi", type:"series" }
  ];
}

function togglePasswordVisibility() {
  const passInput = document.getElementById('server-pass');
  passInput.type = (passInput.type === 'password') ? 'text' : 'password';
}

// دالة حفظ وحقن البلاي ليست الثابتة في الـ LocalStorage لمنع تكرار طلبها
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
  
  status.innerText = "تم حفظ وتثبيت البلاي ليست بنجاح في الذاكرة!"; status.style.color = "#00c851";
  document.getElementById('server-name').value = ''; document.getElementById('server-url').value = ''; document.getElementById('server-pass').value = '';
  
  loadPlaylists();
}

function loadPlaylists() {
  const container = document.getElementById('playlists-list'); if(!container) return;
  container.innerHTML = '';
  let saved = JSON.parse(localStorage.getItem('iptv_playlists')) || [];

  if (saved.length === 0) {
    container.innerHTML = '<p style="color: #666;">لا توجد قوائم تشغيل مثبتة حالياً.</p>'; return;
  }

  saved.forEach((server, index) => {
    container.innerHTML += `
      <div class="playlist-item">
        <div><strong>${server.name}</strong> <br> <span style="font-size:0.9rem; color:#aaa;">${server.url}</span></div>
        <button onclick="deletePlaylist(${index})" style="background:red; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">حذف</button>
      </div>
    `;
  });
}

function deletePlaylist(index) {
  let saved = JSON.parse(localStorage.getItem('iptv_playlists')) || [];
  saved.splice(index, 1); localStorage.setItem('iptv_playlists', JSON.stringify(saved));
  loadPlaylists();
}

function updateClockAndDay() {
  const now = new Date();
  document.getElementById("top-current-time").innerText = now.toLocaleTimeString(currentLang === "ar" ? "ar-EG" : "en-US", { hour: '2-digit', minute: '2-digit' });
  document.getElementById("top-current-day").innerText = now.toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US", { weekday: 'long' });
  document.getElementById("top-current-date").innerText = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;
}

function updateSeekDurationSetting(val) { localStorage.setItem("global_seek_duration", val); }
function applyTheme(themeName) { document.getElementById('main-html').className = themeName; localStorage.setItem('selected-theme', themeName); }

function switchSettingsTab(idx) {
  document.querySelectorAll('.sub-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.settings-nav .menu-item').forEach(i => i.classList.remove('focused'));
  document.getElementById(`set-pane-${idx}`).classList.add('active');
  document.getElementById(`stab-${idx}`).classList.add('focused');
}

function clickSidebarItem(idx) {
  sidebarIdx = idx; const viewId = sidebarViews[idx]; if(!viewId) return;
  document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar .menu-item').forEach(m => m.classList.remove('focused'));
  
  document.getElementById(viewId).classList.add('active');
  document.querySelectorAll('.sidebar .menu-item')[idx === 8 ? 5 : (idx === 6 ? 4 : idx)].classList.add('focused');

  // إظهار الرف التكميلي الحركي للمشاهدة
  const shelf = document.getElementById("continue-watching-sub-shelf");
  const historyData = JSON.parse(localStorage.getItem("global_watch_history")) || [];
  if(viewId !== "view-settings" && viewId !== "view-iptv" && historyData.length > 0) {
    shelf.style.display = "block"; renderSubShelf(historyData);
  } else { shelf.style.display = "none"; }

  renderContentGrid(viewId);
}

function renderSubShelf(data) {
  const grid = document.getElementById("sub-shelf-grid"); grid.innerHTML = "";
  data.slice(0, 4).forEach(item => {
    const card = document.createElement("div"); card.className = "media-card";
    card.innerHTML = `<img src="${item.stream_icon || 'https://placehold.co/400x540'}" /><div class="info">${item.name}</div>`;
    card.onclick = () => { localStorage.setItem("current", JSON.stringify(item)); window.location.href = (item.type==="series")?"details.html":"player.html"; };
    grid.appendChild(card);
  });
}

function renderSubFilters() {
  const bar = document.getElementById("subFilterBar"); if(!bar) return; bar.innerHTML = "";
  if(sidebarViews[sidebarIdx] === "view-iptv" || sidebarViews[sidebarIdx] === "view-settings") { bar.style.display = "none"; return; }
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
  if(viewId === "view-home") { gridId = "home-history-grid"; list = JSON.parse(localStorage.getItem("global_watch_history")) || []; }
  
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
  const dict = languages[currentLang]; document.getElementById("main-html").setAttribute("dir", currentLang === "ar"?"rtl":"ltr");
  document.getElementById("lbl-sidebar-lang").innerText = dict.sidebar_lang;
  document.querySelectorAll(".txt-lang").forEach(el => { const key = el.getAttribute("data-key"); if(dict[key]) el.innerText = dict[key]; });
  updateClockAndDay();
}
function toggleLanguage() { currentLang = (currentLang === "ar")?"en":"ar"; localStorage.setItem("app_lang", currentLang); applyLanguage(); loadTestData(); clickSidebarItem(sidebarIdx); }

window.onload = () => {
  loadPlaylists(); const activeTheme = localStorage.getItem('selected-theme') || 'theme-netflix'; applyTheme(activeTheme);
  loadTestData(); applyLanguage(); clickSidebarItem(0); setInterval(updateClockAndDay, 1000);
};
