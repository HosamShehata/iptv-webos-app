let seriesItem = JSON.parse(localStorage.getItem("current")) || {};
let allEpisodes = [
  { id: "ep_1", title: "الحلقة 1 - بداية المغامرة الكبرى", thumb: "https://placehold.co/640x360/1f6feb/ffffff?text=EP+1" },
  { id: "ep_2", title: "الحلقة 2 - مواجهة غير متوقعة", thumb: "https://placehold.co/640x360/00c851/ffffff?text=EP+2" },
  { id: "ep_3", title: "الحلقة 3 - السر الدفين خلف الكواليس", thumb: "https://placehold.co/640x360/ff4444/ffffff?text=EP+3" },
  { id: "ep_4", title: "الحلقة 4 - نهاية الفصل الأول المشوق", thumb: "https://placehold.co/640x360/ffb703/ffffff?text=EP+4" }
];
let filteredEpisodes = [...allEpisodes];
let currentLang = localStorage.getItem("app_lang") || "ar";

const localDict = {
  ar: { back: "العودة للرئيسية", resume: "متابعة الحلقة الأخيرة المتبقية", heading: "حلقات هذا الموسم", watched: "شوهدت مؤخراً ✨" },
  en: { back: "Back to Home", resume: "Resume Last Watched", heading: "Season Episodes", watched: "Recently Watched ✨" }
};

function initDetailsPage() {
  const dict = localDict[currentLang];
  document.getElementById("details-html").setAttribute("dir", currentLang==="ar"?"rtl":"ltr");
  document.getElementById("lbl-back").innerText = dict.back;
  document.getElementById("lbl-resume-btn").innerText = dict.resume;
  document.getElementById("lbl-episodes-heading").innerText = dict.heading;
  document.getElementById("series-title").innerText = seriesItem.name || "Series";
  document.getElementById("ep-search-input").placeholder = currentLang === "ar" ? "ابحث عن رقم أو اسم الحلقة..." : "Search episode...";

  if(seriesItem.stream_icon) document.getElementById("series-img").src = seriesItem.stream_icon;
  renderEpisodesGrid();
}

function renderEpisodesGrid() {
  const container = document.getElementById("episodes-container"); container.innerHTML = "";
  const lastEpId = localStorage.getItem(`last_ep_series_${seriesItem.series_id || 401}`);
  const dict = localDict[currentLang];

  filteredEpisodes.forEach((ep, idx) => {
    const ratio = localStorage.getItem(`progress_ratio_media_${ep.id}`) || 0;
    const isLast = ep.id === lastEpId;
    
    const card = document.createElement("div"); card.className = "episode-yt-card";
    card.innerHTML = `
      <div class="thumb-wrapper">
        <img src="${ep.thumb}" />
        <div class="yt-progress-bar"><div class="yt-progress-fill" style="width: ${ratio}%"></div></div>
      </div>
      <div class="ep-card-info">
        <div class="ep-card-title">${ep.title}</div>
        <div class="ep-card-status">${isLast ? dict.watched : ''}</div>
      </div>
    `;
    card.onclick = () => playEpisode(idx);
    container.appendChild(card);
  });
}

function filterEpisodesList(query) {
  query = query.toLowerCase().trim();
  filteredEpisodes = allEpisodes.filter(e => e.title.toLowerCase().includes(query));
  renderEpisodesGrid();
}

function playEpisode(idx) {
  const ep = filteredEpisodes[idx];
  localStorage.setItem(`last_ep_series_${seriesItem.series_id || 401}`, ep.id);
  localStorage.setItem("current_ep_index", idx);
  
  let mediaContext = { id: ep.id, name: ep.title, url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "series_episode" };
  localStorage.setItem("current", JSON.stringify(mediaContext));
  window.location.href = "player.html";
}

function resumeLastWatchedEpisode() {
  const lastEpId = localStorage.getItem(`last_ep_series_${seriesItem.series_id || 401}`);
  let idx = allEpisodes.findIndex(e => e.id === lastEpId);
  if(idx === -1) idx = 0; playEpisode(idx);
}

window.onload = function() {
  const activeTheme = localStorage.getItem('selected-theme') || 'theme-netflix';
  document.getElementById('details-html').className = activeTheme;
  initDetailsPage();
};
