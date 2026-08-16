// ============================================================
// TeknoVersus — Faz 8: Konu kümesi destek makaleleri (cluster content).
// TOPICAL_AUTHORITY_RULES.md'nin "Pillar → Cluster" modelinin asıl
// istediği kısım: dar/spesifik teknik terim ve nasıl-yapılır makaleleri,
// ilgili pillar rehbere ve alt kategori sayfalarına bağlanır.
//
// Bu liste zamanla genişletilebilir — ilk sürüm 15 makale içerir.
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
  <div class="wrap" style="text-align:center;margin-bottom:10px;font-size:12.5px;">
    <a href="${root}hakkimizda.html" style="color:inherit;">Hakkımızda</a> · <a href="${root}gizlilik-politikasi.html" style="color:inherit;">Gizlilik Politikası</a>
  </div>
  TeknoVersus — gerçek ürünlerle çalışan karşılaştırma kataloğu.
</footer>`;
}

// Her makale: slug, başlık, pillar (bağlanacak "nasıl seçilir" rehberi),
// subLink (varsa alt kategori), tldr, body (paragraflar), faq
const ARTICLES = [
  {
    slug: 'ois-nedir', title: 'OIS Nedir? Optik Görüntü Sabitleyici Nasıl Çalışır',
    pillar: 'telefon-nasil-secilir', subLink: 'kamera-telefonlari',
    tldr: 'OIS (Optical Image Stabilization), kamera lensinin veya sensörünün fiziksel olarak hareket ederek el titremesini telafi ettiği donanımsal bir sabitleme teknolojisidir. Özellikle düşük ışıkta ve video çekiminde belirgin fark yaratır.',
    body: [
      'OIS, lens grubunun veya sensörün içine yerleştirilen küçük mıknatıslar ve jiroskoplar sayesinde çalışır. Telefon elinizde titrediğinde, sistem bu hareketi algılayıp lensi ters yönde hareket ettirerek görüntüyü sabit tutar.',
      'Bu, özellikle düşük ışıkta fark yaratır — daha uzun pozlama süreleri gerektiren gece çekimlerinde OIS olmadan bulanıklaşan kareler, OIS sayesinde net kalabilir. Video çekiminde de titreşimi belirgin şekilde azaltır.',
      'OIS, dijital/elektronik sabitleme (EIS) ile karıştırılmamalı — EIS yazılımsal bir çözüm, OIS ise fiziksel/donanımsal. İkisi birlikte kullanıldığında (bazı üst segment telefonlarda olduğu gibi) en iyi sonucu verir.',
      'Genellikle amiral gemisi ve üst-orta segment telefonlarda bulunur; bütçe telefonlarda maliyet nedeniyle çoğunlukla yer almaz.',
    ],
    faq: [
      { q: 'OIS hangi telefonlarda bulunur?', a: 'Genellikle amiral gemisi ve üst-orta segment telefonlarda bulunur. Bütçe telefonlarda maliyet nedeniyle nadiren yer alır.' },
      { q: 'OIS ve EIS aynı şey mi?', a: 'Hayır. OIS donanımsal (lens/sensör fiziksel olarak hareket eder), EIS ise yazılımsal bir sabitleme yöntemidir.' },
    ],
  },
  {
    slug: 'eis-nedir', title: "EIS Nedir? Elektronik Görüntü Sabitleme OIS'ten Farkı",
    pillar: 'telefon-nasil-secilir', subLink: 'kamera-telefonlari',
    tldr: 'EIS (Electronic Image Stabilization), görüntüyü yazılımsal olarak kırpıp hizalayarak titreşimi azaltan bir sabitleme yöntemidir. OIS\'e göre daha ucuz ama görüş açısını daraltabilir.',
    body: [
      'EIS, kamera donanımını fiziksel olarak hareket ettirmez — bunun yerine art arda gelen kareleri yazılımsal olarak analiz edip hizalayarak titreşimi azaltır. Bu işlem genellikle görüntünün kenarlarından bir miktar kırpma yapılmasını gerektirir.',
      'Bu kırpma nedeniyle EIS aktifken video çekim alanı (görüş açısı) hafifçe daralabilir. Buna karşın EIS, ek donanım maliyeti gerektirmediği için bütçe ve orta segment telefonlarda da yaygın olarak kullanılır.',
      'Video çekiminde EIS tek başına de faydalı olsa da, OIS ile birlikte kullanıldığında (hibrit sabitleme) sonuç belirgin şekilde daha iyi olur — birçok amiral gemisi telefon bu kombinasyonu kullanıyor.',
    ],
    faq: [
      { q: 'EIS video kalitesini düşürür mü?', a: 'EIS aktifken görüntünün kenarlarından kırpma yapılabilir, bu da görüş açısını hafifçe daraltır — ama genel görüntü kalitesini düşürmez.' },
      { q: 'EIS mi OIS mi daha iyi?', a: 'OIS donanımsal olduğu için genellikle daha etkilidir, ama ikisinin birlikte kullanıldığı hibrit sistemler en iyi sonucu verir.' },
    ],
  },
  {
    slug: 'telefonla-gece-cekimi-nasil-yapilir', title: 'Telefonla Gece Çekimi Nasıl Yapılır? 5 Pratik İpucu',
    pillar: 'telefon-nasil-secilir', subLink: 'kamera-telefonlari',
    tldr: 'Telefonla iyi bir gece çekimi için gece modu kullanmak, telefonu sabit tutmak, otomatik odaklamayı doğru noktaya kilitlemek ve gereksiz dijital zoomdan kaçınmak en büyük farkı yaratır.',
    body: [
      'Çoğu modern telefonun kamera uygulamasında bulunan "Gece Modu", düşük ışıkta birden fazla kareyi birleştirip gürültüyü azaltarak daha net ve aydınlık sonuçlar üretir. Bu modu manuel olarak açmak (bazı telefonlarda otomatik devreye girer) genellikle en büyük farkı yaratır.',
      'Gece çekiminde telefonun en ufak titreşimi bile bulanıklığa yol açabilir — mümkünse telefonu bir yüzeye yaslamak veya iki elle sıkıca tutup nefesini tutmak netliği belirgin şekilde artırır.',
      'Otomatik odaklamayı ana özneye dokunarak manuel kilitlemek, kameranın yanlış noktaya (örneğin arka plandaki bir ışık kaynağına) odaklanmasını önler.',
      'Dijital zoom, düşük ışıkta görüntü kalitesini ciddi şekilde düşürür — mümkünse fiziksel olarak özneye yaklaşmak, zoom yapmaktan daha iyi sonuç verir.',
    ],
    faq: [
      { q: 'Gece modu her telefonda var mı?', a: 'Orta ve üst segment telefonların çoğunda bulunur; çok bütçe modellerde bulunmayabilir veya daha sınırlı çalışabilir.' },
      { q: 'Gece çekiminde zoom kullanmalı mıyım?', a: 'Mümkünse hayır — dijital zoom düşük ışıkta görüntü kalitesini belirgin şekilde düşürür, fiziksel olarak yaklaşmak daha iyi sonuç verir.' },
    ],
  },
  {
    slug: 'ekran-yenileme-hizi-hz-nedir',
    sources: [{t:'VESA (ekran standartları kuruluşu)', u:'https://www.vesa.org/'}], title: 'Ekran Yenileme Hızı (Hz) Nedir? 60Hz mi 120Hz mi?',
    pillar: 'telefon-nasil-secilir', subLink: null,
    tldr: 'Yenileme hızı, ekranın saniyede kaç kez görüntüyü tazelediğini gösterir. 120Hz bir ekran, 60Hz\'e göre kaydırma ve oyunlarda gözle görülür şekilde daha akıcıdır, ama pil tüketimini artırır.',
    body: [
      'Yenileme hızı Hz (hertz) birimiyle ölçülür ve ekranın saniyede kaç kez yenilendiğini gösterir. 60Hz bir ekran saniyede 60 kez, 120Hz bir ekran ise 120 kez görüntüyü tazeler.',
      'Bu fark en çok kaydırma (scroll) hareketlerinde ve hızlı hareket içeren oyunlarda hissediliyor — 120Hz bir ekranda menüler ve sosyal medya akışı belirgin şekilde daha akıcı görünür.',
      'Yüksek yenileme hızının bir bedeli var: daha fazla pil tüketimi. Bu yüzden birçok telefon, statik içerik izlerken (video, e-kitap gibi) otomatik olarak yenileme hızını düşüren adaptif/değişken yenileme hızı teknolojisi kullanıyor.',
      '90Hz ve 120Hz günümüzde orta-üst segment telefonlarda standart hale geldi; en üst segment bazı modeller 144Hz\'e kadar çıkabiliyor.',
    ],
    table: [
      {k:'60Hz', v:'Standart, en düşük pil tüketimi'},
      {k:'90Hz', v:'Belirgin akıcılık artışı, dengeli pil tüketimi'},
      {k:'120Hz', v:'En akıcı deneyim, orta-üst segment standardı'},
      {k:'144Hz', v:'Oyuncu telefonlarında görülür, en yüksek pil tüketimi'},
    ],
    faq: [
      { q: '120Hz ekran pil ömrünü ne kadar etkiler?', a: 'Sürekli 120Hz\'de çalışan bir ekran, 60Hz\'e göre belirgin şekilde daha fazla pil tüketir. Adaptif yenileme hızı olan telefonlarda bu fark azalır.' },
      { q: '60Hz ile 120Hz arasındaki fark her zaman fark edilir mi?', a: 'Kaydırma ve oyunlarda fark net şekilde hissedilir; sabit bir fotoğrafa bakarken pratikte bir fark yoktur.' },
    ],
  },
  {
    slug: 'ip-koruma-sinifi-nedir',
    sources: [{t:'IEC 60529 standardı (IP koruma kodları)', u:'https://www.iec.ch/homepage'}], title: 'IP Koruma Sınıfı Nedir? IP54, IP67, IP68 Farkı',
    pillar: 'telefon-nasil-secilir', subLink: null,
    tldr: 'IP koruma sınıfı, bir cihazın toza ve suya karşı ne kadar dayanıklı olduğunu gösteren uluslararası bir standarttır. İlk rakam toz, ikinci rakam su direncini ifade eder — rakam ne kadar yüksekse koruma o kadar güçlüdür.',
    body: [
      'IP (Ingress Protection) kodundaki ilk rakam toz koruması seviyesini (0-6 arası, 6 en yüksek), ikinci rakam ise su koruması seviyesini (0-9 arası) gösterir. Örneğin IP68, hem en yüksek toz korumasına hem de yüksek su korumasına sahip demektir.',
      'IP54 gibi bir derece, sınırlı toz girişine ve her yönden gelen su sıçramalarına dayanıklı olduğunu gösterir — ama suya daldırmaya karşı garanti vermez. IP67 ise 1 metre derinliğe kadar 30 dakika suya dayanıklılık anlamına gelir.',
      'IP68, üreticiye göre değişen belirli bir derinlik ve süre için (genellikle 1,5-2 metre, 30 dakika) suya dayanıklılığı ifade eder. Bu, "su geçirmez" değil "su direnci" anlamına gelir — tuzlu su, basınçlı su veya uzun süreli daldırma garantili değildir.',
      'IP derecesi olmayan bir cihaz, hiç test edilmemiş demektir — bu mutlaka suya dayanıksız olduğu anlamına gelmez, ama üretici bir garanti vermiyor demektir.',
    ],
    table: [
      {k:'IP54', v:'Sınırlı toz koruması, su sıçramalarına dayanıklı'},
      {k:'IP67', v:'Tam toz koruması, 1m derinliğe 30dk dayanıklı'},
      {k:'IP68', v:'Tam toz koruması, 1,5-2m derinliğe 30dk dayanıklı (üreticiye göre değişir)'},
      {k:'IP69', v:'Yüksek basınçlı/sıcak su püskürtmesine dayanıklı (en üst segmentte görülür)'},
    ],
    faq: [
      { q: 'IP68 telefonu havuza sokabilir miyim?', a: 'Üreticinin belirttiği derinlik ve süre sınırları içinde genellikle evet, ama tuzlu su, klorlu su veya uzun süreli daldırma garantili değildir ve garanti dışı kalabilir.' },
      { q: 'IP derecesi olmayan telefon suya dayanıksız mı demek?', a: 'Mutlaka değil — üretici test yaptırıp sertifika almamış olabilir. Ama garantili bir koruma olmadığı için ihtiyatlı davranmak gerekir.' },
    ],
  },
  {
    slug: 'ram-ne-kadar-yeterli', title: 'Telefonda ve Bilgisayarda RAM Ne Kadar Yeterli?',
    pillar: 'telefon-nasil-secilir', subLink: null,
    tldr: 'Telefonda günlük kullanım için 6-8GB, ağır kullanım için 12GB+ RAM yeterli. Dizüstü bilgisayarda ofis işi için 8GB, çoklu görev ve ağır yazılımlar için 16GB+ öneriliyor.',
    body: [
      'RAM (Random Access Memory), aktif olarak kullanılan uygulamaların geçici olarak tutulduğu bellektir. Ne kadar çok RAM varsa, o kadar çok uygulama aynı anda arka planda açık kalabilir ve uygulamalar arası geçiş o kadar hızlı olur.',
      'Telefonda günlük sosyal medya, mesajlaşma ve web gezinme için 6-8GB RAM günümüzde yeterli. Ağır oyun oynayan veya çok sayıda uygulamayı sürekli açık tutan kullanıcılar için 12GB ve üzeri daha rahat bir deneyim sunuyor.',
      'Dizüstü bilgisayarda ofis yazılımları ve web tarayıcısı için 8GB genellikle yeterli olsa da, çoklu sekme açık tarayıcı kullanımı, video düzenleme veya sanal makine gibi ağır işler için 16GB veya üzeri önerilir.',
      'Fazla RAM, mevcut olmayan bir ihtiyacı karşılamaz — kullanım alışkanlığınıza göre doğru miktarı seçmek, gereksiz yere fazla ödemekten daha mantıklı.',
    ],
    faq: [
      { q: 'Telefonda 4GB RAM yeterli mi?', a: 'Çok temel kullanım (arama, mesajlaşma, hafif web gezinme) için yeterli olabilir, ama günümüz uygulamaları için 6-8GB daha rahat bir deneyim sunar.' },
      { q: 'Dizüstü bilgisayarda kaç GB RAM önerilir?', a: 'Ofis işi için 8GB yeterlidir; video düzenleme, çoklu sekme/uygulama kullanımı veya oyun için 16GB ve üzeri önerilir.' },
    ],
  },
  {
    slug: 'ssd-vs-hdd-farki',
    sources: [{t:'JEDEC katı hal sürücü standartları', u:'https://www.jedec.org/'}], title: 'SSD mi HDD mi? Aradaki Fark ve Hangisini Seçmelisin',
    pillar: 'dizustu-bilgisayar-nasil-secilir', subLink: null,
    tldr: 'SSD, hareketli parçası olmayan flash bellek teknolojisiyle HDD\'ye göre çok daha hızlı açılış ve dosya erişimi sağlar. Bütçe izin verdiği sürece SSD\'li bir model tercih edilmeli.',
    body: [
      'HDD (sabit disk), veri okuma/yazma için dönen manyetik plakalar kullanır — bu mekanik yapı, SSD\'ye göre belirgin şekilde daha yavaştır ve düşme/darbe gibi fiziksel etkilere karşı daha hassastır.',
      'SSD (katı hal sürücü) ise hareketli parça içermez, verileri flash bellek çiplerinde saklar. Bu sayede işletim sistemi açılışı, uygulama başlatma ve dosya kopyalama SSD\'de çok daha hızlı gerçekleşir — bazı durumlarda 5-10 kat fark yaratabilir.',
      'Fiyat tarafında HDD, aynı depolama kapasitesi için genellikle daha ucuzdur — bu yüzden çok büyük depolama alanı (2TB+) gerektiren ve bütçesi kısıtlı kullanıcılar hâlâ HDD tercih edebiliyor.',
      'Günümüzde çoğu yeni dizüstü bilgisayar SSD ile geliyor; SSD+HDD kombinasyonu sunan modeller de var (hızlı SSD\'de işletim sistemi, büyük HDD\'de dosya depolama gibi).',
    ],
    faq: [
      { q: 'SSD neden HDD\'den daha hızlı?', a: 'SSD hareketli parça içermediği için veri erişimi anlık gerçekleşir; HDD ise dönen plakalar ve hareketli bir okuma kafası kullandığı için mekanik gecikme yaşar.' },
      { q: 'HDD hâlâ tercih edilir mi?', a: 'Çok büyük depolama alanı gerektiren ve bütçesi sınırlı kullanıcılar için HDD, aynı kapasitede SSD\'ye göre daha ucuz olduğu için tercih edilebiliyor.' },
    ],
  },
  {
    slug: 'islemci-nesli-nasil-anlasilir',
    sources: [{t:'Intel işlemci numaralandırma', u:'https://www.intel.com/'}, {t:'AMD Ryzen mobil işlemciler', u:'https://www.amd.com/'}], title: 'İşlemci Nesli Nasıl Anlaşılır? Intel/AMD Model Numaraları',
    pillar: 'dizustu-bilgisayar-nasil-secilir', subLink: 'is-laptoplari',
    tldr: "Intel işlemci model numarasındaki ilk 1-2 rakam nesli gösterir (örn. Core i5-1235U'da '12' = 12. nesil). AMD'de de benzer şekilde ilk rakamlar nesli belirtir. Yeni nesil, genellikle daha iyi performans/güç verimliliği sunar.",
    body: [
      "Intel işlemcilerinde model numarası formatı genellikle şöyledir: Core i5-1235U. Buradaki '12', işlemcinin 12. nesil olduğunu gösterir; '35' spesifik modeli, sondaki harf (U, H, P gibi) ise güç/performans sınıfını belirtir.",
      "Harf kodları önemli: 'U' düşük güç tüketimli (ince/hafif dizüstüler), 'H' yüksek performanslı (oyun/iş istasyonu), 'P' ise ikisi arasında dengeli bir sınıfı ifade eder.",
      "AMD Ryzen işlemcilerde de benzer bir mantık var: Ryzen 7 7745HX gibi bir numarada '7' nesli, '45' modeli, 'HX' ise yüksek performans sınıfını gösterir.",
      'Yeni nesil bir işlemci, genellikle aynı çekirdek sayısında daha iyi performans ve daha düşük güç tüketimi sunar — ama eski nesil yüksek segment bir işlemci, yeni nesil düşük segment bir işlemciden hâlâ daha güçlü olabilir. Sadece nesle değil, harf koduna ve modele de bakmak gerekir.',
    ],
    faq: [
      { q: "Intel Core i5-1235U'daki '12' ne anlama gelir?", a: "İşlemcinin 12. nesil olduğunu gösterir. Sondaki 'U' harfi ise düşük güç tüketimli sınıfa ait olduğunu belirtir." },
      { q: 'Yeni nesil işlemci her zaman daha mı hızlıdır?', a: "Genellikle evet, ama harf kodu da önemli — eski nesil bir 'H' serisi işlemci, yeni nesil bir 'U' serisi işlemciden performans olarak üstün olabilir." },
    ],
  },
  {
    slug: 'anc-nedir',
    sources: [{t:'Bluetooth SIG resmi sitesi', u:'https://www.bluetooth.com/'}], title: 'ANC Nedir? Aktif Gürültü Engelleme Nasıl Çalışır',
    pillar: 'kulaklik-nasil-secilir', subLink: 'anc-kulaklik',
    tldr: 'ANC (Active Noise Cancellation), kulaklığın mikrofonla dış ortam sesini algılayıp bunun tam tersi (ters fazlı) bir ses dalgası üreterek gürültüyü sessizleştirdiği bir teknolojidir. Özellikle uçak/toplu taşıma gibi sabit, düşük frekanslı gürültülerde etkilidir.',
    body: [
      'ANC, kulaklığın dışında (bazen içinde de) bulunan mikrofonlar aracılığıyla ortam sesini sürekli dinler. Bu ses analiz edilip, tam tersi fazda (ters polarite) bir ses dalgası üretilerek kullanıcının kulağına iletilir — iki dalga birbirini götürerek gürültüyü sessizleştirir.',
      'ANC, motor uğultusu, klima sesi gibi sabit ve düşük frekanslı gürültülerde en etkili sonucu verir. Ani ve yüksek frekanslı sesleri (konuşma, kapı çarpması gibi) tamamen engellemez, sadece azaltır.',
      'ANC aktifken pil tüketimi artar çünkü sürekli mikrofon dinleme ve ters sinyal üretme işlemi elektrik gerektirir — bu yüzden ANC\'li kulaklıkların pil ömrü, ANC kapalıyken genellikle daha uzundur.',
      'Bazı kulaklıklar "Ambient/Transparency" modu da sunar — bu, ANC\'nin tersi, dış sesleri kasıtlı olarak içeri alan bir moddur, özellikle güvenlik gerektiren durumlarda (yürürken, toplu taşımada anons dinlerken) kullanışlıdır.',
    ],
    faq: [
      { q: 'ANC her gürültüyü engeller mi?', a: "Hayır — en çok sabit, düşük frekanslı gürültülerde (motor sesi gibi) etkilidir. Ani/yüksek frekanslı sesleri tam engellemez, sadece azaltır." },
      { q: 'ANC pil ömrünü etkiler mi?', a: 'Evet, ANC aktifken sürekli mikrofon dinleme ve sinyal işleme gerektiği için pil tüketimi artar.' },
    ],
  },
  {
    slug: 'bluetooth-codec-nedir',
    sources: [{t:'Bluetooth SIG resmi sitesi', u:'https://www.bluetooth.com/'}], title: 'Bluetooth Codec Nedir? SBC, AAC, aptX, LDAC Farkı',
    pillar: 'kulaklik-nasil-secilir', subLink: null,
    tldr: 'Bluetooth codec, ses verisinin kablosuz olarak nasıl sıkıştırılıp iletildiğini belirler. SBC en temel/düşük kaliteli, LDAC ve aptX HD ise en yüksek ses kalitesini sunan codec\'ler arasında.',
    body: [
      'Bluetooth ile ses gönderirken, ham ses verisi kablosuz bant genişliğine sığması için sıkıştırılır — bu sıkıştırma yöntemine "codec" denir. Kullanılan codec, ses kalitesini ve gecikmeyi doğrudan etkiler.',
      'SBC (Subband Coding), tüm Bluetooth cihazlarda zorunlu olarak bulunan temel codec\'tir — en düşük ses kalitesini sunar ama evrensel uyumluluğa sahiptir. AAC ise özellikle Apple cihazlarında iyi performans gösteren, SBC\'den daha kaliteli bir codec.',
      "aptX ve aptX HD (Qualcomm), Android cihazlarda yaygın olarak desteklenen, daha düşük gecikme ve daha yüksek ses kalitesi sunan codec'ler. LDAC (Sony) ise en yüksek bit hızını destekleyen, 'Hi-Res Audio' seviyesinde ses kalitesi sunabilen codec.",
      'Bir codec\'in kullanılabilmesi için hem kulaklığın hem de telefonun/cihazın o codec\'i desteklemesi gerekiyor — ikisi de desteklemiyorsa bağlantı otomatik olarak SBC\'ye düşer.',
    ],
    table: [
      {k:'SBC', v:'Temel, evrensel destek, en düşük kalite'},
      {k:'AAC', v:'Apple cihazlarda iyi performans'},
      {k:'aptX / aptX HD', v:'Android\'de yaygın, düşük gecikme'},
      {k:'LDAC', v:'En yüksek bit hızı, Hi-Res Audio seviyesi'},
    ],
    faq: [
      { q: 'LDAC her telefonda çalışır mı?', a: 'Hayır — LDAC başta Android olmak üzere sadece bu codec\'i destekleyen cihazlarda çalışır. Desteklenmiyorsa bağlantı otomatik olarak SBC veya AAC\'ye düşer.' },
      { q: 'En iyi ses kalitesi için hangi codec seçilmeli?', a: 'Hem kulaklık hem cihaz destekliyorsa LDAC veya aptX HD en yüksek kaliteyi sunar. Apple cihazlarda AAC genellikle en iyi seçenektir.' },
    ],
  },
  {
    slug: 'kamera-sensor-boyutu-ne-ise-yarar', title: 'Kamera Sensör Boyutu Ne İşe Yarar?',
    pillar: 'kamera-nasil-secilir', subLink: null,
    tldr: 'Sensör boyutu büyüdükçe her piksel daha fazla ışık toplayabilir — bu da düşük ışıkta daha az gürültü, daha geniş dinamik aralık ve daha iyi arka plan bulanıklaştırma (bokeh) anlamına gelir.',
    body: [
      'Kamera sensörü, lensten gelen ışığı elektrik sinyaline çeviren fiziksel bileşendir. Sensör ne kadar büyükse, aynı piksel sayısında her bir piksel o kadar fazla ışık toplayabilir.',
      'Bu doğrudan görüntü kalitesine yansır: büyük sensörlü kameralar düşük ışıkta daha az dijital gürültü (grain) üretir, daha geniş dinamik aralık (aydınlık ve karanlık alanları aynı anda daha iyi yakalama) sunar.',
      'Sensör boyutu, arka plan bulanıklaştırma (bokeh) etkisini de doğrudan etkiler — büyük sensörler, aynı diyafram değerinde daha belirgin bir alan derinliği etkisi yaratabilir.',
      'Telefon kameralarında sensör boyutu genellikle 1/2" ile 1" arasında değişirken, profesyonel kameralarda APS-C ve Full Frame gibi çok daha büyük sensörler kullanılıyor — bu da profesyonel kameraların düşük ışık performansının telefonlara göre neden üstün olduğunu açıklıyor.',
    ],
    faq: [
      { q: 'Sensör boyutu megapiksel sayısından daha mı önemli?', a: 'Görüntü kalitesi açısından çoğu zaman evet — büyük sensörlü düşük MP\'li bir kamera, küçük sensörlü yüksek MP\'li bir kameradan daha iyi sonuç verebilir.' },
      { q: 'Telefon kameraları neden profesyonel kameralar kadar iyi değil?', a: 'Telefonlardaki fiziksel alan kısıtlı olduğu için sensörler çok daha küçük — bu da düşük ışık performansı ve bokeh etkisinde profesyonel kameraların gerisinde kalmalarına neden oluyor.' },
    ],
  },
  {
    slug: 'iso-nedir-fotografcilik',
    sources: [{t:'ISO 12232 (fotoğraf duyarlılık standardı)', u:'https://www.iso.org/'}], title: 'ISO Nedir? Fotoğrafçılıkta ISO Değeri Nasıl Ayarlanır',
    pillar: 'kamera-nasil-secilir', subLink: null,
    tldr: 'ISO, kameranın ışığa duyarlılığını belirler. Düşük ISO (100-200) parlak ortamlarda temiz görüntü verir; yüksek ISO (1600+) karanlık ortamlarda daha aydınlık ama gürültülü görüntü üretir.',
    body: [
      'ISO, pozlama üçgeninin (diyafram, enstantane hızı, ISO) üçüncü parçasıdır ve kameranın ışığa ne kadar duyarlı olduğunu belirler. Düşük ISO değerleri daha az duyarlılık, yüksek ISO değerleri ise daha fazla duyarlılık anlamına gelir.',
      'Gündüz veya iyi aydınlatılmış ortamlarda ISO 100-200 gibi düşük değerler kullanmak, en temiz ve en az gürültülü (grain) görüntüyü verir.',
      'Karanlık ortamlarda ISO değerini yükseltmek (800, 1600, hatta 6400\'e kadar) daha aydınlık bir görüntü elde etmenizi sağlar, ama bu artışın bir bedeli var: yüksek ISO, görüntüde belirgin dijital gürültü (grain/noise) oluşturur.',
      'Modern kameralar ve telefonlar, ISO\'yu genellikle otomatik ayarlıyor — ama manuel modda çekim yapan kullanıcılar için, mümkün olan en düşük ISO\'yu kullanıp gerekirse enstantane hızını veya diyaframı ayarlamak daha temiz sonuç verir.',
    ],
    faq: [
      { q: 'Yüksek ISO neden gürültülü görüntü verir?', a: 'Yüksek ISO, sensörün sinyalini elektronik olarak güçlendirir — bu güçlendirme, istenmeyen dijital gürültüyü de birlikte artırır.' },
      { q: 'ISO\'yu otomatik mi manuel mi ayarlamalıyım?', a: "Çoğu kullanıcı için otomatik ISO yeterlidir. Manuel kontrol isteyen ileri düzey kullanıcılar, mümkün olan en düşük ISO'yu tercih ederek gürültüyü minimumda tutabilir." },
    ],
  },
  {
    slug: 'akilli-saatte-gps-ne-ise-yarar',
    sources: [{t:'GPS.gov — resmi ABD GPS bilgi servisi', u:'https://www.gps.gov/'}], title: 'Akıllı Saatte GPS Ne İşe Yarar?',
    pillar: 'akilli-saat-nasil-secilir', subLink: 'spor-saatleri',
    tldr: 'Dahili GPS\'li bir akıllı saat, telefon olmadan da konum/rota takibi yapabilir — koşu, bisiklet gibi aktivitelerde telefonu evde bırakıp doğru mesafe ve rota verisi almanızı sağlar.',
    body: [
      'GPS (Küresel Konumlandırma Sistemi), uydulardan sinyal alarak cihazın konumunu belirleyen bir teknolojidir. Dahili GPS\'li bir akıllı saat, bu sinyali doğrudan kendisi alabilir — telefona bağlı kalmaya gerek kalmaz.',
      'Bu, özellikle koşu, bisiklet, yürüyüş gibi açık hava aktivitelerinde önemli — GPS\'li bir saat, telefon evde/cepte kalsa bile kat edilen mesafeyi, hızı ve rotayı doğru şekilde kaydedebilir.',
      'GPS\'i olmayan (veya sadece telefon üzerinden "bağlı GPS" kullanan) saatler, konum verisi için telefona bağımlıdır — telefon yanınızda değilse mesafe/rota takibi ya çalışmaz ya da adım sayısına dayalı daha az hassas bir tahmine dayanır.',
      'Çok frekanslı GPS (multi-band GNSS) destekleyen üst segment saatler, özellikle bina arası veya ormanlık alanlar gibi zorlu ortamlarda daha hassas konum verisi sağlıyor.',
    ],
    faq: [
      { q: 'GPS\'li saat telefon olmadan çalışır mı?', a: 'Evet, dahili GPS\'li bir saat, telefon yanında olmadan da konum/rota/mesafe verisi kaydedebilir.' },
      { q: 'Her akıllı saatte GPS var mı?', a: 'Hayır — bazı bütçe dostu ve günlük kullanım odaklı modeller GPS içermez veya sadece telefona bağlı "connected GPS" sunar.' },
    ],
  },
  {
    slug: 'spo2-olcumu-nedir',
    sources: [{t:'Dünya Sağlık Örgütü — nabız oksimetresi', u:'https://www.who.int/'}], title: 'SpO2 Ölçümü Nedir? Akıllı Saatler Kanı Nasıl Ölçer',
    pillar: 'akilli-saat-nasil-secilir', subLink: null,
    tldr: "SpO2, kandaki oksijen doygunluğu yüzdesini gösterir. Akıllı saatler bunu, ışık sensörleriyle deri altındaki kan damarlarına LED ışığı gönderip yansımasını ölçerek (fotopletismografi) tahmin eder.",
    body: [
      "SpO2 (Kan Oksijen Doygunluğu), kırmızı kan hücrelerindeki hemoglobinin ne kadarının oksijen taşıdığını yüzde olarak gösterir. Sağlıklı bir yetişkinde bu değer genellikle %95-100 arasındadır.",
      'Akıllı saatler bu ölçümü, saatin alt yüzeyindeki yeşil/kırmızı/kızılötesi LED\'lerin deriye ışık göndermesi ve bu ışığın kan damarlarından yansımasını fotodiyotlarla okuması (fotopletismografi/PPG teknolojisi) yoluyla yapar.',
      'Bu ölçüm, tıbbi bir parmak ucu pulse oksimetre cihazı kadar hassas değildir — hareket, saatin bilekteki konumu ve cilt tonu gibi faktörler doğruluğu etkileyebilir. Bu yüzden akıllı saat SpO2 ölçümleri genel bir fikir vermek içindir, tıbbi teşhis amacıyla kullanılmamalıdır.',
      'Uyku sırasında düzenli SpO2 takibi, bazı kullanıcılar için uyku apnesi gibi durumlara dair erken bir uyarı sinyali olabilir — ama kesin tanı için mutlaka bir sağlık uzmanına başvurulmalı.',
    ],
    faq: [
      { q: 'Akıllı saat SpO2 ölçümü tıbbi cihaz kadar doğru mu?', a: 'Hayır — tıbbi parmak ucu oksimetrelere göre daha az hassastır ve genel bir fikir vermek içindir, tıbbi teşhis için kullanılmamalıdır.' },
      { q: 'SpO2 ölçümü nasıl çalışır?', a: 'Saatin LED\'leri deriye ışık gönderir, kan damarlarından yansıyan ışık fotodiyotlarla ölçülerek oksijen doygunluğu tahmin edilir (fotopletismografi).' },
    ],
  },
  {
    slug: 'amoled-vs-lcd-fark',
    sources: [{t:'VESA görüntü standartları', u:'https://www.vesa.org/'}], title: 'AMOLED mi LCD mi? Ekran Panel Türleri Arasındaki Fark',
    pillar: 'telefon-nasil-secilir', subLink: null,
    tldr: 'AMOLED panelde her piksel kendi ışığını üretir — bu, tam siyah ve yüksek kontrast anlamına gelir. LCD ise arkadan aydınlatma kullanır, genellikle daha ucuzdur ama kontrast ve siyah tonlarında AMOLED\'in gerisinde kalır.',
    body: [
      'LCD (Liquid Crystal Display), görüntüyü oluşturmak için arkadan gelen sabit bir aydınlatma (backlight) kullanır — sıvı kristal katman bu ışığı filtreleyerek renkleri oluşturur. Siyah renk gösterilirken bile arka ışık tam kapanmadığı için LCD\'lerde "tam siyah" elde etmek zordur.',
      'AMOLED (Active Matrix Organic LED) ise her pikselin kendi ışığını ürettiği bir teknolojidir — bir piksel siyahı göstermesi gerektiğinde tamamen kapanır. Bu, sonsuz kontrast oranı ve daha derin siyahlar anlamına gelir.',
      'AMOLED panellerin bir diğer avantajı enerji verimliliği — koyu temalı arayüzlerde (siyah arka planlı) daha az piksel aydınlatıldığı için pil tasarrufu sağlar. LCD\'de ise arka ışık her zaman sabit çalıştığı için bu tasarruf yoktur.',
      'LCD panellerin avantajı ise genellikle daha düşük üretim maliyeti (bütçe telefonlarda yaygın) ve zamanla "ekran yanması" (burn-in) riskinin olmaması — AMOLED panellerde uzun süre aynı statik görüntü (saat, durum çubuğu gibi) kalıcı iz bırakabilir.',
    ],
    faq: [
      { q: 'AMOLED mi LCD mi daha iyi?', a: "Görüntü kalitesi (kontrast, siyah tonu, canlılık) açısından AMOLED genellikle üstündür. LCD ise daha uygun fiyatlı ve ekran yanması riski taşımaz." },
      { q: 'AMOLED ekranlarda yanma (burn-in) riski var mı?', a: 'Evet, uzun süre aynı statik görüntü gösterildiğinde (durum çubuğu gibi) AMOLED panellerde kalıcı iz kalma riski vardır — LCD\'de bu risk yoktur.' },
    ],
  },
];

function generateClusterArticles({ rootDir }){
  const outDir = path.join(rootDir, 'rehber');
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  // Not: Bu klasör generate-buying-guides.js tarafından ÖNCE temizlenip
  // dolduruluyor, generate-topical-guides.js ve bu generator SONRA üstüne
  // ekliyor — o yüzden burada temizleme YAPILMIYOR (sırayı bozmasın diye).

  const pages = [];
  ARTICLES.forEach(a => {
    const bodyHtml = a.body.map(p => `  <p style="margin:0 0 16px;line-height:1.7;font-size:14px;">${esc(p)}</p>`).join('\n');
    const tableHtml = a.table ? `<h2 style="font-size:15px;margin:24px 0 10px;">Öne Çıkan Bilgiler</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13.5px;margin-bottom:20px;">
    <tbody>
