// =====================================
// VISION TV - XTREAM API ENGINE (FINAL)
// Single Source of Truth
// =====================================

const VisionAPI = {

    state: {
        live: [],
        movies: [],
        series: [],
        playlists: [],
        filtered: {
            live: [],
            movies: [],
            series: []
        }
    },

    // ==============================
    // STORAGE
    // ==============================

    loadPlaylists() {
        this.state.playlists =
            JSON.parse(localStorage.getItem("iptv_playlists_lg")) || [];
    },

    savePlaylists() {
        localStorage.setItem(
            "iptv_playlists_lg",
            JSON.stringify(this.state.playlists)
        );
    },

    // ==============================
    // PLAYLISTS
    // ==============================

    addPlaylist(name, user, pass, url) {
        if (!name || !user || !url) return false;

        this.state.playlists.push({
            id: Date.now(),
            name,
            user,
            pass,
            url
        });

        this.savePlaylists();
        return true;
    },

    updatePlaylist(id, data) {
        const p = this.state.playlists.find(x => x.id === id);
        if (!p) return false;

        p.name = data.name;
        p.user = data.user;
        p.pass = data.pass;
        p.url = data.url;

        this.savePlaylists();
        return true;
    },

    deletePlaylist(id) {
        this.state.playlists =
            this.state.playlists.filter(p => p.id !== id);

        this.savePlaylists();

        if (this.state.playlists.length === 0) {
            this.clearContent();
        }
    },

    getPlaylists() {
        return this.state.playlists;
    },

    // ==============================
    // CONTENT CONTROL
    // ==============================

    clearContent() {
        this.state.live = [];
        this.state.movies = [];
        this.state.series = [];

        this.state.filtered.live = [];
        this.state.filtered.movies = [];
        this.state.filtered.series = [];
    },

    // ==============================
    // DEMO DATA (fallback)
    // ==============================

    generateDemo(language = "ar") {

        const ar = language === "ar";

        this.state.live = [
            {
                id: 1,
                type: "live",
                name: ar ? "beIN Sports 1 HD" : "beIN Sports 1 HD",
                image: "https://placehold.co/400x600/e50914/ffffff?text=LIVE",
                url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
            }
        ];

        this.state.movies = [
            {
                id: 100,
                type: "movie",
                name: "Sintel 4K",
                image: "https://placehold.co/400x600/111111/ffffff?text=MOVIE",
                url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8"
            }
        ];

        this.state.series = [
            {
                id: 200,
                type: "series",
                name: ar ? "مسلسل تجريبي" : "Demo Series",
                image: "https://placehold.co/400x600/222222/ffffff?text=SERIES"
            }
        ];

        this.syncFiltered();
    },

    // ==============================
    // XTREAM API
    // ==============================

    async loadXtream(server) {

        const base =
            `${server.url}/player_api.php?username=${server.user}&password=${server.pass}`;

        try {

            const account = await fetch(base).then(r => r.json());
            const live = await fetch(base + "&action=get_live_streams").then(r => r.json());
            const movies = await fetch(base + "&action=get_vod_streams").then(r => r.json());
            const series = await fetch(base + "&action=get_series").then(r => r.json());

            this.state.live = live || [];
            this.state.movies = movies || [];
            this.state.series = series || [];

            this.syncFiltered();

            return account;

        } catch (err) {
            console.error("Xtream Load Error:", err);
            this.generateDemo("ar");
            return null;
        }
    },

    // ==============================
    // SEARCH
    // ==============================

    search(keyword) {

        keyword = keyword.toLowerCase();

        this.state.filtered.live =
            this.state.live.filter(i =>
                i.name?.toLowerCase().includes(keyword)
            );

        this.state.filtered.movies =
            this.state.movies.filter(i =>
                i.name?.toLowerCase().includes(keyword)
            );

        this.state.filtered.series =
            this.state.series.filter(i =>
                i.name?.toLowerCase().includes(keyword)
            );
    },

    // ==============================
    // SYNC
    // ==============================

    syncFiltered() {
        this.state.filtered.live = [...this.state.live];
        this.state.filtered.movies = [...this.state.movies];
        this.state.filtered.series = [...this.state.series];
    },

    // ==============================
    // GETTERS
    // ==============================

    getLive() {
        return this.state.filtered.live;
    },

    getMovies() {
        return this.state.filtered.movies;
    },

    getSeries() {
        return this.state.filtered.series;
    }
};
// =====================================
// VISION TV - APP UI CONTROLLER
// =====================================

let currentView = "home";

// ==============================
// INIT
// ==============================

