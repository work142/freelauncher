/* admin-dev.html (çok dosyalı geliştirme sürümü) -> admin.html (tek dosya, her şey içinde)
 * Kullanım: node araclar/build-single-file.js
 * Önce site-src düzenlendiyse: node araclar/build-site-bundle.js */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
let html = rd('admin-dev.html');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, f) => '<style>\n' + rd(f).replace(/<\/style/gi, '<\\/style') + '\n</style>');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, f) => '<script>\n' + rd(f).replace(/<\/script/gi, '<\\/script') + '\n</script>');
html = html.replace('<title>', '<!-- OTOMATİK ÜRETİLDİ: kaynak admin-dev.html + assets + site-src + vendor -->\n<title>');
fs.writeFileSync(path.join(root, 'admin.html'), html);
console.log('admin.html üretildi:', (html.length / 1024).toFixed(0), 'KB, harici dosya bağımlılığı:', (html.match(/(src|href)="(?!#|data:|https?:)[^"]+"/g) || []).length);
