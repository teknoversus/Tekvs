/* TeknoVersus — çerez onayı (Google Consent Mode v2 + banner)
 * Her sayfada, reklam (adsbygoogle) ve analytics (gtag) scriptlerinden ÖNCE yüklenir.
 * - Varsayılan: tüm depolama/reklam/analytics izinleri "denied" (onaysız çerez yazılmaz).
 * - Kabul Et  -> izinler "granted", tercih localStorage'a '1' olarak yazılır.
 * - Reddet    -> izinler "denied" kalır, tercih '0' olarak yazılır (banner bir daha çıkmaz).
 * - tvConsent.reset() ile tercih silinip banner yeniden gösterilir (Çerez Politikası sayfasındaki düğme).
 */
(function(){
  if(window.tvConsent) return;
  var KEY = 'tv_cookie_consent';
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  if(typeof window.gtag !== 'function') window.gtag = gtag;

  function read(){ try{ return localStorage.getItem(KEY); }catch(e){ return null; } }
  function write(v){ try{ if(v == null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); }catch(e){} }

  var DENIED  = { ad_storage:'denied',  ad_user_data:'denied',  ad_personalization:'denied',  analytics_storage:'denied' };
  var GRANTED = { ad_storage:'granted', ad_user_data:'granted', ad_personalization:'granted', analytics_storage:'granted' };

  // Varsayılan: reddedilmiş. Daha önce kabul edildiyse hemen güncelle (ilk istekten önce).
  var def = {}; for(var k in DENIED) def[k] = DENIED[k];
  def.wait_for_update = 500;
  gtag('consent', 'default', def);
  if(read() === '1') gtag('consent', 'update', GRANTED);

  function removeBanner(){
    var el = document.querySelector('.cookie-banner');
    if(el && el.parentNode) el.parentNode.removeChild(el);
  }

  function set(accepted){
    write(accepted ? '1' : '0');
    gtag('consent', 'update', accepted ? GRANTED : DENIED);
    removeBanner();
  }

  function privacyHref(){
    var d = (location.pathname.match(/\//g) || []).length - 1; // kökten derinlik
    var p = ''; for(var i = 0; i < d; i++) p += '../';
    return p + 'gizlilik-politikasi.html';
  }

  function show(){
    if(document.querySelector('.cookie-banner')) return;
    var el = document.createElement('div');
    el.className = 'cookie-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Çerez tercihleri');
    el.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;max-width:760px;margin:0 auto;' +
      'background:#1c1917;color:#f5f5f4;border-radius:12px;padding:14px 16px;box-shadow:0 8px 30px rgba(0,0,0,.35);' +
      'display:flex;gap:12px;align-items:center;flex-wrap:wrap;font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;';
    var txt = document.createElement('span');
    txt.style.cssText = 'flex:1 1 280px;';
    txt.innerHTML = 'Bu site istatistik ve reklam çerezlerini yalnızca onayınızla kullanır. Reddederseniz yalnızca site için gerekli depolama kullanılır. ' +
      '<a href="' + privacyHref() + '" style="color:#fbbf24;text-decoration:underline;">Gizlilik Politikası</a>';
    var wrap = document.createElement('span');
    wrap.style.cssText = 'display:flex;gap:8px;flex:0 0 auto;';
    function btn(label, accepted, primary){
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = label;
      b.style.cssText = 'cursor:pointer;border-radius:8px;padding:8px 16px;font:inherit;font-weight:600;border:1px solid ' +
        (primary ? '#fbbf24' : '#78716c') + ';background:' + (primary ? '#fbbf24' : 'transparent') + ';color:' + (primary ? '#1c1917' : '#f5f5f4') + ';';
      b.addEventListener('click', function(){ set(accepted); });
      return b;
    }
    wrap.appendChild(btn('Reddet', false, false));
    wrap.appendChild(btn('Kabul Et', true, true));
    el.appendChild(txt); el.appendChild(wrap);
    document.body.appendChild(el);
  }

  function boot(){ if(read() === null) show(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.tvConsent = {
    accept: function(){ set(true); },
    reject: function(){ set(false); },
    reset: function(){ write(null); removeBanner(); gtag('consent', 'update', DENIED); show(); },
    status: function(){ var v = read(); return v === '1' ? 'accepted' : v === '0' ? 'rejected' : 'unset'; }
  };
})();
