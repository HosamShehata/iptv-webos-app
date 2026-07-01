// ============================================
// VISION TV - MAIN APPLICATION CONTROLLER
// ============================================

let currentView = "home";
let currentLanguage = localStorage.getItem("app_lang") || "ar";

const LANG = {
    ar: {
        home: "الرئيسية", live: "البث المباشر", movies: "الأفلام", series: "المسلسلات",
        favorites: "المفضلة", history: "أكمل المشاهدة", playlist: "إضافة اشتراك",
        search: "البحث", settings: "الإعدادات", playlist_title: "بيانات اشتراك Xtream"
    },
    en: {
        home: "Home", live: "Live TV", movies: "Movies", series: "Series",
        favorites: "Favorites", history: "Continue Watching", playlist: "Playlist",
        search: "Search", settings: "Settings", playlist_title: "Xtream Playlist"
    }
};

// التوجيه الصحيح للصفحات وحل مشكلة عدم التفاعل
const viewsMap = {
    home: "view-home",
    live: "view-live",
    movies: "view-movies",
    series: "view-series",
    favorites: "view-favorites",
    history: "view-history",
    playlist: "view-iptv",
    search: "view-search",
    settings: "view-settings",
    details: "view-details"
};

function openView(name) {
    currentView = name;

    // إخفاء كل البانلز
    document.querySelectorAll(".view-panel").forEach(p => p.classList.remove("active"));
    
    // إظهار العنصر المطلوب بناء على الخريطة الصحيحة المحدثة
    const targetPanel = document.getElementById(viewsMap[name]);
    if (targetPanel) targetPanel.classList.add("active");

    // تحديث الاستايل الخاص بالقائمة النشطة
    document.querySelectorAll(".menu-item").forEach(item => item.classList.remove("active"));
    const activeMenu = document.querySelector(`.menu-item[data-view="${name}"]`);
    if (activeMenu) activeMenu.classList.add("active");

    refreshCurrentView();
    
    // تحديث عناصر التحكم للريموت كارد فوراً بعد فتح صفحة جديدة
    if (window.updateFocusableElements) window.updateFocusableElements();
}

function sidebarClick(name) {
    openView(name);
}

function refreshCurrentView() {
    if (currentView === "home") renderHome();
    if (currentView === "live") renderGrid("live-grid", VisionAPI.getLive());
    if (currentView === "movies") renderGrid("movies-grid", VisionAPI.getMovies());
    if (currentView === "series") renderGrid("series-grid", VisionAPI.getSeries());
    if (currentView === "playlist") loadPlaylists();
}

function renderHome() {
    const combined = [...VisionAPI.getLive(), ...VisionAPI.getMovies()];
    renderGrid("home-main-grid", combined);
}

function renderGrid(containerId, list) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    if (!list || list.length === 0) {
        container.innerHTML = `<div class="empty-list" style="padding:40px; color:#666;">لا يوجد محتوى حالياً</div>`;
        return;
    }

    list.forEach(item => {
        const card = document.createElement("div");
        card.className = "media-card remote-focusable";
        card.innerHTML = `
            <img src="${item.image || 'https://placehold.co/400x600'}" onerror="this.src='https://placehold.co/400x600?text=TV'">
            <div class="media-info">
                <div class="media-title">${item.name}</div>
                <div class="media-subtitle">${item.type.toUpperCase()}</div>
            </div>
        `;
        card.onclick = () => openDetails(item);
        container.appendChild(card);
    });
}

function openDetails(item) {
    window.currentItem = item;
    openView("details");
    
    document.getElementById("detail-item-title").textContent = item.name;
    document.getElementById("detail-item-img").src = item.image;

    const actionZone = document.getElementById("movie-action-zone");
    const epZone = document.getElementById("series-episodes-vertical-zone");

    if (item.type === "series") {
        actionZone.innerHTML = "";
        epZone.style.display = "block";
        renderSeriesEpisodes(item);
    } else {
        epZone.style.display = "none";
        actionZone.innerHTML = `
            <button class="primary-btn remote-focusable" onclick="playMediaDirectly()">▶ تشغيل الآن</button>
        `;
    }
}

