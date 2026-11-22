# Elektrikli Araç bölümü — HAZIR, YAYINDA DEĞİL

Bu bölüm `ev-taslak` dalında durur ve **main'e birleştirilmedi**. Deploy yalnızca main'den çalıştığı için siteye hiçbir şey çıkmaz. Main'e birleştirilse bile `EV_PUBLISH=1` verilmeden build hiçbir EV sayfası üretmez.

## İçerik
- `ev/data/models.json`: Türkiye'de 2026'da satılan 14 elektrikli model (ODMD satış listelerinden seçildi). Teknik veriler EV Database ve evkx.net sayfalarından 22 Kasım 2026'da alındı, her modelde kaynak bağlantısı var. Her model için 120+ kelimelik özgün editör değerlendirmesi, artılar/eksiler.
- `ev/data/guides.json`: 3 özgün rehber (evde şarj, AC/DC şarj, WLTP ve gerçek menzil).
- `assets/ev/`: 14 gerçek araç fotoğrafı (Wikimedia Commons, CC BY-SA 4.0, 800 px WebP). Kaynak ve yazar bilgisi `models.json` içinde `image` alanında; her sayfada "Fotoğraflar" satırında atıf gösterilir. Lisans gereği bu atıflar kaldırılmamalı.
- `ev/generate-ev.js`: liste, 14 model, 9 karşılaştırma, 3 rehber sayfası; şarj maliyeti hesaplayıcı; JSON-LD (Breadcrumb, FAQ, Car, Article, ItemList).

## Önizleme
`node scripts/ev-preview.js /tmp/ev-preview` → repo dışına yazar, tüm sayfalar noindex ve "TASLAK" şeritli.

## Yayına alma (AdSense onayından SONRA)
1. `git merge ev-taslak` ile main'e birleştir.
2. `.github/workflows/` içindeki build adımına `EV_PUBLISH: '1'` ortam değişkenini ekle.
3. Push → build şunları yapar: EV sayfalarını üretir, indekslenebilir 27 URL'yi sitemap'e ekler, üst menüye "Elektrikli Araçlar" bağlantısını koyar.
4. Search Console'da `/elektrikli-araclar/` için indeksleme iste.

## Bakım
- Veriler 3-6 ayda bir kaynaklarından kontrol edilmeli (`sourceDate` alanını güncelle).
- Fiyat bilinçli olarak gösterilmiyor (Türkiye fiyatları sık değişiyor).
- Yeni model: `models.json`'a ekle; ≥8 özellik ve ≥120 kelimelik `editor` metni yoksa sayfa otomatik noindex kalır.
- Yeni karşılaştırma: yalnızca gerçek rakipleri `curatedPairs`'e ekle; tüm kombinasyonları üretme.

## AdSense kuralları (kodda zorunlu)
- `sample:true` kayıt varsa yayın modu hata verir.
- Model sayfası: ≥8 dolu özellik + ≥120 kelimelik editör metni yoksa `noindex`.
- Karşılaştırma: yalnızca `curatedPairs`, iki model de indekslenebilirse `index`.
- Sitemap'e yalnızca indekslenebilir sayfalar girer.
