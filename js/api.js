// دالة الـ Fetch الذكية المأخوذة من المصدر للتعامل مع المتصفحات القديمة والحديثة للشاشات
async function _fetchJSON(url, timeoutMs) {
    if (timeoutMs === undefined) timeoutMs = 12000;
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const r = await fetch(url, { signal: ctrl.signal });
        clearTimeout(tid);
        if (!r.ok) throw new Error("HTTP " + r.status);
        return await r.json();
    } catch (err) {
        clearTimeout(tid);
        throw err;
    }
}

const PlaylistManager = {
    // محاكاة طريقة المصدر الأصلي بحفظ البيانات داخل كائن "iptv_profiles"
    saveProfile(host, username, password, name) {
        const profileId = "prof_" + Date.now().toString(36);
        const profileData = [{
            id: profileId,
            type: "xtream",
            server_urls: [host.replace(/\/+$/, "")],
            username: username,
            password: password,
            name: name
        }];
        
        localStorage.setItem('iptv_profiles', JSON.stringify(profileData));
        localStorage.setItem('iptv_active_profile', JSON.stringify(profileId));
        localStorage.setItem('iptv_source_type', JSON.stringify("xtream"));
    },

    // جلب البروفايل المخزن
    getActiveProfile() {
        try {
            const profiles = JSON.parse(localStorage.getItem('iptv_profiles'));
            if (profiles && profiles.length) return profiles[0];
        } catch (_) {}
        return null;
    },

    // دالة الفحص الذكي لتسجيل الدخول وتفادي حظر الـ SSL على الشاشة (من ملف xtream.js الأصلي)
    async xtreamLoginCheck(profile) {
        const enteredHost = profile.server_urls[0];
        const urls = [enteredHost];
        
        // إذا كان الرابط يدعم https، نضيف بديل http للحماية من رفض متصفح LG لشفرة الحماية
        if (/^https:/i.test(enteredHost)) {
            urls.push(enteredHost.replace(/^https:/i, "http:"));
        }

        for (const url of urls) {
            try {
                const baseClean = url.replace(/\/+$/, "");
                const authSign = `username=${encodeURIComponent(profile.username)}&password=${encodeURIComponent(profile.password)}`;
                const result = await _fetchJSON(`${baseClean}/player_api.php?${authSign}`, 12000);
                if (result) {
                    // تخزين الرابط الفعلي الناجح ليعتمد عليه محرك التطبيق الأساسي
                    localStorage.setItem('iptv_active_resolved_url', JSON.stringify(baseClean));
                    return { workingHost: baseClean, info: result };
                }
            } catch (_) {}
        }
        return null;
    },

    // دالة سحب القنوات الحية الأصلية المتوافقة تماماً مع جلب السيرفرات (get_live_streams)
    async fetchLiveStreams(workingHost, username, password) {
        const authSign = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
        const url = `${workingHost}/player_api.php?${authSign}&action=get_live_streams`;
        const data = await _fetchJSON(url, 15000);
        return Array.isArray(data) ? data : (data?.data || []);
    }
};
