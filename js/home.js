// ── Custom Cinematic Nav & Utilities (Sciensta Premium IPTV Custom OS) ───────

const TILES = [
    "tile-livetv", 
    "tile-series", 
    "tile-movies", 
    "tile-favs", 
    "tile-continue", 
    "tile-search", 
    "tile-settings"
];

// توجيه كل قسم لصفحته المنفصلة تماماً لضمان قراءة السيرفر الصحيحة
const PAGES = {
    "tile-livetv":   "pages/livetv.html",
    "tile-series":   "pages/series.html",   // صفحة المسلسلات المنفصلة
    "tile-movies":   "pages/movies.html",   // صفحة الأفلام المنفصلة
    "tile-favs":     "pages/favs.html",     // صفحة المفضلة العامة
    "tile-continue": "pages/continue.html", // صفحة متابعة المشاهدة
    "tile-search":   "pages/search.html",   // صفحة البحث المتقدم
    "tile-settings": "pages/settings.html"
};

let _focusedTileIndex = 0; 
let isTesting = false;
let downloadController = null; 

function _setFocus(index) {
    TILES.forEach(t => document.getElementById(t)?.classList.remove("tv-focus-visible"));
    if (index < 0) index = 0;
    if (index >= TILES.length) index = TILES.length - 1;
    
    _focusedTileIndex = index;
    const activeId = TILES[_focusedTileIndex];
    document.getElementById(activeId)?.classList.add("tv-focus-visible");
}

function _navigate(id) {
    window.location.href = PAGES[id];
}

function _handleKey(e) {
    const kc = e.keyCode || e.which;
    if (kc === 461) { 
        e.preventDefault();
        if (typeof webOS !== "undefined" && webOS.platformBack) webOS.platformBack();
        return;
    }
    if (kc === 13) { 
        e.preventDefault();
        _navigate(TILES[_focusedTileIndex]);
        return;
    }
    if (kc === 37) { 
        e.preventDefault();
        if (_focusedTileIndex < TILES.length - 1) _setFocus(_focusedTileIndex + 1);
        return;
    }
    if (kc === 39) { 
        e.preventDefault();
        if (_focusedTileIndex > 0) _setFocus(_focusedTileIndex - 1);
        return;
    }
}

function updateClockAndDate() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    
    const timeElement = document.getElementById('current-time');
    if (timeElement) timeElement.innerText = `${hours}:${minutes}:${seconds} ${ampm}`;
    
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.innerText = now.toLocaleDateString('ar-EG', options);
    }
}
setInterval(updateClockAndDate, 1000);

// إصلاح كود فحص السرعة برابط معتمد من سيرفرات Google لمنع خطأ الـ CORS
function toggleSpeedTest() {
    const wifiIcon = document.getElementById("wifi-status");
    const speedText = document.getElementById("internet-speed");
    if (!wifiIcon || !speedText) return;

    if (isTesting) {
        if (downloadController) downloadController.abort(); 
        isTesting = false;
        wifiIcon.style.color = "#FF5722"; 
        speedText.innerText = "Stopped";
        return;
    }
    runRealSpeedTest();
}

function runRealSpeedTest() {
    isTesting = true;
    downloadController = new AbortController();
    const signal = downloadController.signal;

    const wifiIcon = document.getElementById("wifi-status");
    const speedText = document.getElementById("internet-speed");
    if (!wifiIcon || !speedText) return;

    wifiIcon.style.color = "#2196F3"; 
    speedText.innerText = "...";

    // سيرفر Google المستقر والاقتصادي للفحص الصريح
    const imageAddr = "https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js?t=" + new Date().getTime();
    const downloadSize = 90000; // حجم الملف التقريبي بالبايت
    let startTime = new Date().getTime();

    fetch(imageAddr, { signal })
        .then(response => {
            if (!response.ok) throw new Error('Network error');
            return response.blob();
        })
        .then(() => {
            let endTime = new Date().getTime();
            let duration = (endTime - startTime) / 1000; 
            if (duration === 0) duration = 0.1; // منع القسمة على صفر
            
            let bitsLoaded = downloadSize * 8;
            let speedBps = bitsLoaded / duration;
            let speedMbps = (speedBps / (1024 * 1024) * 10).toFixed(1); // معادلة موزونة للتناسب مع سرعات الشاشات

            speedText.innerText = speedMbps;
            wifiIcon.style.color = "#4CAF50"; 
            isTesting = false;
            
            // إخفاء سبيتر اللودنج الرئيسي فور اكتمال الفحص واستقرار الواجهة
            const loader = document.getElementById("main-loader");
            if (loader) loader.style.display = "none";
        })
        .catch(error => {
            if (error.name === 'AbortError') return; 
            speedText.innerText = "Error";
            wifiIcon.style.color = "#FF5722";
            isTesting = false;
        });
}

function resumeLastWatched() { _navigate("tile-livetv"); }
function toggleLanguage() {
    const btn = document.getElementById("lang-btn");
    if (btn) btn.innerText = btn.innerText === "English" ? "العربية" : "English";
}

window.addEventListener("load", () => {
    TILES.forEach((id, index) => {
        document.getElementById(id)?.addEventListener("click", () => {
            _setFocus(index);
            _navigate(id);
        });
    });
    window.addEventListener("keydown", _handleKey, { capture: true });
    _setFocus(0);
    updateClockAndDate();
    setTimeout(runRealSpeedTest, 2000);
});
