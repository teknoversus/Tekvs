// ============================================================
// TeknoVersus — ortak veri ve yardımcı fonksiyonlar
// Bu dosya hem index.html hem de admin.html tarafından <script src="shared.js">
// ile paylaşılır. Ürün verisi, depolama yardımcıları, skor hesaplama ve
// basit yardımcı fonksiyonlar burada tanımlanır.
// ============================================================

const CATS = ['Telefon','Dizüstü','Kulaklık','Kamera','Akıllı Saat','Tablet','Televizyon'];

const ICONS = {
  'Telefon':'<rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="12" cy="18.3" r="0.8" fill="currentColor"/>',
  'Dizüstü':'<rect x="3" y="4" width="18" height="12" rx="1.2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M1 19h22l-2 2H3z" stroke="currentColor" stroke-width="1.4" fill="none"/>',
  'Kulaklık':'<path d="M4 13v-1a8 8 0 0116 0v1" stroke="currentColor" stroke-width="1.6" fill="none"/><rect x="2.5" y="13" width="4.5" height="7" rx="1.4" stroke="currentColor" stroke-width="1.6" fill="none"/><rect x="17" y="13" width="4.5" height="7" rx="1.4" stroke="currentColor" stroke-width="1.6" fill="none"/>',
  'Kamera':'<rect x="2" y="7" width="20" height="13" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="12" cy="13.5" r="4" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M8 7l1.5-3h5L16 7" stroke="currentColor" stroke-width="1.6" fill="none"/>',
  'Akıllı Saat':'<rect x="7" y="6" width="10" height="12" rx="3" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M9 3h6M9 21h6" stroke="currentColor" stroke-width="1.6"/>',
  'Tablet':'<rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="12" cy="19" r="0.8" fill="currentColor"/>',
  'Televizyon':'<rect x="2" y="4" width="20" height="13" rx="1.5" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="1.6"/>'
};

function logoSVG(){
  return `<svg width="26" height="26" viewBox="0 0 30 30" fill="none">
    <line x1="15" y1="3" x2="15" y2="24" stroke="#1B211D" stroke-width="2"/>
    <line x1="4" y1="8" x2="26" y2="8" stroke="#1B211D" stroke-width="2"/>
    <path d="M4 8 L1 15 A4 4 0 0 0 9 15 Z" stroke="#1F7A6C" stroke-width="1.6" fill="none"/>
    <path d="M26 8 L23 15 A4 4 0 0 0 31 15 Z" stroke="#B23A5C" stroke-width="1.6" fill="none"/>
    <rect x="10" y="24" width="10" height="2.4" rx="1" fill="#1B211D"/>
  </svg>`;
}

