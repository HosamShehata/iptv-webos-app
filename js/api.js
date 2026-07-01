// =====================================================
// VISION TV - ENGINE CORE API (FIXED VERSION)
// =====================================================

const VisionAPI = {
    state: {
        live: [],
        movies: [],
        series: [],
        playlists: []
    },

    // ==============================
    // تحميل البلاي ليست
    // ==============================
    loadPlaylists() {
        const stored = JSON.parse(localStorage.getItem("vision_playlists")) || [];

        if (stored.length === 0) {
            const defaultServer = {
                id: Date.now(),
                name: "hydra",
                user: "hosam06",
                pass: "9182530",
                url: "http://hyprime.cc:80"
            };

            this.state.playlists = [defaultServer];
            localStorage.setItem("vision_playlists", JSON.stringify(this.state.playlists));

            // تشغيل تلقائي
            this.fetchXtreamData(defaultServer);

        } else {
            this.state.playlists = stored;

            // تشغيل أول سيرفر تلقائي
            this.fetchXtreamData(this.state.playlists[0]);
        }

        return this.state.playlists;
    },

    // ==============================
    // حفظ بلاي ليست جديدة
    // ==============================
    savePlaylist(name, user, pass, host) {
        if (!name || !user || !pass || !host) return false;

        if (!host.startsWith("http://") && !host.startsWith("https://")) {
            host = "http://" + host;
        }

        const newPlaylist = {
            id: Date.now(),
            name,
            user,
            pass,
            url: host
        };

        this.state.playlists.push(newPlaylist);

        localStorage.setItem("vision_playlists", JSON.stringify(this.state.playlists));

        // تشغيل مباشر بعد الحفظ
        this.fetchXtreamData(newPlaylist);

        return true;
    },

    // ==============================
    // حذف بلاي ليست
    // ==============================
    deletePlaylist(id) {
        this.state.playlists = this.state.playlists.filter(p => p.id !== id);

        localStorage.setItem("vision_playlists", JSON.stringify(this.state.playlists));

        if (this.state.playlists.length > 0) {
            this.fetchXtreamData(this.state.playlists[0]);
        } else {
            this.clearContent();
        }
    },

    // ==============================
    // تنظيف المحتوى
    // ==============================
    clearContent() {
        this.state.live = [];
        this.state.movies = [];
        this.state.series = [];
    },

    // ==============================
    // Xtream Loader (FIXED)
    // ==============================
    async fetchXtreamData(server) {

        this.clearContent();

        let cleanHost = server.url.endsWith('/')
            ? server.url.slice(0, -1)
            : server.url;

        const baseUrl = `${cleanHost}/player_api.php?username=${server.user}&password=${server.pass}`;

        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(baseUrl)}`;

        console.log("Connecting to Xtream server...");

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);


const response = await fetch(proxyUrl, { signal: controller.signal });

console.log("================================");
console.log("HTTP STATUS:", response.status);
console.log("Proxy URL:", proxyUrl);

const text = await response.text();

console.log("RAW RESPONSE:");
console.log(text);

let result;

try {
    result = JSON.parse(text);
} catch (e) {
    console.error("❌ Response is NOT valid JSON");
    console.error(text);
    this.loadDemoData();
    return false;
}

clearTimeout(timeout);

console.log("PARSED RESULT:");
console.log(result);

console.log("CONTENTS:");
console.log(result.contents);
console.log("================================");
            // ==============================
            // FIX 1: حماية JSON parsing
            // ==============================
            let accountData;
            try {
                accountData = JSON.parse(result.contents);
            } catch (e) {
                console.error("Invalid API response:", result.contents);
                this.loadDemoData();
                return false;
            }

            // ==============================
            // تحميل القنوات (FIXED ENDPOINTS)
            // ==============================
            const [liveRes, moviesRes, seriesRes] = await Promise.all([
                fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(baseUrl + "&action=get_live_streams")}`)
                    .then(r => r.json()).catch(() => ({ contents: "[]" })),

                fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(baseUrl + "&action=get_vod_streams")}`)
                    .then(r => r.json()).catch(() => ({ contents: "[]" })),

                fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(baseUrl + "&action=get_series")}`)
                    .then(r => r.json()).catch(() => ({ contents: "[]" }))
            ]);

            const liveData = JSON.parse(liveRes.contents || "[]");
            console.log("LIVE COUNT:", liveData.length);
console.log(liveData);
            const moviesData = JSON.parse(moviesRes.contents || "[]");
            console.log("MOVIES COUNT:", moviesData.length);
            const seriesData = JSON.parse(seriesRes.contents || "[]");
            console.log("SERIES COUNT:", seriesData.length);

            // ==============================
            // Live
            // ==============================
            if (Array.isArray(liveData)) {
                this.state.live = liveData.slice(0, 150).map(i => ({
                    id: i.stream_id,
                    name: i.name,
                    stream_icon: i.stream_icon,
                    type: "live",
url: `${cleanHost}/live/${server.user}/${server.pass}/${i.stream_id}.m3u8`                }));
            }

            // ==============================
            // Movies
            // ==============================
            if (Array.isArray(moviesData)) {
                this.state.movies = moviesData.slice(0, 150).map(i => ({
                    id: i.stream_id,
                    name: i.name,
                    stream_icon: i.stream_icon,
                    type: "movie",
                    url: `${cleanHost}/movie/${server.user}/${server.pass}/${i.stream_id}.mp4`
                }));
            }

            // ==============================
            // Series
            // ==============================
            if (Array.isArray(seriesData)) {
                this.state.series = seriesData.slice(0, 150).map(i => ({
                    id: i.series_id,
                    name: i.name,
                    stream_icon: i.cover,
                    type: "series"
                }));
            }

            console.log("XTREAM LOADED SUCCESSFULLY");
            return true;

        } catch (error) {
            console.error("Connection failed:", error);
            this.loadDemoData();
            return false;
        }
    },

    // ==============================
    // Demo fallback
    // ==============================
    loadDemoData() {
        this.state.live = [{
            id: 1,
            name: "Connection Error - Check Internet / Server",
            stream_icon: "",
            type: "live",
            url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        }];

        this.state.movies = [{
            id: 2,
            name: "Fallback Movie Stream",
            stream_icon: "",
            type: "movie",
            url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8"
        }];

        this.state.series = [];
    }
};
