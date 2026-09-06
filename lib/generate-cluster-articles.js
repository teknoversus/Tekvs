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
    slug: 'tv-kanal-frekans-arama-neden-onemli', title: 'TV Kanalları Kayboldu mu? Kanal/Frekans Arama Rehberi',
    pillar: 'televizyon-nasil-secilir', subLink: 'akilli-tvler',
    tldr: 'TV kanallarının aniden kaybolmasının en yaygın nedeni, uydu operatörlerinin (örn. Türksat) belirli aralıklarla yaptığı frekans güncellemeleridir; bu durumda çözüm, TV\'nin ayarlar menüsünden "Otomatik Kanal Arama" işlemini yeniden çalıştırmaktır.',
    body: [
      'Uydu üzerinden yayın alan televizyonlarda, kanallar zaman zaman "aniden kayboluyor" gibi görünebilir — bunun en sık nedeni, kullanıcının TV\'sinde bir arıza değil, uydu operatörünün (Türkiye\'de yaygın olarak Türksat) teknik nedenlerle bazı kanalların yayın frekansını değiştirmesidir. Böyle bir değişiklik olduğunda, TV eski frekans bilgisini kullanmaya devam ettiği için o kanalları bulamaz.',
      'Çözüm, TV\'nin kendi ayarlar menüsünden bir "Otomatik Kanal Arama" veya "Kanal Güncelleme" işlemi çalıştırmaktır. Bu işlem, TV\'nin markasına göre genelde Ayarlar > Yayın/Kanal > Otomatik Arama yolunda bulunur ve TV\'nin güncel frekansları tarayarak kanal listesini yeniden oluşturmasını sağlar.',
      'Kablo veya karasal (anten) yayın alan TV\'lerde de benzer bir durum yaşanabilir — yayıncı kuruluşun vericisinde yapılan bir değişiklik, aynı şekilde kanalların yeniden aranmasını gerektirebilir.',
      'Bazı TV\'ler ayrıca bir "Yazılım Güncellemesi" sunar — bazı kanal listesi sorunları TV\'nin işletim yazılımının güncel olmamasından da kaynaklanabilir, bu yüzden kanal arama işe yaramazsa TV\'nin yazılımını güncellemek de denenebilir.',
      'Otomatik arama sonuç vermezse, TV\'nin uydu alıcısı ayarlarından (varsa) frekans, sembol oranı gibi teknik parametrelerin doğru olup olmadığı manuel olarak da kontrol edilebilir — ama bu adım, çoğu kullanıcı için otomatik aramadan sonra nadiren gerekir.',
    ],
    faq: [
      { q: 'Kanal arama işlemi TV\'ye zarar verir mi?', a: 'Hayır, bu tamamen güvenli, standart bir işlemdir. TV\'nin donanımına değil, sadece kanal listesi verisine dokunur.' },
      { q: 'Otomatik arama yaptım ama bazı kanallar hala yok, ne yapmalıyım?', a: 'Bu, o kanalın yayıncısının farklı bir teknik sorun yaşadığını veya geçici olarak yayında olmadığını gösterebilir. Birkaç gün sonra tekrar aramayı denemek veya yayıncının kendi duyurularını kontrol etmek faydalı olabilir.' },
    ],
  },
  {
    slug: 'tv-bluetooth-hoparlore-nasil-baglanir', title: 'TV Bluetooth Hoparlöre Nasıl Bağlanır?',
    pillar: 'televizyon-nasil-secilir', subLink: 'akilli-tvler',
    tldr: 'Bluetooth destekleyen akıllı TV\'lerde, Ayarlar > Ses > Bluetooth Hoparlör menüsünden hoparlör eşleştirme modunda taranıp seçilerek bağlanır; Bluetooth desteklemeyen TV\'lerde ayrı bir Bluetooth verici cihaz kullanılabilir.',
    body: [
      'Çoğu modern akıllı TV, dahili Bluetooth desteğiyle kablosuz hoparlör veya soundbar bağlantısına izin verir. Bu özelliğe erişmek için TV\'nin Ayarlar menüsünden Ses > Hoparlör veya Bluetooth Cihazlar bölümüne gidilir.',
      'Bağlanacak Bluetooth hoparlör, kendi eşleştirme moduna alınır (genelde bir düğmeye basılı tutularak), ardından TV\'nin ayarlar menüsünden "Cihaz Ara" seçilip bulunan hoparlöre dokunularak bağlantı tamamlanır.',
      'Bluetooth desteklemeyen eski model TV\'lerde, TV\'nin kulaklık/optik ses çıkışına takılan ayrı bir "Bluetooth ses vericisi" cihaz kullanılabilir — bu, TV\'nin ses sinyalini kablosuz olarak Bluetooth hoparlöre aktarır.',
      'Bluetooth üzerinden ses aktarımı, kablolu bağlantıya göre birkaç yüz milisaniyelik bir gecikme ekleyebilir — bu, çoğu kullanıcı için fark edilmez olsa da, hassas kullanıcılar için görüntü-ses senkronizasyonunda hafif bir kayma hissedilebilir.',
    ],
    faq: [
      { q: 'TV\'m aynı anda hem hoparlöre hem soundbar\'a bağlanabilir mi?', a: 'Çoğu TV, Bluetooth üzerinden aynı anda sadece bir ses çıkışına bağlanabilir. Bazı yeni modeller çoklu bağlantı (multipoint benzeri) destekleyebilir, ama bu yaygın bir özellik değildir.' },
      { q: 'TV\'mde Bluetooth seçeneği görünmüyor, ne yapmalıyım?', a: 'TV modelinizin Bluetooth desteği olup olmadığını kullanım kılavuzundan kontrol edin. Desteklemiyorsa, TV\'nin ses çıkışına takılan ayrı bir Bluetooth verici cihaz kullanabilirsiniz.' },
    ],
  },
  {
    slug: 'telefonu-tv-ye-nasil-yansitilir', title: 'Telefon Ekranı TV\'ye Nasıl Yansıtılır?',
    pillar: 'televizyon-nasil-secilir', subLink: 'akilli-tvler',
    tldr: 'Android telefonlar genelde Chromecast/yerleşik ekran yansıtma özelliğiyle, iPhone\'lar ise AirPlay (destekleyen TV\'lerde) ile kablosuz bağlanabilir; her iki cihazın da aynı Wi-Fi ağına bağlı olması bu işlemin ön koşuludur.',
    body: [
      'Android telefonlarda, bildirim panelinden veya Ayarlar > Bağlı Cihazlar bölümünden "Ekranı Yansıt" (Cast/Screen Mirroring) seçeneği bulunur — bu, telefonun ekranını, aynı Wi-Fi ağındaki uyumlu bir akıllı TV\'ye veya Chromecast cihazına kablosuz olarak aktarır.',
      'iPhone kullanıcıları için AirPlay, benzer bir işlevi görür — Kontrol Merkezi\'nden "Ekran Yansıtma" seçilip, listede görünen uyumlu TV\'ye dokunularak bağlantı kurulur. Bu özellik, sadece AirPlay destekleyen (çoğu güncel akıllı TV veya Apple TV cihazı olan) TV\'lerde çalışır.',
      'Her iki yöntemde de, telefon ve TV\'nin aynı Wi-Fi ağına bağlı olması temel bir gerekliliktir — farklı ağlardaysa (örneğin biri mobil veri kullanıyorsa) bağlantı kurulamaz.',
      'TV\'nin kendisi Chromecast veya AirPlay desteklemiyorsa, ayrı bir Chromecast veya Apple TV cihazı satın alıp TV\'nin HDMI portuna takarak bu özellik eklenebilir.',
      'Kablolu bir alternatif olarak, telefonun video çıkışını destekleyen bir USB-C/Lightning-to-HDMI adaptörü ile doğrudan TV\'ye bağlanmak da mümkündür — bu, Wi-Fi gerektirmez ve genelde daha düşük gecikmeli bir görüntü sunar.',
    ],
    faq: [
      { q: 'Yansıtma için ikisinin de aynı Wi-Fi\'da olması şart mı?', a: 'Kablosuz (Cast/AirPlay) yöntemler için evet. Kablolu bir adaptör kullanılıyorsa Wi-Fi\'a gerek kalmaz.' },
      { q: 'iPhone\'u Android TV\'ye yansıtabilir miyim?', a: 'AirPlay\'i desteklemeyen bir Android TV\'ye doğrudan kablosuz yansıtma genelde mümkün değildir, ama bazı üçüncü parti uygulamalar veya kablolu adaptörler bu sınırlamayı aşabilir.' },
    ],
  },
  {
    slug: 'tv-uzaktan-kumandasi-nasil-programlanir', title: 'TV Uzaktan Kumandası Nasıl Programlanır?',
    pillar: 'televizyon-nasil-secilir', subLink: 'akilli-tvler',
    tldr: 'Evrensel uzaktan kumandalar genelde bir kod girme veya otomatik tarama moduyla TV\'ye programlanır; TV\'nin markasına özel kod, kumandanın kendi kullanım kılavuzunda veya üreticinin web sitesinde bulunabilir.',
    body: [
      'Bir evrensel uzaktan kumandayı bir TV ile çalışacak şekilde ayarlamanın iki yaygın yöntemi vardır: kod girme ve otomatik arama. Kod girme yönteminde, kumandanın kılavuzunda bulunan markaya özel bir sayısal kod girilir; otomatik arama yönteminde ise kumanda, TV kapanana kadar farklı kodları sırayla dener.',
      'Kod girme yöntemi genelde şu şekilde işler: kumandada bir "Kur" (Setup) düğmesine basılı tutulur, ışık yanınca TV markasına ait kod girilir, ardından kumandanın bir düğmesine (genelde güç düğmesi) basılarak TV\'nin tepki verip vermediği test edilir.',
      'Otomatik arama yönteminde, kumanda TV\'ye yöneltilip sürekli bir düğmeye (genelde güç) basılı tutulur; TV kapandığında o anki kod kaydedilir — bu yöntem kod bilinmediğinde kullanışlıdır ama biraz daha zaman alabilir.',
      'Akıllı TV\'lerin çoğu kendi orijinal kumandasıyla gelir ve bu, TV ile doğrudan (Bluetooth veya kızılötesi ile) fabrika ayarlı çalışır — programlama genelde sadece evrensel/üçüncü parti bir kumanda kullanıldığında gerekir.',
      'Bazı akıllı telefon uygulamaları da (TV üreticisinin resmi uygulaması üzerinden), telefonu geçici bir uzaktan kumandaya dönüştürebilir — bu, kumanda kaybolduğunda veya pili bittiğinde pratik bir alternatiftir.',
    ],
    faq: [
      { q: 'TV markamın kodu kumandada yok, ne yapmalıyım?', a: 'Otomatik arama yöntemini deneyin — bu, kumandanın bildiği tüm kodları sırayla tarar ve markaya özel bir kod girmenize gerek kalmadan çalışabilir.' },
      { q: 'Orijinal kumandam bozuldu, telefonu kumanda yapabilir miyim?', a: 'Çoğu akıllı TV üreticisi, kendi resmi mobil uygulaması üzerinden telefonu uzaktan kumandaya çeviren bir özellik sunar — bu, aynı Wi-Fi ağı üzerinden çalışır.' },
    ],
  },
  {
    slug: 'tv-duvara-nasil-monte-edilir', title: 'TV Duvara Nasıl Monte Edilir?',
    pillar: 'televizyon-nasil-secilir', subLink: 'oled-televizyonlar',
    tldr: 'TV montajı için önce TV\'nin arkasındaki VESA delik ölçüsüne uygun bir duvar aparatı seçilmeli, aparat sağlam bir duvar yapısına (beton/tuğla, alçıpan değil) sabitlenmeli ve TV en az iki kişiyle askıya asılmalıdır.',
    body: [
      'TV\'nin arkasındaki vidalı montaj delikleri, VESA standardına göre belirli bir milimetre aralığında (örneğin 200x200mm veya 400x400mm) düzenlenir. Duvar aparatı satın alırken, TV\'nin kendi VESA ölçüsüyle uyumlu bir aparat seçilmesi gerekir — bu bilgi genelde TV\'nin kullanım kılavuzunda veya arka etiketinde bulunur.',
      'Duvar aparatının sabitleneceği yüzeyin sağlamlığı kritik önem taşır — beton veya tuğla duvarlarda uygun dübel/vida kullanmak yeterlidir, ama alçıpan (bölme) duvarlarda özel ağır yük dübelleri veya duvarın arkasındaki ahşap dikmeye (stud) sabitleme gerekebilir; aksi halde TV zamanla düşme riski taşır.',
      'TV\'yi aparata asma işlemi, özellikle büyük ekranlı (55 inç ve üzeri) modellerde ağırlık nedeniyle iki kişiyle yapılmalıdır — tek kişi hem TV\'ye hem kendi dengesine zarar verme riskiyle karşı karşıya kalabilir.',
      'Montaj yüksekliği belirlenirken, oturma pozisyonundan ekranın orta noktasının göz hizasına yakın olması (çok yüksek veya çok alçak olmaması) uzun süreli izlemede boyun yorgunluğunu azaltır.',
      'Kabloların (güç, HDMI) duvar içinden geçirilmesi isteniyorsa, bu işlem elektrik tesisatına dokunduğundan, deneyimsiz kişiler için profesyonel bir elektrikçiye veya montaj hizmetine başvurmak önerilir.',
    ],
    faq: [
      { q: 'Her duvara TV asılabilir mi?', a: 'Hayır, duvarın sağlam bir yapıya (beton, tuğla veya alçıpan arkasındaki ahşap dikme) sahip olması gerekir. Zayıf veya boş bir alçıpan yüzeye doğrudan asmak güvenli değildir.' },
      { q: 'VESA ölçüsü nedir, nasıl öğrenirim?', a: 'VESA, TV\'nin arkasındaki montaj vida deliklerinin milimetre cinsinden aralığıdır (örn. 300x300mm). Bu bilgi TV\'nin kullanım kılavuzunda veya üreticinin ürün sayfasında belirtilir.' },
    ],
  },
  {
    slug: 'tv-wifiye-nasil-baglanir', title: 'Akıllı TV Wi-Fi\'a Nasıl Bağlanır?',
    pillar: 'televizyon-nasil-secilir', subLink: 'akilli-tvler',
    tldr: 'TV\'nin Ayarlar > Ağ (Network) menüsünden kablosuz ağ listesinden ev Wi-Fi\'ı seçilip şifre girilerek bağlantı birkaç adımda tamamlanır; bağlantı kurulamıyorsa TV\'yi router\'a yakınlaştırmak veya router\'ı yeniden başlatmak genelde sorunu çözer.',
    body: [
      'Akıllı TV\'lerin neredeyse tamamı, Ayarlar menüsünde bir "Ağ" veya "Wi-Fi" bölümü sunar. Bu bölüme girildiğinde, TV yakındaki kablosuz ağları otomatik tarayıp bir liste halinde gösterir.',
      'Listeden ev/ofis ağı seçilip, ekranda çıkan sanal klavye ile Wi-Fi şifresi girilir — TV uzaktan kumandasıyla harf harf yazmak bazen yavaş olabilir, bu yüzden bazı TV\'ler telefon üzerinden şifre girmeyi kolaylaştıran bir QR kod veya uygulama desteği sunar.',
      'Bağlantı kurulamıyorsa, ilk kontrol edilmesi gereken şeyler şunlardır: TV\'nin router\'a çok uzak olmaması (sinyal zayıflığı), doğru şifrenin girildiğinden emin olunması ve router\'ın basitçe yeniden başlatılması (birçok geçici bağlantı sorununu çözer).',
      'Bazı TV\'ler 2.4GHz ve 5GHz olmak üzere iki farklı Wi-Fi frekans bandını destekler — 5GHz genelde daha hızlı ama daha kısa menzilli, 2.4GHz ise daha yavaş ama duvarları daha iyi geçen bir sinyaldir; bağlantı sorunlarında farklı bandı denemek faydalı olabilir.',
      'Kablosuz bağlantı sürekli kararsızsa, TV\'nin Ethernet (kablolu ağ) portu varsa doğrudan bir kabloyla router\'a bağlamak, Wi-Fi sinyal sorunlarını tamamen ortadan kaldıran en güvenilir alternatiftir.',
    ],
    faq: [
      { q: 'TV Wi-Fi şifremi bulamıyor, ne yapmalıyım?', a: 'Router ile TV arasındaki mesafeyi azaltın, router\'ı yeniden başlatın ve TV\'nin Wi-Fi taramasını yenileyin. Sorun devam ederse TV\'yi yeniden başlatmak da yardımcı olabilir.' },
      { q: 'Kablolu bağlantı Wi-Fi\'dan daha mı iyidir?', a: 'Genelde evet — kablolu (Ethernet) bağlantı, kablosuz sinyal zayıflığı veya parazit gibi sorunlardan etkilenmediği için daha istikrarlı bir internet deneyimi sunar, özellikle 4K/8K içerik akışında.' },
    ],
  },
  {
    slug: 'smart-tv-nedir', title: 'Smart TV (Akıllı TV) Nedir? Neler Yapabilir?',
    pillar: 'televizyon-nasil-secilir', subLink: 'akilli-tvler',
    tldr: 'Smart TV, internete bağlanabilen ve Netflix, YouTube gibi uygulamaları doğrudan çalıştırabilen, ayrı bir cihaz (Chromecast, Apple TV gibi) gerektirmeyen bir televizyon türüdür; kendi işletim sistemi (Android TV, Tizen, webOS gibi) üzerinden uygulama mağazasına sahiptir.',
    body: [
      'Smart TV, geleneksel bir televizyondan farklı olarak kendi içinde bir işletim sistemi barındırır — bu, Samsung\'da Tizen, LG\'de webOS, birçok markada ise Android TV veya Google TV gibi isimlerle karşımıza çıkar. Bu işletim sistemi sayesinde TV, internete bağlanıp uygulama çalıştırabilir.',
      'En temel kullanım amacı, Netflix, YouTube, Disney+ gibi video akış (streaming) uygulamalarını, ayrı bir kutu veya oyun konsolu gerektirmeden doğrudan TV üzerinden çalıştırabilmektir — bu, "akıllı" olmayan standart TV\'lerde mümkün olmayan bir özelliktir.',
      'Çoğu Smart TV ayrıca bir tarayıcı, hava durumu, haber uygulamaları gibi ek içerikler de sunar; bazı modellerde sesli asistan entegrasyonu (Google Asistan, Alexa gibi) ile sesli komutla kanal değiştirme veya içerik arama da mümkündür.',
      'Smart TV olmayan ("aptal" veya standart) bir televizyona da, ayrı bir Chromecast, Apple TV veya Android TV kutusu takılarak benzer akıllı özellikler eklenebilir — bu, eski bir TV\'yi tamamen değiştirmeden "akıllandırmanın" pratik bir yoludur.',
      'Smart TV\'lerin bir dezavantajı, işletim sistemlerinin zamanla eski uygulama sürümlerini desteklemeyebilmesidir — birkaç yıl sonra bazı streaming uygulamaları TV\'nin eski yazılımıyla uyumsuz hale gelebilir, bu durumda yine harici bir akıllı TV kutusu çözüm olabilir.',
    ],
    faq: [
      { q: 'Her Smart TV\'de Netflix uygulaması var mı?', a: 'Çoğu güncel modelde önceden yüklü gelir, ama bazı çok eski veya bütçe modellerde uygulama mağazasından ayrıca indirilmesi gerekebilir.' },
      { q: 'Smart TV internet olmadan çalışır mı?', a: 'Evet, geleneksel TV yayınlarını (uydu, kablo, anten) internet olmadan izlemeye devam edebilirsiniz — internet sadece streaming uygulamaları ve akıllı özellikler için gereklidir.' },
    ],
  },

  {
    slug: 'cocuklar-icin-akilli-saat-nasil-secilir', title: 'Çocuklar İçin Akıllı Saat Nasıl Seçilir?',
    pillar: 'akilli-saat-nasil-secilir', subLink: 'cocuk-akilli-saatleri',
    tldr: 'Çocuk akıllı saatlerinde en kritik özellikler SIM kart desteği (arama/mesaj için), GPS konum takibi ve ebeveyn kontrol uygulamasıdır; su geçirmezlik ve dayanıklı gövde de aktif çocuklar için önemli bir tercih sebebidir.',
    body: [
      'Standart akıllı saatlerden farklı olarak, çocuklar için üretilen modellerin çoğu bir SIM kart yuvasına sahiptir — bu, çocuğun telefonu olmadan ebeveynini arayabilmesini veya ebeveynin çocuğu arayabilmesini sağlar. Bu özellik satın alırken operatör uyumluluğunun (bazı saatler sadece belirli operatörlerin SIM kartlarıyla veya özel bir "IoT hattı" ile çalışır) kontrol edilmesini gerektirir.',
      'GPS (veya bazı modellerde daha az hassas olan ağ tabanlı) konum takibi, çocuğun akıllı saati taşıyan telefonundan gerçek zamanlı ya da yakın zamanlı konumunu ebeveynin kendi telefonundaki bir uygulama üzerinden görmesini sağlar. Bu, çoğu ebeveyn için satın alma kararındaki en belirleyici özelliktir.',
      'Ebeveyn kontrol uygulaması genelde "güvenli bölge" (belirli bir alanın dışına çıkınca bildirim), kişi listesini sınırlama (sadece izin verilen numaraların arayabilmesi/aranabilmesi) ve bazen ekran süresi/uygulama kısıtlaması gibi ek kontroller sunar.',
      'Çocuklar aktif olduğundan, gövdenin dayanıklılığı (düşme, çizilme direnci) ve su geçirmezlik derecesi (yüzme, yağmur, el yıkama gibi günlük temaslar için) yetişkin modellerine göre daha kritik bir satın alma kriteridir.',
      'Pil ömrü de önemli bir pratik faktördür — günlük şarj gerektiren modeller, çocuğun her gün saati şarja takmayı unutması ihtimaline karşı, ebeveynler için ek bir takip yükü oluşturabilir; birkaç gün dayanan modeller bu açıdan daha az bakım gerektirir.',
    ],
    faq: [
      { q: 'Çocuk akıllı saatinde SIM kart zorunlu mu?', a: 'Hayır, bazı modeller sadece Bluetooth üzerinden telefonla eşleşerek çalışır (konum takibi telefonun GPS\'ine bağlı olabilir). Ama bağımsız arama/mesajlaşma ve telefon menzili dışında konum takibi için SIM kartlı modeller daha kapsamlı bir çözüm sunar.' },
      { q: 'Konum takibi ne kadar hassas?', a: 'GPS özellikli modeller genelde birkaç metre hassasiyetle çalışır; sadece ağ tabanlı (GPS\'siz) modellerde konum daha az kesin (bazen yüzlerce metre sapmalı) olabilir.' },
    ],
  },

  {
    slug: 'akilli-saat-su-gecirmezlik-derecesi-nasil-anlasilir', title: 'Akıllı Saatte Su Geçirmezlik Derecesi Nasıl Anlaşılır?',
    pillar: 'akilli-saat-nasil-secilir', subLink: 'spor-akilli-saatler',
    tldr: 'IP kodları (örn. IP68) toz ve suya karşı genel dayanıklılığı, ATM/bar değerleri ise (örn. 5ATM) suya daldırılabilecek yaklaşık derinliği gösterir; ATM değeri yüzme için, IP kodu ise günlük su temasına (yağmur, el yıkama) karşı koruma için daha belirleyicidir.',
    body: [
      'IP (Ingress Protection) kodu, iki rakamdan oluşur: ilk rakam katı partiküllere (toza), ikinci rakam suya karşı korumayı belirtir. Örneğin IP68, en yüksek toz koruması (6) ve belirli bir derinlikte sürekli suya daldırılabilme (8) anlamına gelir.',
      'ATM (atmosfer) veya bar değeri, saatin dayanabileceği yaklaşık su basıncını gösterir — 5ATM, teorik olarak yaklaşık 50 metre derinliğe eşdeğer bir basınca dayanabileceği anlamına gelir, ama bu genelde yüzme ve duş gibi günlük kullanım için güvenli kabul edilir, gerçek dalış için değil.',
      'Üreticiler genelde "5ATM su geçirmez, yüzme için uygundur ama dalış için değildir" gibi ek uyarılar da paylaşır — çünkü su basıncı sadece derinlikle değil, hareket (yüzerken kolun çırpma hızı gibi) ile de artabilir ve testte ölçülen statik basınçtan farklı olabilir.',
      'Sıcak su (sauna, sıcak duş) genelde su geçirmezlik derecesinden bağımsız olarak önerilmez — sıcaklık farkı contaların esnekliğini geçici olarak etkileyip su sızıntısı riskini artırabilir.',
    ],
    faq: [
      { q: '5ATM olan bir saatle dalış yapabilir miyim?', a: 'Genelde önerilmez. 5ATM günlük yüzme ve duş için yeterli kabul edilir, ama gerçek dalış (özellikle ekipmanlı) için üreticinin özel olarak "dalışa uygun" belirttiği modeller tercih edilmelidir.' },
      { q: 'IP68 ve 5ATM aynı şey mi?', a: 'Hayır, farklı standartlardır. IP68 hem toz hem su korumasını kapsar, ATM/bar sadece su basıncına dayanıklılığı ölçer. Birçok saat her iki değeri birlikte belirtir.' },
    ],
  },
  {
    slug: 'akilli-saat-nasil-sarj-edilir-pil-omru', title: 'Akıllı Saat Nasıl Şarj Edilir? Pil Ömrünü Uzatma İpuçları',
    pillar: 'akilli-saat-nasil-secilir', subLink: 'spor-akilli-saatler',
    tldr: 'Çoğu akıllı saat manyetik bir şarj kablosu veya şarj yatağı ile şarj edilir; ekran parlaklığını düşürmek, sürekli nabız/GPS takibini gerekmediğinde kapatmak ve bildirimleri sınırlamak günlük pil ömrünü belirgin şekilde uzatır.',
    body: [
      'Akıllı saatlerin büyük çoğunluğu, saatin arkasındaki şarj kontaklarına manyetik olarak yapışan özel bir kablo veya küçük bir şarj yatağı (dock) ile şarj edilir — kablo/yatak doğru hizalanmadığında şarj başlamayabilir, LED gösterge (varsa) doğru bağlantının işaretidir.',
      'Ekran parlaklığı, sürekli açık ekran (always-on display) özelliği kullanılıyorsa pil tüketiminin en büyük kaynaklarından biridir — bu özelliği kapatmak veya parlaklığı düşürmek günlük kullanım süresini belirgin şekilde uzatabilir.',
      'Sürekli GPS takibi (özellikle spor modlarında) ve sürekli nabız ölçümü, pil tüketimini artıran diğer önemli faktörlerdir — bu özellikleri sadece gerçekten gerektiğinde (egzersiz sırasında) açık tutmak günlük pil ömrünü uzatır.',
      'Telefon bildirimlerinin tamamının saate yansıtılması (özellikle titreşimli), sık sık ekranı uyandırıp pil tüketir — sadece önemli uygulamaların bildirimlerine izin vermek bu tüketimi azaltabilir.',
      'Bazı saatler bir "Güç Tasarrufu Modu" sunar; bu mod genelde ekran özelliklerini ve arka plan senkronizasyonunu kısıtlayarak, normal pil ömrünü birkaç kat uzatabilir — uzun bir seyahat veya acil durumlarda kullanışlıdır.',
    ],
    faq: [
      { q: 'Saatimi her gece şarja takmak zararlı mı?', a: 'Hayır, modern akıllı saatler tam şarj olunca genelde şarj almayı otomatik keser. Düzenli gece şarjı büyük bir risk oluşturmaz.' },
      { q: 'GPS özelliği neden bu kadar çok pil tüketiyor?', a: 'GPS, uydu sinyali almak için sürekli aktif bir anten ve işlemci gerektirir — bu, ekrandan bağımsız olarak sürekli enerji harcayan bir donanım işlemidir.' },
    ],
  },
  {
    slug: 'akilli-saat-kordonu-nasil-degistirilir', title: 'Akıllı Saat Kordonu (Bandı) Nasıl Değiştirilir?',
    pillar: 'akilli-saat-nasil-secilir', subLink: 'spor-akilli-saatler',
    tldr: 'Çoğu akıllı saatte kordon, gövdenin yan taraflarındaki küçük bir çıkıntı/düğmeye basılarak veya kayar bir mekanizmayla serbest bırakılır; yeni kordon takılırken, saatin marka/model boyutuna (örn. 20mm, 22mm) uygun olması gerekir.',
    body: [
      'Kordon değiştirme mekanizması markaya göre değişir, ama en yaygın yöntem, kordonun gövdeye bağlandığı noktadaki küçük bir çıkıntıya (quick-release pin) bastırarak kordonu kaydırıp çıkarmaktır — bu genelde alet gerektirmez, sadece parmakla yapılabilir.',
      'Bazı üreticiler (özellikle Apple Watch gibi) kendi özel kilit mekanizmalarını kullanır — bu modellerde kordon, yandaki küçük bir düğmeye basılıp yana kaydırılarak çıkarılır, tamamen farklı bir sistem olduğu için üreticinin kendi talimatına bakmak en güvenlisidir.',
      'Yeni bir kordon satın alırken, saatin bağlantı genişliğinin (genelde 18mm, 20mm veya 22mm gibi milimetre cinsinden belirtilir) doğru ölçüyle eşleşmesi gerekir — bu bilgi genelde saatin kullanım kılavuzunda veya üreticinin resmi sitesinde bulunur.',
      'Standart (üçüncü parti) kordonlar çoğu marka için uygun fiyatlı bir seçenek sunar, ama bazı akıllı saatlerin özel bağlantı noktası tasarımı (Apple Watch\'ın kendi sistemi gibi) sadece o markaya özel üretilmiş kordonlarla uyumlu olabilir.',
    ],
    faq: [
      { q: 'Her kordon her saatte kullanılabilir mi?', a: 'Hayır, hem bağlantı genişliğinin (mm) hem de bağlantı mekanizmasının (standart pin mi, markaya özel bir sistem mi) uyumlu olması gerekir.' },
      { q: 'Kordon değiştirirken saat zarar görebilir mi?', a: 'Doğru yöntemle (üreticinin belirttiği şekilde) yapıldığında risk çok düşüktür. Zorlama veya yanlış mekanizmayı kullanmaya çalışmak gövdeye küçük çizik/hasar riski taşıyabilir.' },
    ],
  },
  {
    slug: 'akilli-saat-saglik-olcumleri-ne-kadar-dogru', title: 'Akıllı Saatin Sağlık Ölçümleri Ne Kadar Doğru?',
    pillar: 'akilli-saat-nasil-secilir', subLink: 'spor-akilli-saatler',
    tldr: 'Nabız ölçümü genelde makul doğrulukta olsa da, oksijen satürasyonu (SpO2) ve stres/uyku analizi gibi ölçümler tıbbi cihaz hassasiyetinde değildir; bu veriler genel trend takibi için faydalıdır ama tanı amaçlı tıbbi kararlar için kullanılmamalıdır.',
    body: [
      'Akıllı saatlerin çoğu, bilekteki kan damarlarına yeşil/kızıl ışık göndererek nabzı ölçen bir teknoloji (fotopletismografi) kullanır. Sabit durumda (dinlenirken) bu ölçüm genelde oldukça doğrudur, ama yoğun hareket sırasında (özellikle kolun sık salladığı sporlarda) doğruluk düşebilir.',
      'Oksijen satürasyonu (SpO2) ölçümü, tıbbi amaçlı parmak ucu pulse oksimetrelere göre daha az hassastır — bu, saatin ışık sensörünün bilek üzerinden ölçüm yapmasının doğal bir sınırlamasıdır. Genel trend takibi için (örneğin uyku sırasında düşük mü yüksek mi) faydalı olsa da, tıbbi bir karar için (örneğin solunum sorunu şüphesi) güvenilir bir tanı aracı değildir.',
      'Uyku ve stres analizi gibi özellikler, kalp hızı değişkenliği ve hareket verilerinden algoritmik olarak tahmin edilir — bu, gerçek bir polisomnografi (uyku testi) kadar kesin değildir, ama zaman içindeki genel eğilimleri (örneğin "bu hafta daha az derin uyudum") göstermek için kullanışlıdır.',
      'Bazı yeni nesil akıllı saatler EKG (elektrokardiyogram) özelliği sunar — bu, nabız sensöründen daha gelişmiş bir ölçümdür ve bazı düzensiz kalp ritmi belirtilerini tespit edebilir, ama yine de profesyonel bir tıbbi EKG cihazının yerini tutmaz ve şüpheli bir sonuç mutlaka bir hekime danışılarak değerlendirilmelidir.',
    ],
    faq: [
      { q: 'Akıllı saat verileri doktoruma gösterilebilir mi?', a: 'Genel bir referans/trend olarak paylaşılabilir, ama bu veriler tıbbi cihaz onaylı hassasiyette değildir — kesin tanı için her zaman uygun tıbbi cihazlar ve bir hekim değerlendirmesi esas alınmalıdır.' },
      { q: 'Nabız ölçümü neden bazen yanlış çıkıyor?', a: 'Saatin bilek üzerinde çok gevşek durması, koyu/dövmeli cilt, soğuk hava (kan akışının azalması) veya yoğun kol hareketi, ışık sensörünün doğru ölçüm yapmasını zorlaştırabilir.' },
    ],
  },
  {
    slug: 'akilli-saat-telefona-nasil-eslestirilir', title: 'Akıllı Saat Telefona Nasıl Eşleştirilir?',
    pillar: 'akilli-saat-nasil-secilir', subLink: 'spor-akilli-saatler',
    tldr: 'Üreticinin resmi mobil uygulaması telefona kurulup açıldıktan sonra, saat açılıp Bluetooth eşleştirme moduna alınır; uygulama saati otomatik bulur ve ekrandaki adımları takip ederek eşleştirme birkaç dakikada tamamlanır.',
    body: [
      'İlk adım, saatin markasına ait resmi mobil uygulamayı (örneğin Galaxy Wearable, Huawei Health, Apple Watch uygulaması gibi) telefona kurmaktır — akıllı saatler genelde işletim sisteminin genel Bluetooth ayarlarından değil, bu özel uygulama üzerinden eşleştirilir.',
      'Uygulama açıldıktan sonra genelde "Yeni cihaz ekle" gibi bir seçenek sunulur; bu sırada saatin açık ve ekranının aktif olması (bazı modellerde ekrana dokunarak eşleştirme ekranını açmak gerekebilir) beklenir.',
      'Telefonun Bluetooth\'unun açık olduğundan emin olunmalı — uygulama, yakındaki uyumlu cihazları tarar ve bulunan saat listede görünür görünmez dokunularak eşleştirme başlatılır.',
      'Eşleştirme sırasında bazen ekranda bir kod (PIN) görünüp her iki cihazda da onaylanması istenebilir — bu, güvenlik amaçlı standart bir adımdır ve genelde sadece ilk eşleştirmede bir kez yapılır.',
      'Eşleştirme tamamlandıktan sonra uygulama genelde bir yazılım güncellemesi önerir — saatin en güncel özelliklere ve hata düzeltmelerine sahip olması için bu güncellemenin ilk kurulumda yapılması önerilir.',
    ],
    faq: [
      { q: 'Saatimi iPhone ve Android arasında değiştirebilir miyim?', a: 'Bu markaya göre değişir — bazı saatler (örneğin Apple Watch) sadece bir ekosistemle (iPhone) çalışırken, çoğu Android uyumlu akıllı saat hem Android hem iPhone ile eşleştirilebilir, ama bazı özellikler platforma göre kısıtlı olabilir.' },
      { q: 'Eşleştirme sırasında saat listede görünmüyor, ne yapmalıyım?', a: 'Saatin şarjlı ve ekranının açık olduğundan emin olun, telefonun Bluetooth\'unu kapatıp açın ve uygulamadan taramayı tekrar başlatın. Sorun devam ederse saati yeniden başlatmak genelde yardımcı olur.' },
    ],
  },
  {
    slug: 'akilli-saat-ekrani-cizilmelere-karsi-nasil-korunur', title: 'Akıllı Saat Ekranı Çizilmelere Karşı Nasıl Korunur?',
    pillar: 'akilli-saat-nasil-secilir', subLink: 'spor-akilli-saatler',
    tldr: 'Ekran koruyucu film veya temperli cam takmak, saati sert yüzeylerle (masa, taş duvar) doğrudan temastan korumak ve spor/iş gibi aşındırıcı ortamlarda bir koruyucu kasa/bumper kullanmak, ekranı çiziklerden korumanın en pratik yollarıdır.',
    body: [
      'Birçok akıllı saat, safir kristal veya sertleştirilmiş cam gibi nispeten dayanıklı ekran malzemeleri kullanır, ama günlük kullanımda (özellikle bilek hareketiyle masaya, duvara sürtünme gibi durumlarda) yine de ince çizikler oluşabilir.',
      'İnce bir ekran koruyucu film veya temperli cam takmak, ekranın kendisini değil koruyucu katmanı çizdirerek, ana ekranı uzun süre orijinal haline yakın tutmaya yardımcı olur. Bu koruyucular gerektiğinde kolayca değiştirilebilir.',
      'İnşaat, tamirat gibi sert/aşındırıcı yüzeylerle sık temas gerektiren işlerde, saati tamamen çevreleyen bir koruyucu kasa (bumper) veya spor aktiviteleri için özel darbe emici kılıflar ekstra bir koruma katmanı sağlar.',
      'Saat takılıyken bilekliğin gevşek durmasına izin vermek, saatin masaya, kapı koluna gibi yüzeylere çarpma/sürtünme riskini artırır — sıkı ama rahat bir bilek pozisyonu, kazara temas riskini bir miktar azaltır.',
      'Bazı üreticiler kendi orijinal ekran koruyucularını satarken, üçüncü parti koruyucular da genelde uyumlu şekilde üretilir — koruyucu seçerken saatin tam model numarasıyla uyumlu olduğundan emin olunmalıdır, aksi halde dokunmatik hassasiyeti veya sensör (kalp atışı ölçer gibi) çalışması etkilenebilir.',
    ],
    faq: [
      { q: 'Ekran koruyucu takmak dokunmatik hassasiyeti etkiler mi?', a: 'Kaliteli, model uyumlu koruyucular genelde hassasiyeti gözle görülür şekilde etkilemez. Ama kalitesiz veya kalın koruyucular bazı modellerde hafif bir gecikmeye neden olabilir.' },
      { q: 'Safir kristal ekranlar hiç çizilmez mi?', a: 'Safir kristal, standart cama göre çok daha çizilmeye dayanıklıdır ama tamamen çizilmez değildir — özellikle elmas tozu veya çok sert malzemelerle temas nadiren yine de iz bırakabilir.' },
    ],
  },

  {
    slug: 'kamera-sensoru-nasil-temizlenir', title: 'Fotoğraf Makinesi Sensörü Nasıl Temizlenir?',
    pillar: 'kamera-nasil-secilir', subLink: 'aynasiz-fotograf-makineleri',
    tldr: 'Sensör temizliği hassas bir işlemdir — önce üreticinin kendi "sensör temizleme" modu (varsa) kullanılmalı, ardından yalnızca kamera için üretilmiş hava üfleyici veya özel sensör temizleme çubuklarıyla, evdeki genel temizlik malzemeleri asla kullanılmadan yapılmalıdır.',
    body: [
      'Değiştirilebilir lensli (aynasız veya DSLR) kameralarda, lens çıkarıldığında sensör dışarıya açık kalır ve zamanla toz partikülleri buraya yapışıp fotoğraflarda küçük lekeler/gölgeler olarak görünebilir. Çoğu kamera, Ayarlar menüsünde bir "Sensör Temizleme" seçeneği sunar — bu, sensörü titreştirerek gevşek tozu kendiliğinden döker ve ilk denenmesi gereken adımdır.',
      'Bu yeterli olmazsa, sadece kamera ekipmanları için üretilmiş bir hava üfleyici (rocket blower) ile, kamera lensi çıkarılmış ve sensör aşağı bakacak şekilde tutularak, sensöre birkaç kez hava püskürtülebilir. Ofis malzemesi olan basınçlı hava sprayleri kesinlikle kullanılmamalıdır — bunlar aşırı basınçlı olup sensöre zarar verebilir.',
      'Hava üflemesi yeterli olmazsa (yağ lekesi gibi yapışkan kirler için), özel olarak üretilmiş sensör temizleme çubukları (sensor swabs) ve sensör temizleme sıvısı kullanılabilir — ama bu adım, doğru yapılmazsa sensöre kalıcı çizik riski taşıdığından, deneyimsiz kullanıcılar için genelde yetkili servise bırakılması önerilir.',
      'Sensör temizliği sırasında kamera daima kapalı, pil tercihen çıkarılmış (bazı modellerde sensör temizleme modu pil takılıyken güç gerektirir, bu durumda üretici talimatı izlenmeli) ve toz/rüzgarsız bir ortamda yapılmalıdır.',
    ],
    faq: [
      { q: 'Sensörü kendim temizlemek riskli mi?', a: 'Hava üflemesi düşük risklidir ve çoğu kullanıcı rahatlıkla yapabilir. Ama fiziksel temas gerektiren (swab ile silme) temizlik, doğru yapılmazsa çizik riski taşır — deneyimsizseniz yetkili servise bırakmak daha güvenlidir.' },
      { q: 'Sensör ne sıklıkla temizlenmeli?', a: 'Bu, lens değiştirme sıklığına ve kullanım ortamına (tozlu/kumlu ortamlarda daha sık) bağlıdır. Fotoğraflarda tekrarlayan lekeler görülmeye başlandığında temizlik zamanı gelmiş demektir.' },
    ],
  },
  {
    slug: 'aynasiz-kamerada-lens-nasil-degistirilir', title: 'Aynasız Kamerada Lens Nasıl Değiştirilir?',
    pillar: 'kamera-nasil-secilir', subLink: 'aynasiz-fotograf-makineleri',
    tldr: 'Kamerayı kapatıp lensi çıkarmadan önce yeni lensin hazır olduğundan emin olmak, lens değişimini toz/nem az bir ortamda (mümkünse kamerayı aşağı doğru tutarak) hızlıca yapmak, sensöre toz kaçma riskini en aza indirir.',
    body: [
      'Lens değiştirmeden önce kameranın kapatılması önerilir — bu, hem sensörü koruyan elektrostatik önlemlerin etkisiz kalmamasını sağlar hem de yanlışlıkla çekim yapılmasını önler.',
      'Mevcut lensi çıkarmak için, gövde üzerindeki lens bırakma düğmesine basılı tutulup lens hafifçe (genelde saat yönünün tersine) çevrilerek serbest bırakılır. Bu sırada kamerayı hafifçe aşağı eğik tutmak, açık sensöre toz düşme riskini azaltır.',
      'Yeni lens takılmadan önce, hem lensin arka kısmındaki elektronik kontaklar hem de gövdedeki lens yuvası hızlıca (fazla zaman harcamadan) göz ile kontrol edilip görünür bir toz/kir varsa üflenerek temizlenebilir.',
      'Yeni lens, gövdedeki hizalama noktasıyla (genelde kırmızı veya beyaz bir nokta/çizgi) eşleştirilip yerine oturana kadar çevrilir — bir "tık" sesi veya hissi, lensin doğru kilitlendiğinin işaretidir.',
      'Lens değişimi mümkünse rüzgarlı, tozlu veya kumlu ortamlarda (plaj, inşaat alanı gibi) yapılmamalı; bu tür ortamlarda değişim şartsa, kamerayı rüzgara arkası dönük tutmak ve işlemi olabildiğince hızlı tamamlamak önerilir.',
    ],
    faq: [
      { q: 'Lens değiştirirken kamerayı kapatmak zorunlu mu?', a: 'Zorunlu olmasa da şiddetle önerilir — bu, hem güvenlik hem de sensörü koruyan bazı elektronik önlemlerin (varsa) etkin kalmasını sağlar.' },
      { q: 'Lens takarken zorlanıyorsa ne yapmalıyım?', a: 'Asla zorlamayın. Hizalama noktalarının doğru eşleştiğinden emin olun; lens doğru hizadaysa neredeyse hiç dirençle karşılaşmadan oturur.' },
    ],
  },
  {
    slug: 'hafiza-karti-formatlamasi-neden-onemli', title: 'Kamerada Hafıza Kartı Formatlaması Neden Önemli?',
    pillar: 'kamera-nasil-secilir', subLink: 'kompakt-fotograf-makineleri',
    tldr: 'Yeni bir hafıza kartını bilgisayarda değil, doğrudan kamera içinden formatlamak, kartın o kameranın dosya sistemine uygun şekilde hazırlanmasını sağlar ve "kart hatası" gibi sorunları önler; formatlama kart üzerindeki tüm verileri siler.',
    body: [
      'Bir hafıza kartı ilk kez bir kamerada kullanılacağı zaman, bilgisayarda formatlamak yerine doğrudan kameranın kendi menüsünden ("Kartı Formatla" seçeneği) formatlanması önerilir. Bu, kartın o kameraya özgü klasör yapısı ve dosya sistemiyle uyumlu hale gelmesini sağlar.',
      'Farklı bir kamerada veya bilgisayarda kullanılmış bir kart, yeni kamerada bazen "Kart Hatası" veya tanınmama sorunlarına yol açabilir — kamera içinden formatlamak bu tür uyumluluk sorunlarını genelde önler.',
      'Formatlama, kart üzerindeki dosya sistemini sıfırlar ve tüm verileri (fotoğraf, video) siler — bu yüzden formatlamadan önce kart üzerindeki önemli dosyaların yedeklendiğinden mutlaka emin olunmalıdır.',
      'Bazı fotoğrafçılar, dosyaları bilgisayara aktardıktan sonra kartı silmek yerine yeniden formatlamayı tercih eder — bu, tekil dosya silme işlemlerinin zamanla oluşturabileceği dosya sistemi bozulmalarını önler ve kartın performansını daha tutarlı tutar.',
    ],
    faq: [
      { q: 'Formatlamak ile dosyaları silmek arasındaki fark nedir?', a: 'Tekil dosya silme sadece o dosyaları kaldırır, dosya sistemi yapısını değiştirmez. Formatlama ise kartın dosya sistemini tamamen sıfırlar — bu, uzun vadede kart performansını daha istikrarlı tutar.' },
      { q: 'Kartı her çekim öncesi formatlamalı mıyım?', a: 'Zorunlu değil, ama dosyaları güvenle yedekledikten sonra düzenli olarak (örneğin her önemli çekimden önce) formatlamak, kart hatası riskini azaltan iyi bir alışkanlıktır.' },
    ],
  },
  {
    slug: 'vlog-icin-kamera-nasil-secilir', title: 'Vlog İçin Kamera Nasıl Seçilir?',
    pillar: 'kamera-nasil-secilir', subLink: 'aynasiz-fotograf-makineleri',
    tldr: 'Vlog çekimi için en kritik özellikler döner/katlanır ekran (kendi kendine çekim için), iyi bir otofokus takip sistemi ve dahili veya harici mikrofon desteğidir — sensör boyutu veya çözünürlük genelde ikincil önemdedir.',
    body: [
      'Vlog çekiminde kameranın kendinize dönük katlanabilir veya döner bir ekrana sahip olması, çekim sırasında kendinizi kadraj içinde görebilmeniz için pratik açıdan en önemli özelliklerden biridir.',
      'Sabit bir tripod yerine elde veya hareket halinde çekim yapıldığından, güvenilir bir yüz/göz takibi yapabilen otofokus sistemi, netliğin sürekli korunması için kritik önem taşır — bu, özellikle konuşurken hareket eden vlogger\'lar için görüntü kalitesini doğrudan etkiler.',
      'Ses kalitesi, görüntü kalitesinden çoğu zaman daha belirleyicidir — izleyiciler bulanık bir görüntüye tahammül edebilir ama kötü sesi genelde hemen fark eder. Bu yüzden harici mikrofon takılabilen (3.5mm giriş veya hot-shoe bağlantılı) bir model tercih edilmesi önerilir.',
      'Elektronik görüntü sabitleme (EIS) veya optik sabitleme (OIS), elde tutularak yapılan çekimlerde titremeyi azaltır ve daha profesyonel görünen bir sonuç sağlar — bu özellik özellikle yürürken çekim yapan vlogger\'lar için önemlidir.',
      'Pil ömrü ve dosya boyutu da pratik bir faktördür — uzun süreli çekimler yapılacaksa, yedek pil bulundurmak veya USB üzerinden şarj/güç alabilen bir model tercih etmek kesintisiz çekim için avantaj sağlar.',
    ],
    faq: [
      { q: 'Vlog için sensör boyutu önemli mi?', a: 'Görüntü kalitesini etkiler ama vlog için en kritik faktör değildir — döner ekran, otofokus takibi ve ses girişi gibi pratik özellikler genelde daha belirleyicidir.' },
      { q: 'Telefon kamerası vlog için yeterli mi?', a: 'Yeni başlayanlar için birçok telefon kamerası gayet iyi sonuç verir. Ama harici mikrofon desteği, optik zoom ve daha gelişmiş sabitleme isteyen içerik üreticileri için özel bir vlog kamerası daha esnek bir seçenek sunar.' },
    ],
  },
  {
    slug: 'aksiyon-kamerasi-zorlu-kosul-ipuclari', title: 'Aksiyon Kamerası Su Altı ve Zorlu Koşullarda Kullanım İpuçları',
    pillar: 'kamera-nasil-secilir', subLink: 'aksiyon-kameralari',
    tldr: 'Su altı çekimlerinde kameranın su geçirmezlik derinlik sınırının aşılmaması, tuzlu sudan sonra tatlı suyla durulanması ve soğuk havada pil performansının belirgin düştüğünün bilinmesi, aksiyon kameralarını zorlu koşullarda güvenle kullanmanın temel kurallarıdır.',
    body: [
      'Her aksiyon kamerasının (ekstra kılıf olmadan) dayanabileceği belirli bir su geçirmezlik derinliği vardır — bu sınırın aşılması, kameraya kalıcı su hasarı verebilir. Üreticinin belirttiği derinlik değeri, dalış gibi daha derin kullanımlar için genelde ek bir koruyucu kılıf gerektirir.',
      'Deniz suyunda (tuzlu su) kullanıldıktan sonra, kameranın dış yüzeyi ve özellikle contaların bulunduğu bölgeler tatlı suyla durulanmalıdır — tuz kristalleri zamanla contalara birikip su geçirmezliği bozabilir.',
      'Soğuk havalarda (kayak, kar sporları gibi) lityum bazlı piller normalden çok daha hızlı tükenir — bu durumlarda yedek pil bulundurmak ve pilleri kullanılana kadar vücuda yakın (cep gibi) sıcak tutmak, ani kapanmaları önlemeye yardımcı olur.',
      'Yüksek sıcaklıkta uzun süreli 4K/yüksek çözünürlüklü kayıt yapan aksiyon kameraları aşırı ısınıp otomatik olarak kapanabilir — bu durum özellikle yaz aylarında doğrudan güneş altında uzun çekimlerde daha sık görülür, kısa molalar vermek bu riski azaltır.',
      'Toz veya kumlu ortamlarda kullanım sonrası, lens çevresi ve kapak contaları yumuşak bir fırça veya hava üfleyiciyle temizlenmeli — kum partikülleri contalara sıkışıp su geçirmezliği zamanla zayıflatabilir.',
    ],
    faq: [
      { q: 'Her aksiyon kamerası ekstra kılıfsız su altında kullanılabilir mi?', a: 'Çoğu modern aksiyon kamerası belirli bir derinliğe kadar (genelde birkaç metre) ekstra kılıf olmadan su geçirmezdir, ama daha derin dalışlar için üreticinin sunduğu koruyucu kılıf gerekir.' },
      { q: 'Soğukta pil ömrünü uzatmanın bir yolu var mı?', a: 'Evet — yedek pilleri vücuda yakın, sıcak tutmak ve kamerayı kullanılmadığı anlarda (mümkünse) sıcak bir cepte saklamak, soğuğun pil performansına etkisini azaltır.' },
    ],
  },
  {
    slug: 'kamera-pil-omru-nasil-uzatilir', title: 'Fotoğraf Makinesi Pil Ömrü Nasıl Uzatılır?',
    pillar: 'kamera-nasil-secilir', subLink: 'kompakt-fotograf-makineleri',
    tldr: 'Ekran yerine varsa vizör (EVF) kullanmak, Wi-Fi/Bluetooth\'u gerekmediğinde kapatmak ve ekran parlaklığını düşürmek, aynasız ve dijital kameralarda pil ömrünü uzatan en etkili ve basit alışkanlıklardır.',
    body: [
      'Arka ekran (LCD), pil tüketiminin en büyük kaynaklarından biridir. Elektronik vizörü (EVF) olan modellerde, kadrajlama için ekran yerine vizör kullanmak belirgin bir pil tasarrufu sağlar.',
      'Wi-Fi ve Bluetooth bağlantısı (fotoğrafları telefona anlık aktarmak gibi özellikler için), sürekli açık bırakıldığında arka planda pil tüketir — bu özellikler sadece transfer yapılacağı zaman açılıp, sonra kapatılmalıdır.',
      'Ekran parlaklığını otomatik yerine manuel olarak, ortam ışığına yetecek en düşük seviyede tutmak, özellikle güneşli günlerde ekranı görebilmek için parlaklığı sürekli maksimuma çıkarmaktan daha tasarruflu bir yaklaşımdır.',
      'Sürekli otofokus modu (özellikle video çekiminde), tek seferlik otofokusa göre daha fazla enerji tüketir — sabit bir sahne çekiliyorsa tek seferlik otofokus tercih etmek pil ömrünü uzatabilir.',
      'Soğuk havada lityum piller performans kaybı yaşar — bu, telefon/kulaklık pillerinde olduğu gibi kameralarda da geçerlidir; yedek pilleri sıcak tutmak ve kullanılmayan pilleri kamera dışında (cepte) saklamak, soğuk günlerde toplam çekim süresini artırır.',
    ],
    faq: [
      { q: 'Vizör kullanmak gerçekten pil tasarrufu sağlar mı?', a: 'Evet, belirgin şekilde — arka ekranı sürekli açık tutmak yerine küçük bir elektronik vizör kullanmak, birçok modelde çekim başına önemli ölçüde daha fazla kare almanızı sağlar.' },
      { q: 'Yedek pil taşımak yerine powerbank kullanılabilir mi?', a: 'USB üzerinden şarj/güç alabilen modellerde evet, bir powerbank kamerayı kullanırken bile şarj edebilir. Ama bu özelliği desteklemeyen modellerde geleneksel yedek pil daha güvenilir bir çözümdür.' },
    ],
  },

  {
    slug: 'tablet-depolama-alani-nasil-bosaltilir', title: 'Tablette Depolama Alanı Nasıl Boşaltılır?',
    pillar: 'tablet-nasil-secilir', subLink: 'buyuk-ekran-tabletler',
    tldr: 'Önbellek verilerini temizlemek, kullanılmayan uygulamaları kaldırmak ve fotoğraf/videoları buluta (Google Photos, iCloud) taşıyıp cihazdan silmek, tabletlerde en hızlı yer açan üç yöntemdir.',
    body: [
      'Uygulamaların zamanla biriktirdiği önbellek (cache) verileri, fark edilmeden ciddi miktarda yer kaplayabilir. Android\'de Ayarlar > Depolama menüsünden uygulama bazında önbellek temizlenebilir; iPadOS\'ta bu işlem uygulamayı silip yeniden yüklemekle (verileri kaybetmeden, sadece önbelleği sıfırlayarak) yapılabilir.',
      'Nadiren kullanılan uygulamalar, özellikle oyunlar, en çok yer kaplayan öğeler arasındadır. Ayarlar > Depolama bölümünden uygulamalar boyutlarına göre sıralanıp, en büyük ama en az kullanılanlar tespit edilip kaldırılabilir.',
      'Fotoğraf ve videolar, özellikle tablet kamera veya ekran kaydı için kullanılıyorsa, depolamanın büyük kısmını oluşturabilir. Google Photos (Android) veya iCloud Fotoğrafları (iPad) ile bunları buluta yükleyip cihazdaki orijinallerini silmek, gigabaytlarca yer açabilir.',
      'İndirilen ama artık izlenmeyen video/müzik dosyaları (örneğin çevrimdışı izleme için kaydedilmiş içerikler) genelde unutulur — medya uygulamalarının kendi "indirilenler" bölümünden bu içerikler kontrol edilip temizlenmelidir.',
      'Bazı tabletlerde microSD kart desteği bulunur — bu tür modellerde fotoğraf, video ve hatta bazı uygulamalar harici karta taşınarak dahili depolama rahatlatılabilir.',
    ],
    faq: [
      { q: 'Önbellek temizlemek uygulama verilerini siler mi?', a: 'Hayır, önbellek temizleme sadece geçici dosyaları siler; giriş bilgileri, kayıtlı ayarlar gibi asıl uygulama verileri etkilenmez.' },
      { q: 'Hangi uygulamalar en çok yer kaplar?', a: 'Genelde oyunlar (özellikle yüksek grafikli olanlar) ve video/müzik indiren medya uygulamaları en çok depolama alanı kaplayan kategorilerdir.' },
    ],
  },
  {
    slug: 'tablet-ekrani-nasil-temizlenir', title: 'Tablet Ekranı Nasıl Temizlenir? Dokunmatik Ekran İçin İpuçları',
    pillar: 'tablet-nasil-secilir', subLink: 'buyuk-ekran-tabletler',
    tldr: 'Cihaz kapalıyken, kuru veya hafif su ile nemlendirilmiş yumuşak bir mikrofiber bez kullanmak dokunmatik ekranlar için en güvenli yöntemdir; alkol bazlı temizleyiciler ekranın parmak izi önleyici kaplamasına zamanla zarar verebilir.',
    body: [
      'Dokunmatik ekranlar, çoğu telefon/tablette parmak izini azaltan ince bir oleofobik kaplamayla kaplıdır. Bu kaplamayı korumak için, temizlik öncesi cihazın kapatılması ve yalnızca yumuşak, tüy bırakmayan bir mikrofiber bezin kullanılması önerilir.',
      'İnatçı lekeler veya parmak izleri için bez hafifçe saf su ile nemlendirilebilir — ama sıvı asla doğrudan ekrana püskürtülmemeli, önce beze uygulanıp öyle silinmelidir. Cam temizleyiciler, alkol veya amonyak içerdiğinden kaplamaya zarar verebileceği için genelde önerilmez.',
      'Ekran koruyucu (cam veya film) kullanan tabletlerde, temizlik koruyucunun üzerinde yapılır — bu, hem ana ekranı fiziksel temastan korur hem de koruyucunun kendisi zamanla değiştirilebilir bir katman olur.',
      'Ekran kenarlarındaki hoparlör delikleri veya kamera çevresi gibi dar bölgeler için kuru bir pamuklu çubuk (aşırı ıslatılmadan) kullanılabilir; bu bölgelere sıvı kaçmamasına dikkat edilmelidir.',
    ],
    faq: [
      { q: 'Islak mendil ile tablet ekranı silinebilir mi?', a: 'Alkol içermeyen, özellikle elektronik ekranlar için üretilmiş ıslak mendiller kullanılabilir; genel amaçlı ıslak mendillerin çoğu alkol veya kimyasal içerir, bu yüzden önerilmez.' },
      { q: 'Ekran koruyucu takmak temizliği kolaylaştırır mı?', a: 'Evet, koruyucu çizik ve leke oluşumunu üzerine alır; ana ekran daha az doğrudan temas görür ve koruyucu gerektiğinde kolayca değiştirilebilir.' },
    ],
  },
  {
    slug: 'yavas-tablet-nasil-hizlandirilir', title: 'Yavaşlayan Tablet Nasıl Hızlandırılır?',
    pillar: 'tablet-nasil-secilir', subLink: 'butce-dostu-tabletler',
    tldr: 'Arka planda açık kalan gereksiz uygulamaları kapatmak, depolama alanını boşaltmak ve işletim sistemini güncel tutmak, tabletlerdeki yavaşlama şikayetlerinin büyük kısmını gideren üç temel adımdır.',
    body: [
      'Arka planda çalışmaya devam eden uygulamalar, özellikle düşük RAM\'li tabletlerde belirgin bir yavaşlamaya neden olur. Son kullanılan uygulamalar menüsünden (genelde ana ekran düğmesine basılı tutarak veya kaydırarak açılır) kullanılmayan uygulamalar kapatılabilir.',
      'Depolama alanının dolmaya yakın olması, işletim sisteminin geçici dosyalar için yer bulamamasına ve genel yavaşlamaya yol açar — bu, tabletlerde dizüstü bilgisayarlardaki HDD/SSD sorunundan farklı olarak, doğrudan dahili depolama (flash bellek) hızıyla ilgilidir.',
      'İşletim sistemi güncellemeleri genelde performans iyileştirmeleri ve hata düzeltmeleri içerir — özellikle üretici tarafından "performans optimizasyonu" vurgulanan güncellemeler, eski bir tableti belirgin şekilde hızlandırabilir.',
      'Çok sayıda widget (ana ekran araçları) ve canlı duvar kağıtları da sürekli arka planda işlemci kullanarak genel hıza etki eder — sade bir ana ekran düzeni tercih etmek, düşük donanımlı tabletlerde fark yaratabilir.',
      'Uzun süredir yeniden başlatılmamış bir tablet, zamanla biriken geçici sistem verileri nedeniyle yavaşlayabilir — düzenli olarak (örneğin haftada bir) yeniden başlatmak basit ama etkili bir bakım alışkanlığıdır.',
    ],
    faq: [
      { q: 'Fabrika ayarlarına sıfırlamak tableti hızlandırır mı?', a: 'Genelde evet, özellikle uzun süre kullanılmış ve çok fazla uygulama/veri birikmiş tabletlerde belirgin bir hızlanma sağlar — ama bu, tüm verileri sildiği için önce yedekleme yapılmalıdır.' },
      { q: 'Düşük RAM\'li bir tablet neden daha çok yavaşlar?', a: 'RAM, aynı anda çalışan uygulamaların geçici olarak tutulduğu bellektir; RAM azsa sistem sık sık uygulamaları kapatıp yeniden açmak zorunda kalır, bu da gecikme olarak hissedilir.' },
    ],
  },
  {
    slug: 'tablet-kalemi-nasil-secilir', title: 'Tablet Kalemi (Stylus) Nasıl Seçilir ve Kalibre Edilir?',
    pillar: 'tablet-nasil-secilir', subLink: 'buyuk-ekran-tabletler',
    tldr: 'En önemli uyumluluk kuralı, kalemin tabletin kendi ekosistemine (Apple Pencil sadece iPad, S Pen çoğunlukla Samsung Galaxy Tab) özel üretilmiş olmasıdır; farklı marka kalemler dokunmatik olarak çalışsa da basınç hassasiyeti gibi gelişmiş özellikleri desteklemeyebilir.',
    body: [
      'Tablet kalemleri iki ana kategoriye ayrılır: pasif (basit dokunmatik) kalemler ve aktif (basınca duyarlı, palm rejection destekli) kalemler. Aktif kalemler, çizim ve not almada çok daha hassas bir deneyim sunar ama genelde belirli bir marka/model ile sınırlıdır.',
      'Apple Pencil sadece iPad\'lerle, Samsung S Pen ise öncelikle Galaxy Tab serisiyle uyumlu şekilde tasarlanmıştır — bu kalemler o ekosistemin dışında (örneğin bir Android tablette Apple Pencil) çalışmaz. Üçüncü parti "evrensel" kalemler farklı markalarda çalışabilir ama genelde temel dokunmatik özellikler sunar, gelişmiş basınç hassasiyeti her zaman garanti değildir.',
      'Kalem kalibrasyonu (dokunma noktasının ekranda doğru yere denk gelmesi), genelde tabletin Ayarlar menüsünde "Kalem" veya "S Pen" bölümünden yapılan basit bir dokunma testiyle otomatik ayarlanır. Bazı üçüncü parti kalemlerde bu ayar, kalemin kendi eşleştirme uygulaması üzerinden yapılır.',
      'Basınç hassasiyeti seviyesi (örneğin "4096 seviye basınç"), profesyonel çizim yapan kullanıcılar için önemli bir teknik özelliktir — sadece not almak için kullanılacaksa bu detay daha az kritiktir, temel bir aktif kalem yeterli olur.',
    ],
    faq: [
      { q: 'Her tablette stylus kullanılabilir mi?', a: 'Dokunmatik ekranı olan hemen her tablette temel (pasif) bir kalem kullanılabilir, ama gelişmiş özellikler (basınç hassasiyeti, palm rejection) için tabletin ve kalemin özel olarak birbiriyle uyumlu tasarlanmış olması gerekir.' },
      { q: 'Kalem tablet ile eşleşmiyor, ne yapmalıyım?', a: 'Bluetooth bağlantılı kalemlerde önce Bluetooth\'un açık olduğundan emin olun, ardından tabletin Ayarlar > Kalem/Aksesuar menüsünden eşleştirmeyi tekrar deneyin. Manyetik/temassız şarj olan kalemlerde ise doğru konumda oturup oturmadığı kontrol edilmelidir.' },
    ],
  },
  {
    slug: 'tablette-bolunmus-ekran-nasil-kullanilir', title: 'Tablette Bölünmüş Ekran (Çoklu Pencere) Nasıl Kullanılır?',
    pillar: 'tablet-nasil-secilir', subLink: 'buyuk-ekran-tabletler',
    tldr: 'Çoğu modern tablette, son kullanılan uygulamalar menüsünden bir uygulama simgesine basılı tutup "Bölünmüş ekranda aç" seçeneğini seçerek veya uygulama simgesini ekranın kenarına sürükleyerek iki uygulama yan yana açılabilir.',
    body: [
      'Bölünmüş ekran (split screen) özelliği, büyük ekranlı tabletlerin en pratik avantajlarından biridir — örneğin bir tarafta not alma uygulaması açıkken diğer tarafta bir video izlenebilir veya bir web sayfası referans olarak tutulabilir.',
      'Android tabletlerde genelde, son kullanılan uygulamalar ekranından bir uygulama simgesine basılı tutulup çıkan menüden "Bölünmüş ekranda aç" seçilir, ardından ikinci uygulama ekranın alt/yan kısmından seçilir.',
      'iPadOS\'ta "Split View" özelliği, bir uygulama açıkken ekranın kenarından Dock\'u (alt uygulama çubuğunu) çekip, ikinci bir uygulama simgesini ekranın kenarına sürüklemekle etkinleştirilir.',
      'Bazı üretici arayüzlerinde (örneğin Samsung\'un One UI\'ı) ayrıca "Kayan Pencere" (floating window) modu da bulunur — bu, ikinci uygulamayı tam ekranın yarısını değil, küçük ve taşınabilir bir pencerede açar.',
      'Bölünmüş ekranda çalışan her uygulama RAM kullanır — düşük RAM\'li tabletlerde iki ağır uygulamayı aynı anda bölünmüş ekranda çalıştırmak yavaşlamaya neden olabilir.',
    ],
    faq: [
      { q: 'Her uygulama bölünmüş ekranda çalışır mı?', a: 'Hayır, bazı uygulamalar (özellikle bazı oyunlar veya tam ekran gerektiren video uygulamaları) bölünmüş ekran modunu desteklemez ve bu seçenek o uygulamalar için menüde görünmeyebilir.' },
      { q: 'Bölünmüş ekran özelliği her tablette var mı?', a: 'Modern tabletlerin büyük çoğunluğunda bulunur, ama çok eski veya bütçe segmentindeki bazı modellerde bu özellik donanım/yazılım kısıtları nedeniyle sunulmayabilir.' },
    ],
  },
  {
    slug: 'tablete-harici-klavye-mouse-nasil-baglanir', title: 'Tablete Harici Klavye ve Mouse Nasıl Bağlanır?',
    pillar: 'tablet-nasil-secilir', subLink: 'is-icin-tabletler',
    tldr: 'Bluetooth klavye/mouse, tabletin Bluetooth ayarlarından "Cihaz Ekle" ile eşleştirilir; USB-C portu olan tabletlerde kablolu klavye/mouse ise genelde doğrudan (bazen bir adaptörle) takılıp otomatik tanınır.',
    body: [
      'Bluetooth klavye veya mouse bağlamak için, aksesuarın kendi eşleştirme moduna alınması (genelde bir düğmeye basarak) ve ardından tabletin Ayarlar > Bluetooth menüsünden "Cihaz Ekle" seçilip listede görünen aksesuara dokunulması yeterlidir.',
      'USB-C portuna sahip tabletlerde, kablolu bir klavye veya mouse doğrudan (bazı eski/ince modellerde bir USB-C\'den USB-A adaptörüyle) takılabilir; işletim sistemi genelde bu aksesuarları ek bir kurulum gerektirmeden otomatik tanır.',
      'Bazı üreticiler, kendi tabletleri için özel olarak tasarlanmış manyetik klavye kılıfları sunar — bu tür aksesuarlar genelde Bluetooth\'a bile gerek kalmadan, tabletin arkasındaki özel pin bağlantı noktaları (pogo pin) üzerinden doğrudan bağlanır.',
      'Mouse bağlandığında, özellikle Android tabletlerde bir imleç görünmeyebilir — bu durumda geliştirici seçeneklerinden veya üretici arayüzünün "masaüstü modu"ndan fare imleci desteğinin etkinleştirilmesi gerekebilir.',
      'Birden fazla Bluetooth aksesuar (klavye + mouse) aynı anda bağlıyken bazen biri diğerinin sinyaline karışabilir — bu tür bir sorun yaşanırsa aksesuarları teker teker eşleştirip test etmek sorunun kaynağını bulmaya yardımcı olur.',
    ],
    faq: [
      { q: 'Her tablette mouse imleci görünür mü?', a: 'iPadOS ve çoğu güncel Android sürümünde otomatik görünür. Bazı eski Android sürümlerinde imleç desteği sınırlı olabilir veya üreticinin masaüstü modu gibi bir özelliğin etkinleştirilmesini gerektirebilir.' },
      { q: 'Klavye kılıfı ile Bluetooth klavye arasında fark var mı?', a: 'Evet — klavye kılıfları genelde tabletin kendi pin bağlantı noktası üzerinden çalışır ve ayrı bir eşleştirme/şarj gerektirmez, Bluetooth klavyeler ise kendi pilini kullanır ve ayrı eşleştirme ister.' },
    ],
  },

  {
    slug: 'bluetooth-kulaklik-nasil-sifirlanir', title: 'Bluetooth Kulaklık Nasıl Sıfırlanır (Reset Atılır)?',
    pillar: 'kulaklik-nasil-secilir', subLink: 'kablosuz-kulaklik',
    tldr: 'Çoğu Bluetooth kulaklıkta sıfırlama, şarj kutusundaki veya kulaklık üzerindeki düğmeye 10-15 saniye basılı tutmakla yapılır; ışık belirli bir renkte yanıp sönmeye başladığında sıfırlama tamamlanmış olur. Kesin adımlar markaya göre değişir.',
    body: [
      'Bluetooth kulaklıklarda sıfırlama, genelde bağlantı sorunları çözülmediğinde veya kulaklık başka bir kullanıcıya/cihaza devredileceğinde başvurulan bir adımdır. En yaygın yöntem, kulaklığı şarj kutusuna koyup kapağı açık bırakarak, kutu veya kulaklık üzerindeki düğmeye (varsa) 10-15 saniye basılı tutmaktır.',
      'Sıfırlama tamamlandığında genelde LED ışık birkaç kez yanıp söner veya renk değiştirir — bu, kulaklığın önceki eşleştirme bilgilerini sildiğinin ve yeniden eşleştirmeye hazır olduğunun işaretidir.',
      'Bazı modellerde fiziksel bir düğme yerine, kulaklığın kendi mobil uygulaması üzerinden "Fabrika Ayarlarına Sıfırla" seçeneği bulunur — üreticinin resmi uygulaması varsa, bu yöntem genelde daha güvenilir sonuç verir.',
      'Sıfırlamadan önce, kulaklığın daha önce eşleştiği tüm telefonlarda/bilgisayarlarda Bluetooth ayarlarından "unutulması" (kaldırılması) önerilir — aksi halde sıfırlama sonrası yeniden eşleştirme sırasında çakışma yaşanabilir.',
    ],
    faq: [
      { q: 'Kulaklığımı sıfırlarsam müzik/ayarlar silinir mi?', a: 'Hayır, sıfırlama sadece Bluetooth eşleştirme bilgilerini siler. Kulaklığın kendisinde müzik veya kişisel veri saklanmaz, bu yüzden veri kaybı riski yoktur.' },
      { q: 'Sıfırlama düğmesi her markada aynı yerde mi?', a: 'Hayır, konumu ve basma süresi markaya/modele göre değişir. Kesin adımlar için ürünün kendi kullanım kılavuzuna bakmak en güvenilir yoldur.' },
    ],
  },
  {
    slug: 'bluetooth-kulaklik-nasil-baglanir', title: 'Bluetooth Kulaklık Telefona/Bilgisayara Nasıl Bağlanır?',
    pillar: 'kulaklik-nasil-secilir', subLink: 'kablosuz-kulaklik',
    tldr: 'Kulaklığı eşleştirme moduna almak (genelde şarj kutusundan çıkarınca otomatik veya bir düğmeye basarak), ardından telefon/bilgisayarın Bluetooth ayarlarından kulaklığı bulup seçmek, çoğu modelde bağlantıyı birkaç saniyede tamamlar.',
    body: [
      'İlk eşleştirmede kulaklık genelde "eşleştirme modu"na otomatik geçer — bu, şarj kutusundan ilk kez çıkarıldığında veya güç düğmesine belirli bir süre basılı tutulduğunda gerçekleşir ve LED ışığın hızlı yanıp sönmesiyle belli olur.',
      'Telefon veya bilgisayar tarafında, Ayarlar > Bluetooth (veya benzeri) menüsü açılıp "Cihaz Ekle" seçilir; kulaklık, yakındaki cihazlar listesinde markasıyla (örn. "JBL Tune") görünür ve dokunularak/seçilerek bağlantı tamamlanır.',
      'İlk eşleştirmeden sonraki bağlantılar genelde otomatiktir — kulaklık açıldığında, daha önce eşleştiği ve Bluetooth\'u açık olan bir cihaza kendiliğinden bağlanır, tekrar "Cihaz Ekle" yapmaya gerek kalmaz.',
      'Bağlantı kurulamıyorsa, kulaklığın diğer cihazlardan (örneğin farklı bir telefondan) bağlı olmadığından emin olunmalı — çoğu Bluetooth kulaklık aynı anda sadece bir cihaza aktif olarak bağlanabilir (multipoint destekleyen modeller hariç).',
    ],
    faq: [
      { q: 'Kulaklık listede görünmüyor, ne yapmalıyım?', a: 'Kulaklığın eşleştirme modunda olduğundan (LED hızlı yanıp sönüyor mu) emin olun, telefonun Bluetooth\'unu kapatıp açın ve kulaklığı şarj kutusundan çıkarıp tekrar deneyin.' },
      { q: 'Kulaklık aynı anda iki telefona bağlanabilir mi?', a: 'Sadece "multipoint" özelliğini destekleyen modellerde mümkündür. Standart modeller aynı anda yalnızca bir cihaza aktif bağlanabilir.' },
    ],
  },
  {
    slug: 'bluetooth-kulaklik-iki-cihaza-baglanma', title: 'Bluetooth Kulaklık İki Cihaza Aynı Anda Nasıl Bağlanır? (Multipoint)',
    pillar: 'kulaklik-nasil-secilir', subLink: 'kablosuz-kulaklik',
    tldr: 'Multipoint özelliğini destekleyen kulaklıklar, aynı anda iki cihaza (örneğin telefon ve dizüstü bilgisayar) bağlı kalabilir ve aralarında otomatik/manuel geçiş yapabilir; bu özellik her modelde bulunmaz, satın almadan önce ürün özelliklerinden kontrol edilmelidir.',
    body: [
      'Multipoint (çoklu nokta bağlantısı), bir Bluetooth kulaklığın aynı anda iki farklı cihazla (örneğin bir telefon ve bir dizüstü bilgisayar) bağlantı kurmasını sağlayan bir teknolojidir. Bu sayede, bilgisayarda müzik dinlerken gelen bir telefon aramasını, cihazlar arası manuel geçiş yapmadan yanıtlayabilirsiniz.',
      'Bu özelliğin çalışabilmesi için hem kulaklığın hem de her iki cihazın (genelde) multipoint\'i desteklemesi gerekir — tüm kablosuz kulaklıklar bu özelliğe sahip değildir, bu yüzden ürün açıklamasında açıkça belirtilip belirtilmediğini kontrol etmek önemlidir.',
      'Kurulum genelde her iki cihaza da normal Bluetooth eşleştirme adımlarıyla ayrı ayrı bağlanmayı gerektirir; bazı modellerde bu, kulaklığın kendi uygulamasından multipoint özelliğinin ayrıca etkinleştirilmesini de gerektirebilir.',
      'Bazı kullanıcılar multipoint aktifken ara sıra ses kesintisi veya gecikme yaşayabilir — bu, iki bağlantının aynı anda yönetilmesinin getirdiği küçük bir teknik yük olarak kabul edilir, çoğu modern kulaklıkta fark edilmeyecek düzeydedir.',
    ],
    faq: [
      { q: 'Her Bluetooth kulaklıkta multipoint var mı?', a: 'Hayır, bu özellik tüm modellerde bulunmaz. Satın almadan önce ürünün teknik özelliklerinde "multipoint" veya "çoklu cihaz bağlantısı" ifadesinin geçip geçmediğini kontrol etmek gerekir.' },
      { q: 'Multipoint kullanırken pil daha mı hızlı biter?', a: 'İki bağlantıyı aynı anda yönetmek, tek bağlantıya göre biraz daha fazla enerji tüketebilir, ancak bu fark çoğu modern kulaklıkta belirgin bir pil ömrü kaybına yol açmaz.' },
    ],
  },
  {
    slug: 'bluetooth-kulaklik-tek-taraf-calismiyor', title: 'Bluetooth Kulaklığın Bir Tarafı Çalışmıyor mu? Çözümler',
    pillar: 'kulaklik-nasil-secilir', subLink: 'kablosuz-kulaklik',
    tldr: 'En sık nedenler, iki kulaklık parçası arasındaki senkronizasyonun bozulması, şarj kontaklarında kir/toz birikimi veya pil seviyesinin biri diğerinden önce bitmesidir; her iki parçayı şarj kutusuna koyup senkronizasyonu sıfırlamak çoğu durumda sorunu çözer.',
    body: [
      'Kulak içi (TWS) kulaklıklarda iki parça birbirleriyle kablosuz olarak senkronize çalışır — bu senkronizasyon zaman zaman bozulabilir ve bir tarafın sessiz kalmasına neden olabilir. İlk ve en etkili çözüm, her iki parçayı da şarj kutusuna koyup kapağı kapatmak, birkaç saniye beklemek ve tekrar çıkarmaktır; bu, çoğu zaman senkronizasyonu otomatik olarak yeniler.',
      'Şarj kutusundaki veya kulaklık üzerindeki metal kontak noktalarında biriken kir, toz veya nem, şarjın düzgün gerçekleşmemesine ve bir tarafın diğerinden daha az şarj almasına neden olabilir. Kuru, yumuşak bir bezle bu kontakların düzenli temizlenmesi önerilir.',
      'İki parçanın pil kullanım süreleri zamanla eşit ilerlemez — biri diğerinden daha aktif kullanılıyorsa (örneğin tek kulaklık modunda konuşurken) daha hızlı biter. Bu durumda sorun senkronizasyon değil, basitçe o tarafın şarjının bitmiş olmasıdır.',
      'Yukarıdaki adımlar işe yaramazsa, telefon/bilgisayarın Bluetooth ayarlarından kulaklığı "unutup" sıfırdan eşleştirmek genelde kalıcı bir çözüm sağlar — bu, kulaklık ile cihaz arasındaki eski bağlantı bilgisini temizler.',
    ],
    faq: [
      { q: 'Bir taraf hiç şarj olmuyor, ne yapmalıyım?', a: 'Önce şarj kutusundaki ve kulaklıktaki kontak noktalarını temizleyin. Bu işe yaramazsa, o tarafın pilinde kalıcı bir arıza olabilir — garanti kapsamındaysa yetkili servise başvurmak en güvenli yoldur.' },
      { q: 'Senkronizasyon sıfırlama veri kaybına yol açar mı?', a: 'Hayır, bu işlem sadece iki kulaklık parçası arasındaki bağlantı senkronizasyonunu yeniler; herhangi bir kişisel veri veya ayar silinmez.' },
    ],
  },
  {
    slug: 'bluetooth-kulaklik-ses-goruntu-gecikmesi', title: 'Bluetooth Kulaklıkta Ses-Görüntü Gecikmesi (Lag) Neden Olur?',
    pillar: 'kulaklik-nasil-secilir', subLink: 'kablosuz-kulaklik',
    tldr: 'Gecikme, kullanılan Bluetooth ses kodeğinin (SBC gibi eski kodekler daha yavaş, aptX/LDAC gibi yeni kodekler daha hızlıdır) ve cihazlar arası kablosuz sinyal işleme süresinin bir sonucudur; video/oyun için "düşük gecikme" moduna sahip kulaklıklar bu sorunu büyük ölçüde azaltır.',
    body: [
      'Bluetooth ses aktarımı, sesi sıkıştırıp kablosuz olarak gönderip alıcı cihazda tekrar açma (kodek işleme) sürecini içerir — bu işlem, kablolu bağlantıya göre doğal olarak birkaç milisaniyelik bir gecikme ekler. Çoğu durumda bu fark fark edilmez, ama video izlerken dudak hareketleriyle sesin uyumsuz görünmesine neden olabilecek kadar büyüyebilir.',
      'Kullanılan ses kodeği gecikme süresini doğrudan etkiler — SBC (en yaygın, temel kodek) görece daha yüksek gecikmeye sahipken, aptX Low Latency veya benzeri "düşük gecikme" kodekleri özellikle bu sorunu azaltmak için tasarlanmıştır.',
      'Bazı kulaklıklar ve telefonlar, video izlerken veya oyun oynarken manuel olarak açılabilen bir "Oyun Modu" veya "Düşük Gecikme Modu" sunar — bu mod aktifken ses kalitesinden küçük bir ödün verilse de, senkronizasyon belirgin şekilde iyileşir.',
      'Gecikme sorunu bazen kaynak cihazın kendisinden de kaynaklanabilir — eski bir telefon/bilgisayarın Bluetooth donanımı veya güncel olmayan sürücüler, gecikmeyi normalden fazla artırabilir.',
    ],
    faq: [
      { q: 'Hangi kodek en düşük gecikmeyi sunar?', a: 'aptX Low Latency ve benzeri özel "düşük gecikme" kodekleri bu amaçla tasarlanmıştır; standart SBC kodeği genelde en yüksek gecikmeye sahiptir.' },
      { q: 'Oyun modu ses kalitesini düşürür mü?', a: 'Genelde evet, hafif bir ödün olur — gecikmeyi azaltmak için ses işleme önceliklendirilir. Ancak bu fark çoğu kullanıcı için, senkronizasyon kazanımına değecek kadar küçüktür.' },
    ],
  },
  {
    slug: 'bluetooth-kulaklik-pil-omru-nasil-uzatilir', title: 'Bluetooth Kulaklığın Pil Ömrü Nasıl Uzatılır?',
    pillar: 'kulaklik-nasil-secilir', subLink: 'kablosuz-kulaklik',
    tldr: 'Ses seviyesini gereğinden yüksek tutmamak, aktif gürültü engellemeyi (ANC) sadece gerektiğinde açmak ve kulaklığı sürekli tam dolu/tam boş durumda bırakmamak, günlük kullanım ömrünü ve pilin uzun vadeli sağlığını korumaya yardımcı olan başlıca alışkanlıklardır.',
    body: [
      'Ses seviyesi, pil tüketimini doğrudan etkileyen en somut faktörlerden biridir — yüksek sesle dinleme, hoparlörün daha fazla güç çekmesine neden olur. Orta seviyede bir ses düzeyi, hem işitme sağlığı hem pil ömrü açısından daha avantajlıdır.',
      'Aktif gürültü engelleme (ANC), sürekli çalışan mikrofon ve işlemci gerektirdiği için pil tüketimini belirgin şekilde artırır. Sessiz bir ortamda (evde, ofiste) ANC\'yi kapatmak, günlük kullanım süresini uzatabilir.',
      'Lityum bazlı piller (kulaklıklarda kullanılan tip), sürekli %100\'de tutulmak veya tamamen bitene kadar kullanılmak yerine, orta aralıkta (yaklaşık %20-80) şarj döngüsüyle daha uzun ömürlü olur — bu, telefon pilleri için geçerli genel prensibin kulaklıklar için de büyük ölçüde geçerli olmasıdır.',
      'Kulaklığı uzun süre (haftalarca) kullanmayacaksanız, tamamen boş veya tamamen dolu bırakmak yerine yaklaşık yarı şarjlı halde, serin ve kuru bir yerde saklamak, pilin uzun vadeli kapasitesini korumaya yardımcı olur.',
    ],
    faq: [
      { q: 'ANC kapatınca pil ne kadar uzar?', a: 'Bu modele göre değişir, ama genelde ANC kapalıyken kulaklıklar belirgin şekilde (bazı modellerde %20-40 oranında) daha uzun süre dayanabilir.' },
      { q: 'Kulaklığı her gece şarja takmak zararlı mı?', a: 'Modern kulaklıklar genelde tam şarj olunca şarj almayı otomatik keser, bu yüzden gece boyu şarjda bırakmak büyük bir risk oluşturmaz — ama uzun vadede sürekli %100\'de tutmak yerine ara sıra daha düşük şarj seviyesinde kullanmak pil sağlığı için daha iyidir.' },
    ],
  },

  {
    slug: 'telefon-asiri-isinma-nasil-onlenir', title: 'Telefon Neden Isınır? Aşırı Isınmayı Önlemenin Yolları',
    pillar: 'telefon-nasil-secilir', subLink: 'oyuncu-telefonlari',
    tldr: 'Doğrudan güneş ışığı, ağır oyun/video çekimi sırasında şarj etme ve arka planda çok sayıda uygulama açık tutmak, telefonların en sık ısınma nedenleridir; kılıf çıkarmak ve arka plan uygulamalarını kapatmak hızlı bir rahatlama sağlar.',
    body: [
      'Telefonların ısınmasının en yaygın nedeni, işlemcinin yoğun görevler (ağır oyun, uzun süreli video çekimi, GPS navigasyon) sırasında normalden çok daha fazla ısı üretmesidir. Bu, donanımın doğal bir sonucu ve genelde zararlı değildir, ama uzun süre devam ederse performans düşüşüne (thermal throttling) yol açabilir.',
      'Doğrudan güneş ışığında bırakılan bir telefon, hem kendi ısınmasına hem de güneşin ek ısısına maruz kalır — bu kombinasyon özellikle yaz aylarında hızlı bir sıcaklık artışına neden olur. Telefonu doğrudan güneş ışığından uzak tutmak basit ama etkili bir önlemdir.',
      'Kalın, hava akışını engelleyen kılıflar da ısının dağılmasını zorlaştırır — özellikle şarj olurken veya ağır kullanım sırasında kılıfı çıkarmak, telefonun daha hızlı soğumasına yardımcı olur.',
      'Arka planda çalışan gereksiz uygulamalar (özellikle konum servisi veya internet kullanan uygulamalar) sürekli işlemci kullanımına neden olarak ısınmayı artırır — bu uygulamaları kapatmak hem ısınmayı azaltır hem pil ömrünü uzatır.',
      'Telefon oyun oynarken veya video çekerken aynı zamanda şarj ediliyorsa, ısınma belirgin şekilde artar — mümkünse yoğun kullanım sırasında şarj etmekten kaçınmak önerilir.',
    ],
    faq: [
      { q: 'Telefon ısınması zararlı mı?', a: 'Kısa süreli ısınma genelde zararsızdır ve donanımın doğal tepkisidir. Ancak sürekli aşırı ısınma, pil ömrünü kısaltabilir ve performans düşüşüne (thermal throttling) yol açabilir.' },
      { q: 'Telefon şarj olurken neden daha çok ısınıyor?', a: 'Şarj işlemi kendi başına ısı üretir; eğer aynı anda ağır bir uygulama da kullanılıyorsa, işlemci ve şarj devresinin ısıları birleşerek daha belirgin bir ısınmaya neden olur.' },
    ],
  },
  {
    slug: 'yeni-telefona-veri-nasil-aktarilir', title: 'Yeni Telefona Kişiler ve WhatsApp Nasıl Aktarılır?',
    pillar: 'telefon-nasil-secilir', subLink: 'android-telefonlar',
    tldr: 'Google hesabı (Android) veya iCloud (iPhone) senkronizasyonu kişileri otomatik aktarır; WhatsApp ise kendi yerleşik "Sohbetleri Taşı" özelliğiyle (aynı işletim sistemi arasında) ya da yedekten geri yükleme yoluyla aktarılır.',
    body: [
      'Kişi aktarımı için en güvenilir yöntem, eski telefonda kişilerin Google hesabıyla (Android) veya iCloud ile (iPhone) senkronize olduğundan emin olmaktır — bu durumda yeni telefonda aynı hesapla oturum açıldığında kişiler otomatik olarak görünür, manuel bir işlem gerekmez.',
      'Aynı işletim sistemi arasında (Android\'den Android\'e veya iPhone\'dan iPhone\'a) geçişte, WhatsApp\'ın kendi "Sohbetleri Taşı" özelliği kullanılabilir — bu araç, iki telefonu kablosuz veya kablolu bağlayarak sohbet geçmişini doğrudan aktarır.',
      'Farklı işletim sistemleri arasında (Android\'den iPhone\'a veya tersi) geçişte WhatsApp\'ın kendi göç aracı kullanılabilir, ancak bu işlem için her iki telefonun da güncel WhatsApp sürümüne sahip olması ve işlem sırasında aynı Wi-Fi ağında bulunması genelde gereklidir.',
      'Alternatif olarak, WhatsApp sohbetleri Google Drive (Android) veya iCloud (iPhone) üzerine yedeklenip, yeni telefonda WhatsApp kurulumu sırasında bu yedekten geri yüklenebilir — ancak yedekleme tarihinden sonraki mesajlar bu yöntemle aktarılamaz.',
    ],
    faq: [
      { q: 'WhatsApp sohbetleri farklı marka telefonlar arasında aktarılabilir mi?', a: 'Evet, WhatsApp\'ın kendi göç aracı veya Google Drive/iCloud yedeği üzerinden farklı marka (hatta farklı işletim sistemi) telefonlar arasında da aktarım yapılabilir.' },
      { q: 'Kişiler telefon değiştirince neden bazen kaybolur?', a: 'Kişiler telefonun kendi hafızasına (SIM kart veya cihaz belleği) kaydedilmiş, bir bulut hesabıyla senkronize edilmemişse, yeni telefona otomatik geçmez — bu yüzden önceden Google/iCloud hesabıyla senkronize etmek önerilir.' },
    ],
  },
  {
    slug: 'sarj-olmayan-telefon-nasil-duzeltilir', title: 'Telefon Şarj Olmuyor mu? Denenebilecek Çözümler',
    pillar: 'telefon-nasil-secilir', subLink: 'butce-dostu-telefonlar',
    tldr: 'Şarj sorununun en sık nedenleri kirli/hasarlı şarj kablosu-adaptörü, şarj portundaki toz/kir birikimi ve arka planda aşırı kaynak tüketen uygulamalardır; bunları tek tek elemek çoğu durumda sorunu çözer.',
    body: [
      'İlk kontrol edilmesi gereken, kablo ve adaptörün kendisidir — farklı bir kablo/adaptör ile denemek, sorunun telefonda mı yoksa aksesuarda mı olduğunu hızlıca ayırt etmeye yardımcı olur. Kablolar zamanla iç kısımdan yıpranıp görünüşte sağlam kalabilir.',
      'Şarj portunda biriken toz, tüy veya kir, fişin tam oturmasını engelleyip şarjın kesik kesik olmasına veya hiç başlamamasına neden olabilir. Telefon kapalıyken, yumuşak bir fırça veya basınçlı hava ile (metal bir cisim kullanmadan) port nazikçe temizlenebilir.',
      'Bazı telefonlar, aşırı ısındığında güvenlik amacıyla şarjı otomatik olarak yavaşlatır veya durdurur — eğer telefon sıcaksa, biraz soğumasını bekleyip tekrar denemek makul bir ilk adımdır.',
      'Yazılım kaynaklı sorunlar da (nadiren) şarj göstergesinin yanlış çalışmasına neden olabilir — telefonu yeniden başlatmak, bu tür geçici yazılım hatalarını genelde giderir.',
      'Yukarıdakilerin hiçbiri işe yaramazsa, sorun büyük ihtimalle telefonun kendi şarj devresinde veya bataryasındadır — bu noktada yetkili servise başvurmak en güvenli seçenektir, kendi başına söküp takma denenmemelidir.',
    ],
    faq: [
      { q: 'Telefon şarja takılı ama yüzde artmıyor, ne yapmalıyım?', a: 'Önce farklı bir kablo/adaptör deneyin, şarj portunu kontrol edin ve telefonu yeniden başlatın. Bunlar işe yaramazsa yetkili servise başvurmak en güvenli yoldur.' },
      { q: 'Şarj portunu kendim temizleyebilir miyim?', a: 'Telefon kapalıyken, yumuşak bir fırça veya basınçlı hava ile nazikçe temizlenebilir. Metal bir cisim (iğne, ataş gibi) kullanmak port pinlerine zarar verebileceği için önerilmez.' },
    ],
  },
  {
    slug: 'kayip-android-telefon-nasil-bulunur', title: 'Kayıp Android Telefon Nasıl Bulunur?',
    pillar: 'telefon-nasil-secilir', subLink: 'android-telefonlar',
    tldr: 'Google\'ın ücretsiz "Telefonumu Bul" (Find My Device) hizmeti, kayıp/çalınmış bir Android telefonun konumunu haritada gösterir, zil çaldırabilir, kilitleyebilir veya gerekirse verilerini uzaktan silebilir — tek şart, telefonun açık ve internete bağlı olmasıdır.',
    body: [
      'Google\'ın "Telefonumu Bul" özelliği, aynı Google hesabıyla oturum açılmış herhangi bir tarayıcıdan (android.com/find adresinden) veya başka bir Android cihazdaki uygulamadan erişilebilir. Bu özelliğin çalışması için, kayıp telefonda konum servislerinin ve bu özelliğin önceden (Ayarlar > Google > Telefonumu Bul) açık olması gerekir.',
      'Telefon bulunduğunda haritada yaklaşık konumu görünür; ayrıca telsesiz modda bile olsa yüksek sesle zil çaldırma seçeneği, telefonun yakın bir yerde (evde, arabada) kaybolduğu durumlarda çok işe yarar.',
      'Telefonun çalınmış olabileceği düşünülüyorsa, "Cihazı Kilitle" seçeneği ekrana bir mesaj ve telefon numarası göstererek bulan kişinin iletişime geçmesini sağlayabilir; verilerin güvenliği önemliyse "Cihazı Sil" seçeneği tüm kişisel verileri uzaktan kalıcı olarak siler.',
      'Bu özelliğin çalışabilmesi için telefonun açık, internete bağlı (Wi-Fi veya mobil veri) ve konum servislerinin aktif olması gerekir — telefon kapalıysa veya internete bağlı değilse, sadece en son bilinen konum gösterilir.',
    ],
    faq: [
      { q: 'Telefonum kapalıysa yine de bulunabilir mi?', a: 'Hayır, gerçek zamanlı takip için telefonun açık ve internete bağlı olması gerekir. Kapalıyken sadece cihazın en son bağlı olduğu konum gösterilir.' },
      { q: 'Telefonumu Bul özelliğini nasıl önceden aktif ederim?', a: 'Ayarlar > Google > Telefonumu Bul yolundan, bu özelliğin açık olduğundan önceden emin olunmalı — kayıp olduktan sonra aktif etmek mümkün değildir.' },
    ],
  },
  {
    slug: 'android-telefon-yedekleme-nasil-yapilir', title: 'Android Telefon Nasıl Yedeklenir?',
    pillar: 'telefon-nasil-secilir', subLink: 'butce-dostu-telefonlar',
    tldr: 'Google hesabı üzerinden Ayarlar > Sistem > Yedekleme yolundan, uygulamalar, kişiler, takvim ve fotoğraflar (Google Photos ile) otomatik olarak buluta yedeklenebilir; bu, telefon değişikliği veya veri kaybı durumunda geri yükleme için en pratik yöntemdir.',
    body: [
      'Android\'in yerleşik yedekleme özelliği (Ayarlar > Sistem > Yedekleme, marka arayüzüne göre yeri değişebilir), uygulama verilerini, arama geçmişini, kişileri ve cihaz ayarlarını otomatik olarak Google hesabına bağlı buluta kaydeder.',
      'Fotoğraf ve videolar için Google Photos ayrı bir uygulama olarak çalışır ve "Yedekle ve Senkronize Et" özelliği açıldığında, çekilen her fotoğraf otomatik olarak buluta yüklenir — bu, telefon kaybolsa veya değişse bile fotoğrafların güvende kalmasını sağlar.',
      'Uygulama içi veriler (oyun ilerlemesi, not uygulamaları gibi) bazen genel yedeklemeye dahil olmayabilir — bu tür uygulamalar genelde kendi hesap sistemleri (örneğin bir oyun hesabı) üzerinden ayrı senkronize edilir.',
      'Yeni bir telefona geçerken, kurulum sırasında "Yedekten Geri Yükle" seçeneği sunulur — burada eski cihazın yedeği seçildiğinde, uygulamalar ve ayarlar büyük ölçüde otomatik olarak yeni telefona aktarılır.',
    ],
    faq: [
      { q: 'Android yedekleme ücretsiz mi?', a: 'Google hesabına bağlı temel yedekleme ücretsizdir, ancak Google Drive/Photos depolama alanı sınırlıdır (genelde 15GB paylaşımlı) — bu sınır aşılırsa ek depolama satın almak gerekebilir.' },
      { q: 'Yedekleme ne sıklıkla yapılır?', a: 'Otomatik yedekleme genelde telefon şarjdayken, Wi-Fi\'a bağlıyken ve ekran kapalıyken düzenli aralıklarla kendiliğinden gerçekleşir; manuel olarak da Ayarlar üzerinden anlık tetiklenebilir.' },
    ],
  },
  {
    slug: 'mobil-hotspot-nedir', title: 'Mobil Hotspot Nedir? Nasıl Kullanılır?',
    pillar: 'telefon-nasil-secilir', subLink: 'butce-dostu-telefonlar',
    tldr: 'Mobil hotspot, bir telefonun kendi mobil veri bağlantısını Wi-Fi sinyaline çevirerek diğer cihazlara (dizüstü, tablet) internet paylaşmasını sağlayan bir özelliktir; kullanımı telefonun kendi mobil veri paketini tüketir.',
    body: [
      'Mobil hotspot (bazı yerlerde "Kişisel Erişim Noktası" olarak da adlandırılır), telefonun operatörden aldığı mobil internet bağlantısını, bir Wi-Fi yönlendirici gibi başka cihazlara aktarmasını sağlar. Bu sayede, örneğin bir dizüstü bilgisayar, Wi-Fi ağı olmayan bir ortamda telefon üzerinden internete bağlanabilir.',
      'Özellik genelde Ayarlar > Bağlantılar (veya Ağ ve İnternet) > Mobil Hotspot yolundan açılır; burada bir ağ adı ve şifre belirlenip, diğer cihazlar bu ağa normal bir Wi-Fi ağına bağlanır gibi bağlanabilir.',
      'Hotspot üzerinden kullanılan veri, telefonun kendi mobil veri paketinden düşer — sınırlı bir veri paketi varsa, hotspot kullanımı paketin hızla tükenmesine neden olabilir. Bazı operatörler hotspot kullanımını ayrı bir kotaya tabi tutabilir.',
      'Güvenlik açısından, hotspot ağına güçlü bir şifre konması ve kullanılmadığında kapatılması önerilir — açık bırakılan bir hotspot, yakındaki cihazların izinsiz bağlanıp veri paketini tüketmesine yol açabilir.',
    ],
    faq: [
      { q: 'Hotspot kullanmak ekstra ücrete tabi mi?', a: 'Bu operatöre göre değişir — bazı tarife paketlerinde hotspot kullanımı normal veriden düşerken, bazılarında ayrı bir limit veya ek ücret uygulanabilir. Operatörünüzün tarife detaylarını kontrol etmekte fayda var.' },
      { q: 'Hotspot açıkken telefon pili daha mı hızlı biter?', a: 'Evet, hotspot hem mobil veri hem Wi-Fi vericisini aktif tuttuğu için normal kullanıma göre pili belirgin şekilde daha hızlı tüketir.' },
    ],
  },

  {
    slug: 'laptop-pil-sagligi-nasil-kontrol-edilir', title: 'Dizüstü Bilgisayarda Pil Sağlığı Nasıl Kontrol Edilir?',
    pillar: 'dizustu-bilgisayar-nasil-secilir', subLink: 'ultrabook',
    tldr: 'Windows\'ta yerleşik "powercfg /batteryreport" komutu, macOS\'ta ise sistem bilgisi menüsündeki "Pil Sağlığı" bölümü, ek bir yazılım kurmadan pilin gerçek kapasitesini ve döngü sayısını gösterir.',
    body: [
      'Windows\'ta pil sağlığını kontrol etmenin en güvenilir yolu, üçüncü parti bir uygulama kurmak yerine işletim sisteminin kendi komut satırı aracını kullanmaktır. Komut istemini (CMD) yönetici olarak açıp "powercfg /batteryreport" yazıldığında, sistem bir HTML raporu oluşturur; bu raporda pilin "Tasarım Kapasitesi" ile "Şu Anki Tam Şarj Kapasitesi" karşılaştırılarak gerçek yıpranma oranı görülebilir.',
      'macOS kullanıcıları için süreç daha basit: Apple menüsü → Bu Mac Hakkında → Sistem Raporu → Güç bölümünde "Döngü Sayısı" ve "Durum" (Normal/Servis Önerilir) bilgisi doğrudan görüntülenir. Apple, belirli bir döngü sayısını aştığında pilin değiştirilmesini önerebilir.',
      'Genel bir kural olarak, tasarım kapasitesinin %80\'inin altına düşen bir pil, artık belirgin şekilde daha kısa kullanım süresi sunuyor demektir — bu noktada pil değişimi düşünülebilir.',
      'Pil sağlığını korumak için sürekli %100\'de tutmak yerine %20-80 aralığında şarj seviyesini yönetmek, uzun vadede pilin ömrünü uzatan yaygın bir tavsiyedir (birçok üretici artık bunu otomatikleştiren "şarj sınırlama" özellikleri sunuyor).',
    ],
    faq: [
      { q: 'Powercfg raporu nasıl açılır?', a: 'Komut istemini (CMD) yönetici olarak açıp "powercfg /batteryreport" yazmak yeterli — sistem bir HTML dosyası oluşturur ve konumunu ekrana yazdırır.' },
      { q: 'Pil sağlığı yüzde kaça düşünce değiştirilmeli?', a: 'Genel kabul gören eşik, tasarım kapasitesinin %80\'inin altına düşmesidir — bu noktada kullanım süresi belirgin şekilde kısalmış olur.' },
    ],
  },
  {
    slug: 'laptop-ram-nasil-takilir', title: 'Dizüstü Bilgisayara RAM Nasıl Takılır? Adım Adım Rehber',
    pillar: 'dizustu-bilgisayar-nasil-secilir', subLink: 'is-laptoplari',
    tldr: 'RAM takmadan önce cihazın kapağının açılabilir (kullanıcı tarafından yükseltilebilir) bir modele sahip olup olmadığı kontrol edilmeli; bazı ince/ultrabook modellerde RAM anakarta lehimlenmiş olabilir ve hiç değiştirilemez.',
    body: [
      'İlk ve en önemli adım, cihazın kılavuzundan ya da üreticinin sitesinden, o modelin RAM\'inin kullanıcı tarafından değiştirilebilir olup olmadığını doğrulamaktır. Özellikle ultra ince dizüstülerde RAM çoğu zaman anakarta doğrudan lehimlenir ve hiçbir şekilde değiştirilemez.',
      'Yükseltme mümkünse, öncelikle cihaz kapatılıp fişten çekilmeli, pil (çıkarılabilir tipteyse) sökülmeli ve statik elektriği boşaltmak için topraklanmış bir yüzeye dokunulmalıdır — statik deşarj, hassas elektronik bileşenlere zarar verebilir.',
      'Alt kapak, üreticinin belirttiği vidalar sökülerek açılır. RAM yuvaları genelde ince, dikdörtgen soketler şeklindedir; mevcut RAM modülü yandaki kilit klipsleri açılarak 30 derecelik bir açıyla nazikçe çekilip çıkarılır.',
      'Yeni modül takılırken, üzerindeki çentiğin yuvadaki çıkıntıyla hizalanması gerekir — modül yanlış yönde asla zorlanmamalıdır. Modül yuvaya açılı şekilde yerleştirilip, klipsler kilitlenene kadar hafifçe aşağı bastırılır.',
      'Yeni RAM\'in mevcut olanla aynı tip (örneğin DDR4 veya DDR5) ve mümkünse aynı hız değerine sahip olması, uyumluluk sorunlarını önler — farklı hızda modüller birlikte çalışabilir ama sistem genelde yavaş olanın hızında çalışır.',
    ],
    faq: [
      { q: 'Her dizüstüde RAM değiştirilebilir mi?', a: 'Hayır. Özellikle ince/ultrabook modellerde RAM anakarta lehimli olabilir ve hiçbir şekilde değiştirilemez — önce üretici belgelerinden kontrol edilmeli.' },
      { q: 'Farklı hızda iki RAM modülü birlikte kullanılabilir mi?', a: 'Genelde birlikte çalışır ama sistem, iki modülden yavaş olanın hızında çalışmaya geçer — bu yüzden aynı hızda modüller tercih edilmeli.' },
    ],
  },
  {
    slug: 'yavas-laptop-nasil-hizlandirilir', title: 'Yavaşlayan Dizüstü Bilgisayar Nasıl Hızlandırılır?',
    pillar: 'dizustu-bilgisayar-nasil-secilir', subLink: 'ogrenci-laptoplari',
    tldr: 'Başlangıçta otomatik açılan gereksiz programları kapatmak, disk alanını boşaltmak ve HDD kullanan modellerde SSD\'ye geçmek, çoğu yavaşlama şikayetinde en büyük ve kalıcı farkı yaratan üç adımdır.',
    body: [
      'Yavaşlamanın en yaygın nedenlerinden biri, sistem açılışında otomatik başlayan gereksiz uygulamalardır. Windows\'ta Görev Yöneticisi → Başlangıç sekmesinden, arka planda sürekli çalışmasına gerek olmayan programlar devre dışı bırakılabilir; bu, özellikle açılış süresini belirgin şekilde kısaltır.',
      'Disk alanının dolmaya yakın olması (özellikle sistem sürücüsünde), işletim sisteminin geçici dosyalar için yer bulamamasına ve genel yavaşlamaya yol açar. Disk Temizleme aracı veya büyük/gereksiz dosyaların manuel silinmesi bu sorunu giderir.',
      'Hâlâ HDD (mekanik disk) kullanan bir dizüstüde, SSD\'ye geçiş muhtemelen yapılabilecek en etkili tek yükseltmedir — açılış ve program yükleme süreleri kat kat kısalır, çünkü SSD\'nin veri erişim hızı HDD\'ye göre çok daha yüksektir.',
      'Arka planda çalışan gereksiz tarayıcı sekmeleri ve uygulamalar da RAM tüketimini artırıp genel performansı düşürür — özellikle düşük RAM\'li (4-8GB) sistemlerde bu etki daha belirgin hissedilir.',
      'Bazı durumlarda malware/istenmeyen yazılımlar da yavaşlamaya sebep olabilir; güncel bir antivirüs taraması, bu ihtimali dışlamak için makul bir ilk adımdır.',
    ],
    faq: [
      { q: 'SSD yükseltmesi gerçekten fark yaratır mı?', a: 'Evet, genellikle en etkili tek yükseltmedir — HDD\'den SSD\'ye geçiş açılış ve dosya erişim sürelerini kat kat kısaltır.' },
      { q: 'Başlangıç programlarını nasıl kapatırım?', a: 'Windows\'ta Görev Yöneticisi\'ni açıp "Başlangıç" sekmesinden gereksiz uygulamaları seçip devre dışı bırakabilirsiniz.' },
    ],
  },
  {
    slug: 'laptop-harici-ekrana-nasil-baglanir', title: 'Dizüstü Bilgisayar Harici Monitöre/Projektöre Nasıl Bağlanır?',
    pillar: 'dizustu-bilgisayar-nasil-secilir', subLink: 'is-laptoplari',
    tldr: 'Dizüstünün HDMI, USB-C (DisplayPort Alt Mode) veya USB-A çıkışlarından biri, monitör/projektörün girişine uygun bir kabloyla bağlanır; ardından işletim sistemi genelde ekranı otomatik algılar veya kısayol tuşuyla görüntü modu seçilir.',
    body: [
      'İlk adım, dizüstüdeki mevcut video çıkışını belirlemektir — çoğu modern dizüstü HDMI portu taşır, ince ultrabook modellerde ise genelde USB-C (DisplayPort Alt Mode destekliyorsa) üzerinden görüntü aktarımı yapılır. Bağlanacak monitör veya projektörün giriş tipine uygun kablo/adaptör seçilmelidir.',
      'Kablo bağlandıktan sonra Windows genelde ekranı otomatik algılar; algılamazsa Windows tuşu + P kısayolu ile "Yalnızca bilgisayar ekranı", "Çoğalt", "Genişlet" veya "Yalnızca ikinci ekran" seçeneklerinden biri seçilebilir. macOS\'ta ise Sistem Ayarları → Ekranlar bölümünden bağlantı yönetilir.',
      'Projektöre bağlanırken görüntü gelmiyorsa, öncelikle projektörün doğru giriş kaynağına (HDMI1/HDMI2 gibi) ayarlı olup olmadığı kontrol edilmelidir — birçok "bağlantı sorunu" aslında yanlış kaynak seçiminden kaynaklanır.',
      'Ses de aynı kablo üzerinden (HDMI genelde ses de taşır) gidebilir, ama bazı projektörlerde/monitörlerde hoparlör olmayabilir — bu durumda ses çıkışı dizüstünün kendi hoparlöründe veya ayrı bir ses kaynağında kalmaya devam eder, ayarlardan manuel olarak yönlendirilmesi gerekebilir.',
    ],
    faq: [
      { q: 'Windows\'ta ekran modunu nasıl değiştiririm?', a: 'Windows tuşu + P kısayolu ile "Yalnızca bilgisayar ekranı", "Çoğalt", "Genişlet" ve "Yalnızca ikinci ekran" seçenekleri arasında hızlıca geçiş yapılabilir.' },
      { q: 'Projektöre bağlandım ama görüntü gelmiyor, neden?', a: 'En sık neden, projektörün yanlış giriş kaynağına (örneğin HDMI2 yerine HDMI1) ayarlı olmasıdır — projektörün kaynak/giriş ayarını kontrol edin.' },
    ],
  },
  {
    slug: 'laptop-fan-sesi-nasil-azaltilir', title: 'Dizüstü Bilgisayarda Fan Sesi Nasıl Azaltılır?',
    pillar: 'dizustu-bilgisayar-nasil-secilir', subLink: 'oyun-laptoplari',
    tldr: 'Havalandırma deliklerinin tozdan temizlenmesi, cihazın sert olmayan düz bir zeminde kullanılması ve arka planda gereksiz yüksek CPU/GPU tüketen uygulamaların kapatılması, aşırı fan gürültüsünün en yaygın üç nedenini giderir.',
    body: [
      'Fan sesinin zamanla artmasının en yaygın nedeni, havalandırma girişlerinde ve fan kanatlarında biriken tozdur — bu birikim hava akışını kısıtlayıp cihazın daha sıcak çalışmasına, dolayısıyla fanların daha yüksek devirde dönmesine neden olur. Basınçlı hava spreyi ile (cihaz kapalıyken) düzenli temizlik bu sorunu önemli ölçüde azaltır.',
      'Dizüstünün yatak, kanepe veya kumaş bir yüzey üzerinde kullanılması, alt taraftaki hava giriş deliklerini tıkayarak sıcaklığın hızla yükselmesine yol açar. Sert, düz bir zemin (masa gibi) veya delikli bir dizüstü standı, hava akışını korur.',
      'Arka planda çalışan, farkında olunmayan yüksek CPU/GPU kullanan uygulamalar (tarayıcı sekmeleri, güncelleme servisleri, arka plan senkronizasyonları) sürekli fan çalışmasına neden olabilir — Görev Yöneticisi\'nden hangi sürecin kaynak tükettiği kontrol edilebilir.',
      'Bazı üreticilerin sunduğu kontrol yazılımlarında "sessiz mod" veya benzeri bir güç profili bulunur; bu profil performanstan bir miktar ödün vererek fan devrini düşürür — yoğun görevler için uygun olmasa da günlük kullanımda gürültüyü belirgin azaltabilir.',
    ],
    faq: [
      { q: 'Dizüstü yatakta kullanılınca neden daha çok ısınıyor?', a: 'Yumuşak yüzeyler (yatak, kanepe) alt taraftaki hava giriş deliklerini kapatarak hava akışını engeller, bu da sıcaklığın ve dolayısıyla fan devrinin artmasına neden olur.' },
      { q: 'Fan temizliği kaç ayda bir yapılmalı?', a: 'Kullanım ortamına bağlı olsa da, tozlu ortamlarda 6 ayda bir, normal koşullarda yılda bir kez basınçlı hava ile temizlik genelde yeterlidir.' },
    ],
  },
  {
    slug: 'laptop-nasil-temizlenir', title: 'Dizüstü Bilgisayar Ekranı ve Gövdesi Nasıl Temizlenir?',
    pillar: 'dizustu-bilgisayar-nasil-secilir', subLink: 'is-laptoplari',
    tldr: 'Ekran, cihaz kapalıyken yumuşak, tüy bırakmayan bir mikrofiber bez ve gerekirse hafif nemlendirilmiş (saf su ile) bezle silinmeli; alkol veya sert kimyasal içeren temizleyicilerden kaçınılmalıdır çünkü bunlar ekran kaplamasına zarar verebilir.',
    body: [
      'Temizliğe başlamadan önce cihazın kapatılıp fişten/şarj kablosundan çekilmesi hem güvenlik hem de ekranın daha net görülüp lekelerin fark edilmesi açısından önerilir.',
      'Ekran için en güvenli yöntem, kuru bir mikrofiber bezle hafif dairesel hareketlerle silmektir. İnatçı lekeler için bez hafifçe saf su ile nemlendirilebilir — ancak sıvı doğrudan ekrana asla püskürtülmemeli, önce beze uygulanmalıdır. Alkol bazlı veya amonyak içeren cam temizleyicileri, birçok modern ekranın anti-yansıma kaplamasına zarar verebileceği için önerilmez.',
      'Klavye ve gövde temizliği için, önce cihaz ters çevrilip hafifçe silkelenerek tuşların arasındaki kırıntılar/toz döküntüleri uzaklaştırılabilir. Ardından hafif nemli (yine su bazlı) bir bezle klavye üstü ve gövde silinebilir.',
      'Havalandırma delikleri ve klavye aralıkları gibi ulaşılması zor bölgeler için basınçlı hava spreyi, tozu fiziksel olarak temas etmeden dışarı üflemek için pratik bir çözümdür.',
      'Cihaz üzerinde asla doğrudan sıvı püskürtülmemeli ve temizlik sırasında portlara/aralıklara sıvı kaçmadığından emin olunmalıdır — sıvı girişi, dahili elektronik bileşenlere kalıcı hasar verebilir.',
    ],
    faq: [
      { q: 'Ekranı cam temizleyiciyle silebilir miyim?', a: 'Önerilmez — çoğu cam temizleyici alkol veya amonyak içerir, bu da ekranın anti-yansıma/parmak izi önleyici kaplamasına zamanla zarar verebilir. Saf su ile hafif nemlendirilmiş mikrofiber bez daha güvenlidir.' },
      { q: 'Klavyeye sıvı kaçarsa ne yapmalıyım?', a: 'Cihazı hemen kapatıp fişten çekin, mümkünse pili çıkarın ve tamamen kurumasını bekleyin; ciddi miktarda sıvı kaçtıysa yetkili servise başvurmak en güvenli yoldur.' },
    ],
  },

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

// Slug -> gerçek başlık haritası. Pillar sayfalarında (generate-topical-guides.js)
// cluster link butonlarının ham dosya adı yerine gerçek, doğru Türkçe
// başlığı göstermesi için kullanılır.
const CLUSTER_TITLES = {};
ARTICLES.forEach(a => { CLUSTER_TITLES[a.slug] = a.title; });

module.exports = { generateClusterArticles, CLUSTER_TITLES };
