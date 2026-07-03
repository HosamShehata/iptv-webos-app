// مصفوفة التنقل المحدثة بأسماء الأقسام الأصلية لعدم تعطيل النظام
const TILES = ["tile-livetv", "tile-series", "tile-movies", "tile-favs", "tile-continue", "tile-search", "tile-settings"];
const PAGES = {
    "tile-livetv": "pages/livetv.html",
    "tile-series": "pages/vod.html",
    "tile-movies": "pages/vod.html",
    "tile-favs": "pages/livetv.html",
    "tile-continue": "pages/vod.html",
    "tile-search": "pages/vod.html",
    "tile-settings": "pages/settings.html"
};

const TRANSLATIONS = {
    "ar": {
        "brand": "Sciensta <span>IPTV</span>", "title": "أكمل المشاهدة", "sub": "فيلم جبال الصمت", "btn": "▶ اكمل الآن", "lang": "English",
        "live": "البث المباشر", "series": "المسلسلات", "movies": "الأفلام", "favs": "المفضلة", "continue": "متابعة المشاهدة", "search": "البحث المتقدم", "settings": "الإعدادات"
    },
    "en": {
        "brand": "Sciensta <span>IPTV</span>", "title": "Continue Watching", "sub": "Silent Mountains Movie", "btn": "▶ Play Now", "lang": "العربية",
        "live": "Live TV", "series": "Series", "movies": "Movies", "favs": "Favorites", "continue": "Continue Watching", "search": "Advanced Search", "settings": "Settings"
    }
};

let _focusedTileIndex = 0;
let currentLang = "ar";
let isTesting = false;

function _setFocus(index) {
    TILES.forEach(t => document.getElementById(t)?.classList.remove("tv-focus-visible"));
    if (index < 0) index = 0;
    if (index >= TILES.length) index = TILES.length - 1;
    _focusedTileIndex = index;
    document.getElementById(TILES[_focusedTileIndex])?.classList.add("tv-focus-visible");
}

function _navigate(id) { window.location.href = PAGES[id]; }

function _handleKey(e) {
    const kc = e.keyCode || e.which;
    if (kc === 13) { e.preventDefault(); _navigate(TILES[_focusedTileIndex]); return; }
    if (kc === 37) { e.preventDefault(); if (_focusedTileIndex < TILES.length - 1) _setFocus(_focusedTileIndex + 1); return; } // LEFT
    if (kc === 39) { e.preventDefault(); if (_focusedTileIndex > 0) _setFocus(_focusedTileIndex - 1); return; } // RIGHT
}

// تشغيل الساعة والتاريخ الحقيقيين وإصلاح التوقف
function updateClockAndDate() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    
    const clockEl = document.getElementById('home-clock');
    if (clockEl) clockEl.innerText = `${hours}:${minutes}:${seconds} ${ampm}`;
    
    const dateEl = document.getElementById('home-date');
    if (dateEl) {
        const locale = currentLang === "ar" ? "ar-EG" : "en-US";
        dateEl.innerText = now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    }
}

// التبديل الفوري والكامل للغة مع الاتجاه
function toggleLanguage() {
    currentLang = currentLang === "ar" ? "en" : "ar";
    const data = TRANSLATIONS[currentLang];
    
    document.body.className = currentLang === "ar" ? "rtl-dir" : "ltr-dir";
    document.getElementById("lang-btn").innerText = data.lang;
    document.getElementById("home-brand").innerHTML = data.brand;
    document.getElementById("banner-title").innerText = data.title;
    document.getElementById("banner-sub").innerText = data.sub;
    document.querySelector(".play-btn").innerText = data.btn;
    
    document.querySelector("#tile-livetv .home-tile-label").innerText = data.live;
    document.querySelector("#tile-series .home-tile-label").innerText = data.series;
    document.querySelector("#tile-movies .home-tile-label").innerText = data.movies;
    document.querySelector("#tile-favs .home-tile-label").innerText = data.favs;
    document.querySelector("#tile-continue .home-tile-label").innerText = data.continue;
    document.querySelector("#tile-search .home-tile-label").innerText = data.search;
    document.querySelector("#tile-settings .home-tile-label").innerText = data.settings;
    
    updateClockAndDate();
}

// فحص السرعة الفعلي لمرة واحدة دون تعطيل البث
function runRealSpeedTest() {
    if (isTesting) return;
    isTesting = true;
    const wifiIcon = document.getElementById("wifi-status");
    const speedText = document.getElementById("internet-speed");
    if (!wifiIcon || !speedText) return;

    wifiIcon.style.color = "#2196F3";
    speedText.innerText = "...";

    const img = new Image();
    const startTime = new Date().getTime();
    img.src = "https://upload.wikimedia.org/wikipedia/commons/2/2d/Snake_River_%28just_after_grand_teton_national_park%29_educational_use_only.jpg?t=" + startTime;
    
    img.onload = function () {
        const duration = (new Date().getTime() - startTime) / 1000;
        const speedMbps = ((5242880 * 8) / duration / (1024 * 1024)).toFixed(1);
        speedText.innerText = speedMbps;
        wifiIcon.style.color = "#4CAF50";
        isTesting = false;
    };
    img.onerror = function () { speedText.innerText = "Error"; wifiIcon.style.color = "#FF5722"; isTesting = false; };
}

function toggleSpeedTest() { if (!isTesting) runRealSpeedTest(); }
function resumeLastWatched() { _navigate("tile-livetv"); }

window.addEventListener("load", () => {
    document.body.className = "rtl-dir";
    TILES.forEach((id, idx) => {
        const el = document.getElementById(id);
        el?.addEventListener("click", () => { _setFocus(idx); _navigate(id); });
        el?.addEventListener("mouseenter", () => _setFocus(idx)); // تفعيل حركة الماوس فوراً
    });
    window.addEventListener("keydown", _handleKey, { capture: true });
    _setFocus(0);
    setInterval(updateClockAndDate, 1000);
    updateClockAndDate();
    setTimeout(runRealSpeedTest, 2000);
    if (typeof webOSSystem !== "undefined" && webOSSystem.notifyAppLoaded) webOSSystem.notifyAppLoaded();
});
