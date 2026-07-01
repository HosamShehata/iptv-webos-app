let seriesItem = JSON.parse(localStorage.getItem("current")) || {};
let episodes = [
  { id: "101", title: "Episode 1 - The Cinematic Launch", thumb: "https://placehold.co/640x360/1f6feb/ffffff?text=EP1" },
  { id: "102", title: "Episode 2 - Logic Integration", thumb: "https://placehold.co/640x360/00c851/ffffff?text=EP2" },
  { id: "103", title: "Episode 3 - Ultimate Command Panel", thumb: "https://placehold.co/640x360/ff4444/ffffff?text=EP3" }
];
let currentLang = localStorage.getItem("app_lang") || "ar";

const localDict = {
  ar: { back: "العودة للرئيسية", resume: "متابعة المشاهدة (Resume)", heading: "حلقات المسلسل", watched: "آخر حلقة شاهدتها ✨" },
  en: { back: "Back to Home", resume: "Resume Watching", heading: "Series Episodes", watched: "Last Watched Episode ✨" }
};

function initDetails() {
  const dict = localDict[currentLang];
  document.getElementById("details-html").setAttribute("dir", currentLang==="ar"?"rtl":"ltr");
  document.getElementById("lbl-back").innerText = dict.back;
  document.getElementById("lbl-resume-btn").innerText = dict.resume;
  document.getElementById("lbl-episodes-heading").innerText = dict.heading;
  document.getElementById("series-title").innerText = seriesItem.name || "Series";

  if(seriesItem.stream_icon) document.getElementById("series-img").src = seriesItem.stream_icon;

  const container = document.getElementById("episodes-container"); container.innerHTML = "";
  const lastEpId = localStorage.getItem(`last_ep_series_${seriesItem.series_id || 905}`);

  episodes.forEach((ep, idx) => {
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

function playEpisode(idx) {
  const ep = episodes[idx];
  localStorage.setItem(`last_ep_series_${seriesItem.series_id || 905}`, ep.id);
  localStorage.setItem("current_ep_index", idx);
  
  let mediaContext = { id: ep.id, name: ep.title, url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "series_episode" };
  localStorage.setItem("current", JSON.stringify(mediaContext));
  window.location.href = "player.html";
}

function resumeLastWatchedEpisode() {
  const lastEpId = localStorage.getItem(`last_ep_series_${seriesItem.series_id || 905}`);
  let idx = episodes.findIndex(e => e.id === lastEpId);
  if(idx === -1) idx = 0; playEpisode(idx);
}

window.onload = function() {
  initDetails();
  const activeTheme = localStorage.getItem('selected-theme') || 'theme-netflix';
  document.getElementById('details-html').className = activeTheme;
};
