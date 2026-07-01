// ============================================
// VISION TV
// APP ENGINE
// ============================================

let currentView = "home";

let currentLanguage =
    localStorage.getItem("app_lang") || "ar";

// ============================================
// LANGUAGE
// ============================================

const LANG = {

    ar: {

        home: "الرئيسية",

        live: "القنوات",

        movies: "الأفلام",

        series: "المسلسلات",

        favorites: "المفضلة",

        history: "المتابعة",

        playlist: "إضافة اشتراك",

        search: "البحث",

        settings: "الإعدادات",

        playlist_title: "بيانات اشتراك Xtream",

        connect: "إضافة الاشتراك"

    },

    en: {

        home: "Home",

        live: "Live TV",

        movies: "Movies",

        series: "Series",

        favorites: "Favorites",

        history: "Continue Watching",

        playlist: "Playlist",

        search: "Search",

        settings: "Settings",

        playlist_title: "Xtream Playlist",

        connect: "Connect"

    }

};

// ============================================
// LANGUAGE APPLY
// ============================================

function applyLanguage() {

    const lang = LANG[currentLanguage];

    document.documentElement.lang =
        currentLanguage;

    document.documentElement.dir =
        currentLanguage === "ar"
            ? "rtl"
            : "ltr";

    document.querySelectorAll("[data-lang]")
        .forEach(item => {

            const key =
                item.dataset.lang;

            if (lang[key])
                item.textContent = lang[key];

        });

}

// ============================================

function toggleLanguage() {

    currentLanguage =
        currentLanguage === "ar"
            ? "en"
            : "ar";

    localStorage.setItem(
        "app_lang",
        currentLanguage
    );

    applyLanguage();

}

// ============================================
// CLOCK
// ============================================

