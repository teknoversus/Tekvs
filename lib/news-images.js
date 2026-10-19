// ============================================================
// TeknoVersus — haber kapak görselleri.
//
// Neden: Haber trafiğinin ana kaynağı Google Discover ve aramadaki
// "Önemli haberler" kutusu. İkisi de haberde en az 1200 px genişliğinde
// büyük bir görsel ister (og:image + NewsArticle.image + robots
// max-image-preview:large). Görseli olmayan haber Discover'a giremez.
//
// Her haber için dört dosya üretilir (haberler/img/ altında):
//   {id}-{hash}-16x9.jpg   1200x675   og:image, sayfadaki kapak
//   {id}-{hash}-4x3.jpg    1200x900   NewsArticle.image (Google 3 oran ister)
//   {id}-{hash}-1x1.jpg    1200x1200  NewsArticle.image
//   {id}-{hash}-thumb.jpg  640x360    liste/anasayfa kartları
//
// Kaynak:
//   1) Haberde image_url varsa (admin'den yüklenen fotoğraf ya da yapıştırılan
//      bağlantı) indirilir ve bu dört orana ortadan kırpılır.
//   2) Yoksa ya da indirilemezse, başlık + kategoriyle markalı bir kapak
//      kartı çizilir. Böylece hiçbir haber görselsiz kalmaz.
//
// Determinizm: Aynı girdi her build'de BİREBİR aynı baytları üretmeli,
// yoksa FTP fark senkronu her deploy'da tüm görselleri yeniden yükler.
// Bu yüzden: -strip (zaman damgası/EXIF yok), repodaki sabit font dosyaları
// (runner'ın sistem fontlarına bağımlı değil), sabit kalite ayarı. Dosya
// adındaki {hash} görselin kendi içerik hash'i — görsel değişince adres de
// değişir, tarayıcı/CDN önbelleği eski görseli göstermez.
//
// Gereksinim: ImageMagick (convert). deploy.yml kurulu değilse kurar. Yoksa
// build DURMAZ, haberler görselsiz (eski davranış) üretilir.
// ============================================================
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const FONT_TITLE = path.join(__dirname, 'fonts', 'Oswald_600SemiBold.ttf');
const FONT_TEXT = path.join(__dirname, 'fonts', 'Inter_600SemiBold.ttf');

// styles.css --c1..--c7 sırası = CATS sırası (shared.js colorFor ile aynı).
const CAT_COLORS = {
  'Telefon':'#2B6CB0', 'Dizüstü':'#B23A5C', 'Kulaklık':'#B8790F', 'Kamera':'#1F7A6C',
  'Akıllı Saat':'#6B4C9A', 'Tablet':'#4A5568', 'Televizyon':'#9A4B2F', 'Teknoloji':'#2B6CB0'
};

const VARIANTS = [
  { key:'16x9', w:1200, h:675 },
  { key:'4x3', w:1200, h:900 },
  { key:'1x1', w:1200, h:1200 },
  { key:'thumb', w:640, h:360 },
];

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

let IM_BIN; // undefined = henüz bakılmadı, null = yok
function imBinary(){
  if(IM_BIN !== undefined) return IM_BIN;
  IM_BIN = null;
  for(const bin of ['convert', 'magick']){
    try{ execFileSync(bin, ['-version'], { stdio:'ignore' }); IM_BIN = bin; break; }catch(e){}
  }
  return IM_BIN;
}

// ImageMagick caption:/-annotate metninde % kaçış dizisi, baştaki @ dosya
// okuma, \ ise kaçış anlamı taşır — başlıkta geçerse metni bozmasın.
function imText(s){
  return String(s || '').replace(/\\/g, '/').replace(/%/g, '%%').replace(/^@/, '').replace(/\s+/g, ' ').trim();
}

function trDate(ymd){
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd || '');
  return m ? `${+m[3]} ${MONTHS[+m[2]-1]} ${m[1]}` : '';
}

