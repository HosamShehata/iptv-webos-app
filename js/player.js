const video = document.getElementById("video");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const fillBar = document.getElementById("fill-bar");
const currTimeLbl = document.getElementById("current-time");
const totalTimeLbl = document.getElementById("total-time");
const timelineZone = document.getElementById("timeline-click-zone");
const playIcon = document.getElementById("icon-play");
const controlsPanel = document.getElementById("controls-panel");

let channel = JSON.parse(localStorage.getItem("current"));
let player; let osdTimeout;

let seekDuration = parseInt(localStorage.getItem("global_seek_duration")) || 10;
let currentSpeed = 1.0; let currentAspectRatio = "default"; let isZoomed = false;

async function initPlayer() {
  if (!channel) return;
  document.getElementById("player-title").innerText = channel.name;
  loading.style.display = "block"; showOSD();

  if(timelineZone) {
    timelineZone.addEventListener("click", function(e) {
      const rect = timelineZone.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      if(video.duration) { video.currentTime = clickPosition * video.duration; showOSD(); }
    });
  }

  try {
    player = new shaka.Player(video);
    player.addEventListener("error", (e) => onPlayerError(e));
    video.addEventListener("waiting", () => loading.style.display = "block");
    video.addEventListener("playing", () => { loading.style.display = "none"; displayStreamStats(); });
    video.addEventListener("timeupdate", updateTimeline);
    video.addEventListener("ended", handlePlaybackEnded);

    await player.load(channel.url);
    const savedTime = localStorage.getItem(`timestamp_media_${channel.id || 905}`);
    if (savedTime && channel.type !== "live") { video.currentTime = parseFloat(savedTime); }
    video.play();
  } catch (e) { onPlayerError(e); }
}

function updateTimeline() {
  currTimeLbl.innerText = formatTime(video.currentTime);
  totalTimeLbl.innerText = formatTime(video.duration);
  if (video.duration) {
    fillBar.style.width = `${(video.currentTime / video.duration) * 100}%`;
    localStorage.setItem(`timestamp_media_${channel.id || 905}`, video.currentTime);
  }
}

function displayStreamStats() {
  if(!player) return;
  const tracks = player.getVariantTracks();
  if(tracks && tracks.length > 0) {
    const active = tracks.find(t => t.active) || tracks[0];
    errorBox.innerText = `RESOLUTION: ${active.width}x${active.height} | SPEED: ${currentSpeed}x | BITRATE: ${(active.bandwidth / 100000).toFixed(1)} Mbps`;
  }
}

function togglePlayPause() {
  if (video.paused) { video.play(); playIcon.innerText = "pause"; }
  else { video.pause(); playIcon.innerText = "play_arrow"; }
  showOSD();
}

function seekBack() { video.currentTime = Math.max(0, video.currentTime - seekDuration); showOSD(); }
function seekForward() { video.currentTime = Math.min(video.duration || Infinity, video.currentTime + seekDuration); showOSD(); }

function changePlaybackSpeed() {
  if (currentSpeed === 1.0) currentSpeed = 1.25;
  else if (currentSpeed === 1.25) currentSpeed = 1.5;
  else if (currentSpeed === 1.5) currentSpeed = 2.0;
  else if (currentSpeed === 2.0) currentSpeed = 0.5;
  else currentSpeed = 1.0;
  video.playbackRate = currentSpeed; displayStreamStats(); showOSD();
}

function toggleAspectRatio() {
  if (currentAspectRatio === "default") { video.style.objectFit = "fill"; currentAspectRatio = "fill"; }
  else if (currentAspectRatio === "fill") { video.style.objectFit = "contain"; currentAspectRatio = "contain"; }
  else { video.style.style.objectFit = "initial"; currentAspectRatio = "default"; }
  showOSD(); displayStreamStats();
}

function toggleZoom() {
  isZoomed = !isZoomed; video.style.transform = isZoomed ? "scale(1.15)" : "scale(1.0)";
  showOSD(); displayStreamStats();
}

function navigatePlaylistChannels(direction) {
  const context = JSON.parse(localStorage.getItem("current_playlist_context"));
  let idx = parseInt(localStorage.getItem("current_playlist_index")) || 0;
  if(!context || context.length === 0) return;
  idx = (direction === "next") ? (idx + 1) % context.length : (idx - 1 + context.length) % context.length;
  localStorage.setItem("current_playlist_index", idx);
  channel = context[idx]; localStorage.setItem("current", JSON.stringify(channel)); window.location.reload();
}

function handlePlaybackEnded() {
  if(channel.type === "series_episode") playNextEpisodeAutomatically();
  else window.location.href = "details.html";
}

function playNextEpisodeAutomatically() {
  let currentIndex = parseInt(localStorage.getItem("current_ep_index"));
  let episodes = JSON.parse(localStorage.getItem("episodes_pack"));
  if(episodes && currentIndex + 1 < episodes.length) {
    let nextEp = episodes[currentIndex + 1]; localStorage.setItem("current_ep_index", currentIndex + 1);
    localStorage.setItem(`last_ep_for_series_905`, nextEp.id);
    const media = { name: nextEp.title, url: nextEp.url, id: nextEp.id, type: "series_episode" };
    localStorage.setItem("current", JSON.stringify(media)); window.location.reload();
  }
}

function showOSD() {
  controlsPanel.style.opacity = "1"; clearTimeout(osdTimeout);
  osdTimeout = setTimeout(() => { controlsPanel.style.opacity = "0"; }, 5000);
}

function onPlayerError(e) {
  errorBox.innerText = "اتصال منقطع، جاري إعادة الاتصال التلقائي...";
  setTimeout(() => { if(player) player.load(channel.url); }, 3000);
}

function formatTime(secs) {
  if (isNaN(secs)) return "00:00:00";
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

document.addEventListener("keydown", function(e) {
  showOSD();
  if (e.key === "Enter" || e.key === " ") { togglePlayPause(); }
  if (e.key === "ArrowUp") { navigatePlaylistChannels("prev"); }
  if (e.key === "ArrowDown") { navigatePlaylistChannels("next"); }
  if (e.key === "ArrowLeft") { seekBack(); }
  if (e.key === "ArrowRight") { seekForward(); }
  
  // أزرار الألوان للريموت كنترول للشاشات (الاختصارات السريعة الحرة)
  if (e.key === "r" || e.key === "RedColor") { toggleZoom(); }
  if (e.key === "g" || e.key === "GreenColor") { displayStreamStats(); }
  if (e.key === "y" || e.key === "YellowColor") { changePlaybackSpeed(); }
  if (e.key === "b" || e.key === "BlueColor") { toggleAspectRatio(); }
  
  if (e.key === "Backspace" || e.key === "Escape") { window.location.href = "details.html"; }
});
window.onload = initPlayer;
