// ============================================================
// TeknoVersus — ürün fotoğrafları (24 Kasım 2026).
//
// Ürün sayfalarında şimdiye kadar yalnızca çizim (SVG illüstrasyon) vardı.
// lib/product-photos.json'da kaydı olan ürünler için üreticinin basın/ürün
// sayfasındaki resmi görsel build sırasında indirilir, beyaz zemin üzerine
// en boy oranı korunarak en fazla 1200 px'e küçültülür ve urun/img/ altına yazılır.
// Ürün sayfası, karşılaştırma ve anasayfa kartları bu fotoğrafı kullanır;
// Product şemasına ve og:image'a da eklenir. Kaydı olmayan ya da indirilemeyen
// ürünler eskisi gibi illüstrasyonla devam eder (build durmaz).
//
// Determinizm: -strip + sabit kalite → aynı kaynak her build'de aynı bayt,
// dosya adındaki hash içerikten → FTP her seferinde yeniden yüklemez.
// ============================================================
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { download, imBinary, imageSize } = require('./news-images');

const SITE = 'https://teknoversus.com.tr';

async function buildProductPhotos({ products, rootDir }){
  const result = {};
  let map = {};
  try{ map = JSON.parse(fs.readFileSync(path.join(__dirname, 'product-photos.json'), 'utf8')); }catch(e){ return result; }
  const ids = new Set(products.map(p => String(p.id)));
  const entries = Object.entries(map).filter(([id, v]) => id[0] !== '_' && v && v.url && ids.has(id));
  if(!entries.length) return result;
  if(!imBinary()){ console.warn('UYARI: ImageMagick yok — ürün fotoğrafları atlandı.'); return result; }

  const outDir = path.join(rootDir, 'urun', 'img');
  fs.mkdirSync(outDir, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tv-prod-img-'));
  let ok = 0, failed = 0;
  for(const [id, v] of entries){
    const src = path.join(tmp, id.replace(/[^a-z0-9_-]/gi, '_') + '.src');
    try{
      await download(v.url, src);
      const sz = imageSize(src);
      if(!sz || !sz.w) throw new Error('okunamayan görsel');
      const safe = id.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const variants = { full: 1200, thumb: 600 };
      const out = {};
      for(const [key, size] of Object.entries(variants)){
        const tmpOut = path.join(tmp, `${safe}-${key}.jpg`);
        // v.trim: ürün küçük, etrafı geniş beyaz boşluklu stüdyo görselleri (ör. Samsung) için
        // kenar boşluğunu kırpıp küçük bir pay bırakır.
        const trimArgs = v.trim ? ['-fuzz', '6%', '-trim', '+repage', '-bordercolor', 'white', '-border', '24x24'] : [];
        execFileSync(imBinary(), [src + '[0]', '-auto-orient', '-strip', '-background', 'white', '-alpha', 'remove', '-alpha', 'off', ...trimArgs,
          '-resize', `${size}x${size}>`, '-quality', '84', '-interlace', 'Plane', tmpOut]);
        const hash = crypto.createHash('sha1').update(fs.readFileSync(tmpOut)).digest('hex').slice(0, 8);
        const name = `${safe}-${hash}-${key}.jpg`;
        fs.copyFileSync(tmpOut, path.join(outDir, name));
        out[key] = `/urun/img/${name}`;
        const d = imageSize(tmpOut) || { w: size, h: size };
        out[key + 'W'] = d.w; out[key + 'H'] = d.h;
      }
      result[id] = { src: out.full, thumb: out.thumb, w: out.fullW, h: out.fullH, tw: out.thumbW, th: out.thumbH, abs: SITE + out.full, credit: v.credit || '' };
      ok++;
    }catch(e){
      failed++;
      console.warn(`UYARI: ürün fotoğrafı indirilemedi (${id}): ${e.message} — illüstrasyon kullanılacak.`);
    }
  }
  try{ fs.rmSync(tmp, { recursive: true, force: true }); }catch(e){}
  console.log(`→ Ürün fotoğrafları: ${ok} hazır${failed ? `, ${failed} indirilemedi` : ''} -> urun/img/`);
  return result;
}

module.exports = { buildProductPhotos };
