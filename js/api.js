// =====================================
// VISION TV API ENGINE
// مسؤول عن البيانات فقط
// =====================================

const AppData = {

    live: [],
    movies: [],
    series: [],

    filteredLive: [],
    filteredMovies: [],
    filteredSeries: [],

    playlists: []

};

// =====================================

function loadPlaylistsFromStorage() {

    AppData.playlists =
        JSON.parse(localStorage.getItem("iptv_playlists_lg")) || [];

}

// =====================================

function savePlaylistsToStorage() {

    localStorage.setItem(
        "iptv_playlists_lg",
        JSON.stringify(AppData.playlists)
    );

}

// =====================================

function clearContent() {

    AppData.live = [];
    AppData.movies = [];
    AppData.series = [];

    AppData.filteredLive = [];
    AppData.filteredMovies = [];
    AppData.filteredSeries = [];

}

// =====================================

function generateDemoContent(language = "ar") {

    const ar = language === "ar";

    AppData.live = [

        {
            id: 1,
            type: "live",
            name: ar ? "beIN Sports 1 HD" : "beIN Sports 1 HD",
            image: "https://placehold.co/400x600/e50914/ffffff?text=SPORT",
            url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        },

        {
            id: 2,
            type: "live",
            name: ar ? "MBC مصر" : "MBC Masr",
            image: "https://placehold.co/400x600/0f7cff/ffffff?text=MBC",
            url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        }

    ];

    AppData.movies = [

        {
            id: 100,
            type: "movie",
            name: "Sintel 4K",
            image: "https://placehold.co/400x600/181818/ffffff?text=SINTEL",
            url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8"
        }

    ];

    AppData.series = [

        {
            id: 200,
            type: "series",
            name: ar ? "مسلسل خيال علمي" : "Sci-Fi Series",
            image: "https://placehold.co/400x600/8a2be2/ffffff?text=SERIES"
        }

    ];

    AppData.filteredLive = [...AppData.live];
    AppData.filteredMovies = [...AppData.movies];
    AppData.filteredSeries = [...AppData.series];

}
// =====================================
// PLAYLISTS
// =====================================

function addPlaylist(name, user, pass, url) {

    if (!name || !user || !url)
        return false;

    const playlist = {
        id: Date.now(),
        name,
        user,
        pass,
        url
    };

    AppData.playlists.push(playlist);

    savePlaylistsToStorage();

    return true;
}

// =====================================

function deletePlaylist(id) {

    AppData.playlists =
        AppData.playlists.filter(
            p => p.id !== id
        );

    savePlaylistsToStorage();

    if (AppData.playlists.length === 0) {

        clearContent();

    }

}

// =====================================

function updatePlaylist(id, data) {

    const playlist =
        AppData.playlists.find(
            p => p.id === id
        );

    if (!playlist)
        return false;

    playlist.name = data.name;
    playlist.user = data.user;
    playlist.pass = data.pass;
    playlist.url = data.url;

    savePlaylistsToStorage();

    return true;
}

// =====================================

function getPlaylists() {

    return AppData.playlists;

}

// =====================================

function getLiveChannels() {

    return AppData.filteredLive;

}

function getMovies() {

    return AppData.filteredMovies;

}

function getSeries() {

    return AppData.filteredSeries;

}

// =====================================

function searchContent(keyword) {

    keyword = keyword.toLowerCase();

    AppData.filteredLive =
        AppData.live.filter(item =>
            item.name.toLowerCase().includes(keyword)
        );

    AppData.filteredMovies =
        AppData.movies.filter(item =>
            item.name.toLowerCase().includes(keyword)
        );

    AppData.filteredSeries =
        AppData.series.filter(item =>
            item.name.toLowerCase().includes(keyword)
        );

}
async function loadXtreamData(server){

    const base =
        `${server.url}/player_api.php?username=${server.user}&password=${server.pass}`;

    const account =
        await fetch(base).then(r=>r.json());

    const live =
        await fetch(base+"&action=get_live_streams")
        .then(r=>r.json());

    const movies =
        await fetch(base+"&action=get_vod_streams")
        .then(r=>r.json());

    const series =
        await fetch(base+"&action=get_series")
        .then(r=>r.json());

    AppData.live = live;
    AppData.movies = movies;
    AppData.series = series;

    AppData.filteredLive = [...live];
    AppData.filteredMovies = [...movies];
    AppData.filteredSeries = [...series];

    return account;

}
