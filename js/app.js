let channels = [];
let filtered = [];
let categories = ["الكل"];
let currentCategory = "الكل";

// الأقسام متضمنة إضافة القائمة[span_4](start_span)[span_4](end_span)
const sidebarItems = ["home", "live", "movies", "series", "favorites", "history", "add-playlist"];

let focusMode = "sidebar"; // sidebar | categories | channels | xtream_form
let sidebarIndex = 1;      
let catIndex = 0;
let channelIndex = 0;
let formIndex = 0; // للتحكم في حقول إدخال Xtream
let columnsCount = 4;      

// دالة تسجيل الدخول لـ Xtream API[span_5](start_span)[span_5](end_span)[span_6](start_span)[span_6](end_span)
async function connectXtream() {
  const url = document.getElementById("xt_url").value.replace(/\/$/, ""); // إزالة الشرطة الأخيرة لو موجودة
  const user = document.getElementById("xt_user").value;
  const pass = document.getElementById("xt_pass").value;
  const statusBox = document.getElementById("xt_status");

  if (!url || !user || !pass) {
    statusBox.innerText = "برجاء ملء جميع الحقول!";
    statusBox.style.color = "#ff4444";
    return;
  }

  statusBox.innerText = "جاري الاتصال بالسيرفر...";
  statusBox.style.color = "#fff";

  try {
    // نداء التوثيق الأساسي لـ Xtream (يجلب بيانات الحساب)
    const authUrl = `${url}/player_api.php?username=${user}&password=${pass}`;
    const response = await fetch(authUrl);
    const data = await response.json();

    if (data.user_info && data.user_info.auth === 1) {
      statusBox.innerText = "تم تسجيل الدخول بنجاح! جاري جلب القنوات...";
      statusBox.style.color = "#00C851";
      
      // حفظ بيانات السيرفر في الـ LocalStorage لاستخدامها في التطبيق
      localStorage.setItem("xtream_creds", JSON.stringify({ url, user, pass }));
      
      // هنا سيتم استدعاء دوال جلب (اللايف، الأفلام، المسلسلات) - الخطوة القادمة
      setTimeout(() => {
        alert("تم الحفظ! في الخطوة القادمة سنبرمج جلب البوسترات والأقسام.");
      }, 1000);

    } else {
      statusBox.innerText = "بيانات الدخول غير صحيحة أو الحساب منتهي.";
      statusBox.style.color = "#ff4444";
    }
  } catch (error) {
    statusBox.innerText = "خطأ في الاتصال بالسيرفر. تأكد من الرابط والإنترنت.";
    statusBox.style.color = "#ff4444";
    console.error(error);
  }
}

// التبديل بين شاشة القنوات وشاشة التسجيل
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
    if (focusMode === "xtream_form") focusMode = "channels";
  }
}

function extractCategories() {
  categories = ["الكل"]; // حالياً نعتمد على الأساسيات حتى نربط جلب تصنيفات Xtream
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

function renderChannels() {
  const container = document.getElementById("channels");
  container.innerHTML = "<div style='padding:20px; color:#666;'>قم بتسجيل الدخول من 'إضافة قائمة تشغيل' لعرض المحتوى.</div>";
}

function updateFocus() {
  // القائمة الجانبية
  document.querySelectorAll(".menu-item").forEach((el, i) => {
    el.classList.toggle("focused", focusMode === "sidebar" && i === sidebarIndex);
  });

  // شريط التصنيفات
  document.querySelectorAll(".category-item").forEach((el, i) => {
    el.classList.toggle("focused", focusMode === "categories" && i === catIndex);
  });

  // نموذج إدخال Xtream
  const formFields = document.querySelectorAll(".xtream-field");
  formFields.forEach((el, i) => {
    const isFocused = focusMode === "xtream_form" && i === formIndex;
    if (el.tagName === "BUTTON") {
      el.classList.toggle("focused", isFocused);
    } else {
      isFocused ? el.focus() : el.blur();
    }
  });
}

// نظام الملاحة الذكي المتوافق مع النماذج (Forms)
document.addEventListener("keydown", function(e) {
  
  if (e.key === "ArrowLeft") {
    if (focusMode === "xtream_form" || focusMode === "channels" || focusMode === "categories") {
      focusMode = "sidebar";
    }
  }

  if (e.key === "ArrowRight") {
    if (focusMode === "sidebar") {
      const activeSection = sidebarItems[sidebarIndex];
      if (activeSection === "add-playlist") focusMode = "xtream_form";
      else focusMode = categories.length > 0 ? "categories" : "channels";
    }
  }

  if (e.key === "ArrowDown") {
    if (focusMode === "sidebar") {
      sidebarIndex = Math.min(sidebarIndex + 1, sidebarItems.length - 1);
      toggleView(sidebarItems[sidebarIndex]);
    } else if (focusMode === "xtream_form") {
      formIndex = Math.min(formIndex + 1, 3); // 3 حقول + زر
    }
  }

  if (e.key === "ArrowUp") {
    if (focusMode === "sidebar") {
      sidebarIndex = Math.max(0, sidebarIndex - 1);
      toggleView(sidebarItems[sidebarIndex]);
    } else if (focusMode === "xtream_form") {
      formIndex = Math.max(0, formIndex - 1);
    }
  }

  if (e.key === "Enter") {
    if (focusMode === "xtream_form" && formIndex === 3) { // الزر
      connectXtream();
    }
  }

  updateFocus();
});

// عند بدء التطبيق
window.onload = () => {
  renderSidebar();
  renderCategories();
  renderChannels();
  toggleView(sidebarItems[sidebarIndex]); // عرض القسم الافتراضي
};
