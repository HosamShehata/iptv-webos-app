let seriesItem = JSON.parse(localStorage.getItem("current")) || {};
let allEpisodes = [
  { id: "ep_1", title: "الحلقة 1: الفصل الأول وظهور الأبطال", desc: "تستعرض هذه الحلقة تمهيد الأحداث الشامل وظهور ملامح القصة المثيرة بجودة عالية 4K بدون تقطيع.", thumb: "https://placehold.co/640x360/1f6feb/ffffff?text=EP+1" },
  { id: "ep_2", title: "الحلقة 2: تعقيدات المسار والتحالف السرّي", desc: "تبدأ الصراعات في التزايد مع اكتشاف تحالفات غامضة بين أطراف السيرفر الحركي.", thumb: "https://placehold.co/640x360/00c851/ffffff?text=EP+2" },
  { id: "ep_3", title: "الحلقة 3: المواجهة الفاصلة الكبرى", desc: "أعلى معدلات الإثارة والتشويق في حلقة ملحمية تمهد لنهايات مذهلة ومؤثرة جداً.", thumb: "https://placehold.co/640x360/ff4444/ffffff?text=EP+3" }
];
let currentLang = localStorage.getItem("app_lang") || "ar";

const localDict = {
  ar: { back: "العودة للرئيسية", resume: "متابعة آخر حلقة شاهدتها", heading: "الحلقات المتوفرة", watched: "آخر حلقة شاهدتها مؤخراً ✨" },
  en: { back: "Back to Home", resume: "Resume Last Watched", heading: "Available Episodes", watched: "Last Watched Episode ✨" }
};

function initDetailsPage() {
  const dict = localDict[currentLang];
  document.getElementById("details-html").setAttribute("dir", currentLang==="ar"?"rtl":"ltr");
  document.getElementById("lbl-back").innerText = dict.back;
  document.getElementById("lbl-resume-btn").innerText = dict.resume;
  document.getElementById("lbl-episodes-heading").innerText = dict.heading;
  document.getElementById("series-title").innerText = seriesItem.name || "Series";

  if(seriesItem.stream_icon) document.getElementById("series-img").src = seriesItem.stream_icon;
  renderVerticalEpisodes();
}

function renderVerticalEpisodes() {
  const container = document.getElementById("episodes-vertical-container"); container.innerHTML = "";
  const lastEpId = localStorage.getItem(`last_ep_series_${seriesItem.series_id || 401}`);
  const dict = localDict[currentLang];

  allEpisodes.forEach((ep, idx) => {
    const ratio = localStorage.getItem(`progress_ratio_media_${ep.id}`) || 0;
    const isLast = ep.id === lastEpId;
    
    const card = document.createElement("div"); card.className = "episode-row-card";
    card.innerHTML = `
      <div class="thumb-area">
        <img src="${ep.thumb}" />
        <div class="yt-progress-bar"><div class="yt-progress-fill" style="width: ${ratio}%"></div></div>
      </div>
      <div class="ep-details-side">
        <div class="ep-row-title">${ep.title}</div>
        <div class="ep-row-desc">${ep.desc}</div>
        <div class="ep-row-status">${isLast ? dict.watched : ''}</div>
      </div>
    `;
    card.onclick = () => playEpisode(idx);
    container.appendChild(card);
  });
}

function playEpisode(idx) {
  const ep = allEpisodes[idx];
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
