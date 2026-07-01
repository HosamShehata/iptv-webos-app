// ============================================
// VISION TV API ENGINE
// Data Layer + Xtream API
// ============================================

const AppData = {
    live: [],
    movies: [],
    series: [],

    filteredLive: [],
    filteredMovies: [],
    filteredSeries: [],

    playlists: [],

    account: null,
    activePlaylist: null
};

// ============================================
// PLAYLIST STORAGE
// ============================================

function loadPlaylistsFromStorage() {
    AppData.playlists =
        JSON.parse(localStorage.getItem("iptv_playlists_lg")) || [];
}

function savePlaylistsToStorage() {
    localStorage.setItem(
        "iptv_playlists_lg",
        JSON.stringify(AppData.playlists)
    );
}

function addPlaylist(name, user, pass, url) {

    if (!name || !user || !url)
        return false;

    const playlist = {
        id: Date.now(),
        name,
        user,
        pass,
        url: url.replace(/\/$/, "")
    };

    AppData.playlists.push(playlist);

    savePlaylistsToStorage();

    return playlist;
}

function updatePlaylist(id, data) {

    const playlist =
        AppData.playlists.find(p => p.id === id);

    if (!playlist)
        return false;

    playlist.name = data.name;
    playlist.user = data.user;
    playlist.pass = data.pass;
    playlist.url = data.url.replace(/\/$/, "");

    savePlaylistsToStorage();

    return true;
}

function deletePlaylist(id) {

    AppData.playlists =
        AppData.playlists.filter(p => p.id !== id);

    savePlaylistsToStorage();

    if (AppData.playlists.length === 0)
        clearContent();

}

function getPlaylists() {
    return AppData.playlists;
}

// ============================================
// CONTENT
// ============================================

function clearContent() {

    AppData.live = [];
    AppData.movies = [];
    AppData.series = [];

    AppData.filteredLive = [];
    AppData.filteredMovies = [];
    AppData.filteredSeries = [];

    AppData.account = null;

}
// ============================================
// XTREAM API
// ============================================

async function loadXtreamData(server) {

    try {

        const base =
            `${server.url}/player_api.php?username=${encodeURIComponent(server.user)}&password=${encodeURIComponent(server.pass)}`;

        // معلومات الحساب
        const account =
            await fetch(base).then(r => r.json());

        if (!account.user_info) {
            throw new Error("Invalid Xtream Account");
        }

        AppData.account = account;
        AppData.activePlaylist = server;

        // تحميل البيانات بالتوازي
        const [
            live,
            movies,
            series
        ] = await Promise.all([

            fetch(base + "&action=get_live_streams").then(r => r.json()),

            fetch(base + "&action=get_vod_streams").then(r => r.json()),

            fetch(base + "&action=get_series").then(r => r.json())

        ]);

        // ===========================
        // LIVE
        // ===========================

        AppData.live = live.map(item => ({

            id: item.stream_id,

            type: "live",

            name: item.name,

            image: item.stream_icon || "",

            category: item.category_id,

            stream_id: item.stream_id,

            url:
                `${server.url}/live/${server.user}/${server.pass}/${item.stream_id}.m3u8`

        }));

        // ===========================
        // MOVIES
        // ===========================

        AppData.movies = movies.map(item => ({

            id: item.stream_id,

            type: "movie",

            name: item.name,

            image: item.stream_icon || "",

            category: item.category_id,

            stream_id: item.stream_id,

            container: item.container_extension,

            url:
                `${server.url}/movie/${server.user}/${server.pass}/${item.stream_id}.${item.container_extension}`

        }));

        // ===========================
        // SERIES
        // ===========================

        AppData.series = series.map(item => ({

            id: item.series_id,

            type: "series",

            name: item.name,

            image: item.cover || item.stream_icon || "",

            category: item.category_id,

            series_id: item.series_id

        }));

        AppData.filteredLive = [...AppData.live];
        AppData.filteredMovies = [...AppData.movies];
        AppData.filteredSeries = [...AppData.series];

        return true;

    } catch (err) {

        console.error(err);

        clearContent();

        return false;

    }

}
// ============================================
// SEARCH
// ============================================

function searchContent(keyword = "") {

    keyword = keyword.trim().toLowerCase();

    if (keyword === "") {

        AppData.filteredLive = [...AppData.live];
        AppData.filteredMovies = [...AppData.movies];
        AppData.filteredSeries = [...AppData.series];

        return;
    }

    AppData.filteredLive = AppData.live.filter(item =>
        item.name.toLowerCase().includes(keyword)
    );

    AppData.filteredMovies = AppData.movies.filter(item =>
        item.name.toLowerCase().includes(keyword)
    );

    AppData.filteredSeries = AppData.series.filter(item =>
        item.name.toLowerCase().includes(keyword)
    );

}

// ============================================
// GETTERS
// ============================================

function getLiveChannels() {
    return AppData.filteredLive;
}

function getMovies() {
    return AppData.filteredMovies;
}

function getSeries() {
    return AppData.filteredSeries;
}

function getAccountInfo() {
    return AppData.account;
}

function getActivePlaylist() {
    return AppData.activePlaylist;
}

// ============================================
// AUTO LOAD
// ============================================

async function restoreLastPlaylist() {

    loadPlaylistsFromStorage();

    if (AppData.playlists.length === 0)
        return false;

    const playlist = AppData.playlists[0];

    return await loadXtreamData(playlist);

}
