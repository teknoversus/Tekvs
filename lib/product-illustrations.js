// ============================================================
// TeknoVersus — Ürüne özgü SVG illüstrasyonlar
//
// Her ürünün gerçek, ayırt edici tasarım özellikleriyle (kamera
// modülü düzeni, çentik/Dynamic Island şekli, marka logosu, renk
// paleti) elle tasarlanmış vektör çizimler. Amaç fotoğraf yerine
// geçmek değil — kategori ikonundan daha tanınabilir, ürüne özgü
// bir görsel sunmak. Sıfır telif riski: bunlar gerçek fotoğraf
// değil, açıkça illüstrasyon olan orijinal çizimler.
//
// Her fonksiyon (color, uid) alır ve kategorinin mevcut viewBox
// boyutuyla tam uyumlu bir <svg> string'i döner. Katalogda özel
// tasarımı olmayan ürünler mevcut illustrationFor() kategori
// ikonunu kullanmaya devam eder — bu dosya sadece bir ek katman.
// ============================================================

function samsungS25Ultra(color, uid){
  // Gerçek referans görsellere göre: 4 kamera dikey bir sırada
  // (büyük ana lens en üstte, altında sırayla ultra-geniş ve 2
  // telefoto lens), 2x2 ızgara değil — S25 Ultra'ya özgü düzen.
  return `<svg width="110" height="181" viewBox="0 0 140 230">
    <rect x="6" y="6" width="128" height="218" rx="14" fill="#6b6a66"/>
    <rect x="10" y="10" width="120" height="210" rx="10" fill="#8a8984"/>
    <circle cx="40" cy="35" r="15" fill="#3a3a3a"/><circle cx="40" cy="35" r="10" fill="#0a0c0f"/>
    <circle cx="40" cy="65" r="11" fill="#3a3a3a"/><circle cx="40" cy="65" r="7" fill="#0a0c0f"/>
    <circle cx="40" cy="92" r="10" fill="#3a3a3a"/><circle cx="40" cy="92" r="6" fill="#0a0c0f"/>
    <circle cx="40" cy="117" r="10" fill="#3a3a3a"/><circle cx="40" cy="117" r="6" fill="#0a0c0f"/>
    <rect x="60" y="60" width="9" height="6" rx="2" fill="#5a5952"/>
    <text x="70" y="205" text-anchor="middle" font-size="9" fill="#5a5952" font-family="sans-serif" letter-spacing="1">SAMSUNG</text>
  </svg>`;
}

function iphoneProMax(color, uid){
  // Arka yüz: titanyum gövde, kare köşeli 3 lensli kamera adası sol üstte.
  return `<svg width="110" height="181" viewBox="0 0 140 230">
    <rect x="6" y="6" width="128" height="218" rx="26" fill="#8a8a86"/>
    <rect x="10" y="10" width="120" height="210" rx="22" fill="#b8b7b2"/>
    <rect x="20" y="20" width="58" height="58" rx="16" fill="#3a3a3a"/>
    <circle cx="36" cy="36" r="11" fill="#1a1a1a"/><circle cx="36" cy="36" r="7" fill="#2a3540"/>
    <circle cx="62" cy="36" r="11" fill="#1a1a1a"/><circle cx="62" cy="36" r="7" fill="#2a3540"/>
    <circle cx="36" cy="62" r="11" fill="#1a1a1a"/><circle cx="36" cy="62" r="7" fill="#2a3540"/>
    <circle cx="62" cy="55" r="4" fill="#4a4a4a"/>
  </svg>`;
}