function renderSeriesEpisodes(series) {
    const container = document.getElementById("episodes-vertical-container");
    container.innerHTML = "";
    
    for (let i = 1; i <= 10; i++) {
        const ep = { id: `${series.id}_${i}`, name: `الحلقة ${i}`, url: series.url || "#", type: "episode" };
        const row = document.createElement("div");
        row.className = "menu-item remote-focusable";
        row.style.background = "#222";
        row.style.margin = "5px 0";
        row.style.padding = "15px";
        row.textContent = ep.name;
        row.onclick = () => {
            localStorage.setItem("current", JSON.stringify(ep));
            window.location.href = "player.html";
        };
        container.appendChild(row);
    }
}

function playMediaDirectly() {
    localStorage.setItem("current", JSON.stringify(window.currentItem));
    window.location.href = "player.html";
}

// إدارة الاشتراكات
async function savePlaylist() {
    const name = document.getElementById("server-name").value.trim();
    const user = document.getElementById("server-user").value.trim();
    const pass = document.getElementById("server-pass").value.trim();
    const url = document.getElementById("server-url").value.trim();
    const status = document.getElementById("pl_status");

    if (!VisionAPI.addPlaylist(name, user, pass, url)) {
        status.innerText = "اكمل البيانات المطلوبة!";
        status.style.color = "red";
        return;
    }

    status.innerText = "تم الحفظ بنجاح";
    status.style.color = "#00c851";
    
    VisionAPI.loadPlaylists();
    loadPlaylists();
    bootApp(); 
}

function loadPlaylists() {
    const container = document.getElementById("playlists-list");
    if(!container) return;
    container.innerHTML = "";
    const list = VisionAPI.getPlaylists();

    if (!list.length) {
        container.innerHTML = "<div style='color:#777;'>لا يوجد اشتراكات مضافة</div>";
        return;
    }

    list.forEach(server => {
        const row = document.createElement("div");
        row.style.padding = "15px"; row.style.background = "#151515"; row.style.marginBottom = "10px";
        row.style.display = "flex"; row.style.justifyContent = "space-between"; row.style.borderRadius = "8px";
        row.innerHTML = `
            <div><strong>${server.name}</strong><br><small style='color:#666;'>${server.url}</small></div>
            <button class="secondary-btn" style="height:35px; padding:0 15px;" onclick="deletePlaylist(${server.id})">حذف</button>
        `;
        container.appendChild(row);
    });
}

function deletePlaylist(id) {
    VisionAPI.deletePlaylist(id);
    loadPlaylists();
    refreshCurrentView();
}

function searchInputChanged(input) {
    VisionAPI.search(input.value);
    if(input.value.trim() !== "") {
        openView("search");
        renderGrid("search-grid", [...VisionAPI.getLive(), ...VisionAPI.getMovies(), ...VisionAPI.getSeries()]);
    } else {
        openView("home");
    }
}

function applyTheme(theme) {
    document.documentElement.className = theme;
    localStorage.setItem("selected-theme", theme);
}

function toggleLanguage() {
    currentLanguage = currentLanguage === "ar" ? "en" : "ar";
    localStorage.setItem("app_lang", currentLanguage);
    document.getElementById("languageText").innerText = currentLanguage === "ar" ? "العربية" : "English";
}

function updateClock() {
    const now = new Date();
    const t = document.getElementById("top-current-time");
    const d = document.getElementById("top-current-date");
    if (t) t.textContent = now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    if (d) d.textContent = now.toLocaleDateString("ar-EG");
}

async function bootApp() {
    VisionAPI.loadPlaylists();
    const playlists = VisionAPI.getPlaylists();
    if (playlists.length > 0) {
        await VisionAPI.loadXtream(playlists[0]);
    } else {
        VisionAPI.generateDemo(currentLanguage);
    }
    openView("home");
}

window.onload = () => {
    bootApp();
    setInterval(updateClock, 1000);
    applyTheme(localStorage.getItem("selected-theme") || "theme-netflix");
};
