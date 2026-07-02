document.addEventListener("DOMContentLoaded", function() {
    var nameInput = document.getElementById("prof-name");
    var userInput = document.getElementById("prof-username");
    var passInput = document.getElementById("prof-password");
    var hostInput = document.getElementById("server-url");
    var saveBtn   = document.getElementById("save-profile-btn");
    var statusDiv = document.getElementById("status");
    var channelsList = document.getElementById("channels-list");

    // الفحص والتشغيل التلقائي عند فتح التطبيق إذا كان هناك سيرفر مسجل سابقاً
    var savedProfile = PlaylistManager.getActiveProfile();
    if (savedProfile) {
        statusDiv.innerText = "Loading config from profile: " + savedProfile.name + "…";
        executeAppPipeline(savedProfile);
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", function() {
            var host = hostInput ? hostInput.value.trim() : "";
            var username = userInput ? userInput.value.trim() : "";
            var password = passInput ? passInput.value.trim() : "";
            var name = nameInput ? nameInput.value.trim() : "My IPTV Service";

            if (!host || !username || !password) {
                statusDiv.innerText = "تنبيه: يرجى ملء الحقول المطلوبة أولاً!";
                return;
            }

            // المزامنة والحفظ بنظام المصدر الموحد
            PlaylistManager.saveProfile(host, username, password, name);
            statusDiv.innerText = "Logging in…";

            var currentProfile = PlaylistManager.getActiveProfile();
            executeAppPipeline(currentProfile);
        });
    }

    // خط المعالجة التنفيذي المتطابق مع منطق المصدر الأصلي
    function executeAppPipeline(profile) {
        if (!channelsList) return;
        channelsList.innerHTML = "<li>Fetching channels…</li>";

        var loginCfg = {
            server_url: profile.server_urls[0],
            username: profile.username,
            password: profile.password
        };

        // 1. استدعاء فحص تسجيل الدخول القياسي للمصدر
        PlaylistManager.xtreamLogin(loginCfg, function(workingHost, loginData) {
            statusDiv.innerText = "Fetching channels…";

            // 2. عند النجاح، نقوم بسحب دفق القنوات الحية مباشرة
            PlaylistManager.xtreamGetLiveChannels(workingHost, profile.username, profile.password, function(channels) {
                channelsList.innerHTML = "";
                
                if (channels.length === 0) {
                    statusDiv.innerText = "ERR: 0 channels returned from server";
                    return;
                }

                statusDiv.innerText = channels.length + " channels loaded successfully!";

                // 3. كتابة حزمة الكاش الـ Slim لحفظ ذاكرة شاشات LG للتطبيقات الأخرى
                try {
                    var slimCache = channels.map(function(ch) {
                        return { stream_id: ch.stream_id, name: ch.name, category_id: ch.category_id };
                    });
                    localStorage.setItem("iptv_ch_v2", JSON.stringify({ ts: Date.now(), data: slimCache }));
                } catch (_) {}

                // 4. عرض أول 20 قناة فوراً للتأكد التام أن البلاليست سمعت وتعمل
                var preview = channels.slice(0, 20);
                for (var i = 0; i < preview.length; i++) {
                    var li = document.createElement("li");
                    li.innerText = preview[i].name || "Unnamed Stream";
                    li.style.padding = "6px";
                    li.style.borderBottom = "1px solid #333";
                    channelsList.appendChild(li);
                }

            }, function(chanError) {
                statusDiv.innerText = chanError;
                channelsList.innerHTML = "<li>" + chanError + "</li>";
            });

        }, function(loginError) {
            statusDiv.innerText = loginError;
            channelsList.innerHTML = "<li>Login Failed. Check server URL.</li>";
        });
    }
});
