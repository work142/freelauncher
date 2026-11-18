/* Love Panel 3.0 - Yönetim paneli
 * Bölümler: 1 Varsayılanlar · 2 Durum/Kayıt · 3 Bildirimler · 4 Önizleme · 5 Site üretimi
 *           6 Şablonlar · 7 Fotoğraf/Müzik/Kapak · 8 Arayüz bağlama · 9 ZIP · 10 Başlangıç
 */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const LS_SETTINGS = 'lovePanel3.settings', LS_TEMPLATES = 'lovePanel3.templates', LS_OLD_TEMPLATES = 'lovePanelTemplates';

  /* ===== 1. Varsayılanlar ===== */
  const PRESETS = [
    { id: 'mor-pembe', name: 'Mor – Pembe', primary: '#a259f0', secondary: '#ff7eb6', mode: 'dark' },
    { id: 'gece-mavisi', name: 'Gece mavisi – Açık mavi', primary: '#2f4fd0', secondary: '#9fd4ff', mode: 'dark' },
    { id: 'gul-kurusu', name: 'Gül kurusu – Krem', primary: '#b76e79', secondary: '#f6e8d8', mode: 'light' },
    { id: 'orman-yesili', name: 'Orman yeşili – Adaçayı', primary: '#2f6b4f', secondary: '#b2c8a6', mode: 'dark' },
    { id: 'lila-pastel', name: 'Lila – Pastel mavi', primary: '#a98bdc', secondary: '#bcdcf5', mode: 'light' }
  ];
  const MEMORIES = [
    { id: 'stars', name: 'Kayan yıldızlar', desc: 'Gece gökyüzü, parıltılar' },
    { id: 'clothesline', name: 'Mandallı fotoğraflar', desc: 'İpte, sıcak ışıklı' },
    { id: 'scrapbook', name: 'Anı defteri', desc: 'Kağıt, bant, notlar' },
    { id: 'polaroid', name: 'Polaroid duvarı', desc: 'Eğik çerçeveler' },
    { id: 'glass', name: 'Cam kartlar', desc: 'Yarı saydam, yumuşak ışık' }
  ];
  const DEFAULTS = () => ({
    template: 'default',
    name1: 'Hira', name2: 'Samet', startDate: '', metDate: '', showMet: true, metText: '',
    pageTitle: 'Birlikte geçen zaman 💜',
    introEnabled: true, introTitle: 'Sana küçük bir sürprizim var', introSub: 'Hazır mısın? 💌', introButton: 'Aç',
    heroTitle: 'Seninle her gün bir hediye ✨', heroText: 'Birlikte biriktireceğimiz nice güzel anıya. İyi ki varsın.',
    albumTitle: 'Anılarımız', footerText: 'Seni seviyorum 💜',
    primary: PRESETS[0].primary, secondary: PRESETS[0].secondary, mode: PRESETS[0].mode,
    hearts: true, heartColor: 'primary', heartDensity: 'mid',
    memory: 'stars',
    songName: '', musicEnabled: true, musicAutoplay: true,
    optimize: true
  });

  /* ===== 2. Durum / kayıt ===== */
  let state = DEFAULTS();
  const media = { photos: [], music: null, hero: null };   // dosyalar bellekte tutulur (kaydedilmez)
  let templates = {};                                       // özel şablonlar { key: {name, html} }
  let nextId = 1;

  const isHex = v => /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v).trim());
  const normHex = v => { v = String(v).trim().replace(/^#/, '').toLowerCase(); if (v.length === 3) v = v.replace(/./g, '$&$&'); return '#' + v; };

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem(LS_SETTINGS) || 'null');
      if (s && typeof s === 'object') {
        const d = DEFAULTS();
        Object.keys(d).forEach(k => { if (k in s && typeof s[k] === typeof d[k]) d[k] = s[k]; });
        if (!isHex(d.primary)) d.primary = DEFAULTS().primary;
        if (!isHex(d.secondary)) d.secondary = DEFAULTS().secondary;
        state = d;
      }
    } catch (e) { /* bozuk kayıt: varsayılanlarla devam */ }
    try {
      const t = JSON.parse(localStorage.getItem(LS_TEMPLATES) || '{}');
      Object.entries(t).forEach(([k, v]) => { if (v && v.html) templates[k] = v; });
      // 2.0 sürümünde kaydedilen şablonları da taşı
      const old = JSON.parse(localStorage.getItem(LS_OLD_TEMPLATES) || '{}');
      Object.entries(old).forEach(([k, v]) => { if (v && v.html && !templates[k]) templates[k] = { name: v.name || k, html: v.html }; });
    } catch (e) { /* yoksay */ }
    if (state.template !== 'default' && !templates[state.template]) state.template = 'default';
  }
  let saveTimer = 0;
  function saveSettings() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(LS_SETTINGS, JSON.stringify(state)); } catch (e) { /* dolu/engelli */ } }, 250);
  }
  function saveTemplates() {
    try { localStorage.setItem(LS_TEMPLATES, JSON.stringify(templates)); return true; }
    catch (e) { toast('Şablon tarayıcıda saklanamadı. HTML dosyanı ayrıca bilgisayarında sakla.', 'error'); return false; }
  }

  /* ===== 3. Bildirimler ===== */
  function toast(msg, type) {
    const box = $('#toasts'), t = document.createElement('div');
    t.className = 'toast ' + (type || 'info'); t.setAttribute('role', type === 'error' ? 'alert' : 'status');
    const span = document.createElement('span'); span.textContent = msg;
    const x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Kapat');
    x.onclick = () => t.remove();
    t.append(span, x); box.append(t);
    while (box.children.length > 4) box.firstChild.remove();
    setTimeout(() => t.remove(), type === 'error' ? 9000 : 4500);
  }
  window.addEventListener('error', e => toast('Beklenmeyen hata: ' + (e.message || 'bilinmiyor'), 'error'));
  window.addEventListener('unhandledrejection', e => toast('İşlem tamamlanamadı: ' + ((e.reason && e.reason.message) || e.reason), 'error'));

  /* ===== yardımcılar ===== */
  const safe = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const esc = s => safe(s).replace(/\r?\n/g, '<br>');
  const slug = s => String(s).replace(/ç/gi, 'c').replace(/ğ/gi, 'g').replace(/ı/g, 'i').replace(/İ/g, 'I').replace(/ö/gi, 'o').replace(/ş/gi, 's').replace(/ü/gi, 'u').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'dosya';
  const extOf = b => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'image/svg+xml': 'svg' }[b.type] || (b.name && b.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '')) || 'jpg');
  const mb = n => (n / 1048576).toFixed(n > 10485760 ? 0 : 1) + ' MB';
  const jsonForScript = o => JSON.stringify(o).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

  /* ===== 5. Site üretimi (önizleme ve ZIP aynı fonksiyonları kullanır) ===== */
  function assetMap(mode) {
    const exp = mode === 'export', pad = n => String(n).padStart(2, '0');
    const photos = media.photos.map((p, i) => {
      const path = `photos/foto-${pad(i + 1)}.${extOf(p.blob)}`;
      return { src: exp ? path : p.url, caption: p.caption || '', path, blob: p.blob };
    });
    let hero = null, music = null;
    if (media.hero) { const path = 'images/kapak.' + extOf(media.hero.blob); hero = { src: exp ? path : media.hero.url, path, blob: media.hero.blob }; }
    if (media.music && state.musicEnabled) {
      const e = (media.music.blob.name || media.music.name || 'sarki.mp3').split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp3';
      const path = 'music/sarki.' + e; music = { src: exp ? path : media.music.url, path, blob: media.music.blob };
    }
    return { photos, hero, music };
  }

  function buildConfig(mode) {
    const map = assetMap(mode), n1 = state.name1.trim() || 'İsim 1', n2 = state.name2.trim() || 'İsim 2';
    const cfg = {
      pageTitle: state.pageTitle.trim() || `${n1} & ${n2}`, name1: n1, name2: n2,
      startDate: state.startDate, metDate: state.metDate, showMet: state.showMet, metText: state.metText.trim(),
      intro: { enabled: state.introEnabled, title: state.introTitle, sub: state.introSub, button: state.introButton.trim() || 'Aç' },
      heroTitle: state.heroTitle, heroText: state.heroText, heroImage: map.hero ? map.hero.src : '',
      albumTitle: state.albumTitle, footerText: state.footerText,
      theme: { primary: state.primary, secondary: state.secondary, mode: state.mode },
      hearts: { enabled: state.hearts, color: state.heartColor, density: state.heartDensity },
      memory: state.memory,
      music: { enabled: state.musicEnabled && !!map.music, src: map.music ? map.music.src : '', title: state.songName.trim(), autoplay: state.musicAutoplay },
      photos: map.photos.map(p => ({ src: p.src, caption: p.caption }))
    };
    if (mode === 'preview') { cfg.preview = true; cfg.samplePhotos = !map.photos.length; }
    return { cfg, map };
  }

  function themeVars() {
    const T = LoveSite.computeTheme({ primary: state.primary, secondary: state.secondary, mode: state.mode });
    return T;
  }

  /* özel HTML şablonu için yer tutucular (2.0 listesi + 3.0 eklemeleri) */
  const TOKENS = ['PAGE_TITLE', 'INTRO_TITLE', 'INTRO_SUB', 'NAMES', 'HERO_TITLE', 'HERO_TEXT', 'ALBUM_TITLE', 'FOOTER_TEXT', 'START_DATE', 'HERO_IMAGE', 'MUSIC_SRC', 'TALK_BLOCK', 'PHOTOS_HTML',
    'NAME1', 'NAME2', 'MET_DATE', 'SONG_NAME', 'PRIMARY', 'SECONDARY', 'THEME_CSS', 'MEMORY_CLASS', 'HEARTS_BLOCK'];
  function fillTemplate(html, mode) {
    const { cfg, map } = buildConfig(mode), T = themeVars();
    const css = ':root{' + Object.keys(T).filter(k => k[0] !== '_').map(k => '--' + k + ':' + T[k]).join(';') + '}';
    const photosHtml = map.photos.map(p => `<article class="photo"><img loading="lazy" src="${safe(p.src)}" alt="${safe(p.caption)}"><p>${safe(p.caption)}</p></article>`).join('');
    const hasTalk = state.showMet && state.metDate;
    const talk = hasTalk ? `<div class="talk">${esc(state.metText.trim() || 'Tanıştığımız günden beri')}<br><b id="talkDays">0</b> gündür hayatımdasın 💜</div>` : '';
    const hearts = state.hearts ? `<script>${LP_SITE.hearts}<\/script><script>LoveHearts().set(${jsonForScript({ enabled: true, color: T._hearts[state.heartColor], density: state.heartDensity })});<\/script>` : '';
    const v = {
      PAGE_TITLE: safe(cfg.pageTitle), INTRO_TITLE: esc(state.introTitle), INTRO_SUB: esc(state.introSub), NAMES: safe(cfg.name1 + ' & ' + cfg.name2),
      HERO_TITLE: esc(state.heroTitle), HERO_TEXT: esc(state.heroText), ALBUM_TITLE: esc(state.albumTitle), FOOTER_TEXT: esc(state.footerText),
      START_DATE: state.startDate, HERO_IMAGE: map.hero ? map.hero.src : '', MUSIC_SRC: map.music ? map.music.src : '', TALK_BLOCK: talk, PHOTOS_HTML: photosHtml,
      NAME1: safe(cfg.name1), NAME2: safe(cfg.name2), MET_DATE: state.metDate, SONG_NAME: safe(state.songName), PRIMARY: state.primary, SECONDARY: state.secondary,
      THEME_CSS: '<style>' + css + '</style>', MEMORY_CLASS: 'mem-' + state.memory, HEARTS_BLOCK: hearts
    };
    // tek geçişte değiştir: şablon içeriğindeki {{...}} ifadeleri değişen metinlerde tekrar işlenmez
    let out = html.replace(/\{\{([A-Z0-9_]+)\}\}/g, (m, k) => (k in v ? v[k] : m));
    const left = [...new Set((out.match(/\{\{[A-Z0-9_]+\}\}/g) || []))];
    if (left.length) throw new Error('Şablonda tanınmayan yer tutucu var: ' + left.join(', '));
    if (hasTalk) {
      const d = state.metDate;
      out = out.replace('</body>', `<script>(function(){var e=document.getElementById('talkDays');if(e)e.textContent=Math.max(0,Math.floor((Date.now()-new Date('${d}T00:00:00').getTime())/864e5))})();<\/script></body>`);
    }
    return out;
  }

  /* ===== 4. Önizleme ===== */
  const frame = () => $('#frame');
  let frameMode = '', frameReady = false, previewQueued = false, customTimer = 0;

  function defaultFrameDoc(cfg) {
    return '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + LP_SITE.css + '</style></head><body>' +
      '<script>window.LOVE_CONFIG=' + jsonForScript(cfg) + ';<\/script><script>' + LP_SITE.hearts + '<\/script><script>' + LP_SITE.js + '<\/script></body></html>';
  }
  function loadFrame(doc, key) {
    frameReady = false; frameMode = key;
    let sy = 0; try { sy = frame().contentWindow.scrollY || 0; } catch (e) { /* yoksay */ }
    frame().onload = () => { frameReady = true; if (key === 'default') pushPreview(); try { if (key !== 'default') frame().contentWindow.scrollTo(0, sy); } catch (e) { /* yoksay */ } };
    frame().srcdoc = doc;
  }
  function pushPreview() {
    if (frameMode !== 'default' || !frameReady) return;
    try { frame().contentWindow.LoveSite.update(buildConfig('preview').cfg); }
    catch (e) { frameMode = ''; renderPreviewNow(); }  // iframe erişilemezse yeniden yükle
  }
  function renderPreviewNow() {
    try {
      if (state.template === 'default') {
        if (frameMode !== 'default') loadFrame(defaultFrameDoc(buildConfig('preview').cfg), 'default'); else pushPreview();
      } else {
        clearTimeout(customTimer);
        customTimer = setTimeout(() => {
          try { loadFrame(fillTemplate(templates[state.template].html, 'preview'), 'custom:' + state.template); $('#tplNote').classList.remove('bad'); }
          catch (e) { $('#tplNote').textContent = e.message; $('#tplNote').classList.add('bad'); }
        }, 320);
      }
    } catch (e) { toast('Önizleme güncellenemedi: ' + e.message, 'error'); }
  }
  function requestPreview() {
    if (previewQueued) return; previewQueued = true;
    requestAnimationFrame(() => { previewQueued = false; renderPreviewNow(); });
  }

  let device = 'desktop';
  const isNarrow = () => window.innerWidth <= 960;
  function layoutDevice() {
    const view = $('#stageView'), dev = $('#device'); if (!view || !dev) return;
    const vw = view.clientWidth, vh = view.clientHeight; if (!vw || !vh) return;
    if (isNarrow()) {   // telefon: site gerçek 390px genişlikte, alan neyse ona sığar
      const w = 390, s = Math.min(1, vw / w), h = vh / s;
      dev.className = 'device flat';
      Object.assign(dev.style, { width: w + 'px', height: h + 'px', transform: `scale(${s})`, left: Math.max(0, (vw - w * s) / 2) + 'px', top: '0px' });
      return;
    }
    dev.className = 'device ' + device;
    if (device === 'desktop') {
      const w = 1280, s = Math.min(1, vw / w), h = vh / s;
      Object.assign(dev.style, { width: w + 'px', height: h + 'px', transform: `scale(${s})`, left: '0px', top: '0px' });
    } else {
      const w = 390, h = 800, s = Math.min(1, (vh - 16) / (h + 24), (vw - 8) / (w + 24));
      Object.assign(dev.style, { width: w + 'px', height: h + 'px', transform: `scale(${s})`, left: Math.max(0, (vw - (w + 24) * s) / 2) + 'px', top: '8px' });
    }
  }

  /* telefon: alttan açılan tek bölüm menüsü */
  const SECS = [['couple', 'Çift', '💞'], ['text', 'Yazılar', '✍️'], ['color', 'Renk', '🎨'], ['hearts', 'Kalp', '💗'], ['design', 'Tasarım', '🖼'], ['photos', 'Fotoğraf', '📷'], ['music', 'Müzik', '🎵'], ['tpl', 'Şablon', '🧩']];
  const CARD_ORDER = ['tpl', 'couple', 'text', 'color', 'hearts', 'design', 'photos', 'music'];
  function openSheet(sec) {
    const cur = document.body.dataset.sheet;
    if (cur === sec) { if (isNarrow()) closeSheet(); return; }
    document.body.dataset.sheet = sec;
    $$('.editor > .card').forEach(c => c.classList.toggle('active', c.dataset.sec === sec));
    $('#sheetTitle').textContent = SECS.find(x => x[0] === sec)[1];
    $('#sheetBar').hidden = false; $('#editor').scrollTop = 0;
    $$('#tabs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sec === sec)));
    try { const L = frame().contentWindow.LoveSite; L.hideIntro(); if (sec === 'design' || sec === 'photos') L.scrollToAlbum(); } catch (e) { /* özel şablon */ }
  }
  function closeSheet() {
    delete document.body.dataset.sheet; $('#sheetBar').hidden = true;
    $$('#tabs button').forEach(b => b.setAttribute('aria-pressed', 'false'));
  }
  const LS_LAYOUT = 'lovePanel3.layout';
  function setLayout(l) {
    try { localStorage.setItem(LS_LAYOUT, l); } catch (e) { /* yoksay */ }
    document.body.dataset.layout = l; document.body.classList.remove('show-preview');
    closeSheet(); $$('.editor > .card').forEach(c => c.classList.remove('active'));
    $('#layoutBtn .long').textContent = l === 'page' ? 'Sekmeli görünüm' : 'Tek sayfa görünümü';
    if (l === 'tabs' && !isNarrow()) openSheet('couple');
    setTimeout(layoutDevice, 60);
  }
  function buildTabs() {
    $$('.editor > .card').forEach((c, i) => { c.dataset.sec = CARD_ORDER[i]; });
    const t = $('#tabs');
    SECS.forEach(([id, name, icon]) => {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.sec = id; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = `<span class="ic" aria-hidden="true">${icon}</span><span>${name}</span>`;
      b.onclick = () => openSheet(id); t.append(b);
    });
    $('#sheetClose').onclick = closeSheet;
    $('#layoutBtn').onclick = () => setLayout(document.body.dataset.layout === 'page' ? 'tabs' : 'page');
    $('#fab').onclick = () => { document.body.classList.add('show-preview'); setTimeout(layoutDevice, 50); };
    $('#closePreview').onclick = () => document.body.classList.remove('show-preview');
  }

  /* ===== 6. Şablonlar ===== */
  function refreshTemplateSelect() {
    const sel = $('#templateSelect'); sel.textContent = '';
    const d = new Option('Love Panel 3.0 (varsayılan, 5 anı tasarımı)', 'default'); sel.add(d);
    Object.entries(templates).forEach(([k, t]) => sel.add(new Option('Özel: ' + t.name, k)));
    sel.value = state.template;
    const custom = state.template !== 'default';
    $('#removeTemplate').disabled = !custom;
    const note = $('#tplNote'); note.classList.remove('bad');
    note.textContent = custom
      ? 'Özel şablon seçili. Kalp efekti ve anı tasarımı yalnızca şablonda {{HEARTS_BLOCK}} / {{MEMORY_CLASS}} varsa etki eder.'
      : 'Varsayılan şablon bu panelin tüm özelliklerini destekler. İsterseniz kendi HTML şablonunuzu ekleyebilirsiniz.';
    $('#designCards').classList.toggle('dim', custom);
  }
  function addTemplateFile(file) {
    if (!file) return;
    if (!/\.html?$/i.test(file.name) && file.type !== 'text/html') return toast('Lütfen bir .html dosyası seç.', 'error');
    file.text().then(html => {
      if (!/\{\{[A-Z_]+\}\}/.test(html)) return toast('Bu dosyada hiç yer tutucu ({{NAMES}} gibi) yok. KULLANIM.txt dosyasındaki listeye bak.', 'error');
      const bad = [...new Set(html.match(/\{\{[A-Z0-9_]+\}\}/g) || [])].filter(t => !TOKENS.includes(t.slice(2, -2)));
      if (bad.length) return toast('Tanınmayan yer tutucu: ' + bad.join(', '), 'error');
      const key = 'custom_' + Date.now();
      templates[key] = { name: file.name.replace(/\.html?$/i, ''), html };
      saveTemplates(); state.template = key; refreshTemplateSelect(); changed();
      const miss = ['PHOTOS_HTML'].filter(t => !html.includes('{{' + t + '}}'));
      toast(miss.length ? 'Şablon eklendi, ama {{PHOTOS_HTML}} yok: fotoğraflar görünmez.' : 'Şablon eklendi ve bu tarayıcıda saklandı.', miss.length ? 'info' : 'success');
    }).catch(e => toast('Şablon okunamadı: ' + e.message, 'error'));
  }

  /* ===== 7. Fotoğraf / müzik / kapak ===== */
  function canDecode(blob) {
    return new Promise(res => { const u = URL.createObjectURL(blob), i = new Image(); i.onload = () => { URL.revokeObjectURL(u); res(true); }; i.onerror = () => { URL.revokeObjectURL(u); res(false); }; i.src = u; });
  }
  async function prepareImage(file) {
    let blob = file;
    if (state.optimize && /^image\/(jpeg|png|webp)$/.test(file.type)) {
      try {
        const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
        const max = 1800, sc = Math.min(1, max / Math.max(bmp.width, bmp.height));
        if (sc < 1 || file.size > 900 * 1024) {
          const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * sc); cv.height = Math.round(bmp.height * sc);
          const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(bmp, 0, 0, cv.width, cv.height);
          const out = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.86));
          if (out && out.size < file.size) blob = out;
        }
        if (bmp.close) bmp.close();
      } catch (e) { blob = file; }
    }
    if (!(await canDecode(blob))) throw new Error(`"${file.name}" açılamadı (HEIC/bozuk dosya olabilir). JPG, PNG veya WebP kullan.`);
    return blob;
  }
  async function addPhotos(files) {
    files = [...files]; if (!files.length) return;
    const bad = files.filter(f => !/^image\//.test(f.type)); if (bad.length) toast(`${bad.length} dosya fotoğraf değil, atlandı.`, 'error');
    files = files.filter(f => /^image\//.test(f.type));
    let ok = 0;
    for (let i = 0; i < files.length; i++) {
      setBusyText(`Fotoğraflar hazırlanıyor (${i + 1}/${files.length})…`);
      if (files[i].size > 40 * 1048576) { toast(`"${files[i].name}" 40 MB'dan büyük, atlandı.`, 'error'); continue; }
      try { const blob = await prepareImage(files[i]); media.photos.push({ id: nextId++, blob, url: URL.createObjectURL(blob), name: files[i].name, caption: '' }); ok++; }
      catch (e) { toast(e.message, 'error'); }
    }
    setBusyText(''); renderPhotos(); changed();
    if (ok) toast(ok + ' fotoğraf eklendi.', 'success');
  }
  function movePhoto(from, to) {
    if (to < 0 || to >= media.photos.length || from === to) return;
    media.photos.splice(to, 0, media.photos.splice(from, 1)[0]); renderPhotos(); changed();
  }
  function removePhoto(i) { URL.revokeObjectURL(media.photos[i].url); media.photos.splice(i, 1); renderPhotos(); changed(); }
  function renderPhotos() {
    const box = $('#photoList'); box.textContent = '';
    const total = media.photos.reduce((a, p) => a + p.blob.size, 0);
    $('#photoStat').textContent = media.photos.length ? `${media.photos.length} fotoğraf · yaklaşık ${mb(total)}` : 'Henüz fotoğraf eklenmedi. Boşken önizlemede örnek görseller gösterilir; üretilen sitede albüm bölümü gizlenir.';
    if (total > 60 * 1048576) toast('Fotoğraflar toplam 60 MB üzerinde. Site geç açılabilir; "küçült" seçeneğini açık tut.', 'info');
    media.photos.forEach((p, i) => {
      const row = document.createElement('div'); row.className = 'prow'; row.draggable = true; row.dataset.i = i;
      const grip = document.createElement('span'); grip.className = 'grip'; grip.textContent = '⋮⋮'; grip.title = 'Sürükleyerek sırala';
      const img = document.createElement('img'); img.src = p.url; img.alt = '';
      const inp = document.createElement('input'); inp.value = p.caption; inp.placeholder = 'Fotoğraf açıklaması'; inp.setAttribute('aria-label', (i + 1) + '. fotoğraf açıklaması'); inp.maxLength = 140;
      inp.addEventListener('input', () => { p.caption = inp.value; changed(); });
      const mk = (txt, title, fn, cls) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ib ' + (cls || ''); b.textContent = txt; b.title = title; b.setAttribute('aria-label', title); b.onclick = fn; return b; };
      const up = mk('↑', 'Yukarı taşı', () => movePhoto(i, i - 1)), dn = mk('↓', 'Aşağı taşı', () => movePhoto(i, i + 1)), del = mk('✕', 'Sil', () => removePhoto(i), 'del');
      up.disabled = i === 0; dn.disabled = i === media.photos.length - 1;
      const acts = document.createElement('div'); acts.className = 'acts'; acts.append(up, dn, del);
      row.append(grip, img, inp, acts);
      row.addEventListener('dragstart', e => { e.dataTransfer.setData('text/x-lp', String(i)); e.dataTransfer.effectAllowed = 'move'; row.classList.add('drag'); });
      row.addEventListener('dragend', () => row.classList.remove('drag'));
      row.addEventListener('dragover', e => { if (e.dataTransfer.types.includes('text/x-lp')) { e.preventDefault(); row.classList.add('over'); } });
      row.addEventListener('dragleave', () => row.classList.remove('over'));
      row.addEventListener('drop', e => { const f = e.dataTransfer.getData('text/x-lp'); row.classList.remove('over'); if (f === '') return; e.preventDefault(); e.stopPropagation(); movePhoto(+f, i); });
      box.append(row);
    });
  }

  async function setMusic(file) {
    if (!file) return;
    if (!(/^audio\//.test(file.type) || /\.(mp3|m4a|wav|ogg|aac)$/i.test(file.name))) return toast('Lütfen bir ses dosyası (MP3) seç.', 'error');
    if (file.size > 40 * 1048576) return toast('Müzik dosyası 40 MB\'dan büyük.', 'error');
    if (media.music) URL.revokeObjectURL(media.music.url);
    const blob = file.slice(0, file.size, file.type || 'audio/mpeg'); blob.name = file.name;
    media.music = { blob, name: file.name, url: URL.createObjectURL(blob), size: file.size };
    if (!state.songName.trim()) { state.songName = file.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' '); syncUI(); }
    if (file.size > 15 * 1048576) toast('Müzik 15 MB üzerinde; site geç yüklenebilir. Daha küçük bir MP3 düşün.', 'info');
    renderMusic(); changed(); toast('Müzik eklendi.', 'success');
  }
  function renderMusic() {
    $('#musicInfo').textContent = media.music ? `♪ ${media.music.name} (${mb(media.music.size)})` : 'Müzik seçilmedi.';
    $('#removeMusic').hidden = !media.music;
  }
  async function setHero(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) return toast('Kapak için bir fotoğraf seç.', 'error');
    try { const blob = await prepareImage(file); if (media.hero) URL.revokeObjectURL(media.hero.url); media.hero = { blob, url: URL.createObjectURL(blob), name: file.name }; renderHero(); changed(); }
    catch (e) { toast(e.message, 'error'); }
  }
  function renderHero() { $('#heroInfo').textContent = media.hero ? '🖼 ' + media.hero.name : 'Kapak fotoğrafı seçilmedi (isteğe bağlı).'; $('#removeHero').hidden = !media.hero; }

  /* ===== 8. Arayüz bağlama ===== */
  const INTRO_KEYS = ['introEnabled', 'introTitle', 'introSub', 'introButton'];
  const THEME_KEYS = ['primary', 'secondary', 'mode', 'preset'];
  function changed(key) {
    saveSettings(); requestPreview(); updateSwatches();
    // Önizleme: açılış ekranı yalnızca açılış alanları düzenlenirken görünür; tasarım seçilince albüme kayar.
    const act = fn => setTimeout(() => { try { fn(frame().contentWindow.LoveSite); } catch (e) { /* özel şablon: yoksay */ } }, 80);
    if (INTRO_KEYS.includes(key)) act(s => s.showIntro());
    else if (key === 'memory') act(s => { s.hideIntro(); s.scrollToAlbum(); });
    else if (key && !THEME_KEYS.includes(key)) act(s => s.hideIntro());
  }
  function syncUI() {
    $$('[data-k]').forEach(n => {
      const k = n.dataset.k;
      if (n.classList.contains('seg')) $$('button', n).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(state[k]))));
      else if (n.type === 'checkbox') n.checked = !!state[k];
      else if (document.activeElement !== n) n.value = state[k];
    });
    $('#cPrimary').value = normHex(state.primary); $('#hPrimary').value = normHex(state.primary);
    $('#cSecondary').value = normHex(state.secondary); $('#hSecondary').value = normHex(state.secondary);
    $$('#hPrimary,#hSecondary').forEach(i => i.classList.remove('bad'));
    $('#heartOpts').classList.toggle('off', !state.hearts);
    $('#introFields').classList.toggle('off', !state.introEnabled);
    $('#musicOpts').classList.toggle('off', !state.musicEnabled);
    $$('#memGrid button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === state.memory)));
    updateSwatches(); refreshTemplateSelect();
  }
  function updateSwatches() {
    $$('#presets button').forEach(b => { const p = PRESETS.find(x => x.id === b.dataset.id); b.setAttribute('aria-pressed', String(p && normHex(state.primary) === p.primary && normHex(state.secondary) === p.secondary && state.mode === p.mode)); });
    document.documentElement.style.setProperty('--mp', normHex(state.primary));
    document.documentElement.style.setProperty('--ms', normHex(state.secondary));
    document.documentElement.setAttribute('data-site-mode', state.mode);
  }
  function setColor(which, val, fromHex) {
    const key = which === 'p' ? 'primary' : 'secondary', hexEl = $(which === 'p' ? '#hPrimary' : '#hSecondary');
    if (!isHex(val)) { hexEl.classList.add('bad'); return false; }
    hexEl.classList.remove('bad'); state[key] = normHex(val);
    $(which === 'p' ? '#cPrimary' : '#cSecondary').value = state[key];
    if (!fromHex) hexEl.value = state[key];
    changed(); return true;
  }

  function buildStaticUI() {
    const pr = $('#presets');
    PRESETS.forEach(p => {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.id = p.id; b.title = p.name;
      b.innerHTML = `<span class="sw" style="background:linear-gradient(135deg,${p.primary} 50%,${p.secondary} 50%)"></span><span class="nm">${safe(p.name)}</span>`;
      b.onclick = () => { state.primary = p.primary; state.secondary = p.secondary; state.mode = p.mode; syncUI(); changed(); };
      pr.append(b);
    });
    const mg = $('#memGrid');
    MEMORIES.forEach(m => {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.v = m.id; b.setAttribute('role', 'radio');
      b.innerHTML = `<div class="mini mini-${m.id}" aria-hidden="true"><i></i><i></i><i></i></div><strong>${safe(m.name)}</strong><small>${safe(m.desc)}</small>`;
      b.onclick = () => { state.memory = m.id; syncUI(); changed('memory'); };
      mg.append(b);
    });

    $$('[data-k]').forEach(n => {
      const k = n.dataset.k;
      if (n.classList.contains('seg')) n.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b) return; state[k] = b.dataset.v; syncUI(); changed(k); });
      else if (n.type === 'checkbox') n.addEventListener('change', () => { state[k] = n.checked; syncUI(); changed(k); });
      else n.addEventListener('input', () => { state[k] = n.value; changed(k); });
    });
    // renk girişleri
    [['p', '#cPrimary', '#hPrimary'], ['s', '#cSecondary', '#hSecondary']].forEach(([w, c, h]) => {
      $(c).addEventListener('input', e => setColor(w, e.target.value, false));
      $(h).addEventListener('input', e => { if (isHex(e.target.value)) setColor(w, e.target.value, true); else e.target.classList.add('bad'); });
      $(h).addEventListener('blur', e => { if (!isHex(e.target.value)) { toast('Geçersiz HEX kodu. Örnek: #a259f0', 'error'); e.target.value = normHex(state[w === 'p' ? 'primary' : 'secondary']); e.target.classList.remove('bad'); } });
    });
    // dosyalar
    $('#photoInput').addEventListener('change', e => { addPhotos(e.target.files); e.target.value = ''; });
    const dz = $('#photoDrop');
    ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { if ([...(e.dataTransfer.types || [])].includes('Files')) { e.preventDefault(); dz.classList.add('over'); } }));
    ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, () => dz.classList.remove('over')));
    dz.addEventListener('drop', e => { if (e.dataTransfer.files.length) { e.preventDefault(); addPhotos(e.dataTransfer.files); } });
    $('#musicFile').addEventListener('change', e => { setMusic(e.target.files[0]); e.target.value = ''; });
    $('#removeMusic').onclick = () => { if (media.music) URL.revokeObjectURL(media.music.url); media.music = null; renderMusic(); changed(); };
    $('#heroFile').addEventListener('change', e => { setHero(e.target.files[0]); e.target.value = ''; });
    $('#removeHero').onclick = () => { if (media.hero) URL.revokeObjectURL(media.hero.url); media.hero = null; renderHero(); changed(); };
    // şablon
    $('#addTemplate').onclick = () => $('#templateFile').click();
    $('#templateFile').addEventListener('change', e => { addTemplateFile(e.target.files[0]); e.target.value = ''; });
    $('#templateSelect').addEventListener('change', e => { state.template = e.target.value; frameMode = ''; refreshTemplateSelect(); changed(); });
    $('#removeTemplate').onclick = () => {
      if (state.template === 'default') return;
      if (!confirm('Seçili özel şablon bu tarayıcıdan silinsin mi?')) return;
      delete templates[state.template]; saveTemplates(); state.template = 'default'; frameMode = ''; refreshTemplateSelect(); changed(); toast('Şablon kaldırıldı.', 'success');
    };
    // önizleme araçları
    $$('#deviceSeg button').forEach(b => b.onclick = () => { device = b.dataset.v; $$('#deviceSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); layoutDevice(); });
    $('#showIntro').onclick = () => { try { frame().contentWindow.LoveSite.showIntro(); } catch (e) { toast('Açılış ekranı yalnızca varsayılan şablonda önizlenir.', 'info'); } };
    $('#toAlbum').onclick = () => { try { frame().contentWindow.LoveSite.scrollToAlbum(); } catch (e) { /* yoksay */ } };
    new ResizeObserver(layoutDevice).observe($('#stageView'));
    buildTabs();
    // dışa aktar / sıfırla
    $$('.js-export').forEach(b => b.onclick = exportZip);
    $('#resetBtn').onclick = () => $('#resetDlg').showModal();
    $('#resetDlg').addEventListener('close', () => { if ($('#resetDlg').returnValue === 'ok') resetAll($('#clearMedia').checked); });
  }

  function resetAll(clearMedia) {
    const keepTpl = state.template; state = DEFAULTS(); state.template = templates[keepTpl] ? keepTpl : 'default';
    if (clearMedia) {
      media.photos.forEach(p => URL.revokeObjectURL(p.url)); media.photos = [];
      if (media.music) URL.revokeObjectURL(media.music.url); media.music = null;
      if (media.hero) URL.revokeObjectURL(media.hero.url); media.hero = null;
      renderPhotos(); renderMusic(); renderHero();
    }
    $('#clearMedia').checked = false; frameMode = '';
    syncUI(); changed(); toast('Varsayılan tasarıma dönüldü.', 'success');
  }

  /* ===== 9. ZIP ===== */
  let busy = false;
  function setBusyText(t) { const s = $('#status'); s.textContent = t; s.className = 'status' + (t ? ' on' : ''); }
  function setProgress(p) { const bar = $('#progress'); bar.hidden = p == null; if (p != null) $('#progress > div').style.width = Math.round(p) + '%'; }

  function validateForExport() {
    if (!state.startDate) throw new Error('İlişki başlangıç tarihini gir (Çift bilgileri bölümü).');
    if (!state.name1.trim() || !state.name2.trim()) throw new Error('İki ismi de gir.');
    if (state.template !== 'default' && !templates[state.template]) throw new Error('Seçili şablon bulunamadı.');
  }
  function indexHtml(cfg) {
    const T = themeVars();
    return '<!doctype html>\n<html lang="tr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="theme-color" content="' + safe(T.bg) + '">\n<title>' + safe(cfg.pageTitle) + '</title>\n<link rel="stylesheet" href="css/style.css">\n</head>\n<body>\n<noscript>Bu sayfa JavaScript gerektirir.</noscript>\n<script src="js/config.js"></script>\n<script src="js/main.js"></script>\n</body>\n</html>\n';
  }
  const README = n1 => `${n1} - ÖZEL WEB SİTESİ\n\nAÇMAK İÇİN\n- Bu ZIP dosyasını bir klasöre çıkarın.\n- index.html dosyasına çift tıklayın (Chrome, Edge, Safari, Firefox).\n- İnternet bağlantısı gerekmez; fotoğraflar ve müzik klasörlerdeki dosyalardan yüklenir.\n\nTELEFONDA AÇMAK\n- Dosyaları telefona aktarıp bir dosya yöneticisiyle index.html'i tarayıcıda açabilir\n  ya da siteyi bir hosting alanına yükleyip bağlantıyı paylaşabilirsiniz.\n\nYAYINLAMAK İÇİN\n- Klasörün içindeki TÜM dosya ve klasörleri (index.html, css, js, photos, music) aynı yapıyla\n  hosting alanına yükleyin. Klasör yapısını değiştirmeyin.\n\nNOT\n- Müzik, tarayıcı kuralları gereği açılış ekranındaki butona dokunulunca başlar.\n`;

  async function buildZip(progress) {
    validateForExport();
    const zip = new JSZip(), store = { compression: 'STORE', binary: true };
    const { cfg, map } = buildConfig('export');
    let n = 0; const total = map.photos.length + (map.hero ? 1 : 0) + (map.music ? 1 : 0) + 1;
    const step = t => { n++; progress && progress(t, (n / total) * 35); };
    if (state.template === 'default') {
      zip.file('index.html', indexHtml(cfg));
      zip.file('css/style.css', LP_SITE.css);
      zip.file('js/config.js', 'window.LOVE_CONFIG = ' + jsonForScript(cfg) + ';\n');
      zip.file('js/main.js', LP_SITE.hearts + '\n' + LP_SITE.js);
    } else {
      zip.file('index.html', fillTemplate(templates[state.template].html, 'export'));
    }
    step('Sayfa dosyaları hazır');
    map.photos.forEach((p, i) => { zip.file(p.path, p.blob, store); step(`Fotoğraflar ekleniyor (${i + 1}/${map.photos.length})`); });
    if (map.hero) { zip.file(map.hero.path, map.hero.blob, store); step('Kapak fotoğrafı eklendi'); }
    if (map.music) { zip.file(map.music.path, map.music.blob, store); step('Müzik eklendi'); }
    zip.file('OKU-BENI.txt', README(cfg.name1 + ' & ' + cfg.name2));
    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } }, m => progress && progress(`ZIP sıkıştırılıyor %${Math.round(m.percent)}`, 35 + m.percent * 0.65));
  }

  async function exportZip() {
    if (busy) return;
    busy = true; $$('.js-export').forEach(b => b.disabled = true);
    try {
      if (typeof JSZip === 'undefined') throw new Error('ZIP aracı (vendor/jszip.min.js) yüklenemedi. Proje klasörünü eksiksiz çıkardığından emin ol.');
      if (!media.photos.length && !confirm('Albümde hiç fotoğraf yok. Yine de siteyi oluşturmak istiyor musun?')) throw new Error('İptal edildi.');
      setProgress(2); setBusyText('Site hazırlanıyor…');
      const blob = await buildZip((t, p) => { setBusyText(t); setProgress(p); });
      window.__lastZip = blob;
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = slug(state.name1.trim() + '-' + state.name2.trim()) + '-site.zip';
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setProgress(100); setBusyText('✓ ZIP hazır: ' + a.download + ' (' + mb(blob.size) + ')');
      toast('Site paketi oluşturuldu ve indirildi.', 'success');
    } catch (e) {
      setBusyText(''); setProgress(null);
      toast(e.message === 'İptal edildi.' ? e.message : 'ZIP oluşturulamadı: ' + e.message, e.message === 'İptal edildi.' ? 'info' : 'error');
    } finally {
      busy = false; $$('.js-export').forEach(b => b.disabled = false); setTimeout(() => setProgress(null), 1500);
    }
  }

  /* ===== 10. Başlangıç ===== */
  function init() {
    loadSettings(); buildStaticUI(); syncUI(); renderPhotos(); renderMusic(); renderHero(); layoutDevice(); renderPreviewNow();
    let l = 'page'; try { l = localStorage.getItem(LS_LAYOUT) === 'tabs' ? 'tabs' : 'page'; } catch (e) { /* yoksay */ }
    setLayout(l);
  }
  window.LovePanel = { state: () => state, media, addPhotos, setMusic, setHero, buildZip, exportZip, buildConfig, toast };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