function iphoneStandard(color, uid){
  // Referans görsellere göre: iPhone 16'dan itibaren kameralar dikey
  // (üst üste) dizili, önceki nesillerdeki çapraz düzen değil.
  return `<svg width="110" height="181" viewBox="0 0 140 230">
    <rect x="6" y="6" width="128" height="218" rx="26" fill="${color}"/>
    <rect x="10" y="10" width="120" height="210" rx="22" fill="${color}dd"/>
    <rect x="20" y="20" width="34" height="58" rx="16" fill="#2c2c2e"/>
    <circle cx="37" cy="36" r="10" fill="#151515"/><circle cx="37" cy="36" r="6" fill="#2a3540"/>
    <circle cx="37" cy="62" r="10" fill="#151515"/><circle cx="37" cy="62" r="6" fill="#2a3540"/>
  </svg>`;
}

function samsungFold(color, uid){
  // Kapalı halde arka yüz: dar/uzun gövde, 3 lens dikey sütun halinde,
  // katlama çizgisi ortada (gerçek Fold serisi düzeni).
  return `<svg width="110" height="181" viewBox="0 0 140 230">
    <rect x="24" y="4" width="92" height="222" rx="16" fill="#4a4844"/>
    <rect x="28" y="8" width="84" height="214" rx="12" fill="#6a6864"/>
    <line x1="70" y1="8" x2="70" y2="222" stroke="#4a4844" stroke-width="1" stroke-dasharray="2 3"/>
    <circle cx="46" cy="35" r="10" fill="#2b2b2b"/><circle cx="46" cy="35" r="6" fill="#0a0c0f"/>
    <circle cx="46" cy="58" r="8" fill="#2b2b2b"/><circle cx="46" cy="58" r="5" fill="#0a0c0f"/>
    <circle cx="46" cy="78" r="8" fill="#2b2b2b"/><circle cx="46" cy="78" r="5" fill="#0a0c0f"/>
  </svg>`;
}

function samsungFlip(color, uid){
  // Kapalı halde: kısa/geniş gövde, üstte dış ekran + kamera, ortada katlama.
  return `<svg width="110" height="181" viewBox="0 0 140 230">
    <rect x="10" y="60" width="120" height="110" rx="18" fill="#4a4844"/>
    <rect x="14" y="64" width="112" height="102" rx="14" fill="#6a6864"/>
    <rect x="30" y="75" width="36" height="30" rx="8" fill="#101215"/>
    <circle cx="95" cy="80" r="9" fill="#2b2b2b"/><circle cx="95" cy="80" r="5.5" fill="#0a0c0f"/>
    <circle cx="95" cy="98" r="9" fill="#2b2b2b"/><circle cx="95" cy="98" r="5.5" fill="#0a0c0f"/>
    <line x1="10" y1="115" x2="130" y2="115" stroke="#3a3934" stroke-width="1.5" stroke-dasharray="2 3"/>
  </svg>`;
}

function xiaomiCircleCam(color, uid){
  // Arka yüz: koyu gövde, büyük dairesel kamera modülü sol üst köşede.
  return `<svg width="110" height="181" viewBox="0 0 140 230">
    <rect x="6" y="6" width="128" height="218" rx="20" fill="#3a3f47"/>
    <rect x="10" y="10" width="120" height="210" rx="16" fill="#4a4f57"/>
    <circle cx="48" cy="48" r="30" fill="#26292f"/>
    <circle cx="48" cy="48" r="24" fill="#101215"/>
    <circle cx="38" cy="38" r="9" fill="#1a1a1a"/><circle cx="38" cy="38" r="5.5" fill="#2a3540"/>
    <circle cx="58" cy="38" r="7" fill="#1a1a1a"/><circle cx="58" cy="38" r="4" fill="#2a3540"/>
    <circle cx="48" cy="58" r="7" fill="#1a1a1a"/><circle cx="48" cy="58" r="4" fill="#2a3540"/>
  </svg>`;
}

