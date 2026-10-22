// ============================================================
// Klasör adreslerini (ör. /urun/, /liste/) ilgili sayfaya 301 ile yönlendirir.
//
// Neden: Bu klasörlerde index.html yok; sunucu klasör listelemeyi kapattığı
// için /urun/ ve /liste/ gibi adresler 403 veriyordu (Search Console,
// 22 Ekim 2026: "Erişim izni verilmemesi (403) nedeniyle engellendi").
// Google bu adresleri sayfa yollarından tahmin edip tarıyor.
//
// Her klasörün .htaccess dosyasının SONUNA kendi bloğunu ekler (önceki
// build'den kalan bloğunu silip yeniden yazar). build.js'te diğer .htaccess
// yazan adımlardan (generate-comparisons, deleted-redirects) SONRA çağrılmalı.
// ============================================================
const fs = require('fs');
const path = require('path');

const SITE = 'https://teknoversus.com.tr';
const TARGETS = {
  'urun': '/', 'liste': '/', 'inceleme': '/', 'rehber': '/', 'marka': '/', 'kategori': '/',
  'karsilastir': '/karsilastirmalar.html', 'marka-karsilastir': '/karsilastirmalar.html',
  'haberler': '/haberler.html',
};
const MARK = '# OTOMATIK URETILIR (lib/dir-redirects.js)';

function writeDirIndexRedirects({ rootDir }){
  let n = 0;
  Object.entries(TARGETS).forEach(([dir, target]) => {
    const dirPath = path.join(rootDir, dir);
    if(!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) return;
    if(fs.existsSync(path.join(dirPath, 'index.html'))) return; // gerçek bir sayfa varsa dokunma
    const f = path.join(dirPath, '.htaccess');
    let prev = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
    const i = prev.indexOf('\n' + MARK);
    if(i !== -1) prev = prev.slice(0, i + 1);
    else if(prev.startsWith(MARK)) prev = '';
    const block = `${MARK} - klasor adresi (index.html yok) -> ilgili sayfa\nRedirectMatch 301 ^/${dir}/?$ ${SITE}${target}\n`;
    fs.writeFileSync(f, (prev ? prev.replace(/\n*$/, '\n') : '') + block);
    n++;
  });
  console.log(`Klasör adresi yönlendirmeleri: ${n} klasör (/urun/, /liste/ vb. artık 403 yerine 301).`);
}

module.exports = { writeDirIndexRedirects };
