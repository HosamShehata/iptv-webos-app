// دالة الجلب المأخوذة من المصدر مع معالجة الـ Timeout والأخطاء
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
    // 1. التخزين بنظام البروفايلات الموحد ليتوافق مع طريقة قراءة المصدر
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

    // 2. استرجاع البروفايل النشط
    getActiveProfile() {
        try {
            const profiles = JSON.parse(localStorage.getItem('iptv_profiles'));
            if (profiles && profiles.length) return profiles[0];
        } catch (_) {}
        return null;
    },

    // 3. دالة فحص الروابط الذكية (تحول الـ https لـ http تلقائياً لحل مشكلة شاشة LG)
    async xtreamLoginCheck(profile) {
        const enteredHost = profile.server_urls[0];
        const urls = [enteredHost];
        if (/^https:/i.test(enteredHost)) {
            urls.push(enteredHost.replace(/^https:/i, "http:"));
        }

        for (const url of urls) {
            try {
                const baseClean = url.replace(/\/+$/, "");
                const authSign = `username=${encodeURIComponent(profile.username)}&password=${encodeURIComponent(profile.password)}`;
                const result = await _fetchJSON(`${baseClean}/player_api.php?${authSign}`, 12000);
                if (result) {
                    // حفظ الرابط الشغال الفعلي بالشاشة لتفادي مشاكل الحجب
                    localStorage.setItem('iptv_active_resolved_url', JSON.stringify(baseClean));
                    return { workingHost: baseClean, info: result };
                }
            } catch (_) {}
        }
        return null;
    },

    // 4. دالة جلب القنوات الحيّة الأصلية get_live_streams من المصدر
    async fetchLiveStreams(workingHost, username, password) {
        const authSign = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
        const url = `${workingHost}/player_api.php?${authSign}&action=get_live_streams`;
        const data = await _fetchJSON(url, 15000);
        return Array.isArray(data) ? data : (data?.data || []);
    }
};
