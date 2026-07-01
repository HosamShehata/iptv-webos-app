let channels = [];
let filtered = [];
let categories = ["الكل"];
let currentCategory = "الكل";

[span_0](start_span)// الأقسام الأساسية في القائمة الجانبية[span_0](end_span)
const sidebarItems = ["home", "live", "movies", "series", "favorites"];

let focusMode = "sidebar"; // الأنماط المتاحة: sidebar | categories | channels
let sidebarIndex = 1;      // واقف افتراضياً على "البث المباشر"
let catIndex = 0;
let channelIndex = 0;
let columnsCount = 4;      // عدد الأعمدة الافتراضي في الشبكة ويتم تحديثه ديناميكياً

[span_1](start_span)// دالة تحميل قائمة القنوات[span_1](end_span)
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

[span_2](start_span)// دالة تفكيك ملف الـ M3U واستخراج المجموعات (group-title) بشكل ذكي[span_2](end_span)
function parseM3U(data) {
  const lines = data.split("\n");
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const infoLine = lines[i];
      
      // استخراج التصنيف بناءً على تاغ group-title المعتمد في ملفات IPTV
      let category = "أخرى";
      const groupMatch = infoLine.match(/group-title="([^"]+)"/);
      if (groupMatch) {
        category = groupMatch[1];
      } else {
        const namePart = infoLine.split(",")[1] || "";
        if (namePart.toLowerCase().includes("sport")) category = "الرياضة";
        if (namePart.toLowerCase().includes("news")) category = "الأخبار";
      }

      // البحث عن أول سطر غير فارغ تالي يحتوي على رابط البث
      let url = "";
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() && !lines[j].startsWith("#")) {
          url = lines[j].trim();
          break;
        }
      }

      if (url) {
        const name = infoLine.split(",")[1] || "قناة غير معروفة";
        result.push({ name: name.trim(), url, category: category.trim() });
      }
    }
  }
  return result;
}

// استخراج كافة التصنيفات الفرعية الفريدة من القنوات المتوفرة
function extractCategories() {
  const set = new Set(["الكل"]);
  channels.forEach(ch => set.add(ch.category));
  categories = Array.from(set);
}

// رندرة وتحديث القائمة الجانبية
function renderSidebar() {
  const items = document.querySelectorAll(".menu-item");
  items.forEach((item, idx) => {
    item.classList.toggle("focused", focusMode === "sidebar" && idx === sidebarIndex);
  });
}

[span_3](start_span)// رندرة وتحديث شريط التصنيفات الفرعية العلوية[span_3](end_span)
function renderCategories() {
  const box = document.getElementById("categories");
  box.innerHTML = "";
  categories.forEach((cat, i) => {
    const div = document.createElement("div");
    div.className = "category-item";
    div.innerText = cat;
    box.appendChild(div);
  });
}

[span_4](start_span)[span_5](start_span)// رندرة القنوات في الشبكة (Grid) مع تفعيل الفلترة والبحث[span_4](end_span)[span_5](end_span)
function renderChannels() {
  const search = document.getElementById("search").value.toLowerCase();
  const container = document.getElementById("channels");
  container.innerHTML = "";

  filtered = channels.filter(ch => {
    const matchCategory = currentCategory === "الكل" || ch.category === currentCategory;
    const matchSearch = ch.name.toLowerCase().includes(search);
    return matchCategory && matchSearch;
  });

  filtered.forEach((ch) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerText = ch.name;
    container.appendChild(div);
  });
  
  // حساب عدد الأعمدة بناءً على عرض الشاشة الحالي لتسهيل حركة الريموت الرأسية
  if (container.clientWidth) {
    columnsCount = Math.floor(container.clientWidth / 240) || 1; 
  }
}

[span_6](start_span)// تحديث كلاس الـ .focused للعنصر النشط حالياً لتمييزه على الشاشة[span_6](end_span)
function updateFocus() {
  // القائمة الجانبية
  document.querySelectorAll(".menu-item").forEach((el, i) => {
    el.classList.toggle("focused", focusMode === "sidebar" && i === sidebarIndex);
  });

  // التصنيفات
  document.querySelectorAll(".category-item").forEach((el, i) => {
    el.classList.toggle("focused", focusMode === "categories" && i === catIndex);
  });

  // كروت القنوات
  const cards = document.querySelectorAll(".card");
  cards.forEach((el, i) => {
    const isFocused = focusMode === "channels" && i === channelIndex;
    el.classList.toggle("focused", isFocused);
    if (isFocused) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  });
}

[span_7](start_span)// الانتقال لصفحة المشغل عند فتح القناة[span_7](end_span)
function openChannel(ch) {
  localStorage.setItem("current", JSON.stringify(ch));
  window.location.href = "player.html";
}

[span_8](start_span)// نظام التحكم الشامل والمطور بأزرار الريموت المتوافق مع شاشات الـ TV[span_8](end_span)
document.addEventListener("keydown", function(e) {
  const cards = document.querySelectorAll(".card");
  
  if (e.key === "ArrowLeft") {
    if (focusMode === "channels") {
      if (channelIndex % columnsCount === 0) {
        focusMode = "sidebar"; // الانتقال للقائمة الجانبية إذا كان في أول عمود
      } else {
        channelIndex = Math.max(0, channelIndex - 1);
      }
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
    } else if (focusMode === "categories") {
      focusMode = "channels";
      channelIndex = 0;
    } else if (focusMode === "channels") {
      if (channelIndex + columnsCount < filtered.length) {
        channelIndex += columnsCount; // النزول لـ السطر التالي مباشرة في الـ Grid
      }
    }
  }

  if (e.key === "ArrowUp") {
    if (focusMode === "sidebar") {
      sidebarIndex = Math.max(0, sidebarIndex - 1);
    } else if (focusMode === "channels") {
      if (channelIndex - columnsCount >= 0) {
        channelIndex -= columnsCount; // الصعود للسطر السابق في الـ Grid
      } else {
        focusMode = "categories"; // الصعود للتصنيفات العلوية لو كان في أول سطر للشبكة
      }
    }
  }

  if (e.key === "Enter") {
    if (focusMode === "channels" && filtered[channelIndex]) {
      openChannel(filtered[channelIndex]);
    }
  }

  // تحديث وعرض قنوات التصنيف المحدد تلقائياً عند تغيير اختيار التصنيف العلوى
  if (focusMode === "categories" && categories[catIndex] !== currentCategory) {
    currentCategory = categories[catIndex];
    channelIndex = 0;
    renderChannels();
  }

  updateFocus();
});

// تحميل تلقائي تجريبي عند إقلاع الصفحة لتجربة الأداء
window.onload = () => {
  loadPlaylist();
};
