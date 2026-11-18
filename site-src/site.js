/* Love Panel 3.0 - Site motoru
 * window.LOVE_CONFIG (js/config.js) verisinden siteyi çizer.
 * Panel önizlemesi de bu dosyanın aynısını kullanır: LoveSite.update(config)
 */
(function (root) {
  'use strict';
  var D = document;

  /* ---------- küçük yardımcılar ---------- */
  function el(tag, cls, txt) { var e = D.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- renk matematiği ---------- */
  function parseHex(h) {
    h = String(h || '').trim().replace(/^#/, '');
    if (h.length === 3) h = h.replace(/./g, '$&$&');
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [h, s * 100, l * 100];
  }
  function hsl2rgb(h, s, l) {
    s /= 100; l /= 100;
    var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  function hsl(h, s, l, a) {
    h = Math.round(h); s = Math.round(s); l = Math.round(l);
    return a == null ? 'hsl(' + h + ',' + s + '%,' + l + '%)' : 'hsla(' + h + ',' + s + '%,' + l + '%,' + a + ')';
  }
  function lum(c) {
    var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function rgbCss(c, a) { return a == null ? 'rgb(' + c.join(',') + ')' : 'rgba(' + c.join(',') + ',' + a + ')'; }
  function mixRgb(a, b, t) { return [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }); }

  /* ---------- tema: iki renkten tüm değişkenler ---------- */
  function computeTheme(t) {
    t = t || {};
    var p = parseHex(t.primary) || [167, 122, 242], s = parseHex(t.secondary) || [255, 159, 207];
    var P = rgb2hsl(p[0], p[1], p[2]), S = rgb2hsl(s[0], s[1], s[2]);
    var dark = t.mode !== 'light', v = {}, pv, sv;
    if (dark) {
      pv = [P[0], clamp(P[1], 35, 100), clamp(P[2], 50, 68)];
      sv = [S[0], clamp(S[1], 30, 100), clamp(S[2], 66, 86)];
      v.bg = hsl(P[0], clamp(P[1] * 0.6, 28, 55), 7);
      v.bg2 = hsl(S[0], clamp(S[1] * 0.5, 24, 50), 15);
      v.tx = hsl(S[0], 35, 95); v.mu = hsl(S[0], 24, 80);
      v.ac = hsl(S[0], clamp(S[1], 35, 100), clamp(S[2], 78, 88));
      v.card = 'rgba(255,255,255,.07)'; v.line = hsl(sv[0], sv[1], sv[2], 0.28);
      v.paper = hsl(S[0], 32, 93); v.ink = hsl(P[0], 38, 17);
    } else {
      pv = [P[0], clamp(P[1], 28, 85), clamp(P[2], 34, 56)];
      sv = [S[0], clamp(S[1], 30, 90), clamp(S[2], 70, 88)];
      v.bg = hsl(S[0], clamp(S[1], 30, 70), 95); v.bg2 = hsl(P[0], clamp(P[1] * 0.6, 28, 60), 91);
      v.tx = hsl(P[0], 32, 15); v.mu = hsl(P[0], 20, 33);
      v.ac = hsl(P[0], clamp(P[1], 30, 80), clamp(P[2], 28, 40));
      v.card = 'rgba(255,255,255,.66)'; v.line = hsl(pv[0], pv[1], pv[2], 0.3);
      v.paper = hsl(S[0], clamp(S[1], 30, 60), 96); v.ink = hsl(P[0], 34, 20);
    }
    var pr = hsl2rgb(pv[0], pv[1], pv[2]), sr = hsl2rgb(sv[0], sv[1], sv[2]);
    var end = mixRgb(pr, sr, 0.6), white = [255, 255, 255], deep = [28, 18, 40];
    var onBtn = Math.min(contrast(pr, white), contrast(end, white)) >= Math.min(contrast(pr, deep), contrast(end, deep)) ? white : deep;
    v.p = rgbCss(pr); v.s = rgbCss(sr);
    v.btn = 'linear-gradient(135deg,' + rgbCss(pr) + ',' + rgbCss(end) + ')';
    v['on-btn'] = rgbCss(onBtn); v.glow = rgbCss(pr, 0.45); v['s-soft'] = rgbCss(sr, 0.28); v['p-soft'] = rgbCss(pr, 0.25);
    v.sky1 = hsl(P[0], clamp(P[1] * 0.7, 35, 60), 5); v.sky2 = hsl(S[0], clamp(S[1] * 0.55, 30, 55), 15);
    v['sky-star'] = hsl(S[0], 70, 90);
    var hp = hsl2rgb(pv[0], pv[1], dark ? Math.max(pv[2], 66) : Math.min(pv[2], 52));  // kalpler zeminden ayrışsın
    v._hearts = { primary: rgbCss(hp), secondary: rgbCss(sr), white: '#ffffff' };
    v._dark = dark;
    return v;
  }

  /* ---------- örnek fotoğraflar (yalnızca panel önizlemesi için) ---------- */
  function sampleSvg(w, h, c1, c2, n) {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs><rect width="' + w + '" height="' + h + '" fill="url(#g)"/><circle cx="' + w * 0.72 + '" cy="' + h * 0.28 + '" r="' + w * 0.09 + '" fill="#fff" opacity=".35"/><path d="M0 ' + h * 0.85 + ' Q' + w * 0.3 + ' ' + h * 0.55 + ' ' + w * 0.55 + ' ' + h * 0.8 + ' T' + w + ' ' + h * 0.7 + ' V' + h + ' H0Z" fill="#000" opacity=".18"/><text x="50%" y="52%" text-anchor="middle" font-size="' + w * 0.2 + '" fill="#fff" opacity=".85">&#9829;</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }
  function samplePhotos(v) {
    var a = v.p, b = v.s, dims = [[800, 1000], [900, 900], [1000, 680], [800, 1000], [800, 1060], [900, 900]];
    var caps = ['İlk buluşmamız', 'Birlikte gülerken', 'Yaz tatili', 'Sürpriz kutlama', 'Gün batımı', 'Bizim fotoğrafımız'];
    return dims.map(function (d, i) { return { src: sampleSvg(d[0], d[1], i % 2 ? b : a, i % 2 ? a : b), caption: caps[i], sample: true }; });
  }

  /* ---------- site ---------- */
  var S = { app: null, cfg: null, hearts: null, tickTimer: 0, photoSig: '', audioSrc: null, started: false, firstGesture: false };
  var MEMORIES = ['stars', 'clothesline', 'scrapbook', 'polaroid', 'glass'];

  function build() {
    var app = el('div'); app.id = 'app';
    app.innerHTML =
      '<div class="intro" id="intro" role="dialog" aria-live="polite"><div class="intro-heart" aria-hidden="true">♥</div><h2 class="intro-title"></h2><p class="intro-sub"></p><button type="button" class="btn" id="introBtn"></button></div>' +
      '<main>' +
      '<header class="hero" id="hero"><div class="hero-bg"></div><div class="hero-in">' +
      '<p class="names"></p><h1 class="hero-title"></h1><p class="hero-text"></p>' +
      '<div class="counter" aria-label="Birlikte geçen zaman"><div class="unit"><b data-u="d">0</b><span>Gün</span></div><div class="unit"><b data-u="h">0</b><span>Saat</span></div><div class="unit"><b data-u="m">0</b><span>Dakika</span></div><div class="unit"><b data-u="s">0</b><span>Saniye</span></div></div>' +
      '<p class="since">♥ Birlikte geçen zaman ♥</p><div class="met" hidden></div></div></header>' +
      '<section class="album" id="album"><div class="atmo" aria-hidden="true"></div><div class="album-in"><h2 class="album-title"></h2><div class="gal"></div></div></section>' +
      '</main><footer class="foot"></footer>' +
      '<div class="player" hidden><button type="button" class="pl-btn" aria-label="Müziği oynat / duraklat">▶</button><div class="pl-meta"><span class="pl-title"></span><span class="pl-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div></div>' +
      '<audio id="audio" loop preload="metadata"></audio>' +
      '<div class="lightbox" hidden><button type="button" class="lb-close" aria-label="Kapat">×</button><img alt=""><p></p></div>';
    D.body.appendChild(app);
    S.app = app;
    S.hearts = root.LoveHearts ? root.LoveHearts() : null;

    $('#introBtn').addEventListener('click', function () { hideIntro(); startMusic(); });
    $('.pl-btn').addEventListener('click', toggleMusic);
    $('#audio').addEventListener('play', syncPlayer); $('#audio').addEventListener('pause', syncPlayer);
    $('.lightbox').addEventListener('click', closeLightbox);
    D.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
    $('.gal').addEventListener('click', function (e) {
      var img = e.target.closest && e.target.closest('.frame img'); if (!img) return;
      var lb = $('.lightbox'); lb.querySelector('img').src = img.src; lb.querySelector('p').textContent = img.alt || ''; lb.hidden = false;
    });
    var first = function () {
      if (S.firstGesture) return; S.firstGesture = true;
      if (S.cfg && !S.cfg.preview && !S.cfg.intro.enabled) startMusic();
    };
    D.addEventListener('pointerdown', first, { once: true });
    setInterval(tick, 1000);
  }
  function $(sel) { return S.app.querySelector(sel); }
  function closeLightbox() { var lb = $('.lightbox'); if (lb) lb.hidden = true; }
  function hideIntro() { $('#intro').classList.add('hide'); }

  /* müzik */
  function audio() { return $('#audio'); }
  function startMusic() {
    var c = S.cfg; if (!c || c.preview || !c.music.enabled || !c.music.src || !c.music.autoplay) return;
    audio().play().catch(function () {});
  }
  function toggleMusic() { var a = audio(); if (!a.src) return; if (a.paused) a.play().catch(function () {}); else a.pause(); }
  function syncPlayer() { var pl = $('.player'), a = audio(); pl.classList.toggle('playing', !a.paused); $('.pl-btn').textContent = a.paused ? '▶' : '❚❚'; }

  /* sayaç */
  function parseDate(v) { if (!v) return null; var p = String(v).split('-').map(Number); if (p.length < 3 || p.some(isNaN)) return null; return new Date(p[0], p[1] - 1, p[2], 0, 0, 0); }
  function tick() {
    if (!S.cfg) return;
    var st = parseDate(S.cfg.startDate), t = st ? Math.max(0, Math.floor((Date.now() - st.getTime()) / 1000)) : 0;
    var vals = { d: Math.floor(t / 86400), h: Math.floor(t % 86400 / 3600), m: Math.floor(t % 3600 / 60), s: t % 60 };
    Object.keys(vals).forEach(function (k) { var b = S.app.querySelector('[data-u="' + k + '"]'); if (b && b.textContent !== String(vals[k])) b.textContent = vals[k]; });
    var met = parseDate(S.cfg.metDate), box = $('.met');
    if (S.cfg.showMet && met) {
      var md = Math.max(0, Math.floor((Date.now() - met.getTime()) / 86400000));
      var n = box.querySelector('b'); if (n && n.textContent !== String(md)) n.textContent = md;
    }
  }

  /* albüm */
  function renderPhotos(list) {
    var gal = $('.gal'), sig = list.map(function (p) { return p.src; }).join('|');
    if (sig === S.photoSig) {   // yalnızca açıklama değişti: görselleri yeniden yükleme
      var caps = gal.querySelectorAll('figcaption'), imgs = gal.querySelectorAll('img');
      list.forEach(function (p, i) { if (caps[i]) caps[i].textContent = p.caption || ''; if (caps[i]) caps[i].hidden = !p.caption; if (imgs[i]) imgs[i].alt = p.caption || ''; });
      return;
    }
    S.photoSig = sig; gal.textContent = '';
    var tilts = [-3.2, 2.4, -1.4, 3.4, -2.2, 1.6, -3.6, 2.8, -.8, 1.2];
    list.forEach(function (p, i) {
      var fig = el('figure', 'ph');
      fig.style.setProperty('--i', i); fig.style.setProperty('--r', tilts[i % tilts.length] + 'deg');
      fig.style.setProperty('--d', ((i * 0.37) % 2.4).toFixed(2) + 's');
      var fr = el('div', 'frame'), img = el('img'); img.src = p.src; img.alt = p.caption || ''; img.loading = 'lazy'; img.decoding = 'async';
      fr.appendChild(img); fr.appendChild(el('i', 'd1')); fr.appendChild(el('i', 'd2'));
      var cap = el('figcaption', null, p.caption || ''); cap.hidden = !p.caption;
      fig.appendChild(fr); fig.appendChild(cap); gal.appendChild(fig);
    });
  }

  /* kayan yıldız atmosferi (sabit tohumlu: önizleme = gerçek site) */
  function buildStars() {
    var at = $('.atmo'); if (at.dataset.kind === 'stars') return;
    at.textContent = ''; at.dataset.kind = 'stars';
    var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (var i = 0; i < 70; i++) {
      var s = el('i', 'star'); var sz = 1 + rnd() * 2.4;
      s.style.cssText = 'left:' + (rnd() * 100).toFixed(1) + '%;top:' + (rnd() * 100).toFixed(1) + '%;width:' + sz.toFixed(1) + 'px;height:' + sz.toFixed(1) + 'px;animation-delay:' + (rnd() * 5).toFixed(1) + 's;animation-duration:' + (2.5 + rnd() * 3.5).toFixed(1) + 's';
      if (i % 9 === 0) s.className = 'star spark';
      at.appendChild(s);
    }
    for (var j = 0; j < 3; j++) { var m = el('i', 'meteor'); m.style.cssText = 'left:' + (20 + j * 28) + '%;top:' + (4 + j * 9) + '%;animation-delay:' + (j * 3.7 + 1) + 's;animation-duration:' + (9 + j * 2) + 's'; at.appendChild(m); }
  }
  function buildBulbs() {
    var at = $('.atmo'); if (at.dataset.kind === 'bulbs') return;
    at.textContent = ''; at.dataset.kind = 'bulbs';
    for (var i = 0; i < 16; i++) { var b = el('i', 'bulb'); b.style.cssText = 'left:' + (i * 6.6 + 1).toFixed(1) + '%;top:' + (14 + Math.sin(i * 0.8) * 5 + (i % 2) * 5).toFixed(1) + 'px;animation-delay:' + ((i * 0.43) % 3).toFixed(1) + 's'; at.appendChild(b); }
  }

  function update(cfg) {
    if (!S.app) build();
    S.cfg = cfg;
    var T = computeTheme(cfg.theme), root_ = D.documentElement;
    Object.keys(T).forEach(function (k) { if (k.charAt(0) !== '_') root_.style.setProperty('--' + k, T[k]); });
    root_.setAttribute('data-mode', T._dark ? 'dark' : 'light');
    D.title = cfg.pageTitle || (cfg.name1 + ' & ' + cfg.name2);

    // açılış
    var intro = $('#intro'), ie = cfg.intro || {};
    intro.style.display = ie.enabled ? '' : 'none';
    intro.querySelector('.intro-title').textContent = ie.title || '';
    intro.querySelector('.intro-sub').textContent = ie.sub || '';
    $('#introBtn').textContent = (ie.button || 'Aç') + ' ♥';

    // hero
    $('.names').textContent = (cfg.name1 || '') + ' & ' + (cfg.name2 || '');
    $('.hero-title').textContent = cfg.heroTitle || '';
    $('.hero-text').textContent = cfg.heroText || '';
    var hb = $('.hero-bg'); hb.style.backgroundImage = cfg.heroImage ? 'url("' + cfg.heroImage + '")' : ''; $('#hero').classList.toggle('has-img', !!cfg.heroImage);
    var met = $('.met'), showMet = cfg.showMet && parseDate(cfg.metDate);
    if (showMet) {
      met.hidden = false;
      var txt = cfg.metText ? cfg.metText : 'Tanıştığımız günden beri';
      met.textContent = ''; met.appendChild(D.createTextNode(txt)); met.appendChild(el('br')); met.appendChild(el('b', null, '0')); met.appendChild(D.createTextNode(' gündür hayatımdasın ♥'));
    } else met.hidden = true;

    // albüm
    var photos = (cfg.photos && cfg.photos.length) ? cfg.photos : (cfg.samplePhotos ? samplePhotos(T) : []);
    var album = $('#album'); album.hidden = !photos.length;
    $('.album-title').textContent = cfg.albumTitle || '';
    var mem = MEMORIES.indexOf(cfg.memory) > -1 ? cfg.memory : 'stars';
    album.className = 'album mem-' + mem + (cfg.photos && cfg.photos.length ? '' : ' is-sample');
    if (mem === 'stars') buildStars(); else if (mem === 'clothesline') buildBulbs(); else { var at = $('.atmo'); at.textContent = ''; at.dataset.kind = ''; }
    renderPhotos(photos);
    $('.foot').textContent = cfg.footerText || '';

    // kalpler
    if (S.hearts) { var hc = cfg.hearts || {}; S.hearts.set({ enabled: !!hc.enabled, color: T._hearts[hc.color] || '#fff', density: hc.density }); }

    // müzik
    var m = cfg.music || {}, a = audio(), pl = $('.player'), usable = m.enabled && m.src;
    pl.hidden = !usable;
    $('.pl-title').textContent = m.title ? '♪ ' + m.title : '♪ Müzik';
    if (usable) { if (S.audioSrc !== m.src) { S.audioSrc = m.src; a.src = m.src; } }
    else { if (!a.paused) a.pause(); if (S.audioSrc) { S.audioSrc = null; a.removeAttribute('src'); a.load(); } }
    syncPlayer();

    tick();
    if (cfg.preview && !S.introInit) { S.introInit = true; hideIntro(); }
  }

  root.LoveSite = {
    update: update, computeTheme: computeTheme,
    showIntro: function () { $('#intro').classList.remove('hide'); },
    hideIntro: function () { hideIntro(); },
    scrollToAlbum: function () { var a = $('#album'); if (a) a.scrollIntoView({ behavior: 'smooth' }); }
  };

  function boot() { if (root.LOVE_CONFIG) update(root.LOVE_CONFIG); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
