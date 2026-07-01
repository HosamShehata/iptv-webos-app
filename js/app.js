let liveChannels = [];
let moviesList = [];
let seriesList = [];
let globalFiltered = [];
let activeSubCategories = ["الكل"];

const sidebarViews = ["view-home", "view-live", "view-movies", "view-series", "view-favorites", "view-history", "view-playlist", "view-search", "view-settings"];

let focusMode = "sidebar"; // sidebar | sub_filters | cards | playlist_form | settings
let sidebarIdx = 6;        // الافتراضي يقف على شاشة الإضافة في حال عدم وجود اشتراك
let filterIdx = 0;
let cardIdx = 0;
let formIdx = 2;           // الفوكس يبدأ افتراضياً من تبويب حساب Xtream المختار بالصورة
let settingsIdx = 0;
let columnsCount = 5;

let currentPlaylistType = "xtream"; // m3u | stream1 | xtream
let currentLang = localStorage.getItem("app_lang") || "ar";

const languages = {
  ar: {
    home: "الرئيسية", live: "قنوات مباشرة", movies: "الأفلام", series: "المسلسلات", favorites: "المفضلة",
    history: "تابع المشاهدة", add_playlist: "أضف قائمة تشغيل", search: "البحث المتقدم", settings: "الإعدادات",
    hero_desc: "استمتع بـ تجربة مشاهدة لا حدود لها بدقة 4K ULTRA HD وأحدث تقنيات الصوت الرقمي.",
    recent: "⏱️ تابع المشاهدة مؤخراً", xt_title: "أضف قائمة تشغيل", xt_btn: "إضافة",
    set_acc: "الحساب والاشتراك", set_theme: "المظهر والسمات (Dark Premium)", set_parent: "الرقابة الأبوية والقفل", set_about: "حول التطبيق",
    lang_btn: "اللغة الحالية: العربية (اضغط للتبديل)", no_content: "القائمة فارغة. برجاء إضافة قائمة تشغيل حية من القسم المختص."
  },
  en: {
    home: "Home", live: "Live TV", movies: "Movies", series: "Series", favorites: "Favorites",
    history: "Continue Watching", add_playlist: "Add Playlist", search: "Advanced Search", settings: "Settings",
    hero_desc: "Enjoy an unlimited viewing experience with 4K ULTRA HD and the latest digital sound technologies.",
    recent: "⏱️ Continue Watching", xt_title: "Add Playlist", xt_btn: "Add",
    set_acc: "Account & Subscription", set_theme: "Appearance (Dark Premium)", set_parent: "Parental Control", set_about: "About App",
    lang_btn: "Current Language: English (Click to change)", no_content: "The list is empty. Please add a live playlist from the dedicated section."
  }
};

// تبديل نوع المدخلات حسب التبويب المختار في صورة 88595.jpg
function switchPlaylistType(type) {
  currentPlaylistType = type;
  const rowUser = document.getElementById("row-user");
  const rowPass = document.getElementById("row-pass");
  
  if(type === "m3u") {
    rowUser.style.display = "none";
    rowPass.style.display = "none";
  } else {
    rowUser.style.display = "flex";
    rowPass.style.display = "flex";
  }
  updateFocus();
}

function togglePasswordVisibility() {
  const passInput = document.getElementById("pl_pass");
  const eyeIcon = document.getElementById("eye-icon");
  if(passInput.type === "password") {
    passInput.type = "text";
    eyeIcon.innerText = "visibility_off";
  } else {
    passInput.type = "password";
    eyeIcon.innerText = "visibility";
  }
}

// دالة معالجة الإضافة الحية والقراءة الفورية من السيرفرات
async function processPlaylistAddition() {
  const name = document.getElementById("pl_name").value.trim();
  const url = document.getElementById("pl_url").value.trim().replace(/\/$/, "");
  const user = document.getElementById("pl_user").value.trim();
  const pass = document.getElementById("pl_pass").value.trim();
  const status = document.getElementById("pl_status");

  if(!name || !url) {
    status.innerText = "برجاء كتابة الإسم والرابط كحد أدنى.";
    status.style.color = "#ff4444";
    return;
  }

  status.innerText = "جاري التحقق وسحب البيانات الحية...";
  status.style.color = "#ffffff";

  if(currentPlaylistType === "m3u") {
    // معالجة ملفات M3U حية بالكامل
    try {
      const res = await fetch(url);
      const text = await res.text();
      parseAndSaveM3U(text);
      status.innerText = "تم حفظ ملف M3U بنجاح!";
      status.style.color = "#00C851";
      finalizeLogin();
    } catch(e) {
      status.innerText = "فشل الاتصال برابط الـ M3U. تأكد من صحة الرابط.";
      status.style.color = "#ff4444";
    }
  } else {
    // معالجة حسابات Xtream و Stream-1
    const baseUrl = `${url}/player_api.php?username=${user}&password=${pass}`;
    try {
      const authRes = await fetch(baseUrl);
      const authData = await authRes.json();
      
      if(authData.user_info && authData.user_info.auth === 1) {
        status.innerText = "تم التوثيق الحقيقي! جاري جلب البوسترات والقنوات...";
        
        const resLive = await fetch(`${baseUrl}&action=get_live_streams`);
        liveChannels = await resLive.json();
        const resMovies = await fetch(`${baseUrl}&action=get_vod_streams`);
        moviesList = await resMovies.json();
        const resSeries = await fetch(`${baseUrl}&action=get_series`);
        seriesList = await resSeries.json();

        localStorage.setItem("xt_live", JSON.stringify(liveChannels));
        localStorage.setItem("xt_movies", JSON.stringify(moviesList));
        localStorage.setItem("xt_series", JSON.stringify(seriesList));
        localStorage.setItem("active_playlist_mode", "xtream");
        localStorage.setItem("xtream_creds", JSON.stringify({url, user, pass}));

        status.innerText = "تمت المزامنة بنجاح!";
        status.style.color = "#00C851";
        finalizeLogin();
      } else {
        status.innerText = "بيانات الحساب خاطئة أو منتهية الصلاحية.";
        status.style.color = "#ff4444";
      }
    } catch(e) {
      status.innerText = "فشل الاتصال بالسيرفر المذكور.";
      status.style.color = "#ff4444";
    }
  }
}

