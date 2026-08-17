// ============================================================
// TeknoVersus — Faz 5: Konu kümesi (Topical Authority) rehberleri.
// Her ana kategori için "nasıl seçilir" tarzı temel bir rehber —
// TOPICAL_AUTHORITY_RULES.md'deki pillar/cluster modelinin çekirdeği.
// ============================================================
const fs = require('fs');
const path = require('path');

function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const GA_BLOCK = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-Q14VG0SB56"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag("js", new Date());
  gtag("config", "G-Q14VG0SB56");
</script>`;

function navHTML(root){
  return `    <nav class="nav-links" id="navLinks">
      <a href="${root}index.html">Anasayfa</a>
      <a href="${root}haberler.html">Haberler</a>
      <a href="${root}yakinda-cikacak.html">Yakında Çıkacak</a>
      <a href="${root}karsilastirmalar.html">Karşılaştırmalar</a>
      <a href="${root}index.html#katalog">Katalog</a>
    </nav>`;
}
function footerHTML(root){
  return `<footer>
  <div class="wrap" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:16px;">
    <a class="chip-filter" href="${root}telefon.html">Telefon</a>
    <a class="chip-filter" href="${root}dizustu.html">Dizüstü</a>
    <a class="chip-filter" href="${root}kulaklik.html">Kulaklık</a>
    <a class="chip-filter" href="${root}kamera.html">Kamera</a>
    <a class="chip-filter" href="${root}akilli-saat.html">Akıllı Saat</a>
    <a class="chip-filter" href="${root}tablet.html">Tablet</a>
    <a class="chip-filter" href="${root}televizyon.html">Televizyon</a>
  </div>
  <div class="wrap" style="text-align:center;margin-bottom:10px;font-size:12.5px;">
    <a href="${root}hakkimizda.html" style="color:inherit;">Hakkımızda</a> · <a href="${root}gizlilik-politikasi.html" style="color:inherit;">Gizlilik Politikası</a>
  </div>
  TeknoVersus — gerçek ürünlerle çalışan karşılaştırma kataloğu.
