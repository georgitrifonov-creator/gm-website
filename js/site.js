/* GM Services · Webseite (ohne Bibliotheken) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var G = window.GM || {}, LANG = document.body.dataset.lang || 'de';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LOC = { de: 'de-DE', bg: 'bg-BG', en: 'en-GB', it: 'it-IT' }[LANG] || 'de-DE';
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ICO_OK = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>';

  /* Sprache merken */
  $$('[data-setlang]').forEach(function (a) { a.addEventListener('click', function () { try { localStorage.setItem('gm-lang', a.dataset.setlang); } catch (e) {} }); });
  try { localStorage.setItem('gm-lang', LANG); } catch (e) {}

  /* ---------- Ueberschriften am Handy einpassen: lange Woerter nie abschneiden ---------- */
  function fitHeads() {
    Array.prototype.forEach.call(document.querySelectorAll('.h1, .h2'), function (h) {
      h.style.fontSize = '';
      if (window.innerWidth > 600) return;
      var fs = parseFloat(getComputedStyle(h).fontSize), n = 0;
      while (h.scrollWidth > h.clientWidth + 1 && fs > 16 && n++ < 30) { fs -= 1; h.style.fontSize = fs + 'px'; }
    });
  }
  fitHeads();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHeads);
  var fitT; window.addEventListener('resize', function () { clearTimeout(fitT); fitT = setTimeout(fitHeads, 150); });

  /* ---------- Kopfleiste ---------- */
  /* Runter scrollen blendet die Leiste aus, erst echtes Hochscrollen holt sie zurueck.
     Kleine Ruckler (iOS-Nachfedern, Adressleiste, nachladende Bilder) zaehlen nicht. */
  var nav = $('#nav'), lastY = 0, navRun = 0;
  function navSet(c, on) { if (nav.classList.contains(c) !== on) nav.classList.toggle(c, on); }
  function onNav() {
    var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    var y = Math.min(Math.max(window.scrollY, 0), max), d = y - lastY;
    navSet('solid', y > 40);
    if (y <= 90 || document.body.classList.contains('menu-open')) { navSet('hide', false); navRun = 0; }
    else if (d !== 0) {
      if ((d > 0) !== (navRun > 0)) navRun = 0;
      navRun += d;
      if (navRun > 12) navSet('hide', true);
      else if (navRun < -40) navSet('hide', false);
    }
    lastY = y;
  }
  if (document.querySelector('.ph.dark, .soon')) document.body.classList.add('darkhead');
  /* Kopfleiste nimmt die Farbe der Section dahinter an (Handy und PC) */
  function bgOf(el) {
    for (; el && el.nodeType === 1; el = el.parentElement) {
      var c = getComputedStyle(el).backgroundColor, m = c.match(/[\d.]+/g);
      if (m && (m.length < 4 || +m[3] > .5)) return [+m[0], +m[1], +m[2]];
    }
    return [255, 255, 255];
  }
  var tintKey = '';
  function tint() {
    if (!nav.classList.contains('solid')) { if (tintKey !== '') { nav.style.removeProperty('--navbg'); nav.classList.remove('tdark'); tintKey = ''; } return; }
    if (nav.classList.contains('hide')) return;
    var h = nav.getBoundingClientRect().bottom, x = window.innerWidth / 2, list = document.elementsFromPoint(x, Math.max(1, h - 2)), el = null;
    for (var i = 0; i < list.length; i++) { if (!nav.contains(list[i])) { el = list[i]; break; } }
    while (el && el.parentElement && el.parentElement.tagName !== 'MAIN' && el.parentElement !== document.body) el = el.parentElement;
    var c = bgOf(el), k = c.join(',');
    if (k === tintKey) return; tintKey = k;
    var lum = (.2126 * c[0] + .7152 * c[1] + .0722 * c[2]) / 255;
    nav.style.setProperty('--navbg', 'rgba(' + k + ',.9)');
    navSet('tdark', lum < .5);
  }
  var _onNav = onNav; onNav = function () { _onNav(); tint(); };
  window.addEventListener('resize', function () { tintKey = ''; tint(); });
  window.addEventListener('scroll', onNav, { passive: true }); onNav();
  nav.addEventListener('focusin', function () { nav.classList.remove('hide'); navRun = 0; tint(); });
  var burger = $('#burger');
  burger && burger.addEventListener('click', function () {
    var o = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', o);
  });
  $$('.dd>button').forEach(function (b) {
    b.addEventListener('click', function (e) {
      var li = b.parentNode, o = !li.classList.contains('open');
      $$('.dd.open').forEach(function (x) { if (x !== li) { x.classList.remove('open'); x.firstElementChild.setAttribute('aria-expanded', 'false'); } });
      li.classList.toggle('open', o); b.setAttribute('aria-expanded', o); e.stopPropagation();
    });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.dd')) $$('.dd.open').forEach(function (x) { x.classList.remove('open'); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { $$('.dd.open').forEach(function (x) { x.classList.remove('open'); }); document.body.classList.remove('menu-open'); } });
  $$('.menu a').forEach(function (a) { a.addEventListener('click', function () { document.body.classList.remove('menu-open'); }); });

  /* E-Mail kopieren */
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(b.dataset.copy) : Promise.reject()).then(function () { b.textContent = b.dataset.done; setTimeout(function () { b.textContent = t; }, 1600); }).catch(function () {});
    });
  });

  /* ---------- Einblenden ---------- */
  if ('IntersectionObserver' in window && !RM) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    $$('.rv').forEach(function (el) { io.observe(el); });
    var vio = new IntersectionObserver(function (es) { es.forEach(function (e) { var v = e.target; if (e.isIntersecting) { var p = v.play(); p && p.catch && p.catch(function () {}); } else v.pause(); }); }, { threshold: .05 });
    $$('video').forEach(function (v) { if (v.id !== 'heroVid') vio.observe(v); });
  } else $$('.rv').forEach(function (el) { el.classList.add('in'); });

  /* Zahlen hochzählen */
  function countUp(el) {
    var to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0), suf = el.dataset.suf || '', t0 = performance.now();
    var nf = new Intl.NumberFormat(LOC, { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: to >= 10000 });
    (function f(t) { var p = clamp((t - t0) / 1600, 0, 1); el.textContent = nf.format(to * ease(p)) + suf; if (p < 1) requestAnimationFrame(f); })(t0);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { if (!RM) countUp(e.target); cio.unobserve(e.target); } }); }, { threshold: .4 });
    $$('.stats [data-to]').forEach(function (el) { cio.observe(el); });
  }

  /* ---------- Scroll-Effekte ---------- */
  /* Safari meldet Scroll-Schritte unregelmaessig. Werte springen deshalb nicht direkt,
     sondern gleiten in wenigen Frames zum Ziel (sm). Das nimmt das Zittern. */
  var SDA = !RM && window.CSS && CSS.supports && CSS.supports('animation-timeline: view()') && CSS.supports('animation-range: entry 0% entry 70%');
  if (SDA) document.documentElement.classList.add('sda');
  var tasks = [];
  var ticking = false, moving = false, lastT = 0, A = .25;
  function sm(o, key, target) {
    return target; /* kein Nachgleiten mehr: Bewegung folgt exakt dem Scrollen und stoppt sofort */
  }
  function frame(t) {
    ticking = false; moving = false;
    var dt = lastT ? Math.min(64, t - lastT) : 16.7; lastT = t;
    A = 1 - Math.pow(.78, dt / 16.7);
    var vh = window.innerHeight, ws = tasks.map(function (f) { return f(vh); });
    ws.forEach(function (w) { if (typeof w === 'function') w(); });
    if (moving) req(); else lastT = 0;
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', req, { passive: true }); window.addEventListener('resize', req);

  // Parallaxe
  if (!RM) $$('[data-par]').forEach(function (el) {
    var k = parseFloat(el.dataset.par);
    tasks.push(function (vh) { var r = el.parentNode.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return; el.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - vh / 2) * -k).toFixed(1) + 'px,0)'; });
  });
  if (!RM && !SDA) $$('.ph-img img').forEach(function (el) {
    tasks.push(function () { var y = Math.min(window.scrollY, 1300); el.style.transform = 'translate3d(0,' + (y * .22).toFixed(1) + 'px,0) scale(1.06)'; });
  });

  /* Hero */
  var hero = $('#hero');
  if (hero) {
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { hero.classList.toggle('live', e.isIntersecting); }); }, { rootMargin: '300px 0px' }).observe(hero);
    else hero.classList.add('live');
    var h1 = $('#heroTitle');
    if (h1 && !RM) {
      var i = 0, tw = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT), nodes = [];
      while (tw.nextNode()) if (tw.currentNode.textContent.trim()) nodes.push(tw.currentNode);
      nodes.forEach(function (n) {
        var f = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w.trim()) { f.appendChild(document.createTextNode(w)); return; }
          var s = document.createElement('span'); s.className = 'w'; s.style.animationDelay = (0.15 + i++ * .12) + 's'; s.textContent = w; f.appendChild(s);
        });
        n.parentNode.replaceChild(f, n);
      });
    }
    var vid = $('#heroVid'), copy = $('#heroCopy');
    if (vid) { vid.addEventListener('playing', function () { $('.hero .poster').style.opacity = 0; }); }
    if (!RM && !SDA) tasks.push(function (vh) {
      var y = window.scrollY; if (y > vh * 1.3) return;
      var p = y / vh;
      if (vid) vid.style.transform = 'scale(' + (1 + p * .12) + ')';
      copy.style.transform = 'translate3d(0,' + (y * .35) + 'px,0)'; copy.style.opacity = 1 - p * 1.3;
    });
  }

  /* Steigflug: Flugzeug, Wolken, Meilensteine */
  var flight = $('#flight');
  if (flight) {
    var stage = $('#stage'), plane = $('#plane'), strip = $('#strip');
    var cards = $$('.mcard', stage), fill = $('#daysFill'), marks = $$('.days-mark', stage), now = $('#daysNow');
    var W = 0, H = 0, U = 1;
    // Stadtstreifen wie auf der alten Seite: feste Koordinaten 3600 x 1075, sichtbar sind 1512 x 791 Einheiten
    function size() { W = stage.clientWidth; H = stage.clientHeight; U = Math.max(H / 791, W / 1512); }
    function path(t) { // Flieger kommt hinter den Häusern hervor und steigt
      var x = -0.12 + 1.24 * t, y = .62 - .34 * t - Math.sin(t * Math.PI) * .05;
      return [x * W, y * H];
    }
    /* Mit Scroll-Animationen des Browsers: Bewegung laeuft im Takt des Scrollens (kein Zittern in Safari).
       Die Bahnen werden als Keyframes vorberechnet und bei Groessenaenderung neu gebaut. */
    var kfEl = null;
    function cardAt(i, p) {
      var seg = [[0, .36], [.36, .55], [.55, 1.01]][i], k = (p - seg[0]) / (seg[1] - seg[0]), o, y;
      if (k < 0) { o = 0; y = 40; } else if (k > 1 && i < 2) { o = 0; y = -40; }
      else { var e = clamp(k * 4, 0, 1), x = i < 2 ? clamp((1 - k) * 4, 0, 1) : 1; o = Math.min(e, x); y = (1 - e) * 40 - (1 - x) * 40; }
      return [o, y];
    }
    function buildKF() {
      if (!SDA) return;
      var N = 48, css = '', i, q, tx, a, b, ang, end = -(3600 * U - W);
      css += '@keyframes flStrip{from{transform:translate3d(0,0,0) scale(' + U + ')}to{transform:translate3d(' + end.toFixed(1) + 'px,0,0) scale(' + U + ')}}';
      css += '@keyframes flPlane{';
      for (i = 0; i <= N; i++) {
        q = i / N; tx = end * q; a = path(q); b = path(Math.min(1, q + .01)); ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * .5;
        css += (q * 100).toFixed(3) + '%{transform:translate3d(' + ((a[0] - tx) / U - 160).toFixed(1) + 'px,' + (a[1] / U - 175).toFixed(1) + 'px,0) rotate(' + ang.toFixed(4) + 'rad)}';
      }
      css += '}';
      cards.forEach(function (c, ci) {
        c.setAttribute('data-fi', ci);
        css += '@keyframes flCard' + ci + '{';
        for (i = 0; i <= 100; i++) { var v = cardAt(ci, i / 100); css += i + '%{opacity:' + v[0].toFixed(3) + ';transform:translate(-50%,' + v[1].toFixed(1) + 'px) scale(' + (.94 + v[0] * .06).toFixed(4) + ')}'; }
        css += '}';
        css += 'html.sda #flight.live #stage .mcard[data-fi="' + ci + '"]{animation:flCard' + ci + ' linear both;animation-timeline:--flight;animation-range:contain 0% contain 100%}';
      });
      if (!kfEl) { kfEl = document.createElement('style'); kfEl.id = 'flightKF'; document.head.appendChild(kfEl); }
      kfEl.textContent = css;
      strip.style.transform = plane.style.transform = '';
      cards.forEach(function (c) { c.style.opacity = c.style.transform = ''; });
    }
    size(); buildKF();
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { flight.classList.toggle('live', e.isIntersecting); }); }, { rootMargin: '300px 0px' }).observe(flight);
    else flight.classList.add('live');
    var kfT; window.addEventListener('resize', function () { size(); clearTimeout(kfT); kfT = setTimeout(buildKF, 120); req(); });
    tasks.push(function (vh) {
      var r = flight.getBoundingClientRect(), tot = r.height - vh;
      if (r.bottom < 0 || r.top > vh) return;
      if (SDA) {
        var pq = clamp(-r.top / tot, 0, 1), dq = Math.round(pq * 90);
        var fq = pq.toFixed(4); if (fq === fill._v) return; fill._v = fq;
        return function () {
          if (now.textContent !== String(dq)) now.textContent = dq;
          fill.style.transform = 'scaleX(' + fq + ')';
          [0, 30, 45, 90].forEach(function (d, i) { marks[i].classList.toggle('on', dq >= d); });
        };
      }
      var p = sm(flight, 'p', clamp(-r.top / tot, 0, 1));
      var tx = -(3600 * U - W) * p;
      strip.style.transform = 'translate3d(' + tx + 'px,0,0) scale(' + U + ')';
      var a = path(p), b = path(Math.min(1, p + .01)), ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * .5;
      plane.style.transform = 'translate3d(' + ((a[0] - tx) / U - 160) + 'px,' + (a[1] / U - 175) + 'px,0) rotate(' + ang + 'rad)';
      var day = Math.round(p * 90); now.textContent = day;
      fill.style.width = (p * 100) + '%';
      [0, 30, 45, 90].forEach(function (d, i) { marks[i].classList.toggle('on', day >= d); });
      var seg = [[0, .36], [.36, .55], [.55, 1.01]];
      cards.forEach(function (c, i) {
        var s = seg[i], k = (p - s[0]) / (s[1] - s[0]), o, y;
        if (k < 0) { o = 0; y = 40; } else if (k > 1 && i < 2) { o = 0; y = -40; }
        else { var e = clamp(k * 4, 0, 1), x = i < 2 ? clamp((1 - k) * 4, 0, 1) : 1; o = Math.min(e, x); y = (1 - e) * 40 - (1 - x) * 40; }
        c.style.opacity = o; c.style.transform = 'translate(-50%,' + y + 'px) scale(' + (.94 + o * .06) + ')';
      });
    });
  }

  /* Fünf Hebel: Bahnen klappen beim Darüberfahren auf (Handy: erster Tipp öffnet) */
  var lanes = $$('.lane');
  function laneOn(l) { lanes.forEach(function (x) { x.classList.toggle('on', x === l); }); }
  lanes.forEach(function (l) {
    l.addEventListener('mouseenter', function () { if (window.innerWidth > 860) laneOn(l); });
    l.addEventListener('focus', function () { laneOn(l); });
    l.addEventListener('click', function (e) { if (window.innerWidth > 860 && !l.classList.contains('on')) { e.preventDefault(); laneOn(l); } });
  });

  /* Der komplette Aufbau: Karten kippen von unten hoch und stapeln sich */
  /* Aussage: Wörter füllen sich beim Scrollen */
  var stmt = $('#stmt');
  if (stmt) {
    var tw2 = document.createTreeWalker(stmt, NodeFilter.SHOW_TEXT), tn = [];
    while (tw2.nextNode()) tn.push(tw2.currentNode);
    tn.forEach(function (n) {
      var f = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (w) { if (!w) return; if (!w.trim()) { f.appendChild(document.createTextNode(w)); return; } var sp = document.createElement('span'); sp.className = 'sw'; sp.textContent = w; f.appendChild(sp); });
      n.parentNode.replaceChild(f, n);
    });
    var sws = $$('.sw', stmt);
    if (RM) sws.forEach(function (x) { x.classList.add('on'); });
    else tasks.push(function (vh) {
      var r = stmt.getBoundingClientRect(); if (r.bottom < -50 || r.top > vh + 50) return;
      var p = clamp((vh * .85 - r.top) / (r.height + vh * .35), 0, 1), n = Math.round(p * sws.length * 1.08);
      if (n === stmt._n) return; stmt._n = n;
      return function () { sws.forEach(function (x, i) { x.classList.toggle('on', i < n); }); };
    });
  }

  /* Akten stapeln */
  /* Kathedrale: Punkt auf der Schiene */
  var rail = $('#rail'), dot = $('#dot');
  if (rail && dot) tasks.push(function (vh) {
    var r = rail.getBoundingClientRect(); var p = sm(dot, 'p', clamp((vh * .55 - r.top) / r.height, 0, 1)); var v = (p * r.height).toFixed(1); if (v === dot._v) return; dot._v = v; return function () { dot.style.transform = 'translate3d(0,' + v + 'px,0)'; };
  });

  /* Deshalb wir */
  var sw = $('#switch'), why = $('#why');
  if (sw) {
    var counted = false;
    sw.addEventListener('click', function (e) {
      var on = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', on); why.classList.toggle('on', on);
      if (on && !counted) { counted = true; $$('.pcard .n', why).forEach(function (n) { if (!RM) countUp(n); }); }
    });
    // Schalter bleibt aus, bis man ihn selbst umlegt
  }

  /* Gruppe: Videos bei Hover */
  $$('.sub').forEach(function (s) {
    var v = $('video', s); if (!v) return;
    s.addEventListener('mouseenter', function () { var p = v.play(); p && p.catch && p.catch(function () {}); });
  });

  /* Finale: Herkules und Felsen folgen der Maus */
  var arena = $('#arena');
  if (arena && !RM) {
    var rocks = $$('.rock', arena), statue = $('.statue', arena), band = $('.band-txt', arena), mx = 0, my = 0, cx = 0, cy = 0, run = false;
    function place() { var a = arena.getBoundingClientRect(), st = statue.getBoundingClientRect(), sh = st.height || a.height * .8, cxs = st.left - a.left + st.width / 2, top = st.top - a.top; var k = Math.min(1, (a.width / 2 - 8) / (.92 * sh)); /* schmale Bildschirme: Felsen enger um Herkules, damit alle sichtbar bleiben */ rocks.forEach(function (r) { r.style.width = (sh * parseFloat(r.dataset.w) * Math.max(k, .62)) + 'px'; r.dataset.bx = cxs + parseFloat(r.dataset.x) * sh * k; r.dataset.by = top + parseFloat(r.dataset.y) * sh; }); }
    statue.addEventListener('load', place);
    place(); window.addEventListener('resize', place);
    arena.addEventListener('pointermove', function (e) { var r = arena.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5; if (!run) { run = true; requestAnimationFrame(loop); } });
    function loop() {
      var ar = arena.getBoundingClientRect(); if (ar.bottom < -50 || ar.top > window.innerHeight + 50) { run = false; return; }
      cx += (mx - cx) * .09; cy += (my - cy) * .09;
      var t = performance.now() / 1000;
      rocks.forEach(function (r, i) { var d = parseFloat(r.dataset.d); r.style.transform = 'translate3d(' + (+r.dataset.bx - r.offsetWidth / 2 + cx * 280 * d) + 'px,' + (+r.dataset.by - r.offsetHeight / 2 + cy * 200 * d + Math.sin(t * .7 + i * 1.7) * 7) + 'px,0) rotate(' + (cx * 40 * d + Math.sin(t * .4 + i) * 4 + i * 23) + 'deg)'; });
      statue.style.transform = 'translateX(-50%)';
      band.style.transform = 'perspective(900px) rotateZ(' + (cx * -5) + 'deg) rotateY(' + (cx * 6) + 'deg) rotateX(' + (cy * -5) + 'deg)';
      requestAnimationFrame(loop);
    }
    function wake() { if (!run) { run = true; requestAnimationFrame(loop); } }
    window.addEventListener('scroll', wake, { passive: true }); wake();
  }
  frame();

  /* Runde 28: ausserhalb des Bildes ruht alles (sonst zittern haftende Karten in Safari) */
  if ('IntersectionObserver' in window) {
    var offIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        e.target.classList.toggle('offscr', !e.isIntersecting);
        if (e.target.id === 'hero') {
          var v = $('#heroVid'); if (!v || !v.play) return;
          if (e.isIntersecting) { var q = v.play(); q && q.catch && q.catch(function () {}); } else v.pause();
        }
      });
    }, { rootMargin: '300px 0px' });
    $$('main > section, footer').forEach(function (x) { offIO.observe(x); });
  }

  /* ---------- Formulare ---------- */
  function api(action, body) {
    return fetch(G.api, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: G.key, Authorization: 'Bearer ' + G.key }, body: JSON.stringify(Object.assign({ action: action, lang: LANG, page: location.pathname }, body || {})) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.error) { var e = new Error(j.error || ('HTTP ' + r.status)); e.code = j.code || r.status; throw e; } return j; }); });
  }
  function check(form) {
    var ok = true;
    $$('input,textarea,select', form).forEach(function (el) {
      if (el.name === 'website' || el.type === 'file') return;
      var bad = !el.checkValidity() || (el.required && !String(el.value).trim());
      if (el.type === 'email' && el.value && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(el.value.trim())) bad = true;
      var box = el.closest('.fld, .chk'); box && box.classList.toggle('bad', bad);
      if (bad && ok) { ok = false; el.focus(); }
    });
    return ok;
  }
  function vals(form) {
    var o = {};
    $$('input,textarea,select', form).forEach(function (el) { if (!el.name || el.type === 'file') return; o[el.name] = el.type === 'checkbox' ? el.checked : String(el.value).trim(); });
    return o;
  }
  function doneHtml(h, p, extra) { return '<div class="done"><span class="ok">' + ICO_OK + '</span><h3 class="h3">' + h + '</h3><p>' + p + '</p>' + (extra || '') + '</div>'; }
  function fail(form, e) {
    var m = $('.fmsg', form); m.className = 'fmsg err';
    m.innerHTML = esc(G.t.error).replace('info@gmsrvcs.com', '<a href="mailto:info@gmsrvcs.com">info@gmsrvcs.com</a>');
  }
  function readFile(f) {
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1]); }; r.onerror = rej; r.readAsDataURL(f); });
  }
  $$('form[data-form]').forEach(function (form) {
    var kind = form.dataset.form;
    if (kind === 'book') return; // eigene Logik unten
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!check(form)) return;
      var v = vals(form), btn = $('button[type=submit]', form), lbl = btn.innerHTML;
      v.topic = v.topic || form.dataset.topic || '';
      btn.disabled = true; btn.querySelector('span').textContent = G.t.sending;
      var file = $('input[type=file]', form), go;
      if (file && file.files[0]) {
        if (file.files[0].size > 5 * 1024 * 1024) { btn.disabled = false; btn.innerHTML = lbl; file.closest('.fld').classList.add('bad'); return; }
        go = readFile(file.files[0]).then(function (b64) { v.cv = { name: file.files[0].name, type: file.files[0].type, data: b64 }; return api(kind, v); });
      } else go = api(kind, v);
      go.then(function () {
        var first = (v.name || '').split(' ')[0];
        var c = (G.t.ok || {})[kind] || {};
        form.innerHTML = doneHtml(esc(c.h || '').replace('{name}', esc(first)), esc(c.p || ''), kind === 'contact' && c.book ? '<a class="link" href="' + c.bookUrl + '">' + esc(c.book) + '</a>' : '');
        form.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      }).catch(function (err) { btn.disabled = false; btn.innerHTML = lbl; fail(form, err); });
    });
  });
  // Themenvorwahl über ?t=
  var qt = new URLSearchParams(location.search).get('t'), ts = $('#f-topic');
  if (qt && ts && $('option[value="' + qt + '"]', ts)) ts.value = qt;

  /* ---------- Karriere: Filter, Stellen, Easter Egg ---------- */
  $$('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('[data-filter]').forEach(function (x) { x.classList.toggle('on', x === b); });
      $$('.job').forEach(function (j) { j.hidden = b.dataset.filter !== 'all' && j.dataset.cat !== b.dataset.filter; });
    });
  });
  $$('[data-job]').forEach(function (j) {
    j.addEventListener('click', function (e) {
      var s = $('#f-job'); if (!s) return; e.preventDefault(); s.value = j.dataset.job;
      $('#apply').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); setTimeout(function () { $('#f-name').focus({ preventScroll: true }); }, 700);
    });
  });
  var egg = $('#egg'), dlg = $('#eggDlg');
  if (egg && dlg) {
    egg.addEventListener('click', function () {
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      try { localStorage.setItem('gm-egg', '1'); } catch (e) {}
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }

  /* ---------- Bewerbung: erst Stelle waehlen, dann Formular ---------- */
  var applier = $('#applier');
  if (applier) {
    var apJobs = $$('.ap-job', applier), apPick = $('#apPick'), apForm = $('#apForm'), apHid = $('#f-job'), apSteps = $$('.bk-steps li', applier);
    var apStep = function (n) { apSteps.forEach(function (s, i) { s.classList.toggle('on', i === n - 1); s.classList.toggle('ok', i < n - 1); }); };
    var apUrl = function (id) { try { var u = new URL(location.href); if (id) u.searchParams.set('job', id); else u.searchParams.delete('job'); history.replaceState(null, '', u.pathname + u.search); } catch (e) {} };
    var apChoose = function (id, user) {
      var b = apJobs.filter(function (x) { return x.dataset.ap === id; })[0]; if (!b) return;
      apJobs.forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      apHid.value = id; $('#apChosen').textContent = $('.ap-t', b).textContent;
      apPick.hidden = true; apForm.hidden = false; apStep(2); apUrl(id);
      if (user) { applier.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); setTimeout(function () { var n = $('#f-name'); n && n.focus({ preventScroll: true }); }, 500); }
    };
    apJobs.forEach(function (b) { b.addEventListener('click', function () { apChoose(b.dataset.ap, true); }); });
    $('#apChange').addEventListener('click', function () { apForm.hidden = true; apPick.hidden = false; apStep(1); apUrl(''); });
    $$('[data-apf]', applier).forEach(function (c) {
      c.addEventListener('click', function () {
        $$('[data-apf]', applier).forEach(function (x) { x.classList.toggle('on', x === c); });
        apJobs.forEach(function (x) { x.hidden = c.dataset.apf !== 'all' && x.dataset.cat !== c.dataset.apf && x.dataset.ap !== 'init'; });
      });
    });
    var apQ = new URLSearchParams(location.search), apCode = apQ.get('code');
    if (apCode && $('#f-code')) $('#f-code').value = apCode.slice(0, 30);
    apStep(1);
    if (apQ.get('job')) apChoose(apQ.get('job'), false);
    new MutationObserver(function () { if ($('.done', apForm)) apStep(4); }).observe(apForm, { childList: true });
  }

  /* ---------- Terminbuchung ---------- */
  var booker = $('#booker');
  if (booker) {
    var B = G.t.book, WD = B.weekdays.split('|'), MO = B.months.split('|');
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Sofia';
    $('#bkTz').textContent = tz.replace(/_/g, ' ');
    var state = { slots: null, month: null, day: null, slot: null };
    var daysEl = $('#bkDays'), slotsEl = $('#bkSlots'), form = $('#bkForm'), fb = $('#bkFallback'), pick = $('#bkPick'), doneEl = $('#bkDone');
    var steps = $$('.bk-steps li');
    function stepTo(n) { steps.forEach(function (s, i) { s.classList.toggle('on', i === n - 1); s.classList.toggle('ok', i < n - 1); }); }
    stepTo(1);
    var dkey = function (d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
    var fmtT = new Intl.DateTimeFormat(LOC, { hour: '2-digit', minute: '2-digit' });
    var fmtD = new Intl.DateTimeFormat(LOC, { weekday: 'long', day: 'numeric', month: 'long' });
    var byDay = {};
    function renderMonth() {
      var m = state.month, first = new Date(m.getFullYear(), m.getMonth(), 1), off = (first.getDay() + 6) % 7, n = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      $('#bkMonth').textContent = MO[m.getMonth()] + ' ' + m.getFullYear();
      var h = ''; for (var i = 0; i < off; i++) h += '<span></span>';
      var today = dkey(new Date());
      for (var d = 1; d <= n; d++) {
        var k = dkey(new Date(m.getFullYear(), m.getMonth(), d)), has = byDay[k] && byDay[k].length;
        h += has ? '<button type="button" data-d="' + k + '" class="' + (k === state.day ? 'sel' : '') + (k === today ? ' today' : '') + '">' + d + '</button>' : '<span class="' + (k === today ? 'today' : '') + '">' + d + '</span>';
      }
      daysEl.innerHTML = h;
      var keys = Object.keys(byDay).sort(), minM = keys[0], maxM = keys[keys.length - 1];
      var cur = m.getFullYear() * 12 + m.getMonth();
      $('#bkPrev').disabled = !minM || cur <= (+minM.slice(0, 4)) * 12 + (+minM.slice(5, 7) - 1);
      $('#bkNext').disabled = !maxM || cur >= (+maxM.slice(0, 4)) * 12 + (+maxM.slice(5, 7) - 1);
    }
    function renderSlots() {
      if (!state.day) { slotsEl.innerHTML = ''; return; }
      var d = new Date(state.day + 'T12:00:00');
      $('#bkDayLbl').textContent = fmtD.format(d);
      var L = byDay[state.day] || [];
      slotsEl.innerHTML = L.length ? L.map(function (t) { return '<button type="button" data-t="' + t + '">' + fmtT.format(new Date(t)) + '</button>'; }).join('') : '<p class="empty">' + esc(B.none) + '</p>';
      stepTo(2);
    }
    daysEl.addEventListener('click', function (e) { var b = e.target.closest('button[data-d]'); if (!b) return; state.day = b.dataset.d; renderMonth(); renderSlots(); });
    $('#bkPrev').addEventListener('click', function () { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); renderMonth(); });
    $('#bkNext').addEventListener('click', function () { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); renderMonth(); });
    slotsEl.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-t]'); if (!b) return;
      state.slot = +b.dataset.t;
      $('#bkChosen').textContent = fmtD.format(new Date(state.slot)) + ', ' + fmtT.format(new Date(state.slot));
      pick.hidden = true; form.hidden = false; stepTo(3); $('#f-name', form).focus();
    });
    $('#bkChange').addEventListener('click', function () { form.hidden = true; pick.hidden = false; stepTo(2); });
    function load() {
      slotsEl.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div>';
      $('#bkDayLbl').textContent = B.loading;
      return api('slots', { tz: tz }).then(function (j) {
        byDay = {};
        (j.slots || []).forEach(function (t) { var k = dkey(new Date(t)); (byDay[k] = byDay[k] || []).push(t); });
        var keys = Object.keys(byDay).sort();
        if (!keys.length) throw new Error('keine Zeiten');
        state.day = keys[0]; state.month = new Date(keys[0] + 'T12:00:00'); state.month.setDate(1);
        renderMonth(); renderSlots();
      }).catch(function () { pick.hidden = true; fb.hidden = false; stepTo(3); });
    }
    load();
    form.addEventListener('submit', function (e) {
      e.preventDefault(); if (!check(form)) return;
      var v = vals(form), btn = $('button[type=submit]', form), lbl = btn.innerHTML;
      v.slot = state.slot; v.tz = tz;
      btn.disabled = true; btn.querySelector('span').textContent = G.t.sending;
      api('book', v).then(function (j) {
        var first = (v.name || '').split(' ')[0], s = new Date(state.slot), en = new Date(state.slot + 30 * 60000);
        var ics = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GM Services//Web//DE', 'BEGIN:VEVENT', 'UID:' + (j.id || Date.now()) + '@gmsrvcs.com',
          'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''), 'DTSTART:' + s.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''), 'DTEND:' + en.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''),
          'SUMMARY:GM Services · ' + document.title.split('·')[0].trim(), 'DESCRIPTION:' + (j.link || ''), 'LOCATION:' + (j.link || 'Online'), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'));
        form.hidden = true; doneEl.hidden = false; steps.forEach(function (x) { x.classList.add('ok'); x.classList.remove('on'); });
        doneEl.innerHTML = doneHtml(esc(B.ok_h).replace('{name}', esc(first)), esc(B.ok_p).replace('{mail}', '<b>' + esc(v.email) + '</b>'), '<p><b>' + esc($('#bkChosen').textContent) + '</b></p><a class="btn dark" download="gm-services-termin.ics" href="' + ics + '"><span>' + esc(B.ok_cal) + '</span></a>');
      }).catch(function (err) {
        btn.disabled = false; btn.innerHTML = lbl;
        if (err.code === 'taken') { var m = $('.fmsg', form); m.className = 'fmsg err'; m.textContent = B.taken; form.hidden = true; pick.hidden = false; load(); return; }
        fail(form, err);
      });
    });
  }
})();
