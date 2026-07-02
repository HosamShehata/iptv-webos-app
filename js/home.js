// ── Custom Cinematic Nav & Utilities (Sciensta Premium IPTV Custom OS) ───────

// الأزرار الجديدة المتاحة للتنقل بالترتيب الأفقي من اليمين إلى اليسار
const TILES = [
    "tile-livetv", 
    "tile-series", 
    "tile-movies", 
    "tile-favs", 
    "tile-continue", 
    "tile-search", 
    "tile-settings"
];

// الصفحات المرتبطة بكل زر عند الضغط عليه (ENTER)
const PAGES = {
    "tile-livetv":   "pages/livetv.html",
    "tile-series":   "pages/vod.html", // يوجه لقسم المسلسلات
    "tile-movies":   "pages/vod.html", // يوجه لقسم الأفلام
    "tile-favs":     "pages/livetv.html", // يوجه للمفضلة
    "tile-continue": "pages/vod.html",
    "tile-search":   "pages/vod.html",
    "tile-settings": "pages/settings.html"
};

let _focusedTileIndex = 0; // نبرمج مؤشر التركيز البدائي على البث المباشر
let isTesting = false;
let downloadController = null; 

function _setFocus(index) {
    // إزالة الفوكس من جميع العناصر
    TILES.forEach(t => document.getElementById(t)?.classList.remove("tv-focus-visible"));
    
    // التأكد من أن المؤشر لا يخرج عن حدود المصفوفة
    if (index < 0) index = 0;
    if (index >= TILES.length) index = TILES.length - 1;
    
    _focusedTileIndex = index;
    const activeId = TILES[_focusedTileIndex];
    document.getElementById(activeId)?.classList.add("tv-focus-visible");
}

function _navigate(id) {
    window.location.href = PAGES[id];
}

// ==========================================
// 1. إدارة حركة أزرار الريموت (D-Pad) للثيم الأفقي
// ==========================================
function _handleKey(e) {
    const kc = e.keyCode || e.which;

    if (kc === 461) { // Back (webOS) - الخروج من التطبيق من القائمة الرئيسية
        e.preventDefault();
        if (typeof webOS !== "undefined" && webOS.platformBack) webOS.platformBack();
        return;
    }
    if (kc === 13) { // ENTER
        e.preventDefault();
        _navigate(TILES[_focusedTileIndex]);
        return;
    }
    if (kc === 37) { // LEFT (الانتقال للزر التالي يساراً)
        e.preventDefault();
        if (_focusedTileIndex < TILES.length - 1) {
            _setFocus(_focusedTileIndex + 1);
        }
        return;
    }
    if (kc === 39) { // RIGHT (الانتقال للزر السابق يميناً)
        e.preventDefault();
        if (_focusedTileIndex > 0) {
            _setFocus(_focusedTileIndex - 1);
        }
        return;
    }
}

// ==========================================
// 2. كود تشغيل الساعة والتاريخ الحقيقيين
// ==========================================
function updateClockAndDate() {
    const now = new Date();
    
    // تشغيل الساعة بنظام 12 ساعة رقمي عصري
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.innerText = `${hours}:${minutes}:${seconds} ${ampm}`;
    }
    
    // تشغيل التاريخ العربي التلقائي بالكامل
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.innerText = now.toLocaleDateString('ar-EG', options);
    }
}
setInterval(updateClockAndDate, 1000);

// ==========================================
// 3. كود سحب سرعة الإنترنت الذكي (إيقاف وتشغيل فوري بضغطة واحدة)
// ==========================================
function toggleSpeedTest() {
    const wifiIcon = document.getElementById("wifi-status");
    const speedText = document.getElementById("internet-speed");

    if (!wifiIcon || !speedText) return;

    if (isTesting) {
        if (downloadController) {
            downloadController.abort(); 
        }
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

    const imageAddr = "https://upload.wikimedia.org/wikipedia/commons/2/2d/Snake_River_%28just_after_grand_teton_national_park%29_educational_use_only.jpg?t=" + new Date().getTime();
    const downloadSize = 5242880; 
    let startTime = new Date().getTime();

    fetch(imageAddr, { signal })
        .then(response => {
            if (!response.ok) throw new Error('Network error');
            return response.blob();
        })
        .then(() => {
            let endTime = new Date().getTime();
            let duration = (endTime - startTime) / 1000; 
            
            let bitsLoaded = downloadSize * 8;
            let speedBps = bitsLoaded / duration;
            let speedMbps = (speedBps / (1024 * 1024)).toFixed(1);

            speedText.innerText = speedMbps;
            wifiIcon.style.color = "#4CAF50"; 
            isTesting = false;
        })
        .catch(error => {
            if (error.name === 'AbortError') return; 
            speedText.innerText = "Error";
            wifiIcon.style.color = "#FF5722";
            isTesting = false;
        });
}

// دالة وهمية مبدئية لاستكمال مشاهدة آخر مادة
function resumeLastWatched() {
    console.log("استئناف مشاهدة العرض الأخير...");
    _navigate("tile-livetv");
}

// دالة تبديل اللغة السريعة المبدئية
function toggleLanguage() {
    const btn = document.getElementById("lang-btn");
    if (btn) {
        btn.innerText = btn.innerText === "English" ? "العربية" : "English";
    }
}

// ==========================================
// 4. تهيئة تشغيل الصفحة
// ==========================================
window.addEventListener("load", () => {
    // تفعيل الضغط بالماوس (Magic Remote Click) لجميع الأزرار
    TILES.forEach((id, index) => {
        document.getElementById(id)?.addEventListener("click", () => {
            _setFocus(index);
            _navigate(id);
        });
    });

    // الاستماع لريموت التحكم D-pad
    window.addEventListener("keydown", _handleKey, { capture: true });

    // تشغيل الفوكس البدائي على البث المباشر
    _setFocus(0);

    // تشغيل الساعة فوراً
    updateClockAndDate();

    // تشغيل فحص السرعة التلقائي لمرة واحدة بعد ثانيتين من الفتح
    setTimeout(runRealSpeedTest, 2000);

    // إخطار نظام شاشة LG بإخفاء شاشة التحميل البيضاء (Splash Screen)
    if (typeof webOSSystem !== "undefined" && typeof webOSSystem.notifyAppLoaded === "function") {
        webOSSystem.notifyAppLoaded();
    }
});