</footer>`;
}

// Her rehber: slug, kategori, başlık, tldr, gövde paragrafları, tablo, faq, alt kategori linkleri
const GUIDES = [
  {
    slug: 'telefon-nasil-secilir',
    cat: 'Telefon', mainSlug: 'telefon',
    title: 'Telefon Nasıl Seçilir? Dikkat Edilmesi Gereken 6 Nokta',
    tldr: 'Telefon seçerken sırasıyla bütçe, kamera ihtiyacı, ekran/pil dengesi, işlemci-RAM yeterliliği, yazılım güncelleme süresi ve su geçirmezlik/dayanıklılığa bakmak en isabetli sonucu verir.',
    body: [
      'Telefon almadan önce ilk soru bütçe olmalı. 10.000 ₺ altı, 10-25.000 ₺ arası ve 25.000 ₺ üzeri segmentlerde beklentiler tamamen farklılaşıyor; giriş segmentinde 120Hz ekran veya çoklu telefoto lens beklemek gerçekçi değil.',
      'Kamera önceliğiyse tek başına megapiksel sayısına bakmak yanıltıcı. Sensör boyutu, OIS (optik görüntü sabitleyici) varlığı ve gece çekim performansı, ham MP rakamından daha belirleyici. 200MP bir sensör küçükse, 50MP büyük sensörlü bir rakibin gerisinde kalabilir.',
      'Ekran ve pil birbirine bağlı iki karar. Yüksek yenileme hızlı (120Hz) büyük bir AMOLED ekran, aynı pil kapasitesinde daha hızlı tükenir. Yoğun kullanıcılar için 5000 mAh üzeri bir batarya, ekran kalitesinden ödün vermeden gün sonuna ulaşmayı kolaylaştırır.',
      'RAM ve işlemci seçimi kullanım alışkanlığına göre değişir. Günlük sosyal medya/mesajlaşma için 6-8GB RAM yeterliyken, ağır oyun veya çoklu uygulama kullanımı 12GB ve üzeri ile daha rahat çalışır.',
      'Yazılım güncelleme süresi çoğu zaman göz ardı edilir ama uzun vadeli değeri doğrudan etkiler. Bazı üreticiler 2 yıl, bazıları 5-7 yıl güncelleme garantisi veriyor — bu fark, telefonun kaç yıl güncel kalacağını belirliyor.',
      'Su geçirmezlik (IP derecesi) ve gövde dayanıklılığı, özellikle uzun süre kullanmayı planlıyorsanız önemli. IP68 bir telefon, dereceli olmayan bir modele göre kaza sonucu hasar riskini belirgin şekilde azaltır.',
    ],
    table: [
      {k:'Bütçe önceliği', v:'Segment belirler (giriş/orta/üst)'},
      {k:'Kamera', v:'Sensör boyutu + OIS, sadece MP değil'},
      {k:'Pil', v:'5000mAh+ yoğun kullanıcı için önerilir'},
      {k:'RAM', v:'6-8GB günlük, 12GB+ ağır kullanım'},
      {k:'Güncelleme süresi', v:'Markaya göre 2-7 yıl arası değişir'},
    ],
    faq: [
      {q:'Telefonda kaç MP kamera yeterli?', a:'MP tek başına yeterli değil; 50MP büyük sensörlü bir kamera, 200MP küçük sensörlü bir kameradan genelde daha iyi sonuç verir. Sensör boyutu ve OIS varlığına bakmak daha isabetli.'},
      {q:'Telefon alırken RAM ne kadar önemli?', a:'Günlük kullanım için 6-8GB yeterlidir. Ağır oyun oynayan veya çok sayıda uygulamayı arka planda açık tutan kullanıcılar için 12GB ve üzeri daha rahat bir deneyim sunar.'},
      {q:'IP68 su geçirmezlik ne anlama gelir?', a:'IP68, telefonun toza tamamen dayanıklı ve belirli derinlik/süre koşullarında suya dayanıklı olduğu anlamına gelir. Kaza sonucu suya düşme gibi durumlarda hasar riskini azaltır.'},
    ],
    subLinks: ['android-telefonlar','iphone','kamera-telefonlari','oyuncu-telefonlari','katlanabilir-telefonlar','butce-dostu-telefonlar'],
    clusterLinks: ['ois-nedir', 'eis-nedir', 'telefonla-gece-cekimi-nasil-yapilir', 'ekran-yenileme-hizi-hz-nedir', 'ip-koruma-sinifi-nedir', 'ram-ne-kadar-yeterli', 'amoled-vs-lcd-fark'],
  },
  {
    slug: 'dizustu-bilgisayar-nasil-secilir',
    cat: 'Dizüstü', mainSlug: 'dizustu',
    title: 'Dizüstü Bilgisayar Nasıl Seçilir? Kullanım Amacına Göre Rehber',
    tldr: 'Dizüstü seçimi öncelikle kullanım amacına (ofis işi, öğrenci, oyun, taşınabilirlik) göre yapılmalı; işlemci/RAM ihtiyacı ve ekran-ağırlık dengesi bu amaca göre şekillenir.',
    body: [
      'Ofis ve günlük kullanım için ağır bir işlemciye gerek yok — 8GB RAM ve orta seviye bir işlemci (Intel Core i5 / Ryzen 5 sınıfı) çoğu görevi rahatça karşılar. Buradaki asıl öncelik pil ömrü ve taşınabilirlik olmalı.',
      'Oyun için ayrı ekran kartı (GPU) şart. Entegre grafik birimiyle güncel oyunlar akıcı çalışmaz; en azından orta seviye bir NVIDIA RTX veya AMD Radeon serisi GPU aranmalı, soğutma sistemi de performansı doğrudan etkiler.',
      'Öğrenciler için denge önemli — çok ağır olmayan bir gövde, yeterli pil ömrü (8 saat üzeri) ve orta seviye donanım genelde ihtiyacı karşılar. Bütçe kısıtlıysa SSD depolama, HDD\'ye göre kesinlikle önceliklendirilmeli.',
      'Video/foto düzenleme gibi profesyonel iş yükleri için 16GB+ RAM ve güçlü bir işlemci gerekiyor; renk doğruluğu yüksek bir ekran (özellikle Apple\'ın MacBook serisi bu alanda tercih ediliyor) da işi kolaylaştırıyor.',
      'Taşınabilirlik önceliğiyse "ultrabook" sınıfı modellere bakmak mantıklı — bunlar genelde 1.5 kg altı ağırlıkta, ince gövdeli ve uzun pil ömürlü olacak şekilde tasarlanıyor, ama bu hafiflik genelde daha yüksek fiyatla geliyor.',
    ],
    table: [
      {k:'Ofis/günlük kullanım', v:'i5/Ryzen 5, 8GB RAM yeterli'},
      {k:'Oyun', v:'Ayrı GPU (RTX/Radeon) şart'},
      {k:'Profesyonel iş (foto/video)', v:'16GB+ RAM, renk doğru ekran'},
      {k:'Taşınabilirlik', v:'Ultrabook sınıfı, 1.5kg altı'},
      {k:'Depolama', v:'SSD, HDD\'ye kesin önceliklidir'},
    ],
    faq: [
      {q:'Oyun için dizüstünde ayrı ekran kartı şart mı?', a:'Evet — entegre grafik birimiyle güncel oyunlar akıcı çalışmaz. En azından orta seviye bir ayrı GPU (RTX veya Radeon serisi) gerekiyor.'},
      {q:'Öğrenci dizüstüsünde kaç GB RAM yeterli?', a:'Genel kullanım için 8GB RAM çoğu öğrenci ihtiyacını karşılar. Ağır yazılımlar (video düzenleme, 3D modelleme) kullanılacaksa 16GB önerilir.'},
      {q:'SSD mi HDD mi tercih edilmeli?', a:'SSD, HDD\'ye göre çok daha hızlı açılış ve dosya erişimi sağlar. Bütçe izin verdiği sürece SSD\'li bir model tercih edilmeli.'},
    ],
    subLinks: ['oyun-laptoplari','is-laptoplari','ogrenci-laptoplari','ultrabook','macbook'],
    clusterLinks: ['ram-ne-kadar-yeterli', 'ssd-vs-hdd-farki', 'islemci-nesli-nasil-anlasilir'],
  },
  {
    slug: 'kulaklik-nasil-secilir',
    cat: 'Kulaklık', mainSlug: 'kulaklik',
    title: 'Kulaklık Nasıl Seçilir? ANC, TWS ve Pil Ömrü Rehberi',
    tldr: 'Kulaklık seçerken kullanım ortamına göre ANC (aktif gürültü engelleme) ihtiyacı, günlük taşınabilirlik için TWS (tam kablosuz) formu ve toplam pil ömrü (kulaklık + kutu) öncelikli kriterler olmalı.',
    body: [
      'Aktif Gürültü Engelleme (ANC), uçak/toplu taşıma gibi gürültülü ortamlarda sık kullananlar için değerli bir özellik; sessiz ev/ofis ortamında çalışanlar için ise ekstra maliyeti karşılamayabilir.',
      'TWS (tam kablosuz) kulaklıklar günlük taşınabilirlikte avantajlı ama pil ömrü kablolu/kulak üstü modellere göre sınırlı. Toplam pil ömrünü değerlendirirken sadece kulaklığın kendi pilini değil, şarj kutusuyla birlikte toplam kullanım süresini dikkate almak gerekir.',
      'Spor sırasında kullanım planlanıyorsa su/ter direnci (IPX derecesi) önemli bir filtre. IPX4 hafif ter direnci sağlarken, IPX7 gibi daha yüksek dereceler yağmur veya yoğun terlemeye karşı daha güvenli.',
      'Ses kalitesi sübjektif olsa da, sürücü (driver) boyutu ve desteklenen codec\'ler (aptX, LDAC gibi) genel bir fikir verir. Yüksek çözünürlüklü müzik dinlemeyi önemseyen kullanıcılar bu codec desteklerine bakmalı.',
      'Mikrofon kalitesi, sık sesli/görüntülü görüşme yapanlar için gözden kaçırılmamalı — bazı modeller müzik kalitesinde güçlüyken görüşme netliğinde zayıf kalabiliyor.',
    ],
    table: [
      {k:'Gürültülü ortam kullanıcısı', v:'ANC\'li model öncelikli'},
      {k:'Günlük taşınabilirlik', v:'TWS (tam kablosuz) form'},
      {k:'Spor kullanımı', v:'IPX4+ ter/su direnci'},
      {k:'Toplam pil ömrü', v:'Kulaklık + kutu birlikte değerlendirilmeli'},
    ],
    faq: [
      {q:'ANC kulaklık her ortamda gerekli mi?', a:'Hayır — ANC özellikle gürültülü ortamlarda (uçak, toplu taşıma) değer katıyor. Sessiz ortamda çalışan kullanıcılar için ekstra maliyeti gerekmeyebilir.'},
      {q:'TWS kulaklıkların pil ömrü yeterli mi?', a:'Kulaklığın kendisi genelde 4-8 saat çalışıyor, ama şarj kutusuyla toplam kullanım süresi 20-30 saate çıkabiliyor. Satın almadan önce toplam süreye bakmak gerekiyor.'},
      {q:'Spor için hangi su direnci yeterli?', a:'Hafif terleme için IPX4 yeterli olurken, yoğun antrenman veya yağmurlu koşu için IPX7 gibi daha yüksek bir derece tercih edilmeli.'},
    ],
    subLinks: ['tws','anc-kulaklik','bluetooth-kulaklik'],
    clusterLinks: ['anc-nedir', 'bluetooth-codec-nedir'],
  },
  {
    slug: 'kamera-nasil-secilir',
    cat: 'Kamera', mainSlug: 'kamera',
    title: 'Fotoğraf Makinesi Nasıl Seçilir? Aynasız, DSLR ve Aksiyon Kamera Farkı',
    tldr: 'Kamera seçimi kullanım amacına göre değişir: taşınabilirlik önceliğiyse aynasız (mirrorless), optik vizör ve pil ömrü önemliyse DSLR, sportif/su altı çekim için aksiyon kamera daha uygun.',
    body: [
      'Aynasız (mirrorless) kameralar, DSLR\'lere göre daha kompakt ve hafif gövdeleriyle günlük taşınabilirlikte avantajlı. Elektronik vizörleri sayesinde çekim öncesi pozlama önizlemesi de yapılabiliyor.',
      'DSLR\'ler optik vizör kullanır — bu, gecikmesiz ve pil tüketmeyen bir görüntüleme deneyimi sunar. Ayrıca genelde daha uzun pil ömrüne ve geniş lens seçeneklerine sahipler, ancak gövdeleri daha ağır.',
      'Vlog ve sosyal medya içeriği üretenler için döner ekran, iyi bir mikrofon girişi ve otomatik odaklama hızı, sensör çözünürlüğünden daha belirleyici olabilir.',
      'Aksiyon kameralar (GoPro tarzı) su altı, spor ve sarsıntılı çekimler için tasarlanmıştır — geniş açı lens ve güçlü görüntü sabitleme sunar, ama düşük ışıkta ve optik zoom konusunda geleneksel kameralara göre sınırlıdır.',
      'Sensör boyutu (APS-C, Full Frame gibi) düşük ışık performansını ve arka plan bulanıklaştırma (bokeh) kalitesini doğrudan etkiler — büyük sensör genelde daha iyi sonuç verir ama gövde/lens maliyetini de artırır.',
    ],
    table: [
      {k:'Taşınabilirlik önceliği', v:'Aynasız (mirrorless)'},
      {k:'Uzun pil ömrü, optik vizör', v:'DSLR'},
      {k:'Vlog/içerik üretimi', v:'Döner ekran + hızlı otomatik odak'},
      {k:'Spor/su altı çekim', v:'Aksiyon kamera'},
    ],
    faq: [
      {q:'Aynasız mı DSLR mi daha iyi?', a:'Kesin bir kazanan yok — aynasız daha kompakt ve modern otomatik odaklama sunarken, DSLR daha uzun pil ömrü ve optik vizör avantajına sahip. Seçim kullanım önceliğine bağlı.'},
      {q:'Vlog çekimi için hangi özellikler önemli?', a:'Döner/çevrilebilir ekran, kaliteli dahili mikrofon veya mikrofon girişi, ve hızlı otomatik yüz/göz takibi vlog içerik üreticileri için sensör çözünürlüğünden daha kritik olabilir.'},
      {q:'Aksiyon kamera hangi durumlarda tercih edilmeli?', a:'Su altı, spor, sarsıntılı veya ekstrem koşullardaki çekimler için aksiyon kameralar güçlü görüntü sabitleme ve dayanıklılık sunar.'},
    ],
    subLinks: ['aynasiz-kamera','dslr','aksiyon-kamerasi','vlog-kamerasi'],
    clusterLinks: ['kamera-sensor-boyutu-ne-ise-yarar', 'iso-nedir-fotografcilik', 'ois-nedir', 'eis-nedir'],
  },
  {
    slug: 'akilli-saat-nasil-secilir',
    cat: 'Akıllı Saat', mainSlug: 'akilli-saat',
    title: 'Akıllı Saat Nasıl Seçilir? İşletim Sistemi ve Kullanım Amacına Göre',
    tldr: 'Akıllı saat seçimi öncelikle telefon işletim sistemine (iPhone kullanıcısı için Apple Watch, Android için geniş marka seçeneği) ve spor takibi ihtiyacına göre yapılmalı.',
    body: [
      'İşletim sistemi uyumu ilk filtre olmalı — Apple Watch sadece iPhone ile tam uyumlu çalışıyor, Android kullanıcıları için Wear OS veya marka-özel yazılımlı modeller daha geniş bir seçenek sunuyor.',
      'Spor takibi önceliğiyse GPS hassasiyeti, kalp atış hızı sensör doğruluğu ve desteklenen spor modu sayısına bakmak gerekiyor. Yarı-profesyonel koşucular için özel spor saatleri (Garmin, Polar gibi), genel amaçlı akıllı saatlere göre daha detaylı veri sunuyor.',
      'Pil ömrü, ekranın her zaman açık (always-on) olup olmamasına göre büyük fark gösteriyor — always-on ekranlı modeller genelde 1-2 gün, bu özelliği kapatılabilen veya e-kağıt benzeri ekranlı modeller ise günlerce dayanabiliyor.',
      'Çocuklar için tasarlanmış akıllı saatler, konum takibi ve ebeveyn kontrolü gibi güvenlik odaklı özelliklere sahip — genel tüketici saatlerinden farklı bir kategori olarak değerlendirilmeli.',
      'Ekran teknolojisi (AMOLED vs LCD) hem görsel kalite hem pil tüketimini etkiliyor — parlak AMOLED ekranlar daha canlı görünse de LCD\'ye göre daha fazla enerji tüketiyor.',
    ],
    table: [
      {k:'iPhone kullanıcısı', v:'Apple Watch (tam uyum)'},
      {k:'Android kullanıcısı', v:'Wear OS veya marka-özel yazılım'},
      {k:'Spor/koşu odaklı', v:'GPS hassasiyeti öncelikli (Garmin/Polar sınıfı)'},
      {k:'Pil ömrü önceliği', v:'Always-on kapatılabilir modeller'},
      {k:'Çocuk kullanımı', v:'Konum takibi + ebeveyn kontrolü olan modeller'},
    ],
    faq: [
      {q:'Apple Watch Android telefonla çalışır mı?', a:'Hayır, Apple Watch tam işlevsellik için iPhone gerektirir. Android kullanıcılarının Wear OS tabanlı veya marka-özel yazılımlı modellere yönelmesi gerekir.'},
      {q:'Akıllı saat pil ömrü neden bu kadar değişken?', a:'Always-on (her zaman açık) ekran özelliği pil tüketimini belirgin şekilde artırıyor. Bu özellik kapatıldığında veya olmayan modellerde pil ömrü günlerce uzayabiliyor.'},
      {q:'Koşu için hangi akıllı saat özellikleri önemli?', a:'Hassas GPS, doğru kalp atış hızı ölçümü ve detaylı koşu metrikleri (tempo, adım vuruş sıklığı gibi) sunan spor odaklı modeller (Garmin, Polar) tercih edilmeli.'},
    ],
    subLinks: ['android-saat','apple-watch','spor-saatleri','cocuk-saatleri'],
    clusterLinks: ['akilli-saatte-gps-ne-ise-yarar', 'spo2-olcumu-nedir'],
  },
  {
    slug: 'tablet-nasil-secilir',
    cat: 'Tablet', mainSlug: 'tablet',
    title: 'Tablet Nasıl Seçilir? Ekran Boyutu ve Kullanım Amacına Göre',
    tldr: 'Tablet seçimi öncelikle kullanım amacına göre yapılmalı: medya tüketimi için orta boy/uygun fiyatlı modeller, üretkenlik (not alma, çizim) için kalem desteği olan büyük ekranlı modeller tercih edilmeli.',
    body: [
      'Sadece video izleme ve web gezinme için 10 inç civarı, orta seviye donanımlı bir tablet genelde yeterli — bu kullanım için en pahalı modele yatırım yapmaya gerek yok.',
      'Not alma veya dijital çizim planlanıyorsa, aktif kalem (stylus) desteği olan bir model şart. Kalemin basınç hassasiyeti seviyesi, çizim kalitesini doğrudan etkiliyor.',
      'Üretkenlik (klavye ile yazı yazma, çoklu pencere kullanımı) için büyük ekran (11 inç üzeri) ve klavye aksesuar desteği olan modeller daha rahat bir deneyim sunuyor.',
      'Depolama kapasitesi genişletilebilir mi (microSD desteği) yoksa sabit mi, bu da önemli bir karar noktası — özellikle çok sayıda video/uygulama saklayacak kullanıcılar için genişletilebilir depolama avantaj sağlıyor.',
      'Ekran çözünürlüğü ve panel tipi (IPS vs AMOLED), özellikle görsel içerik tüketimi veya düzenlemesi yapan kullanıcılar için önemli — AMOLED daha canlı renkler ve derin siyahlar sunuyor.',
    ],
    table: [
      {k:'Medya tüketimi', v:'10" civarı, orta seviye donanım yeterli'},
      {k:'Not alma/çizim', v:'Aktif kalem desteği şart'},
      {k:'Üretkenlik', v:'11"+ ekran + klavye aksesuar desteği'},
      {k:'Çok içerik saklama', v:'microSD genişletme desteği aranmalı'},
    ],
    faq: [
      {q:'Tablette kalem desteği neden önemli?', a:'Not alma veya dijital çizim yapacaksanız, basınç hassasiyetine sahip aktif kalem desteği çizim/yazı kalitesini doğrudan etkiliyor. Pasif kalemler bu hassasiyeti sunmuyor.'},
      {q:'Tablet klavyeyle laptop yerine geçebilir mi?', a:'Hafif ofis işleri ve yazışmalar için klavye aksesuarlı bir tablet yeterli olabilir, ama ağır yazılımlar veya çoklu program kullanımı gerektiren işler için geleneksel dizüstü daha uygun kalıyor.'},
    ],
    subLinks: [],
  },
  {
    slug: 'televizyon-nasil-secilir',
    cat: 'Televizyon', mainSlug: 'televizyon',
    title: 'Televizyon Nasıl Seçilir? Panel Tipi ve Ekran Boyutu Rehberi',
    tldr: 'TV seçerken oda büyüklüğüne göre ekran boyutu, görüntü kalitesi için panel tipi (OLED/QLED/LED) ve ses sistemi ihtiyacı (dahili hoparlör mü ayrı soundbar mı) öncelikli kriterler olmalı.',
    body: [
      'Ekran boyutu, izleme mesafesine göre belirlenmeli — çok küçük bir odada aşırı büyük bir TV, görüntünün net algılanmasını zorlaştırabilir. Genel kural olarak izleme mesafesinin (cm) ekran boyutuna (inç) oranı 1.5-2 katı civarında olması öneriliyor.',
      'OLED panel, her pikselin kendi ışığını üretmesi sayesinde en derin siyahları ve en yüksek kontrastı sunuyor, ama parlak odalarda QLED\'e göre biraz daha sönük kalabiliyor. QLED ise daha yüksek parlaklığa ulaşabiliyor, özellikle güneş ışığı alan odalarda avantajlı.',
      'Yenileme hızı (Hz), özellikle oyun konsolu kullananlar için önemli — 120Hz destekli bir panel, hızlı hareket eden sahnelerde daha akıcı bir görüntü sunuyor.',
      'Dahili ses sistemi çoğu TV\'de sınırlı kalıyor; sinema kalitesinde ses deneyimi isteyenler için ayrı bir soundbar veya ev sinema sistemi neredeyse her zaman TV\'nin kendi hoparlörlerinden daha iyi sonuç veriyor.',
      'Akıllı TV yazılımı (WebOS, Tizen, Google TV gibi) günlük kullanım deneyimini doğrudan etkiliyor — uygulama desteği, arayüz hızı ve güncelleme sıklığı markadan markaya belirgin şekilde farklılaşabiliyor.',
    ],
    table: [
      {k:'Ekran boyutu kuralı', v:'İzleme mesafesi (cm) ÷ 1.5-2 ≈ ekran boyutu (inç)'},
      {k:'En yüksek kontrast', v:'OLED panel'},
      {k:'Parlak oda kullanımı', v:'QLED daha avantajlı'},
      {k:'Oyun konsolu kullanıcısı', v:'120Hz+ yenileme hızı önemli'},
      {k:'Kaliteli ses', v:'Ayrı soundbar neredeyse her zaman daha iyi'},
    ],
    faq: [
      {q:'OLED mi QLED mi daha iyi?', a:'OLED daha derin siyahlar ve yüksek kontrast sunar, karanlık oda kullanımında avantajlıdır. QLED ise daha yüksek parlaklığa ulaşabildiği için güneş ışığı alan parlak odalarda daha iyi performans gösterir.'},
      {q:'TV ekran boyutu nasıl hesaplanır?', a:'Genel kural, izleme mesafesinin (cm) ekran boyutuna (inç) oranının 1.5-2 katı civarında olmasıdır. Örneğin 3 metre mesafeden izleniyorsa 55-65 inç civarı bir ekran uygun olur.'},
      {q:'TV\'nin dahili hoparlörü yeterli mi?', a:'Çoğu TV\'nin dahili ses sistemi sınırlıdır. Sinema kalitesinde ses deneyimi için ayrı bir soundbar veya ev sinema sistemi neredeyse her zaman daha iyi sonuç verir.'},
    ],
    subLinks: [],
    clusterLinks: ['amoled-vs-lcd-fark'],
  },
];

function generateTopicalGuides({ rootDir }){
  const outDir = path.join(rootDir, 'rehber');
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const pages = [];
  GUIDES.forEach(g => {
    const bodyParas = g.body.map(p => `  <p style="margin:0 0 16px;line-height:1.7;font-size:14px;">${esc(p)}</p>`).join('\n');
    const tableHtml = g.table.length ? `<h2 style="font-size:15px;margin:24px 0 10px;">Öne Çıkan Kriterler</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13.5px;margin-bottom:20px;">
    <tbody>
