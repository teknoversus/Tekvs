# NEWS

Kaynak seçimi:
- Sadece son 14 gün içinde gerçekleşmiş/duyurulmuş, doğrulanabilir haberler.
- Güvenilir kaynak: resmi üretici açıklamaları, tanınmış teknoloji basını
  (GSMArena, Android Authority, resmi basın bültenleri vb.).
- Düşük kaliteli/clickbait kaynaklardan beslenmez.

Özgünlük (telif):
- Hiçbir kaynaktan doğrudan alıntı/çeviri YAPILMAZ.
- Her şey paraphrase edilir — humanizer ilkeleriyle (em-dash yok, dolgu
  ifadesi yok, doğal cümle ritmi, promosyon dili yok).
- Aynı konu, farklı kaynaklardan derlenip TEK bir özgün yazıya dönüştürülür.

Format (her haberde zorunlu, bkz. generate-news.js şablonu):
- Kısa Cevap (ilk 100 kelimede net cevap)
- 4 paragraf gövde metni
- Öne Çıkan Rakamlar tablosu (varsa somut sayı/tarih/fiyat)
- Sıkça Sorulan Sorular (2-3 soru, FAQPage schema)
- Özet
- En az 5 iç link (kategori, karşılaştırmalar, ilgili ürün varsa ürün
  sayfası, diğer haberler)

Belirsizlik yönetimi:
- Sızıntı/söylenti haberlerinde bu AÇIKÇA belirtilir ("iddia ediliyor",
  "sızıntıya göre", "doğrulanmadı").
- Resmi tanıtım öncesi bilgiler kesin bilgi gibi sunulmaz.

Kategori dengesi:
- Sadece telefon haberleriyle sınırlı kalınmaz — dizüstü, kulaklık,
  akıllı saat, tablet, televizyon kategorileri de düzenli kapsanır.
- Yayın ritmi düzenli tutulur (haftada en az 1-2 haber), uzun sessizlik
  dönemlerinden kaçınılır — bu Google'a "aktif site" sinyali verir.

İlgili ürün eşleştirmesi:
- Haber, kataloğumuzdaki bir ürünle doğrudan ilgiliyse (yeni sürüm,
  doğrudan rakip vb.) relatedProductId ile bağlanır.
- Zorlama eşleştirme yapılmaz — ilgisizse null bırakılır.