function shadeHex(hex, f){
  const n = parseInt(hex.slice(1), 16);
  const ch = s => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + [16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join('');
}

function textWidth(font, pt, text){
  try{
    const out = execFileSync(imBinary(), ['-font', font, '-pointsize', String(pt), `label:${imText(text)}`, '-format', '%w', 'info:'], { encoding:'utf8' });
    return +out || 0;
  }catch(e){ return 0; }
}

// Görsel olmayan haberler için markalı kapak kartı.
function renderCard(n, w, h, outFile){
  const im = imBinary();
  const accent = CAT_COLORS[n.cat] || CAT_COLORS.Teknoloji;
  const base = Math.min(w, h);
  const mx = Math.round(w * 0.075);
  const catSize = Math.round(base * 0.042);
  const footSize = Math.round(base * 0.05);
  const footY = h - Math.round(h * 0.09);              // alt satırın taban çizgisi
  const areaTop = Math.round(h * 0.08);
  const areaBottom = footY - Math.round(footSize * 2.2);
  const titleW = w - mx * 2;
  const len = (n.title || '').length;
  const maxPt = Math.round(base * (len < 40 ? 0.12 : len < 70 ? 0.1 : 0.085));
  const gap = Math.round(catSize * 0.9);
  const maxTitleH = areaBottom - areaTop - catSize - gap;

  // 1) Başlığı ayrı bir saydam katmana diz, kutuya sığmazsa küçült.
  const titlePng = outFile + '.title.png';
  execFileSync(im, [
    '-size', `${titleW}x`, '-background', 'none', '-fill', '#FFFFFF',
    '-font', FONT_TITLE, '-pointsize', String(maxPt), '-interline-spacing', String(Math.round(base * 0.006)),
    '-gravity', 'West', `caption:${imText(n.title)}`, '-trim', '+repage',
    '-resize', `${titleW}x${maxTitleH}>`, '-strip', titlePng
  ], { stdio:['ignore','ignore','pipe'] });
  const tsz = imageSize(titlePng) || { w: titleW, h: maxTitleH };

  // 2) Kategori + başlık grubunu üst alanda dikey ortala.
  const groupH = catSize + gap + tsz.h;
  const groupTop = Math.round(areaTop + (areaBottom - areaTop - groupH) / 2);
  const catBase = groupTop + catSize;
  const titleTop = catBase + gap;

  const teknoW = textWidth(FONT_TITLE, footSize, 'TEKNO') || Math.round(footSize * 2.55);
  const args = [
    '-size', `${w}x${h}`, `gradient:${shadeHex(accent, 0.42)}-#0F1622`,
    '-fill', accent, '-draw', `rectangle 0,0 ${Math.round(base*0.016)},${h}`,
    titlePng, '-gravity', 'NorthWest', '-geometry', `+${mx}+${titleTop}`, '-composite', '+gravity',
    '-font', FONT_TEXT, '-pointsize', String(catSize), '-fill', '#F2C14E',
    '-annotate', `+${mx}+${catBase}`, imText((n.cat || 'Teknoloji').toLocaleUpperCase('tr-TR')),
    '-font', FONT_TITLE, '-pointsize', String(footSize),
    '-fill', '#FFFFFF', '-annotate', `+${mx}+${footY}`, 'TEKNO',
    '-fill', '#EFB123', '-annotate', `+${mx + teknoW}+${footY}`, 'VERSUS',
  ];
  const dateText = trDate(n.date);
  if(dateText){
    const dPt = Math.round(footSize * 0.62);
    const dW = textWidth(FONT_TEXT, dPt, dateText);
    args.push('-font', FONT_TEXT, '-pointsize', String(dPt), '-fill', '#B9C4D0',
      '-annotate', `+${w - mx - dW}+${footY}`, imText(dateText));
  }
  args.push('-strip', '-interlace', 'Plane', '-sampling-factor', '4:2:0', '-quality', '86', outFile);
  try{ execFileSync(im, args, { stdio:['ignore','ignore','pipe'] }); }
  finally { try{ fs.unlinkSync(titlePng); }catch(e){} }
}

function cropPhoto(srcFile, w, h, outFile){
  execFileSync(imBinary(), [
    srcFile + '[0]', '-auto-orient', '-colorspace', 'sRGB', '-background', '#FFFFFF', '-flatten',
    '-resize', `${w}x${h}^`, '-gravity', 'center', '-extent', `${w}x${h}`,
    '-strip', '-interlace', 'Plane', '-sampling-factor', '4:2:0', '-quality', '84', outFile
  ], { stdio:['ignore','ignore','pipe'] });
}

function imageSize(file){
  try{
    const out = execFileSync(imBinary(), [file + '[0]', '-format', '%w %h', 'info:'], { encoding:'utf8' });
    const [w, h] = out.trim().split(/\s+/).map(Number);
    return { w, h };
  }catch(e){ return null; }
}

async function download(url, destFile){
  if(!/^https?:\/\//i.test(url || '')) throw new Error('geçersiz adres');
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try{
    const res = await fetch(url, { signal: ctrl.signal, redirect:'follow', headers:{ 'User-Agent':'TeknoVersusBuild/1.0 (+https://teknoversus.com.tr)' } });
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const type = res.headers.get('content-type') || '';
    if(type && !/^image\//i.test(type)) throw new Error('görsel değil: ' + type);
    const buf = Buffer.from(await res.arrayBuffer());
    if(buf.length < 2000) throw new Error('çok küçük dosya');
    if(buf.length > 20 * 1024 * 1024) throw new Error('20 MB üstü');
    fs.writeFileSync(destFile, buf);
  } finally { clearTimeout(t); }
}

// items: rowToNews çıktısı. Her habere n.cover = {...} yazar ve haritayı döndürür.
async function buildNewsImages({ items, outDir }){
  const result = {};
  if(!imBinary()){
    console.warn('UYARI: ImageMagick bulunamadı — haber kapak görselleri üretilmedi (haberler görselsiz yayınlanacak).');
    return result;
  }
  const imgDir = path.join(outDir, 'img');
  fs.mkdirSync(imgDir, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tv-news-img-'));
  let photos = 0, cards = 0, failed = 0;

  for(const n of items){
    let usePhoto = false;
    const srcFile = path.join(tmp, n.id + '.src');
    if(n.imageUrl){
      try{
        await download(n.imageUrl, srcFile);
        const sz = imageSize(srcFile);
        if(!sz || !sz.w) throw new Error('okunamayan görsel');
        if(sz.w < 1200) console.warn(`UYARI: "${n.id}" görseli ${sz.w}px genişlikte — Discover için en az 1200px önerilir, büyütülerek kullanıldı.`);
        usePhoto = true;
      }catch(e){
        failed++;
        console.warn(`UYARI: "${n.id}" görseli indirilemedi (${e.message}) — markalı kapak kartı kullanılacak.`);
      }
    }

    const files = {};
    try{
      for(const v of VARIANTS){
        const f = path.join(tmp, `${n.id}-${v.key}.jpg`);
        if(usePhoto) cropPhoto(srcFile, v.w, v.h, f);
        else renderCard(n, v.w, v.h, f);
        files[v.key] = f;
      }
    }catch(e){
      console.warn(`UYARI: "${n.id}" kapak görseli üretilemedi: ${(e.stderr || e.message || '').toString().slice(0, 300)}`);
      continue;
    }

    // Tek hash: dört dosyanın birlikte içerik hash'i (biri değişirse hepsi yeni adres alır).
    const h = crypto.createHash('sha1');
    VARIANTS.forEach(v => h.update(fs.readFileSync(files[v.key])));
    const hash = h.digest('hex').slice(0, 8);

    const cover = { isPhoto: usePhoto, alt: '', credit: '' };
    VARIANTS.forEach(v => {
      const name = `${n.id}-${hash}-${v.key}.jpg`;
      fs.copyFileSync(files[v.key], path.join(imgDir, name));
      cover[v.key] = {
        path: `haberler/img/${name}`,
        url: `https://teknoversus.com.tr/haberler/img/${name}`,
        w: v.w, h: v.h, bytes: fs.statSync(files[v.key]).size
      };
    });
    cover.alt = (usePhoto && n.imageAlt) ? n.imageAlt : n.title;
    cover.credit = usePhoto ? (n.imageCredit || '') : '';
    n.cover = cover;
    result[n.id] = cover;
    usePhoto ? photos++ : cards++;
  }

  try{ fs.rmSync(tmp, { recursive:true, force:true }); }catch(e){}
  console.log(`Haber kapak görselleri: ${photos} fotoğraf, ${cards} markalı kart${failed ? `, ${failed} indirilemedi (karta düştü)` : ''} -> haberler/img/`);
  return result;
}

module.exports = { buildNewsImages, VARIANTS };
