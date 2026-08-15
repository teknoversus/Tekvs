// ============================================================
// TeknoVersus — Fiyat geçmişi anlık görüntüsü.
// GitHub Actions'ta haftalık zamanlanmış çalışır (bkz. price-snapshot.yml).
// Her ürünün O ANKİ fiyatını price_history tablosuna bir satır olarak
// kaydeder. Aynı gün tekrar çalışırsa (unique constraint sayesinde)
// sessizce günceller, mükerrer satır oluşturmaz.
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qsetmleywkhjcntajphx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_z74ZnvDgMWR7JzQDezgdqg_G_eh3e5B';

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  return res;
}

function priceOf(specs){
  const key = Object.keys(specs || {}).find(k => /fiyat/i.test(k));
  if(!key) return null;
  const num = parseFloat(String(specs[key]).replace(/[^\d.,]/g, '').replace(',', '.'));
  return isNaN(num) ? null : num;
}

async function main(){
  console.log('→ Ürünler çekiliyor...');
  const res = await sbFetch('/rest/v1/products?deleted=eq.false&upcoming=eq.false&select=id,specs');
  if(!res.ok){
    console.error(`HATA: Ürünler çekilemedi (HTTP ${res.status})`);
    process.exit(1);
  }
  const products = await res.json();
  const today = new Date().toISOString().slice(0, 10);

  const rows = products
    .map(p => ({ product_id: p.id, price: priceOf(p.specs), recorded_at: today }))
    .filter(r => r.price != null);

  console.log(`→ ${rows.length}/${products.length} ürün için fiyat bulundu, kaydediliyor...`);

  const res2 = await sbFetch('/rest/v1/price_history', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows)
  });

  if(!res2.ok){
    const text = await res2.text().catch(() => '');
    console.error(`HATA: Kayıt başarısız (HTTP ${res2.status}): ${text}`);
    process.exit(1);
  }
  console.log(`✓ ${rows.length} fiyat anlık görüntüsü kaydedildi (${today}).`);
}

main().catch(err => { console.error('HATA:', err.message); process.exit(1); });
