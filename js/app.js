// =====================================================
// VISION TV - APP UI CONTROLLER (متحكم الواجهة والربط)
// =====================================================

let currentView = "home";

// خريطة الربط بين الأزرار والـ Sections في الـ HTML
const viewPanels = {
    home: "view-home",
    live: "view-live",
    movies: "view-movies",
    series: "view-series",
    playlist: "view-playlist",
    settings: "view-settings"
};

// التبديل بين الصفحات بشكل سليم
function openView(viewName) {
    if (!viewPanels[viewName]) return;
    currentView = viewName;

    // إخفاء كل الصفحات
    document.querySelectorAll(".view-panel").forEach(panel => panel.classList.remove("active"));
    
    // إظهار الصفحة المستهدفة
    const activePanel = document.getElementById(viewPanels[viewName]);
    if (activePanel) activePanel.classList.add("active");

    // تحديث أزرار المنيو الجانبي
    document.querySelectorAll(".menu-item").forEach(item => item.classList.remove("active"));
    const activeMenu = document.querySelector(`.menu-item[data-view="${viewName}"]`);
    if (activeMenu) activeMenu.classList.add("active");

    // تحديث المحتويات داخل الصفحة المفتوحة فوراً
    renderViewData();

    // تحديث عناصر التحكم للريموت
    if (window.updateFocusableElements) window.updateFocusableElements();
}

function sidebarClick(viewName) {
    openView(viewName);
}

// عرض البيانات بناءً على الصفحة النشطة
function renderViewData() {
    if (currentView === "home") {
        renderGrid("homeGrid", [...VisionAPI.state.live, ...VisionAPI.state.movies]);
    } else if (currentView === "live") {
        renderGrid("liveGrid", VisionAPI.state.live);
    } else if (currentView === "movies") {
        renderGrid("moviesGrid", VisionAPI.state.movies);
    } else if (currentView === "series") {
        renderGrid("seriesGrid", VisionAPI.state.series);
    } else if (currentView === "playlist") {
        uiRenderPlaylistsLists(); // تحديث قائمة السيرفرات المضافة فوراً
    }
}

function renderGrid(targetId, items) {
    const grid = document.getElementById(targetId);
    if (!grid) return;
    grid.innerHTML = "";

    if (!items || items.length === 0) {
        grid.innerHTML = `<div class="empty-msg" style="padding:20px; color:#666;">لا يوجد محتوى، أضف اشتراكاً أولاً.</div>`;
        return;
    }

    items.forEach(item => {
        const card = document.createElement("div");
        card.className = "media-card remote-focusable";
        card.innerHTML = `
            <img src="${item.stream_icon || 'https://placehold.co/400x600?text=No+Image'}" onerror="this.src='https://placehold.co/400x600?text=VISION+TV'">
            <div class="media-info">
                <div class="media-title">${item.name}</div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// حل مشكلة البلاي ليست: دالة المعالجة المباشرة والربط الفوري مع الواجهة
async function handleSavePlaylist() {
    const name = document.getElementById("playlistName").value.trim();
    const user = document.getElementById("playlistUser").value.trim();
    const pass = document.getElementById("playlistPassword").value.trim();
    const host = document.getElementById("playlistHost").value.trim();
    const statusDiv = document.getElementById("playlistStatus");

    if (!name || !user || !pass || !host) {
        statusDiv.innerText = "برجاء ملء جميع الحقول المطلوبة!";
        statusDiv.style.color = "#ff4444";
        return;
    }

    statusDiv.innerText = "جاري الحفظ والاتصال بالسيرفر...";
    statusDiv.style.color = "#ffbb33";

    // 1. الحفظ في الـ LocalStorage عبر الـ API
    const isSaved = VisionAPI.savePlaylist(name, user, pass, host);

    if (isSaved) {
        statusDiv.innerText = "تم حفظ الاشتراك بنجاح! جاري تحميل القنوات...";
        statusDiv.style.color = "#00c851";

        // إفراغ خانات الإدخال تلقائياً بعد النجاح
        document.getElementById("playlistName").value = "";
        document.getElementById("playlistUser").value = "";
        document.getElementById("playlistPassword").value = "";
        document.getElementById("playlistHost").value = "";

        // 2. تحديث قائمة الاشتراكات المعروضة في نفس اللحظة (تسميع فوري)
        uiRenderPlaylistsLists();

        // 3. جلب قنوات أول سيرفر متاح وتحديث الشاشة الرئيسية
        const playlists = VisionAPI.loadPlaylists();
        if(playlists.length > 0) {
            await VisionAPI.fetchXtreamData(playlists[playlists.length - 1]);
            renderViewData();
        }
    } else {
        statusDiv.innerText = "حدث خطأ أثناء الحفظ.";
        statusDiv.style.color = "#ff4444";
    }
}

// دالة رسم وعرض الاشتراكات المخزنة في الواجهة فوراً
function uiRenderPlaylistsLists() {
    const container = document.getElementById("playlistContainerList");
    if (!container) return;
    container.innerHTML = "";

    const list = VisionAPI.loadPlaylists();

    if (list.length === 0) {
        container.innerHTML = `<div style="color:#777;">لا توجد اشتراكات مضافة حالياً.</div>`;
        return;
    }

    list.forEach(server => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#161616; padding:15px; margin-bottom:10px; border-radius:10px; border:1px solid var(--border);";
        row.innerHTML = `
            <div>
                <strong style="color:var(--text); font-size:18px;">${server.name}</strong><br>
                <small style="color:#777;">${server.url}</small>
            </div>
            <button class="secondary-btn remote-focusable" style="height:40px; padding:0 15px; background:#cc0000; border:none;" onclick="handleDeletePlaylist(${server.id})">حذف</button>
        `;
        container.appendChild(row);
    });

    if (window.updateFocusableElements) window.updateFocusableElements();
}

function handleDeletePlaylist(id) {
    VisionAPI.deletePlaylist(id);
    uiRenderPlaylistsLists(); // إعادة الرسم بعد الحذف فوراً لـ "تسمع" في الواجهة
    renderViewData();
}

function handleSearch(query) {
    console.log("البحث عن:", query);
    // يمكن هنا فلترة المصفوفات الأساسية وإعادة إرسالها لـ renderGrid
}

function applyTheme(theme) {
    document.documentElement.className = theme;
    localStorage.setItem("vision_theme", theme);
}

function updateClock() {
    const clock = document.getElementById("clockTime");
    if (clock) {
        const now = new Date();
        clock.textContent = now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    }
}

// تشغيل وتهيئة التطبيق بالكامل بالترتيب الصحيح لمنع أي انهيار للـ Process
async function initApp() {
    updateClock();
    setInterval(updateClock, 10000); // تحديث كل 10 ثوانٍ بدلاً من ثانية واحدة لمنع ميموري ليك
    applyTheme(localStorage.getItem("vision_theme") || "theme-netflix");

    const savedPlaylists = VisionAPI.loadPlaylists();
    if (savedPlaylists.length > 0) {
        await VisionAPI.fetchXtreamData(savedPlaylists[0]);
    } else {
        VisionAPI.loadDemoData();
    }

    openView("home");
}

window.onload = initApp;
