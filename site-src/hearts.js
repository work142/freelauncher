/* Love Panel 3.0 - Kalp efekti motoru
 * Tek canvas, önceden çizilmiş kalp sprite'ı, düşük adet, sekme gizliyken durur.
 * Kullanım: var h = LoveHearts(); h.set({enabled:true, color:'#ffffff', density:'mid'});
 */
(function (root) {
  'use strict';

  function LoveHearts() {
    var canvas = null, ctx = null, raf = 0, last = 0;
    var hearts = [], sprite = null, spriteColor = '';
    var W = 0, H = 0, dpr = 1;
    var cfg = { enabled: false, color: '#ffffff', density: 'mid' };
    var mq = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var COUNTS = { low: 8, mid: 14, high: 22 };

    function makeSprite(color) {
      var s = document.createElement('canvas');
      s.width = s.height = 64;
      var c = s.getContext('2d');
      c.translate(32, 33);
      c.shadowColor = color;
      c.shadowBlur = 7;
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(0, -8);
      c.bezierCurveTo(0, -18, -16, -20, -16, -8);
      c.bezierCurveTo(-16, 4, -4, 12, 0, 20);
      c.bezierCurveTo(4, 12, 16, 4, 16, -8);
      c.bezierCurveTo(16, -20, 0, -18, 0, -8);
      c.fill();
      return s;
    }

    function targetCount() {
      var n = COUNTS[cfg.density] || COUNTS.mid;
      if (W < 640) n = Math.round(n * 0.65);          // mobilde daha az kalp
      if (mq && mq.matches) n = Math.round(n * 0.5);  // hareket azaltma tercihi
      return Math.max(3, n);
    }

    function spawn(initial) {
      var size = 9 + Math.random() * 12;
      return {
        x: Math.random() * W,
        y: initial ? Math.random() * (H + 40) : H + size + Math.random() * 60,
        size: size,
        vy: 16 + Math.random() * 20,                 // px / sn - yavaş yükselir
        amp: 6 + Math.random() * 14,
        freq: 0.4 + Math.random() * 0.6,
        ph: Math.random() * 6.283,
        a: 0.28 + Math.random() * 0.32,
        t: 0
      };
    }

    function resize() {
      if (!canvas) return;
      dpr = Math.min(root.devicePixelRatio || 1, 1.5);
      W = root.innerWidth; H = root.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function ensureCanvas() {
      if (canvas) return;
      canvas = document.createElement('canvas');
      canvas.className = 'lp-hearts';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:30';
      ctx = canvas.getContext('2d');
      document.body.appendChild(canvas);
      resize();
      root.addEventListener('resize', function () { resize(); fit(); });
    }

    function fit() {
      var n = targetCount();
      while (hearts.length < n) hearts.push(spawn(true));
      if (hearts.length > n) hearts.length = n;
    }

    function frame(now) {
      raf = 0;
      if (!cfg.enabled || document.hidden) return;
      var dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      ctx.clearRect(0, 0, W, H);
      var slow = mq && mq.matches ? 0.6 : 1;
      for (var i = 0; i < hearts.length; i++) {
        var h = hearts[i];
        h.t += dt;
        h.y -= h.vy * dt * slow;
        var prog = 1 - (h.y + h.size) / (H + h.size * 2);       // 0 altta, 1 üstte
        if (prog > 1.02) { hearts[i] = spawn(false); continue; }
        var fade = Math.min(1, prog * 6) * Math.min(1, (1 - prog) * 3.5);
        var x = h.x + Math.sin(h.t * h.freq + h.ph) * h.amp;
        ctx.globalAlpha = Math.max(0, h.a * fade);
        ctx.drawImage(sprite, x - h.size / 2, h.y - h.size / 2, h.size, h.size);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    function start() { if (!raf && cfg.enabled && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; if (ctx) ctx.clearRect(0, 0, W, H); }

    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

    return {
      set: function (next) {
        cfg = { enabled: !!next.enabled, color: next.color || '#ffffff', density: next.density || 'mid' };
        if (!cfg.enabled) { stop(); if (canvas) canvas.style.display = 'none'; return; }
        ensureCanvas();
        canvas.style.display = '';
        if (spriteColor !== cfg.color) { sprite = makeSprite(cfg.color); spriteColor = cfg.color; }
        fit();
        start();
      }
    };
  }

  root.LoveHearts = LoveHearts;
})(window);
