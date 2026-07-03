// home.js - الربط النهائي للأقسام
const TILES = ["tile-livetv", "tile-series", "tile-movies", "tile-favs", "tile-continue", "tile-search", "tile-settings"];

// ربط الأزرار بالصفحات الجديدة تماماً
const PAGES = {
    "tile-livetv": "pages/livetv.html",
    "tile-series": "pages/series.html", // رابط صفحة المسلسلات المستقلة
    "tile-movies": "pages/movies.html", // رابط صفحة الأفلام المستقلة
    "tile-favs": "pages/favs.html",
    "tile-continue": "pages/continue.html",
    "tile-search": "pages/search.html",
    "tile-settings": "pages/settings.html"
};

// ... (بقية كود الساعة واللغة كما اتفقنا عليه) ...

function _navigate(id) { 
    if (PAGES[id]) {
        window.location.href = PAGES[id]; 
    }
}

// تحديث الساعة في منتصف الهيدر والتاريخ في الجانب (حسب التصميم)
function updateClockAndDate() {
    const now = new Date();
    // الساعة في المنتصف
    document.getElementById('home-clock').innerText = now.toLocaleTimeString();
    // اليوم والتاريخ في الجانب
    document.getElementById('home-date').innerText = now.toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US', { 
        weekday: 'long', day: 'numeric', month: 'long' 
    });
}