${a.table.map(row => `      <tr style="border-bottom:1px solid var(--line);"><td style="padding:8px 10px 8px 0;color:var(--ink-soft);">${esc(row.k)}</td><td style="padding:8px 0;font-weight:600;">${esc(row.v)}</td></tr>`).join('\n')}
    </tbody>
  </table>` : '';
    const faqHtml = `<h2 style="font-size:15px;margin:24px 0 10px;">Sıkça Sorulan Sorular</h2>
${a.faq.map(f => `  <div style="margin-bottom:14px;">
    <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${esc(f.q)}</div>
    <div style="font-size:13.5px;color:var(--ink-soft);line-height:1.6;">${esc(f.a)}</div>
  </div>`).join('\n')}`;

    const pillarExists = fs.existsSync(path.join(rootDir, 'rehber', `${a.pillar}.html`));
    const subLinkExists = a.subLink && fs.existsSync(path.join(rootDir, 'kategori', `${a.subLink}.html`));

    const faqSchema = { "@context":"https://schema.org", "@type":"FAQPage", "mainEntity": a.faq.map(f => ({ "@type":"Question", "name":f.q, "acceptedAnswer": { "@type":"Answer", "text":f.a } })) };

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(a.title)} | TeknoVersus</title>
<meta name="description" content="${esc(a.tldr)}" />
<link rel="canonical" href="https://teknoversus.com.tr/rehber/${a.slug}.html" />
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
    <a href="../index.html">Anasayfa</a> / <a href="../rehber/${a.pillar}.html">Rehberler</a> / ${esc(a.title.length>50?a.title.slice(0,50)+'…':a.title)}
  </div>
  <h1 class="product-page-h1" style="margin:12px 0 18px;">${esc(a.title)}</h1>

  <div class="product-notice" style="background:#F0F7FF;border-color:#B8D4F0;margin-bottom:20px;">
    <strong>Kısa cevap:</strong> ${esc(a.tldr)}
  </div>

${bodyHtml}

  ${tableHtml}

  ${faqHtml}

  ${(a.sources && a.sources.length) ? `<h2 style="font-size:15px;margin:24px 0 10px;">Kaynaklar</h2>
  <ul style="font-size:13px;line-height:1.8;padding-left:18px;margin-bottom:20px;">