function updateClock() {

    const now =
        new Date();

    const time =
        now.toLocaleTimeString(
            currentLanguage === "ar"
                ? "ar-EG"
                : "en-US",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    const date =
        now.toLocaleDateString(
            currentLanguage === "ar"
                ? "ar-EG"
                : "en-US"
        );

    const t =
        document.getElementById("top-current-time");

    const d =
        document.getElementById("top-current-date");

    if (t)
        t.textContent = time;

    if (d)
        d.textContent = date;

}
// ============================================
// SIDEBAR
// ============================================

const views = {

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

// ============================================

function openView(name) {

    currentView = name;

    document
        .querySelectorAll(".view-panel")
        .forEach(panel => {

            panel.classList.remove("active");

        });

    const panel =
        document.getElementById(
            views[name]
        );

    if (panel)
        panel.classList.add("active");

    document
        .querySelectorAll(".menu-item")
        .forEach(item => {

            item.classList.remove("focused");

        });

    const active =
        document.querySelector(
            `.menu-item[data-view="${name}"]`
        );

    if (active)
        active.classList.add("focused");

    if (window.updateFocusableElements)
        updateFocusableElements();

    refreshCurrentView();

}

// ============================================

function sidebarClick(name) {

    openView(name);

}

// ============================================

function refreshCurrentView() {

    switch (currentView) {

        case "home":
            renderHome();
            break;

        case "live":
            renderLive();
            break;

        case "movies":
            renderMovies();
            break;

        case "series":
            renderSeries();
            break;

        case "playlist":
            loadPlaylists();
            break;

    }

}

// ============================================
// HOME
// ============================================

function renderHome() {

    const list = [

        ...getLiveChannels(),

        ...getMovies(),

        ...getSeries()

    ];

    renderGrid(
        "home-main-grid",
        list
    );

}

// ============================================

function renderLive() {

    renderGrid(
        "live-grid",
        getLiveChannels()
    );

}

// ============================================

function renderMovies() {

    renderGrid(
        "movies-grid",
        getMovies()
    );

}

// ============================================

function renderSeries() {

    renderGrid(
        "series-grid",
        getSeries()
    );

}
// ============================================
// GRID ENGINE
// ============================================

function renderGrid(containerId, list) {

    const container =
        document.getElementById(containerId);

    if (!container)
        return;

    container.innerHTML = "";

    if (list.length === 0) {

        container.innerHTML = `
            <div class="empty-list">
                لا يوجد محتوى
            </div>
        `;

        return;

    }

    list.forEach(item => {

        container.appendChild(
            createMediaCard(item)
        );

    });

}

// ============================================

function createMediaCard(item) {

    const card =
        document.createElement("div");

    card.className =
        "media-card remote-focusable";

    const progress =
        localStorage.getItem(
            `progress_ratio_media_${item.id}`
        ) || 0;

    card.innerHTML = `

        <img
            src="${item.image}"
            loading="lazy"
            draggable="false"
        >

        <div class="card-progress-bar">

            <div
                class="card-progress-fill"
                style="width:${progress}%">
            </div>

        </div>

        <div class="info">

            ${item.name}

        </div>

    `;

    card.onclick = () => {

        openDetails(item);

    };

    return card;

}

// ============================================
// DETAILS
// ============================================

function openDetails(item) {

    window.currentItem = item;

    openView("details");

    const title =
        document.getElementById(
            "detail-item-title"
        );

    const image =
        document.getElementById(
            "detail-item-img"
        );

    if (title)
        title.textContent = item.name;

    if (image)
        image.src = item.image;

    if (item.type === "series") {

        renderSeriesEpisodes(item);

    } else {

        renderMovieActions(item);

    }

}

// ============================================

function renderMovieActions(item) {

    const zone =
        document.getElementById(
            "movie-action-zone"
        );

    if (!zone)
        return;

    zone.innerHTML = `

        <button
            class="btn-action-submit"
            onclick="playMedia(${item.id})">

            ▶ تشغيل

        </button>

    `;

}
// ============================================
// SERIES
// ============================================

function renderSeriesEpisodes(series) {

    const zone =
        document.getElementById(
            "series-episodes-vertical-zone"
        );

    const container =
        document.getElementById(
            "episodes-vertical-container"
        );

    const movieZone =
        document.getElementById(
            "movie-action-zone"
        );

    if (!zone || !container)
        return;

    zone.style.display = "block";

    if (movieZone)
        movieZone.innerHTML = "";

    container.innerHTML = "";

    const episodes = [];

    for (let i = 1; i <= 12; i++) {

        episodes.push({

            id: `${series.id}_${i}`,

            type: "episode",

            name: `Episode ${i}`,

            image: series.image,

            url: series.url || ""

        });

    }

    episodes.forEach(ep => {

        const card =
            document.createElement("div");

        card.className =
            "episode-row-card remote-focusable";

        const progress =
            localStorage.getItem(
                `progress_ratio_media_${ep.id}`
            ) || 0;

        card.innerHTML = `

            <div class="thumb-area">

                <img src="${ep.image}">

                <div class="card-progress-bar">

                    <div
                        class="card-progress-fill"
                        style="width:${progress}%">
                    </div>

                </div>

            </div>

            <div class="ep-details-side">

                <div class="ep-row-title">

                    ${ep.name}

                </div>

            </div>

        `;

        card.onclick = () => {

            playMedia(ep);

        };

        container.appendChild(card);

    });

}

// ============================================
// PLAYER
// ============================================

function playMedia(item) {

    localStorage.setItem(
        "current",
        JSON.stringify(item)
    );

    let history =
        JSON.parse(
            localStorage.getItem(
                "watch_history"
            )
        ) || [];

    history =
        history.filter(
            x => x.id !== item.id
        );

    history.unshift(item);

    if (history.length > 100)
        history.pop();

    localStorage.setItem(
        "watch_history",
        JSON.stringify(history)
    );

    window.location.href =
        "player.html";

}

// ============================================
// CONTINUE WATCHING
// ============================================

function getHistory() {

    return JSON.parse(
        localStorage.getItem(
            "watch_history"
        )
    ) || [];

}

function clearHistory() {

    localStorage.removeItem(
        "watch_history"
    );

}
// ============================================
// PLAYLISTS
// ============================================

function loadPlaylists() {

    loadPlaylistsFromStorage();

    const container =
        document.getElementById(
            "playlists-list"
        );

    if (!container)
        return;

    container.innerHTML = "";

    if (AppData.playlists.length === 0) {

        container.innerHTML = `

            <div class="playlist-empty">

                لا توجد اشتراكات

            </div>

        `;

        return;

    }

    AppData.playlists.forEach(server => {

        const row =
            document.createElement("div");

        row.className =
            "playlist-table-row";

        row.innerHTML = `

            <div>

                <strong>${server.name}</strong>

                <br>

                <span>${server.url}</span>

            </div>

            <div>

                <button
                    class="btn-playlist-control edit"
                    onclick="editPlaylist(${server.id})">

                    تعديل

                </button>

                <button
                    class="btn-playlist-control delete"
                    onclick="removePlaylist(${server.id})">

                    حذف

                </button>

            </div>

        `;

        container.appendChild(row);

    });

}

// ============================================

function removePlaylist(id) {

    deletePlaylist(id);

    loadPlaylists();

    refreshCurrentView();

}

// ============================================

function editPlaylist(id) {

    const playlist =
        AppData.playlists.find(
            p => p.id === id
        );

    if (!playlist)
        return;

    document.getElementById("server-name").value =
        playlist.name;

    document.getElementById("server-user").value =
        playlist.user;

    document.getElementById("server-pass").value =
        playlist.pass;

    document.getElementById("server-url").value =
        playlist.url;

}

// ============================================
// SEARCH
// ============================================

function search(value) {

    searchContent(value);

    refreshCurrentView();

}

// ============================================

function searchInputChanged(input) {

    search(input.value);

}

// ============================================
// THEME
// ============================================

function applyTheme(theme) {

    document.documentElement.className =
        theme;

    localStorage.setItem(
        "selected-theme",
        theme
    );

}

// ============================================

function loadTheme() {

    applyTheme(

        localStorage.getItem(
            "selected-theme"
        ) ||

        "theme-netflix"

    );

}
// ============================================
// ADD PLAYLIST
// ============================================

async function savePlaylist() {

    const name =
        document.getElementById("server-name").value.trim();

    const user =
        document.getElementById("server-user").value.trim();

    const pass =
        document.getElementById("server-pass").value.trim();

    const url =
        document.getElementById("server-url").value.trim();

    if (!addPlaylist(name, user, pass, url)) {

        alert("برجاء إدخال جميع البيانات");

        return;

    }

    loadPlaylists();

    try {

        await loadXtreamData({

            name,
            user,
            pass,
            url

        });

    } catch (e) {

        console.log(e);

        generateDemoContent(currentLanguage);

    }

    refreshCurrentView();

    document.getElementById("server-name").value = "";
    document.getElementById("server-user").value = "";
    document.getElementById("server-pass").value = "";
    document.getElementById("server-url").value = "";

}

// ============================================
// SETTINGS
// ============================================

function updateSeekDuration(value) {

    localStorage.setItem(
        "global_seek_duration",
        value
    );

}

function togglePassword() {

    const input =
        document.getElementById("server-pass");

    if (!input)
        return;

    input.type =
        input.type === "password"
            ? "text"
            : "password";

}

// ============================================
// INIT
// ============================================

function initApp() {

    loadTheme();

    applyLanguage();

    loadPlaylistsFromStorage();

    if (AppData.playlists.length > 0) {

        loadXtreamData(
            AppData.playlists[0]
        ).catch(() => {

            generateDemoContent(
                currentLanguage
            );

            refreshCurrentView();

        });

    } else {

        generateDemoContent(
            currentLanguage
        );

    }

    loadPlaylists();

    openView("home");

    updateClock();

    setInterval(

        updateClock,

        1000

    );

}

// ============================================

window.onload = () => {

    initApp();

};
