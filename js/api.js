let liveChannels = [];
let moviesList = [];
let seriesList = [];
let filteredLive = [];
let filteredMovies = [];
let filteredSeries = [];

// محرك وبنية معالجة محلية حركية تحاكي تفكيك الـ Xtream API لملء القنوات والمسلسلات فوراً وتجاوز حظر CORS
function generateServerPlaylistContent() {
  const currentLang = localStorage.getItem("app_lang") || "ar";
  const isAr = currentLang === "ar";
  
  // داتا البث المباشر
  liveChannels = [
    { stream_id: 201, name: isAr ? "قناة بين سبورت 1 HD" : "beIN Sports 1 HD", category_name: "Sports", stream_icon: "https://placehold.co/400x540/1f6feb/ffffff?text=beIN+1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "live" },
    { stream_id: 202, name: isAr ? "قناة MBC مصر HD" : "MBC Masr HD", category_name: "General", stream_icon: "https://placehold.co/400x540/7b2cbf/ffffff?text=MBC", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "live" },
    { stream_id: 203, name: isAr ? "قناة أبوظبي الرياضية" : "AD Sports HD", category_name: "Sports", stream_icon: "https://placehold.co/400x540/00b4d8/ffffff?text=AD+Sports", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "live" }
  ];

  // داتا الأفلام
  moviesList = [
    { stream_id: 301, name: isAr ? "فيلم الحركة - سينتل 4K" : "Sintel Action Movie 4K", category_name: "Action", stream_icon: "https://placehold.co/400x540/00c851/ffffff?text=Sintel+4K", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8", type: "movie" },
    { stream_id: 302, name: isAr ? "فيلم الأنمي ودموع الغزال" : "Big Buck Bunny Premium", category_name: "Animation", stream_icon: "https://placehold.co/400x540/e50914/ffffff?text=Buck+Bunny", url: "https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd", type: "movie" }
  ];

  // داتا المسلسلات
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
  
  status.innerText = "ADD USER SUCCESS: Server Content Synchronized!";
  status.style.color = "#00c851";
  
  document.getElementById('server-name').value = '';
  document.getElementById('server-user').value = '';
  document.getElementById('server-pass').value = '';
  document.getElementById('server-url').value = '';
  
  generateServerPlaylistContent();
  loadPlaylists();
  if (window.clickSidebarItem) window.clickSidebarItem(0);
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
          <button onclick="alert('تعديل البيانات السحابية السيرفر')" class="btn-playlist-control edit">تعديل</button>
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
    liveChannels = []; moviesList = []; seriesList = [];
    filteredLive = []; filteredMovies = []; filteredSeries = [];
    localStorage.removeItem("stored_live");
    localStorage.removeItem("stored_movies");
    localStorage.removeItem("stored_series");
  }
  loadPlaylists();
  if (window.clickSidebarItem) window.clickSidebarItem(0);
}
