// ============================================================
// Özellik değeri "yok" mu? ("Belirtilmemiş", "-", boş vb.)
// shared.js'teki specValueMissing ile AYNI kural (build tarafı için kopya).
// 6 Ekim 2026: Toplu eklenen ürünlerde 47 alanın çoğu "Belirtilmemiş" metniyle
// geliyor; bunlar artık tablolarda satır olarak gösterilmiyor.
// ============================================================
function specValueMissing(v){
  const t = String(v == null ? '' : v).trim().toLowerCase();
  return !t || /^(belirtilmemiş|belirtilmemis|henüz doğrulanmadı|henuz dogrulanmadi|bilinmiyor|bilgi yok|yok bilgi|-|—|–|n\/a|null|undefined)$/.test(t);
}
// [[anahtar, değer], ...] — yalnızca gerçek değeri olanlar
function realSpecEntries(specs){
  return Object.entries(specs || {}).filter(([, v]) => !specValueMissing(v));
}
module.exports = { specValueMissing, realSpecEntries };
