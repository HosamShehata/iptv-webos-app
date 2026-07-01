const video = document.getElementById("video");

// رابط تجريبي (تقدر تغيّره بأي stream بعدين)
video.src = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

video.play();

console.log("Player Loaded");