${g.table.map(row => `      <tr style="border-bottom:1px solid var(--line);"><td style="padding:8px 10px 8px 0;color:var(--ink-soft);">${esc(row.k)}</td><td style="padding:8px 0;font-weight:600;">${esc(row.v)}</td></tr>`).join('\n')}
    </tbody>
  </table>` : '';
    const faqHtml = `<h2 style="font-size:15px;margin:24px 0 10px;">Sıkça Sorulan Sorular</h2>
${g.faq.map(f => `  <div style="margin-bottom:14px;">
    <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${esc(f.q)}</div>
    <div style="font-size:13.5px;color:var(--ink-soft);line-height:1.6;">${esc(f.a)}</div>
  </div>`).join('\n')}`;
    const subLinksHtml = g.subLinks
      .filter(s => fs.existsSync(path.join(rootDir, 'kategori', `${s}.html`))) // sadece GERÇEKTEN üretilmiş alt kategori sayfalarına link ver (kırık link olmasın)
      .map(s => `<a class="chip-filter" href="../kategori/${s}.html">${esc(s.split('-').join(' '))}</a>`)
      .join('\n    ');

    // Destek makaleleri (cluster content) — slug listesi elle doğrulanmış
    // (generate-cluster-articles.js ile birebir eşleşiyor), dosya varlık
    // kontrolü YAPMIYORUZ çünkü iki generator birbirine link veriyor ve
    // hangisi önce çalışırsa diğerinin çıktısı henüz diskte olmayabilir —
    // ikisi de aynı build içinde tamamlanınca sonuç tutarlı olur.
    const clusterLinksHtml = (g.clusterLinks || [])
      .map(s => `<a class="chip-filter" href="${s}.html">${esc(s.split('-').join(' '))}</a>`)
      .join('\n    ');

    const faqSchema = { "@context":"https://schema.org", "@type":"FAQPage", "mainEntity": g.faq.map(f => ({ "@type":"Question", "name":f.q, "acceptedAnswer": { "@type":"Answer", "text":f.a } })) };

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(g.title)} | TeknoVersus</title>
<meta name="description" content="${esc(g.tldr)}" />
<link rel="canonical" href="https://teknoversus.com.tr/rehber/${g.slug}.html" />
<link rel="stylesheet" href="../styles.css" />
<script type="application/ld+json">
${JSON.stringify(faqSchema, null, 2)}
</script>
<link rel="icon" type="image/png" href="../assets/logo.png" />
${GA_BLOCK}
</head>
<body>

<header class="site">
  <div class="wrap nav">
    <div class="brand"><a href="../index.html"><picture><source srcset="../assets/logo-header.webp" type="image/webp"/><img src="../assets/logo-header.png" class="brand-logo" alt="TeknoVersus logo" width="144" height="60" decoding="async"/></picture><span class="brand-text"><span class="tekno">TEKNO</span><span class="versus">VERSUS</span></span></a></div>
${navHTML('../')}
    <button class="burger" id="burgerBtn">☰</button>
  </div>
</header>

<main class="detail-wrap" style="max-width:760px;">
  <div class="breadcrumb">
    <a href="../index.html">Anasayfa</a> / <a href="../${g.mainSlug}.html">${esc(g.cat)}</a> / Rehber
  </div>
  <h1 class="product-page-h1" style="margin:12px 0 18px;">${esc(g.title)}</h1>

  <div class="product-notice" style="background:#F0F7FF;border-color:#B8D4F0;margin-bottom:20px;">
    <strong>Kısa cevap:</strong> ${esc(g.tldr)}
  </div>

${bodyParas}

  ${tableHtml}

  ${faqHtml}

  <h2 style="font-size:15px;margin:24px 0 10px;">İlgili Bağlantılar</h2>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <a class="chip-filter" href="../${g.mainSlug}.html">${esc(g.cat)} Kataloğu</a>
    <a class="chip-filter" href="../karsilastirmalar.html">${esc(g.cat)} Karşılaştırmaları</a>
    ${subLinksHtml}
  </div>

  ${clusterLinksHtml ? `<h2 style="font-size:15px;margin:20px 0 10px;">Terimler ve Nasıl Yapılır Rehberleri</h2>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    ${clusterLinksHtml}
  </div>` : ''}
</main>

${footerHTML('../')}
<script>document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));</script>
</body>
</html>
`;
    fs.writeFileSync(path.join(outDir, `${g.slug}.html`), html);
    pages.push(`rehber/${g.slug}.html`);
  });

  console.log(`${pages.length} konu kümesi rehberi oluşturuldu -> rehber/`);

  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  if(fs.existsSync(sitemapPath)){
    let xml = fs.readFileSync(sitemapPath, 'utf8');
    GUIDES.forEach(g => {
      xml = xml.replace(new RegExp(`\\s*<url>\\s*<loc>[^<]*\\/rehber\\/${g.slug}\\.html<\\/loc>[\\s\\S]*?<\\/url>`), '');
    });
    const today = new Date().toISOString().slice(0,10);
    const entries = pages.map(p => `  <url>
    <loc>https://teknoversus.com.tr/${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');
    xml = xml.replace('</urlset>', `${entries}\n</urlset>`);
    fs.writeFileSync(sitemapPath, xml);
    console.log(`sitemap.xml güncellendi, +${pages.length} rehber URL'si eklendi.`);
  }

  return pages;
}

module.exports = { generateTopicalGuides };