function parseAndSaveM3U(data) {
  const lines = data.split("\n");
  liveChannels = []; moviesList = []; seriesList = [];
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const infoLine = lines[i];
      const name = (infoLine.split(",")[1] || "قناة غير معروفة").trim();
      let category_name = "أخرى";
      const groupMatch = infoLine.match(/group-title="([^"]+)"/);
      if (groupMatch) category_name = groupMatch[1].trim();

      let url = "";
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() && !lines[j].startsWith("#")) { url = lines[j].trim(); break; }
      }
      if (url) {
        liveChannels.push({ name, url, category_name, stream_id: Math.random() });
      }
    }
  }
  localStorage.setItem("xt_live", JSON.stringify(liveChannels));
  localStorage.setItem("xt_movies", JSON.stringify([]));
  localStorage.setItem("xt_series", JSON.stringify([]));
  localStorage.setItem("active_playlist_mode", "m3u");
}

function finalizeLogin() {
  setTimeout(() => {
    sidebarIdx = 1; // التوجيه الفوري لقنوات البث المباشر المجلوبة
    focusMode = "sidebar";
    switchView(sidebarViews[sidebarIdx]);
    updateFocus();
  }, 1200);
}

function applyLanguage() {
  const dict = languages[currentLang];
  const htmlTag = document.getElementById("main-html");
  htmlTag.setAttribute("dir", currentLang === "ar" ? "rtl" : "ltr");
  htmlTag.setAttribute("lang", currentLang);
  document.getElementById("lbl-current-lang").innerText = dict.lang_btn;

  document.querySelectorAll(".txt-lang").forEach(el => {
    const key = el.getAttribute("data-key");
    if(dict[key]) el.innerText = dict[key];
  });
}

function toggleLanguage() {
  currentLang = (currentLang === "ar") ? "en" : "ar";
  localStorage.setItem("app_lang", currentLang);
  applyLanguage();
  switchView(sidebarViews[sidebarIdx]);
}

