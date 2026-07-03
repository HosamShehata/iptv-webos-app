(function () {
    'use strict';
    
    var cfg = IPTVCore.resolveConfig();
    var railContainer = document.getElementById('vod-rails');
    var statusText = document.getElementById('vod-status-text');
    
    // مفضلة الأفلام المستقلة
    function loadFavs() { try { return JSON.parse(localStorage.getItem('movies_favs')) || []; } catch(e) { return []; } }
    function toggleFav(id) {
        var f = loadFavs(), idx = f.indexOf(String(id));
        if (idx > -1) f.splice(idx, 1); else f.push(String(id));
        localStorage.setItem('movies_favs', JSON.stringify(f));
        return idx < 0;
    }

    function initMovies() {
        IPTVCore.fetchCached('movies_cats', IPTVCore.apiUrl(cfg, 'action=get_vod_categories'))
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
        var url = IPTVCore.apiUrl(cfg, 'action=get_vod_streams&category_id=' + catId);
        
        IPTVCore.fetchJSON(url).then(function(items) {
            items.forEach(function(item) {
                var card = document.createElement('div');
                card.className = 'vod-card';
                card.innerHTML = '<div class="vod-card-poster"><img src="' + (item.stream_icon || '') + '"></div>' +
                                 '<div class="vod-card-fav-star">★</div>' +
                                 '<div class="vod-card-label">' + item.name + '</div>';
                
                // تفعيل النجمة المستقلة
                var star = card.querySelector('.vod-card-fav-star');
                if(loadFavs().includes(String(item.stream_id))) card.classList.add('is-starred');
                
                star.onclick = function(e) {
                    e.stopPropagation();
                    var isAdded = toggleFav(item.stream_id);
                    card.classList.toggle('is-starred', isAdded);
                };
                track.appendChild(card);
            });
        });
    }

    window.addEventListener('load', initMovies);
})();
