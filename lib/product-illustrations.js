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
  // Düz kenarlar (Ultra serisine özgü), 4 ayrı lensli dağınık
  // kamera modülü, titanyum çerçeve tonu.
  return `<svg width="110" height="181" viewBox="0 0 140 230">
    <rect x="6" y="6" width="128" height="218" rx="14" fill="#6b6a66"/>
    <rect x="11" y="11" width="118" height="208" rx="9" fill="#14161a"/>
    <circle cx="70" cy="24" r="2" fill="#3a3f4a"/>
    <rect x="18" y="185" width="104" height="26" rx="6" fill="#1c1e22"/>
    <circle cx="35" cy="198" r="9" fill="#2b2b2b"/><circle cx="35" cy="198" r="5.5" fill="#0a0c0f"/>
    <circle cx="58" cy="192" r="6" fill="#2b2b2b"/><circle cx="58" cy="192" r="3.5" fill="#0a0c0f"/>
    <circle cx="35" cy="216" r="6.5" fill="#2b2b2b"/><circle cx="35" cy="216" r="4" fill="#0a0c0f"/>
    <rect x="72" y="188" width="7" height="5" rx="1.5" fill="#3a3f4a"/>
  </svg>`;
}

function iphoneProMax(color, uid){
  // Kare köşeli 3 lensli kamera adası, Dynamic Island (hap şekli).
  return `<svg width="110" height="181" viewBox="0 0 140 230">
    <rect x="6" y="6" width="128" height="218" rx="26" fill="#8a8a86"/>
    <rect x="11" y="11" width="118" height="208" rx="20" fill="#0d0e10"/>
    <rect x="56" y="20" width="28" height="9" rx="4.5" fill="#050506"/>
    <rect x="20" y="180" width="60" height="60" rx="16" fill="#3a3a3a"/>
    <circle cx="38" cy="198" r="11" fill="#1a1a1a"/><circle cx="38" cy="198" r="7" fill="#2a3540"/>
    <circle cx="62" cy="198" r="11" fill="#1a1a1a"/><circle cx="62" cy="198" r="7" fill="#2a3540"/>
    <circle cx="38" cy="222" r="11" fill="#1a1a1a"/><circle cx="38" cy="222" r="7" fill="#2a3540"/>
    <circle cx="62" cy="212" r="4" fill="#4a4a4a"/>
  </svg>`;
}

function iphoneStandard(color, uid){
  // İki lensli diyagonal kamera düzeni (standart iPhone modeli).
  return `<svg width="110" height="181" viewBox="0 0 140 230">
    <rect x="6" y="6" width="128" height="218" rx="26" fill="${color}"/>
    <rect x="11" y="11" width="118" height="208" rx="20" fill="#0d0e10"/>
    <rect x="56" y="20" width="28" height="9" rx="4.5" fill="#050506"/>
    <rect x="24" y="185" width="46" height="46" rx="14" fill="#2c2c2e"/>
    <circle cx="38" cy="199" r="10" fill="#151515"/><circle cx="38" cy="199" r="6" fill="#2a3540"/>
    <circle cx="56" cy="217" r="10" fill="#151515"/><circle cx="56" cy="217" r="6" fill="#2a3540"/>
  </svg>`;
}

function samsungFold(color, uid){
  // Katlı haldeyken ince, uzun bir gövde; 3 lensli kamera.
  return `<svg width="110" height="181" viewBox="0 0 140 230">
    <rect x="24" y="4" width="92" height="222" rx="16" fill="#4a4844"/>
    <rect x="29" y="9" width="82" height="212" rx="11" fill="#101215"/>
    <line x1="70" y1="9" x2="70" y2="221" stroke="#2a2c2f" stroke-width="1" stroke-dasharray="2 3"/>
    <rect x="42" y="185" width="56" height="24" rx="6" fill="#1c1e22"/>
    <circle cx="55" cy="197" r="7.5" fill="#2b2b2b"/><circle cx="55" cy="197" r="4.5" fill="#0a0c0f"/>
    <circle cx="72" cy="197" r="6" fill="#2b2b2b"/><circle cx="72" cy="197" r="3.5" fill="#0a0c0f"/>
    <circle cx="86" cy="197" r="6" fill="#2b2b2b"/><circle cx="86" cy="197" r="3.5" fill="#0a0c0f"/>
  </svg>`;
}

