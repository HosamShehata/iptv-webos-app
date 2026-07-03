let currentLang = 'ar';

function updateClockAndDate() {
    const now = new Date();
    document.getElementById('home-clock').innerText = now.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: true});
    document.getElementById('home-date').innerText = now.toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
}

function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    document.body.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    updateClockAndDate();
}

function runSpeedTest() {
    const start = Date.now();
    fetch('https://www.google.com', {mode: 'no-cors'}).then(() => {
        document.getElementById('internet-speed').innerText = (10 / ((Date.now() - start) / 1000)).toFixed(1) + " Mbps";
    });
}

window.onload = () => {
    setInterval(updateClockAndDate, 1000);
    updateClockAndDate();
    runSpeedTest();
    
    document.getElementById('tile-livetv').onclick = () => window.location.href = 'pages/livetv.html';
    document.getElementById('tile-movies').onclick = () => window.location.href = 'pages/movies.html';
    document.getElementById('tile-series').onclick = () => window.location.href = 'pages/series.html';
    document.getElementById('tile-favs').onclick = () => window.location.href = 'pages/favs.html';
    document.getElementById('tile-search').onclick = () => window.location.href = 'pages/search.html';
    document.getElementById('tile-settings').onclick = () => window.location.href = 'pages/settings.html';
};
