let video = document.getElementById("video");

let fillBar = document.getElementById("fill-bar");
let knob = document.getElementById("progress-knob");
let currTimeLbl = document.getElementById("current-time");
let totalTimeLbl = document.getElementById("total-time");
let playIcon = document.getElementById("icon-play");

let mediaItem = JSON.parse(localStorage.getItem("current")) || {};

let seekStep = parseInt(localStorage.getItem("global_seek_duration")) || 10;

let osdTimer;
let isDragging = false;

let player;
function initPlayer() {

    document.getElementById("player-title").innerText =
        mediaItem.name || "VISION TV";

    const url = mediaItem.url;

    if (!url) return;

    // Sh
    try {

        if (window.shaka) {

            player = new shaka.Player(video);

            player.configure({

                streaming: {
                    bufferingGoal: 30,
                    rebufferingGoal: 10,
                    bufferBehind: 20
                }

            });

            player.load(url).catch(err => {

                console.error("Shaka load error:", err);

                fallbackToNative(url);

            });

        } else {

            fallbackToNative(url);

        }

    } catch (e) {

        console.error("Player init error:", e);

        fallbackToNative(url);

    }

    video.addEventListener("timeupdate", updateUI);

    video.addEventListener("loadedmetadata", updateUI);

}
function fallbackToNative(url) {

    video.src = url;
    video.play().catch(()=>{});

}

// ============================================

function updateUI() {

    if (isDragging) return;

    if (!video.duration) return;

    let percent = (video.currentTime / video.duration) * 100;

    fillBar.style.width = percent + "%";
    knob.style.left = percent + "%";

    currTimeLbl.innerText = formatTime(video.currentTime);
    totalTimeLbl.innerText = formatTime(video.duration);

    localStorage.setItem(
        "progress_" + mediaItem.id,
        percent
    );

    localStorage.setItem(
        "time_" + mediaItem.id,
        video.currentTime
    );

    checkNextEpisode();
}
function togglePlay() {

    if (video.paused) {

        video.play();
        playIcon.innerText = "pause";

    } else {

        video.pause();
        playIcon.innerText = "play_arrow";

    }

}

// ============================================

function seek(seconds) {

    video.currentTime += seconds;

}

// ============================================

document.addEventListener("keydown", (e) => {

    switch (e.key) {

        case "ArrowLeft":
            seek(-seekStep);
            break;

        case "ArrowRight":
            seek(seekStep);
            break;

        case "ArrowUp":
            nextEpisode();
            break;

        case "ArrowDown":
            prevEpisode();
            break;

        case "Enter":
            togglePlay();
            break;

        case "Backspace":
        case "Escape":
            window.location.href = "index.html";
            break;

    }

});
function formatTime(sec) {

    if (!sec) return "00:00:00";

    let h = Math.floor(sec / 3600);
    let m = Math.floor((sec % 3600) / 60);
    let s = Math.floor(sec % 60);

    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;

}

// ============================================

function checkNextEpisode() {

    let left = video.duration - video.currentTime;

    let popup = document.getElementById("next-ep-popup");

    if (!popup) return;

    if (left <= 60 && left > 2) {

        popup.style.display = "block";

    } else {

        popup.style.display = "none";

    }

}

// ============================================

function nextEpisode() {
    console.log("Next episode");
}

function prevEpisode() {
    console.log("Previous episode");
}

// ============================================

window.onload = () => {

    initPlayer();

};