function samsungFlip(color, uid){
  // Kapalı haldeyken kısa, geniş gövde; dış ekran + 2 lensli kamera.
  return `<svg width="110" height="181" viewBox="0 0 140 230">
    <rect x="10" y="60" width="120" height="110" rx="18" fill="#4a4844"/>
    <rect x="15" y="65" width="110" height="100" rx="13" fill="#101215"/>
    <rect x="30" y="80" width="46" height="46" rx="10" fill="#1c1e22"/>
    <circle cx="45" cy="93" r="7" fill="#2b2b2b"/><circle cx="45" cy="93" r="4" fill="#0a0c0f"/>
    <circle cx="45" cy="112" r="7" fill="#2b2b2b"/><circle cx="45" cy="112" r="4" fill="#0a0c0f"/>
    <line x1="10" y1="115" x2="130" y2="115" stroke="#2a2c2f" stroke-width="1.5" stroke-dasharray="2 3"/>
  </svg>`;
}

function xiaomiCircleCam(color, uid){
  // Büyük dairesel kamera modülü — Xiaomi'nin ayırt edici tasarımı.
  return `<svg width="110" height="181" viewBox="0 0 140 230">
    <rect x="6" y="6" width="128" height="218" rx="20" fill="#3a3f47"/>
    <rect x="11" y="11" width="118" height="208" rx="15" fill="#181b20"/>
    <circle cx="70" cy="21" r="2" fill="#3a3f4a"/>
    <circle cx="52" cy="205" r="26" fill="#26292f"/>
    <circle cx="52" cy="205" r="21" fill="#101215"/>
    <circle cx="44" cy="197" r="8" fill="#1a1a1a"/><circle cx="44" cy="197" r="5" fill="#2a3540"/>
    <circle cx="60" cy="197" r="6" fill="#1a1a1a"/><circle cx="60" cy="197" r="3.5" fill="#2a3540"/>
    <circle cx="52" cy="213" r="6" fill="#1a1a1a"/><circle cx="52" cy="213" r="3.5" fill="#2a3540"/>
  </svg>`;
}

function macbookPro(color, uid){
  // Gümüş/gri gövde, ekranın üstünde notch, Apple logosu kapakta.
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
  's2': samsungS25Ultra,
  's4': iphoneProMax,
  'h1': iphoneProMax,
  'n5': iphoneStandard,
  'n6': iphoneStandard,
  'n4': iphoneStandard,
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
  'h11': macbookPro,
  'h12': macbookPro,
  'h13': macbookPro,
  'h14': macbookPro,
  'h15': macbookPro,
  'h16': macbookPro,
  's1': macbookPro,
  'y21': macbookPro,
  'x13': windowsLaptop,
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
  'h24': appleWatchSquare,
  'h25': appleWatchSquare,
  'h26': appleWatchSquare,
  'h27': appleWatchSquare,
  'h28': appleWatchSquare,
  'h29': appleWatchSquare,
  's6': appleWatchSquare,
  'y50': appleWatchSquare,
  'x31': samsungWatchRound,
  'x32': samsungWatchRound,
  'tv3': oledTV,
  'tv2': standardTV,
  'x34': standardTV,
  'n8': standardTV,
  'h31': mirrorlessCamera,
  'h32': mirrorlessCamera,
  'x8': mirrorlessCamera,
  'x25': mirrorlessCamera,
};

function productIllustrationFor(productId, color, uid){
  const fn = PRODUCT_ILLUSTRATIONS[productId];
  return fn ? fn(color, uid) : null;
}

module.exports = { productIllustrationFor, PRODUCT_ILLUSTRATIONS };
