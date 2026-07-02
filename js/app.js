document.addEventListener("DOMContentLoaded", () => {
    const nameInput = document.getElementById("prof-name");
    const userInput = document.getElementById("prof-username");
    const passInput = document.getElementById("prof-password");
    const hostInput = document.getElementById("server-url");
    const saveBtn   = document.getElementById("save-profile-btn");
    const statusDiv = document.getElementById("status");
    const channelsList = document.getElementById("channels-list");

    // فحص تلقائي عند فتح التطبيق
    const activeProfile = PlaylistManager.getActiveProfile();
    if (activeProfile) {
        statusDiv.innerText = `تم العثور على بلاليست مخزنة: ${activeProfile.name}. جاري الاتصال المباشر...`;
        startPipeline(activeProfile);
    }

    // عند الضغط على زر التثبيت والتوصيل
    saveBtn.addEventListener("click", () => {
        const host = hostInput.value.trim();
        const username = userInput.value.trim();
        const password = passInput.value.trim();
        const name = nameInput.value.trim() || "My IPTV Profile";

        if (!host || !username || !password) {
            statusDiv.innerText = "تنبيه: يرجى كتابة البيانات كاملة أولاً!";
            return;
        }

        // حفظ البيانات بنظام المصدر المفتوح لضمان استجابة الشاشة
        PlaylistManager.saveProfile(host, username, password, name);
        statusDiv.innerText = "تم حفظ الإعدادات، جاري الفحص الذكي للروابط والتوصيل الخارجي...";
        
        const currentProfile = PlaylistManager.getActiveProfile();
        startPipeline(currentProfile);
    });

    // تشغيل نظام المعالجة وجلب القنوات
    function startPipeline(profile) {
        channelsList.innerHTML = "<li>جاري فحص بروتوكولات الأمان للشبكة...</li>";
        
        PlaylistManager.xtreamLoginCheck(profile)
            .then(loginResult => {
                if (!loginResult) {
                    statusDiv.innerText = "فشل الاتصال: السيرفر لا يستجيب أو تم رفض شهادة الـ SSL من متصفح التلفزيون.";
                    channelsList.innerHTML = "<li>تعذر تحميل القنوات.</li>";
                    return;
                }

                statusDiv.innerText = "نجح تسجيل الدخول وتجاوز قيود الحظر! جاري سحب القنوات الحية الحالية...";
                
                // سحب القنوات عبر الرابط الناجح فعلياً
                return PlaylistManager.fetchLiveStreams(loginResult.workingHost, profile.username, profile.password);
            })
            .then(channels => {
                if (!channels) return;
                
                channelsList.innerHTML = "";
                if (channels.length === 0) {
                    statusDiv.innerText = "نجح الاتصال، ولكن ملف البلاليست هذا لا يحتوي على أي قنوات حية حالياً.";
                    return;
                }

                statusDiv.innerText = `رائع جداً! البلاليست سمعت بنجاح كامل وتم جلب ${channels.length} قناة.`;
                
                // حفظ عينة الكاش المعتمدة في الأكواد الأصلية لتسريع الواجهات الأخرى تلقائياً
                try {
                    const slimCache = channels.slice(0, 100).map(ch => ({ stream_id: ch.stream_id, name: ch.name, category_id: ch.category_id }));
                    localStorage.setItem("iptv_ch_v2", JSON.stringify({ ts: Date.now(), data: slimCache }));
                } catch (_) {}

                // عرض عينة من أول 20 قناة للتأكد الفوري من عمل الكود
                channels.slice(0, 20).forEach(channel => {
                    const item = document.createElement("li");
                    item.innerText = channel.name || `قناة: ${channel.stream_id}`;
                    channelsList.appendChild(item);
                });
            })
            .catch(err => {
                statusDiv.innerText = "خطأ: حدثت مشكلة أثناء معالجة استجابة الـ API للشبكة.";
                channelsList.innerHTML = "<li>خطأ في المعالجة الخادم</li>";
                console.error(err);
            });
    }
});
