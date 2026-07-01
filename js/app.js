let channels = [];
let filtered = [];
let categories = ["الكل"];
let currentCategory = "الكل";

// مصفوفة الأقسام المكتوبة بالـ HTML
const sidebarItems = ["home", "live", "movies", "series", "favorites", "history"];

let focusMode = "sidebar"; 
let sidebarIndex = 1;      // الوقوف افتراضياً على البث المباشر لإظهار قنوات البث الفوري
let catIndex = 0;
let channelIndex = 0;
let columnsCount = 4;      

// تحميل الفايل
function loadPlaylist() {
  const url = document.getElementById("m3uUrl").value;
  if (!url) return;

  fetch(url)
    .then(res => res.text())
    .then(data => {
      channels = parseM3U(data);
      extractCategories();
      renderSidebar();
      renderCategories();
      renderChannels();
      updateFocus();
    })
    .catch(err => console.error("Error loading playlist:", err));
}

// البارسير الذكي لتصنيف القنوات والمسلسلات والأفلام ومجموعاتها
function parseM3U(data) {
  const lines = data.split("\n");
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const infoLine = lines[i];
      const name = (infoLine.split(",")[1] || "عنوان غير معروف").trim();
      
      let category = "أخرى";
      const groupMatch = infoLine.match(/group-title="([^"]+)"/);
      if (groupMatch) {
        category = groupMatch[1].trim();
      }

      // تحديد نوع الداتا بناءً على اسم الجروب والكلمات المفتاحية
      let type = "live"; 
      const lowerName = name.toLowerCase();
      const lowerCat = category.toLowerCase();

      if (lowerCat.includes("movie") || lowerCat.includes("film") || lowerCat.includes("أفلام") || lowerCat.includes("افلام")) {
        type = "movie";
      } else if (lowerCat.includes("series") || lowerCat.includes("مسلسلات") || lowerName.includes("s01") || lowerName.includes("e01")) {
        type = "series";
      }

      let url = "";
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() && !lines[j].startsWith("#")) {
          url = lines[j].trim();
          break;
        }
      }

      if (url) {
        result.push({ name, url, category, type });
      }
    }
  }
  return result;
}

// فحص واستخراج الأقسام حسب الاختيار من القائمة الجانبية
function extractCategories() {
  const activeSection = sidebarItems[sidebarIndex];
  const set = new Set(["الكل"]);

  channels.forEach(ch => {
    if (activeSection === "live" && ch.type === "live") set.add(ch.category);
    if (activeSection === "movies" && ch.type === "movie") set.add(ch.category);
    if (activeSection === "series" && ch.type === "series") set.add(ch.category);
  });

  if (activeSection === "home" || activeSection === "history" || activeSection === "favorites") {
    categories = ["الكل"];
  } else {
    categories = Array.from(set);
  }
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

// رندرة الكروت مع إدراج نظام الـ Continue Watching
function renderChannels() {
  const search = document.getElementById("search").value.toLowerCase();
  const container = document.getElementById("channels");
  container.innerHTML = "";

  const activeSection = sidebarItems[sidebarIndex];
  
  let history = JSON.parse(localStorage.getItem("watch_history")) || [];
  let favorites = JSON.parse(localStorage.getItem("favorites_list")) || [];

  if (activeSection === "home") {
    // الصفحة الرئيسية تعرض آخر المشاهدات عالمياً
    filtered = history.slice(0, 6); 
  } else if (activeSection === "history") {
    filtered = history;
  } else if (activeSection === "favorites") {
    filtered = favorites;
  } else {
    filtered = channels.filter(ch => {
      const matchSection = (activeSection === "live" && ch.type === "live") ||
                           (activeSection === "movies" && ch.type === "movie") ||
                           (activeSection === "series" && ch.type === "series");
      const matchCategory = currentCategory === "الكل" || ch.category === currentCategory;
      const matchSearch = ch.name.toLowerCase().includes(search);
      return matchSection && matchCategory && matchSearch;
    });

    // رفع المشاهدات مؤخراً الخاصة بالقسم في المقدمة
    if (currentCategory === "الكل" && !search) {
      const sectionHistory = history.filter(h => h.type === (activeSection === "live" ? "live" : activeSection === "movies" ? "movie" : "series"));
      filtered = [...sectionHistory, ...filtered.filter(f => !sectionHistory.some(h => h.url === f.url))];
    }
  }

  if (filtered.length === 0) {
    container.innerHTML = "<div style='padding:20px; color:#666;'>لا يوجد محتوى متوفر حالياً</div>";
    return;
  }

  filtered.forEach((ch) => {
    const div = document.createElement("div");
    div.className = "card";
    
    const isInHistory = history.some(h => h.url === ch.url);
    div.innerText = isInHistory ? `⏱️ ${ch.name}` : ch.name;

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
}

function openChannel(ch) {
  let history = JSON.parse(localStorage.getItem("watch_history")) || [];
  history = history.filter(h => h.url !== ch.url);
  history.unshift(ch); 
  
  if (history.length > 50) history.pop();
  
  localStorage.setItem("watch_history", JSON.stringify(history));
  localStorage.setItem("current", JSON.stringify(ch));
  window.location.href = "player.html";
}

// ريموت الكنترول والملاحة الذكية
document.addEventListener("keydown", function(e) {
  if (e.key === "ArrowLeft") {
    if (focusMode === "channels") {
      if (channelIndex % columnsCount === 0) focusMode = "sidebar";
      else channelIndex = Math.max(0, channelIndex - 1);
    } else if (focusMode === "categories") {
      if (catIndex === 0) focusMode = "sidebar";
      else catIndex = Math.max(0, catIndex - 1);
    }
  }

  if (e.key === "ArrowRight") {
    if (focusMode === "sidebar") {
      focusMode = categories.length > 0 ? "categories" : "channels";
    } else if (focusMode === "categories") {
      if (catIndex < categories.length - 1) catIndex++;
      else focusMode = "channels";
    } else if (focusMode === "channels") {
      if ((channelIndex + 1) % columnsCount !== 0 && channelIndex < filtered.length - 1) {
        channelIndex++;
      }
    }
  }

  if (e.key === "ArrowDown") {
    if (focusMode === "sidebar") {
      sidebarIndex = Math.min(sidebarIndex + 1, sidebarItems.length - 1);
      resetContentPosition();
    } else if (focusMode === "categories") {
      focusMode = "channels";
      channelIndex = 0;
    } else if (focusMode === "channels") {
      if (channelIndex + columnsCount < filtered.length) channelIndex += columnsCount;
    }
  }

  if (e.key === "ArrowUp") {
    if (focusMode === "sidebar") {
      sidebarIndex = Math.max(0, sidebarIndex - 1);
      resetContentPosition();
    } else if (focusMode === "channels") {
      if (channelIndex - columnsCount >= 0) channelIndex -= columnsCount;
      else focusMode = "categories";
    }
  }

  if (e.key === "Enter") {
    if (focusMode === "channels" && filtered[channelIndex]) {
      openChannel(filtered[channelIndex]);
    }
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

window.onload = () => {
  loadPlaylist();
};