function nothingPhone(color, uid){
  // Gerçek görsele göre: yarı saydam/açık renkli arka yüzey, altında
  // görünen iç mekanizma hissi, beyaz LED Glyph şeritleri.
  return `<svg width="110" height="181" viewBox="0 0 140 230">
    <rect x="6" y="6" width="128" height="218" rx="20" fill="#e8e8e6"/>
    <rect x="10" y="10" width="120" height="210" rx="16" fill="#d4d4d0" opacity="0.85"/>
    <rect x="20" y="20" width="46" height="46" rx="12" fill="#2c2c2e"/>
    <circle cx="34" cy="34" r="9" fill="#151515"/><circle cx="34" cy="34" r="5.5" fill="#2a3540"/>
    <circle cx="52" cy="34" r="9" fill="#151515"/><circle cx="52" cy="34" r="5.5" fill="#2a3540"/>
    <rect x="20" y="80" width="4" height="60" rx="2" fill="#ffffff"/>
    <rect x="30" y="80" width="4" height="30" rx="2" fill="#ffffff"/>
  </svg>`;
}

function oneplusCircleCam(color, uid){
  // Gerçek görsele göre: büyük dairesel kamera modülü (Hasselblad
  // işbirliği), OnePlus'a özgü kırmızı alarm slider detayı.
  return `<svg width="110" height="181" viewBox="0 0 140 230">
    <rect x="6" y="6" width="128" height="218" rx="20" fill="#1c1e22"/>
    <rect x="10" y="10" width="120" height="210" rx="16" fill="#2a2d33"/>
    <circle cx="48" cy="48" r="30" fill="#0d0e10"/>
    <circle cx="48" cy="48" r="24" fill="#050506"/>
    <circle cx="38" cy="38" r="9" fill="#1a1a1a"/><circle cx="38" cy="38" r="5.5" fill="#c9432e"/>
    <circle cx="58" cy="38" r="7" fill="#1a1a1a"/><circle cx="58" cy="38" r="4" fill="#2a3540"/>
    <circle cx="48" cy="58" r="7" fill="#1a1a1a"/><circle cx="48" cy="58" r="4" fill="#2a3540"/>
    <rect x="132" y="70" width="4" height="18" rx="2" fill="#c9432e"/>
  </svg>`;
}

function pixelCameraBar(color, uid){
  // Google Pixel'e özgü, gövdeyi tam genişlikte kesen yatay kamera şeridi.
  return `<svg width="110" height="181" viewBox="0 0 140 230">
    <rect x="6" y="6" width="128" height="218" rx="20" fill="${color}"/>
    <rect x="10" y="10" width="120" height="210" rx="16" fill="${color}dd"/>
    <rect x="6" y="34" width="128" height="30" fill="#1c1e22"/>
    <circle cx="42" cy="49" r="11" fill="#0d0e10"/><circle cx="42" cy="49" r="7" fill="#2a3540"/>
    <circle cx="74" cy="49" r="9" fill="#0d0e10"/><circle cx="74" cy="49" r="5.5" fill="#2a3540"/>
    <circle cx="100" cy="49" r="6" fill="#0d0e10"/><circle cx="100" cy="49" r="3.5" fill="#5a5952"/>
  </svg>`;
}

function ipadTablet(color, uid){
  // Gerçek görsele göre: ince gövde, tek dairesel kamera sağ üst
  // köşede, Apple logosu ortada.
  return `<svg width="125" height="205" viewBox="0 0 140 230">
    <rect x="6" y="6" width="128" height="218" rx="18" fill="#c9c8c4"/>
    <rect x="10" y="10" width="120" height="210" rx="14" fill="#d9d8d4"/>
    <circle cx="105" cy="30" r="8" fill="#3a3a3a"/><circle cx="105" cy="30" r="5" fill="#2a3540"/>
    <circle cx="70" cy="115" r="14" fill="none" stroke="#a8a7a2" stroke-width="1.5"/>
  </svg>`;
}

