// ============================================================
// TeknoVersus — Yarı-otonom haber agent'ı.
// GitHub Actions'ta zamanlanmış olarak çalışır (bkz. .github/workflows/news-agent.yml).
// Claude API + web search kullanarak GÜNCEL bir teknoloji haberini bulur,
// tamamen özgün (paraphrase, alıntısız) Türkçe bir yazı üretir ve
// Supabase'e "pending_review: true" olarak ekler.
//
// ÖNEMLİ: Agent hiçbir zaman doğrudan yayınlamaz. Ürettiği her taslak,
// admin panelindeki "Bekleyen Haberler" kuyruğunda onay bekler — sen
// onaylamadan siteye asla çıkmaz.
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qsetmleywkhjcntajphx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_z74ZnvDgMWR7JzQDezgdqg_G_eh3e5B';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CATS = ['Telefon', 'Dizüstü', 'Kulaklık', 'Kamera', 'Akıllı Saat', 'Tablet', 'Televizyon'];

if (!ANTHROPIC_API_KEY) {
  console.error('HATA: ANTHROPIC_API_KEY ortam değişkeni ayarlı değil. GitHub Secrets\'a ekle.');
  process.exit(1);
}

function slugify(name) {
  const trMap = { 'ı':'i','İ':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c' };
  return name.split('').map(ch => trMap[ch] !== undefined ? trMap[ch] : ch).join('')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  return res;
}

// ---- 1) Hangi kategoride yazılacağını belirle: son 30 gündeki en az haberi olan kategori ----
async function pickCategory() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const res = await sbFetch(`/rest/v1/news?deleted=eq.false&date=gte.${since}&select=cat`);
  const rows = res.ok ? await res.json() : [];
  const counts = {};
  CATS.forEach(c => counts[c] = 0);
  rows.forEach(r => { if (counts[r.cat] !== undefined) counts[r.cat]++; });
  const sorted = [...CATS].sort((a, b) => counts[a] - counts[b]);
  return sorted[0];
}

// ---- 2) Mevcut haber başlıklarını çek (agent aynı konuyu tekrar yazmasın) ----
async function fetchRecentTitles() {
  const res = await sbFetch(`/rest/v1/news?deleted=eq.false&select=title,cat&order=created_at.desc&limit=40`);
  return res.ok ? await res.json() : [];
}

// ---- 3) Mevcut ürün kataloğunu çek (relatedProductId eşleştirmesi için) ----
async function fetchCatalogSummary(cat) {
  const res = await sbFetch(`/rest/v1/products?deleted=eq.false&cat=eq.${encodeURIComponent(cat)}&select=id,name`);
  return res.ok ? await res.json() : [];
}

