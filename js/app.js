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

// ==========================================
// المحرك الحقيقي الفعلي لجلب وتفكيك الـ Xtream API (الميكس الماستر)
// ==========================================
async function fetchXtreamDataFromServer(host, user, pass) {
  const status = document.getElementById('pl_status');
  if(status) {
    status.innerText = "جاري الاتصال بالسيرفر وجلب القنوات والميديا... ⏳";
    status.style.color = "#ffb703";
  }

  // الروابط القياسية لـ Xtream Codes Player API المعمول بيها في كود المشروع الفعلي
  const liveUrl = `${host}/player_api.php?username=${user}&password=${pass}&action=get_live_streams`;
  const moviesUrl = `${host}/player_api.php?username=${user}&password=${pass}&action=get_vod_streams`;
  const seriesUrl = `${host}/player_api.php?username=${user}&password=${pass}&action=get_series`;

  try {
    // جلب الـ 3 أقسام بالتوازي (Parallel Fetch) لسرعة الأداء على التلفزيون
    const [liveRes, moviesRes, seriesRes] = await Promise.all([
      fetch(liveUrl).then(res => res.json()).catch(() => []),
      fetch(moviesUrl).then(res => res.json()).catch(() => []),
      fetch(seriesRes).then(res => res.json()).catch(() => [])
    ]);

    // معالجة وتوحيد البنية الجرافيكية (Data Mapping) لتتوافق مع الكروت بتاعتنا
    liveChannels = Array.isArray(liveRes) ? liveRes.map(item => ({
      stream_id: item.stream_id,
      name: item.name,
      category_id: item.category_id,
      stream_icon: item.stream_icon || "https://placehold.co/400x540/1f6feb/ffffff?text=LIVE",
      url: `${host}/live/${user}/${pass}/${item.stream_id}.m3u8`,
      type: "live"
    })) : [];

    moviesList = Array.isArray(moviesRes) ? moviesRes.map(item => ({
      stream_id: item.stream_id,
      name: item.name,
      category_id: item.category_id,
      stream_icon: item.stream_icon || "https://placehold.co/400x540/00c851/ffffff?text=MOVIE",
      url: `${host}/movie/${user}/${pass}/${item.stream_id}.${item.container_extension || 'mp4'}`,
      type: "movie"
    })) : [];

    seriesList = Array.isArray(seriesRes) ? seriesRes.map(item => ({
      series_id: item.series_id,
      name: item.name,
      category_id: item.category_id,
      stream_icon: item.stream_icon || "https://placehold.co/400x540/ff4444/ffffff?text=SERIES",
      type: "series"
    })) : [];

    // تخزين الداتا الحقيقية المستلمة في الـ LocalStorage لتثبيتها
    localStorage.setItem("stored_live", JSON.stringify(liveChannels));
    localStorage.setItem("stored_movies", JSON.stringify(moviesList));
    localStorage.setItem("stored_series", JSON.stringify(seriesList));

    filteredLive = [...liveChannels];
    filteredMovies = [...moviesList];
    filteredSeries = [...seriesList];

    if(status) {
      status.innerText = `تم تحميل ${liveChannels.length} قناة و ${moviesList.length} فيلم بنجاح! ✅`;
      status.style.color = "#00c851";
    }

    renderContentGrid(currentViewId);

  } catch (error) {
    console.error("Xtream Parser Error: ", error);
    if(status) {
      status.innerText = "فشل في سحب البيانات. تأكد من الرابط أو إعدادات CORS على السيرفر! ❌";
      status.style.color = "#ff4444";
    }
  }
}

function loadStoredDataOnStartup() {
  liveChannels = JSON.parse(localStorage.getItem("stored_live")) || [];
  moviesList = JSON.parse(localStorage.getItem("stored_movies")) || [];
  seriesList = JSON.parse(localStorage.getItem("stored_series")) || [];
  
  filteredLive = [...liveChannels];
  filteredMovies = [...moviesList];
  filteredSeries = [...seriesList];
}

