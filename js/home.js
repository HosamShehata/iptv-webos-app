// مصفوفة النصوص للتبديل الكامل بين اللغتين
const TRANSLATIONS = {
    "ar": {
        "date_loading": "جاري تحميل التاريخ...",
        "banner_title": "أكمل المشاهدة",
        "banner_sub": "اضغط للاستمرار من حيث توقفت في العرض الأخير",
        "btn_resume": "▶ أكمل الآن",
        "live": "📺 البث المباشر",
        "series": "🎬 المسلسلات",
        "movies": "🎥 الأفلام",
        "favs": "⭐ المفضلة",
        "continue": "⏱️ متابعة المشاهدة",
        "search": "🔍 البحث المتقدم",
        "settings": "⚙️ الإعدادات",
        "lang_btn": "English"
    },
    "en": {
        "date_loading": "Loading date...",
        "banner_title": "Continue Watching",
        "banner_sub": "Press to resume where you left off last time",
        "btn_resume": "▶ Play Now",
        "live": "📺 Live TV",
        "series": "🎬 Series",
        "movies": "🎥 Movies",
        "favs": "⭐ Favorites",
        "continue": "⏱️ Continue Watching",
        "search": "🔍 Advanced Search",
        "settings": "⚙️ Settings",
        "lang_btn": "العربية"
    }
};

let currentLang = "ar"; // اللغة البدائية للتطبيق

function toggleLanguage() {
    currentLang = currentLang === "ar" ? "en" : "ar";
    const data = TRANSLATIONS[currentLang];
    
    // 1. تغيير كلاس الاتجاه في كامل الشاشة
    if (currentLang === "ar") {
        document.body.classList.remove("ltr-dir");
        document.body.classList.add("rtl-dir");
    } else {
        document.body.classList.remove("rtl-dir");
        document.body.classList.add("ltr-dir");
    }
    
    // 2. تحديث نصوص الواجهة بالكامل فوراً
    document.getElementById("lang-btn").innerText = data.lang_btn;
    document.getElementById("banner-title").innerText = data.banner_title;
    document.getElementById("banner-sub").innerText = data.banner_sub;
    document.getElementById("btn-resume").innerText = data.btn_resume;
    
    // تحديث أسماء أزرار القائمة الرئيسية
    document.getElementById("tile-livetv").innerHTML = `<span class="icon">📺</span> ` + (currentLang === "ar" ? "البث المباشر" : "Live TV");
    document.getElementById("tile-series").innerHTML = `<span class="icon">🎬</span> ` + (currentLang === "ar" ? "المسلسلات" : "Series");
    document.getElementById("tile-movies").innerHTML = `<span class="icon">🎥</span> ` + (currentLang === "ar" ? "الأفلام" : "Movies");
    document.getElementById("tile-favs").innerHTML = `<span class="icon">⭐</span> ` + (currentLang === "ar" ? "المفضلة" : "Favorites");
    document.getElementById("tile-continue").innerHTML = `<span class="icon">⏱️</span> ` + (currentLang === "ar" ? "متابعة المشاهدة" : "Continue Watching");
    document.getElementById("tile-search").innerHTML = `<span class="icon">🔍</span> ` + (currentLang === "ar" ? "البحث المتقدم" : "Advanced Search");
    document.getElementById("tile-settings").innerHTML = `<span class="icon">⚙️</span> ` + (currentLang === "ar" ? "الإعدادات" : "Settings");

    // إعادة تشغيل دالة التاريخ لتأخذ تنسيق اللغة الجديد
    updateClockAndDate();
}

// تعديل بسيط داخل دالة الوقت الأصلية لتدعم اللغة المفتوحة
// استبدل السطر الخاص بالتاريخ داخل دالة updateClockAndDate في ملفك بهذا السطر:
const localeStr = currentLang === "ar" ? "ar-EG" : "en-US";
document.getElementById('current-date').innerText = now.toLocaleDateString(localeStr, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
