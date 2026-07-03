let currentLang = 'ar';

function updateClockAndDate() {
    const now = new Date();
    // ساعة 12 ساعة
    let h = now.getHours();
    const ampm = h >= 12 ? ' PM' : ' AM';
    h = h % 12 || 12;
    const m = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('home-clock').innerText = h + ":" + m + ampm;
    
    // التاريخ
    document.getElementById('home-date').innerText = now.toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US', 
    { weekday: 'long', day: 'numeric', month: 'long' });
}

// التوجيه عند الضغط
document.querySelectorAll('.home-tile-main').forEach(tile => {
    tile.addEventListener('click', () => {
        if (tile.id === 'tile-movies') window.location.href = 'pages/movies.html';
        if (tile.id === 'tile-series') window.location.href = 'pages/series.html';
        if (tile.id === 'tile-livetv') window.location.href = 'pages/livetv.html';
    });
});

setInterval(updateClockAndDate, 1000);
updateClockAndDate();
