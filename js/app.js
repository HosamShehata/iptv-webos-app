// مصفوفات تخزين المحتوى المجلوب من السيرفر
let liveChannels = [];
let moviesList = [];
let seriesList = [];
let globalFiltered = [];
let activeSubCategories = ["الكل"];

const sidebarViews = ["view-home", "view-live", "view-movies", "view-series", "view-favorites", "view-history", "view-playlist", "view-search", "view-settings"];

let focusMode = "sidebar"; // sidebar | sub_filters | cards | xtream_form | settings
let sidebarIdx = 1;        // يقف افتراضياً على البث المباشر
let filterIdx = 0;
let cardIdx = 0;
let formIdx = 0;
let settingsIdx = 0;
let columnsCount = 5;

// دالة التنقل وعرض الشاشة المطلوبة واقتباس تصنيفاتها الفرعية
function switchView(viewId) {
  document.querySelectorAll(".view-panel").forEach(panel => panel.classList.remove("active"));
  const activePanel = document.getElementById(viewId);
  if(activePanel) activePanel.classList.add("active");

  // تصفية واستخراج الفلاتر الفرعية العلوية طبقاً للقسم النشط
  const set = new Set(["الكل"]);
  if (viewId === "view-live") liveChannels.forEach(ch => if(ch.category_name) set.add(ch.category_name));
  if (viewId === "view-movies") moviesList.forEach(m => if(m.category_name) set.add(m.category_name));
  if (viewId === "view-series") seriesList.forEach(s => if(s.category_name) set.add(s.category_name));
  
  activeSubCategories = Array.from(set);
  renderSubFilters();
  renderContentGrid(viewId);
}

function renderSubFilters() {
  const bar = document.getElementById("subFilterBar");
  bar.innerHTML = "";
  if(activeSubCategories.length <= 1) {
    bar.style.display = "none";
    return;
  }
  bar.style.display = "flex";
  activeSubCategories.forEach((cat) => {
    const div = document.createElement("div");
    div.className = "filter-item";
    div.innerText = cat;
    bar.appendChild(div);
  });
}

function renderContentGrid(viewId) {
  let targetGridId = "";
  let dataList = [];

  if (viewId === "view-live") { targetGridId = "live-grid"; dataList = liveChannels; }
  else if (viewId === "view-movies") { targetGridId = "movies-grid"; dataList = moviesList; }
  else if (viewId === "view-series") { targetGridId = "series-grid"; dataList = seriesList; }
  else if (viewId === "view-favorites") { targetGridId = "favorites-grid"; dataList = JSON.parse(localStorage.getItem("favorites_list")) || []; }
  else if (viewId === "view-history") { targetGridId = "history-grid"; dataList = JSON.parse(localStorage.getItem("watch_history")) || []; }
  else if (viewId === "view-home") { targetGridId = "home-history-grid"; dataList = (JSON.parse(localStorage.getItem("watch_history")) || []).slice(0, 5); }
  else return;

  const container = document.getElementById(targetGridId);
  if(!container) return;
  container.innerHTML = "";

  // فلترة الداتا بناءً على التصنيف الفرعي المختار
  const activeCat = activeSubCategories[filterIdx] || "الكل";
  globalFiltered = dataList.filter(item => activeCat === "الكل" || item.category_name === activeCat);

  globalFiltered.forEach((item) => {
    const card = document.createElement("div");
    card.className = "media-card";
    const imgUrl = item.stream_icon || item.cover || "https://placehold.co/200x270/1a1a1a/ffffff?text=VISION+TV";
    
    card.innerHTML = `
      <div class="badge">${item.container_extension || 'HD'}</div>
      <img src="${imgUrl}" onerror="this.src='https://placehold.co/200x270/1a1a1a/ffffff?text=VISION+TV'" />
      <div class="info">${item.name || 'مادة عرض'}</div>
    `;
    container.appendChild(card);
  });

  if (container.clientWidth) columnsCount = Math.floor(container.clientWidth / 220) || 1;
}