function androidTablet(color, uid){
  // Genel Android tablet: koyu gövde, tek/çift kamera sol üst köşede.
  return `<svg width="125" height="205" viewBox="0 0 140 230">
    <rect x="6" y="6" width="128" height="218" rx="16" fill="${color}"/>
    <rect x="10" y="10" width="120" height="210" rx="12" fill="${color}dd"/>
    <circle cx="30" cy="28" r="7" fill="#1a1a1a"/><circle cx="30" cy="28" r="4" fill="#2a3540"/>
    <circle cx="48" cy="28" r="5" fill="#1a1a1a"/><circle cx="48" cy="28" r="3" fill="#2a3540"/>
  </svg>`;
}

function oppoQuadCam(color, uid){
  // Gerçek görsele göre: 4 kameralı büyük dairesel modül (Hasselblad
  // işbirliği), Oppo Find X serisine özgü.
  return `<svg width="110" height="181" viewBox="0 0 140 230">
    <rect x="6" y="6" width="128" height="218" rx="20" fill="#1a1a1c"/>
    <rect x="10" y="10" width="120" height="210" rx="16" fill="#26262a"/>
    <circle cx="50" cy="50" r="32" fill="#0d0e10"/>
    <circle cx="50" cy="50" r="26" fill="#050506"/>
    <circle cx="38" cy="38" r="8" fill="#1a1a1a"/><circle cx="38" cy="38" r="5" fill="#2a3540"/>
    <circle cx="62" cy="38" r="8" fill="#1a1a1a"/><circle cx="62" cy="38" r="5" fill="#2a3540"/>
    <circle cx="38" cy="62" r="8" fill="#1a1a1a"/><circle cx="38" cy="62" r="5" fill="#2a3540"/>
    <circle cx="62" cy="62" r="8" fill="#1a1a1a"/><circle cx="62" cy="62" r="5" fill="#2a3540"/>
  </svg>`;
}

function macbookPro(color, uid){
  // Açık dizüstü görünümü: gümüş/gri gövde, ekranın üstünde notch
  // (kamera çentiği), altta klavye/taban (trackpad çentiği ile).
  return `<svg width="230" height="160" viewBox="0 0 260 180">
    <path d="M20 20 h220 v110 h-220 z" fill="#8a8a86" stroke="#6a6a66" stroke-width="1"/>
    <path d="M28 26 h204 v96 h-204 z" fill="#0d0e10"/>
    <rect x="118" y="26" width="24" height="6" rx="3" fill="#050506"/>
    <circle cx="130" cy="29" r="1" fill="#2a3540"/>
    <path d="M5 130 h250 l-14 20 h-222 z" fill="#c9c8c4"/>
    <path d="M120 135 q10 -4 20 0" stroke="#8a8a86" stroke-width="1.2" fill="none"/>
  </svg>`;
}

function windowsLaptop(color, uid){
  // Standart klasik dizüstü siluet, renk kategoriye göre değişir.
  return `<svg width="230" height="160" viewBox="0 0 260 180">
    <path d="M20 20 h220 v110 h-220 z" fill="${color}" stroke="${color}" stroke-width="1"/>
    <path d="M28 26 h204 v96 h-204 z" fill="#0d0e10"/>
    <rect x="60" y="55" width="140" height="45" rx="4" fill="#161a1f" opacity="0.5"/>
    <path d="M5 130 h250 l-14 20 h-222 z" fill="#2b2e33"/>
  </svg>`;
}

function airpodsPro(color, uid){
  // Beyaz gövde, kısa sap, silikon uçlu kulak içi tasarım.
  return `<svg width="200" height="170" viewBox="0 0 200 170">
    <ellipse cx="70" cy="70" rx="26" ry="32" fill="#f2f2f0"/>
    <rect x="60" y="95" width="20" height="42" rx="9" fill="#f2f2f0"/>
    <ellipse cx="70" cy="140" rx="9" ry="7" fill="#d9d9d6"/>
    <ellipse cx="130" cy="70" rx="26" ry="32" fill="#f2f2f0"/>
    <rect x="120" y="95" width="20" height="42" rx="9" fill="#f2f2f0"/>
    <ellipse cx="130" cy="140" rx="9" ry="7" fill="#d9d9d6"/>
    <circle cx="64" cy="60" r="2" fill="#b8b8b5"/><circle cx="124" cy="60" r="2" fill="#b8b8b5"/>
  </svg>`;
}