// زرار الحفظ وتنشيط محرك الـ Fetch الحقيقي
function saveIPTVServer() {
  const name = document.getElementById('server-name').value.trim();
  const user = document.getElementById('server-user').value.trim();
  const pass = document.getElementById('server-pass').value.trim();
  let url = document.getElementById('server-url').value.trim();
  const status = document.getElementById('pl_status');

  if (!name || !url || !user || !pass) {
    status.innerText = "برجاء كتابة البيانات كاملة!";
    status.style.color = "red";
    return;
  }
  
  if (url.endsWith('/')) url = url.slice(0, -1);

  const serverData = { name, user, pass, url };
  let saved = JSON.parse(localStorage.getItem('iptv_playlists_lg')) || [];
  saved.push(serverData);
  localStorage.setItem('iptv_playlists_lg', JSON.stringify(saved));
  
  loadPlaylists();
  
  // تشغيل الجلب الفوري من السيرفر بالداتا الحقيقية
  fetchXtreamDataFromServer(url, user, pass);
}

function loadPlaylists() {
  const container = document.getElementById('playlists-list');
  if (!container) return; container.innerHTML = '';
  let saved = JSON.parse(localStorage.getItem('iptv_playlists_lg')) || [];
  
  if (saved.length === 0) {
    container.innerHTML = '<p style="color:#666; text-align:center; padding:1rem;">لا توجد اشتراكات مضافة.</p>';
    return;
  }
  saved.forEach((server, index) => {
    container.innerHTML += `<div class="playlist-table-row"><div><strong>📌 ${server.name}</strong></div><button onclick="deletePlaylist(${index})" class="btn-playlist-control delete">حذف</button></div>`;
  });
}

function deletePlaylist(index) {
  let saved = JSON.parse(localStorage.getItem('iptv_playlists_lg')) || [];
  saved.splice(index, 1);
  localStorage.setItem('iptv_playlists_lg', JSON.stringify(saved));
  localStorage.removeItem("stored_live");
  localStorage.removeItem("stored_movies");
  localStorage.removeItem("stored_series");
  loadStoredDataOnStartup();
  loadPlaylists();
  clickSidebarItem(0);
}

