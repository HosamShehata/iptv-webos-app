document.addEventListener("DOMContentLoaded", () => {
    const nameInput = document.getElementById("prof-name");
    const userInput = document.getElementById("prof-username");
    const passInput = document.getElementById("prof-password");
    const hostInput = document.getElementById("server-url");
    const saveBtn   = document.getElementById("save-profile-btn");
    const statusDiv = document.getElementById("status");
    const channelsList = document.getElementById("channels-list");

    // فحص تلقائي: هل توجد بلاليست محفوظة بنظام المصدر؟
    const savedProfile = PlaylistManager.getActiveProfile();
    if (savedProfile) {
        statusDiv.innerText = `تم العثور على البلاليست المحفوظة: ${savedProfile.name}. جاري تحميل القنوات...`;
        runPipeline(savedProfile);
    }

    // عند الضغط على زر الحفظ والتوصيل
    saveBtn.addEventListener("click", () => {
        const host = hostInput.value.trim();
        const username = userInput.value.trim();
        const password = passInput.value.trim();
        const name = nameInput.value.trim() || "My IPTV Profile";

        if (!host || !username || !password) {
            statusDiv.innerText = "تنبيه: يرجى إدخال البيانات كاملة أولاً!";
            return;
        }

        // حفظ البيانات بنفس أسلوب المصدر
        PlaylistManager.saveProfile(host, username, password, name);
        statusDiv.innerText = "تم الحفظ والتسجيل بنجاح! جاري اختبار التوصيل الذكي بالخادم...";
        
        const currentProfile = PlaylistManager.getActiveProfile();
        runPipeline(currentProfile);
    });

    // تشغيل خط معالجة البيانات وسحب القنوات
    function runPipeline(profile) {
        channelsList.innerHTML = "<li>جاري فحص المنافذ وبروتوكولات الـ SSL للشاشة...</li>";
        
        PlaylistManager.xtreamLoginCheck(profile)
            .then(loginResult => {
                if (!loginResult) {
                    statusDiv.innerText = "خطأ: فشل الاتصال بالسيرفر. تأكد من صحة البيانات أو قيود الشبكة بالشاشة.";
                    channelsList.innerHTML = "<li>تعذر جلب القنوات بسبب فشل تسجيل الدخول.</li>";
                    return;
                }

                statusDiv.innerText = "نجح تسجيل الدخول وتحديد المنفذ الآمن الشغال! جاري جلب القنوات الحية...";
                
                // جلب القنوات بالاعتماد على المنفذ الذي نجح الفحص به فعلياً
                return PlaylistManager.fetchLiveStreams(loginResult.workingHost, profile.username, profile.password);
            })
            .then(channels => {
                if (!channels) return;
                
                channelsList.innerHTML = "";
                if (channels.length === 0) {
                    statusDiv.innerText = "تم الاتصال بالسيرفر بنجاح، ولكن البلاليست الحالية فارغة تماماً.";
                    return;
                }

                statusDiv.innerText = `مبروك! البلاليست سمعت بنجاح كامل. تم سحب ${channels.length} قناة بنجاح.`;
                
                // تخزين القنوات في الـ Cache الموحد للتطبيق لضمان عمل الواجهات الأخرى (مثل livetv.html) تلقائياً
                try {
                    const slimCache = channels.slice(0, 100).map(ch => ({ stream_id: ch.stream_id, name: ch.name, category_id: ch.category_id }));
                    localStorage.setItem("iptv_ch_v2", JSON.stringify({ ts: Date.now(), data: slimCache }));
                } catch (_) {}

                // عرض عينة من أول 20 قناة للتأكد العيني المباشر من نجاح الأكواد
                channels.slice(0, 20).forEach(channel => {
                    const item = document.createElement("li");
                    item.innerText = channel.name || `قناة: ${channel.stream_id}`;
                    channelsList.appendChild(item);
                });
            })
            .catch(err => {
                statusDiv.innerText = "حدث خطأ غير متوقع أثناء معالجة طلبات الـ API.";
                channelsList.innerHTML = "<li>خطأ في معالجة الشبكة</li>";
                console.error(err);
            });
    }
});
