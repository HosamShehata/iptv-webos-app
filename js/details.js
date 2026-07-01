const item = JSON.parse(localStorage.getItem("current"));
const creds = JSON.parse(localStorage.getItem("xtream_creds"));

let focusMode = "buttons"; // buttons | episodes
let buttonIndex = 0;
let episodeIndex = 0;
let episodesData = [];

// دالة جلب بيانات وتفاصيل المادة الشاملة
async function loadDetails() {
  if (!item) {
    window.location.href = "index.html";
    return;
  }

  // 1. حقن البيانات الأساسية في الـ HTML
  document.getElementById("item-title").innerText = item.name;
  document.getElementById("item-meta").innerText = `التصنيف: ${item.category_name || "عام"}`;
  
  const imgUrl = item.stream_icon || item.cover || "";
  if(imgUrl) {
    document.getElementById("item-poster").src = imgUrl;
    document.getElementById("hero-backdrop").style.backgroundImage = `url('${imgUrl}')`;
  }

  // 2. التحقق لو المادة فيلم أو مسلسل لجلب تفاصيل إضافية (القصة والحلقات)
  const baseUrl = `${creds.url}/player_api.php?username=${creds.user}&password=${creds.pass}`;
  
  try {
    if (item.series_id) {
      // المادة "مسلسل": جلب تفاصيل الحلقات
      document.getElementById("series-area").style.display = "flex";
      const res = await fetch(`${baseUrl}&action=get_series_info&series_id=${item.series_id}`);
      const infoData = await res.json();
      
      if(infoData.info && infoData.info.plot) {
        document.getElementById("item-desc").innerText = infoData.info.plot;
      }

      // تحضير قائمة الحلقات (دمج كل المواسم في قائمة واحدة مسطحة لتسهيل الريموت)
      episodesData = [];
      if(infoData.episodes) {
        Object.keys(infoData.episodes).forEach(seasonNum => {
          infoData.episodes[seasonNum].forEach(ep => {
            episodesData.push({
              name: `الموسم ${seasonNum} - الحلقة ${ep.episode_num}: ${ep.title}`,
              stream_id: ep.id,
              container_extension: ep.container_extension || "mp4"
            });
          });
        });
      }
      renderEpisodes();
    } else {
      // المادة "فيلم": جلب بيانات الفيلم الإضافية لو متوفرة
      const res = await fetch(`${baseUrl}&action=get_vod_info&stream_id=${item.stream_id}`);
      const infoData = await res.json();
      if(infoData.info && infoData.info.plot) {
        document.getElementById("item-desc").innerText = infoData.info.plot;
      }
    }
  } catch (e) {
    console.error("Error loading rich details:", e);
  }

  updateFocus();
}

function renderEpisodes() {
  const container = document.getElementById("episodes-list");
  container.innerHTML = "";
  episodesData.forEach((ep) => {
    const div = document.createElement("div");
    div.className = "episode-card";
    div.innerText = ep.name;
    container.appendChild(div);
  });
}

function updateFocus() {
  // تركيز الأزرار العليا
  const buttons = document.querySelectorAll(".details-focusable");
  buttons.forEach((btn, i) => {
    btn.classList.toggle("focused", focusMode === "buttons" && i === buttonIndex);
  });

  // تركيز الحلقات
  const epCards = document.querySelectorAll(".episode-card");
  epCards.forEach((card, i) => {
    const isFocused = focusMode === "episodes" && i === episodeIndex;
    card.classList.toggle("focused", isFocused);
    if(isFocused) {
      card.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
  });
}

// دالة بدء تشغيل البث المباشر للأفلام أو الحلقات المختارة
function startPlayback() {
  if (item.series_id) {
    // لو مسلسل ولم يحدد حلقة، يشغل الحلقة الأولى افتراضياً
    if(episodesData.length > 0) playEpisode(episodesData[0]);
  } else {
    // لو فيلم: بناء رابط تشغيل الفيلم المباشر من Xtream
    item.url = `${creds.url}/movie/${creds.user}/${creds.pass}/${item.stream_id}.${item.container_extension || "mp4"}`;
    localStorage.setItem("current", JSON.stringify(item));
    window.location.href = "player.html";
  }
}

function playEpisode(ep) {
  const playItem = {
    name: `${item.name} - ${ep.name}`,
    url: `${creds.url}/series/${creds.user}/${creds.pass}/${ep.stream_id}.${ep.container_extension}`
  };
  localStorage.setItem("current", JSON.stringify(playItem));
  window.location.href = "player.html";
}

// إضافة/إزالة من المفضلة
function toggleFavorite() {
  let favorites = JSON.parse(localStorage.getItem("favorites_list")) || [];
  const isFav = favorites.some(f => f.stream_id === item.stream_id || f.series_id === item.series_id);
  
  if(isFav) {
    favorites = favorites.filter(f => (item.stream_id ? f.stream_id !== item.stream_id : f.series_id !== item.series_id));
    document.getElementById("btn-fav").innerText = "❤️ إضافة للمفضلة";
  } else {
    favorites.unshift(item);
    document.getElementById("btn-fav").innerText = "💚 إزالة من المفضلة";
  }
  localStorage.setItem("favorites_list", JSON.stringify(favorites));
}

// تحكم الريموت الذكي المتوافق مع شاشات الـ TV لصفحة التفاصيل
document.addEventListener("keydown", function(e) {
  const buttons = document.querySelectorAll(".details-focusable");

  if (e.key === "ArrowLeft") {
    if (focusMode === "buttons") buttonIndex = Math.max(0, buttonIndex - 1);
    if (focusMode === "episodes") episodeIndex = Math.max(0, episodeIndex - 1);
  }

  if (e.key === "ArrowRight") {
    if (focusMode === "buttons") buttonIndex = Math.min(buttons.length - 1, buttonIndex + 1);
    if (focusMode === "episodes") episodeIndex = Math.min(episodesData.length - 1, episodeIndex + 1);
  }

  if (e.key === "ArrowDown") {
    if (focusMode === "buttons" && episodesData.length > 0) {
      focusMode = "episodes";
      episodeIndex = 0;
    }
  }

  if (e.key === "ArrowUp") {
    if (focusMode === "episodes") {
      focusMode = "buttons";
    }
  }

  if (e.key === "Enter") {
    if (focusMode === "buttons") {
      buttons[buttonIndex].click();
    } else if (focusMode === "episodes" && episodesData[episodeIndex]) {
      playEpisode(episodesData[episodeIndex]);
    }
  }

  if (e.key === "Backspace" || e.key === "Escape") {
    window.location.href = "index.html";
  }

  updateFocus();
});

window.onload = loadDetails;