window.onload = async () => {

    ApiEngine.loadPlaylists();

    applyTheme(localStorage.getItem("selected-theme") || "theme-netflix");

    loadUIFromAPI();

    clickSidebarItem(0);
};

// ==============================
// LOAD UI DATA
// ==============================

function loadUIFromAPI() {

    filteredLive = ApiEngine.getLive();
    filteredMovies = ApiEngine.getMovies();
    filteredSeries = ApiEngine.getSeries();

    renderContentGrid(currentView);
}

// ==============================
// PLAYLIST SAVE
// ==============================

function saveIPTVServer() {

    const name = document.getElementById("server-name").value.trim();
    const user = document.getElementById("server-user").value.trim();
    const pass = document.getElementById("server-pass").value.trim();
    const url = document.getElementById("server-url").value.trim();

    const status = document.getElementById("pl_status");

    const ok = ApiEngine.addPlaylist(name, user, pass, url);

    if (!ok) {
        status.innerText = "اكمل البيانات المطلوبة";
        status.style.color = "red";
        return;
    }

    status.innerText = "Saved Successfully";
    status.style.color = "#00c851";

    ApiEngine.loadPlaylists();

    loadPlaylists();
}

// ==============================
// LOAD PLAYLISTS UI
// ==============================

function loadPlaylists() {

    const container = document.getElementById("playlists-list");
    container.innerHTML = "";

    const list = ApiEngine.getPlaylists();

    if (!list.length) {
        container.innerHTML = "لا يوجد اشتراكات";
        return;
    }

    list.forEach((server, index) => {

        container.innerHTML += `
        <div class="playlist-table-row">
            <div>
                <strong>${server.name}</strong><br>
                <small>${server.url}</small>
            </div>

            <div>
                <button onclick="deletePlaylist(${server.id})">حذف</button>
            </div>
        </div>`;
    });
}

// ==============================
// DELETE
// ==============================

function deletePlaylist(id) {

    ApiEngine.deletePlaylist(id);

    loadPlaylists();

    loadUIFromAPI();
}

// ==============================
// SEARCH
// ==============================

function triggerGlobalSearch(q) {

    const res = ApiEngine.search(q);

    filteredLive = res.live;
    filteredMovies = res.movies;
    filteredSeries = res.series;

    renderContentGrid(currentView);
}
// =====================================
// VISION TV - BOOTSTRAP LAYER
// =====================================

async function bootApp() {

    // تحميل الاشتراكات
    ApiEngine.loadPlaylists();

    const playlists = ApiEngine.getPlaylists();

    // لو فيه سيرفر شغال → نجيب الداتا منه
    if (playlists.length > 0) {

        const active = playlists[0]; // أول سيرفر

        await ApiEngine.loadXtream(active);

    }

    // تحديث UI
    loadUIFromAPI();
    loadPlaylists();
}

// تشغيل النظام
window.onload = bootApp;
generateDemo() {

    this.state.live = [
        {
            id: 1,
            name: "Demo Live Channel",
            stream_icon: "https://placehold.co/400x600",
            url: "#"
        }
    ];

    this.state.movies = [
        {
            id: 2,
            name: "Demo Movie",
            stream_icon: "https://placehold.co/400x600",
            url: "#"
        }
    ];

    this.state.series = [
        {
            id: 3,
            name: "Demo Series",
            stream_icon: "https://placehold.co/400x600"
        }
    ];
}
function loadUIFromAPI() {

    filteredLive = ApiEngine.getLive();
    filteredMovies = ApiEngine.getMovies();
    filteredSeries = ApiEngine.getSeries();

    renderContentGrid(currentView);
}
ApiEngine.state
function playMediaDirectly(item) {

    localStorage.setItem("current", JSON.stringify(item));

    window.location.href = "player.html";
}
const mediaItem = JSON.parse(localStorage.getItem("current") || "{}");
// =====================================
// XTREAM LOGIN VALIDATOR
// =====================================

async function validateXtreamLogin(url, user, pass) {

    try {

        const base = `${url}/player_api.php?username=${user}&password=${pass}`;

        const res = await fetch(base, { method: "GET" });

        if (!res.ok) {
            return { success: false, error: "HTTP_ERROR" };
        }

        const data = await res.json();

        // Xtream بيرجع status داخل account info
        if (!data || data.user_info?.auth !== 1) {
            return { success: false, error: "INVALID_LOGIN" };
        }

        return {
            success: true,
            data: {
                username: data.user_info.username,
                status: data.user_info.status,
                exp_date: data.user_info.exp_date,
                max
                    