${a.sources.map(s => `    <li><a href="${s.u}" target="_blank" rel="noopener noreferrer nofollow">${esc(s.t)}</a></li>`).join('\n')}
  </ul>` : ''}

  <h2 style="font-size:15px;margin:24px 0 10px;">İlgili Bağlantılar</h2>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    ${pillarExists ? `<a class="chip-filter" href="${a.pillar}.html">Kapsamlı Seçim Rehberi</a>` : ''}
    ${subLinkExists ? `<a class="chip-filter" href="../kategori/${a.subLink}.html">${esc(a.subLink.split('-').join(' '))}</a>` : ''}
    <a class="chip-filter" href="../karsilastirmalar.html">Karşılaştırmalar</a>
  </div>
</main>

${footerHTML('../')}
<script>document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));</script>
</body>
</html>
`;
    fs.writeFileSync(path.join(outDir, `${a.slug}.html`), html);
    pages.push(`rehber/${a.slug}.html`);
  });

  console.log(`${pages.length} konu kümesi destek makalesi oluşturuldu -> rehber/`);

  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  if(fs.existsSync(sitemapPath)){
    let xml = fs.readFileSync(sitemapPath, 'utf8');
    ARTICLES.forEach(a => {
      xml = xml.replace(new RegExp(`\\s*<url>\\s*<loc>[^<]*\\/rehber\\/${a.slug}\\.html<\\/loc>[\\s\\S]*?<\\/url>`), '');
    });
    const today = new Date().toISOString().slice(0,10);
    const entries = pages.map(p => `  <url>
    <loc>https://teknoversus.com.tr/${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n');
    xml = xml.replace('</urlset>', `${entries}\n</urlset>`);
    fs.writeFileSync(sitemapPath, xml);
    console.log(`sitemap.xml güncellendi, +${pages.length} destek makalesi URL'si eklendi.`);
  }

  return pages;
}

module.exports = { generateClusterArticles };
