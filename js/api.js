// =====================================
// VISION TV - XTREAM API ENGINE
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

    loadPlaylists() {
        this.state.playlists = JSON.parse(localStorage.getItem("iptv_playlists_lg")) || [];
    },

    savePlaylists() {
        localStorage.setItem("iptv_playlists_lg", JSON.stringify(this.state.playlists));
    },

    addPlaylist(name, user, pass, url) {
        if (!name || !user || !pass || !url) return false;
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

    deletePlaylist(id) {
        this.state.playlists = this.state.playlists.filter(p => p.id !== id);
        this.savePlaylists();
        if (this.state.playlists.length === 0) {
            this.clearContent();
        }
    },

    getPlaylists() {
        return this.state.playlists;
    },

    clearContent() {
        this.state.live = [];
        this.state.movies = [];
        this.state.series = [];
        this.syncFiltered();
    },

    generateDemo(language = "ar") {
        const isAr = language === "ar";
        this.state.live = [
            { id: 1, type: "live", name: isAr ? "قناة بث مباشر تجريبية" : "Demo Live Channel", image: "https://placehold.co/400x600/e50914/ffffff?text=LIVE", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }
        ];
        this.state.movies = [
            { id: 100, type: "movie", name: isAr ? "فيلم تجريبي سينمائي" : "Sintel Movie", image: "https://placehold.co/400x600/111111/ffffff?text=MOVIE", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8" }
        ];
        this.state.series = [
            { id: 200, type: "series", name: isAr ? "مسلسل درامي تجريبي" : "Demo Series", image: "https://placehold.co/400x600/222222/ffffff?text=SERIES" }
        ];
        this.syncFiltered();
    },

    async loadXtream(server) {
        const base = `${server.url}/player_api.php?username=${server.user}&password=${server.pass}`;
        try {
            // كود الحماية والطلب الفعلي للسيرفرات الإحترافية
            const live = await fetch(base + "&action=get_live_streams").then(r => r.json()).catch(()=>[]);
            const movies = await fetch(base + "&action=get_vod_streams").then(r => r.json()).catch(()=>[]);
            const series = await fetch(base + "&action=get_series").then(r => r.json()).catch(()=>[]);

            this.state.live = Array.isArray(live) ? live.map(i => ({id: i.stream_id, type:"live", name:i.name, image:i.stream_icon, url:`${server.url}/live/${server.user}/${server.pass}/${i.stream_id}.ts`})) : [];
            this.state.movies = Array.isArray(movies) ? movies.map(i => ({id: i.stream_id, type:"movie", name:i.name, image:i.stream_icon, url:`${server.url}/movie/${server.user}/${server.pass}/${i.stream_id}.mp4`})) : [];
            this.state.series = Array.isArray(series) ? series.map(i => ({id: i.series_id, type:"series", name:i.name, image:i.cover})) : [];

            this.syncFiltered();
            return true;
        } catch (err) {
            console.error("Xtream Server Fetch Error:", err);
            this.generateDemo("ar");
            return false;
        }
    },

    search(keyword) {
        if (!keyword) {
            this.syncFiltered();
            return;
        }
        keyword = keyword.toLowerCase();
        this.state.filtered.live = this.state.live.filter(i => i.name?.toLowerCase().includes(keyword));
        this.state.filtered.movies = this.state.movies.filter(i => i.name?.toLowerCase().includes(keyword));
        this.state.filtered.series = this.state.series.filter(i => i.name?.toLowerCase().includes(keyword));
    },

    syncFiltered() {
        this.state.filtered.live = [...this.state.live];
        this.state.filtered.movies = [...this.state.movies];
        this.state.filtered.series = [...this.state.series];
    },

    getLive() { return this.state.filtered.live; },
    getMovies() { return this.state.filtered.movies; },
    getSeries() { return this.state.filtered.series; }
};