// Gerçek ürünler. 2025-2026 modelleri: güncel çıkış tarihi ve Türkiye'deki en düşük piyasa fiyatı (₺).
// 2020-2024 modelleri: bilinen resmi çıkış tarihi; fiyat, bilinen orijinal ABD lansman fiyatının
// (bu modeller artık üretimde/satışta olmadığı için) GÜNCEL DÖVİZ KURUYLA TL'ye çevrilmiş temsili
// değeridir — gerçek bir ikinci el/güncel piyasa fiyatı değildir, ilgili sayfalarda bu belirtilir.
// "upcoming: true" olan ürünler henüz piyasaya çıkmamış, beklenen/duyurulmamış modellerdir; bunlar
// ana katalogda değil "Beklenenler" sekmesinde gösterilir ve skor hesaplamasına dahil edilmez.
const SEED = [
  {id:'s1', name:'Apple MacBook Air (M5, 13")', cat:'Dizüstü', blurb:'M5 çipli, fansız, 18 saate kadar pil ömrüne sahip ince ve hafif laptop', specs:{'Fiyat (₺)':'67999','Ekran (inç)':'13.6','Pil (saat)':'18','RAM (GB)':'16','Depolama (GB)':'512','Kalınlık (mm)':'11.3','Genişlik (mm)':'304.1','Uzunluk (mm)':'215.0','Ekran Türü':'Liquid Retina IPS LCD','Piksel Yoğunluğu (PPI)':'224','Çözünürlük':'2560x1664','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'macOS 26','İşlemci':'Apple M5'}, addedAt:'2026-03-11', link:'https://www.amazon.com.tr/Apple-%C3%A7ipli-in%C3%A7-MacBook-Laptop/dp/B0GR1J46YC'},
  {id:'s2', name:'Samsung Galaxy S26 Ultra', cat:'Telefon', blurb:'Snapdragon 8 Elite Gen 5 ve 200 MP kamera ile amiral gemisi', specs:{'Fiyat (₺)':'86299','Ekran (inç)':'6.9','Pil (mAh)':'5000','Kamera (MP)':'200','RAM (GB)':'12','Su Geçirmezlik':'IP68','Kalınlık (mm)':'7.9','Genişlik (mm)':'78.1','Uzunluk (mm)':'163.6','Ekran Türü':'Dynamic AMOLED 2X','Piksel Yoğunluğu (PPI)':'498','Çözünürlük':'3120x1440','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 16 (One UI 8.5)','İşlemci':'Snapdragon 8 Elite Gen 5'}, addedAt:'2026-02-25', link:'https://www.amazon.com.tr/Samsung-Depolama-Telefonu-%C3%96zelle%C5%9Ftirilmi%C5%9F-Yerle%C5%9Fik/dp/B0GP167528'},
  {id:'s3', name:'Apple iPad Pro (M5, 11")', cat:'Tablet', blurb:'M5 çip ve Ultra Retina XDR OLED ekranlı profesyonel tablet', specs:{'Fiyat (₺)':'58299','Ekran (inç)':'11','Depolama (GB)':'256','RAM (GB)':'12','Ağırlık (g)':'446','Kalınlık (mm)':'5.1','Genişlik (mm)':'178.5','Uzunluk (mm)':'249.7','Ekran Türü':'Ultra Retina XDR (Tandem OLED)','Piksel Yoğunluğu (PPI)':'264','Çözünürlük':'2420x1668','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'iPadOS 26','İşlemci':'Apple M5'}, addedAt:'2025-10-22', link:'https://www.amazon.com.tr/Apple-iPad-Pro-M5-Taray%C4%B1c%C4%B1s%C4%B1/dp/B0FWD5Q13J'},
  {id:'s4', name:'Apple iPhone 17 Pro Max', cat:'Telefon', blurb:'A19 Pro çip ve üçlü 48 MP Fusion kamera sistemi', specs:{'Fiyat (₺)':'107999','Ekran (inç)':'6.9','Kamera (MP)':'48','RAM (GB)':'8','Su Geçirmezlik':'IP68','Kalınlık (mm)':'8.75','Genişlik (mm)':'77.6','Uzunluk (mm)':'163.0','Ekran Türü':'LTPO Super Retina XDR OLED','Piksel Yoğunluğu (PPI)':'460','Çözünürlük':'1320x2868','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'iOS 26','İşlemci':'Apple A19 Pro'}, addedAt:'2025-09-19', link:'https://www.amazon.com.tr/Apple-iPhone-Pro-Max-teknolojisine/dp/B0FQFLHC7F'},
  {id:'s5', name:'Apple AirPods Pro 3', cat:'Kulaklık', blurb:'H2 çipli, kalp atış sensörlü, gelişmiş ANC\'li kablosuz kulaklık', specs:{'Fiyat (₺)':'13999','Pil (saat)':'8','Ağırlık (g)':'5.5','Su Geçirmezlik':'IP57','Bluetooth':'5.3'}, addedAt:'2025-09-19', link:'https://www.amazon.com.tr/Apple-Kablosuz-Kulakl%C4%B1k-Engelleme-Bluetooth/dp/B0FQF59PPW'},
  {id:'s6', name:'Apple Watch Series 11 (42mm)', cat:'Akıllı Saat', blurb:'S10 çip, sıcaklık sensörü ve 24 saate kadar pil ömrü', specs:{'Fiyat (₺)':'18589','Pil (saat)':'24','Su Geçirmezlik':'50m','Kalınlık (mm)':'9.7','Genişlik (mm)':'42','Uzunluk (mm)':'35.7','Ekran Türü':'LTPO OLED (Always-On Retina)','Yenileme Hızı (Hz)':'1-60','İşletim Sistemi':'watchOS 26','GPS':'Var'}, addedAt:'2025-09-19', link:''},

  {id:'h1', name:'iPhone 16 Pro', cat:'Telefon', blurb:'A18 Pro çip ve yeni Camera Control tuşuyla gelen model', specs:{'Fiyat (₺)':'76999','Ekran (inç)':'6.3','Kamera (MP)':'48','RAM (GB)':'8','Su Geçirmezlik':'IP68','Kalınlık (mm)':'8.25','Genişlik (mm)':'71.5','Uzunluk (mm)':'149.6','Ekran Türü':'LTPO Super Retina XDR OLED','Piksel Yoğunluğu (PPI)':'460','Çözünürlük':'1206x2622','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'iOS 18','İşlemci':'Apple A18 Pro'}, addedAt:'2024-09-20', link:'https://www.amazon.com.tr/Apple-iPhone-16-Pro-256/dp/B0DGJLK6RJ'},
  {id:'h2', name:'Samsung Galaxy S25 Ultra', cat:'Telefon', blurb:'Snapdragon 8 Elite ve Galaxy AI özellikleriyle amiral gemisi', specs:{'Fiyat (₺)':'76999','Ekran (inç)':'6.9','Kamera (MP)':'200','RAM (GB)':'12','Su Geçirmezlik':'IP68','Kalınlık (mm)':'8.2','Genişlik (mm)':'77.6','Uzunluk (mm)':'162.8','Ekran Türü':'Dynamic AMOLED 2X','Piksel Yoğunluğu (PPI)':'498','Çözünürlük':'3120x1440','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 15 (One UI 7)','İşlemci':'Snapdragon 8 Elite'}, addedAt:'2025-02-07', link:'https://www.amazon.com.tr/Samsung-Telefon-Titanyum-Android-Garantili/dp/B0DT6WQHHR'},
  {id:'h3', name:'Samsung Galaxy S24 Ultra', cat:'Telefon', blurb:'Galaxy AI\'ın tanıtıldığı ilk S Ultra modeli', specs:{'Fiyat (₺)':'62999','Ekran (inç)':'6.8','Kamera (MP)':'200','RAM (GB)':'12','Su Geçirmezlik':'IP68','Kalınlık (mm)':'8.6','Genişlik (mm)':'79.0','Uzunluk (mm)':'162.3','Ekran Türü':'Dynamic AMOLED 2X','Piksel Yoğunluğu (PPI)':'505','Çözünürlük':'3120x1440','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 14 (One UI 6.1)','İşlemci':'Snapdragon 8 Gen 3'}, addedAt:'2024-01-31', link:'https://www.amazon.com.tr/Samsung-Telefonu-Titanyum-T%C3%BCrkiye-Garantili/dp/B0CR6T8WT5'},
  {id:'h4', name:'iPhone 15 Pro', cat:'Telefon', blurb:'Titanyum kasa ve USB-C bağlantıya geçiş yapan ilk iPhone', specs:{'Fiyat (₺)':'68999','Ekran (inç)':'6.1','Kamera (MP)':'48','RAM (GB)':'8','Su Geçirmezlik':'IP68','Kalınlık (mm)':'8.25','Genişlik (mm)':'70.6','Uzunluk (mm)':'146.6','Ekran Türü':'LTPO Super Retina XDR OLED','Piksel Yoğunluğu (PPI)':'460','Çözünürlük':'1179x2556','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'iOS 17','İşlemci':'Apple A17 Pro'}, addedAt:'2023-09-22', link:''},
  {id:'h5', name:'Samsung Galaxy S23 Ultra', cat:'Telefon', blurb:'200 MP kamera sensörünün tanıtıldığı model', specs:{'Fiyat (₺)':'52999','Ekran (inç)':'6.8','Kamera (MP)':'200','RAM (GB)':'8','Su Geçirmezlik':'IP68','Kalınlık (mm)':'8.9','Genişlik (mm)':'78.1','Uzunluk (mm)':'163.4','Ekran Türü':'Dynamic AMOLED 2X','Piksel Yoğunluğu (PPI)':'500','Çözünürlük':'3088x1440','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 13 (One UI 5.1)','İşlemci':'Snapdragon 8 Gen 2'}, addedAt:'2023-02-17', link:''},
  {id:'h6', name:'iPhone 14 Pro', cat:'Telefon', blurb:'Dynamic Island ve 48 MP ana kameranın tanıtıldığı model', specs:{'Fiyat (₺)':'55999','Ekran (inç)':'6.1','Kamera (MP)':'48','RAM (GB)':'6','Su Geçirmezlik':'IP68','Kalınlık (mm)':'7.85','Genişlik (mm)':'71.5','Uzunluk (mm)':'147.5','Ekran Türü':'LTPO Super Retina XDR OLED','Piksel Yoğunluğu (PPI)':'460','Çözünürlük':'1179x2556','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'iOS 16','İşlemci':'Apple A16 Bionic'}, addedAt:'2022-09-16', link:''},
  {id:'h7', name:'Samsung Galaxy S22 Ultra', cat:'Telefon', blurb:'S Pen\'in gövdeye entegre edildiği ilk S Ultra', specs:{'Fiyat (₺)':'44999','Ekran (inç)':'6.8','Kamera (MP)':'108','RAM (GB)':'8','Su Geçirmezlik':'IP68','Kalınlık (mm)':'8.9','Genişlik (mm)':'77.9','Uzunluk (mm)':'163.3','Ekran Türü':'Dynamic AMOLED 2X','Piksel Yoğunluğu (PPI)':'500','Çözünürlük':'3088x1440','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 12 (One UI 4.1)','İşlemci':'Snapdragon 8 Gen 1 / Exynos 2200'}, addedAt:'2022-02-25', link:''},
  {id:'h8', name:'iPhone 13 Pro', cat:'Telefon', blurb:'120Hz ProMotion ekranın ilk kez geldiği iPhone', specs:{'Fiyat (₺)':'35999','Ekran (inç)':'6.1','Kamera (MP)':'12','RAM (GB)':'6','Su Geçirmezlik':'IP68','Kalınlık (mm)':'7.65','Genişlik (mm)':'71.5','Uzunluk (mm)':'146.7','Ekran Türü':'Super Retina XDR OLED (LTPO)','Piksel Yoğunluğu (PPI)':'460','Çözünürlük':'1170x2532','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'iOS 15','İşlemci':'Apple A15 Bionic'}, addedAt:'2021-09-24', link:''},
  {id:'h9', name:'Samsung Galaxy S21 Ultra', cat:'Telefon', blurb:'108 MP kamera ve S Pen desteğiyle dönemin amiral gemisi', specs:{'Fiyat (₺)':'37999','Ekran (inç)':'6.8','Kamera (MP)':'108','RAM (GB)':'12','Su Geçirmezlik':'IP68','Kalınlık (mm)':'8.9','Genişlik (mm)':'75.6','Uzunluk (mm)':'165.1','Ekran Türü':'Dynamic AMOLED 2X','Piksel Yoğunluğu (PPI)':'515','Çözünürlük':'3200x1440','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 11 (One UI 3.1)','İşlemci':'Snapdragon 888 / Exynos 2100'}, addedAt:'2021-01-29', link:''},
  {id:'h10', name:'iPhone 12', cat:'Telefon', blurb:'5G desteği ve düz kenarlı tasarıma dönüşün ilk modeli', specs:{'Fiyat (₺)':'15999','Ekran (inç)':'6.1','Kamera (MP)':'12','RAM (GB)':'4','Su Geçirmezlik':'IP68','Kalınlık (mm)':'7.4','Genişlik (mm)':'71.5','Uzunluk (mm)':'146.7','Ekran Türü':'Super Retina XDR OLED','Piksel Yoğunluğu (PPI)':'460','Çözünürlük':'1170x2532','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'iOS 14','İşlemci':'Apple A14 Bionic'}, addedAt:'2020-10-23', link:''},

  {id:'h11', name:'MacBook Pro 14" (M4)', cat:'Dizüstü', blurb:'M4 çip ve isteğe bağlı Nano-texture ekranlı profesyonel laptop', specs:{'Fiyat (₺)':'95000','Ekran (inç)':'14.2','Pil (saat)':'18','RAM (GB)':'16','Depolama (GB)':'512','Kalınlık (mm)':'15.5','Genişlik (mm)':'312.6','Uzunluk (mm)':'221.2','Ekran Türü':'Liquid Retina XDR (mini-LED)','Piksel Yoğunluğu (PPI)':'254','Çözünürlük':'3024x1964','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'macOS Sequoia (15)','İşlemci':'Apple M4'}, addedAt:'2024-11-08', link:''},
  {id:'h12', name:'MacBook Air (M3, 13")', cat:'Dizüstü', blurb:'M3 çip ve çift harici ekran desteği sunan hafif laptop', specs:{'Fiyat (₺)':'52999','Ekran (inç)':'13.6','Pil (saat)':'18','RAM (GB)':'8','Depolama (GB)':'256','Kalınlık (mm)':'11.3','Genişlik (mm)':'304.1','Uzunluk (mm)':'215.0','Ekran Türü':'Liquid Retina IPS LCD','Piksel Yoğunluğu (PPI)':'224','Çözünürlük':'2560x1664','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'macOS Sonoma (14)','İşlemci':'Apple M3'}, addedAt:'2024-03-08', link:''},
  {id:'h13', name:'MacBook Pro 14" (M3)', cat:'Dizüstü', blurb:'Space Black renk seçeneğiyle gelen M3 çipli model', specs:{'Fiyat (₺)':'78999','Ekran (inç)':'14.2','Pil (saat)':'22','RAM (GB)':'8','Depolama (GB)':'512','Kalınlık (mm)':'15.5','Genişlik (mm)':'312.6','Uzunluk (mm)':'221.2','Ekran Türü':'Liquid Retina XDR (mini-LED)','Piksel Yoğunluğu (PPI)':'254','Çözünürlük':'3024x1964','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'macOS Sonoma (14)','İşlemci':'Apple M3 Pro'}, addedAt:'2023-11-07', link:''},
  {id:'h14', name:'MacBook Air (M2, 13")', cat:'Dizüstü', blurb:'Yeniden tasarlanan kasa ve MagSafe şarjın geri döndüğü model', specs:{'Fiyat (₺)':'44999','Ekran (inç)':'13.6','Pil (saat)':'18','RAM (GB)':'8','Depolama (GB)':'256','Kalınlık (mm)':'11.3','Genişlik (mm)':'304.1','Uzunluk (mm)':'215.0','Ekran Türü':'Liquid Retina IPS LCD','Piksel Yoğunluğu (PPI)':'224','Çözünürlük':'2560x1664','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'macOS Ventura (13)','İşlemci':'Apple M2'}, addedAt:'2022-07-15', link:''},
  {id:'h15', name:'MacBook Pro 14" (M1 Pro)', cat:'Dizüstü', blurb:'Mini-LED ekran ve HDMI/SD kart yuvasının geri döndüğü model', specs:{'Fiyat (₺)':'62999','Ekran (inç)':'14.2','Pil (saat)':'17','RAM (GB)':'16','Depolama (GB)':'512','Kalınlık (mm)':'15.5','Genişlik (mm)':'312.6','Uzunluk (mm)':'221.2','Ekran Türü':'Liquid Retina XDR (mini-LED)','Piksel Yoğunluğu (PPI)':'254','Çözünürlük':'3024x1964','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'macOS Monterey (12)','İşlemci':'Apple M1 Pro'}, addedAt:'2021-10-26', link:''},
  {id:'h16', name:'MacBook Air (M1, 13")', cat:'Dizüstü', blurb:'Apple\'ın kendi işlemcisine geçtiği ilk fansız laptop', specs:{'Fiyat (₺)':'34999','Ekran (inç)':'13.3','Pil (saat)':'18','RAM (GB)':'8','Depolama (GB)':'256','Kalınlık (mm)':'16.1','Genişlik (mm)':'304.1','Uzunluk (mm)':'212.4','Ekran Türü':'Retina IPS LCD','Piksel Yoğunluğu (PPI)':'227','Çözünürlük':'2560x1600','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'macOS Big Sur (11)','İşlemci':'Apple M1'}, addedAt:'2020-11-17', link:''},

  {id:'h17', name:'AirPods Pro (2. Nesil)', cat:'Kulaklık', blurb:'H2 çip ve Adaptif Ses özelliğiyle gelen kulaklık', specs:{'Fiyat (₺)':'8999','Pil (saat)':'6','Ağırlık (g)':'5.3','Su Geçirmezlik':'IP54','Bluetooth':'5.3'}, addedAt:'2022-09-23', link:''},
  {id:'h18', name:'Sony WH-1000XM5', cat:'Kulaklık', blurb:'Yeniden tasarlanan gövde ve çift işlemcili gürültü engelleme', specs:{'Fiyat (₺)':'13999','Pil (saat)':'30','Ağırlık (g)':'250','Su Geçirmezlik':'Yok','Bluetooth':'5.2'}, addedAt:'2022-05-20', link:'https://www.amazon.com.tr/Sony-WH-1000XM5-Kablosuz-%C3%96nleyici-Kulakl%C4%B1klar/dp/B09Y2MYL5C'},
  {id:'h19', name:'Sony WH-1000XM4', cat:'Kulaklık', blurb:'Sektörde uzun süre lider kalan ANC kulaklık', specs:{'Fiyat (₺)':'8999','Pil (saat)':'30','Ağırlık (g)':'254','Su Geçirmezlik':'Yok','Bluetooth':'5.0'}, addedAt:'2020-08-20', link:''},

  {id:'h20', name:'Apple iPad Pro (M4, 11")', cat:'Tablet', blurb:'Tandem OLED ekranlı, Apple\'ın şimdiye kadarki en ince ürünü', specs:{'Fiyat (₺)':'54999','Ekran (inç)':'11','Depolama (GB)':'256','RAM (GB)':'8','Kalınlık (mm)':'5.1','Genişlik (mm)':'178.5','Uzunluk (mm)':'249.7','Ekran Türü':'Ultra Retina XDR (Tandem OLED)','Piksel Yoğunluğu (PPI)':'264','Çözünürlük':'1668x2420','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'iPadOS 17','İşlemci':'Apple M4'}, addedAt:'2024-05-15', link:''},
  {id:'h21', name:'Apple iPad Pro (M2, 11")', cat:'Tablet', blurb:'Apple Pencil hover desteği sunan M2 çipli tablet', specs:{'Fiyat (₺)':'39999','Ekran (inç)':'11','Depolama (GB)':'128','RAM (GB)':'8','Kalınlık (mm)':'5.9','Genişlik (mm)':'178.5','Uzunluk (mm)':'247.6','Ekran Türü':'Liquid Retina IPS LCD','Piksel Yoğunluğu (PPI)':'264','Çözünürlük':'1668x2388','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'iPadOS 16','İşlemci':'Apple M2'}, addedAt:'2022-10-26', link:''},
  {id:'h22', name:'Apple iPad Pro (M1, 11")', cat:'Tablet', blurb:'M1 çip ve Thunderbolt bağlantı taşıyan ilk iPad Pro', specs:{'Fiyat (₺)':'29999','Ekran (inç)':'11','Depolama (GB)':'128','RAM (GB)':'8','Kalınlık (mm)':'5.9','Genişlik (mm)':'178.5','Uzunluk (mm)':'247.6','Ekran Türü':'Liquid Retina IPS LCD','Piksel Yoğunluğu (PPI)':'264','Çözünürlük':'1668x2388','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'iPadOS 14','İşlemci':'Apple M1'}, addedAt:'2021-05-21', link:''},
  {id:'h23', name:'Apple iPad Air (4. Nesil)', cat:'Tablet', blurb:'USB-C ve yan tuşta Touch ID getiren tasarım yenilenmesi', specs:{'Fiyat (₺)':'19999','Ekran (inç)':'10.9','Depolama (GB)':'64','RAM (GB)':'4','Kalınlık (mm)':'6.1','Genişlik (mm)':'178.5','Uzunluk (mm)':'247.6','Ekran Türü':'Liquid Retina IPS LCD','Piksel Yoğunluğu (PPI)':'264','Çözünürlük':'1640x2360','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'iPadOS 14','İşlemci':'Apple A14 Bionic'}, addedAt:'2020-09-18', link:''},

  {id:'h24', name:'Apple Watch Series 10', cat:'Akıllı Saat', blurb:'Şimdiye kadarki en ince Apple Watch, geniş açılı OLED ekran', specs:{'Fiyat (₺)':'15999','Pil (saat)':'18','Su Geçirmezlik':'50m','Kalınlık (mm)':'9.7','Genişlik (mm)':'42','Uzunluk (mm)':'35.7','Ekran Türü':'LTPO OLED (Always-On Retina)','Yenileme Hızı (Hz)':'1-60','İşletim Sistemi':'watchOS 11','GPS':'Var'}, addedAt:'2024-09-20', link:''},
  {id:'h25', name:'Apple Watch Series 9', cat:'Akıllı Saat', blurb:'S9 çip ve Çift Dokunuş hareketiyle gelen model', specs:{'Fiyat (₺)':'12999','Pil (saat)':'18','Su Geçirmezlik':'50m','Kalınlık (mm)':'10.7','Genişlik (mm)':'41','Uzunluk (mm)':'35.7','Ekran Türü':'LTPO OLED (Always-On Retina)','Yenileme Hızı (Hz)':'1-60','İşletim Sistemi':'watchOS 10','GPS':'Var'}, addedAt:'2023-09-22', link:''},
  {id:'h26', name:'Apple Watch Ultra', cat:'Akıllı Saat', blurb:'Titanyum kasa ve 36 saate kadar pil ömrüyle dayanıklı model', specs:{'Fiyat (₺)':'32999','Pil (saat)':'36','Su Geçirmezlik':'100m','Kalınlık (mm)':'14.4','Genişlik (mm)':'49','Uzunluk (mm)':'44','Ekran Türü':'LTPO OLED (Always-On Retina)','Yenileme Hızı (Hz)':'1-60','İşletim Sistemi':'watchOS 9','GPS':'Var (çift frekanslı)'}, addedAt:'2022-09-23', link:''},
  {id:'h27', name:'Apple Watch Series 8', cat:'Akıllı Saat', blurb:'Vücut sıcaklığı sensörünün tanıtıldığı model', specs:{'Fiyat (₺)':'10999','Pil (saat)':'18','Su Geçirmezlik':'50m','Kalınlık (mm)':'10.7','Genişlik (mm)':'41','Uzunluk (mm)':'35.7','Ekran Türü':'LTPO OLED (Always-On Retina)','Yenileme Hızı (Hz)':'1-60','İşletim Sistemi':'watchOS 9','GPS':'Var'}, addedAt:'2022-09-16', link:''},
  {id:'h28', name:'Apple Watch Series 7', cat:'Akıllı Saat', blurb:'Daha büyük ve dayanıklı ekranıyla gelen model', specs:{'Fiyat (₺)':'9999','Pil (saat)':'18','Su Geçirmezlik':'50m','Kalınlık (mm)':'10.7','Genişlik (mm)':'41','Uzunluk (mm)':'35.7','Ekran Türü':'LTPO OLED (Always-On Retina)','Yenileme Hızı (Hz)':'1-60','İşletim Sistemi':'watchOS 8','GPS':'Var'}, addedAt:'2021-10-15', link:''},
  {id:'h29', name:'Apple Watch Series 6', cat:'Akıllı Saat', blurb:'Kan oksijeni sensörünün ilk kez geldiği model', specs:{'Fiyat (₺)':'8999','Pil (saat)':'18','Su Geçirmezlik':'50m','Kalınlık (mm)':'10.4','Genişlik (mm)':'40','Uzunluk (mm)':'34','Ekran Türü':'LTPO OLED (Always-On Retina)','Yenileme Hızı (Hz)':'1-60','İşletim Sistemi':'watchOS 7','GPS':'Var'}, addedAt:'2020-09-18', link:''},

  {id:'h30', name:'Fujifilm X100VI', cat:'Kamera', blurb:'40 MP APS-C sensörlü, sabit lensli kompakt kamera', specs:{'Fiyat (₺)':'88999','Çözünürlük (MP)':'40','Video':'6K30','Kalınlık (mm)':'55.3','Genişlik (mm)':'74.8','Uzunluk (mm)':'128.0','Ekran Türü':'3.0" Eğilebilir Dokunmatik LCD','Lens Mount':'Sabit Lens (35mm f/2 eşdeğeri)'}, addedAt:'2024-02-20', link:''},
  {id:'h31', name:'Canon EOS R6 Mark II', cat:'Kamera', blurb:'24 MP sensör ve 40 kare/sn seri çekim hızı sunan aynasız kamera', specs:{'Fiyat (₺)':'89999','Çözünürlük (MP)':'24','Video':'4K60','Kalınlık (mm)':'88.4','Genişlik (mm)':'98.4','Uzunluk (mm)':'138.4','Ekran Türü':'3.0" Vari-angle Dokunmatik LCD','Lens Mount':'Canon RF'}, addedAt:'2022-11-02', link:''},
  {id:'h32', name:'Sony A7 IV', cat:'Kamera', blurb:'33 MP tam kare sensörlü hibrit fotoğraf/video kamerası', specs:{'Fiyat (₺)':'99999','Çözünürlük (MP)':'33','Video':'4K60','Kalınlık (mm)':'79.8','Genişlik (mm)':'96.4','Uzunluk (mm)':'131.3','Ekran Türü':'3.0" Vari-angle Dokunmatik LCD','Lens Mount':'Sony E'}, addedAt:'2021-12-21', link:''},

  // ---- Televizyon (yeni kategori — gerçek Türkiye piyasa fiyatlarıyla araştırılmıştır) ----
  {id:'tv1', name:'Vestel 55UA9540', cat:'Televizyon', blurb:'55 inç 4K Ultra HD, uygun fiyatlı Android TV', specs:{'Fiyat (₺)':'32800','Ekran (inç)':'55','Çözünürlük':'3840x2160','Ekran Türü':'4K Ultra HD LED','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Android TV','Ses Çıkış Gücü (W)':'16'}, addedAt:'2025-06-10', link:''},
  {id:'tv2', name:'Samsung 55QN80F', cat:'Televizyon', blurb:'55 inç 4K Neo QLED, yüksek yenileme hızıyla fiyat/performans dengesi', specs:{'Fiyat (₺)':'55500','Ekran (inç)':'55','Çözünürlük':'3840x2160','Ekran Türü':'Neo QLED','Yenileme Hızı (Hz)':'144','İşletim Sistemi':'Tizen','Ses Çıkış Gücü (W)':'20'}, addedAt:'2025-03-15', link:''},
  {id:'tv3', name:'LG OLED55B4 (OLED55B46LA)', cat:'Televizyon', blurb:'55 inç 4K OLED, kendi kendine ışık yayan piksellerle üstün kontrast', specs:{'Fiyat (₺)':'64300','Ekran (inç)':'55','Çözünürlük':'3840x2160','Ekran Türü':'OLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'webOS 24','Ses Çıkış Gücü (W)':'20'}, addedAt:'2024-04-05', link:''},

  // ---- Ek modeller (Xiaomi/POCO/Reeder/Casper/Amazfit vb. — gerçek Türkiye piyasa verileriyle araştırılmıştır) ----
  {id:'x1', name:'Xiaomi Redmi Note 13 Pro', cat:'Telefon', blurb:'200 MP OIS kameralı, uygun fiyatlı orta segment telefon', specs:{'Fiyat (₺)':'16499','Ekran (inç)':'6.67','Pil (mAh)':'5100','Kamera (MP)':'200','RAM (GB)':'8','Su Geçirmezlik':'IP54','Kalınlık (mm)':'7.98','Genişlik (mm)':'74.2','Uzunluk (mm)':'161.1','Ekran Türü':'AMOLED','Piksel Yoğunluğu (PPI)':'395','Çözünürlük':'1220x2712','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 13 (MIUI 14)','İşlemci':'MediaTek Helio G99 Ultra'}, addedAt:'2024-01-16', link:''},
  {id:'x2', name:'POCO X6 Pro', cat:'Telefon', blurb:'Dimensity 8300-Ultra ve 120Hz Flow AMOLED ekranlı fiyat/performans telefonu', specs:{'Fiyat (₺)':'32000','Ekran (inç)':'6.67','Pil (mAh)':'5000','Kamera (MP)':'64','RAM (GB)':'12','Su Geçirmezlik':'IP54','Ekran Türü':'Flow AMOLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 14 (HyperOS)','İşlemci':'MediaTek Dimensity 8300-Ultra'}, addedAt:'2024-01-11', link:''},
  {id:'x3', name:'Reeder P13 Blue Max', cat:'Telefon', blurb:'Yerli üretim, bütçe dostu giriş seviyesi telefon', specs:{'Fiyat (₺)':'6500','Ekran (inç)':'6.49','Pil (mAh)':'4680','Kamera (MP)':'13','RAM (GB)':'4','Ekran Türü':'HD+ IPS LCD','Piksel Yoğunluğu (PPI)':'265','Çözünürlük':'720x1560','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Android 12','İşlemci':'Unisoc T606'}, addedAt:'2022-09-01', link:''},
  {id:'x4', name:'Casper Excalibur G870', cat:'Dizüstü', blurb:'Yerli üretim, RTX 3050 ekran kartlı oyuncu dizüstü bilgisayarı', specs:{'Fiyat (₺)':'37960','Ekran (inç)':'15.6','Pil (saat)':'6','RAM (GB)':'16','Depolama (GB)':'1000','Ekran Türü':'Full HD IPS','Yenileme Hızı (Hz)':'144','İşletim Sistemi':'Windows 11','İşlemci':'Intel Core i7-13620H'}, addedAt:'2024-06-01', link:''},
  {id:'x5', name:'Xiaomi Redmi Buds 5', cat:'Kulaklık', blurb:'Titanyum diyaframlı sürücü ve 46 dB\'ye kadar aktif gürültü engellemeli uygun fiyatlı TWS kulaklık', specs:{'Fiyat (₺)':'3999','Pil (saat)':'40','Su Geçirmezlik':'IPX4','Bluetooth':'5.2'}, addedAt:'2024-03-01', link:''},
  {id:'x6', name:'Xiaomi Pad 6', cat:'Tablet', blurb:'144Hz WQHD+ ekranlı fiyat/performans tableti', specs:{'Fiyat (₺)':'19000','Ekran (inç)':'11','RAM (GB)':'8','Depolama (GB)':'256','Ekran Türü':'LCD','Yenileme Hızı (Hz)':'144','İşletim Sistemi':'Android 13 (MIUI Pad)','İşlemci':'Snapdragon 870'}, addedAt:'2023-05-18', link:''},
  {id:'x7', name:'Amazfit GTS 4', cat:'Akıllı Saat', blurb:'AMOLED ekranlı, uzun pilli fiyat/performans akıllı saati', specs:{'Fiyat (₺)':'7999','Su Geçirmezlik':'5 ATM','Pil (saat)':'192','Ekran Türü':'AMOLED','İşletim Sistemi':'Zepp OS','GPS':'Var'}, addedAt:'2022-09-08', link:''},
  {id:'x8', name:'Canon EOS R50', cat:'Kamera', blurb:'İçerik üreticileri için hafif ve kompakt APS-C aynasız kamera', specs:{'Fiyat (₺)':'40000','Çözünürlük (MP)':'24.2','Video':'4K30','Ekran Türü':'3.0" Vari-angle Dokunmatik LCD','Lens Mount':'Canon RF-S'}, addedAt:'2023-02-08', link:''},
  {id:'x9', name:'Xiaomi TV A Pro 55', cat:'Televizyon', blurb:'120Hz Game Boost destekli, uygun fiyatlı 55 inç QLED Google TV', specs:{'Fiyat (₺)':'27999','Ekran (inç)':'55','Çözünürlük':'3840x2160','Ekran Türü':'QLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Google TV','Ses Çıkış Gücü (W)':'30'}, addedAt:'2025-11-01', link:''},

  // ---- Dizüstü — HP, Asus, Acer, Monster, Casper (gerçek Türkiye piyasa verileriyle, eski+yeni karışık) ----
  {id:'x10', name:'HP Pavilion 15-eg2002nt', cat:'Dizüstü', blurb:'12. Nesil Intel Core i7 işlemcili, günlük kullanım odaklı ince ve şık dizüstü', specs:{'Fiyat (₺)':'24999','Ekran (inç)':'15.6','Pil (saat)':'8','RAM (GB)':'16','Depolama (GB)':'512','Ekran Türü':'Full HD IPS','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Windows 11','İşlemci':'Intel Core i7 (12. Nesil)'}, addedAt:'2022-03-25', link:''},
  {id:'x11', name:'HP Omen 16', cat:'Dizüstü', blurb:'165Hz QHD ekranlı, güçlü soğutma sistemine sahip oyuncu dizüstüsü', specs:{'Fiyat (₺)':'54999','Ekran (inç)':'16.1','Pil (saat)':'6','RAM (GB)':'16','Depolama (GB)':'1000','Ekran Türü':'QHD IPS','Yenileme Hızı (Hz)':'165','İşletim Sistemi':'Windows 11','İşlemci':'Intel Core i7-13700HX'}, addedAt:'2023-11-01', link:''},
  {id:'x12', name:'Asus Vivobook 15', cat:'Dizüstü', blurb:'Günlük kullanım ve ofis işleri için uygun fiyatlı ince dizüstü', specs:{'Fiyat (₺)':'22999','Ekran (inç)':'15.6','Pil (saat)':'7','RAM (GB)':'8','Depolama (GB)':'512','Ekran Türü':'Full HD IPS','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Windows 11','İşlemci':'Intel Core i5-1335U'}, addedAt:'2023-06-01', link:''},
  {id:'x13', name:'Asus ROG Strix G16', cat:'Dizüstü', blurb:'Ryzen 9 işlemci ve RTX 5050 ekran kartlı yeni nesil oyuncu dizüstüsü', specs:{'Fiyat (₺)':'68999','Ekran (inç)':'16','Pil (saat)':'5','RAM (GB)':'16','Depolama (GB)':'1000','Ekran Türü':'Full HD IPS','Yenileme Hızı (Hz)':'165','İşletim Sistemi':'Windows 11','İşlemci':'AMD Ryzen 9 8940HX'}, addedAt:'2026-03-01', link:''},
  {id:'x14', name:'Acer Aspire 5', cat:'Dizüstü', blurb:'Bütçe dostu, günlük kullanım için sade ve dayanıklı dizüstü', specs:{'Fiyat (₺)':'18999','Ekran (inç)':'15.6','Pil (saat)':'8','RAM (GB)':'8','Depolama (GB)':'512','Ekran Türü':'Full HD IPS','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Windows 11','İşlemci':'Intel Core i5-1135G7'}, addedAt:'2021-08-01', link:''},
  {id:'x15', name:'Acer Nitro Lite 16', cat:'Dizüstü', blurb:'RTX ekran kartlı, orta segment fiyat/performans oyuncu dizüstüsü', specs:{'Fiyat (₺)':'38999','Ekran (inç)':'16','Pil (saat)':'6','RAM (GB)':'16','Depolama (GB)':'512','Ekran Türü':'WUXGA IPS','Yenileme Hızı (Hz)':'144','İşletim Sistemi':'Windows 11','İşlemci':'Intel Core i5-13420H'}, addedAt:'2024-05-01', link:''},
  {id:'x16', name:'Monster Abra A5 V21', cat:'Dizüstü', blurb:'Yerli üretim, RTX 3050 ekran kartlı uygun fiyatlı oyuncu dizüstüsü', specs:{'Fiyat (₺)':'34999','Ekran (inç)':'15.6','Pil (saat)':'6','RAM (GB)':'8','Depolama (GB)':'500','Ekran Türü':'Full HD IPS','Yenileme Hızı (Hz)':'144','İşletim Sistemi':'Windows 11','İşlemci':'Intel Core i5-12450H'}, addedAt:'2023-09-01', link:''},
  {id:'x17', name:'Casper Excalibur G915', cat:'Dizüstü', blurb:'RTX 5070 ekran kartlı, yeni nesil işlemcili üst segment yerli üretim oyuncu dizüstüsü', specs:{'Fiyat (₺)':'99999','Ekran (inç)':'16','Pil (saat)':'5','RAM (GB)':'32','Depolama (GB)':'2000','Ekran Türü':'WUXGA IPS (350 nit)','Yenileme Hızı (Hz)':'165','İşletim Sistemi':'Windows 11','İşlemci':'Intel Core 7 240H'}, addedAt:'2026-06-01', link:''},

  // ---- Ek model çeşitliliği (21 ürün — tüm kategorilere, gerçek Türkiye piyasa verileriyle) ----
  {id:'x18', name:'Samsung Galaxy A55', cat:'Telefon', blurb:'Metal çerçeveli, IP67 su geçirmez orta segment telefon', specs:{'Fiyat (₺)':'28500','Ekran (inç)':'6.6','Pil (mAh)':'5000','Kamera (MP)':'50','RAM (GB)':'8','Su Geçirmezlik':'IP67','Ekran Türü':'Super AMOLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 14 (One UI 6.1)','İşlemci':'Samsung Exynos 1480'}, addedAt:'2024-03-11', link:''},
  {id:'x19', name:'Huawei Nova 12', cat:'Telefon', blurb:'Kavisli AMOLED ekranlı, hızlı şarjlı orta-üst segment telefon', specs:{'Fiyat (₺)':'22000','Ekran (inç)':'6.7','Pil (mAh)':'4500','Kamera (MP)':'108','RAM (GB)':'8','Ekran Türü':'AMOLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'HarmonyOS 4.2','İşlemci':'Snapdragon 778G'}, addedAt:'2023-12-01', link:''},
  {id:'x20', name:'Realme 12 Pro+', cat:'Telefon', blurb:'Periskop teleobjektifli kameraya sahip fiyat/performans telefonu', specs:{'Fiyat (₺)':'19000','Ekran (inç)':'6.7','Pil (mAh)':'5000','Kamera (MP)':'50','RAM (GB)':'8','Su Geçirmezlik':'IP65','Ekran Türü':'AMOLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 14','İşlemci':'Snapdragon 6 Gen 1'}, addedAt:'2024-02-01', link:''},

  {id:'x21', name:'JBL Tune 510BT', cat:'Kulaklık', blurb:'Katlanabilir, uzun pilli bütçe dostu kulak üstü kulaklık', specs:{'Fiyat (₺)':'1799','Pil (saat)':'40','Bluetooth':'5.0'}, addedAt:'2021-01-01', link:''},
  {id:'x22', name:'Anker Soundcore R50i NC', cat:'Kulaklık', blurb:'Aktif gürültü engellemeli uygun fiyatlı TWS kulaklık', specs:{'Fiyat (₺)':'4399','Pil (saat)':'28','Su Geçirmezlik':'IPX5','Bluetooth':'5.3'}, addedAt:'2024-01-01', link:''},
  {id:'x23', name:'Samsung Galaxy Buds3', cat:'Kulaklık', blurb:'Aktif gürültü engellemeli, Galaxy ekosistemine entegre TWS kulaklık', specs:{'Fiyat (₺)':'6999','Pil (saat)':'24','Su Geçirmezlik':'IP57','Bluetooth':'5.3'}, addedAt:'2024-07-01', link:''},
  {id:'x24', name:'Sony WF-C510', cat:'Kulaklık', blurb:'Kompakt ve hafif tasarımlı bütçe dostu Sony TWS kulaklık', specs:{'Fiyat (₺)':'2499','Pil (saat)':'22','Su Geçirmezlik':'IPX4','Bluetooth':'5.3'}, addedAt:'2024-05-01', link:''},

  {id:'x25', name:'Sony Alpha a6400', cat:'Kamera', blurb:'Hızlı otofokuslu, hafif ve kompakt APS-C aynasız kamera', specs:{'Fiyat (₺)':'42999','Çözünürlük (MP)':'24.2','Video':'4K30','Ekran Türü':'3.0" Eğilebilir Dokunmatik LCD','Lens Mount':'Sony E'}, addedAt:'2019-02-01', link:''},
  {id:'x26', name:'Nikon Z50', cat:'Kamera', blurb:'Vlog ve seyahat çekimleri için hafif APS-C aynasız kamera', specs:{'Fiyat (₺)':'35000','Çözünürlük (MP)':'20.9','Video':'4K30','Ekran Türü':'3.2" Eğilebilir Dokunmatik LCD','Lens Mount':'Nikon Z'}, addedAt:'2019-10-01', link:''},
  {id:'x27', name:'GoPro HERO12 Black', cat:'Kamera', blurb:'10 metreye kadar su geçirmez, yüksek çözünürlüklü aksiyon kamerası', specs:{'Fiyat (₺)':'16999','Çözünürlük (MP)':'27','Video':'5K60','Su Geçirmezlik':'10m','Lens Mount':'Sabit Lens (aksiyon kamerası)'}, addedAt:'2023-09-01', link:''},

  {id:'x28', name:'Samsung Galaxy Tab S9 FE', cat:'Tablet', blurb:'S Pen dahil, su geçirmez orta-üst segment tablet', specs:{'Fiyat (₺)':'24999','Ekran (inç)':'10.9','RAM (GB)':'8','Depolama (GB)':'128','Su Geçirmezlik':'IP68','Ekran Türü':'LCD','Yenileme Hızı (Hz)':'90','İşletim Sistemi':'Android 14 (One UI 6.1)','İşlemci':'Samsung Exynos 1380'}, addedAt:'2023-10-01', link:''},
  {id:'x29', name:'Huawei MatePad 11.5', cat:'Tablet', blurb:'120Hz yüksek yenileme hızlı, geniş ekranlı fiyat/performans tableti', specs:{'Fiyat (₺)':'13999','Ekran (inç)':'11.5','RAM (GB)':'8','Depolama (GB)':'256','Ekran Türü':'LCD','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'HarmonyOS','İşlemci':'Kirin 810A'}, addedAt:'2023-07-01', link:''},
  {id:'x30', name:'Lenovo Tab M10 Plus', cat:'Tablet', blurb:'Aile kullanımı için uygun fiyatlı giriş seviyesi tablet', specs:{'Fiyat (₺)':'6999','Ekran (inç)':'10.6','RAM (GB)':'4','Depolama (GB)':'128','Ekran Türü':'Full HD LCD','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Android 12','İşlemci':'MediaTek Helio G80'}, addedAt:'2022-05-01', link:''},

  {id:'x31', name:'Samsung Galaxy Watch7', cat:'Akıllı Saat', blurb:'Gelişmiş sağlık sensörlü, Wear OS tabanlı akıllı saat', specs:{'Fiyat (₺)':'11999','Su Geçirmezlik':'5 ATM + IP68','Pil (saat)':'40','Ekran Türü':'Super AMOLED','İşletim Sistemi':'Wear OS','GPS':'Var'}, addedAt:'2024-07-10', link:''},
  {id:'x32', name:'Huawei Watch GT 5', cat:'Akıllı Saat', blurb:'Uzun pil ömürlü, şık tasarımlı sağlık takip saati', specs:{'Fiyat (₺)':'7999','Su Geçirmezlik':'5 ATM','Pil (saat)':'168','Ekran Türü':'AMOLED','İşletim Sistemi':'HarmonyOS','GPS':'Var'}, addedAt:'2024-08-01', link:''},
  {id:'x33', name:'Garmin Forerunner 165', cat:'Akıllı Saat', blurb:'Koşucular için GPS destekli performans takip saati', specs:{'Fiyat (₺)':'13999','Su Geçirmezlik':'5 ATM','Pil (saat)':'288','Ekran Türü':'AMOLED','İşletim Sistemi':'Garmin OS','GPS':'Var'}, addedAt:'2024-04-01', link:''},

  {id:'x34', name:'TCL 55C655', cat:'Televizyon', blurb:'Mini LED panelli, fiyat/performans odaklı 55 inç akıllı TV', specs:{'Fiyat (₺)':'28999','Ekran (inç)':'55','Çözünürlük':'3840x2160','Ekran Türü':'Mini LED QLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Google TV','Ses Çıkış Gücü (W)':'30'}, addedAt:'2024-01-01', link:''},
  {id:'x35', name:'Philips 55PUS8118', cat:'Televizyon', blurb:'Ambilight teknolojili, sürükleyici izleme deneyimi sunan 55 inç TV', specs:{'Fiyat (₺)':'26999','Ekran (inç)':'55','Çözünürlük':'3840x2160','Ekran Türü':'LED','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Android TV','Ses Çıkış Gücü (W)':'20'}, addedAt:'2023-09-01', link:''},
  {id:'x36', name:'Vestel 65UA9500', cat:'Televizyon', blurb:'Geniş ekranlı, uygun fiyatlı yerli üretim 65 inç TV', specs:{'Fiyat (₺)':'38999','Ekran (inç)':'65','Çözünürlük':'3840x2160','Ekran Türü':'4K Ultra HD LED','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Android TV','Ses Çıkış Gücü (W)':'16'}, addedAt:'2025-01-01', link:''},

  {id:'x37', name:'Lenovo IdeaPad Slim 3', cat:'Dizüstü', blurb:'Günlük kullanım için uygun fiyatlı, ince ve hafif dizüstü', specs:{'Fiyat (₺)':'19999','Ekran (inç)':'15.6','Pil (saat)':'8','RAM (GB)':'8','Depolama (GB)':'512','Ekran Türü':'Full HD IPS','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Windows 11','İşlemci':'Intel Core i5-1335U'}, addedAt:'2023-08-01', link:''},
  {id:'x38', name:'MSI Katana 15', cat:'Dizüstü', blurb:'RTX 4060 ekran kartlı, orta-üst segment oyuncu dizüstüsü', specs:{'Fiyat (₺)':'44999','Ekran (inç)':'15.6','Pil (saat)':'6','RAM (GB)':'16','Depolama (GB)':'1000','Ekran Türü':'Full HD IPS','Yenileme Hızı (Hz)':'144','İşletim Sistemi':'Windows 11','İşlemci':'Intel Core i7-13620H'}, addedAt:'2023-10-01', link:''},

  // ---- Model çeşitliliği turu 3 — 63 yeni ürün (gerçek, farklı modeller — genel bilgi + araştırmayla) ----
  {id:'y1', name:'Apple iPhone SE (2022)', cat:'Telefon', blurb:'Touch ID\'li, kompakt ve uygun fiyatlı Apple telefonu', specs:{'Fiyat (₺)':'13999','Ekran (inç)':'4.7','Pil (mAh)':'2018','Kamera (MP)':'12','RAM (GB)':'4','Su Geçirmezlik':'IP67','İşlemci':'Apple A15 Bionic','Ekran Türü':'Retina HD LCD','Çözünürlük':'750x1334','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'iOS 15'}, addedAt:'2022-03-18', link:''},
  {id:'y2', name:'Google Pixel 8', cat:'Telefon', blurb:'Google Tensor G3 çipli, yapay zekâ destekli fotoğraf özellikleriyle öne çıkan telefon', specs:{'Fiyat (₺)':'34999','Ekran (inç)':'6.2','Pil (mAh)':'4575','Kamera (MP)':'50','RAM (GB)':'12','Su Geçirmezlik':'IP68','İşlemci':'Google Tensor G3','Ekran Türü':'OLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 14'}, addedAt:'2023-10-04', link:''},
  {id:'y3', name:'OnePlus 12', cat:'Telefon', blurb:'Hasselblad ortaklıklı kamera sistemine sahip amiral gemisi telefon', specs:{'Fiyat (₺)':'34999','Ekran (inç)':'6.82','Pil (mAh)':'5400','Kamera (MP)':'50','RAM (GB)':'16','Su Geçirmezlik':'IP65','İşlemci':'Snapdragon 8 Gen 3','Ekran Türü':'LTPO AMOLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 14'}, addedAt:'2024-01-23', link:''},
  {id:'y4', name:'Motorola Edge 50 Pro', cat:'Telefon', blurb:'Kavisli 144Hz ekranlı, hızlı şarj destekli orta-üst segment telefon', specs:{'Fiyat (₺)':'24999','Ekran (inç)':'6.7','Pil (mAh)':'4500','Kamera (MP)':'50','RAM (GB)':'12','Su Geçirmezlik':'IP68','İşlemci':'Snapdragon 7 Gen 3','Ekran Türü':'pOLED','Yenileme Hızı (Hz)':'144','İşletim Sistemi':'Android 14'}, addedAt:'2024-04-24', link:''},
  {id:'y5', name:'Nothing Phone (2)', cat:'Telefon', blurb:'Şeffaf tasarımı ve Glyph LED bildirim sistemiyle dikkat çeken telefon', specs:{'Fiyat (₺)':'21999','Ekran (inç)':'6.7','Pil (mAh)':'4700','Kamera (MP)':'50','RAM (GB)':'12','İşlemci':'Snapdragon 8+ Gen 1','Ekran Türü':'OLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 13'}, addedAt:'2023-07-11', link:''},
  {id:'y6', name:'Vivo V29', cat:'Telefon', blurb:'Kavisli AMOLED ekranlı, portre fotoğrafçılığa odaklı telefon', specs:{'Fiyat (₺)':'19999','Ekran (inç)':'6.78','Pil (mAh)':'4600','Kamera (MP)':'50','RAM (GB)':'12','Su Geçirmezlik':'IP54','İşlemci':'Snapdragon 778G','Ekran Türü':'AMOLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 13'}, addedAt:'2023-08-15', link:''},
  {id:'y7', name:'Oppo Reno11', cat:'Telefon', blurb:'Portre modu kamerasıyla öne çıkan orta segment telefon', specs:{'Fiyat (₺)':'18999','Ekran (inç)':'6.7','Pil (mAh)':'5000','Kamera (MP)':'50','RAM (GB)':'12','İşlemci':'MediaTek Dimensity 7050','Ekran Türü':'AMOLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 14'}, addedAt:'2023-11-23', link:''},
  {id:'y8', name:'Huawei P60 Pro', cat:'Telefon', blurb:'Değişken diyafram kameralı üst segment Huawei telefonu', specs:{'Fiyat (₺)':'44999','Ekran (inç)':'6.67','Pil (mAh)':'4815','Kamera (MP)':'48','RAM (GB)':'12','Su Geçirmezlik':'IP68','İşlemci':'Snapdragon 8+ Gen 1 (4G)','Ekran Türü':'LTPO OLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'HarmonyOS 3.1'}, addedAt:'2023-03-23', link:''},
  {id:'y9', name:'Samsung Galaxy Z Flip6', cat:'Telefon', blurb:'Katlanabilir, kompakt tasarımlı amiral gemisi telefon', specs:{'Fiyat (₺)':'54999','Ekran (inç)':'6.7','Pil (mAh)':'4000','Kamera (MP)':'50','RAM (GB)':'12','Su Geçirmezlik':'IPX8','İşlemci':'Snapdragon 8 Gen 3','Ekran Türü':'Katlanabilir AMOLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 14 (One UI 6.1.1)'}, addedAt:'2024-07-10', link:''},
  {id:'y10', name:'Samsung Galaxy Z Fold6', cat:'Telefon', blurb:'Tablet boyutunda açılan katlanabilir amiral gemisi telefon', specs:{'Fiyat (₺)':'89999','Ekran (inç)':'7.6','Pil (mAh)':'4400','Kamera (MP)':'50','RAM (GB)':'12','Su Geçirmezlik':'IP48','İşlemci':'Snapdragon 8 Gen 3','Ekran Türü':'Katlanabilir Dinamik AMOLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 14 (One UI 6.1.1)'}, addedAt:'2024-07-10', link:''},
  {id:'y11', name:'Xiaomi Redmi 13C', cat:'Telefon', blurb:'Büyük pilli, giriş seviyesi bütçe telefon', specs:{'Fiyat (₺)':'7999','Ekran (inç)':'6.74','Pil (mAh)':'5000','Kamera (MP)':'50','RAM (GB)':'4','İşlemci':'MediaTek Helio G85','Ekran Türü':'HD+ IPS LCD','Yenileme Hızı (Hz)':'90','İşletim Sistemi':'Android 13'}, addedAt:'2023-11-01', link:''},
  {id:'y12', name:'Infinix Note 40', cat:'Telefon', blurb:'Kavisli AMOLED ekranlı, uygun fiyatlı fiyat/performans telefonu', specs:{'Fiyat (₺)':'11999','Ekran (inç)':'6.78','Pil (mAh)':'5000','Kamera (MP)':'108','RAM (GB)':'8','İşlemci':'MediaTek Helio G99 Ultra','Ekran Türü':'AMOLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 14'}, addedAt:'2024-04-01', link:''},
  {id:'y13', name:'Tecno Camon 30', cat:'Telefon', blurb:'OIS destekli kamerasıyla bütçe dostu orta segment telefon', specs:{'Fiyat (₺)':'13999','Ekran (inç)':'6.78','Pil (mAh)':'5000','Kamera (MP)':'50','RAM (GB)':'8','İşlemci':'MediaTek Dimensity 7050','Ekran Türü':'AMOLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 14'}, addedAt:'2024-05-01', link:''},
  {id:'y14', name:'Xiaomi 14', cat:'Telefon', blurb:'Leica ortaklıklı kamera sistemine sahip kompakt amiral gemisi', specs:{'Fiyat (₺)':'44999','Ekran (inç)':'6.36','Pil (mAh)':'4610','Kamera (MP)':'50','RAM (GB)':'12','Su Geçirmezlik':'IP68','İşlemci':'Snapdragon 8 Gen 3','Ekran Türü':'LTPO AMOLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 14 (HyperOS)'}, addedAt:'2023-10-26', link:''},

  {id:'y15', name:'Dell Inspiron 15 3520', cat:'Dizüstü', blurb:'Günlük kullanım için uygun fiyatlı, sade dizüstü bilgisayar', specs:{'Fiyat (₺)':'21999','Ekran (inç)':'15.6','Pil (saat)':'7','RAM (GB)':'8','Depolama (GB)':'512','İşlemci':'Intel Core i5-1235U','Ekran Türü':'Full HD IPS','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Windows 11'}, addedAt:'2022-06-01', link:''},
  {id:'y16', name:'Dell XPS 13 9340', cat:'Dizüstü', blurb:'Ultra ince tasarımlı, yeni nesil işlemcili premium ultrabook', specs:{'Fiyat (₺)':'54999','Ekran (inç)':'13.4','Pil (saat)':'10','RAM (GB)':'16','Depolama (GB)':'512','İşlemci':'Intel Core Ultra 7 155H','Ekran Türü':'FHD+ Dokunmatik','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Windows 11'}, addedAt:'2024-01-01', link:''},
  {id:'y17', name:'Lenovo Legion 5 Pro', cat:'Dizüstü', blurb:'165Hz WQXGA ekranlı, RTX ekran kartlı üst segment oyuncu dizüstüsü', specs:{'Fiyat (₺)':'59999','Ekran (inç)':'16','Pil (saat)':'5','RAM (GB)':'16','Depolama (GB)':'1000','İşlemci':'AMD Ryzen 7 7745HX','Ekran Türü':'WQXGA IPS','Yenileme Hızı (Hz)':'165','İşletim Sistemi':'Windows 11'}, addedAt:'2023-05-01', link:''},
  {id:'y18', name:'Lenovo ThinkPad E14', cat:'Dizüstü', blurb:'Dayanıklı gövdeli, iş odaklı kurumsal dizüstü bilgisayar', specs:{'Fiyat (₺)':'28999','Ekran (inç)':'14','Pil (saat)':'9','RAM (GB)':'8','Depolama (GB)':'512','İşlemci':'Intel Core i5-1335U','Ekran Türü':'Full HD IPS','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Windows 11'}, addedAt:'2023-03-01', link:''},
  {id:'y19', name:'MSI Modern 14', cat:'Dizüstü', blurb:'İnce ve hafif tasarımlı, günlük kullanım dizüstüsü', specs:{'Fiyat (₺)':'19999','Ekran (inç)':'14','Pil (saat)':'8','RAM (GB)':'8','Depolama (GB)':'512','İşlemci':'Intel Core i5-1235U','Ekran Türü':'Full HD IPS','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Windows 11'}, addedAt:'2022-11-01', link:''},
  {id:'y20', name:'Huawei MateBook D14', cat:'Dizüstü', blurb:'İnce çerçeveli, dengeli performanslı orta segment dizüstü', specs:{'Fiyat (₺)':'24999','Ekran (inç)':'14','Pil (saat)':'9','RAM (GB)':'16','Depolama (GB)':'512','İşlemci':'Intel Core i5-1240P','Ekran Türü':'Full HD IPS','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Windows 11'}, addedAt:'2023-06-01', link:''},
  {id:'y21', name:'Apple MacBook Pro 16" (M3 Pro)', cat:'Dizüstü', blurb:'Mini-LED ekranlı, profesyonel iş yükleri için üst segment MacBook', specs:{'Fiyat (₺)':'124999','Ekran (inç)':'16.2','Pil (saat)':'22','RAM (GB)':'18','Depolama (GB)':'512','İşlemci':'Apple M3 Pro','Ekran Türü':'Liquid Retina XDR (mini-LED)','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'macOS Sonoma (14)'}, addedAt:'2023-11-07', link:''},
  {id:'y22', name:'Samsung Galaxy Book4', cat:'Dizüstü', blurb:'Samsung ekosistemiyle entegre, dengeli günlük kullanım dizüstüsü', specs:{'Fiyat (₺)':'29999','Ekran (inç)':'15.6','Pil (saat)':'8','RAM (GB)':'8','Depolama (GB)':'512','İşlemci':'Intel Core i5-1230U','Ekran Türü':'Full HD IPS','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Windows 11'}, addedAt:'2024-02-01', link:''},
  {id:'y23', name:'LG Gram 16', cat:'Dizüstü', blurb:'Sadece 1,19 kg ağırlığında, ultra hafif taşınabilir dizüstü', specs:{'Fiyat (₺)':'54999','Ekran (inç)':'16','Pil (saat)':'16','RAM (GB)':'16','Depolama (GB)':'1000','İşlemci':'Intel Core i7-1360P','Ekran Türü':'WQXGA IPS','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Windows 11'}, addedAt:'2023-04-01', link:''},
  {id:'y24', name:'Casper Nirvana X500', cat:'Dizüstü', blurb:'Yerli üretim, uygun fiyatlı günlük kullanım/ofis dizüstüsü', specs:{'Fiyat (₺)':'18999','Ekran (inç)':'15.6','Pil (saat)':'7','RAM (GB)':'8','Depolama (GB)':'512','İşlemci':'Intel Core i5-1235U','Ekran Türü':'Full HD IPS','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Windows 11'}, addedAt:'2023-01-01', link:''},
  {id:'y25', name:'Monster Tulpar T5 V22.1', cat:'Dizüstü', blurb:'Yerli üretim, RTX ekran kartlı orta segment oyuncu dizüstüsü', specs:{'Fiyat (₺)':'33999','Ekran (inç)':'15.6','Pil (saat)':'6','RAM (GB)':'16','Depolama (GB)':'500','İşlemci':'Intel Core i5-12450H','Ekran Türü':'Full HD IPS','Yenileme Hızı (Hz)':'144','İşletim Sistemi':'Windows 11'}, addedAt:'2023-08-01', link:''},
  {id:'y26', name:'HP EliteBook 840 G10', cat:'Dizüstü', blurb:'Kurumsal güvenlik özellikli, iş odaklı üst segment dizüstü', specs:{'Fiyat (₺)':'44999','Ekran (inç)':'14','Pil (saat)':'10','RAM (GB)':'16','Depolama (GB)':'512','İşlemci':'Intel Core i5-1335U','Ekran Türü':'Full HD IPS','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Windows 11'}, addedAt:'2023-05-01', link:''},

  {id:'y27', name:'Sony WF-1000XM5', cat:'Kulaklık', blurb:'Sektör lideri aktif gürültü engellemeye sahip üst segment TWS kulaklık', specs:{'Fiyat (₺)':'10999','Pil (saat)':'24','Bluetooth':'5.3'}, addedAt:'2023-07-25', link:''},
  {id:'y28', name:'Apple AirPods 4', cat:'Kulaklık', blurb:'Yeni nesil tasarımlı, ANC seçenekli temel Apple kulaklığı', specs:{'Fiyat (₺)':'7499','Pil (saat)':'30','Bluetooth':'5.3'}, addedAt:'2024-09-20', link:''},
  {id:'y29', name:'Beats Studio Buds+', cat:'Kulaklık', blurb:'Şeffaf tasarım seçenekli, ANC destekli TWS kulaklık', specs:{'Fiyat (₺)':'5999','Pil (saat)':'36','Bluetooth':'5.3'}, addedAt:'2023-06-01', link:''},
  {id:'y30', name:'JBL Live Pro 2', cat:'Kulaklık', blurb:'Zengin bas performanslı, aktif gürültü engellemeli TWS kulaklık', specs:{'Fiyat (₺)':'3999','Pil (saat)':'40','Bluetooth':'5.3'}, addedAt:'2023-01-01', link:''},
  {id:'y31', name:'Bose QuietComfort Ultra Earbuds', cat:'Kulaklık', blurb:'Uzamsal ses desteğine sahip üst segment ANC kulaklık', specs:{'Fiyat (₺)':'13999','Pil (saat)':'24','Bluetooth':'5.3'}, addedAt:'2023-09-14', link:''},
  {id:'y32', name:'Xiaomi Buds 4', cat:'Kulaklık', blurb:'Aktif gürültü engellemeli, uygun fiyatlı TWS kulaklık', specs:{'Fiyat (₺)':'4999','Pil (saat)':'30','Bluetooth':'5.3'}, addedAt:'2023-06-01', link:''},
  {id:'y33', name:'Huawei FreeBuds Pro 3', cat:'Kulaklık', blurb:'Çift sürücülü, yüksek ses kalitesine sahip ANC kulaklık', specs:{'Fiyat (₺)':'6999','Pil (saat)':'33','Bluetooth':'5.2'}, addedAt:'2023-11-01', link:''},
  {id:'y34', name:'Marshall Minor III', cat:'Kulaklık', blurb:'İkonik tasarımlı, kompakt TWS kulaklık', specs:{'Fiyat (₺)':'3499','Pil (saat)':'25','Bluetooth':'5.2'}, addedAt:'2022-09-01', link:''},
  {id:'y35', name:'Skullcandy Indy', cat:'Kulaklık', blurb:'Uygun fiyatlı, günlük kullanım TWS kulaklık', specs:{'Fiyat (₺)':'1499','Pil (saat)':'20','Bluetooth':'5.0'}, addedAt:'2021-01-01', link:''},
  {id:'y36', name:'Edifier X3', cat:'Kulaklık', blurb:'Bütçe dostu, uzun pilli giriş seviyesi TWS kulaklık', specs:{'Fiyat (₺)':'999','Pil (saat)':'32','Bluetooth':'5.1'}, addedAt:'2022-01-01', link:''},

  {id:'y37', name:'Sony ZV-E10', cat:'Kamera', blurb:'Vlog ve içerik üretimi için tasarlanmış hafif APS-C kamera', specs:{'Fiyat (₺)':'28999','Çözünürlük (MP)':'24.2','Video':'4K30','Lens Mount':'Sony E'}, addedAt:'2021-07-30', link:''},
  {id:'y38', name:'Fujifilm X-T5', cat:'Kamera', blurb:'Yüksek çözünürlüklü sensöre sahip retro tasarımlı APS-C kamera', specs:{'Fiyat (₺)':'69999','Çözünürlük (MP)':'40.2','Video':'6K30','Lens Mount':'Fujifilm X'}, addedAt:'2022-11-02', link:''},
  {id:'y39', name:'Panasonic Lumix G100', cat:'Kamera', blurb:'Vlog odaklı, hafif Micro Four Thirds kamera', specs:{'Fiyat (₺)':'21999','Çözünürlük (MP)':'20.3','Video':'4K30','Lens Mount':'Micro Four Thirds'}, addedAt:'2020-07-23', link:''},
  {id:'y40', name:'Canon PowerShot G7X Mark III', cat:'Kamera', blurb:'Kompakt gövdeli, popüler vlog kamerası', specs:{'Fiyat (₺)':'24999','Çözünürlük (MP)':'20.1','Video':'4K30'}, addedAt:'2019-07-01', link:''},
  {id:'y41', name:'Nikon Z6 III', cat:'Kamera', blurb:'Hızlı otofokuslu, tam kare sensörlü hibrit fotoğraf/video kamerası', specs:{'Fiyat (₺)':'119999','Çözünürlük (MP)':'24.5','Video':'6K60','Lens Mount':'Nikon Z'}, addedAt:'2024-06-17', link:''},
  {id:'y42', name:'DJI Osmo Pocket 3', cat:'Kamera', blurb:'Cepte taşınabilir, gimbal stabilizasyonlu 1 inç sensörlü kamera', specs:{'Fiyat (₺)':'24999','Çözünürlük (MP)':'9.4','Video':'4K120'}, addedAt:'2023-10-25', link:''},
  {id:'y43', name:'Insta360 X4', cat:'Kamera', blurb:'8K çözünürlüklü, 360 derece aksiyon kamerası', specs:{'Fiyat (₺)':'19999','Video':'8K30','Su Geçirmezlik':'10m'}, addedAt:'2024-04-01', link:''},

  {id:'y44', name:'Apple iPad (10. Nesil)', cat:'Tablet', blurb:'Renkli, yeni tasarımlı standart Apple tableti', specs:{'Fiyat (₺)':'19999','Ekran (inç)':'10.9','RAM (GB)':'4','Depolama (GB)':'64','İşlemci':'Apple A14 Bionic','Ekran Türü':'Liquid Retina IPS LCD','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'iPadOS 16'}, addedAt:'2022-10-26', link:''},
  {id:'y45', name:'Apple iPad mini (7. Nesil)', cat:'Tablet', blurb:'Kompakt boyutlu, yeni nesil çipli Apple tableti', specs:{'Fiyat (₺)':'24999','Ekran (inç)':'8.3','RAM (GB)':'8','Depolama (GB)':'128','İşlemci':'Apple A17 Pro','Ekran Türü':'Liquid Retina IPS LCD','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'iPadOS 18'}, addedAt:'2024-10-23', link:''},
  {id:'y46', name:'Samsung Galaxy Tab A9', cat:'Tablet', blurb:'Uygun fiyatlı, günlük kullanım için giriş seviyesi tablet', specs:{'Fiyat (₺)':'5999','Ekran (inç)':'8.7','RAM (GB)':'4','Depolama (GB)':'64','Ekran Türü':'LCD','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Android 13'}, addedAt:'2023-10-01', link:''},
  {id:'y47', name:'Lenovo Yoga Tab 11', cat:'Tablet', blurb:'Kickstand tasarımlı, medya tüketimine uygun tablet', specs:{'Fiyat (₺)':'9999','Ekran (inç)':'11','RAM (GB)':'6','Depolama (GB)':'128','Ekran Türü':'2K LCD','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Android 12'}, addedAt:'2022-09-01', link:''},
  {id:'y48', name:'Huawei MatePad Pro 13.2', cat:'Tablet', blurb:'144Hz OLED ekranlı üst segment üretkenlik tableti', specs:{'Fiyat (₺)':'34999','Ekran (inç)':'13.2','RAM (GB)':'12','Depolama (GB)':'256','Ekran Türü':'OLED','Yenileme Hızı (Hz)':'144','İşletim Sistemi':'HarmonyOS 4.2'}, addedAt:'2024-05-01', link:''},
  {id:'y49', name:'Amazon Fire HD 10', cat:'Tablet', blurb:'Bütçe dostu, medya tüketimine yönelik tablet', specs:{'Fiyat (₺)':'5499','Ekran (inç)':'10.1','RAM (GB)':'3','Depolama (GB)':'32','Ekran Türü':'Full HD LCD','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Fire OS'}, addedAt:'2021-05-01', link:''},

  {id:'y50', name:'Apple Watch SE (2. Nesil)', cat:'Akıllı Saat', blurb:'Temel sağlık özellikleriyle uygun fiyatlı Apple Watch modeli', specs:{'Fiyat (₺)':'8999','Su Geçirmezlik':'50m','Pil (saat)':'18','GPS':'Var','Ekran Türü':'Retina OLED','İşletim Sistemi':'watchOS 9'}, addedAt:'2022-09-16', link:''},
  {id:'y51', name:'Xiaomi Smart Band 8', cat:'Akıllı Saat', blurb:'Uzun pilli, uygun fiyatlı akıllı bileklik', specs:{'Fiyat (₺)':'1499','Su Geçirmezlik':'5 ATM','Pil (saat)':'384','GPS':'Yok'}, addedAt:'2023-05-01', link:''},
  {id:'y52', name:'Fitbit Charge 6', cat:'Akıllı Saat', blurb:'Detaylı sağlık ve fitness takibi sunan bileklik', specs:{'Fiyat (₺)':'4999','Su Geçirmezlik':'5 ATM','Pil (saat)':'168','GPS':'Var'}, addedAt:'2023-10-12', link:''},
  {id:'y53', name:'Google Pixel Watch 2', cat:'Akıllı Saat', blurb:'Wear OS tabanlı, Fitbit sağlık entegrasyonlu akıllı saat', specs:{'Fiyat (₺)':'14999','Su Geçirmezlik':'5 ATM','Pil (saat)':'24','GPS':'Var','İşletim Sistemi':'Wear OS'}, addedAt:'2023-10-12', link:''},
  {id:'y54', name:'OnePlus Watch 2', cat:'Akıllı Saat', blurb:'100 saate yakın pil ömrü sunan Wear OS akıllı saati', specs:{'Fiyat (₺)':'11999','Su Geçirmezlik':'5 ATM','Pil (saat)':'100','GPS':'Var','İşletim Sistemi':'Wear OS'}, addedAt:'2024-02-26', link:''},
  {id:'y55', name:'Honor Watch GS 4', cat:'Akıllı Saat', blurb:'AMOLED ekranlı, şık tasarımlı sağlık takip saati', specs:{'Fiyat (₺)':'6999','Su Geçirmezlik':'5 ATM','Pil (saat)':'336','GPS':'Var'}, addedAt:'2023-09-01', link:''},
  {id:'y56', name:'Polar Vantage V3', cat:'Akıllı Saat', blurb:'Profesyonel sporcular için gelişmiş performans takip saati', specs:{'Fiyat (₺)':'19999','Su Geçirmezlik':'5 ATM','Pil (saat)':'140','GPS':'Var'}, addedAt:'2023-10-01', link:''},

  {id:'y57', name:'Samsung 43Q60D', cat:'Televizyon', blurb:'Kompakt boyutlu, uygun fiyatlı 43 inç QLED TV', specs:{'Fiyat (₺)':'19999','Ekran (inç)':'43','Çözünürlük':'3840x2160','Ekran Türü':'QLED','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Tizen','Ses Çıkış Gücü (W)':'20'}, addedAt:'2024-01-01', link:''},
  {id:'y58', name:'LG 43UR78', cat:'Televizyon', blurb:'Uygun fiyatlı, kompakt 43 inç 4K TV', specs:{'Fiyat (₺)':'16999','Ekran (inç)':'43','Çözünürlük':'3840x2160','Ekran Türü':'LED','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'webOS','Ses Çıkış Gücü (W)':'20'}, addedAt:'2024-01-01', link:''},
  {id:'y59', name:'TCL 65C655', cat:'Televizyon', blurb:'Geniş ekranlı, Mini LED panelli 65 inç akıllı TV', specs:{'Fiyat (₺)':'42999','Ekran (inç)':'65','Çözünürlük':'3840x2160','Ekran Türü':'Mini LED QLED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Google TV','Ses Çıkış Gücü (W)':'30'}, addedAt:'2024-01-01', link:''},
  {id:'y60', name:'Hisense 55U7', cat:'Televizyon', blurb:'Yüksek parlaklıklı Mini LED panele sahip 55 inç TV', specs:{'Fiyat (₺)':'34999','Ekran (inç)':'55','Çözünürlük':'3840x2160','Ekran Türü':'Mini LED ULED','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'VIDAA','Ses Çıkış Gücü (W)':'30'}, addedAt:'2023-09-01', link:''},
  {id:'y61', name:'Grundig 55 GUA 9200', cat:'Televizyon', blurb:'Uygun fiyatlı, 55 inç Android TV', specs:{'Fiyat (₺)':'24999','Ekran (inç)':'55','Çözünürlük':'3840x2160','Ekran Türü':'4K Ultra HD LED','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Android TV','Ses Çıkış Gücü (W)':'20'}, addedAt:'2023-06-01', link:''},
  {id:'y62', name:'Toshiba 50UA2263DG', cat:'Televizyon', blurb:'Google TV arayüzlü, 50 inç fiyat/performans TV', specs:{'Fiyat (₺)':'21999','Ekran (inç)':'50','Çözünürlük':'3840x2160','Ekran Türü':'4K Ultra HD LED','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Google TV','Ses Çıkış Gücü (W)':'16'}, addedAt:'2023-08-01', link:''},
  {id:'y63', name:'Regal 55R8UB', cat:'Televizyon', blurb:'Yerli üretim, uygun fiyatlı 55 inç Android TV', specs:{'Fiyat (₺)':'22999','Ekran (inç)':'55','Çözünürlük':'3840x2160','Ekran Türü':'4K Ultra HD LED','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Android TV','Ses Çıkış Gücü (W)':'20'}, addedAt:'2024-01-01', link:''},

  // ---- Beklenenler (henüz çıkmamış, duyurulmamış modeller) ----
  {id:'u1', name:'iPhone 18 Pro', cat:'Telefon', blurb:'Beklenen model — resmi tanıtım henüz yapılmadı, detaylar söylentiye dayanır', specs:{}, addedAt:'2026-09-19', upcoming:true, link:''},
  {id:'u2', name:'Samsung Galaxy S27 Ultra', cat:'Telefon', blurb:'Beklenen model — resmi tanıtım henüz yapılmadı, detaylar söylentiye dayanır', specs:{}, addedAt:'2027-01-25', upcoming:true, link:''},
  {id:'u3', name:'Apple MacBook Pro 14" (M6)', cat:'Dizüstü', blurb:'Beklenen model — resmi tanıtım henüz yapılmadı, detaylar söylentiye dayanır', specs:{}, addedAt:'2026-10-01', upcoming:true, link:''},

  // ---- Ağustos 2026: Honor, General Mobile, TCL, Casper, Nubia marka genişletmesi ----
  {id:'z1', name:'Honor Magic8 Pro', cat:'Telefon', blurb:'Snapdragon 8 Elite Gen 5, 200MP kamera ve 7100mAh silikon karbon bataryalı amiral gemisi', specs:{'Fiyat (₺)':'79999','Ekran (inç)':'6.71','Pil (mAh)':'7100','Kamera (MP)':'200','RAM (GB)':'12','Su Geçirmezlik':'IP68','Kalınlık (mm)':'8.32','Genişlik (mm)':'75','Uzunluk (mm)':'161.15','Ekran Türü':'LTPO OLED','Piksel Yoğunluğu (PPI)':'460','Çözünürlük':'1256x2808','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 16 (MagicOS 10)','İşlemci':'Snapdragon 8 Elite Gen 5'}, addedAt:'2026-02-03', link:''},
  {id:'z2', name:'Honor 600 Pro', cat:'Telefon', blurb:'İçerik üreticilerine özel 200MP kamera sistemi ve AI destekli üst-orta segment model', specs:{'Fiyat (₺)':'42999','Ekran (inç)':'6.8','Pil (mAh)':'5900','Kamera (MP)':'200','RAM (GB)':'12','Su Geçirmezlik':'IP65','Kalınlık (mm)':'7.3','Genişlik (mm)':'76','Uzunluk (mm)':'163.5','Ekran Türü':'OLED','Piksel Yoğunluğu (PPI)':'421','Çözünürlük':'1264x2800','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 15 (MagicOS 9)','İşlemci':'Snapdragon 7 Gen 4'}, addedAt:'2026-05-01', link:''},
  {id:'z3', name:'Honor Magic8 Lite', cat:'Telefon', blurb:'6000 nit parlaklıklı OLED ekranı ve yüksek dayanıklılığıyla öne çıkan orta segment model', specs:{'Fiyat (₺)':'19999','Ekran (inç)':'6.79','Pil (mAh)':'6600','Kamera (MP)':'108','RAM (GB)':'8','Su Geçirmezlik':'IP54','Kalınlık (mm)':'7.9','Genişlik (mm)':'76.5','Uzunluk (mm)':'164.4','Ekran Türü':'OLED','Piksel Yoğunluğu (PPI)':'388','Çözünürlük':'1600x2688','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 15 (MagicOS 9)','İşlemci':'Snapdragon 6 Gen 4'}, addedAt:'2026-01-15', link:''},

  {id:'z4', name:'General Mobile GM 26 Pro 5G', cat:'Telefon', blurb:'Arka ekranlı tasarımı ve GM AI asistanıyla dikkat çeken yerli üretim telefon', specs:{'Fiyat (₺)':'24999','Ekran (inç)':'6.67','Pil (mAh)':'5000','Kamera (MP)':'108','RAM (GB)':'8','Su Geçirmezlik':'IP54','Kalınlık (mm)':'7.55','Genişlik (mm)':'76','Uzunluk (mm)':'163','Ekran Türü':'AMOLED','Piksel Yoğunluğu (PPI)':'395','Çözünürlük':'1080x2400','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 15','İşlemci':'MediaTek Dimensity 7060'}, addedAt:'2026-02-24', link:''},
  {id:'z5', name:'General Mobile GM Fenix II Pro 5G', cat:'Telefon', blurb:"General Mobile'ın GM AI destekli amiral gemisi seviyesindeki modeli", specs:{'Fiyat (₺)':'34999','Ekran (inç)':'6.78','Pil (mAh)':'5500','Kamera (MP)':'108','RAM (GB)':'12','Su Geçirmezlik':'IP54','Kalınlık (mm)':'7.8','Genişlik (mm)':'76.5','Uzunluk (mm)':'164','Ekran Türü':'AMOLED','Piksel Yoğunluğu (PPI)':'388','Çözünürlük':'1080x2400','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 15','İşlemci':'MediaTek Dimensity 8300'}, addedAt:'2026-02-24', link:''},
  {id:'z6', name:'General Mobile GM Era 50', cat:'Telefon', blurb:'Uygun fiyatlı, günlük kullanım odaklı yerli üretim giriş segmenti telefon', specs:{'Fiyat (₺)':'12999','Ekran (inç)':'6.56','Pil (mAh)':'5000','Kamera (MP)':'50','RAM (GB)':'4','Su Geçirmezlik':'IP52','Kalınlık (mm)':'8.5','Genişlik (mm)':'76','Uzunluk (mm)':'165','Ekran Türü':'IPS LCD','Piksel Yoğunluğu (PPI)':'269','Çözünürlük':'720x1612','Yenileme Hızı (Hz)':'90','İşletim Sistemi':'Android 14','İşlemci':'Unisoc T612'}, addedAt:'2026-03-01', link:''},

  {id:'z7', name:'TCL 40 NXTPAPER 5G', cat:'Telefon', blurb:'Göz yormayan NXTPAPER kağıt-benzeri ekran teknolojili orta segment model', specs:{'Fiyat (₺)':'9999','Ekran (inç)':'6.8','Pil (mAh)':'5010','Kamera (MP)':'50','RAM (GB)':'8','Su Geçirmezlik':'IP54','Kalınlık (mm)':'8.1','Genişlik (mm)':'76.5','Uzunluk (mm)':'168','Ekran Türü':'NXTPAPER LCD','Piksel Yoğunluğu (PPI)':'268','Çözünürlük':'720x1612','Yenileme Hızı (Hz)':'90','İşletim Sistemi':'Android 14','İşlemci':'MediaTek Dimensity 6300'}, addedAt:'2025-09-01', link:''},
  {id:'z8', name:'TCL 50 SE', cat:'Telefon', blurb:'Dayanıklı yapısı ve uzun pil ömrüyle öne çıkan bütçe dostu model', specs:{'Fiyat (₺)':'6499','Ekran (inç)':'6.75','Pil (mAh)':'5000','Kamera (MP)':'50','RAM (GB)':'4','Su Geçirmezlik':'IP54','Kalınlık (mm)':'8.2','Genişlik (mm)':'76','Uzunluk (mm)':'167','Ekran Türü':'IPS LCD','Piksel Yoğunluğu (PPI)':'260','Çözünürlük':'720x1612','Yenileme Hızı (Hz)':'90','İşletim Sistemi':'Android 14','İşlemci':'Unisoc T616'}, addedAt:'2025-10-01', link:''},
  {id:'z9', name:'TCL 30 SE', cat:'Telefon', blurb:"TCL'nin en uygun fiyatlı, temel ihtiyaçlara yönelik giriş seviyesi modeli", specs:{'Fiyat (₺)':'3499','Ekran (inç)':'6.52','Pil (mAh)':'5000','Kamera (MP)':'13','RAM (GB)':'4','Su Geçirmezlik':'-','Kalınlık (mm)':'8.4','Genişlik (mm)':'76','Uzunluk (mm)':'164.5','Ekran Türü':'IPS LCD','Piksel Yoğunluğu (PPI)':'269','Çözünürlük':'720x1600','Yenileme Hızı (Hz)':'60','İşletim Sistemi':'Android 12','İşlemci':'Unisoc SC9863A'}, addedAt:'2024-06-01', link:''},

  {id:'z10', name:'Casper VIA X40', cat:'Telefon', blurb:'120Hz AMOLED ekranlı, çentik tasarımlı üst-orta segment Casper modeli', specs:{'Fiyat (₺)':'14999','Ekran (inç)':'6.67','Pil (mAh)':'5000','Kamera (MP)':'50','RAM (GB)':'8','Su Geçirmezlik':'-','Kalınlık (mm)':'7.8','Genişlik (mm)':'76','Uzunluk (mm)':'163','Ekran Türü':'AMOLED','Piksel Yoğunluğu (PPI)':'395','Çözünürlük':'1080x2400','Yenileme Hızı (Hz)':'120','İşletim Sistemi':'Android 14','İşlemci':'MediaTek Helio G99'}, addedAt:'2025-11-01', link:''},
  {id:'z11', name:'Casper VIA A40', cat:'Telefon', blurb:'Ultra geniş ekranı ve yapay zeka destekli kamerasıyla öne çıkan yerli üretim telefon', specs:{'Fiyat (₺)':'11999','Ekran (inç)':'6.78','Pil (mAh)':'5000','Kamera (MP)':'64','RAM (GB)':'8','Su Geçirmezlik':'-','Kalınlık (mm)':'8','Genişlik (mm)':'76.5','Uzunluk (mm)':'165','Ekran Türü':'IPS LCD','Piksel Yoğunluğu (PPI)':'260','Çözünürlük':'1080x2460','Yenileme Hızı (Hz)':'90','İşletim Sistemi':'Android 14','İşlemci':'MediaTek Helio G99'}, addedAt:'2025-02-26', link:''},
  {id:'z12', name:'Casper VIA M40', cat:'Telefon', blurb:'Yapay zeka destekli üçlü kamera sistemine sahip fiyat/performans modeli', specs:{'Fiyat (₺)':'9999','Ekran (inç)':'6.6','Pil (mAh)':'5000','Kamera (MP)':'50','RAM (GB)':'6','Su Geçirmezlik':'-','Kalınlık (mm)':'8.2','Genişlik (mm)':'76','Uzunluk (mm)':'164','Ekran Türü':'IPS LCD','Piksel Yoğunluğu (PPI)':'267','Çözünürlük':'720x1612','Yenileme Hızı (Hz)':'90','İşletim Sistemi':'Android 14','İşlemci':'Unisoc T616'}, addedAt:'2025-06-01', link:''},

  {id:'z13', name:'Nubia Z80 Ultra', cat:'Telefon', blurb:'35mm özel optik lens ve değişken diyaframlı kamera odaklı fotoğrafçılık amiral gemisi', specs:{'Fiyat (₺)':'54999','Ekran (inç)':'6.8','Pil (mAh)':'7200','Kamera (MP)':'50','RAM (GB)':'12','Su Geçirmezlik':'IP69','Kalınlık (mm)':'8.6','Genişlik (mm)':'77.2','Uzunluk (mm)':'164.5','Ekran Türü':'AMOLED','Piksel Yoğunluğu (PPI)':'431','Çözünürlük':'1216x2688','Yenileme Hızı (Hz)':'144','İşletim Sistemi':'Android 16','İşlemci':'Snapdragon 8 Elite Gen 5'}, addedAt:'2025-11-06', link:''},
  {id:'z14', name:'ZTE Red Magic 11 Air', cat:'Telefon', blurb:'144Hz ekranı ve 7000mAh bataryasıyla uygun fiyatlı oyuncu telefonu', specs:{'Fiyat (₺)':'24999','Ekran (inç)':'6.8','Pil (mAh)':'7000','Kamera (MP)':'50','RAM (GB)':'12','Su Geçirmezlik':'IP54','Kalınlık (mm)':'8','Genişlik (mm)':'76.5','Uzunluk (mm)':'163.8','Ekran Türü':'AMOLED','Piksel Yoğunluğu (PPI)':'431','Çözünürlük':'1216x2688','Yenileme Hızı (Hz)':'144','İşletim Sistemi':'Android 16','İşlemci':'Snapdragon 8 Elite'}, addedAt:'2026-01-20', link:''},
  {id:'z15', name:'Nubia Red Magic 10 Pro', cat:'Telefon', blurb:'144Hz ekranı, RGB omuz tetikleyicileri ve güçlü soğutma sistemiyle oyuncu telefonu', specs:{'Fiyat (₺)':'44999','Ekran (inç)':'6.85','Pil (mAh)':'7050','Kamera (MP)':'50','RAM (GB)':'12','Su Geçirmezlik':'IP54','Kalınlık (mm)':'8.6','Genişlik (mm)':'77','Uzunluk (mm)':'164.5','Ekran Türü':'AMOLED','Piksel Yoğunluğu (PPI)':'425','Çözünürlük':'1116x2480','Yenileme Hızı (Hz)':'144','İşletim Sistemi':'Android 15','İşlemci':'Snapdragon 8 Elite'}, addedAt:'2024-12-01', link:''},
];

// ============================================================
// Haberler (haber/blog) örnek verisi — admin panelinden veya
// Supabase'den veri gelmezse bu liste kullanılır. Yapı products'a
// benzer: id aynı zamanda URL slug'ıdır, body paragraf dizisidir.
// ============================================================
const NEWS_SEED = [
  {
    id:'google-pixel-11-serisi-tanitildi',
    title:"Google Pixel 11 Ailesi 12 Ağustos'ta Tanıtılıyor: Dört Modelli Yeni Dönem",
    date:'2026-08-08', cat:'Telefon',
    summary:"Google, Pixel 11 serisini 12 Ağustos'ta düzenlenecek Made by Google etkinliğinde tanıtacak. Bu kez aile dört modele çıkıyor: Pixel 11, Pixel 11 Pro, Pixel 11 Pro XL ve ilk kez seriye eklenen Pixel 11 Pro Fold.",
    relatedProductId: null,
    body: [
      "Google, Pixel 11 serisini 12 Ağustos'ta gerçekleştireceği Made by Google etkinliğinde tanıtacak. Bu yıl aile üç değil dört modelden oluşuyor: standart Pixel 11, Pixel 11 Pro, büyük ekranlı Pixel 11 Pro XL ve serinin ilk kez konuk ettiği katlanabilir model Pixel 11 Pro Fold.",
      "Serinin kalbinde TSMC'nin 2 nanometre üretim sürecinde üretilen yeni Tensor G6 yonga seti yer alacak. Bu, Google'ın Tensor serisinde şimdiye kadarki en ileri üretim teknolojisine geçişi anlamına geliyor. Bellek tarafında da bir yükseliş var: başlangıç modellerinde bile depolamanın 128 GB'tan 256 GB'a çıkması bekleniyor, Pro modellerde 12 GB RAM konuşuluyor.",
      "Kamera tarafındaki en çok konuşulan yenilik kozmetik bir detay: arka kamera adasına entegre edilen 'Pixel Glow' adlı RGB aydınlatma şeridi. Sistem, gelen bildirimler ve sistem uyarıları için farklı renk ve animasyon desenleri kullanacak. Nothing telefonlarındaki Glyph Interface'e yakın bir fikir, Google'ın kendi yorumuyla. Batarya kapasitelerinin modele göre 4.850 ile 5.115 mAh arasında değişmesi bekleniyor.",
      "Fiyat tarafında standart Pixel 11'in yaklaşık 899 dolardan başlaması, Pro modelin 1.099 dolar, Pro XL'in 1.299 dolar, katlanabilir Pro Fold'un ise 1.899 dolar civarından satışa sunulması öngörülüyor. Türkiye fiyatları ve satış tarihi, küresel lansmandan sonra netleşecek."
    ]
  },
  {
    id:'huawei-pura-90s-matepad-air-2026-watch-kids-x1',
    title:"HUAWEI Üç Cepheden Birden Saldırıyor: Pura 90s, MatePad Air 2026 ve Watch Kids X1 19 Ağustos'ta Raflarda",
    date:'2026-08-08', cat:'Telefon',
    summary:"HUAWEI, telefon, tablet ve çocuk akıllı saati kategorilerinde aynı anda üç yeni ürünü 19 Ağustos'ta satışa sunuyor: Pura 90s serisi, MatePad Air 2026 tableti ve Watch Kids X1.",
    relatedProductId: null,
    body: [
      "HUAWEI bu kez tek bir ürünle değil, tam üç farklı cihaz ailesiyle Ağustos ayına giriyor. Şirket, mobil fotoğrafçılığa odaklanan Pura 90s akıllı telefon serisini, üretkenlik odaklı MatePad Air 2026 tabletini ve çocuklara yönelik geliştirilen Watch Kids X1 akıllı saatini 19 Ağustos'ta resmen satışa sunacağını duyurdu.",
      "Pura serisi HUAWEI'nin kamera ve tasarım vitrini olarak konumlandırdığı bir hat. Pura 90s bu çizgiyi sürdürüp ince gövde ve gelişmiş hesaplamalı fotoğrafçılık özellikleriyle öne çıkmayı hedefliyor. MatePad Air 2026 ise tablet tarafında üretkenliğe daha fazla ağırlık verildiğinin işareti; çok görevlilik ve masaüstü benzeri kullanım senaryoları vurgulanıyor.",
      "Asıl dikkat çeken cephe Watch Kids X1. HUAWEI bu modelle yetişkin akıllı saat pazarındaki rekabetin dışına çıkıp ebeveyn kontrolü ve çocuk güvenliğine özel bir segment açmayı hedefliyor. Bu, markanın HarmonyOS ekosistemini telefon ve tabletle sınırlı tutmayıp aile içi farklı kullanıcı profillerine yayma stratejisinin bir parçası olarak okunabilir.",
      "Üç ürünün de aynı tarihte HUAWEI'nin kendi çevrim içi mağazası ve yetkili satış noktaları üzerinden satışa çıkması planlanıyor. Türkiye'ye özel fiyat ve satış takvimi henüz netleşmedi; global satış tarihiyle Türkiye pazarına giriş arasında birkaç haftalık fark olması bu tür lansmanlarda alışılmadık değil."
    ]
  },
  {
    id:'iphone-18-pro-max-kamera-sizintisi-degisken-diyafram',
    title:"iPhone 18 Pro Max Sızıntısı: Apple İlk Kez Değişken Diyaframlı Kameraya Geçiyor",
    date:'2026-08-08', cat:'Telefon',
    summary:"Sızdırılan üretici belgelerine göre iPhone 18 Pro Max, Apple'ın telefon tarihinde ilk kez donanımsal değişken diyafram desteği sunacak. Yeni Sony IMX905 sensörüyle gelecek model, Eylül 2026'da resmen tanıtılması bekleniyor.",
    relatedProductId: 'u1',
    body: [
      "Apple'ın Eylül 2026'da tanıtması beklenen iPhone 18 Pro Max için sızdırıldığı iddia edilen dahili teşhis kayıtları bir noktayı doğruladı: telefon, şirketin tarihinde ilk kez donanımsal değişken diyafram mekanizmasına sahip olacak. Bu özellik rakip Android amiral gemilerinde yıllardır var ama Apple bugüne kadar hiç denemedi.",
      "Sızıntıya göre ana kamerada, önceki nesilde kullanılan sensörün yerini yeni bir Sony IMX905 alacak. Piksel boyutu yine 1,22 mikron'da kalıyor, yani sensör büyümüyor. Apple'ın asıl yatırımı, ışık miktarını mekanik olarak ayarlayabilen diyafram sistemine gidiyor. Düşük ışıkta ve portre çekimlerinde alan derinliği üzerinde daha fazla kontrol demek bu.",
      "Kameranın geri kalanında büyük bir değişiklik yok gibi görünüyor: telefoto, ultra geniş açı, LiDAR ve ön kamera sensörlerinin bir önceki nesille aynı kalması bekleniyor. Apple kamera sistemini baştan tasarlamıyor, en çok kullanılan ana lense odaklanan seçici bir yükseltme yapıyor.",
      "Tüm bunlar Apple tarafından doğrulanmadı, o yüzden temkinli okumak lazım. Artan bileşen maliyetleri yüzünden Pro Max'in fiyatının önceki nesle göre 200 dolar kadar artabileceği de ayrı bir iddia. Model resmen tanıtılana kadar TeknoVersus'taki iPhone 18 Pro sayfası 'beklenen ürün' olarak kalacak; lansmanla birlikte tam karşılaştırma sayfasına kavuşacak."
    ]
  },
  {
    id:'samsung-galaxy-s27-ultra-sizintilari-tasarim-degisiyor',
    title:"Galaxy S27 Ultra Sızıntıları: Samsung Yıllardır Değişmeyen Tasarımı Kökten Değiştirebilir",
    date:'2026-08-08', cat:'Telefon',
    summary:"2027 başında tanıtılması beklenen Galaxy S27 Ultra için art arda gelen sızıntılar; kamera dizilimi, LPDDR6 bellek ve nihayet 5000 mAh sınırını aşabilecek batarya gibi önemli değişikliklere işaret ediyor.",
    relatedProductId: 'u2',
    body: [
      "Samsung'un bir sonraki amiral gemisi Galaxy S27 Ultra, resmi tanıtımına aylar kala şimdiden sızıntı gündeminin merkezinde. 2027'nin başında, muhtemelen Şubat ayında beklenen model için ortaya çıkan bilgiler, Samsung'un Ultra serisinde yıllardır koruduğu tasarım dilini kökten değiştirebileceğini gösteriyor.",
      "En dikkat çekici iddia, S21 Ultra'dan bu yana kullanılan 10 MP'lik 3x telefoto lensin tamamen kaldırılabileceği. Gerekçe olarak yeni ana sensörde (muhtemelen 200 MP çözünürlüklü ISOCELL HP6) yer alacağı öne sürülen LOFIC teknolojisi gösteriliyor. Bu teknolojinin kayıpsız dijital yakınlaştırmayı ayrı bir fiziksel lensten daha iyi bir seviyeye taşıyabileceği konuşuluyor. Sonuç, daha sade bir arka kamera tasarımı ve batarya için kazanılan ekstra iç hacim olabilir.",
      "Performans tarafında henüz yaygınlaşmamış LPDDR6 bellek standardına geçiş konuşuluyor. Snapdragon 8 Elite Gen 6 Pro ile birlikte özellikle çoklu görev ve grafik yoğun uygulamalarda daha akıcı bir deneyim vaat ediyor bu kombinasyon. Belki en çok karşılık bulacak değişiklik batarya tarafında: Samsung'un Ultra serisinde yıllardır sabit kalan 5000 mAh sınırını nihayet aşabileceği iddia ediliyor. Çinli rakipler silikon-karbon pil teknolojisiyle 7000 mAh'i çoktan geride bıraktı, bu adım gecikmiş ama beklenen bir hamle olurdu.",
      "Ailede dördüncü bir model olarak Galaxy S27 Pro'nun da yer alabileceği konuşuluyor. Ultra'nın güçlü kamera ve ekran özelliklerini daha kompakt, S Pen'siz bir gövdede sunması bekleniyor. Tüm bu bilgilerin erken dönem prototiplere dayandığını ve resmi tanıtıma kadar değişebileceğini hatırlatmakta fayda var."
    ]
  },
  {
    id:'honor-robot-phone-lansman-tarihi',
    title:"Honor'dan Sıra Dışı Hamle: Robotik Kollu 'Robot Phone' Ağustos'ta Tanıtılıyor",
    date:'2026-08-08', cat:'Telefon',
    summary:"Honor, uzun süredir konuşulan Robot Phone modelinin Ağustos 2026'da resmen tanıtılacağını doğruladı. Telefonun en dikkat çekici özelliği, robotik bir kol üzerine yerleştirilmiş hareketli kamera sistemi.",
    relatedProductId: null,
    body: [
      "Çoğu marka yıllık kamera ve ekran iyileştirmeleriyle yarışırken Honor tamamen farklı bir konsepte imza atıyor. Şirket, teknoloji basınının uzun süredir gündeminde olan Honor Robot Phone modelinin Ağustos 2026'da resmen tanıtılacağını doğruladı.",
      "Telefonun öne çıkan özelliği, klasik sabit kamera adası yerine robotik bir kol üzerine yerleştirilmiş hareketli kamera sistemi. Kameranın açı ve konumunu fiziksel olarak değiştirebilmesi, otomatik takip, geniş panorama ve grup selfie gibi senaryolarda sabit kameralara göre farklı bir kullanım deneyimi sunması bekleniyor. Şirket ayrıca kamera üreticisi ARRI ile iş birliği yaptığını açıkladı; yapay zekâ destekli çekim özelliklerine sinema kalitesinde bir görsel dil kazandırmak istiyor.",
      "Honor, cihaz için Çin'de ön rezervasyon sürecini başlattı ama kesin küresel tanıtım tarihini henüz netleştirmedi. Bazı kaynaklar 12 Ağustos'u işaret ediyor. Robotik kamera mekanizması ve üst düzey donanımı düşünülünce telefonun markanın şimdiye kadarki en pahalı modellerinden biri olması bekleniyor.",
      "Telefonun Türkiye'ye gelip gelmeyeceği henüz belirsiz; bu tür deneysel modeller genellikle önce sınırlı pazarlarda satışa çıkıyor. Kesin teknik özellikler, fiyat ve satış bölgeleri Ağustos ayı içindeki resmi lansmanla netleşecek."
    ]
  },
  {
    id:'huawei-matebook-fold-ultimate-design-2026-tanitildi',
    title:"Huawei İkinci Nesil Katlanabilir Dizüstüsünü Tanıttı: MateBook Fold Ultimate Design",
    date:'2026-08-05', cat:'Dizüstü',
    summary:"Huawei, katlanabilir dizüstü bilgisayarı MateBook Fold Ultimate Design'ın ikinci neslini Çin'de tanıttı. Üç farklı bellek/depolama seçeneğiyle gelen model 3.700 dolardan başlıyor.",
    relatedProductId: null,
    body: [
      "Huawei, katlanabilir dizüstü bilgisayar kategorisindeki iddiasını sürdürüyor. Şirket, MateBook Fold Ultimate Design'ın ikinci neslini Çin'de resmen tanıttı. Cihaz, geçen yılki modelin tasarım felsefesini koruyup donanımda bir adım daha ileri gidiyor.",
      "Yeni model üç farklı bellek ve depolama kombinasyonuyla satışa sunuluyor: 24 GB + 512 GB, 24 GB + 1 TB ve 32 GB + 2 TB. Fiyatlar 24.999 yuandan (yaklaşık 3.700 dolar) başlıyor, en üst versiyon 29.999 yuana (yaklaşık 4.440 dolar) kadar çıkıyor. Katlanabilir dizüstülerin hâlâ niş ve pahalı bir kategori olduğunu bu fiyat aralığı bir kez daha gösteriyor.",
      "Katlanabilir laptop segmenti geleneksel dizüstülere kıyasla küçük kalsa da Huawei'nin arka arkaya ikinci nesli piyasaya sürmesi, şirketin bu formatta ciddi olduğunu gösteriyor. Rakiplerin çoğu henüz katlanabilir bir dizüstü modeli bile duyurmadı.",
      "Cihazın küresel pazarlara gelip gelmeyeceği, gelecekse hangi ülkelerde satışa çıkacağı henüz açıklanmadı. Huawei'nin önceki katlanabilir ürünlerinde olduğu gibi, önce Çin'de sınırlı bir lansman, ardından kademeli genişleme senaryosu bu model için de olası görünüyor."
    ]
  },
  {
    id:'cmf-clip-pro-acik-tasarimli-kulaklik-tanitildi',
    title:"CMF'den İlk Açık Tasarımlı Kulaklık: Clip Pro Tanıtıldı",
    date:'2026-08-04', cat:'Kulaklık',
    summary:"Nothing'in alt markası CMF, ilk açık tasarımlı (OWS) kablosuz kulaklığı Clip Pro'yu 4 Ağustos'ta tanıttı. Kulağı saran, kulak kanalını tıkamayan bir yapıyla farklı bir kategoriye giriyor.",
    relatedProductId: null,
    body: [
      "Nothing'in bütçe dostu alt markası CMF, ürün yelpazesine yeni bir kategori ekliyor. Şirket, ilk açık tasarımlı kablosuz stereo kulaklığı (OWS) Clip Pro'yu 4 Ağustos'ta resmen tanıttı.",
      "Birkaç gün önce sosyal medyada paylaşılan ipuçlarının ardından ürünün adı netleşmişti. Tanıtım öncesi yayımlanan kısa video, kulaklığın genel tasarım çizgisini gösteriyordu; kulağı saran, kulak kanalını tıkamayan bir yapı öne çıkıyor.",
      "Açık tasarımlı kulaklıklar son dönemde özellikle spor yaparken veya çevre sesini duymaya devam etmek isteyenler arasında popülerleşti. CMF'nin bu kategoriye girmesi, markanın ürün yelpazesini klasik kulak içi ve kulak üstü modellerin ötesine taşıma isteğinin bir işareti.",
      "Clip Pro'nun tam teknik özellikleri ve Türkiye satış planı henüz netleşmedi. CMF'nin önceki ürünlerinde olduğu gibi, agresif bir fiyatlandırma stratejisi izlemesi bekleniyor."
    ]
  },
  {
    id:'huawei-watch-gt-7-serisi-tanitildi-21-gun-pil',
    title:"Huawei Watch GT 7 Serisi Tanıtıldı: 21 Güne Kadar Pil Ömrü",
    date:'2026-08-06', cat:'Akıllı Saat',
    summary:"Huawei, yeni akıllı saat ailesi Watch GT 7 serisini Çin'de tanıttı. Standart ve Pro modelden oluşan seri, 3.000 nit parlaklıklı ekran ve 21 güne varan pil ömrü sunuyor.",
    relatedProductId: null,
    body: [
      "Huawei, yeni nesil akıllı saat ailesi Watch GT 7'yi Çin'de tanıttı. Seri, standart Watch GT 7 ve üst seviye Watch GT 7 Pro olmak üzere iki modelden oluşuyor. Donanım tarafında büyük bir sıçrama yok; şirket bunun yerine spor takibi ve yazılım özelliklerine ağırlık vermiş.",
      "Standart model paslanmaz çelik ve plastik kasayla geliyor, 41 mm ve 46 mm olmak üzere iki boyut seçeneği sunuyor. Küçük versiyon 9,9 mm inceliğinde ve 1,32 inç ekrana sahip, 46 mm'lik versiyonda ekran 1,47 inça çıkıyor. Pro model titanyum ve seramik kombinasyonunu koruyor, ayrıca EKG sensörü ekliyor.",
      "İki model de 466x466 piksel çözünürlüklü, 3.000 nit tepe parlaklığına ulaşan AMOLED panel kullanıyor. Sensör tarafında kalp atış hızı, SpO2 ve cilt sıcaklığı ölçümü standart; GPS, NFC, mikrofon ve hoparlör de her iki modelde mevcut. 110'dan fazla spor modu destekleniyor, bisiklet kullanıcıları artık rotayı telefondan planlayıp saate aktarabiliyor.",
      "En dikkat çekici yeniliklerden biri Pro Ski Mode. Bu özellik kayak rotalarını gösterebiliyor, G kuvveti gibi verileri kaydedebiliyor. Pil ömrü tarafında Huawei, hafif kullanımda 21 güne, normal kullanımda 12 güne, her zaman açık ekran etkinken 7 güne kadar dayanım vaat ediyor.",
      "Fiyatlar Çin'de Watch GT 7 için 41 mm'de 1.588 yuan, 46 mm'de 1.688 yuandan başlıyor; Pro model 2.688 yuandan (yaklaşık 399 dolar) satışa sunuluyor. Küresel satış tarihi ve Türkiye fiyatları henüz açıklanmadı."
    ]
  },
  {
    id:'samsung-galaxy-tab-s12-ultra-geekbench-sizintisi',
    title:"Galaxy Tab S12 Ultra Geekbench'te Görüldü: Samsung Bu Kez MediaTek'e Geçiyor",
    date:'2026-08-02', cat:'Tablet',
    summary:"Samsung'un amiral gemi tableti Galaxy Tab S12 Ultra, Geekbench'te SM-X946B model numarasıyla ortaya çıktı. Sızıntı, tabletin bu kez Qualcomm yerine MediaTek Dimensity 9500 kullanacağını gösteriyor.",
    relatedProductId: null,
    body: [
      "Samsung'un bir sonraki amiral gemi tableti Galaxy Tab S12 Ultra, resmi tanıtımından haftalar önce Geekbench veritabanında ortaya çıktı. SM-X946B model numaralı cihaz, bir önceki nesil Galaxy Tab S11 Ultra'nın SM-X936B numarasıyla neredeyse birebir örtüşüyor; bu da sızıntının gerçekliğine dair güçlü bir işaret.",
      "Asıl sürpriz işlemci tarafında. Listeleme tek çekirdekte 2.424, çok çekirdekte 8.446 puan gösteriyor. Çekirdek yapısı (bir ana, üç performans, dört verimlilik çekirdeği) ve 4,21 GHz tepe hızı, Qualcomm'un son iki nesil amiral gemi çipini tamamen devre dışı bırakıyor. Bunun yerine MediaTek'in henüz duyurulmamış Dimensity 9500'üne işaret ediyor. Samsung'un tarihsel olarak Qualcomm silikonu kullandığı bir ürün için bu, dikkat çekici bir yön değişikliği.",
      "Test edilen birimde 12 GB RAM bulunuyor; bu, bir önceki Ultra modelin giriş seviyesi bellek yapılandırmasıyla aynı. Samsung'un alışılmış stratejisini sürdürüp daha yüksek performans isteyenler için 16 GB'lık bir versiyon da sunması bekleniyor.",
      "Yazılım tarafında cihazın kutudan Android 17 tabanlı One UI 9 ile çıkması öngörülüyor. Sızan tasarım görselleri, ön kamera için ekran deliği yerine bir önceki nesilden tanıdık gelen çentik yapısının korunacağını gösteriyor. Samsung alışılmış takvimine sadık kalırsa Tab S12 Ultra'nın Eylül ayında Galaxy S26 FE ile birlikte tanıtılması bekleniyor."
    ]
  },
  {
    id:'lg-oled-w6-wallpaper-tv-turkiyede',
    title:"Dünyanın En İnce Kablosuz OLED TV'si Türkiye'de: LG OLED evo W6",
    date:'2026-08-08', cat:'Televizyon',
    summary:"LG, sadece 9 mm kalınlığındaki kablosuz OLED evo W6 Wallpaper TV'yi Türkiye'de satışa sundu. 77 ve 83 inç seçenekleriyle gelen model, görüntü ve sesi kablosuz olarak ekrana aktarıyor.",
    relatedProductId: null,
    body: [
      "LG, duvarla neredeyse bütünleşen ultra ince TV kategorisindeki iddiasını Türkiye pazarına taşıdı. Yeni OLED evo W6 Wallpaper TV, 77 ve 83 inç ekran seçenekleriyle satışa sunuldu. Modelin en dikkat çekici özelliği, sadece 9 mm kalınlığındaki gövdesi.",
      "Bu inceliği mümkün kılan şey, TV panelinin görüntü ve ses işleme donanımından ayrılması. LG'nin True Wireless teknolojisi sayesinde görüntü ve ses, ayrı bir kutu olan Zero Connect Box üzerinden kablosuz şekilde ekrana aktarılıyor. Sonuç olarak televizyonun bulunduğu duvarda kablo karmaşası neredeyse tamamen ortadan kalkıyor.",
      "LG, 31 Ağustos 2026'ya kadar W6 satın alan kullanıcılara Sound Suite M7 kablosuz hoparlör setini hediye ediyor. Bu, hem lansman kampanyası hem de markanın ekosistem odaklı satış stratejisinin bir parçası.",
      "Wallpaper serisi geleneksel olarak LG'nin en premium ve en pahalı TV hattı olarak konumlanıyor; W6 de bu çizgiyi sürdürüyor. Duvara neredeyse yapışan tasarımı, özellikle salon estetiğine önem veren ve TV'yi görünür bir cihaz olmaktan çıkarmak isteyen kullanıcıları hedefliyor."
    ]
  }
];

// ============================================================
// Supabase yapılandırması
// ------------------------------------------------------------
// Ürünler, görüntülenmeler ve yorumlar artık Supabase'deki gerçek
// paylaşılan veritabanında tutulur — tüm ziyaretçiler için anlık senkron.
// Favoriler ve "son gezdiklerin" ise kişisel kalmaya devam eder (localStorage).
// ============================================================

const SUPABASE_URL = 'https://qsetmleywkhjcntajphx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_z74ZnvDgMWR7JzQDezgdqg_G_eh3e5B';

// Admin oturumu varsa (giriş yapılmışsa) onun access_token'ı ile,
// yoksa herkese açık anahtar ile istek atar.
function getAdminAccessToken(){
  try{
    const raw = localStorage.getItem('tv_admin_session');
    if(!raw) return null;
    const s = JSON.parse(raw);
    if(!s.access_token || !s.expires_at || Date.now() > s.expires_at) return null;
    return s.access_token;
  }catch(e){ return null; }
}

function sbHeaders(extra){
  return Object.assign({
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + (getAdminAccessToken() || SUPABASE_KEY),
    'Content-Type': 'application/json'
  }, extra || {});
}

async function sbFetch(path, options){
  try{
    const res = await fetch(SUPABASE_URL + path, Object.assign({}, options, { headers: sbHeaders(options && options.headers) }));
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if(!res.ok) console.warn('Supabase isteği başarısız:', res.status, data);
    return { ok: res.ok, status: res.status, data };
  }catch(e){
    console.warn('Supabase isteğinde ağ hatası (internet yok ya da CORS):', e);
    return { ok: false, status: 0, data: null };
  }
}

function rowToProduct(row){
  return {
    id: row.id, name: row.name, cat: row.cat, blurb: row.blurb || '',
    addedAt: row.added_at, link: row.link || '', upcoming: !!row.upcoming,
    specs: row.specs || {}
  };
}

function productToRow(p){
  return {
    id: p.id, name: p.name, cat: p.cat, blurb: p.blurb || '',
    added_at: p.addedAt || null, link: p.link || '', upcoming: !!p.upcoming,
    specs: p.specs || {}, deleted: false
  };
}

// ---- Ürünler ----
async function loadSharedProducts(){
  const r = await sbFetch('/rest/v1/products?deleted=eq.false&select=*&order=added_at.desc');
  if(!r.ok || !r.data || !r.data.length) return [...SEED]; // veritabanı boşsa/erişilemezse örnek katalog
  return r.data.map(rowToProduct);
}

async function saveProductShared(product){
  const r = await sbFetch('/rest/v1/products', {
    method: 'POST',
    headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(productToRow(product))
  });
  return r.ok;
}

async function deleteProductShared(id){
  const r = await sbFetch('/rest/v1/products?id=eq.'+encodeURIComponent(id), {
    method: 'PATCH',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({ deleted: true })
  });
  return r.ok;
}

// ---- Haberler ----
function rowToNews(row){
  return {
    id: row.id, title: row.title, cat: row.cat || 'Telefon',
    date: row.date, summary: row.summary || '',
    body: Array.isArray(row.body) ? row.body : [],
    relatedProductId: row.related_product_id || null
  };
}

function newsToRow(n){
  return {
    id: n.id, title: n.title, cat: n.cat || 'Telefon',
    date: n.date || null, summary: n.summary || '',
    body: n.body || [], related_product_id: n.relatedProductId || null,
    deleted: false
  };
}

async function loadSharedNews(){
  const r = await sbFetch('/rest/v1/news?deleted=eq.false&select=*&order=date.desc');
  if(!r.ok || !r.data) return [...NEWS_SEED]; // veritabanı boşsa/erişilemezse örnek haberler
  return r.data.map(rowToNews);
}

async function saveNewsShared(newsItem){
  const r = await sbFetch('/rest/v1/news', {
    method: 'POST',
    headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(newsToRow(newsItem))
  });
  return r.ok;
}

async function deleteNewsShared(id){
  const r = await sbFetch('/rest/v1/news?id=eq.'+encodeURIComponent(id), {
    method: 'PATCH',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({ deleted: true })
  });
  return r.ok;
}

// ---- Görüntülenmeler ----
async function getViews(id){
  const r = await sbFetch('/rest/v1/views?product_id=eq.'+encodeURIComponent(id)+'&select=count');
  return (r.ok && r.data && r.data.length) ? r.data[0].count : 0;
}

async function incrementViews(id){
  const cur = await getViews(id);
  const next = cur + 1;
  const r = await sbFetch('/rest/v1/views', {
    method: 'POST',
    headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ product_id: id, count: next })
  });
  return r.ok ? next : null;
}

async function getAllViewCounts(products){
  const out = {};
  products.forEach(p => out[p.id] = 0);
  const r = await sbFetch('/rest/v1/views?select=product_id,count');
  if(r.ok && r.data) r.data.forEach(row => { out[row.product_id] = row.count; });
  Object.defineProperty(out, '_ok', { value: r.ok, enumerable: false });
  return out;
}

// ---- Puan / yorum ----
async function getRatings(id){
  // Halka açık sayfalarda sadece ONAYLANMIŞ yorumlar gösterilir.
  const r = await sbFetch('/rest/v1/ratings?product_id=eq.'+encodeURIComponent(id)+'&approved=eq.true&select=*&order=created_at.asc');
  if(r.ok && r.data) return r.data.map(row => ({ stars: row.stars, name: row.name, comment: row.comment, date: row.created_at }));
  return [];
}

async function addRating(id, stars, name, comment){
  await sbFetch('/rest/v1/ratings', {
    method: 'POST',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      product_id: id,
      stars: Math.max(1, Math.min(5, stars|0)),
      name: (name||'Anonim').slice(0,40),
      comment: (comment||'').slice(0,400)
      // approved sütunu veritabanında varsayılan olarak false — admin onaylamadan görünmez.
    })
  });
  return await getRatings(id); // sadece onaylı olanları döndürür (yenisi henüz onaysızdır)
}

// ---- Admin — yorum moderasyonu (sadece giriş yapmış admin görebilir/işlem yapabilir) ----
// ============================================================
// Kataloğa girmeyen ("bulunamadı") arama talepleri
// ============================================================
async function logMissedSearch(query){
  try{
    await sbFetch('/rest/v1/product_requests', {
      method: 'POST',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify({ query: (query||'').slice(0,200) })
    });
  }catch(e){}
}

async function getProductRequests(){
  const r = await sbFetch('/rest/v1/product_requests?resolved=eq.false&select=*&order=created_at.desc');
  return (r.ok && r.data) ? r.data : [];
}

async function resolveProductRequest(id){
  const r = await sbFetch('/rest/v1/product_requests?id=eq.'+id, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify({ resolved: true })
  });
  return r.ok;
}

async function deleteProductRequest(id){
  const r = await sbFetch('/rest/v1/product_requests?id=eq.'+id, { method: 'DELETE', headers: { 'Prefer': 'return=minimal' } });
  return r.ok;
}

// Arama hiçbir şey bulamazsa, en azından alakalı olabilecek ürünleri öner.
// Sorguda bir kategori adı geçiyorsa o kategoriden, geçmiyorsa genel en yüksek skorlulardan seçer.
function suggestFallbackProducts(query, products, scores){
  const q = (query||'').toLowerCase();
  const catMatch = CATS.find(c => q.includes(c.toLowerCase()));
  let pool = products.filter(p => !p.upcoming);
  if(catMatch) pool = pool.filter(p => p.cat === catMatch);
  return pool.sort((a,b) => (scores[b.id]||0) - (scores[a.id]||0)).slice(0,4);
}

async function getAllRatingsForAdmin(){
  const r = await sbFetch('/rest/v1/ratings?select=*&order=created_at.desc');
  return (r.ok && r.data) ? r.data : [];
}

async function approveRating(ratingId){
  const r = await sbFetch('/rest/v1/ratings?id=eq.'+ratingId, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({ approved: true })
  });
  return r.ok;
}

async function deleteRating(ratingId){
  const r = await sbFetch('/rest/v1/ratings?id=eq.'+ratingId, {
    method: 'DELETE',
    headers: { 'Prefer': 'return=minimal' }
  });
  return r.ok;
}

// ============================================================
// Kişisel depolama (favoriler, son gezilenler) — sadece bu tarayıcıda
// window.storage (Claude artifact önizlemesi) varsa onu, yoksa localStorage'ı kullanır.
// ============================================================

function hasClaudeStorage(){
  return typeof window !== 'undefined' && !!window.storage && typeof window.storage.get === 'function';
}

const LS_PREFIX = { true: 'tv_shared:', false: 'tv_personal:' };

async function storageGet(key, shared){
  if(hasClaudeStorage()){
    try{ return await window.storage.get(key, shared); }catch(e){ return null; }
  }
  try{
    const raw = localStorage.getItem(LS_PREFIX[shared]+key);
    return raw != null ? { key, value: raw, shared } : null;
  }catch(e){ return null; }
}

async function storageSet(key, value, shared){
  if(hasClaudeStorage()){
    try{ return await window.storage.set(key, value, shared); }catch(e){ return null; }
  }
  try{ localStorage.setItem(LS_PREFIX[shared]+key, value); return { key, value, shared }; }
  catch(e){ return null; }
}

// ============================================================
// Çerez onayı / KVKK bildirimi
// ============================================================
function hasCookieConsent(){
  try{ return localStorage.getItem('tv_cookie_consent') === '1'; }catch(e){ return false; }
}

function renderCookieBanner(privacyHref){
  if(hasCookieConsent()) return;
  const el = document.createElement('div');
  el.className = 'cookie-banner';
  el.innerHTML = `
    <span>Bu site, deneyiminizi iyileştirmek, istatistik toplamak ve iş ortaklığı/reklam bağlantılarını
    yönetmek için çerezler kullanır. Devam ederek çerez kullanımını kabul etmiş olursunuz.
    <a href="${privacyHref}">Gizlilik Politikası</a></span>
    <button class="btn btn-dark btn-sm" onclick="acceptCookies()">Kabul Et</button>
  `;
  document.body.appendChild(el);
}

function acceptCookies(){
  try{ localStorage.setItem('tv_cookie_consent', '1'); }catch(e){}
  const el = document.querySelector('.cookie-banner');
  if(el) el.remove();
}

async function getFavorites(){
  const r = await storageGet('favorites', false);
  return r ? JSON.parse(r.value) : [];
}

async function saveFavorites(idsArray){
  const r = await storageSet('favorites', JSON.stringify(idsArray), false);
  return !!r;
}

function ratingSummary(list){
  if(!list || !list.length) return { avg: null, count: 0 };
  const sum = list.reduce((a,r) => a + r.stars, 0);
  return { avg: Math.round((sum/list.length)*10)/10, count: list.length };
}

// ============================================================
// Son gezilenler (kişisel — sadece bu tarayıcıda)
// ============================================================
async function trackRecentlyViewed(id){
  const r = await storageGet('recentlyViewed', false);
  let list = r ? JSON.parse(r.value) : [];
  list = [id, ...list.filter(x => x !== id)].slice(0, 8);
  await storageSet('recentlyViewed', JSON.stringify(list), false);
  return list;
}

async function getRecentlyViewed(){
  const r = await storageGet('recentlyViewed', false);
  return r ? JSON.parse(r.value) : [];
}

// ============================================================
// Artı / eksi analizi — kategori ortalamasına göre veriden türetilir.
// Not: Pazarlama iddiası değildir; sadece girilen sayısal özelliklerin
// kategori içi göreli karşılaştırmasıdır.
// ============================================================
function prosConsFor(product, categoryProducts){
  const others = categoryProducts.filter(p => p.id !== product.id && !p.upcoming);
  const pros = [], cons = [];
  if(!others.length) return { pros, cons };

  const specKeys = Object.keys(product.specs || {}).filter(k => !/fiyat/i.test(k) && !/genişlik \(mm\)|uzunluk \(mm\)/i.test(k));
  specKeys.forEach(key => {
    const myVal = parseFloat(String(product.specs[key]).replace(',', '.'));
    if(isNaN(myVal)) return;
    const otherVals = others.map(p => parseFloat(String((p.specs||{})[key]||'').replace(',', '.'))).filter(v => !isNaN(v));
    if(otherVals.length < 2) return;
    const avg = otherVals.reduce((a,b)=>a+b,0) / otherVals.length;
    if(avg === 0) return;
    const diffPct = (myVal - avg) / avg;
    const lowerIsBetter = /ağırlık|gram|kalınlık/i.test(key);
    const better = lowerIsBetter ? diffPct < -0.08 : diffPct > 0.08;
    const worse = lowerIsBetter ? diffPct > 0.08 : diffPct < -0.08;
    if(better) pros.push(`${key}: kategori ortalamasının üzerinde (${product.specs[key]})`);
    else if(worse) cons.push(`${key}: kategori ortalamasının altında (${product.specs[key]})`);
  });

  // Fiyat konumu
  const priceKey = Object.keys(product.specs||{}).find(k => /fiyat/i.test(k));
  if(priceKey){
    const myPrice = parseFloat(String(product.specs[priceKey]).replace(/[^\d.,]/g,'').replace(',', '.'));
    const otherPrices = others.map(p => {
      const pk = Object.keys(p.specs||{}).find(k => /fiyat/i.test(k));
      return pk ? parseFloat(String(p.specs[pk]).replace(/[^\d.,]/g,'').replace(',', '.')) : NaN;
    }).filter(v => !isNaN(v));
    if(!isNaN(myPrice) && otherPrices.length >= 2){
      const avgPrice = otherPrices.reduce((a,b)=>a+b,0)/otherPrices.length;
      if(myPrice < avgPrice * 0.9) pros.push('Kategori ortalamasına göre daha uygun fiyatlı');
      else if(myPrice > avgPrice * 1.15) cons.push('Kategori ortalamasına göre daha yüksek fiyatlı');
    }
  }

  return { pros: pros.slice(0,4), cons: cons.slice(0,4) };
}

// ============================================================
// Skor hesaplama — kategori içi göreli "fiyat/performans" skoru (0-100)
// Not: Bu, girilen özellik değerlerinin ürünler arasında göreli normalizasyonuyla
// otomatik hesaplanan yaklaşık bir gösterge niteliğindedir; bağımsız bir laboratuvar
// benchmark'ı ya da nesnel bir performans testi DEĞİLDİR.
// ============================================================
function computeScores(products){
  const scored = products.filter(p => !p.upcoming);
  const byCat = {};
  scored.forEach(p => { (byCat[p.cat] = byCat[p.cat] || []).push(p); });

  const scores = {};
  Object.values(byCat).forEach(list => {
    // fiyatı bul ve ayıkla
    list.forEach(p => {
      const specs = p.specs || {};
      const priceKey = Object.keys(specs).find(k => /fiyat/i.test(k));
      const raw = priceKey ? specs[priceKey] : null;
      const num = raw ? parseFloat(raw.toString().replace(/[^\d.,]/g,'').replace(',','.')) : NaN;
      p.__price = isNaN(num) ? null : num;
    });
    const prices = list.map(p => p.__price).filter(v => v != null);
    const minPrice = prices.length ? Math.min(...prices) : null;

    // performans özelliklerini (fiyat hariç, sayısal) topla
    // Not: Genişlik/Uzunluk gibi salt fiziksel boyut bilgileri "daha iyi/kötü" bir performans
    // ekseni olmadığı için skorlamaya dahil edilmez, sadece bilgi amaçlı gösterilir.
    const perfKeys = new Set();
    list.forEach(p => Object.keys(p.specs || {}).forEach(k => {
      if(/fiyat/i.test(k)) return;
      if(/genişlik \(mm\)|uzunluk \(mm\)/i.test(k)) return;
      const v = parseFloat((p.specs[k]||'').toString().replace(',','.'));
      if(!isNaN(v)) perfKeys.add(k);
    }));
    const ranges = {};
    perfKeys.forEach(k => {
      const vals = list.map(p => parseFloat((p.specs[k]||'').toString().replace(',','.'))).filter(v => !isNaN(v));
      if(vals.length) ranges[k] = { min: Math.min(...vals), max: Math.max(...vals) };
    });

    list.forEach(p => {
      let sum = 0, count = 0;
      perfKeys.forEach(k => {
        const raw = p.specs[k];
        if(raw === undefined) return;
        const v = parseFloat(raw.toString().replace(',', '.'));
        if(isNaN(v)) return;
        const { min, max } = ranges[k];
        let norm = max === min ? 1 : (v - min) / (max - min);
        if(/ağırlık|kalınlık/i.test(k)) norm = 1 - norm; // düşük olan daha iyi
        sum += norm; count++;
      });
      const perfAvg = count ? sum / count : 0.5;
      let priceFactor = 1;
      if(minPrice != null && p.__price) priceFactor = minPrice / p.__price;
      p.__rawScore = perfAvg * priceFactor;
    });

    const maxRaw = Math.max(...list.map(p => p.__rawScore), 0.0001);
    list.forEach(p => { scores[p.id] = Math.round((p.__rawScore / maxRaw) * 100); });
  });

  return scores;
}

// ============================================================
// Basit deterministik sözde-rastgele üretici (fiyat geçmişi simülasyonu için)
// Not: Gerçek bir tarihsel fiyat API'sine bağlı değiliz; bu grafik TEMSİLİDİR,
// mevcut fiyattan geriye doğru makul bir dalgalanma üretir. UI'da açıkça
// "temsili/simüle edilmiş" olarak etiketlenir.
// ============================================================
function seededRandom(seedStr){
  let h = 0;
  for(let i=0;i<seedStr.length;i++){ h = (h*31 + seedStr.charCodeAt(i)) >>> 0; }
  return function(){ h = (h*1664525 + 1013904223) >>> 0; return h / 4294967296; };
}

function generatePriceHistory(product){
  const specs = product.specs || {};
  const priceKey = Object.keys(specs).find(k => /fiyat/i.test(k));
  const base = priceKey ? parseFloat((specs[priceKey]||'0').toString().replace(/[^\d.,]/g,'').replace(',','.')) : null;
  if(!base) return null;
  const rand = seededRandom(product.id);
  const labels = ['6 ay önce','5 ay önce','4 ay önce','3 ay önce','2 ay önce','1 ay önce','Bugün'];
  const data = [];
  let price = base * (1 + rand()*0.16 + 0.04);
  for(let i=0;i<labels.length;i++){
    if(i === labels.length-1){ price = base; }
    else{
      const remaining = labels.length - 1 - i;
      price = price - (price-base)/(remaining+1) * (0.5 + rand()*0.6);
    }
    data.push(Math.round(price));
  }
  return { labels, data, currency: priceKey && priceKey.includes('₺') ? '₺' : '$' };
}

function getPalette(){
  return ['--c1','--c2','--c3','--c4','--c5','--c6','--c7'].map(v => getComputedStyle(document.documentElement).getPropertyValue(v).trim());
}

function colorFor(cat){
  const idx = CATS.indexOf(cat);
  const PALETTE = getPalette();
  return PALETTE[idx >= 0 ? idx % PALETTE.length : 0];
}

function fmtDate(iso){
  try{ return new Date(iso).toLocaleDateString('tr-TR', {day:'numeric', month:'long', year:'numeric'}); }
  catch(e){ return ''; }
}

// ============================================================
// Ürün detay sayfaları (urun/*.html) için slug/URL yardımcıları
// ============================================================
function slugify(name){
  const trMap = {'ı':'i','İ':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c'};
  return name
    .split('').map(ch => trMap[ch] !== undefined ? trMap[ch] : ch).join('')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
}

function productSlug(p){
  return `${slugify(p.name)}-${p.id}`;
}

function productUrl(p){
  return `urun/${productSlug(p)}.html`;
}

// Amazon Ortaklık (Associates) affiliate linki üretir — StoreID: teknoversus-21.
// Ürünün gerçek Amazon ürün linki (p.link) varsa ona ?/&tag= ekler;
// yoksa ürün adıyla Amazon arama sonucuna affiliate tag'i ekleyerek yönlendirir.
// urun/*.html (generate-site.js) ve karsilastir/*.html (generate-comparisons.js)
// sayfaları bu mantığın aynısını build sırasında zaten uyguluyor — bu fonksiyon
// index.html / category.js gibi istemci tarafında canlı render edilen kartlar içindir.
const AMAZON_AFFILIATE_TAG = 'teknoversus-21';
function affiliateLink(p){
  if(!p) return '';
  return p.link
    ? p.link + (p.link.includes('?') ? '&' : '?') + `tag=${AMAZON_AFFILIATE_TAG}`
    : `https://www.amazon.com.tr/s?k=${encodeURIComponent(p.name)}&tag=${AMAZON_AFFILIATE_TAG}`;
}

// Son gezilenler şeridini verilen container'a basar.
// Ürün detay sayfaları (urun/ altında) ile kök sayfalar farklı göreli yol
// gerektirdiği için location.pathname'e bakarak "urun/" ön ekini ayarlar.
async function renderRecentlyViewedInto(containerId, allProducts, excludeId){
  const container = document.getElementById(containerId);
  if(!container) return;
  const insideUrunFolder = location.pathname.includes('/urun/');
  const ids = (await getRecentlyViewed()).filter(id => id !== excludeId);
  const byId = {}; allProducts.forEach(p => byId[p.id] = p);
  const items = ids.map(id => byId[id]).filter(Boolean).slice(0,6);
  if(!items.length){ container.innerHTML = ''; return; }
  container.innerHTML = '<h2 style="font-size:14px;margin:14px 0 8px;color:var(--ink-soft);">Son gezdiklerin</h2>' +
    '<div class="recent-strip">' +
    items.map(p => {
      const href = insideUrunFolder ? productSlug(p) + '.html' : productUrl(p);
      return `<a href="${href}"><div style="font-weight:700;margin-bottom:3px;">${p.name}</div><div style="color:var(--ink-soft);">${p.cat}</div></a>`;
    }).join('') +
    '</div>';
}
