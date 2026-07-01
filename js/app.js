let liveChannels = [];
let moviesList = [];
let seriesList = [];

let filtered = [];
let categories = ["الكل"];
let currentCategory = "الكل";

// الأقسام الرئيسية المعتمدة في المواصفات
const sidebarItems = ["home", "live", "movies", "series", "favorites", "history", "add-playlist"];

let focusMode = "sidebar"; // sidebar | categories | channels | xtream_form
let sidebarIndex = 1;      // واجهة البث المباشر افتراضياً
let catIndex = 0;
let channelIndex = 0;
let formIndex = 0; 
let columnsCount = 4;      

// دالة تسجيل الدخول وجلب البيانات الشاملة من Xtream API
async function connectXtream() {
  const url = document.getElementById("xt_url").value.replace(/\/$/, ""); 
  const user = document.getElementById("xt_user").value;
  const pass = document.getElementById("xt_pass").value;
  const statusBox = document.getElementById("xt_status");

  if (!url || !user || !pass) {
    statusBox.innerText = "برجاء ملء جميع الحقول!";
    return;
  }

  statusBox.innerText = "جاري التحقق من الحساب...";

  try {
    const authUrl = `${url}/player_api.php?username=${user}&password=${pass}`;
    const response = await fetch(authUrl);
    const data = await response.json();

    if (data.user_info && data.user_info.auth === 1) {
      statusBox.innerText = "تم التوثيق! جاري سحب الأفلام والقنوات...";
      
      const creds = { url, user, pass };
      localStorage.setItem("xtream_creds", JSON.stringify(creds));
      
      // بدء جلب البيانات بالترتيب والتوازي لسرعة الأداء
      await fetchAllData(creds);
      
      statusBox.innerText = "تم تحميل البيانات بنجاح!";
      setTimeout(() => {
        sidebarIndex = 1; // نقل المستخدم لقسم البث المباشر تلقائياً بعد التحميل
        toggleView("live");
      }, 1000);

    } else {
      statusBox.innerText = "بيانات الدخول غير صحيحة.";
    }
  } catch (error) {
    statusBox.innerText = "خطأ في الاتصال بالسيرفر.";
    console.error(error);
  }
}

// جلب كل المحتوى (لايف، أفلام، مسلسلات) وتخزينه محلياً
async function fetchAllData(creds) {
  const baseUrl = `${creds.url}/player_api.php?username=${creds.user}&password=${creds.pass}`;
  
  try {
    // 1. جلب قنوات البث المباشر
    const liveRes = await fetch(`${baseUrl}&action=get_live_streams`);
    liveChannels = await liveRes.json();

    // 2. جلب الأفلام (VOD) المتضمنة روابط البوسترات
    const moviesRes = await fetch(`${baseUrl}&action=get_vod_streams`);
    moviesList = await moviesRes.json();

    // 3. جلب المسلسلات
    const seriesRes = await fetch(`${baseUrl}&action=get_series`);
    seriesList = await seriesRes.json();

    // حفظ الداتا في الذاكرة المؤقتة لسرعة الإقلاع المرة القادمة
    localStorage.setItem("xt_live", JSON.stringify(liveChannels));
    localStorage.setItem("xt_movies", JSON.stringify(moviesList));
    localStorage.setItem("xt_series", JSON.stringify(seriesList));

    extractCategories();
    renderCategories();
    renderChannels();
  } catch (e) {
    console.error("Error fetching Xtream Data", e);
  }
}

// استخراج التصنيفات الفرعية بناءً على القسم المختار من القائمة الجانبية
function extractCategories() {
  const activeSection = sidebarItems[sidebarIndex];
  const set = new Set(["الكل"]);

  if (activeSection === "live") {
    liveChannels.forEach(ch => if(ch.category_name) set.add(ch.category_name));
  } else if (activeSection === "movies") {
    moviesList.forEach(m => if(m.category_name) set.add(m.category_name));
  } else if (activeSection === "series") {
    seriesList.forEach(s => if(s.category_name) set.add(s.category_name));
  }

  categories = (activeSection === "home" || activeSection === "history" || activeSection === "favorites" || activeSection === "add-playlist") 
    ? ["الكل"] 
    : Array.from(set);
}

function renderSidebar() {
  document.querySelectorAll(".menu-item").forEach((item, idx) => {
    item.classList.toggle("focused", focusMode === "sidebar" && idx === sidebarIndex);
  });
}

