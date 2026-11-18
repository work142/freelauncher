/* site-src/ içindeki dosyaları panelin okuyabileceği assets/site-bundle.js içine gömer.
 * Kullanım (isteğe bağlı, yalnızca site-src dosyalarını düzenlersen): node araclar/build-site-bundle.js
 * Not: file:// üzerinde çalışan panel dosya okuyamadığı için kaynak metinler bu pakete gömülür. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, 'site-src', f), 'utf8');
const bundle = { css: read('site.css'), js: read('site.js'), hearts: read('hearts.js') };
fs.writeFileSync(path.join(root, 'assets', 'site-bundle.js'),
  '/* OTOMATİK ÜRETİLDİ - düzenlemeyin. Kaynak: site-src/ (araclar/build-site-bundle.js) */\nwindow.LP_SITE = ' + JSON.stringify(bundle) + ';\n');
console.log('assets/site-bundle.js güncellendi:', Object.entries(bundle).map(([k, v]) => k + ' ' + (v.length / 1024).toFixed(1) + ' KB').join(', '));
