// ============================================
// VISION TV - ADVANCED PLAYER ENGINE
// ============================================

let video = document.getElementById("video");
let fillBar = document.getElementById("fill-bar");
let knob = document.getElementById("progress-knob");
let currTimeLbl = document.getElementById("current-time");
let totalTimeLbl = document.getElementById("total-time");
let playIcon = document.getElementById("icon-play");
let controlsPanel = document.getElementById("controls-panel");

let mediaItem = JSON.parse(localStorage.getItem("current")) || {};
let seekStep = parseInt(localStorage.getItem("global_seek_duration")) || 10;

let osdTimer;
let isDragging = false;
let playerInstance;

function initPlayer() {
    // تعيين عنوان المقطع
    document.getElementById("player-title").innerText = mediaItem.name || "VISION TV";
    document.getElementById("seek-lbl-osd").innerText = seekStep + "s";
    
    // تحديث الأزرار الرسومية بناءً على خيار القفز الزمني المحدد
    document.getElementById("btn-rewind-action").innerHTML = `<span class="material-icons">replay_${seekStep === 5 || seekStep === 10 || seekStep === 30 ? seekStep : 10}</span>`;
    document.getElementById("btn-forward-action").innerHTML = `<span class="material-icons">forward_${seekStep === 5 || seekStep === 10 || seekStep === 30 ? seekStep : 10}</span>`;

    const url = mediaItem.url;
    if (!url || url === "#") {
        console.warn("رابط البث غير صالح، سيتم استخدام الرابط التجريبي كبديل مستقر.");
        fallbackToNative("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
        return;
    }

    try {
        if (window.shaka && shaka.Player.isBrowserSupported()) {
            playerInstance = new shaka.Player(video);
            playerInstance.configure({
                streaming: {
                    bufferingGoal: 30,
                    rebufferingGoal: 10,
                    bufferBehind: 20,
                    lowLatencyMode: true
                }
            });

            playerInstance.load(url).then(() => {
                console.log("تم تحميل البث بنجاح عبر Shaka Engine.");
                restoreSavedTime();
            }).catch(err => {
                console.error("Shaka error, switching to native video load:", err);
                fallbackToNative(url);
            });
        } else {
            fallbackToNative(url);
        }
    } catch (e) {
        console.error("Initialization error:", e);
        fallbackToNative(url);
    }

    // التنصت للأحداث المتغيرة للفيديو
    video.addEventListener("timeupdate", updateUI);
    video.addEventListener("loadedmetadata", updateUI);
    
    // نظام إخفاء الـ OSD تلقائياً بعد 5 ثوانٍ عند انقطاع حركة المستخدم
    resetOSDTimer();
    document.addEventListener("mousemove", resetOSDTimer);
    document.addEventListener("keydown", resetOSDTimer);

    initPlayerRemoteControl();
}

function fallbackToNative(url) {
    video.src = url;
    video.load();
    video.play().catch(() => {});
    restoreSavedTime();
}

function restoreSavedTime() {
    const savedTime = localStorage.getItem("time_" + mediaItem.id);
    if (savedTime && !isNaN(savedTime)) {
        video.currentTime = parseFloat(savedTime);
    }
}

function updateUI() {
    if (isDragging || !video.duration) return;

    let percent = (video.currentTime / video.duration) * 100;
    if (fillBar) fillBar.style.width = percent + "%";
    if (knob) knob.style.left = percent + "%";

    if (currTimeLbl) currTimeLbl.innerText = formatTime(video.currentTime);
    if (totalTimeLbl) totalTimeLbl.innerText = formatTime(video.duration);

    // تخزين الموضع لاستكمال المشاهدة من القائمة الرئيسية
    localStorage.setItem(`progress_ratio_media_${mediaItem.id}`, percent);
    localStorage.setItem("time_" + mediaItem.id, video.currentTime);

    checkNextEpisode();
}

function formatTime(sec) {
    if (!sec || isNaN(sec)) return "00:00:00";
    let h = Math.floor(sec / 3600);
    let m = Math.floor((sec % 3600) / 60);
    let s = Math.floor(sec % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function togglePlay() {
    if (video.paused) {
        video.play().catch(() => {});
        if (playIcon) playIcon.innerText = "pause";
    } else {
        video.disabled = false;
        video.pause();
        if (playIcon) playIcon.innerText = "play_arrow";
    }
    resetOSDTimer();
}

function seek(seconds) {
    video.currentTime += seconds;
    resetOSDTimer();
}

function triggerPlaybackSpeedCycle() {
    let speeds = [1.0, 1.25, 1.5, 2.0];
    let currentSpeed = video.playbackRate;
    let nextIndex = (speeds.indexOf(currentSpeed) + 1) % speeds.length;
    video.playbackRate = speeds[nextIndex];
    document.getElementById("speed-label-btn").innerText = speeds[nextIndex] + "x";
}

function changeOSDSeekStep() {
    let steps = [5, 10, 15, 30];
    let nextIndex = (steps.indexOf(seekStep) + 1) % steps.length;
    seekStep = steps[nextIndex];
    localStorage.setItem("global_seek_duration", seekStep);
    document.getElementById("seek-lbl-osd").innerText = seekStep + "s";
    
    // تحديث الأزرار
    document.getElementById("btn-rewind-action").innerHTML = `<span class="material-icons">replay_${seekStep}</span>`;
    document.getElementById("btn-forward-action").innerHTML = `<span class="material-icons">forward_${seekStep}</span>`;
}

function checkNextEpisode() {
    let left = video.duration - video.currentTime;
    let popup = document.getElementById("next-ep-popup");
    if (!popup) return;

    if (left <= 60 && left > 2 && mediaItem.type === "episode") {
        popup.style.display = "block";
    } else {
        popup.style.display = "none";
    }
}

function nextEpisode() {
    console.log("جاري طلب الحلقة القادمة...");
    // يمكن هنا إدراج دالة لتغيير مأخذ الـ LocalStorage وفتح الملف من جديد
}

function prevEpisode() {
    console.log("جاري طلب الحلقة السابقة...");
}

function resetOSDTimer() {
    if (controlsPanel) controlsPanel.style.opacity = "1";
    clearTimeout(osdTimer);
    osdTimer = setTimeout(() => {
        if (!video.paused && controlsPanel) {
            controlsPanel.style.opacity = "0";
        }
    }, 5000);
}

// أزرار الريموت المخصصة لصفحة المشغل
function initPlayerRemoteControl() {
    let playerFocusables = Array.from(document.querySelectorAll("#player-html .remote-focusable"));
    let pFocusIndex = 2; // الفوكس التلقائي على زر التشغيل الأساسي في الوسط

    if(playerFocusables.length > 0) {
        playerFocusables.forEach(el => el.classList.remove("focused"));
        playerFocusables[pFocusIndex].classList.add("focused");
    }

    document.addEventListener("keydown", (e) => {
        if (controlsPanel.style.opacity === "0") {
            resetOSDTimer();
            e.preventDefault();
            return;
        }

        switch (e.key) {
            case "ArrowLeft":
                if (pFocusIndex > 0) {
                    playerFocusables[pFocusIndex].classList.remove("focused");
                    pFocusIndex--;
                    playerFocusables[pFocusIndex].classList.add("focused");
                } else {
                    seek(-seekStep);
                }
                e.preventDefault();
                break;
            case "ArrowRight":
                if (pFocusIndex < playerFocusables.length - 1) {
                    playerFocusables[pFocusIndex].classList.remove("focused");
                    pFocusIndex++;
                    playerFocusables[pFocusIndex].classList.add("focused");
                } else {
                    seek(seekStep);
                }
                e.preventDefault();
                break;
            case "Enter":
            case "OK":
                playerFocusables[pFocusIndex].click();
                e.preventDefault();
                break;
            case "Backspace":
            case "Escape":
                window.location.href = "index.html";
                e.preventDefault();
                break;
        }
    });
}

window.onload = initPlayer;
