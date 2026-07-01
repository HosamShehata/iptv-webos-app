const video = document.getElementById("video");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");

// جلب بيانات القناة المختارة من الذاكرة المحلية
const channel = JSON.parse(localStorage.getItem("current"));
let player;
const SEEK_INTERVAL = 10; [span_0](start_span)[span_1](start_span)// مقدار التقديم والترجيع بالثواني عند الضغط على الأسهم[span_0](end_span)[span_1](end_span)

async function init() {
  if (!channel) {
    errorBox.innerText = "لم يتم اختيار قناة";
    return;
  }

  loading.style.display = "block";

  try {
    // إعداد مشغل Shaka Player
    player = new shaka.Player(video);
    player.addEventListener("error", onError);

    // مراقبة وضع التحميل (Buffering) لشاشات الـ TV
    video.addEventListener("waiting", () => { loading.style.display = "block"; });
    video.addEventListener("playing", () => { loading.style.display = "none"; });

    // تحميل رابط البث وتشغيله تلقائياً
    await player.load(channel.url);
    video.play();

    [span_2](start_span)[span_3](start_span)[span_4](start_span)// حفظ القناة الحالية في "تابع المشاهدة" (History)[span_2](end_span)[span_3](end_span)[span_4](end_span)
    localStorage.setItem("lastWatched", JSON.stringify(channel));

  } catch (e) {
    onError(e);
  }
}

[span_5](start_span)[span_6](start_span)// معالجة الأخطاء وإعادة المحاولة التلقائية بعد 3 ثوانٍ[span_5](end_span)[span_6](end_span)
function onError(error) {
  console.error("Shaka Player Error:", error);
  errorBox.innerText = "حدث خطأ في البث.. إعادة المحاولة خلال 3 ثوانٍ";
  loading.style.display = "none";

  setTimeout(() => {
    errorBox.innerText = "";
    init(); 
  }, 3000);
}

[span_7](start_span)[span_8](start_span)// أزرار التحكم بالريموت كنترول داخل المشغل[span_7](end_span)[span_8](end_span)
document.addEventListener("keydown", function(e) {
  // زر الرجوع (Backspace) للعودة لصفحة القنوات الرئيسية
  if (e.key === "Backspace" || e.key === "Escape") {
    window.location.href = "index.html";
  }

  [span_9](start_span)[span_10](start_span)// زر الـ OK أو Enter لتشغيل وإيقاف الفيديو مؤقتاً[span_9](end_span)[span_10](end_span)
  if (e.key === "Enter" || e.key === " ") {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  [span_11](start_span)[span_12](start_span)// السهم الأيسر: إرجاع الفيديو للخلف[span_11](end_span)[span_12](end_span)
  if (e.key === "ArrowLeft") {
    video.currentTime = Math.max(0, video.currentTime - SEEK_INTERVAL);
  }

  [span_13](start_span)[span_14](start_span)// السهم الأيمن: تقديم الفيديو للأمام[span_13](end_span)[span_14](end_span)
  if (e.key === "ArrowRight") {
    video.currentTime = Math.min(video.duration || Infinity, video.currentTime + SEEK_INTERVAL);
  }
});

// إقلاع المشغل
init();
