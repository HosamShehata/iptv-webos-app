(function () {
    'use strict';

    var cfg = IPTVCore.resolveConfig();
    var activeCategory = "all";
    var RAIL_CAP = 20;
    var railIndex = 0, cardIndex = 0;
    var zone = 'rails', prevZone = 'rails';
    var sidebarIndex = 1;
    var detailFocus = 0;
    var seasonsData = null, activeSeason = null;
    var detailItem = null;

    var elRails = document.getElementById('vod-rails');
    var elStatus = document.getElementById('vod-status');
    var elStatusTx = document.getElementById('vod-status-text');
    var elDetail = document.getElementById('vod-detail');

    // ── إدارة مفضلة المسلسلات بشكل مستقل لعام 2026 ──
    function loadWatchlist() { try { return JSON.parse(localStorage.getItem('series_watchlist')) || []; } catch(e) { return []; } }
    function saveWatchlist(w) { try { localStorage.setItem('series_watchlist', JSON.stringify(w)); } catch(e) {} }
    
    function inWatchlist(item) {
        var w = loadWatchlist();
        return w.some(function(x) { return String(x.series_id) === String(item.series_id); });
    }

    function toggleWatchlist(item) {
        var w = loadWatchlist(), idx = -1;
        for (var i = 0; i < w.length; i++) {
            if (String(w[i].series_id) === String(item.series_id)) { idx = i; break; }
        }
        if (idx >= 0) { w.splice(idx, 1); } else { w.unshift(item); }
        saveWatchlist(w);
        return idx < 0;
    }

    function makeCard(item) {
        var card = document.createElement('div');
        card.className = 'vod-card';
        card.tabIndex = -1;
        card.dataset.sid = item.series_id;

        var poster = document.createElement('div');
        poster.className = 'vod-card-poster';
        
        var icon = item.cover || item.stream_icon || '';
        if (icon) {
            var img = document.createElement('img');
            img.alt = ''; img.loading = 'lazy';
            img.onerror = function() { poster.classList.add('no-img'); this.remove(); };
            img.src = icon;
            poster.appendChild(img);
        } else { poster.classList.add('no-img'); }

        // النجمة المضيئة لمفضلة المسلسلات
        var star = document.createElement('div');
        star.className = 'vod-card-fav-star';
        star.innerHTML = '★';
        star.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleWatchlist(item);
            card.classList.toggle('is-starred', inWatchlist(item));
        });
        card.appendChild(star);
        card.classList.toggle('is-starred', inWatchlist(item));

        card.appendChild(poster);
        var label = document.createElement('div');
        label.className = 'vod-card-label';
        label.textContent = item.name || 'مسلسل غير مسمى';
        card.appendChild(label);

        card.addEventListener('click', function() { openDetail(item); });
        return card;
    }

    function makeRail(title, catId) {
        var rail = document.createElement('section');
        rail.className = 'vod-rail';
        rail.dataset.catId = catId || '';
        rail.innerHTML = '<h2 class="vod-rail-title">' + escHtml(title) + '</h2><div class="vod-rail-track"></div>';
        return rail;
    }

    function fillRail(rail) {
        var catId = rail.dataset.catId;
        var track = rail.querySelector('.vod-rail-track');
        for (var s = 0; s < 5; s++) { var sk = document.createElement('div'); sk.className = 'vod-card vod-skeleton'; track.appendChild(sk); }

        var url = IPTVCore.apiUrl(cfg, 'action=get_series&category_id=' + encodeURIComponent(catId));
        IPTVCore.fetchCached('series_content_' + catId, url).then(function (data) {
            track.innerHTML = '';
            var items = Array.isArray(data) ? data : [];
            var n = Math.min(items.length, RAIL_CAP);
            for (var i = 0; i < n; i++) track.appendChild(makeCard(items[i]));
            if (zone === 'rails' && railEls()[railIndex] === rail) paintRailFocus();
        }).catch(function() { rail.remove(); });
    }

    function renderRails(catsList) {
        elRails.innerHTML = '';
        
        // صف المفضلة المضيء للمسلسلات
        var wl = loadWatchlist();
        if (wl.length) {
            var wlRail = makeRail('مسلسلاتي المفضلة', 'favs');
            var track = wlRail.querySelector('.vod-rail-track');
            wl.forEach(function(e) { track.appendChild(makeCard(e)); });
            elRails.appendChild(wlRail);
        }

        catsList.forEach(function (c) {
            var rail = makeRail(c.category_name, c.category_id);
            elRails.appendChild(rail);
            fillRail(rail);
        });
        hideStatus();
        focusZone('rails');
        paintRailFocus();
    }

    function loadSeriesData() {
        showStatus('جاري تحميل المسلسلات...', true);
        var url = IPTVCore.apiUrl(cfg, 'action=get_series_categories');
        IPTVCore.fetchCached('series_categories', url).then(function (data) {
            var list = Array.isArray(data) ? data : [];
            renderRails(list);
            renderSidebarCats(list);
        }).catch(function() { showStatus('فشل في تحميل مكتبة المسلسلات.', false); });
    }

    function openDetail(item) {
        detailItem = item;
        elDetail.hidden = false;
        document.getElementById('vod-detail-poster').src = item.cover || item.stream_icon || '';
        document.getElementById('vod-detail-backdrop').style.backgroundImage = 'url("' + (item.cover || item.stream_icon || '') + '")';
        setText('vod-detail-title', item.name);
        setText('vod-detail-plot', item.plot || 'لا يوجد وصف متاح لهذا المسلسل حالياً.');
        updateListBtn();
        
        // جلب الحلقات والمواسم فوراً بشكل مبطن
        loadEpisodesAndSeasons(item.series_id);
    }

    function loadEpisodesAndSeasons(seriesId) {
        var tabs = document.getElementById('vod-season-tabs');
        var list = document.getElementById('vod-episode-list');
        tabs.innerHTML = '';
        list.innerHTML = '<div class="vod-ep-loading">جاري تحميل المواسم والحلقات...</div>';
        
        fetchJSON(IPTVCore.apiUrl(cfg, 'action=get_series_info&series_id=' + encodeURIComponent(seriesId))).then(function (data) {
            var eps = data && data.episodes;
            if (!eps || Object.keys(eps).length === 0) {
                list.innerHTML = '<div class="vod-ep-loading">لا توجد حلقات متاحة حالياً.</div>';
                return;
            }
            seasonsData = eps;
            var seasons = Object.keys(eps).sort(function (a, b) { return (+a) - (+b); });
            tabs.innerHTML = '';
            seasons.forEach(function (sn, i) {
                var t = document.createElement('button');
                t.className = 'vod-season-tab' + (i === 0 ? ' active' : '');
                t.textContent = 'الموسم ' + sn;
                t.dataset.season = sn;
                t.addEventListener('click', function () { selectSeason(sn); });
                tabs.appendChild(t);
            });
            focusZone('detail');
            if (seasons.length) selectSeason(seasons[0]);
        }).catch(function() { list.innerHTML = '<div class="vod-ep-loading">فشل تحميل الحلقات.</div>'; });
    }

    function selectSeason(sn) {
        activeSeason = sn;
        document.querySelectorAll('#vod-season-tabs .vod-season-tab').forEach(function (t) {
            t.classList.toggle('active', t.dataset.season === String(sn));
        });
        var list = document.getElementById('vod-episode-list');
        list.innerHTML = '';
        var eps = seasonsData[sn] || [];
        eps.forEach(function (ep) {
            var ext = ep.container_extension || 'mp4';
            var num = ep.episode_num != null ? ep.episode_num : '';
            var row = document.createElement('button');
            row.className = 'vod-ep-row';
            row.innerHTML = '<span class="vod-ep-num">حلقة ' + num + '</span>' + '<span class="vod-ep-name">' + (ep.title || 'الحلقة ' + num) + '</span><span class="vod-ep-play">▶ تشغيل</span>';
            
            row.addEventListener('click', function () {
                var playUrl = IPTVCore.episodeUrl(cfg, ep.id, ext);
                localStorage.setItem('iptv_play_url', playUrl);
                localStorage.setItem('iptv_play_title', detailItem.name + ' - حلقة ' + num);
                window.location.href = 'player.html';
            });
            list.appendChild(row);
        });
        detailFocus = 0;
        paintDetailFocus();
    }

    function updateListBtn() {
        var saved = inWatchlist(detailItem);
        document.getElementById('vod-list-label').textContent = saved ? 'محذوف من قائمتي' : 'أضف إلى قائمتي';
    }

    function closeDetail() { elDetail.hidden = true; focusZone('rails'); paintRailFocus(); }
    function railEls() { return Array.prototype.slice.call(elRails.querySelectorAll('.vod-rail')); }
    function railCards(rail) { return rail ? Array.prototype.slice.call(rail.querySelectorAll('.vod-card')) : []; }
    function detailItems() { return Array.prototype.slice.call(document.querySelectorAll('#vod-list-btn, #vod-season-tabs .vod-season-tab, #vod-episode-list .vod-ep-row')); }

    function paintRailFocus() {
        clearRings();
        var rails = railEls();
        if (!rails.length) return;
        railIndex = Math.max(0, Math.min(rails.length - 1, railIndex));
        var cards = railCards(rails[railIndex]);
        if (!cards.length) return;
        cardIndex = Math.max(0, Math.min(cards.length - 1, cardIndex));
        cards[cardIndex].classList.add('tv-focus-visible');
        cards[cardIndex].scrollIntoView({ block: 'nearest', inline: 'center' });
    }

    function paintDetailFocus() {
        clearRings();
        var items = detailItems();
        if (!items.length) return;
        detailFocus = Math.max(0, Math.min(items.length - 1, detailFocus));
        items[detailFocus].classList.add('tv-focus-visible');
        items[detailFocus].scrollIntoView({ block: 'nearest' });
    }

    // ── حركات الريموت والـ D-pad للمسلسلات ──
    window.addEventListener('keydown', function (e) {
        var kc = e.keyCode || e.which;
        if (!elDetail.hidden) {
            if (kc === 461) { e.preventDefault(); closeDetail(); return; }
            var items = detailItems();
            if (kc === 38 && detailFocus > 0) { e.preventDefault(); detailFocus--; paintDetailFocus(); } // UP
            if (kc === 40 && detailFocus < items.length - 1) { e.preventDefault(); detailFocus++; paintDetailFocus(); } // DOWN
            if (kc === 13) { e.preventDefault(); items[detailFocus]?.click(); } // ENTER
            return;
        }
        if (zone === 'rails') {
            if (kc === 461) { e.preventDefault(); window.location.href = '../index.html'; return; }
            var rails = railEls();
            if (kc === 38 && railIndex > 0) { e.preventDefault(); railIndex--; paintRailFocus(); } // UP
            if (kc === 40 && railIndex < rails.length - 1) { e.preventDefault(); railIndex++; paintRailFocus(); } // DOWN
            if (kc === 37 && cardIndex > 0) { e.preventDefault(); cardIndex--; paintRailFocus(); } // LEFT
            if (kc === 39) { var cards = railCards(rails[railIndex]); if (cardIndex < cards.length - 1) { e.preventDefault(); cardIndex++; paintRailFocus(); } } // RIGHT
            if (kc === 13) { var cards = railCards(rails[railIndex]); cards[cardIndex]?.click(); } // ENTER
        }
    }, true);

    function renderSidebarCats(list) {
        var wrap = document.getElementById('vod-nav-cats');
        wrap.innerHTML = '<div class="vod-cat-header">تصنيفات المسلسلات</div>';
        list.forEach(function(c) {
            var b = document.createElement('button'); b.className = 'vod-cat-item'; b.textContent = c.category_name;
            b.onclick = function() { jumpToCategory(c.category_id); }; wrap.appendChild(b);
        });
    }

    function jumpToCategory(catId) {
        var rails = railEls();
        for (var i = 0; i < rails.length; i++) {
            if (rails[i].dataset.catId === String(catId)) { railIndex = i; cardIndex = 0; paintRailFocus(); rails[i].scrollIntoView({ block: 'start' }); break; }
        }
    }

    function showStatus(text, spinner) { elStatus.style.display = 'flex'; elStatusTx.textContent = text; elStatus.querySelector('.vod-spinner').style.display = spinner ? '' : 'none'; elRails.style.display = 'none'; }
    function hideStatus() { elStatus.style.display = 'none'; elRails.style.display = ''; }
    function clearRings() { document.querySelectorAll('.tv-focus-visible').forEach(function (el) { el.classList.remove('tv-focus-visible'); }); }
    function escHtml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function setText(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt || ''; }

    if (cfg) loadSeriesData();
})();
