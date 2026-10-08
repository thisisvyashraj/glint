/* Glint blog: filtering, likes, saved reading list, comments, reading progress. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var SK = 'glint_blog_saved', LK = 'glint_blog_liked';
  function vid() { try { var v = localStorage.getItem('glint_vid'); if (!v) { v = (self.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()); localStorage.setItem('glint_vid', v); } return v; } catch (e) { return 'anon-' + String(Math.random()).slice(2, 12); } }
  var rm = matchMedia('(prefers-reduced-motion:reduce)').matches;
  function get(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function has(k, s) { return get(k).indexOf(s) > -1; }
  function flip(k, s) { var a = get(k), i = a.indexOf(s); if (i > -1) a.splice(i, 1); else a.push(s); put(k, a); return i === -1; }
  function toast(m) {
    var t = $('#bt');
    if (!t) { t = document.createElement('div'); t.id = 'bt'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = m; t.classList.add('on'); clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove('on'); }, 2300);
  }
  function post(body) {
    return fetch('/api/blog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw j; return j; }); });
  }
  function burst(el) {
    if (rm) return;
    for (var i = 0; i < 10; i++) {
      var s = document.createElement('i'), a = (i / 10) * Math.PI * 2, d = 26 + Math.random() * 16;
      s.className = 'pf'; s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      s.style.background = ['#ff4d7d', '#7c5cff', '#00c8ff'][i % 3]; el.appendChild(s);
      setTimeout(function (n) { return function () { n.remove(); }; }(s), 850);
    }
  }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }) : null;
  function reveal(list) { list.forEach(function (c, i) { c.style.transitionDelay = Math.min(i % 6, 5) * 60 + 'ms'; if (io) io.observe(c); else c.classList.add('seen'); }); }
  function setCounts(sel, map) { $$(sel).forEach(function (n) { var v = map[n.getAttribute(sel.replace(/[\[\]]/g, ''))]; n.textContent = v || 0; }); }

  /* ---------- blog index ---------- */
  var grid = $('#bgrid');
  if (grid) {
    var cards = $$('.bc', grid), cat = 'All', q = '', savedOnly = false;
    var want = new URLSearchParams(location.search).get('c');
    if (want && $$('.ch').some(function (c) { return c.dataset.c === want; })) cat = want;
    var apply = function () {
      var n = 0;
      cards.forEach(function (c) {
        var ok = (cat === 'All' || c.dataset.cat === cat) && (!savedOnly || has(SK, c.dataset.slug)) && (!q || c.dataset.t.indexOf(q) > -1);
        c.hidden = !ok;
        if (ok) { n++; c.classList.remove('seen'); void c.offsetWidth; }
      });
      cards.filter(function (c) { return !c.hidden; }).forEach(function (c, i) {
        c.classList.toggle('feat', i === 0 && cat === 'All' && !q && !savedOnly);
      });
      reveal(cards.filter(function (c) { return !c.hidden; }));
      $('#be').hidden = n > 0;
      $('#be').textContent = savedOnly ? 'You have not saved any articles yet. Tap the bookmark on a card to add one.' : 'No articles match your search.';
      $$('.ch').forEach(function (c) { c.classList.toggle('on', savedOnly ? c.dataset.c === 'Saved' : c.dataset.c === cat); });
      var sc = $('[data-c=Saved] b'); if (sc) sc.textContent = get(SK).length;
    };
    $$('.ch').forEach(function (b) {
      b.onclick = function () { if (b.dataset.c === 'Saved') { savedOnly = !savedOnly; cat = 'All'; } else { savedOnly = false; cat = b.dataset.c; } apply(); };
    });
    $('#bs').addEventListener('input', function (e) { q = e.target.value.trim().toLowerCase(); apply(); });
    $$('.bc-save').forEach(function (b) {
      b.setAttribute('aria-pressed', has(SK, b.dataset.slug));
      b.onclick = function (e) {
        e.preventDefault(); e.stopPropagation();
        var on = flip(SK, b.dataset.slug); b.setAttribute('aria-pressed', on);
        toast(on ? 'Saved to your reading list' : 'Removed from saved');
        if (savedOnly) apply(); else { var sc = $('[data-c=Saved] b'); if (sc) sc.textContent = get(SK).length; }
      };
    });
    grid.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.bc'); if (!c) return;
      var r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px');
    }, { passive: true });
    apply();
    fetch('/api/blog?counts=1').then(function (r) { return r.json(); }).then(function (d) {
      setCounts('[data-lk]', d.likes || {}); setCounts('[data-cc]', d.comments || {});
    }).catch(function () {});
  }

  /* ---------- article ---------- */
  var slug = document.body.getAttribute('data-slug');
  if (slug) {
    var rp = $('#rp'), img = $('.pcover img');
    var onScroll = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      rp.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
      if (img && !rm && scrollY < 900) img.style.transform = 'scale(' + (1 + Math.min(scrollY, 700) / 9000) + ')';
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    reveal($$('.rel .bc'));
    var lk = $('#lk'), sv = $('#sv'), ln = $('#lkn'), cn = $('#ccn'), likes = 0;
    var paint = function () {
      lk.classList.toggle('on', has(LK, slug)); lk.setAttribute('aria-pressed', has(LK, slug));
      sv.classList.toggle('on', has(SK, slug)); sv.setAttribute('aria-pressed', has(SK, slug));
      ln.textContent = likes;
    };
    paint();
    lk.onclick = function () {
      var on = flip(LK, slug); likes = Math.max(0, likes + (on ? 1 : -1)); paint(); if (on) burst(lk);
      post({ action: on ? 'like' : 'unlike', slug: slug, vid: vid() }).then(function (r) { if (typeof r.likes === 'number') { likes = r.likes; paint(); } })
        .catch(function (e) { toast((e && e.error) || 'Could not reach the server'); });
    };
    sv.onclick = function () { var on = flip(SK, slug); paint(); toast(on ? 'Saved to your reading list' : 'Removed from saved'); };
    $('#sh').onclick = function () {
      var d = { title: document.title, url: location.href.split('#')[0] };
      if (navigator.share) { navigator.share(d).catch(function () {}); return; }
      (navigator.clipboard ? navigator.clipboard.writeText(d.url) : Promise.reject()).then(function () { toast('Link copied'); }, function () { toast(d.url); });
    };
    var list = $('#clist'), cc = $('#cc');
    var ago = function (t) {
      var s = (Date.now() - t) / 1000;
      if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago';
      if (s < 86400) return Math.floor(s / 3600) + ' h ago'; return Math.floor(s / 86400) + ' d ago';
    };
    var hue = function (n) { var h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 360; return h; };
    var item = function (c) {
      var li = document.createElement('li'), nm = c.name || 'Reader';
      li.className = 'cm';
      var a = document.createElement('span'); a.className = 'av'; a.textContent = nm.charAt(0).toUpperCase(); a.style.background = 'hsl(' + hue(nm) + ',55%,38%)';
      var w = document.createElement('div'), b = document.createElement('b'), t = document.createElement('time'), p = document.createElement('p');
      b.textContent = nm; t.textContent = ago(c.ts); p.textContent = c.text; w.appendChild(b); w.appendChild(t); w.appendChild(p);
      li.appendChild(a); li.appendChild(w); return li;
    };
    var renderAll = function (arr) {
      list.textContent = '';
      if (!arr.length) { var e = document.createElement('li'); e.className = 'nocm'; e.id = 'nocm'; e.textContent = 'No comments yet. Be the first to share a thought.'; list.appendChild(e); }
      arr.forEach(function (c) { list.appendChild(item(c)); });
      cc.textContent = arr.length; cn.textContent = arr.length;
    };
    var n = 0;
    fetch('/api/blog?slug=' + encodeURIComponent(slug) + '&vid=' + encodeURIComponent(vid())).then(function (r) { return r.json(); }).then(function (d) {
      likes = d.likes || 0; if (d.liked) { var la = get(LK); if (la.indexOf(slug) < 0) { la.push(slug); put(LK, la); } } paint(); var arr = d.comments || []; n = arr.length; renderAll(arr);
    }).catch(function () { renderAll([]); });
    var f = $('#cform'), st = $('#cs');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = Object.fromEntries(new FormData(f)), btn = $('button', f);
      if ((d.text || '').trim().length < 2) { st.textContent = 'Please write a comment first.'; return; }
      btn.disabled = true; st.textContent = 'Posting...';
      post({ action: 'comment', slug: slug, name: d.name, text: d.text, website: d.website })
        .then(function (r) {
          var nc = $('#nocm'); if (nc) nc.remove();
          if (r.comment) { list.insertBefore(item(r.comment), list.firstChild); n++; cc.textContent = n; cn.textContent = n; }
          f.reset(); st.textContent = 'Thanks! Your comment is live.';
        })
        .catch(function (er) { st.textContent = (er && er.error) || 'Could not post your comment. Please try again.'; })
        .then(function () { btn.disabled = false; });
    });
  }
})();
