# Ana sayfa — eski tasarımın yedeği (A tasarımından önce)

Alındığı tarih: 21 Ekim 2026. GitHub yedek dalı: `yedek/anasayfa-eski` (A öncesi hal, commit d9ed200).

- `index.html`: yayındaki (main) ana sayfa şablonunun birebir kopyası.
- `home-blocks.js`: A'dan hemen önceki hali (haber kapak görselli sürüm, haber-gorsel-discover dalı).
- `home-blocks.main.js`: yayındaki (main) hali.
- `build.js`: A'dan önceki build.js (updateHomeBlocks çağrısı bu haliyle).

Eski haline dönmek için: bu klasördeki `index.html` ve `home-blocks.js` dosyalarını
kökteki `index.html` ve `lib/home-blocks.js` üzerine kopyala, build.js'teki
`updateHomeBlocks({...})` çağrısını bu klasördeki build.js'teki haline döndür.
(Ya da git: `git checkout origin/yedek/anasayfa-eski -- index.html lib/home-blocks.js build.js`.)
lib/ klasörü FTP'ye yüklenmez; bu yedek sitede görünmez.
