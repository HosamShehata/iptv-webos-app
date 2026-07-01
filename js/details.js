const item = JSON.parse(localStorage.getItem("current"));
const creds = JSON.parse(localStorage.getItem("xtream_creds"));
let currentLang = localStorage.getItem("app_lang") || "ar";

let focusMode = "buttons"; 
let btnIdx = 0; let epIdx = 0; let episodesList = [];

const detailsLanguages = {
  ar: { play: "تشغيل", fav_add: "قائمتي", fav_rem: "في قائمتي", back: "عودة", eps: "جميع الحلقات:" },
  en: { play: "Play", fav_add: "My List", fav_rem: "In My List", back: "Back", eps: "All Episodes:" }
};

async function initDetails() {
  if (!item) { window.location.href = "index.html"; return; }
  const htmlTag = document.getElementById("main-html");
  htmlTag.setAttribute("dir", currentLang === "ar" ? "rtl" : "ltr");

  const dict = detailsLanguages[currentLang];
  document.getElementById("lbl-play-btn").innerText = dict.play;
  document.getElementById("lbl-back-btn").innerText = dict.back;
  document.getElementById("lbl-episodes-title").innerText = dict.eps;
  
  let favs = JSON.parse(localStorage.getItem("favorites_list")) || [];
  const exists = favs.some(f => f.stream_id === item.stream_id || f.series_id === item.series_id);
  document.getElementById("lbl-fav-btn").innerText = exists ? dict.fav_rem : dict.fav_add;

  document.getElementById("media-title").innerText = item.name;
  const imgUrl = item.stream_icon || item.cover || "";
  if(imgUrl) {
    document.getElementById("media-poster").src = imgUrl;
    document.getElementById("backdrop-bg").style.backgroundImage = `url('${imgUrl}')`;
  }

  if (item.series_id || item.type === "series") {
    document.getElementById("episodes-block").style.display = "flex";
    episodesList = [
      { id: 201, title: currentLang === "ar" ? "الموسم 1 - الحلقة 1" : "Season 1 - Episode 1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
      { id: 202, title: currentLang === "ar" ? "الموسم 1 - الحلقة 2" : "Season 1 - Episode 2", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8" }
    ];
    renderEpisodesTray();
  } else {
    document.getElementById("episodes-block").style.display = "none";
    document.getElementById("media-plot").innerText = item.plot || (currentLang === "ar" ? "فيلم ممتع وعالي الجودة متاح للمشاهدة الفورية." : "An enjoyable movie available for instant playback.");
  }
  updateFocus();
}

function renderEpisodesTray() {
  const tray = document.getElementById("episodes-tray"); tray.innerHTML = "";
  const lastEpId = localStorage.getItem(`last_ep_for_series_${item.series_id || 905}`);
  episodesList.forEach((ep, idx) => {
    const div = document.createElement("div"); div.className = "ep-card"; div.innerText = ep.title;
    if(lastEpId && lastEpId == ep.id) { div.classList.add("last-watched-badge"); }
    div.onclick = function() { epIdx = idx; focusMode = "episodes"; playEp(ep, idx); };
    tray.appendChild(div);
  });
}

function playEp(ep, index) {
  localStorage.setItem("current_ep_index", index);
  localStorage.setItem("episodes_pack", JSON.stringify(episodesList));
  localStorage.setItem(`last_ep_for_series_${item.series_id || 905}`, ep.id);
  const media = { name: `${item.name} - ${ep.title}`, url: ep.url, id: ep.id, type: "series_episode" };
  localStorage.setItem("current", JSON.stringify(media)); window.location.href = "player.html";
}

function triggerPlay() {
  if ((item.series_id || item.type === "series") && episodesList.length > 0) { playEp(episodesList[0], 0); } 
  else { window.location.href = "player.html"; }
}

function toggleFav() {
  let favs = JSON.parse(localStorage.getItem("favorites_list")) || [];
  const exists = favs.some(f => f.stream_id === item.stream_id || f.series_id === item.series_id);
  const dict = detailsLanguages[currentLang];
  if(exists) {
    favs = favs.filter(f => item.stream_id ? f.stream_id !== item.stream_id : f.series_id !== item.series_id);
    document.getElementById("lbl-fav-btn").innerText = dict.fav_add;
  } else {
    favs.unshift(item); document.getElementById("lbl-fav-btn").innerText = dict.fav_rem;
  }
  localStorage.setItem("favorites_list", JSON.stringify(favs));
}

function updateFocus() {
  const btns = document.querySelectorAll(".detail-item");
  btns.forEach((b, i) => b.classList.toggle("focused", focusMode === "buttons" && i === btnIdx));
  const eps = document.querySelectorAll(".ep-card");
  eps.forEach((e, i) => e.classList.toggle("focused", focusMode === "episodes" && i === epIdx));
}

document.addEventListener("keydown", function(e) {
  const btns = document.querySelectorAll(".detail-item");
  let leftKey = currentLang === "en" ? "ArrowRight" : "ArrowLeft";
  let rightKey = currentLang === "en" ? "ArrowLeft" : "ArrowRight";

  if (e.key === leftKey) {
    if (focusMode === "buttons") btnIdx = Math.max(0, btnIdx - 1);
    if (focusMode === "episodes") epIdx = Math.max(0, epIdx - 1);
  }
  if (e.key === rightKey) {
    if (focusMode === "buttons") btnIdx = Math.min(btns.length - 1, btnIdx + 1);
    if (focusMode === "episodes") epIdx = Math.min(episodesList.length - 1, epIdx + 1);
  }
  if (e.key === "ArrowDown" && focusMode === "buttons" && episodesList.length > 0) { focusMode = "episodes"; epIdx = 0; }
  if (e.key === "ArrowUp" && focusMode === "episodes") { focusMode = "buttons"; }
  if (e.key === "Enter") {
    if (focusMode === "buttons") btns[btnIdx].click();
    else if (focusMode === "episodes") playEp(episodesList[epIdx], epIdx);
  }
  if (e.key === "Backspace" || e.key === "Escape") { window.location.href = "index.html"; }
  updateFocus();
});
window.onload = initDetails;
