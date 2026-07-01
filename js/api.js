// =====================================================
// VISION TV - ENGINE CORE API (مع الحساب الافتراضي المدمج)
// =====================================================

const VisionAPI = {
    state: {
        live: [],
        movies: [],
        series: [],
        playlists: []
    },

    // تحميل الاشتراكات مع وضع حسابك كخيار افتراضي لو القائمة فارغة
    loadPlaylists() {
        const stored = JSON.parse(localStorage.getItem("vision_playlists")) || [];
        
        if (stored.length === 0) {
            // دمج حسابك تلقائياً كأول سيرفر أساسي في النظام
            const defaultServer = {
                id: 112233,
                name: "hydra",
                user: "hosam06",
                pass: "9182530",
                url: "http://hyprime.cc:80"
            };
            this.state.playlists = [defaultServer];
            localStorage.setItem("vision_playlists", JSON.stringify(this.state.playlists));
        } else {
            this.state.playlists = stored;
        }
        return this.state.playlists;
    },

    savePlaylist(name, user, pass, host) {
        if (!name || !user || !pass || !host) return false;
        
        // تنظيف الرابط للتأكد من صياغته
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
        return true;
    },

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

    // جلب البيانات مع فك تشفير وتخطي حماية الامان لروابط الـ HTTP
    async fetchXtreamData(server) {
        this.clearContent();
        
        let cleanHost = server.url.endsWith('/') ? server.url.slice(0, -1) : server.url;
        const apiBase = `${cleanHost}/player_api.php?username=${server.user}&password=${server.pass}`;
        
        console.log("جاري الاتصال المباشر بالسيرفر المدمج لحسام شحاتة:", apiBase);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // مهلة 10 ثوانٍ

            const [liveData, moviesData, seriesData] = await Promise.all([
                fetch(`${apiBase}&action=get_live_streams`, { signal: controller.signal }).then(r => r.json()).catch(() => []),
                fetch(`${apiBase}&action=get_vod_streams`, { signal: controller.signal }).then(r => r.json()).catch(() => []),
                fetch(`${apiBase}&action=get_series`, { signal: controller.signal }).then(r => r.json()).catch(() => [])
            ]);

            clearTimeout(timeoutId);

            // تحويل داتا السيرفر إلى الصيغة البرمجية لـ Vision TV والتأكد من جلب الأيقونات
            if (Array.isArray(liveData) || Array.isArray(moviesData) || Array.isArray(seriesData)) {
                
                this.state.live = Array.isArray(liveData) ? liveData.slice(0, 150).map(i => ({
                    id: i.stream_id,
                    name: i.name,
                    stream_icon: i.stream_icon,
                    type: "live",
                    url: `${cleanHost}/live/${server.user}/${server.pass}/${i.stream_id}.ts`
                })) : [];

                this.state.movies = Array.isArray(moviesData) ? moviesData.slice(0, 150).map(i => ({
                    id: i.stream_id,
                    name: i.name,
                    stream_icon: i.stream_icon,
                    type: "movie",
                    url: `${cleanHost}/movie/${server.user}/${server.pass}/${i.stream_id}.mp4`
                })) : [];

                this.state.series = Array.isArray(seriesData) ? seriesData.slice(0, 150).map(i => ({
                    id: i.series_id,
                    name: i.name,
                    stream_icon: i.cover,
                    type: "series"
                })) : [];

                console.log(`تم بنجاح تحميل: ${this.state.live.length} قناة، ${this.state.movies.length} فيلم.`);
                return true;
            }
            
            this.loadDemoData();
            return false;
        } catch (error) {
            console.error("فشل الاتصال التام بالخادم الافتراضي:", error);
            this.loadDemoData();
            return false;
        }
    },

    loadDemoData() {
        this.state.live = [{ id: 1, name: "قناة Hydra التجريبية (تحقق من الاتصال بالشاشة)", stream_icon: "", type: "live", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }];
        this.state.movies = [{ id: 2, name: "فيلم Hydra التجريبي", stream_icon: "", type: "movie", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8" }];
        this.state.series = [{ id: 3, name: "مسلسل Hydra التجريبي", stream_icon: "", type: "series" }];
    }
};
