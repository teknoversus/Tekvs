// ============================================================
// TeknoVersus — sitemap.xml'i parçalara bölme.
//
// 28 Eylül 2026 kök neden analizi: build.js'in ürettiği tam sitemap.xml
// (tüm ürün/karşılaştırma/rehber/inceleme sayfalarıyla ~1.4MB) FTP ile
// sunucuya EKSİKSİZ yükleniyor (doğrulandı: kullanıcı dosyayı doğrudan FTP
// ile indirip byte-byte kontrol etti, tam ve doğru). Ama HTTP üzerinden
// istendiğinde hosting'in WAF'ı (Alastyr desteğinin 28 Eylül 2026 yanıtı:
// "sunucu taraflı WAF kuralları geçerlidir ve esnetilemez") yanıtı belirsiz
// bir noktada (gözlemlenen ~90-190KB aralığında, dosyadan dosyaya değişen)
// KESİYOR. Bu, Googlebot'un sitemap'i ve içindeki binlerce /karsilastir/
// URL'sini hiç göremeyeceği, dolayısıyla AdSense'in "düşük değerli içerik"
// tespitini tetikleyebilecek bir durum.
//
// WAF'ı esnetemediğimiz için (hosting sabit, değiştirilemez bir kısıt),
// çözüm: sitemap.xml'i, her biri WAF eşiğinin ÇOK altında kalacak küçük
// parça dosyalarına (sitemap-1.xml, sitemap-2.xml, ...) bölüp, sitemap.xml'in
// kendisini bu parçaları listeleyen küçük bir "sitemap index" dosyasına
// çevirmek. Google (ve diğer arama motorları) sitemap index formatını
// native destekliyor — bu standart, önerilen bir yöntem.
//
// Bu script build.js'teki TÜM generate-*.js modülleri sitemap.xml'i
// tamamladıktan SONRA, en son adım olarak çalıştırılmalı.
// ============================================================
const fs = require('fs');
const path = require('path');

const CHUNK_SIZE = 300; // parça başına en fazla URL sayısı — ~300 * ortalama ~180 byte/URL ≈ 55KB, gözlemlenen en düşük kesme noktasının (~90KB) belirgin şekilde altında.

function splitSitemap({ rootDir }){
  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  if(!fs.existsSync(sitemapPath)){
    console.warn('UYARI: split-sitemap — sitemap.xml bulunamadı, atlanıyor.');
    return;
  }

  const xml = fs.readFileSync(sitemapPath, 'utf8');
  // Aynı adres birden fazla kez yazılmışsa (ör. "ASUS" / "Asus" gibi yalnızca
  // büyük-küçük harfi farklı marka adları aynı slug'a düşünce) tek girdi kalır.
  const seenLocs = new Set();
  const urlBlocks = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)].map(m => m[0].trim()).filter(block => {
    const loc = (block.match(/<loc>([^<]*)<\/loc>/) || [])[1];
    if(!loc) return true;
    if(seenLocs.has(loc)) return false;
    seenLocs.add(loc);
    return true;
  });

  if(!urlBlocks.length){
    console.warn('UYARI: split-sitemap — sitemap.xml içinde <url> girdisi bulunamadı, atlanıyor (zaten index formatında olabilir).');
    return;
  }

  // Önceki çalıştırmadan kalan parça dosyalarını temizle — idempotent.
  // (URL sayısı azalırsa eski fazla parça dosyaları sunucuda öksüz kalmasın.)
  fs.readdirSync(rootDir)
    .filter(f => /^sitemap-\d+\.xml$/.test(f))
    .forEach(f => { try{ fs.unlinkSync(path.join(rootDir, f)); }catch(e){} });

  const today = new Date().toISOString().slice(0, 10);
  const chunkFiles = [];
  for(let i = 0; i < urlBlocks.length; i += CHUNK_SIZE){
    const chunk = urlBlocks.slice(i, i + CHUNK_SIZE);
    const n = chunkFiles.length + 1;
    const fileName = `sitemap-${n}.xml`;
    const chunkXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunk.join('\n')}
</urlset>
`;
    fs.writeFileSync(path.join(rootDir, fileName), chunkXml);
    chunkFiles.push(fileName);
  }

  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunkFiles.map(f => `  <sitemap>
    <loc>https://teknoversus.com.tr/${f}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>
`;
  fs.writeFileSync(sitemapPath, indexXml);

  console.log(`sitemap.xml bir sitemap index'e dönüştürüldü: ${urlBlocks.length} URL, ${chunkFiles.length} parça dosyaya bölündü (parça başına en fazla ${CHUNK_SIZE} URL) — hosting'in esnetilemeyen WAF response-body kesme limitini aşmamak için.`);
}

module.exports = { splitSitemap, CHUNK_SIZE };