function renderCategories() {
  const box = document.getElementById("categories");
  box.innerHTML = "";
  categories.forEach((cat) => {
    const div = document.createElement("div");
    div.className = "category-item";
    div.innerText = cat;
    box.appendChild(div);
  });
}

// رندرة الكروت مع إظهار البوسترات للأفلام والمسلسلات طبقاً للمواصفات Premium UI
function renderChannels() {
  const container = document.getElementById("channels");
  container.innerHTML = "";

  const activeSection = sidebarItems[sidebarIndex];
  const search = document.getElementById("search").value.toLowerCase();
  let history = JSON.parse(localStorage.getItem("watch_history")) || [];

  let rawList = [];
  if (activeSection === "live") rawList = liveChannels;
  else if (activeSection === "movies") rawList = moviesList;
  else if (activeSection === "series") rawList = seriesList;
  else if (activeSection === "history") rawList = history;
  else if (activeSection === "home") rawList = history.slice(0, 6); // الـ Continue watching في الرئيسية

  // الفلترة والبحث
  filtered = rawList.filter(item => {
    const name = item.name || item.num || "";
    const matchCategory = currentCategory === "الكل" || item.category_name === currentCategory;
    const matchSearch = name.toLowerCase().includes(search);
    return matchCategory && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = "<div style='padding:20px; color:#666;'>لا يوجد محتوى. تأكد من تسجيل الدخول.</div>";
    return;
  }

  // بناء الكروت بالبوسترات للأفلام والمسلسلات
  filtered.forEach((item) => {
    const div = document.createElement("div");
    div.className = "card";
    
    // استخدام البوستر الذكي لو متوفر (في الأفلام والمسلسلات)، وإلا نضع أيقونة افتراضية للبث المباشر
    const streamIcon = item.stream_icon || item.cover || "";
    if (streamIcon && (activeSection === "movies" || activeSection === "series")) {
      div.innerHTML = `
        <img src="${streamIcon}" style="width:100%; height:180px; object-fit:cover; border-radius:8px; margin-bottom:10px;" onerror="this.src='https://placehold.co/200x280/1a1a1a/ffffff?text=No+Image'"/>
        <div style="font-size:14px; font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</div>
      `;
    } else {
      div.innerText = item.name || "قناة بث مباشر";
    }

    container.appendChild(div);
  });
  
  if (container.clientWidth) {
    columnsCount = Math.floor(container.clientWidth / 240) || 1; 
  }
}

function updateFocus() {
  document.querySelectorAll(".menu-item").forEach((el, i) => {
    el.classList.toggle("focused", focusMode === "sidebar" && i === sidebarIndex);
  });

  document.querySelectorAll(".category-item").forEach((el, i) => {
    el.classList.toggle("focused", focusMode === "categories" && i === catIndex);
  });

  const cards = document.querySelectorAll(".card");
  cards.forEach((el, i) => {
    const isFocused = focusMode === "channels" && i === channelIndex;
    el.classList.toggle("focused", isFocused);
    if (isFocused) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  });

  const formFields = document.querySelectorAll(".xtream-field");
  formFields.forEach((el, i) => {
    const isFocused = focusMode === "xtream_form" && i === formIndex;
    if (el.tagName === "BUTTON") el.classList.toggle("focused", isFocused);
    else isFocused ? el.focus() : el.blur();
  });
}

function openItem(item) {
  const activeSection = sidebarItems[sidebarIndex];
  const creds = JSON.parse(localStorage.getItem("xtream_creds"));
  
  // حفظ العنصر الحالي في الذاكرة
  localStorage.setItem("current", JSON.stringify(item));

  if (activeSection === "live") {
    // بناء رابط البث المباشر لـ Xtream وتوجيهه للمشغل فوراً
    item.url = `${creds.url}/live/${creds.user}/${creds.pass}/${item.stream_id}.ts`;
    localStorage.setItem("current", JSON.stringify(item));
    
    // إضافة لـ تابع المشاهدة
    addToHistory(item, "live");
    window.location.href = "player.html";
  } else {
    // للأفلام والمسلسلات: ننتقل لصفحة التفاصيل الغنية (الخطوة القادمة بالترتيب)
    window.location.href = "details.html";
  }
}

function addToHistory(item, type) {
  let history = JSON.parse(localStorage.getItem("watch_history")) || [];
  item.type = type;
  history = history.filter(h => h.stream_id !== item.stream_id);
  history.unshift(item);
  if (history.length > 50) history.pop();
  localStorage.setItem("watch_history", JSON.stringify(history));
}

function toggleView(section) {
  const contentView = document.getElementById("content-view");
  const playlistManager = document.getElementById("playlist-manager");

  if (section === "add-playlist") {
    contentView.style.display = "none";
    playlistManager.style.display = "block";
    focusMode = "xtream_form";
    formIndex = 0;
  } else {
    playlistManager.style.display = "none";
    contentView.style.display = "flex";
    if (focusMode === "xtream_form" || focusMode === "sidebar") focusMode = "channels";
  }
}

// نظام التحكم بالريموت كنترول للشاشات
document.addEventListener("keydown", function(e) {
  if (e.key === "ArrowLeft") {
    if (focusMode === "channels" && channelIndex % columnsCount === 0) focusMode = "sidebar";
    else if (focusMode === "channels") channelIndex = Math.max(0, channelIndex - 1);
    else if (focusMode === "categories" && catIndex === 0) focusMode = "sidebar";
    else if (focusMode === "categories") catIndex = Math.max(0, catIndex - 1);
    else if (focusMode === "xtream_form") focusMode = "sidebar";
  }

  if (e.key === "ArrowRight") {
    if (focusMode === "sidebar") {
      const activeSection = sidebarItems[sidebarIndex];
      if (activeSection === "add-playlist") focusMode = "xtream_form";
      else focusMode = categories.length > 0 ? "categories" : "channels";
    } else if (focusMode === "categories" && catIndex < categories.length - 1) {
      catIndex++;
    } else if (focusMode === "categories") {
      focusMode = "channels";
    } else if (focusMode === "channels" && (channelIndex + 1) % columnsCount !== 0 && channelIndex < filtered.length - 1) {
      channelIndex++;
    }
  }

  if (e.key === "ArrowDown") {
    if (focusMode === "sidebar") {
      sidebarIndex = Math.min(sidebarIndex + 1, sidebarItems.length - 1);
      toggleView(sidebarItems[sidebarIndex]);
      resetContentPosition();
    } else if (focusMode === "categories") {
      focusMode = "channels";
      channelIndex = 0;
    } else if (focusMode === "channels" && channelIndex + columnsCount < filtered.length) {
      channelIndex += columnsCount;
    } else if (focusMode === "xtream_form") {
      formIndex = Math.min(formIndex + 1, 3);
    }
  }

  if (e.key === "ArrowUp") {
    if (focusMode === "sidebar") {
      sidebarIndex = Math.max(0, sidebarIndex - 1);
      toggleView(sidebarItems[sidebarIndex]);
      resetContentPosition();
    } else if (focusMode === "channels" && channelIndex - columnsCount >= 0) {
      channelIndex -= columnsCount;
    } else if (focusMode === "channels") {
      focusMode = "categories";
    } else if (focusMode === "xtream_form") {
      formIndex = Math.max(0, formIndex - 1);
    }
  }

  if (e.key === "Enter") {
    if (focusMode === "xtream_form" && formIndex === 3) connectXtream();
    if (focusMode === "channels" && filtered[channelIndex]) openItem(filtered[channelIndex]);
  }

  if (focusMode === "categories" && categories[catIndex] !== currentCategory) {
    currentCategory = categories[catIndex];
    channelIndex = 0;
    renderChannels();
  }

  updateFocus();
});

function resetContentPosition() {
  currentCategory = "الكل";
  catIndex = 0;
  channelIndex = 0;
  extractCategories();
  renderCategories();
  renderChannels();
}

// تحميل الداتا المخزنة تلقائياً عند الإقلاع
window.onload = () => {
  liveChannels = JSON.parse(localStorage.getItem("xt_live")) || [];
  moviesList = JSON.parse(localStorage.getItem("xt_movies")) || [];
  seriesList = JSON.parse(localStorage.getItem("xt_series")) || [];
  
  const creds = localStorage.getItem("xtream_creds");
  if(!creds) sidebarIndex = 6; // فتح صفحة التسجيل لو مفيش حساب
  
  toggleView(sidebarItems[sidebarIndex]);
  extractCategories();
  renderSidebar();
  renderCategories();
  renderChannels();
  updateFocus();
};