[span_2](start_span)// الاتصال وجلب محتوى الـ Xtream API بالكامل بالبوسترات والأقسام الفرعية[span_2](end_span)
async function connectXtream() {
  const url = document.getElementById("xt_url").value.replace(/\/$/, "");
  const user = document.getElementById("xt_user").value;
  const pass = document.getElementById("xt_pass").value;
  const status = document.getElementById("xt_status");

  status.innerText = "جاري جلب القنوات والبوسترات الفخمة لجميع الأقسام...";
  const baseUrl = `${url}/player_api.php?username=${user}&password=${pass}`;

  try {
    const resLive = await fetch(`${baseUrl}&action=get_live_streams`);
    liveChannels = await resLive.json();
    const resMovies = await fetch(`${baseUrl}&action=get_vod_streams`);
    moviesList = await resMovies.json();
    const resSeries = await fetch(`${baseUrl}&action=get_series`);
    seriesList = await resSeries.json();

    localStorage.setItem("xt_live", JSON.stringify(liveChannels));
    localStorage.setItem("xt_movies", JSON.stringify(moviesList));
    localStorage.setItem("xt_series", JSON.stringify(seriesList));
    localStorage.setItem("xtream_creds", JSON.stringify({url, user, pass}));

    status.innerText = "تم التحميل والمزامنة بنجاح!";
    setTimeout(() => { sidebarIdx = 1; switchView("view-live"); focusMode = "sidebar"; updateFocus(); }, 1000);
  } catch(e) {
    status.innerText = "فشل جلب البيانات الذكية من السيرفر. تأكد من الاشتراك.";
  }
}

function triggerGlobalSearch() {
  const query = document.getElementById("search-input").value.toLowerCase();
  const container = document.getElementById("search-results-grid");
  container.innerHTML = "";
  
  const all = [...liveChannels, ...moviesList, ...seriesList];
  globalFiltered = all.filter(i => (i.name || "").toLowerCase().includes(query)).slice(0, 30);

  globalFiltered.forEach(item => {
    const card = document.createElement("div");
    card.className = "media-card";
    card.innerHTML = `<img src="${item.stream_icon || item.cover || 'https://placehold.co/200x270/1a1a1a/ffffff?text=VISION'}" /><div class="info">${item.name}</div>`;
    container.appendChild(card);
  });
}

function updateFocus() {
  // 1. فوكس السايد بار
  document.querySelectorAll(".menu-item").forEach((el, i) => {
    el.classList.toggle("focused", focusMode === "sidebar" && i === sidebarIdx);
  });
  // 2. فوكس الفلاتر العلوية
  document.querySelectorAll(".filter-item").forEach((el, i) => {
    el.classList.toggle("focused", focusMode === "sub_filters" && i === filterIdx);
  });
  // 3. فوكس كروت المواد
  document.querySelectorAll(".view-panel.active .media-card").forEach((el, i) => {
    const isFocused = focusMode === "cards" && i === cardIdx;
    el.classList.toggle("focused", isFocused);
    if(isFocused) el.scrollIntoView({ block: "center", behavior: "smooth" });
  });
  // 4. فوكس فورم البيانات
  document.querySelectorAll(".xtream-field").forEach((el, i) => {
    const isFocused = focusMode === "xtream_form" && i === formIdx;
    if(el.tagName === "BUTTON") el.classList.toggle("focused", isFocused);
    else isFocused ? el.focus() : el.blur();
  });
  // 5. فوكس الإعدادات
  document.querySelectorAll(".settings-focusable").forEach((el, i) => {
    el.classList.toggle("focused", focusMode === "settings" && i === settingsIdx);
  });
}