function overEarHeadphones(color, uid){
  // Kulak üstü kapalı tip kulaklık — Sony/Bose stili.
  return `<svg width="200" height="170" viewBox="0 0 200 170">
    <path d="M40 90 q0 -55 60 -55 q60 0 60 55" fill="none" stroke="#1c1e22" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="40" cy="110" rx="22" ry="30" fill="#1c1e22"/>
    <ellipse cx="40" cy="110" rx="14" ry="20" fill="#3a3a3a"/>
    <ellipse cx="160" cy="110" rx="22" ry="30" fill="#1c1e22"/>
    <ellipse cx="160" cy="110" rx="14" ry="20" fill="#3a3a3a"/>
  </svg>`;
}

function earbudsOpen(color, uid){
  // Açık kulak tasarımlı kulaklık (Samsung Buds tarzı).
  return `<svg width="200" height="170" viewBox="0 0 200 170">
    <ellipse cx="70" cy="80" rx="24" ry="26" fill="#e8e8e6"/>
    <ellipse cx="70" cy="80" rx="12" ry="14" fill="#c4c4c0"/>
    <ellipse cx="130" cy="80" rx="24" ry="26" fill="#e8e8e6"/>
    <ellipse cx="130" cy="80" rx="12" ry="14" fill="#c4c4c0"/>
    <path d="M50 95 q-10 20 5 30" stroke="#e8e8e6" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M150 95 q10 20 -5 30" stroke="#e8e8e6" stroke-width="6" fill="none" stroke-linecap="round"/>
  </svg>`;
}

function fitnessBand(color, uid){
  // İnce fitness bilekliği: dar dikdörtgen ekran, ince silikon bant
  // (saat değil — Smart Band/Charge tarzı cihazlar).
  return `<svg width="130" height="173" viewBox="0 0 150 200">
    <path d="M65 15 q-15 0 -15 20 v130 q0 20 15 20 h20 q15 0 15 -20 v-130 q0 -20 -15 -20 z" fill="#2b2b2b"/>
    <rect x="58" y="42" width="34" height="116" rx="8" fill="#101215"/>
    <rect x="63" y="48" width="24" height="16" rx="2" fill="${color}44"/>
  </svg>`;
}

function appleWatchSquare(color, uid){
  // Kare/yuvarlatılmış köşeli ekran, dijital taç.
  return `<svg width="130" height="173" viewBox="0 0 150 200">
    <path d="M55 30 q-8 0 -8 12 v20 h-8 q-6 0 -6 8 v20 q0 8 6 8 h8 v20 q0 12 8 12 h40 q8 0 8 -12 v-20 h8 q6 0 6 -8 v-20 q0 -8 -6 -8 h-8 v-20 q0 -12 -8 -12 z" fill="#3a3a3a"/>
    <rect x="55" y="55" width="40" height="90" rx="12" fill="#0d0e10"/>
    <circle cx="102" cy="90" r="4" fill="#5a5a5a"/>
  </svg>`;
}

function samsungWatchRound(color, uid){
  // Yuvarlak ekran, döner çerçeve.
  return `<svg width="130" height="173" viewBox="0 0 150 200">
    <rect x="60" y="20" width="30" height="22" rx="4" fill="#3a3a3a"/>
    <rect x="60" y="158" width="30" height="22" rx="4" fill="#3a3a3a"/>
    <circle cx="75" cy="100" r="55" fill="#2b2b2b"/>
    <circle cx="75" cy="100" r="47" fill="#101215"/>
    <circle cx="75" cy="100" r="44" fill="none" stroke="#3a3a3a" stroke-width="2" stroke-dasharray="3 4"/>
    <circle cx="112" cy="90" r="4" fill="#5a5a5a"/>
  </svg>`;
}

