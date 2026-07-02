document.addEventListener("DOMContentLoaded", function() {
    var nameInput = document.getElementById("prof-name");
    var userInput = document.getElementById("prof-username");
    var passInput = document.getElementById("prof-password");
    var hostInput = document.getElementById("server-url");
    var saveBtn   = document.getElementById("save-profile-btn");
    var statusDiv = document.getElementById("status");
    var channelsList = document.getElementById("channels-list");

    // الفحص التلقائي عند فتح التطبيق
    var savedProfile = PlaylistManager.getActiveProfile();
    if (savedProfile) {
        if (statusDiv) statusDiv.innerText = "Loading config from profile: " + savedProfile.name + "…";
        executeAppPipeline(savedProfile);
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", function() {
            var host = hostInput ? hostInput.value.trim() : "";
            var username = userInput ? userInput.value.trim() : "";
            var password = passInput ? passInput.value.trim() : "";
            var name = nameInput ? nameInput.value.trim() : "My IPTV Service";

            if (!host || !username || !password) {
                if (statusDiv) statusDiv.innerText = "تنبيه: يرجى ملء الحقول المطلوبة أولاً!";
                return;
            }

            // حفظ البروفايل أولاً بنظام الكور
            PlaylistManager.saveProfile(host, username, password, name);
            if (statusDiv) statusDiv.innerText = "Logging in…";

            var currentProfile = PlaylistManager.getActiveProfile();
            executeAppPipeline(currentProfile);
        });
    }

    function executeAppPipeline(profile) {
        if (!channelsList) return;
        channelsList.innerHTML = "<li>Fetching channels…</li>";

        // بناء كائن الإعدادات بنفس تركيبة المصدر تماماً لتفادي الـ Crash
        var loginCfg = {
            server_urls: profile.server_urls,
            username: profile.username,
            password: profile.password
        };

        PlaylistManager.xtreamLogin(loginCfg, function(workingHost, loginData) {
            if (statusDiv) statusDiv.innerText = "Fetching channels…";

            PlaylistManager.xtreamGetLiveChannels(workingHost, profile.username, profile.password, function(channels) {
                channelsList.innerHTML = "";
                
                if (channels.length === 0) {
                    if (statusDiv) statusDiv.innerText = "ERR: 0 channels returned from server";
                    return;
                }

                if (statusDiv) statusDiv.innerText = channels.length + " channels loaded successfully!";

                // كتابة الكاش لحفظ الأداء
                try {
                    var slimCache = channels.map(function(ch) {
                        return { stream_id: ch.stream_id, name: ch.name, category_id: ch.category_id };
                    });
                    localStorage.setItem("iptv_ch_v2", JSON.stringify({ ts: Date.now(), data: slimCache }));
                } catch (_) {}

                // عرض القنوات
                var preview = channels.slice(0, 20);
                for (var i = 0; i < preview.length; i++) {
                    var li = document.createElement("li");
                    li.innerText = preview[i].name || "Unnamed Stream";
                    li.style.padding = "6px";
                    li.style.borderBottom = "1px solid #333";
                    channelsList.appendChild(li);
                }

            }, function(chanError) {
                if (statusDiv) statusDiv.innerText = chanError;
                channelsList.innerHTML = "<li>" + chanError + "</li>";
            });

        }, function(loginError) {
            if (statusDiv) statusDiv.innerText = loginError;
            channelsList.innerHTML = "<li>Login Failed. Check server URL.</li>";
        });
    }
});
