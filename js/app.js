// =====================================================
// VISION TV - APP UI CONTROLLER (ربط البيانات وتحديث الشاشة)
// =====================================================

let currentView = "home";

const viewPanels = {
    home: "view-home",
    live: "view-live",
    movies: "view-movies",
    series: "view-series",
    playlist: "view-playlist",
    settings: "view-settings"
};

function openView(viewName) {
    if (!viewPanels[viewName]) return;
    currentView = viewName;

    document.querySelectorAll(".view-panel").forEach(panel => panel.classList.remove("active"));
    const activePanel = document.getElementById(viewPanels[viewName]);
    if (activePanel) activePanel.classList.add("active");

    document.querySelectorAll(".menu-item").forEach(item => item.classList.remove("active"));
    const activeMenu = document.querySelector(`.menu-item[data-view="${viewName}"]`);
    if (activeMenu) activeMenu.classList.add("active");

    renderViewData();

    if (window.updateFocusableElements) window.updateFocusableElements();
}

function sidebarClick(viewName) {
    openView(viewName);
}

function renderViewData() {
    if (currentView === "home") {
        renderGrid("homeGrid", [...VisionAPI.state.live.slice(0, 10), ...VisionAPI.state.movies.slice(0, 10)]);
    } else if (currentView === "live") {
        renderGrid("liveGrid", VisionAPI.state.live);
    } else if (currentView === "movies") {
        renderGrid("moviesGrid", VisionAPI.state.movies);
    } else if (currentView === "series") {
        renderGrid("seriesGrid", VisionAPI.state.series);
    } else if (currentView === "playlist") {
        uiRenderPlaylistsLists();
    }
}

function renderGrid(targetId, items) {
    const grid = document.getElementById(targetId);
    if (!grid) return;
    grid.innerHTML = "";

    if (!items || items.length === 0) {
        grid.innerHTML = `<div class="empty-msg" style="padding:40px; color:#666; font-size:18px;">جاري سحب قنوات سيرفر Hydra أو السيرفر فارغ...</div>`;
        return;
    }

    items.forEach(item => {
        const card = document.createElement("div");
        card.className = "media-card remote-focusable";
        card.innerHTML = `
            <img src="${item.stream_icon || 'https://placehold.co/400x600?text=No+Image'}" onerror="this.src='https://placehold.co/400x600?text=${encodeURIComponent(item.name)}'">
            <div class="media-info">
                <div class="media-title">${item.name}</div>
            </div>
        `;
        // إرسال البيانات للمشغل عند الضغط على الكارت
        card.onclick = () => {
            if (item.url) {
                localStorage.setItem("current", JSON.stringify(item));
                window.location.href = "player.html";
            }
        };
        grid.appendChild(card);
    });
}

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

    statusDiv.innerText = "جاري الحفظ والاتصال بالخادم الجديد...";
    statusDiv.style.color = "#ffbb33";

    const isSaved = VisionAPI.savePlaylist(name, user, pass, host);

    if (isSaved) {
        uiRenderPlaylistsLists();
        const playlists = VisionAPI.loadPlaylists();
        const successFetch = await VisionAPI.fetchXtreamData(playlists[playlists.length - 1]);

        if (successFetch) {
            statusDiv.innerText = "تم حفظ السيرفر بنجاح وتحميل القنوات!";
            statusDiv.style.color = "#00c851";
            renderViewData();
        } else {
            statusDiv.innerText = "تم حفظ السيرفر، وتعمل الواجهة الآن بالوضع التجريبي المستقر للـ WebOS.";
            statusDiv.style.color = "#ffbb33";
        }
    }
}

function uiRenderPlaylistsLists() {
    const container = document.getElementById("playlistContainerList");
    if (!container) return;
    container.innerHTML = "";

    const list = VisionAPI.loadPlaylists();

    list.forEach(server => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#161616; padding:15px; margin-bottom:10px; border-radius:10px; border:1px solid var(--border);";
        row.innerHTML = `
            <div>
                <strong style="color:var(--text); font-size:18px;">${server.name}</strong><br>
                <small style="color:#777;">${server.url} (User: ${server.user})</small>
            </div>
            <button class="secondary-btn remote-focusable" style="height:40px; padding:0 15px; background:#cc0000; border:none;" onclick="handleDeletePlaylist(${server.id})">حذف</button>
        `;
        container.appendChild(row);
    });

    if (window.updateFocusableElements) window.updateFocusableElements();
}

function handleDeletePlaylist(id) {
    VisionAPI.deletePlaylist(id);
    uiRenderPlaylistsLists();
    renderViewData();
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

// تشغيل النظام وجلب قنوات Hydra بشكل فوري بمجرد التشغيل
async function initApp() {
    updateClock();
    setInterval(updateClock, 10000);
    applyTheme(localStorage.getItem("vision_theme") || "theme-netflix");

    const savedPlaylists = VisionAPI.loadPlaylists();
    
    // سحب الداتا تلقائياً فور التشغيل
    await VisionAPI.fetchXtreamData(savedPlaylists[0]);
    
    openView("home");
}

window.onload = initApp;
