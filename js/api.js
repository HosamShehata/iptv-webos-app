// =====================================================
// VISION TV - ENGINE CORE API (تخطي حظر الشاشات الذكية)
// =====================================================

const VisionAPI = {
    state: {
        live: [],
        movies: [],
        series: [],
        playlists: []
    },

    loadPlaylists() {
        const stored = JSON.parse(localStorage.getItem("vision_playlists")) || [];
        if (stored.length === 0) {
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
        if (!host.startsWith("http://") && !host.startsWith("https://")) {
            host = "http://" + host;
        }
        const newPlaylist = { id: Date.now(), name, user, pass, url: host };
        this.state.playlists.push(newPlaylist);
        localStorage.setItem("vision_playlists", JSON.stringify(this.state.playlists));
        return true;
    },

    deletePlaylist(id) {
        this.state.playlists = this.state.playlists.filter(p => p.id !== id);
        localStorage.setItem("vision_playlists", JSON.stringify(this.state.playlists));
        if (this.state.playlists.length === 0) this.clearContent();
    },

    clearContent() {
        this.state.live = [];
        this.state.movies = [];
        this.state.series = [];
    },

    // جلب البيانات مع كسر الحماية وتخطي الـ CORS والمحتوى المختلط
    async fetchXtreamData(server) {
        this.clearContent();
        
        let cleanHost = server.url.endsWith('/') ? server.url.slice(0, -1) : server.url;
        const targetUrl = `${cleanHost}/player_api.php?username=${server.user}&password=${server.pass}`;
        
        // استخدام بروكسب ذكي ومفتوح لتغليف الطلب بعبارة https آمنة تتخطى قيود متصفح LG
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        
        console.log("جاري كسر حظر الشاشة والاتصال بسيرفر Hydra عبر الممر الآمن...");

        try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 15000); // مهلة اتصال 15 ثانية

            // طلب البيانات وتفكيك تغليف البروكسي
            const response = await fetch(proxyUrl, { signal: controller.signal });
            const result = await response.json();
            
            // تحويل النص الراجع إلى كائن JSON فعلي لقنوات الـ IPTV
            const accountData = JSON.parse(result.contents);

            // الآن نقوم بسحب الأقسام الفعلية للسيرفر (Live / Movies / Series) عبر البروكسي التتابعي
            const [liveRes, moviesRes, seriesRes] = await Promise.all([
                fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl + "&action=get_live_streams")}`).then(r => r.json()).catch(() => ({contents:"[]"})),
                fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl + "&action=get_vod_streams")}`).then(r => r.json()).catch(() => ({contents:"[]"})),
                fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl + "&action=get_series")}`).then(r => r.json()).catch(() => ({contents:"[]"}))
            ]);

            const liveData = JSON.parse(liveRes.contents);
            const moviesData = JSON.parse(moviesRes.contents);
            const seriesData = JSON.parse(seriesRes.contents);

            if (Array.isArray(liveData) && liveData.length > 0) {
                // تحويل أول 150 قناة وفيلم للعرض الفوري السريع لضمان كفاءة الذاكرة للشاشة
                this.state.live = liveData.slice(0, 150).map(i => ({
                    id: i.stream_id,
                    name: i.name,
                    stream_icon: i.stream_icon,
                    type: "live",
                    url: `${cleanHost}/live/${server.user}/${server.pass}/${i.stream_id}.ts`
                }));

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

                console.log("تم كسر الحظر بنجاح! السيرفر يعمل الآن ومستعد لعرض المحتوى.");
                return true;
            }
            
            this.loadDemoData();
            return false;
        } catch (error) {
            console.error("فشل العبور عبر البروكسي الآمن، جاري العودة للوضع الاحتياطي الشغال:", error);
            this.loadDemoData();
            return false;
        }
    },

    loadDemoData() {
        this.state.live = [{ id: 1, name: "خطأ بالشبكة أو الحساب: تأكد من تفعيل الإنترنت على الشاشة", stream_icon: "", type: "live", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }];
        this.state.movies = [{ id: 2, name: "فيلم Hydra السينمائي الاحتياطي", stream_icon: "", type: "movie", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8" }];
        this.state.series = [];
    }
};
