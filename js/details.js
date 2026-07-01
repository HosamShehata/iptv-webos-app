const item = JSON.parse(localStorage.getItem("current"));
const creds = JSON.parse(localStorage.getItem("xtream_creds"));

let focusMode = "buttons"; 
let btnIdx = 0;
let epIdx = 0;
let episodesList = [];

async function initDetails() {
  if (!item) { window.location.href = "index.html"; return; }

  document.getElementById("media-title").innerText = item.name;
  const imgUrl = item.stream_icon || item.cover || "";
  if(imgUrl) {
    document.getElementById("media-poster").src = imgUrl;
    document.getElementById("backdrop-bg").style.backgroundImage = `url('${imgUrl}')`;
  }

  const baseUrl = `${creds.url}/player_api.php?username=${creds.user}&password=${creds.pass}`;

  try {
    if (item.series_id) {
      [span_0](start_span)// جلب الحلقات لو مسلسل (شاشة 5 و 6)[span_0](end_span)
      document.getElementById("episodes-block").style.display = "flex";
      const res = await fetch(`${baseUrl}&action=get_series_info&series_id=${item.series_id}`);
      const data = await res.json();
      
      if(data.info && data.info.plot) document.getElementById("media-plot").innerText = data.info.plot;
      if(data.info && data.info.rating) document.getElementById("media-rating").innerText = `⭐ ${data.info.rating}`;
      if(data.info && data.info.releaseDate) document.getElementById("media-year").innerText = data.info.releaseDate.split("-")[0];

      episodesList = [];
      if(data.episodes) {
        Object.keys(data.episodes).forEach(season => {
          data.episodes[season].forEach(ep => {
            episodesList.push({
              title: `الموسم ${season} - حلقة ${ep.episode_num}`,
              stream_id: ep.id,
              ext: ep.container_extension || "mp4"
            });
          });
        });
      }
      renderEpisodesTray();
    } else {
      // جلب تفاصيل الفيلم
      const res = await fetch(`${baseUrl}&action=get_vod_info&stream_id=${item.stream_id}`);
      const data = await res.json();
      if(data.info && data.info.plot) document.getElementById("media-plot").innerText = data.info.plot;
      if(data.info && data.info.rating) document.getElementById("media-rating").innerText = `⭐ ${data.info.rating}`;
      if(data.info && data.info.year) document.getElementById("media-year").innerText = data.info.year;
    }
  } catch(e) { console.error(e); }

  updateFocus();
}

function renderEpisodesTray() {
  const tray = document.getElementById("episodes-tray");
  tray.innerHTML = "";
  episodesList.forEach(ep => {
    const div = document.createElement("div");
    div.className = "ep-card";
    div.innerText = ep.title;
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
    item.url = `${creds.url}/movie/${creds.user}/${creds.pass}/${item.stream_id}.${item.container_extension || "mp4"}`;
    localStorage.setItem("current", JSON.stringify(item));
    window.location.href = "player.html";
  }
}

function playEp(ep) {
  const media = {
    name: `${item.name} - ${ep.title}`,
    url: `${creds.url}/series/${creds.user}/${creds.pass}/${ep.stream_id}.${ep.ext}`
  };
  localStorage.setItem("current", JSON.stringify(media));
  window.location.href = "player.html";
}

function toggleFav() {
  let favs = JSON.parse(localStorage.getItem("favorites_list")) || [];
  const exists = favs.some(f => f.stream_id === item.stream_id || f.series_id === item.series_id);
  if(exists) {
    favs = favs.filter(f => item.stream_id ? f.stream_id !== item.stream_id : f.series_id !== item.series_id);
    document.getElementById("btn-fav").innerHTML = `<span class="material-icons">favorite_border</span>قائمتي`;
  } else {
    favs.unshift(item);
    document.getElementById("btn-fav").innerHTML = `<span class="material-icons">favorite</span>في قائمتي`;
  }
  localStorage.setItem("favorites_list", JSON.stringify(favs));
}

document.addEventListener("keydown", function(e) {
  const btns = document.querySelectorAll(".detail-item");

  if (e.key === "ArrowLeft") {
    if (focusMode === "buttons") btnIdx = Math.max(0, btnIdx - 1);
    if (focusMode === "episodes") epIdx = Math.max(0, epIdx - 1);
  }
  if (e.key === "ArrowRight") {
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
