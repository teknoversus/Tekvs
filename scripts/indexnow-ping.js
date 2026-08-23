// ============================================================
// TeknoVersus — IndexNow bildirimi.
//
// IndexNow, Bing/Yandex/Seznam ortak protokolü — "şu URL'ler değişti"
// diye tek bir istekle bildirim yapıyorsun, onlar da beklemeden tarıyor.
// Google IndexNow'u DOĞRUDAN kullanmıyor ama Bing'in hızlı taraması,
// ChatGPT'nin arama özelliği (Bing altyapılı) ve Copilot için doğrudan
// faydalı.
//
// Her deploy'da TÜM sitemap'i göndermek yerine sadece o çalıştırmada
// GERÇEKTEN değişen URL'leri bildirmek daha doğru (protokol bunu öneriyor,
// gereksiz bildirim spam sayılabilir) — ama biz build.js'in ürettiği
// sitemap'ten en son eklenenleri banch olarak göndermek yerine, basitlik
// için build.js'in bu script'i "değişen dosya listesi" ile çağırmasını
// bekliyoruz. Değişen liste yoksa (ilk kurulum/manuel çalıştırma) tüm
// sitemap gönderilir — IndexNow bunu sorun etmiyor, sadece küçük siteler
// için günlük bildirim sınırı var (10.000 URL/gün, bizim ölçeğimiz için
// sorun değil).
// ============================================================
const fs = require('fs');
const path = require('path');

const HOST = 'teknoversus.com.tr';
const KEY = process.env.INDEXNOW_KEY || 'ff24f614b05803dd642f59025f1a75a2';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

function extractSitemapUrls(rootDir){
  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  if(!fs.existsSync(sitemapPath)) return [];
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
}

async function pingIndexNow(urls){
  if(!urls.length) return;
  // IndexNow tek istekte en fazla 10.000 URL kabul ediyor; bizim ölçeğimiz
  // (şu an ~1350 URL) bunun altında, tek istek yeterli.
  const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls };
  try{
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body)
    });
    // IndexNow başarı için 200 veya 202 döner; içerik gövdesi genelde boş.
    if(res.ok){
      console.log(`✓ IndexNow: ${urls.length} URL bildirildi (HTTP ${res.status}).`);
    } else {
      const text = await res.text().catch(() => '');
      console.warn(`UYARI: IndexNow isteği başarısız (HTTP ${res.status}): ${text}`);
    }
  } catch(e){
    // IndexNow bildirimi başarısız olsa bile build/deploy'u DURDURMUYORUZ —
    // bu ikincil bir SEO sinyali, sitenin yayınlanmasını engellememeli.
    console.warn('UYARI: IndexNow isteği atılamadı:', e.message);
  }
}

// Doğrudan çalıştırılırsa (node scripts/indexnow-ping.js): tüm sitemap'i gönder.
if(require.main === module){
  const rootDir = path.join(__dirname, '..');
  const urls = extractSitemapUrls(rootDir);
  console.log(`→ sitemap.xml'den ${urls.length} URL bulundu, IndexNow'a bildiriliyor...`);
  pingIndexNow(urls).then(() => process.exit(0));
}

module.exports = { pingIndexNow, extractSitemapUrls };