function oledTV(color, uid){
  // Çok ince gövde (OLED), ince çerçeve.
  return `<svg width="230" height="155" viewBox="0 0 260 175">
    <rect x="20" y="15" width="220" height="120" rx="4" fill="#0d0e10" stroke="#2a2c2f" stroke-width="2"/>
    <rect x="26" y="21" width="208" height="108" fill="#161a1f"/>
    <path d="M110 135 h40 l6 20 h-52 z" fill="#1c1e22"/>
    <rect x="90" y="153" width="80" height="6" rx="3" fill="#2a2c2f"/>
  </svg>`;
}

function standardTV(color, uid){
  // Standart LED TV, biraz daha kalın çerçeve.
  return `<svg width="230" height="155" viewBox="0 0 260 175">
    <rect x="18" y="14" width="224" height="122" rx="5" fill="#1c1e22" stroke="#3a3d42" stroke-width="3"/>
    <rect x="26" y="22" width="208" height="106" fill="${color}22"/>
    <rect x="90" y="136" width="80" height="8" rx="2" fill="#2a2c2f"/>
    <rect x="115" y="144" width="30" height="14" fill="#2a2c2f"/>
  </svg>`;
}

function actionCamera(color, uid){
  // Gerçek görsele göre: küçük kare/kübik gövde, önde tek büyük lens
  // (GoPro/Insta360 tarzı aksiyon kamerası).
  return `<svg width="210" height="153" viewBox="0 0 220 160">
    <rect x="65" y="45" width="90" height="70" rx="10" fill="#1c1e22"/>
    <circle cx="110" cy="80" r="24" fill="#0d0e10"/>
    <circle cx="110" cy="80" r="18" fill="#101215"/>
    <circle cx="110" cy="80" r="11" fill="#1c2530"/>
    <rect x="95" y="52" width="30" height="8" rx="2" fill="#3a3a3a"/>
  </svg>`;
}

function gimbalCamera(color, uid){
  // Gerçek görsele göre: ince uzun sap, üstte döner küçük kamera
  // başlığı (DJI Osmo Pocket / pocket gimbal tarzı).
  return `<svg width="210" height="153" viewBox="0 0 220 160">
    <rect x="100" y="70" width="20" height="70" rx="8" fill="#2b2b2b"/>
    <rect x="80" y="30" width="60" height="45" rx="14" fill="#1c1e22"/>
    <circle cx="110" cy="52" r="14" fill="#0d0e10"/><circle cx="110" cy="52" r="9" fill="#1c2530"/>
  </svg>`;
}

function compactCamera(color, uid){
  // Gerçek görsele göre: küçük dikdörtgen gövde, sabit lens, üstte
  // flaş/vizör çıkıntısı (kompakt/premium kompakt kamera).
  return `<svg width="210" height="153" viewBox="0 0 220 160">
    <rect x="45" y="50" width="130" height="65" rx="8" fill="#1c1e22"/>
    <circle cx="90" cy="82" r="24" fill="#0d0e10"/><circle cx="90" cy="82" r="17" fill="#101215"/><circle cx="90" cy="82" r="10" fill="#1c2530"/>
    <rect x="140" y="38" width="24" height="14" rx="3" fill="#3a3a3a"/>
  </svg>`;
}

function mirrorlessCamera(color, uid){
  // Aynasız fotoğraf makinesi — büyük lens, kompakt gövde.
  return `<svg width="210" height="153" viewBox="0 0 220 160">
    <rect x="30" y="40" width="130" height="80" rx="8" fill="#1c1e22"/>
    <circle cx="95" cy="80" r="38" fill="#0d0e10"/>
    <circle cx="95" cy="80" r="30" fill="#101215"/>
    <circle cx="95" cy="80" r="22" fill="#1c2530"/>
    <circle cx="95" cy="80" r="14" fill="#2a3a4a"/>
    <rect x="150" y="30" width="30" height="18" rx="3" fill="#1c1e22"/>
    <rect x="45" y="30" width="20" height="14" rx="2" fill="#3a3a3a"/>
  </svg>`;
}

