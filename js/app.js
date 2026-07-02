document.addEventListener("DOMContentLoaded", function() {
    var nameInput = document.getElementById("prof-name");
    var userInput = document.getElementById("prof-username");
    var passInput = document.getElementById("prof-password");
    var hostInput = document.getElementById("server-url");
    var saveBtn   = document.getElementById("save-profile-btn");
    var statusDiv = document.getElementById("status");
    var channelsList = document.getElementById("channels-list");

    // الفحص التلقائي عند فتح الواجهة
    var savedProfile = PlaylistManager.getActiveProfile();
    if (savedProfile) {
        statusDiv.innerText = "تم العثور على بروفايل محفوظ: " + savedProfile.name + ". جاري جلب القنوات...";
        startPipeline(savedProfile);
    }

    // تشغيل الأحداث عند الضغط على زر الحفظ والتوصيل
    if (saveBtn) {
        saveBtn.addEventListener("click", function() {
            var host = hostInput.value.trim();
            var username = userInput.value.trim();
            var password = passInput.value.trim();
            var name = nameInput.value.trim() || "My IPTV";

            if (!host || !username || !password) {
                statusDiv.innerText = "تنبيه: يرجى كتابة البيانات كاملة أولاً!";
                return;
            }

            // الحفظ بالنظام الموحد
            PlaylistManager.saveProfile(host, username, password, name);
            statusDiv.innerText = "جاري الاتصال واختبار منافذ الخادم...";

            var currentProfile = PlaylistManager.getActiveProfile();
            startPipeline(currentProfile);
        });
    }

    // بدء خط المعالجة وسحب البيانات
    function startPipeline(profile) {
        if (!channelsList) return;
        channelsList.innerHTML = "<li>جاري فحص بروتوكولات الأمان والربط...</li>";

        PlaylistManager.xtreamLoginCheck(profile, function(workingHost, loginInfo) {
            // في حال نجاح تسجيل الدخول
            statusDiv.innerText = "نجح الاتصال! جاري الآن سحب القنوات المباشرة قيد التشغيل...";

            PlaylistManager.fetchLiveStreams(workingHost, profile.username, profile.password, function(channels) {
                channelsList.innerHTML = "";
                if (channels.length === 0) {
                    statusDiv.innerText = "نجح التوصيل، ولكن البلاليست لا تحتوي على قنوات حية حالياً.";
                    return;
                }

                statusDiv.innerText = "رائع! البلاليست سمعت بنجاح. تم جلب " + channels.length + " قناة.";

                // عمل كاش محلي مخفف لمزامنة باقي الواجهات
                try {
                    var slimCache = channels.slice(0, 50).map(function(ch) {
                        return { stream_id: ch.stream_id, name: ch.name, category_id: ch.category_id };
                    });
                    localStorage.setItem("iptv_ch_v2", JSON.stringify({ ts: Date.now(), data: slimCache }));
                } catch (_) {}

                // عرض عينة من أول 20 قناة للتأكد العيني المباشر من التشغيل
                var previewList = channels.slice(0, 20);
                for (var i = 0; i < previewList.length; i++) {
                    var item = document.createElement("li");
                    item.innerText = previewList[i].name || "قناة مجهولة";
                    channelsList.appendChild(item);
                }

            }, function(chanError) {
                statusDiv.innerText = chanError;
                channelsList.innerHTML = "<li>تعذر تحميل القنوات المباشرة.</li>";
            });

        }, function(loginError) {
            // في حال فشل تسجيل الدخول
            statusDiv.innerText = loginError;
            channelsList.innerHTML = "<li>فشل الاتصال بالسيرفر.</li>";
        });
    }
});