// الملاحة ثنائية الأبعاد المتوافقة مع الشاشات والريموت الكنترول
document.addEventListener("keydown", function(e) {
  const activeView = sidebarViews[sidebarIdx];

  if (e.key === "ArrowLeft") {
    if (focusMode === "cards" && cardIdx % columnsCount === 0) focusMode = "sidebar";
    else if (focusMode === "cards") cardIdx = Math.max(0, cardIdx - 1);
    else if (focusMode === "sub_filters" && filterIdx === 0) focusMode = "sidebar";
    else if (focusMode === "sub_filters") filterIdx = Math.max(0, filterIdx - 1);
    else if (focusMode === "xtream_form" || focusMode === "settings") focusMode = "sidebar";
  }

  if (e.key === "ArrowRight") {
    if (focusMode === "sidebar") {
      if (activeView === "view-playlist") focusMode = "xtream_form";
      else if (activeView === "view-settings") focusMode = "settings";
      else focusMode = activeSubCategories.length > 1 ? "sub_filters" : "cards";
    } else if (focusMode === "sub_filters" && filterIdx < activeSubCategories.length - 1) {
      filterIdx++;
    } else if (focusMode === "sub_filters") {
      focusMode = "cards"; cardIdx = 0;
    } else if (focusMode === "cards" && (cardIdx + 1) % columnsCount !== 0 && cardIdx < globalFiltered.length - 1) {
      cardIdx++;
    }
  }

  if (e.key === "ArrowDown") {
    if (focusMode === "sidebar") {
      sidebarIdx = Math.min(sidebarIdx + 1, sidebarViews.length - 1);
      filterIdx = 0; cardIdx = 0; switchView(sidebarViews[sidebarIdx]);
    } else if (focusMode === "sub_filters") {
      focusMode = "cards"; cardIdx = 0;
    } else if (focusMode === "cards" && cardIdx + columnsCount < globalFiltered.length) {
      cardIdx += columnsCount;
    } else if (focusMode === "xtream_form") {
      formIdx = Math.min(formIdx + 1, 3);
    } else if (focusMode === "settings") {
      settingsIdx = Math.min(settingsIdx + 1, 4);
    }
  }

  if (e.key === "ArrowUp") {
    if (focusMode === "sidebar") {
      sidebarIdx = Math.max(0, sidebarIdx - 1);
      filterIdx = 0; cardIdx = 0; switchView(sidebarViews[sidebarIdx]);
    } else if (focusMode === "cards" && cardIdx - columnsCount >= 0) {
      cardIdx -= columnsCount;
    } else if (focusMode === "cards" && activeSubCategories.length > 1) {
      focusMode = "sub_filters";
    } else if (focusMode === "xtream_form") {
      formIdx = Math.max(0, formIdx - 1);
    } else if (focusMode === "settings") {
      settingsIdx = Math.max(0, settingsIdx - 1);
    }
  }

  if (e.key === "Enter") {
    if (focusMode === "xtream_form" && formIdx === 3) connectXtream();
    if (focusMode === "cards" && globalFiltered[cardIdx]) {
      const item = globalFiltered[cardIdx];
      localStorage.setItem("current", JSON.stringify(item));
      
      if (activeView === "view-live") {
        const creds = JSON.parse(localStorage.getItem("xtream_creds"));
        item.url = `${creds.url}/live/${creds.user}/${creds.pass}/${item.stream_id}.ts`;
        localStorage.setItem("current", JSON.stringify(item));
        window.location.href = "player.html";
      } else {
        window.location.href = "details.html"; // الانتقال لصفحة 5 و 6 للتفاصيل ووصف الحلقات
      }
    }
  }

  if (focusMode === "sub_filters") {
    renderContentGrid(activeView);
  }

  updateFocus();
});

window.onload = () => {
  liveChannels = JSON.parse(localStorage.getItem("xt_live")) || [];
  moviesList = JSON.parse(localStorage.getItem("xt_movies")) || [];
  seriesList = JSON.parse(localStorage.getItem("xt_series")) || [];
  switchView(sidebarViews[sidebarIdx]);
  updateFocus();
};