// id -> illüstrasyon fonksiyonu. Sadece kataloğun en tanınabilir,
// ikonik ürünleri için — geri kalanı mevcut kategori ikonuyla kalır.
const PRODUCT_ILLUSTRATIONS = {
  'h2': samsungS25Ultra,
  's7': samsungS25Ultra,
  'h3': samsungS25Ultra,
  'h5': samsungS25Ultra,
  'h7': samsungS25Ultra,
  'h9': samsungS25Ultra,
  'u2': samsungS25Ultra,
  's2': samsungS25Ultra,
  's4': iphoneProMax,
  'h4': iphoneProMax,
  'h6': iphoneProMax,
  'h8': iphoneProMax,
  'u1': iphoneProMax,
  'h1': iphoneProMax,
  'n5': iphoneStandard,
  'n6': iphoneStandard,
  'n4': iphoneStandard,
  'n1': iphoneStandard,
  'n2': iphoneStandard,
  'n3': iphoneStandard,
  'h10': iphoneStandard,
  'y1': iphoneStandard,
  'y5': nothingPhone,
  'y4': xiaomiCircleCam,
  'y6': xiaomiCircleCam,
  'x20': xiaomiCircleCam,
  'y12': xiaomiCircleCam,
  'y13': xiaomiCircleCam,
  'z3': xiaomiCircleCam,
  'z4': xiaomiCircleCam,
  'z5': xiaomiCircleCam,
  'z6': xiaomiCircleCam,
  'z7': xiaomiCircleCam,
  'z8': xiaomiCircleCam,
  'z9': xiaomiCircleCam,
  'z10': xiaomiCircleCam,
  'z11': xiaomiCircleCam,
  'z12': xiaomiCircleCam,
  'x3': xiaomiCircleCam,
  'y8': oppoQuadCam,
  'x19': oppoQuadCam,
  'z1': oppoQuadCam,
  'z2': oppoQuadCam,
  'z13': oppoQuadCam,
  'z14': oppoQuadCam,
  'z15': oppoQuadCam,
  'x18': samsungS25Ultra,
  'p_zfold7': samsungFold,
  'y10': samsungFold,
  'p_zflip7': samsungFlip,
  'y9': samsungFlip,
  'y14': xiaomiCircleCam,
  'x_17t': xiaomiCircleCam,
  'x_17t_pro': xiaomiCircleCam,
  'p_1787680633621_65': xiaomiCircleCam,
  'p_1787680633621_66': xiaomiCircleCam,
  'p_1787680633621_79': xiaomiCircleCam,
  'x1': xiaomiCircleCam,
  'x2': xiaomiCircleCam,
  'y11': xiaomiCircleCam,
  'y3': oneplusCircleCam,
  'p_1787680633621_67': oneplusCircleCam,
  'y2': pixelCameraBar,
  'p_1787680633621_68': pixelCameraBar,
  'p_1787680633621_69': pixelCameraBar,
  'p_1787680633621_83': oppoQuadCam,
  'p_1787680633621_84': oppoQuadCam,
  'p_1787680633621_85': oppoQuadCam,
  'y7': oppoQuadCam,
  'h11': macbookPro,
  'h12': macbookPro,
  'h13': macbookPro,
  'h14': macbookPro,
  'h15': macbookPro,
  'h16': macbookPro,
  's1': macbookPro,
  'y21': macbookPro,
  'u3': macbookPro,
  's3': ipadTablet,
  'h20': ipadTablet,
  'h21': ipadTablet,
  'h22': ipadTablet,
  'h23': ipadTablet,
  'y44': ipadTablet,
  'y45': ipadTablet,
  'n9': androidTablet,
  'n10': androidTablet,
  'n11': androidTablet,
  'n12': androidTablet,
  'n13': androidTablet,
  'x6': androidTablet,
  'x28': androidTablet,
  'x29': androidTablet,
  'x30': androidTablet,
  'y46': androidTablet,
  'y47': androidTablet,
  'y48': androidTablet,
  'y49': androidTablet,
  'x13': windowsLaptop,
  'x4': windowsLaptop,
  'x10': windowsLaptop,
  'x12': windowsLaptop,
  'x14': windowsLaptop,
  'x15': windowsLaptop,
  'x16': windowsLaptop,
  'x17': windowsLaptop,
  'x37': windowsLaptop,
  'x38': windowsLaptop,
  'y15': windowsLaptop,
  'y16': windowsLaptop,
  'y17': windowsLaptop,
  'y18': windowsLaptop,
  'y19': windowsLaptop,
  'y20': windowsLaptop,
  'y22': windowsLaptop,
  'y23': windowsLaptop,
  'y24': windowsLaptop,
  'y25': windowsLaptop,
  'y26': windowsLaptop,
  'x11': windowsLaptop,
  'h17': airpodsPro,
  's5': airpodsPro,
  'y28': airpodsPro,
  'h18': overEarHeadphones,
  'h19': overEarHeadphones,
  'y27': overEarHeadphones,
  'y31': overEarHeadphones,
  'x23': earbudsOpen,
  'y32': earbudsOpen,
  'x5': earbudsOpen,
  'x24': earbudsOpen,
  'y29': earbudsOpen,
  'y30': earbudsOpen,
  'y33': earbudsOpen,
  'y35': earbudsOpen,
  'y36': earbudsOpen,
  'x22': earbudsOpen,
  'y34': earbudsOpen,
  'x21': overEarHeadphones,
  'h24': appleWatchSquare,
  'h25': appleWatchSquare,
  'h26': appleWatchSquare,
  'h27': appleWatchSquare,
  'h28': appleWatchSquare,
  'h29': appleWatchSquare,
  's6': appleWatchSquare,
  'y50': appleWatchSquare,
  'x31': samsungWatchRound,
  'x33': samsungWatchRound,
  'y53': samsungWatchRound,
  'y54': samsungWatchRound,
  'y55': samsungWatchRound,
  'y56': samsungWatchRound,
  'x7': appleWatchSquare,
  'y51': fitnessBand,
  'y52': fitnessBand,
  'x32': samsungWatchRound,
  'tv3': oledTV,
  'tv2': standardTV,
  'x34': standardTV,
  'n7': standardTV,
  'tv1': standardTV,
  'x9': standardTV,
  'x35': standardTV,
  'x36': standardTV,
  'y57': standardTV,
  'y58': standardTV,
  'y59': standardTV,
  'y60': standardTV,
  'y61': standardTV,
  'y62': standardTV,
  'y63': standardTV,
  'n8': standardTV,
  'h31': mirrorlessCamera,
  'h32': mirrorlessCamera,
  'x8': mirrorlessCamera,
  'x25': mirrorlessCamera,
  'x26': mirrorlessCamera,
  'y37': mirrorlessCamera,
  'y38': mirrorlessCamera,
  'y39': mirrorlessCamera,
  'y41': mirrorlessCamera,
  'h30': compactCamera,
  'y40': compactCamera,
  'x27': actionCamera,
  'y43': actionCamera,
  'y42': gimbalCamera,
};

function productIllustrationFor(productId, color, uid){
  const fn = PRODUCT_ILLUSTRATIONS[productId];
  return fn ? fn(color, uid) : null;
}

module.exports = { productIllustrationFor, PRODUCT_ILLUSTRATIONS };
