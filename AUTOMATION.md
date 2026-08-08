# TeknoVersus — Mevcut Hosting'inle Otomatik SEO Sayfası Kurulumu

Bu kurulum **domain'ini ve hosting'ini değiştirmeden** çalışır. Netlify'ye gerek yok.

Nasıl çalışıyor:
```
Admin panelinden ürün eklersin
        ↓
Supabase'e kaydedilir
        ↓
Supabase webhook'u, GitHub'a "bir şey değişti" sinyali gönderir
        ↓
GitHub Actions otomatik çalışır: build.js'i çalıştırır
        ↓
Supabase'den güncel veri çekilir, tüm urun/*.html + sitemap.xml yeniden üretilir
        ↓
GitHub Actions, güncellenmiş tüm dosyaları FTP ile SENİN mevcut hosting'ine yükler
        ↓
1-2 dakika içinde kendi domain'inde canlı görünür
```

---

## Adım 1 — Hosting'inin FTP bilgilerini bul

Hosting sağlayıcının kontrol panelinden (cPanel, Plesk, doğrudan sağlayıcı paneli vb.) şunları bul:
- **FTP sunucu adresi** (örn. `ftp.siteniz.com` veya bir IP adresi)
- **FTP kullanıcı adı**
- **FTP şifresi**
- **Yükleme dizini** (genelde `public_html` veya `/httpdocs` veya `/` — hosting'ine göre değişir)

Bulamıyorsan hosting sağlayıcının destek/yardım sayfasına "FTP bilgilerim nerede" diye bakabilir ya da bana sağlayıcının adını söyleyebilirsin, birlikte bulabiliriz.

## Adım 2 — Siteyi GitHub'a yükle

1. [github.com](https://github.com)'da ücretsiz hesap aç (yoksa).
2. Yeni bir **private repo** oluştur (örn. `teknoversus`).
3. Bu klasördeki **tüm dosyaları** (bu `.github` klasörü dahil!) o repoya yükle.

## Adım 3 — FTP bilgilerini GitHub'a güvenli şekilde ekle

1. GitHub'da reponu aç → **Settings → Secrets and variables → Actions**.
2. **New repository secret** ile şu dört tanesini tek tek ekle:
   - `FTP_SERVER` → FTP sunucu adresin
   - `FTP_USERNAME` → FTP kullanıcı adın
   - `FTP_PASSWORD` → FTP şifren
   - `FTP_SERVER_DIR` → yükleme dizinin (örn. `/public_html/`)

   Bu bilgiler şifreli saklanır, GitHub Actions logs'unda bile görünmez.

## Adım 4 — Test: elle bir kere çalıştır

1. GitHub'da reponun **Actions** sekmesine git.
2. **"Build ve mevcut hosting'e yükle"** workflow'unu seç → **Run workflow** butonuna bas.
3. 1-2 dakika içinde tamamlanmalı (yeşil tik ✓). Kendi domain'ini açıp kontrol et — site orada olmalı.
4. Hata alırsan (kırmızı çarpı ✗), workflow'a tıklayıp log'ları oku — genelde FTP bilgisi yanlış girilmiş olur.

## Adım 5 — Supabase'in otomatik tetiklemesini kur

Bunun için bir **GitHub Personal Access Token** ve bir **Supabase Webhook** gerekiyor:

1. GitHub'da sağ üstteki profil resmine tıkla → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
   - Repository access: sadece `teknoversus` reponu seç.
   - Permissions → **Contents**: Read and write, **Actions**: Read and write olarak ayarla.
   - Oluştur, verdiği token'ı (uzun bir metin, `github_pat_...` ile başlar) kopyala — **bir daha gösterilmez, kaybetme.**

2. Supabase panelinde **Database → Webhooks → Create a new hook**:
   - Table: `products`
   - Events: Insert, Update, Delete (üçü de)
   - Type: `HTTP Request`
   - Method: `POST`
   - URL: `https://api.github.com/repos/KULLANICI_ADIN/teknoversus/dispatches`
     (KULLANICI_ADIN yerine kendi GitHub kullanıcı adını yaz)
   - HTTP Headers'a şunları ekle:
     - `Authorization` → `Bearer github_pat_...` (Adım 1'de kopyaladığın token)
     - `Accept` → `application/vnd.github+json`
     - `Content-Type` → `application/json`
   - Body (JSON): `{"event_type": "supabase-update"}`
3. Kaydet.

## Adım 6 — Gerçek testi yap

1. Admin panelinden yeni bir ürün ekle.
2. GitHub'da **Actions** sekmesine bak — birkaç saniye içinde yeni bir çalışma başladığını göreceksin.
3. 1-2 dakika sonra tamamlanır, kendi sitende yeni ürünün sayfası da yayında olur.

---

## Notlar

- Bu kurulumu tamamladıktan sonra **her admin değişikliğinde** (ekleme/düzenleme/silme) otomatik olarak
  tüm site yeniden üretilip hosting'ine yüklenir — elle hiçbir şey yapmana gerek kalmaz.
- İlk kurulumda `seed_products.sql` ve `supabase_setup.sql`'in çalıştırılmış olması gerekiyor.
- GitHub Personal Access Token'ı kimseyle paylaşma; sadece Supabase'in webhook ayarına gireceksin,
  kod içine yazma.
- Hosting'in FTP yerine sadece SFTP destekliyorsa haber ver, workflow'u ona göre uyarlarım
  (`SamKirkland/FTP-Deploy-Action` hem FTP hem FTPS destekler; SFTP için farklı bir action gerekir).

## Yeni ürün eklerken: ürün görseli (schema.org "image")

Her ürün sayfasında Google için bir `image` alanı gerekiyor (Search Console "Satıcı girişleri"
kontrolü bunu istiyor). Bu görseller `assets/products/{ürün-slug}.png` yolunda, sitedeki SVG
illüstrasyonun otomatik render edilmiş PNG hâli — gerçek marka fotoğrafı DEĞİL (telif nedeniyle
kasıtlı, bkz. styles.css'teki not).

**Bu görsel üretimi GitHub Actions'a bilerek eklenmedi** — `wkhtmltoimage` aracı gerektiriyor ve bu
araç GitHub'ın standart Ubuntu runner'ında garantili gelmiyor; CI'a eklemek build'i rastgele
kırma riski taşır. Onun yerine:

1. Admin panelinden yeni ürün ekledikten sonra, projeyi **lokalde** (Claude Code veya kendi
   bilgisayarında `wkhtmltoimage` kuruluysa) aç.
2. Şunu çalıştır: `node gen_product_images.js`
   — Script idempotent'tir, sadece EKSİK olan görselleri üretir, var olanlara dokunmaz.
3. Oluşan yeni `assets/products/*.png` dosyasını/dosyalarını commit'leyip main'e push'la
   (ya da elle FTP ile hosting'e yükle) — bir sonraki otomatik build bunu zaten bulur.

Bu adımı atlarsan tek sonucu: o yeni ürünün schema.org işaretlemesinde `image` alanı eksik kalır
(Search Console'da "kritik" uyarı) — sitenin geri kalanını etkilemez.
