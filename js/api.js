// كائن إدارة البلاليست بصيغة متوافقة 100% مع شاشات LG القديمة والحديثة
var PlaylistManager = {
    
    // 1. التخزين بنظام البروفايلات المتوافق مع المصدر
    saveProfile: function(host, username, password, name) {
        var profileId = "prof_" + Date.now().toString(36);
        var profileData = [{
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

    // 2. استرجاع البروفايل
    getActiveProfile: function() {
        try {
            var profiles = JSON.parse(localStorage.getItem('iptv_profiles'));
            if (profiles && profiles.length) return profiles[0];
        } catch (_) {}
        return null;
    },

    // 3. دالة فحص وتوصيل السيرفر باستخدام XHR التقليدي (بدون Fetch أو Async) لضمان عمل الزر
    xtreamLoginCheck: function(profile, onSuccess, onError) {
        var cleanHost = profile.server_urls[0].replace(/\/+$/, "");
        var authSign = "username=" + encodeURIComponent(profile.username) + "&password=" + encodeURIComponent(profile.password);
        var url = cleanHost + "/player_api.php?" + authSign;

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.timeout = 15000;

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var result = JSON.parse(xhr.responseText);
                    localStorage.setItem('iptv_active_resolved_url', JSON.stringify(cleanHost));
                    onSuccess(cleanHost, result);
                } catch (e) {
                    onError("خطأ في قراءة بيانات السيرفر (JSON Parse)");
                }
            } else {
                onError("السيرفر أعاد استجابة خاطئة: " + xhr.status);
            }
        };

        xhr.onerror = function() {
            // إذا فشل الـ HTTPS أو حدثت مشكلة أمان، نحاول عبر HTTP الصافي كما يفعل المصدر
            if (cleanHost.indexOf("https:") === 0) {
                var fallbackHost = cleanHost.replace("https:", "http:");
                var fallbackUrl = fallbackHost + "/player_api.php?" + authSign;
                var fallbackXhr = new XMLHttpRequest();
                fallbackXhr.open("GET", fallbackUrl, true);
                fallbackXhr.timeout = 15000;
                fallbackXhr.onload = function() {
                    if (fallbackXhr.status >= 200 && fallbackXhr.status < 300) {
                        try {
                            var res = JSON.parse(fallbackXhr.responseText);
                            localStorage.setItem('iptv_active_resolved_url', JSON.stringify(fallbackHost));
                            onSuccess(fallbackHost, res);
                        } catch(e) { onError("خطأ في قراءة البيانات."); }
                    } else { onError("فشل الاتصال التلقائي."); }
                };
                fallbackXhr.onerror = function() { onError("تعذر الاتصال بالسيرفر، تأكد من الروابط."); };
                fallbackXhr.send();
            } else {
                onError("فشل الاتصال بالشبكة، تأكد من الرابط.");
            }
        };

        xhr.ontimeout = function() { onError("انتهت مهلة الاتصال بالسيرفر (Timeout)."); };
        xhr.send();
    },

    // 4. دالة جلب القنوات الحيّة الفعليّة (get_live_streams) المأخوذة من المصدر
    fetchLiveStreams: function(workingHost, username, password, onSuccess, onError) {
        var authSign = "username=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(password);
        var url = workingHost + "/player_api.php?" + authSign + "&action=get_live_streams";

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.timeout = 20000;

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    var channels = Array.isArray(data) ? data : (data && data.data || []);
                    onSuccess(channels);
                } catch(e) { onError("خطأ في معالجة القنوات الحية."); }
            } else {
                onError("خطأ سيرفر رقم: " + xhr.status);
            }
        };
        xhr.onerror = function() { onError("خطأ في سحب القنوات الحية."); };
        xhr.send();
    }
};