function switchView(viewId) {
  document.querySelectorAll(".view-panel").forEach(panel => panel.classList.remove("active"));
  const activePanel = document.getElementById(viewId);
  if(activePanel) activePanel.classList.add("active");

  if(viewId === "view-playlist") { focusMode = "playlist_form"; return; }

  const defaultAll = (currentLang === "ar") ? "الكل" : "All";
  const set = new Set([defaultAll]);
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
  if(activeSubCategories.length <= 1 || sidebarViews[sidebarIdx] === "view-playlist") { bar.style.display = "none"; return; }
  bar.style.display = "flex";
  activeSubCategories.forEach((cat, idx) => {
    const div = document.createElement("div");
    div.className = "filter-item";
    if(focusMode === "sub_filters" && idx === filterIdx) div.classList.add("focused");
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

  const defaultAll = (currentLang === "ar") ? "الكل" : "All";
  const activeCat = activeSubCategories[filterIdx] || defaultAll;
  globalFiltered = dataList.filter(item => activeCat === defaultAll || item.category_name === activeCat);

  if (globalFiltered.length === 0) {
    container.innerHTML = `<div style='padding:20px; color:#666;'>${languages[currentLang].no_content}</div>`;
    return;
  }

  globalFiltered.forEach((item) => {
    const card = document.createElement("div");
    card.className = "media-card";
    const imgUrl = item.stream_icon || item.cover || "https://placehold.co/200x270/1a1a1a/ffffff?text=VISION+TV";
    card.innerHTML = `
      <div class="badge">${item.container_extension || 'HD'}</div>
      <img src="${imgUrl}" onerror="this.src='https://placehold.co/200x270/1a1a1a/ffffff?text=VISION+TV'" />
      <div class="info">${item.name}</div>
    `;
    container.appendChild(card);
  });

  if (container.clientWidth) columnsCount = Math.floor(container.clientWidth / 220) || 1;
}

function updateFocus() {
  document.querySelectorAll(".menu-item").forEach((el, i) => {
    el.classList.toggle("focused", focusMode === "sidebar" && i === sidebarIdx);
  });
  
  renderSubFilters();

  document.querySelectorAll(".view-panel.active .media-card").forEach((el, i) => {
    el.classList.toggle("focused", focusMode === "cards" && i === cardIdx);
  });
  
  // تحديث دقيق لحقول التبويب والـ inputs في شاشة أضف قائمة تشغيل (88595.jpg)
  const formFields = document.querySelectorAll(".playlist-focusable");
  formFields.forEach((el, i) => {
    const isFocused = focusMode === "playlist_form" && i === formIndex;
    el.classList.toggle("focused", isFocused);
    if(isFocused && el.tagName === "INPUT") el.focus();
    if(!isFocused && el.tagName === "INPUT") el.blur();
  });
  
  document.querySelectorAll(".settings-focusable").forEach((el, i) => {
    el.classList.toggle("focused", focusMode === "settings" && i === settingsIdx);
  });
}

// التحكم الكامل والشامل بالريموت
document.addEventListener("keydown", function(e) {
  const activeView = sidebarViews[sidebarIdx];
  let leftKey = (currentLang === "en") ? "ArrowRight" : "ArrowLeft";
  let rightKey = (currentLang === "en") ? "ArrowLeft" : "ArrowRight";

  if (e.key === leftKey) {
    if (focusMode === "cards" && cardIdx % columnsCount === 0) focusMode = "sidebar";
    else if (focusMode === "cards") cardIdx = Math.max(0, cardIdx - 1);
    else if (focusMode === "sub_filters" && filterIdx === 0) focusMode = "sidebar";
    else if (focusMode === "sub_filters") filterIdx = Math.max(0, filterIdx - 1);
    else if (focusMode === "playlist_form" || focusMode === "settings") focusMode = "sidebar";
  }

  if (e.key === rightKey) {
    if (focusMode === "sidebar") {
      if (activeView === "view-playlist") focusMode = "playlist_form";
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
    } else if (focusMode === "playlist_form") {
      const maxFormIdx = (currentPlaylistType === "m3u") ? 5 : 7; // تفادي الحقول المخفية
      if(formIndex < 2) formIndex = 3; // النزول من التبويبات للحقل الأول مباشرة
      else if(formIndex === 3 && currentPlaylistType === "m3u") formIndex = 6;
      else formIndex = Math.min(formIndex + 1, maxFormIdx == 5 ? 6 : 7);
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
    } else if (focusMode === "playlist_form") {
      if(formIndex === 3) formIndex = 2; // الصعود للتبويبات
      else if(formIndex === 6 && currentPlaylistType === "m3u") formIndex = 3;
      else formIndex = Math.max(0, formIndex - 1);
    } else if (focusMode === "settings") {
      settingsIdx = Math.max(0, settingsIdx - 1);
    }
  }

  if (e.key === "Enter") {
    if (focusMode === "playlist_form") {
      if(formIndex === 0) switchPlaylistType('m3u');
      if(formIndex === 1) switchPlaylistType('stream1');
      if(formIndex === 2) switchPlaylistType('xtream');
      if(formIndex === 4) togglePasswordVisibility();
      if((currentPlaylistType === 'm3u' && formIndex === 6) || (currentPlaylistType !== 'm3u' && formIndex === 7)) {
        processPlaylistAddition();
      }
    }
    if (focusMode === "settings" && settingsIdx === 2) toggleLanguage();
    if (focusMode === "cards" && globalFiltered[cardIdx]) {
      const item = globalFiltered[cardIdx];
      localStorage.setItem("current", JSON.stringify(item));
      if (activeView === "view-live") {
        const mode = localStorage.getItem("active_playlist_mode");
        if(mode === "xtream") {
          const creds = JSON.parse(localStorage.getItem("xtream_creds"));
          item.url = `${creds.url}/live/${creds.user}/${creds.pass}/${item.stream_id}.ts`;
        }
        localStorage.setItem("current", JSON.stringify(item));
        window.location.href = "player.html";
      } else {
        window.location.href = "details.html";
      }
    }
  }

  if (focusMode === "sub_filters") renderContentGrid(activeView);
  updateFocus();
});

window.onload = () => {
  liveChannels = JSON.parse(localStorage.getItem("xt_live")) || [];
  moviesList = JSON.parse(localStorage.getItem("xt_movies")) || [];
  seriesList = JSON.parse(localStorage.getItem("xt_series")) || [];
  
  if(liveChannels.length > 0 || moviesList.length > 0) {
    sidebarIdx = 1; // إذا كان هناك ملف مسبق يتم الفتح على البث الحي فوراً
    focusMode = "sidebar";
  }
  
  applyLanguage();
  switchView(sidebarViews[sidebarIdx]);
  updateFocus();
};
