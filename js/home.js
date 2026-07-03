const TILES = ["tile-livetv", "tile-series", "tile-movies", "tile-favs", "tile-continue", "tile-search", "tile-settings"];
const PAGES = {
    "tile-livetv": "pages/livetv.html",
    "tile-series": "pages/series.html",
    "tile-movies": "pages/movies.html",
    "tile-favs": "pages/livetv.html",
    "tile-continue": "pages/movies.html",
    "tile-search": "pages/movies.html",
    "tile-settings": "pages/settings.html"
};

// تعريف ألوان الثيم لكل أيقونة
const NEON_COLORS = {
    "tile-livetv": "#7cb0e6", // أزرق
    "tile-series": "#8edcb8", // أخضر
    "tile-movies": "#f9ae8a", // برتقالي
    "tile-favs": "#f6da8a",   // أصفر
    "tile-continue": "#ffffff",
    "tile-search": "#ffffff",
    "tile-settings": "#ffffff"
};

function _setFocus(index) {
    TILES.forEach(t => {
        const el = document.getElementById(t);
        el?.classList.remove("tv-focus-visible");
        el?.style.removeProperty('--neon-color');
    });
    const id = TILES[index];
    const el = document.getElementById(id);
    el?.classList.add("tv-focus-visible");
    el?.style.setProperty('--neon-color', NEON_COLORS[id]);
}

function toggleLanguage() {
    currentLang = currentLang === "ar" ? "en" : "ar";
    document.body.dir = currentLang === "ar" ? "rtl" : "ltr";
    // إضافة كود تحديث النصوص هنا بناءً على كائن الترجمة
    updateClockAndDate();
}

function updateClockAndDate() {
    const now = new Date();
    document.getElementById('home-clock').innerText = now.toLocaleTimeString();
    document.getElementById('home-date').innerText = now.toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US');
}

window.addEventListener("load", () => {
    setInterval(updateClockAndDate, 1000);
    _setFocus(0);
});
