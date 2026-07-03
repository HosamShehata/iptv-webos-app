(function () {
    'use strict';
    
    var cfg = IPTVCore.resolveConfig();
    var railContainer = document.getElementById('vod-rails');
    var statusText = document.getElementById('vod-status-text');
    var seasonsData = null;

    // مفضلة المسلسلات المستقلة
    function loadFavs() { try { return JSON.parse(localStorage.getItem('series_favs')) || []; } catch(e) { return []; } }
    function toggleFav(id) {
        var f = loadFavs(), idx = f.indexOf(String(id));
        if (idx > -1) f.splice(idx, 1); else f.push(String(id));
        localStorage.setItem('series_favs', JSON.stringify(f));
        return idx < 0;
    }

    function initSeries() {
        IPTVCore.fetchCached('series_cats', IPTVCore.apiUrl(cfg, 'action=get_series_categories'))
        .then(function(cats) {
            cats.forEach(function(cat) {
                var rail = document.createElement('section');
                rail.className = 'vod-rail';
                rail.innerHTML = '<h2 class="vod-rail-title">' + cat.category_name + '</h2><div class="vod-rail-track"></div>';
                railContainer.appendChild(rail);
                loadRailData(rail, cat.category_id);
            });
        });
    }

    function loadRailData(rail, catId) {
        var track = rail.querySelector('.vod-rail-track');
        var url = IPTVCore.apiUrl(cfg, 'action=get_series&category_id=' + encodeURIComponent(catId));
        
        IPTVCore.fetchJSON(url).then(function(items) {
            items.forEach(function(item) {
                var card = document.createElement('div');
                card.className = 'vod-card';
                card.innerHTML = '<div class="vod-card-poster"><img src="' + (item.cover || item.stream_icon || '') + '"></div>' +
                                 '<div class="vod-card-fav-star">★</div>' +
                                 '<div class="vod-card-label">' + item.name + '</div>';
                
                var star = card.querySelector('.vod-card-fav-star');
                if(loadFavs().includes(String(item.series_id))) card.classList.add('is-starred');
                
                star.onclick = function(e) {
                    e.stopPropagation();
                    var isAdded = toggleFav(item.series_id);
                    card.classList.toggle('is-starred', isAdded);
                };
                card.addEventListener('click', function() { openDetail(item); });
                track.appendChild(card);
            });
        });
    }

    function openDetail(item) {
        // ... (هنا ستضع كود فتح التفاصيل كما ناقشنا سابقاً مع دمج seasonsData) ...
        // ملاحظة: تأكد من ربط زر التشغيل في صفحة HTML بـ loadEpisodesAndSeasons(item.series_id)
        console.log("Loading series details for: ", item.series_id);
    }

    window.addEventListener('load', initSeries);
})();
