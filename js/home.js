function updateClockAndDate() {
    const now = new Date();
    document.getElementById('home-clock').innerText = now.toLocaleTimeString('en-US', {hour12: true});
    document.getElementById('home-date').innerText = now.toLocaleDateString('ar-EG', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
}

function runSpeedTest() {
    const start = Date.now();
    fetch('https://www.google.com', {mode: 'no-cors'}).then(() => {
        document.getElementById('internet-speed').innerText = ((10 / ((Date.now() - start) / 1000))).toFixed(1) + " Mbps";
    });
}

window.onload = () => {
    setInterval(updateClockAndDate, 1000);
    updateClockAndDate();
    runSpeedTest();
    
    // الروابط الأصلية كما طلبت
    document.getElementById('tile-livetv').onclick = () => window.location.href = 'pages/livetv.html';
    document.getElementById('tile-movies').onclick = () => window.location.href = 'pages/movies.html';
    document.getElementById('tile-series').onclick = () => window.location.href = 'pages/series.html';
    document.getElementById('tile-settings').onclick = () => window.location.href = 'pages/settings.html';
};
