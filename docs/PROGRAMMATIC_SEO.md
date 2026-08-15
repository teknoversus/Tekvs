# PROGRAMMATIC SEO

Oluşturulacak şablonlar:

{marka} telefonları

Örnek:
Samsung Telefonları

{marka} vs {marka}

Örnek:
Samsung vs Xiaomi

{model} inceleme

Örnek:
Galaxy S26 Ultra İnceleme

{model} özellikleri

Örnek:
iPhone 18 Özellikleri

{ürün} alınır mı

Örnek:
Galaxy A58 Alınır mı

{ürün} kullanıcı yorumları

{ürün} fiyat performans mı

Her şablon:

- benzersiz giriş
- benzersiz sonuç
- güncel tablo

üretmelidir.

Şablon izi bırakma.

---
Uygulama durumu:
- {marka} telefonları → lib/generate-brand-pages.js (35 sayfa, tüm kategoriler)
- {model} inceleme → lib/generate-reviews.js (157 ürün)
- {model} özellikleri → lib/generate-site.js (mevcut urun/*.html sayfaları)
- {ürün} alınır mı → lib/generate-buying-guides.js (157 ürün)
- {ürün} fiyat performans mı → lib/generate-buying-guides.js (157 ürün)
- {marka} vs {marka} → HENÜZ YAPILMADI
- {ürün} kullanıcı yorumları → BİLİNÇLİ ERTELENDİ (yeterli gerçek kullanıcı
  yorumu birikene kadar — boş sayfa ince içerik sayılır, SEO'ya zarar verir)

Şablon izi önleme: Her sayfa gerçek ürüne özgü veriyle (fiyat, skor,
artı/eksi, rakip listesi) besleniyor — yalnızca isim değiştirilen kopya
metin değil.
