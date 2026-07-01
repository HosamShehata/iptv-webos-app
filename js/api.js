// ==============================
// VISION TV API ENGINE
// ==============================

let liveChannels = [];
let moviesList = [];
let seriesList = [];

let filteredLive = [];
let filteredMovies = [];
let filteredSeries = [];

/*
    لاحقاً سيتم استبدال هذا كله بطلبات Xtream API الحقيقية
*/

function generateServerPlaylistContent() {

    const lang = localStorage.getItem("app_lang") || "ar";
    const ar = lang === "ar";

    liveChannels = [
        {
            stream_id: 1,
            type: "live",
            name: ar ? "beIN Sports 1 HD" : "beIN Sports 1 HD",
            stream_icon: "https://placehold.co/400x600/e50914/ffffff?text=SPORT+1",
            url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        },
        {
            stream_id: 2,
            type: "live",
            name: ar ? "MBC مصر" : "MBC Masr",
            stream_icon: "https://placehold.co/400x600/0057ff/ffffff?text=MBC",
            url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        },
        {
            stream_id: 3,
            type: "live",
            name: ar ? "أبو ظبي الرياضية" : "AD Sports",
            stream_icon: "https://placehold.co/400x600/00c851/ffffff?text=AD",
            url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        }
    ];

    moviesList = [
        {
            stream_id: 100,
            type: "movie",
            name: ar ? "Sintel 4K" : "Sintel 4K",
            stream_icon: "https://placehold.co/400x600/141414/ffffff?text=SINTEL",
            url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8"
        },
        {
            stream_id: 101,
            type: "movie",
            name: ar ? "Big Buck Bunny" : "Big Buck Bunny",
            stream_icon: "https://placehold.co/400x600/444444/ffffff?text=BBB",
            url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        }
    ];

    seriesList = [
        {
            series_id: 200,
            type: "series",
            name: ar ? "Sci-Fi Series" : "Sci-Fi Series",
            stream_icon: "https://placehold.co/400x600/8a2be2/ffffff?text=SERIES"
        }
    ];

    filteredLive = [...liveChannels];
    filteredMovies = [...moviesList];
    filteredSeries = [...seriesList];
}

// ======================================

function saveIPTVServer() {

    const playlist = {
        name: document.getElementById("server-name").value.trim(),
        user: document.getElementById("server-user").value.trim(),
        pass: document.getElementById("server-pass").value.trim(),
        url: document.getElementById("server-url").value.trim()
    };

    if (!playlist.name || !playlist.user || !playlist.url) {

        document.getElementById("pl_status").innerHTML =
            "برجاء إدخال جميع البيانات.";

        document.getElementById("pl_status").style.color = "red";

        return;
    }

    let servers =
        JSON.parse(localStorage.getItem("iptv_playlists_lg")) || [];

    servers.push(playlist);

    localStorage.setItem(
        "iptv_playlists_lg",
        JSON.stringify(servers)
    );

    document.getElementById("pl_status").style.color = "#00c851";
    document.getElementById("pl_status").innerHTML =
        "تم إضافة السيرفر بنجاح";

    document.getElementById("server-name").value = "";
    document.getElementById("server-user").value = "";
    document.getElementById("server-pass").value = "";
    document.getElementById("server-url").value = "";

    generateServerPlaylistContent();

    loadPlaylists();

    if (window.clickSidebarItem)
        clickSidebarItem(0);
}

// ======================================

function loadPlaylists() {

    const container =
        document.getElementById("playlists-list");

    if (!container)
        return;

    container.innerHTML = "";

    const list =
        JSON.parse(localStorage.getItem("iptv_playlists_lg")) || [];

    if (!list.length) {

        container.innerHTML =
            "<p style='opacity:.6'>لا توجد اشتراكات.</p>";

        return;
    }

    list.forEach((item, index) => {

        container.innerHTML += `

<div class="playlist-table-row">

<div>

<b>${item.name}</b>

<br>

${item.url}

</div>

<div>

<button
class="btn-playlist-control edit">
Edit
</button>

<button
class="btn-playlist-control delete"
onclick="deletePlaylist(${index})">

Delete

</button>

</div>

</div>

`;

    });

}

// ======================================

function deletePlaylist(index){

    let list =
        JSON.parse(localStorage.getItem("iptv_playlists_lg")) || [];

    list.splice(index,1);

    localStorage.setItem(
        "iptv_playlists_lg",
        JSON.stringify(list)
    );

    loadPlaylists();

}