// ---- 4) Claude API'ye web search ile haber yazdır ----
async function generateArticle(cat, existingTitles, catalogProducts) {
  const existingList = existingTitles
    .filter(t => t.cat === cat)
    .map(t => `- ${t.title}`).join('\n') || '(bu kategoride henüz haber yok)';
  const catalogList = catalogProducts.map(p => `${p.id}: ${p.name}`).join('\n') || '(katalogda bu kategoride ürün yok)';

  const systemPrompt = `Sen TeknoVersus adlı Türkçe teknoloji haber sitesinin editörüsün. Görevin: "${cat}" kategorisinde, SON 14 GÜN içinde gerçekleşmiş, doğrulanabilir bir teknoloji haberi bulup özgün bir Türkçe yazı hazırlamak.

KURALLAR (çok önemli, hepsine uy):
1. web_search aracıyla mutlaka gerçek, güncel bir haber bul. Uydurma, halüsinasyon yapma. Bulamazsan bunu belirt.
2. Aşağıdaki başlıklarla AYNI konuyu tekrar yazma:
${existingList}
3. Yazı TAMAMEN ÖZGÜN olmalı — hiçbir kaynaktan doğrudan alıntı yapma, tırnak işareti kullanma. Her şeyi kendi cümlelerinle, paraphrase ederek anlat.
4. Üslup: kısa-orta cümleler, doğal Türkçe, em-dash (—) kullanma, "ilginç bir detay olarak", "dikkat çekici bir şekilde" gibi dolgu ifadelerinden kaçın, abartılı/promosyon dili kullanma ("muhteşem", "inanılmaz" gibi kelimeler yok). Cümle uzunluğunu çeşitlendir, monoton ritimden kaçın.
5. 4 paragraf yaz, her biri 2-4 cümle.
6. Eğer haber şu ürünlerden biriyle doğrudan ilgiliyse (yeni sürümü, doğrudan rakibi vb.), ilgili ürünün id'sini relatedProductId olarak ver, değilse null bırak:
${catalogList}
7. Sadece aşağıdaki JSON formatında, başka HİÇBİR metin olmadan (kod bloğu işareti bile ekleme) cevap ver:
{"title":"...","summary":"1-2 cümlelik özet","date":"YYYY-MM-DD (haberin gerçekleştiği/duyurulduğu tarih)","body":["paragraf1","paragraf2","paragraf3","paragraf4"],"relatedProductId":null}

Eğer bu kategoride son 14 günde uygun, doğrulanabilir bir haber BULAMAZSAN, tam olarak şunu döndür: {"skip":true,"reason":"..."}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: `"${cat}" kategorisinde bugünün tarihi (${new Date().toISOString().slice(0,10)}) itibarıyla güncel bir haber bul ve yaz.` }],
      tools: [{ type: 'web_search_20250305', name: 'web_search' }]
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Anthropic API hatası (HTTP ${res.status}): ${text}`);
  }
  const data = await res.json();
  const textBlocks = data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
  const cleaned = textBlocks.replace(/```json|```/g, '').trim();

  // JSON'ı metin içinden çıkar (model bazen öncesinde/sonrasında ek metin bırakabilir)
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Model geçerli JSON döndürmedi:\n' + cleaned.slice(0, 500));
  return JSON.parse(match[0]);
}

// ---- 5) Supabase'e "onay bekliyor" olarak ekle ----
async function insertPendingNews(article, cat) {
  const id = slugify(article.title);
  const row = {
    id, title: article.title, cat, date: article.date || new Date().toISOString().slice(0, 10),
    summary: article.summary || '', body: article.body || [],
    related_product_id: article.relatedProductId || null,
    pending_review: true, deleted: false
  };
  const res = await sbFetch('/rest/v1/news', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(row)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase insert hatası (HTTP ${res.status}): ${text}`);
  }
  return id;
}

async function main() {
  console.log('→ Kategori seçiliyor...');
  const cat = await pickCategory();
  console.log(`→ Seçilen kategori: ${cat}`);

  console.log('→ Mevcut haberler ve katalog çekiliyor...');
  const [existingTitles, catalogProducts] = await Promise.all([
    fetchRecentTitles(),
    fetchCatalogSummary(cat)
  ]);

  console.log('→ Claude API ile haber araştırılıp yazılıyor (web search dahil)...');
  const article = await generateArticle(cat, existingTitles, catalogProducts);

  if (article.skip) {
    console.log(`→ Uygun haber bulunamadı, atlanıyor. Sebep: ${article.reason || 'belirtilmedi'}`);
    return;
  }
  if (!article.title || !article.body || !article.body.length) {
    throw new Error('Model eksik/hatalı bir taslak döndürdü: ' + JSON.stringify(article).slice(0, 300));
  }

  console.log(`→ Taslak: "${article.title}"`);
  const id = await insertPendingNews(article, cat);
  console.log(`✓ Supabase'e eklendi (onay bekliyor): news/${id}`);
  console.log('  Admin panelinde "Haberler" sekmesi → "Bekleyen Haberler" bölümünden onaylayabilirsin.');
}

main().catch(err => {
  console.error('HATA:', err.message);
  process.exit(1);
});
