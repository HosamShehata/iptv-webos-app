// =====================================================
// VISION TV - ENGINE CORE API (مصدر البيانات الموحد)
// =====================================================

const VisionAPI = {
    state: {
        live: [],
        movies: [],
        series: [],
        playlists: []
    },

    // تحميل الاشتراكات من الذاكرة
    loadPlaylists() {
        this.state.playlists = JSON.parse(localStorage.getItem("vision_playlists")) || [];
        return this.state.playlists;
    },

    // حفظ الاشتراك الجديد
    savePlaylist(name, user, pass, host) {
        if (!name || !user || !pass || !host) return false;

        const newPlaylist = {
            id: Date.now(),
            name: name,
            user: user,
            pass: pass,
            url: host
        };

        this.state.playlists.push(newPlaylist);
        localStorage.setItem("vision_playlists", JSON.stringify(this.state.playlists));
        return true;
    },

    // حذف اشتراك
    deletePlaylist(id) {
        this.state.playlists = this.state.playlists.filter(p => p.id !== id);
        localStorage.setItem("vision_playlists", JSON.stringify(this.state.playlists));
        if (this.state.playlists.length === 0) {
            this.clearContent();
        }
    },

    clearContent() {
        this.state.live = [];
        this.state.movies = [];
        this.state.series = [];
    },

    // جلب البيانات الفعلية من سيرفر الـ IPTV
    async fetchXtreamData(server) {
        this.clearContent();
        const apiBase = `${server.url}/player_api.php?username=${server.user}&password=${server.pass}`;
        
        try {
            // جلب متوازي لضمان السرعة وعدم تعليق الشاشة
            const [liveData, moviesData, seriesData] = await Promise.all([
                fetch(`${apiBase}&action=get_live_streams`).then(r => r.json()).catch(() => []),
                fetch(`${apiBase}&action=get_vod_streams`).then(r => r.json()).catch(() => []),
                fetch(`${apiBase}&action=get_series`).then(r => r.json()).catch(() => [])
            ]);

            this.state.live = Array.isArray(liveData) ? liveData.slice(0, 50) : []; // حد أقصى 50 لعرض سريع
            this.state.movies = Array.isArray(moviesData) ? moviesData.slice(0, 50) : [];
            this.state.series = Array.isArray(seriesData) ? seriesData.slice(0, 50) : [];
            return true;
        } catch (error) {
            console.error("فشل الاتصال بالسيرفر، جاري تشغيل داتا تجريبية:", error);
            this.loadDemoData();
            return false;
        }
    },

    loadDemoData() {
        this.state.live = [{ id: 1, name: "قناة تجريبية مباشر", stream_icon: "", type: "live" }];
        this.state.movies = [{ id: 2, name: "فيلم تجريبي", stream_icon: "", type: "movie" }];
        this.state.series = [{ id: 3, name: "مسلسل تجريبي", stream_icon: "", type: "series" }];
    }
};