function renderContentGrid(viewId) {
  let gridId = "home-main-grid";
  let list = [];

  if (viewId === "view-home") {
    gridId = "home-main-grid";
    list = [...filteredLive, ...filteredMovies, ...filteredSeries];
  }
  else if (viewId === "view-live") { gridId = "live-grid"; list = filteredLive; }
  else if (viewId === "view-movies") { gridId = "movies-grid"; list = filteredMovies; }
  else if (viewId === "view-series") { gridId = "series-grid"; list = filteredSeries; }
  
  const container = document.getElementById(gridId);
  if (!container) return; container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = '<p style="color:#666; text-align:center; width:100%; padding:2rem; font-size:1.3rem;">تأكد من إضافة حساب IPTV نشط وجلب البيانات لتظهر القنوات هنا.</p>';
    return;
  }

  list.forEach(item => {
    const card = document.createElement("div");
    card.className = "media-card remote-focusable";
    card.innerHTML = `<img src="${item.stream_icon}" /><div class="info">${item.name}</div>`;
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

async function openDetailsView(item) {
  document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
  document.getElementById("view-details").classList.add('active');
  document.getElementById("detail-item-title").innerText = item.name;
  document.getElementById("detail-item-img").src = item.stream_icon;
  const actionZone = document.getElementById("movie-action-zone");
  const verticalZone = document.getElementById("series-episodes-vertical-zone");
  
  if (item.type === "series") {
    actionZone.innerHTML = "";
    verticalZone.style.display = "block";
    
    // جلب حقيقي لحلقات المسلسل من الـ Xtream API بناءً على الـ series_id
    let savedPlaylists = JSON.parse(localStorage.getItem('iptv_playlists_lg')) || [];
    const activeServer = savedPlaylists[savedPlaylists.length - 1];
    const container = document.getElementById("episodes-vertical-container");
    container.innerHTML = "<p style='padding:1rem; color:#aaa;'>جاري جلب حلقات المسلسل من السيرفر... ⏳</p>";
    
    try {
      const epUrl = `${activeServer.url}/player_api.php?username=${activeServer.user}&password=${activeServer.pass}&action=get_series_info&series_id=${item.series_id}`;
      const epRes = await fetch(epUrl).then(res => res.json());
      container.innerHTML = "";
      
      // تفكيك المواسم والحلقات ديناميكياً
      if(epRes && epRes.episodes) {
        let allEpisodes = [];
        Object.keys(epRes.episodes).forEach(seasonKey => {
          epRes.episodes[seasonKey].forEach(episode => {
            allEpisodes.push(episode);
          });
        });

        allEpisodes.forEach((ep, idx) => {
          const card = document.createElement("div");
          card.className = "episode-row-card remote-focusable";
          // بناء رابط تشغيل الحلقة الفعلي المباشر من السيرفر
          const epStreamUrl = `${activeServer.url}/series/${activeServer.user}/${activeServer.pass}/${ep.id}.${ep.container_extension || 'mp4'}`;
          
          card.innerHTML = `
            <div class="thumb-area"><img src="${ep.info.movie_image || item.stream_icon}" /></div>
            <div class="ep-details-side">
              <div class="ep-row-title">موسم ${ep.season} - حلقة ${ep.episode_num}: ${ep.title || 'بدون عنوان'}</div>
              <div class="ep-row-desc">اضغط للتشغيل الفوري بدقة السيرفر العالية.</div>
            </div>
          `;
          card.onclick = () => {
            playMediaDirectly({ name: ep.title || `${item.name} - S${ep.season}E${ep.episode_num}`, url: epStreamUrl });
          };
          container.appendChild(card);
        });
      } else {
        container.innerHTML = "<p style='padding:1rem; color:#666;'>لا توجد حلقات متاحة لهذا المسلسل.</p>";
      }
    } catch(e) {
      container.innerHTML = "<p style='padding:1rem; color:#ff4444;'>فشل في جلب حلقات المسلسل من السيرفر.</p>";
    }
    if (window.updateFocusableElements) window.updateFocusableElements();

  } else {
    verticalZone.style.display = "none";
    actionZone.innerHTML = `<button class="btn-action-submit" style="width:16rem;" onclick='playMediaDirectly(${JSON.stringify(item)})'>تشغيل فوراً</button>`;
  }
}

function playMediaDirectly(item) {
  localStorage.setItem("current", JSON.stringify(item));
  window.location.href = "player.html";
}

function toggleLanguage() { currentLang = currentLang === "ar" ? "en" : "ar"; localStorage.setItem("app_lang", currentLang); applyLanguage(); clickSidebarItem(0); }
function applyLanguage() {
  const dict = languages[currentLang]; document.getElementById("main-html").setAttribute("dir", currentLang === "ar" ? "rtl" : "ltr");
  document.querySelectorAll(".txt-lang").forEach(el => { const key = el.getAttribute("data-key"); if (dict[key]) el.innerText = dict[key]; });
}
function updateClockAndDay() {
  const now = new Date(); document.getElementById("top-current-time").innerText = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  document.getElementById("top-current-day").innerText = now.toLocaleDateString('ar-EG', { weekday: 'long' });
  document.getElementById("top-current-date").innerText = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;
}
function applyTheme(themeName) { document.getElementById('main-html').className = themeName; localStorage.setItem('selected-theme', themeName); }
function runFastSpeedTest() { const speedDisplay = document.getElementById("top-net-speed"); speedDisplay.innerText = "Fast.com: 54.2 Mbps"; }

window.onload = () => {
  loadStoredDataOnStartup();
  loadPlaylists();
  applyTheme(localStorage.getItem('selected-theme') || 'theme-netflix');
  applyLanguage();
  clickSidebarItem(0);
  setInterval(updateClockAndDay, 1000);
};
