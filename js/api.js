// دالة بناء الـ Authentication والروابط المطابقة للمصدر الأصلي تماماً
function _auth(cfg) {
    return "username=" + encodeURIComponent(cfg.username) +
           "&password=" + encodeURIComponent(cfg.password);
}

var PlaylistManager = {
    // التخزين بنظام البروفايل الأصلي ليتعرف عليه البرنامج والمشغل تلقائياً
    saveProfile: function(host, username, password, name) {
        var profileId = "prof_" + Date.now().toString(36);
        var profileData = [{
            id: profileId,
            type: "xtream",
            server_urls: [host.replace(/\/+$/, "")], // المصدر يتوقعها مصفوفة دائماً
            username: username,
            password: password,
            name: name
        }];
        localStorage.setItem('iptv_profiles', JSON.stringify(profileData));
        localStorage.setItem('iptv_active_profile', JSON.stringify(profileId));
        localStorage.setItem('iptv_source_type', JSON.stringify("xtream"));
    },

    // استرجاع البروفايل المحفوظ
    getActiveProfile: function() {
        try {
            var profiles = JSON.parse(localStorage.getItem('iptv_profiles'));
            if (profiles && profiles.length) return profiles[0];
        } catch (_) {}
        return null;
    },

    // دالة تسجيل الدخول المنقولة والمطابقة لـ xtreamLogin في المصدر
    xtreamLogin: function(cfg, onSuccess, onError) {
        // التأكد من تحويل الروابط إلى مصفوفة تماماً مثل المصدر الأصلي
        var entered = cfg.server_urls && cfg.server_urls.length ? cfg.server_urls : [cfg.server_url];
        var urls = [];
        
        for (var i = 0; i < entered.length; i++) {
            var u = entered[i];
            if (u) {
                urls.push(u);
                if (/^https:/i.test(u)) {
                    var alt = u.replace(/^https:/i, "http:");
                    if (urls.indexOf(alt) === -1) urls.push(alt);
                }
            }
        }

        var currentIndex = 0;
        function tryNextUrl() {
            if (currentIndex >= urls.length) {
                onError("ERR: Login failed — check credentials");
                return;
            }

            var currentUrl = urls[currentIndex];
            var baseClean = currentUrl.replace(/\/+$/, "");
            var testUrl = baseClean + "/player_api.php?" + _auth({ username: cfg.username, password: cfg.password });

            var xhr = new XMLHttpRequest();
            xhr.open("GET", testUrl, true);
            xhr.timeout = 12000;

            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        var result = JSON.parse(xhr.responseText);
                        // الفحص الأصلي للمصدر للتأكد من نجاح تسجيل الدخول
                        if (result && (result.user_info || result.auth === 1)) {
                            localStorage.setItem('iptv_active_resolved_url', JSON.stringify(baseClean));
                            onSuccess(baseClean, result);
                        } else {
                            currentIndex++;
                            tryNextUrl();
                        }
                    } catch (e) {
                        currentIndex++;
                        tryNextUrl();
                    }
                } else {
                    currentIndex++;
                    tryNextUrl();
                }
            };

            xhr.onerror = function() { currentIndex++; tryNextUrl(); };
            xhr.ontimeout = function() { currentIndex++; tryNextUrl(); };
            xhr.send();
        }

        tryNextUrl();
    },

    // دالة سحب القنوات الحية الأصلية (get_live_streams)
    xtreamGetLiveChannels: function(workingHost, username, password, onSuccess, onError) {
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
                } catch(e) {
                    onError("ERR: Error parsing channels data");
                }
            } else {
                onError("ERR: Server returned status " + xhr.status);
            }
        };
        xhr.onerror = function() { onError("ERR: Network error fetching streams"); };
        xhr.send();
    }
};
