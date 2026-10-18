// ============================================================
// Amazon Ortaklık (Associates) linkleri — StoreID: teknoversus-21.
// shared.js'teki affiliateLink() / affiliateLabel() ile BİREBİR aynı mantık.
//  - Ürün linki amazon.com.tr ürün sayfasıysa: linke tag=teknoversus-21 eklenir
//    (varsa eski tag değeri değiştirilir).
//  - Link yoksa ya da Amazon dışı bir siteye gidiyorsa (epey, üretici sitesi
//    vb.): ürün adıyla etiketli Amazon araması açılır. Önceden etiket Amazon
//    dışı linklere de ekleniyor ve düğme "Amazon'da Satın Al" diyordu.
// ============================================================
const AMAZON_AFFILIATE_TAG = 'teknoversus-21';

function amazonProductUrl(p){
  const raw = (p && p.link ? String(p.link) : '').trim();
  if(!raw) return null;
  try{
    const u = new URL(raw);
    if(/(^|\.)amazon\.com\.tr$/i.test(u.hostname)){
      u.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
      return u.toString();
    }
  }catch(e){}
  return null;
}

function affiliateLink(p){
  if(!p) return '';
  return amazonProductUrl(p)
    || `https://www.amazon.com.tr/s?k=${encodeURIComponent(p.name)}&tag=${AMAZON_AFFILIATE_TAG}`;
}

function affiliateLabel(p){
  return amazonProductUrl(p) ? "Amazon'da Satın Al →" : "Amazon'da Fiyatını Gör →";
}

module.exports = { AMAZON_AFFILIATE_TAG, affiliateLink, affiliateLabel };
