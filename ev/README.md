# Elektrikli Araç bölümü (TASLAK — yayında değil)

Bu klasör `ev-taslak` dalında durur, **main'e birleştirilmedi**; deploy yalnızca main'den çalıştığı için siteye hiçbir şey çıkmaz.

## Önizleme
`node scripts/ev-preview.js /tmp/ev-preview` → liste, model ve karşılaştırma sayfalarını repo dışına yazar.

## Yayına almadan önce
1. `ev/data/models.json` içindeki örnek veriyi gerçek, üretici sayfasından doğrulanmış veriyle değiştir; `sample` alanlarını kaldır.
2. Her model için ≥120 kelimelik özgün `editor` metni yaz (yoksa sayfa noindex kalır).
3. Evde şarj / AC-DC rehberlerini (elektrik tesisatı bilgisiyle) gerçek yazıya çevir.
4. `build.js`'e `generateEv({ rootDir, outDir: rootDir, publish: true })` ekle, sitemap'e dönen `sitemap` listesini ekle, menüye bağlantıyı koy.
5. AdSense onayından SONRA yayınla (şimdi şablon sayfa oranını artırmamak için).

## AdSense kuralları (kodda zorunlu)
- `sample:true` kayıt varsa yayın modu hata verir.
- Model sayfası: ≥8 dolu özellik + ≥120 kelimelik editör metni yoksa `noindex`.
- Karşılaştırma yalnızca elle seçilmiş `curatedPairs` için, iki model de indekslenebilirse `index`.
- Sitemap'e yalnızca indekslenebilir sayfalar girer.
