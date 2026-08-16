// Ürün SVG illüstrasyonlarını gerçek PNG dosyasına dönüştürür.
// Neden: Google Search Console "image alanı eksik" (KRİTİK) hatası veriyor —
// Product schema.org işaretlemesi bir görsel URL'si gerektiriyor. Marka basın
// fotoğrafı kullanamayacağımız için (telif), zaten sitede kullanılan ORİJİNAL
// SVG illüstrasyonu kendi PNG dosyamıza render ediyoruz — gerçek, sahibi bize
// ait, telif sorunu olmayan bir görsel.
//
// Çıktı: assets/products/{slug}.png (800x800, kare, beyaz zemin — Google
// Merchant Center'ın önerdiği temiz ürün görseli formatı)
//
// NOT: ImageMagick (`convert`) gerektirir — ubuntu-latest GitHub Actions
// runner'ında zaten kurulu geliyor, ekstra bir npm bağımlılığı eklemiyoruz.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const rootDir = __dirname;
const outDir = path.join(rootDir, 'assets', 'products');
if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// illustrationFor/shade fonksiyonları lib/generate-site.js içinde generateSite()
// kapsamının içinde tanımlı (export edilmiyor). Ana dosyayı riske atmadan,
// kaynak kodunu metin olarak çekip kendi izole vm bağlamımızda çalıştırıyoruz —
// böylece iki yerde aynı illüstrasyon mantığını elle kopyalayıp senkron
// tutma derdi de olmuyor.
const genSiteSrc = fs.readFileSync(path.join(rootDir, 'lib', 'generate-site.js'), 'utf8');
function extractFunction(src, name){
  const idx = src.indexOf(`function ${name}(`);
  if(idx === -1) return null;
  const braceStart = src.indexOf('{', idx);
  let depth = 0;
  for(let i = braceStart; i < src.length; i++){
    if(src[i] === '{') depth++;
    else if(src[i] === '}'){
      depth--;
      if(depth === 0) return src.slice(idx, i+1);
    }
  }
  return null;
}
const shadeSrc = extractFunction(genSiteSrc, 'shade');
const illusSrc = extractFunction(genSiteSrc, 'illustrationFor');
if(!shadeSrc || !illusSrc){
  console.error('Hata: shade/illustrationFor fonksiyonları generate-site.js içinde bulunamadı.');
  process.exit(1);
}
const illusContext = {};
vm.createContext(illusContext);
vm.runInContext(shadeSrc + '\n' + illusSrc + '\nthis.illustrationFor = illustrationFor;', illusContext);
const illustrationFor = illusContext.illustrationFor;

const sharedSrc = fs.readFileSync(path.join(rootDir, 'shared.js'), 'utf8');
const PALETTE_MAP = {'--c1':'#2B6CB0','--c2':'#B23A5C','--c3':'#B8790F','--c4':'#1F7A6C','--c5':'#6B4C9A','--c6':'#4A5568','--c7':'#9A4B2F'};
const context = {
  console,
  document: { documentElement: {}, getElementById: () => null },
  getComputedStyle: () => ({ getPropertyValue: (v) => PALETTE_MAP[v] || '' }),
  window: {},
};
vm.createContext(context);
vm.runInContext(sharedSrc, context);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'seed-data.js'), 'utf8'), context); // SEED artık ayrı dosyada
const SEED = vm.runInContext('SEED', context);
const colorFor = vm.runInContext('colorFor', context);
const productSlug = vm.runInContext('productSlug', context);

let created = 0, skipped = 0, failed = 0;

SEED.forEach(p => {
  if(p.upcoming) return; // henüz piyasada olmayan ürünler için görsel üretme
  const slug = productSlug(p);
  const outPath = path.join(outDir, `${slug}.png`);
  if(fs.existsSync(outPath)){ skipped++; return; } // zaten üretilmiş, atla (idempotent)

  const color = colorFor(p.cat);
  const uid = slug.replace(/[^a-z0-9]/g, '');
  const svg = illustrationFor(p.cat, color, uid);

  // ImageMagick'in rsvg-convert delegesi bu ortamda kurulamadığı için
  // (paket deposu erişimi kısıtlı), SVG'yi basit bir HTML sayfasına sarıp
  // wkhtmltoimage (WebKit tabanlı, sistemde hazır kurulu) ile 800x800
  // kare, beyaz zeminli PNG olarak render ediyoruz.
  const tmpHtml = path.join(outDir, `_tmp_${uid}.html`);
  const html = `<!DOCTYPE html><html><head><style>
html,body{margin:0;width:800px;height:800px;background:#ffffff;}
body{display:flex;align-items:center;justify-content:center;}
svg{max-width:560px;max-height:560px;width:auto;height:auto;}
</style></head><body>${svg}</body></html>`;
  fs.writeFileSync(tmpHtml, html);

  try {
    execSync(
      `wkhtmltoimage --width 800 --height 800 --quality 92 "${tmpHtml}" "${outPath}"`,
      { stdio: 'pipe' }
    );
    // RGBA->RGB + optimize (wkhtmltoimage PNG çıktısı gereksiz büyük olabiliyor)
    execSync(`convert "${outPath}" -background white -alpha remove -alpha off -strip -quality 90 "${outPath}"`, { stdio: 'pipe' });
    created++;
  } catch(e){
    console.error('BAŞARISIZ:', slug, e.message.split('\n')[0]);
    failed++;
  } finally {
    if(fs.existsSync(tmpHtml)) fs.unlinkSync(tmpHtml);
  }
});

console.log(`Görsel üretimi tamam — yeni: ${created}, zaten vardı: ${skipped}, başarısız: ${failed}`);
