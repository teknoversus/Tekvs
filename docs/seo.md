# SEO

Her sayfada zorunlu:
- Benzersiz <title> (60 karakter altı, marka adı sonda: "| TeknoVersus")
- Benzersiz meta description (155 karakter altı, sayfanın gerçek içeriğini
  özetler, anahtar kelime doldurma yapılmaz)
- rel="canonical" (kendi URL'ine, ticari şablon sayfalarında zorunlu —
  aksi halde arama motoru "ince/kopya içerik" olarak değerlendirebilir)
- sitemap.xml'e otomatik eklenir (build script'i bunu zaten hallediyor,
  elle eklemeye gerek yok)

Yapısal veri (schema.org JSON-LD):
- Ürün sayfası → Product + BreadcrumbList + (varsa) FAQPage
- Karşılaştırma sayfası → BreadcrumbList + FAQPage
- Haber → NewsArticle + FAQPage
- İnceleme → Review + FAQPage
- Rehber/marka/kategori sayfası → FAQPage

URL yapısı:
- Küçük harf, Türkçe karakter yok (slugify fonksiyonu zaten bunu yapıyor)
- Kategori öneki klasör olarak: /urun/, /karsilastir/, /inceleme/, /rehber/,
  /marka/, /kategori/, /haberler/

İç linkleme (bkz. internal-linking.md kuralları, aynen geçerli):
- Minimum 5 iç link, anchor çeşitliliği zorunlu
- Ticari sayfalar (ürün/inceleme/rehber) topical guide'a (pillar) bağlanır

İnce içerik (thin content) önleme:
- 2'den az ürün içeren bir alt kategori/marka sayfası ASLA üretilmez
  (mevcut generator'lar bunu otomatik kontrol ediyor)
- Kullanıcı içeriğine (yorum, puan) dayanan sayfalar, yeterli veri
  birikene kadar üretilmez — boş "0 yorum" sayfası yayınlanmaz

Performans:
- Görseller lazy-load (loading="lazy")
- Harici script minimal, sadece GA4 + Chart.js (fiyat grafiği)
