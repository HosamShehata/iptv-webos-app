let allEpisodes = [
  { id: "101", title: "الحلقة 1: الفصل الأول وظهور الأبطال", desc: "تستعرض هذه الحلقة تمهيد الأحداث الشامل وظهور ملامح القصة المثيرة بجودة عالية 4K بدون تقطيع.", thumb: "https://placehold.co/640x360/1f6feb/ffffff?text=EP+1" },
  { id: "102", title: "الحلقة 2: تعقيدات المسار والتحالف السرّي", desc: "تبدأ الصراعات في التزايد مع اكتشاف تحالفات غامضة بين أطراف السيرفر الحركي.", thumb: "https://placehold.co/640x360/00c851/ffffff?text=EP+2" }
];

function renderVerticalEpisodes() {
  const container = document.getElementById("episodes-vertical-container"); container.innerHTML = "";
  allEpisodes.forEach((ep, idx) => {
    const ratio = localStorage.getItem(`progress_ratio_media_${ep.id}`) || 0;
    container.innerHTML += `
      <div class="episode-row-card" onclick="playEpisode(${idx})">
        <div class="thumb-area">
          <img src="${ep.thumb}" />
          <div class="yt-progress-bar"><div class="yt-progress-fill" style="width: ${ratio}%"></div></div>
        </div>
        <div>
          <h3>${ep.title}</h3>
          <p style="color:#aaa;">${ep.desc}</p>
        </div>
      </div>
    `;
  });
}

function playEpisode(idx) {
  const ep = allEpisodes[idx]; localStorage.setItem("current_ep_index", idx);
  localStorage.setItem("current", JSON.stringify({ id: ep.id, name: ep.title, url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }));
  window.location.href = "player.html";
}
window.onload = renderVerticalEpisodes;
