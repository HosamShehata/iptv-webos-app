const item = JSON.parse(localStorage.getItem("current"));
const creds = JSON.parse(localStorage.getItem("xtream_creds"));
let currentLang = localStorage.getItem("app_lang") || "ar";

let focusMode = "buttons"; 
let btnIdx = 0;
let epIdx = 0;
let episodesList = [];

const detailsLanguages = {
  ar: { play: "تشغيل", fav_add: "قائمتي", fav_rem: "في قائمتي", back: "عودة", eps: "جميع الحلقات:" },
  en: { play: "Play", fav_add: "My List", fav_rem: "In My List", back: "Back", eps: "All Episodes:" }
};

async function initDetails() {
  if (!item) { window.location.href = "index.html"; return; }

  // قلب الاتجاه ديناميكياً حسب لغة السيستم الحالية
  const htmlTag = document.getElementById("main-html");
  htmlTag.setAttribute("dir", currentLang === "ar" ? "rtl" : "ltr");
  htmlTag.setAttribute("lang", currentLang);

  // تطبيق نصوص الواجهة المترجمة
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

  // إذا كانت المادة هي المسلسل التجريبي، توليد حلقات تيست حقيقية بروابط بث شغالة فوراً
  if (item.series_id && item.series_id === 905) {
    document.getElementById("episodes-block").style.display = "flex";
    document.getElementById("media-plot").innerText = currentLang === "ar" ? "مسلسل خيال علمي وتجربة بصرية فريدة لاختبار جودة تشغيل الفيديو والتحكم." : "A sci-fi demo series for testing video playback and player controls.";
    
    episodesList = [
      { title: currentLang === "ar" ? "الموسم 1 - الحلقة 1" : "Season 1 - Episode 1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
      { title: currentLang === "ar" ? "الموسم 1 - الحلقة 2" : "Season 1 - Episode 2", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8" }
    ];
    renderEpisodesTray();
    updateFocus();
    return;
  }

  // معالجة البيانات الحقيقية من السيرفر
  const baseUrl = `${creds.url}/player_api.php?username=${creds.user}&password=${creds.pass}`;
  try {
    if (item.series_id) {
      document.getElementById("episodes-block").style.display = "flex";
      const res = await fetch(`${baseUrl}&action=get_series_info&series_id=${item.series_id}`);
      const data = await res.json();
      
      if(data.info && data.info.plot) document.getElementById("media-plot").innerText = data.info.plot;
      if(data.info && data.info.rating) document.getElementById("media-rating").innerText = `⭐ ${data.info.rating}`;

      episodesList = [];
      if(data.episodes) {
        Object.keys(data.episodes).forEach(season => {
          data.episodes[season].forEach(ep => {
            episodesList.push({
              title: currentLang === "ar" ? `الموسم ${season} - حلقة ${ep.episode_num}` : `S${season} - Ep ${ep.episode_num}`,
              url: `${creds.url}/series/${creds.user}/${creds.pass}/${ep.id}.${ep.container_extension || 'mp4'}`
            });
          });
        });
      }
      renderEpisodesTray();
    } else {
      // تفاصيل فيلم حقيقي
      const res = await fetch(`${baseUrl}&action=get_vod_info&stream_id=${item.stream_id}`);
      const data = await res.json();
      if(data.info && data.info.plot) document.getElementById("media-plot").innerText = data.info.plot;
      if(data.info && data.info.rating) document.getElementById("media-rating").innerText = `⭐ ${data.info.rating}`;
    }
  } catch(e) { console.error(e); }

  updateFocus();
}

function renderEpisodesTray() {
  const tray = document.getElementById("episodes-tray");
  tray.innerHTML = "";
  episodesList.forEach((ep, idx) => {
    const div = document.createElement("div");
    div.className = "ep-card";
    div.innerText = ep.title;
    // دعم الضغط واللمس المباشر على الحلقة من الموبايل
    div.onclick = function() {
      epIdx = idx; focusMode = "episodes";
      playEp(ep);
    };
    tray.appendChild(div);
  });
}

function updateFocus() {
  const btns = document.querySelectorAll(".detail-item");
  btns.forEach((b, i) => b.classList.toggle("focused", focusMode === "buttons" && i === btnIdx));

  const eps = document.querySelectorAll(".ep-card");
  eps.forEach((e, i) => {
    const isFocused = focusMode === "episodes" && i === epIdx;
    e.classList.toggle("focused", isFocused);
    if(isFocused) e.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  });
}

function triggerPlay() {
  if (item.series_id && episodesList.length > 0) {
    playEp(episodesList[0]);
  } else {
    // تشغيل فيلم (تجريبي أو حقيقي)
    if(!item.url) {
      item.url = `${creds.url}/movie/${creds.user}/${creds.pass}/${item.stream_id}.${item.container_extension || "mp4"}`;
    }
    localStorage.setItem("current", JSON.stringify(item));
    window.location.href = "player.html";
  }
}

function playEp(ep) {
  const media = { name: `${item.name} - ${ep.title}`, url: ep.url };
  localStorage.setItem("current", JSON.stringify(media));
  window.location.href = "player.html";
}

function toggleFav() {
  let favs = JSON.parse(localStorage.getItem("favorites_list")) || [];
  const exists = favs.some(f => f.stream_id === item.stream_id || f.series_id === item.series_id);
  const dict = detailsLanguages[currentLang];
  
  if(exists) {
    favs = favs.filter(f => item.stream_id ? f.stream_id !== item.stream_id : f.series_id !== item.series_id);
    document.getElementById("lbl-fav-btn").innerText = dict.fav_add;
  } else {
    favs.unshift(item);
    document.getElementById("lbl-fav-btn").innerText = dict.fav_rem;
  }
  localStorage.setItem("favorites_list", JSON.stringify(favs));
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
  if (e.key === "ArrowDown" && focusMode === "buttons" && episodesList.length > 0) {
    focusMode = "episodes"; epIdx = 0;
  }
  if (e.key === "ArrowUp" && focusMode === "episodes") {
    focusMode = "buttons";
  }
  if (e.key === "Enter") {
    if (focusMode === "buttons") btns[btnIdx].click();
    else if (focusMode === "episodes") playEp(episodesList[epIdx]);
  }
  if (e.key === "Backspace" || e.key === "Escape") { window.location.href = "index.html"; }

  updateFocus();
});

window.onload = initDetails;
