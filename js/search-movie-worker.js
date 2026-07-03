(function () {
    'use strict';

    var index = [];
    var ready = false;

    function xhrJSON(url, cb) {
        try {
            var x = new XMLHttpRequest();
            x.open('GET', url, true);
            x.onload = function () {
                if (x.status >= 200 && x.status < 300) {
                    try { cb(null, JSON.parse(x.responseText)); } catch (e) { cb(e); }
                } else { cb(new Error('HTTP ' + x.status)); }
            };
            x.onerror = function () { cb(new Error('network')); };
            x.send();
        } catch (e) { cb(e); }
    }

    function load(movieUrl) {
        xhrJSON(movieUrl, function (err, data) {
            if (!err && Array.isArray(data)) {
                for (var i = 0; i < data.length; i++) {
                    var m = data[i];
                    if (m.stream_id === undefined || m.stream_id === null) continue;
                    var nm = m.name || '';
                    index.push({
                        id: m.stream_id,
                        name: nm,
                        lc: nm.toLowerCase(),
                        icon: m.stream_icon || m.cover || ''
                    });
                }
            }
            ready = true;
            self.postMessage({ cmd: 'ready', count: index.length });
        });
    }

    function search(q, limit, reqId) {
        q = (q || '').toLowerCase();
        var out = [], lim = limit || 40;
        for (var i = 0; i < index.length && out.length < lim; i++) {
            var it = index[i];
            if (it.lc.indexOf(q) === -1) continue;
            out.push({
                stream_id: it.id,
                name: it.name,
                stream_icon: it.icon,
                __type: 'movie'
            });
        }
        self.postMessage({ cmd: 'results', reqId: reqId, q: q, items: out, ready: ready });
    }

    self.onmessage = function (e) {
        var d = e.data || {};
        if (d.cmd === 'load') {
            if (ready) self.postMessage({ cmd: 'ready', count: index.length });
            else if (!index.length) load(d.movieUrl);
        } else if (d.cmd === 'search') {
            search(d.q, d.limit, d.reqId);
        }
    };
})();
