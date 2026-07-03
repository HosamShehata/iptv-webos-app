let currentLang = 'ar';

function updateClockAndDate() {
    const now = new Date();
    let h = now.getHours();
    const ampm = h >= 12 ? ' PM' : ' AM';
    h = h % 12 || 12;
    const m = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('home-clock').innerText = h + ":" + m + ampm;
    document.getElementById('home-date').innerText = now.toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
}

function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    document.body.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    updateClockAndDate();
}

function runSpeedTest() {
    const start = Date.now();
    fetch('https://upload.wikimedia.org/wikipedia/commons/2/2d/Snake_River.jpg?t=' + start, {mode: 'no-cors'}).then(() => {
        const duration = (Date.now() - start) / 1000;
        document.getElementById('internet-speed').innerText = (10 / duration).toFixed(1) + " Mbps";
    });
}

window.onload = () => {
    setInterval(updateClockAndDate, 1000);
    updateClockAndDate();
    runSpeedTest();
    
    // ربط الأزرار الأصلية
    document.getElementById('tile-livetv').onclick = () => window.location.href = 'pages/livetv.html';
    document.getElementById('tile-movies').onclick = () => window.location.href = 'pages/movies.html';
    document.getElementById('tile-series').onclick = () => window.location.href = 'pages/series.html';
    document.getElementById('tile-settings').onclick = () => window.location.href = 'pages/settings.html';
};
