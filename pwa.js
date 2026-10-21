// ============================================================
// TeknoVersus — PWA (uygulama olarak yükleme) yardımcısı.
// build.js'in son adımı (lib/pwa-inject.js) bunu sitedeki TÜM sayfaların
// <head>'ine ekler; böylece ürün, karşılaştırma, haber sayfalarında da
// (shared.js yüklemeyen sayfalar dahil) uygulama yüklenebilir.
//
// Yaptıkları:
//  1) /sw.js'i site kökünden kaydeder (alt klasörlerden de doğru adres).
//  2) Android/Chrome: tarayıcının yükleme önerisini yakalar, ziyaretçi en
//     az 2. sayfasındayken küçük, kapatılabilir bir "Uygulamayı yükle"
//     kutusu gösterir. Kapatılırsa 30 gün bir daha göstermez.
//  3) iPhone/Safari: yükleme önerisi API'si yok; 3. sayfadan sonra bir kez
//     "Paylaş → Ana Ekrana Ekle" ipucu gösterir (60 gün susar).
//  4) Analytics'e (gtag varsa) pwa_prompt_shown / pwa_install_click /
//     pwa_installed olaylarını gönderir.
// Uygulama zaten yüklü (standalone) açıldıysa hiçbir şey göstermez.
// ============================================================
(function(){
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function(){});
    });
  }

  function lsGet(k){ try { return window.localStorage.getItem(k); } catch(e){ return null; } }
  function lsSet(k, v){ try { window.localStorage.setItem(k, v); } catch(e){} }
  function track(name){ try { if (typeof window.gtag === 'function') window.gtag('event', name, { event_category: 'pwa' }); } catch(e){} }

  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  if (standalone) { track('pwa_open_standalone'); return; }

  var views = (parseInt(lsGet('tv_pwa_views') || '0', 10) || 0) + 1;
  lsSet('tv_pwa_views', String(views));

  var DAY = 24 * 3600 * 1000;
  function snoozed(key, days){
    var t = parseInt(lsGet(key) || '0', 10) || 0;
    return t && (Date.now() - t) < days * DAY;
  }

  function showBox(html, onInstall, snoozeKey){
    if (document.getElementById('tvPwaBox')) return;
    // Çerez bildirimi hâlâ ekrandaysa üst üste binmesin; bir sonraki sayfada dener.
    if (document.querySelector('.cookie-banner')) return;
    var box = document.createElement('div');
    box.id = 'tvPwaBox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Uygulamayı yükle');
    box.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483000;max-width:340px;width:calc(100% - 24px);box-sizing:border-box;' +
      'background:#121A24;color:#fff;border-radius:14px;padding:14px 14px 14px 16px;box-shadow:0 10px 30px rgba(0,0,0,.25);' +
      'font:14px/1.45 Inter,system-ui,sans-serif;display:flex;gap:12px;align-items:center;';
    box.innerHTML = '<img src="/assets/icon-192.png" alt="" width="40" height="40" style="width:40px;height:40px;border-radius:9px;background:#fff;flex:0 0 40px;">' +
      '<div style="flex:1;min-width:0;">' + html + '</div>' +
      (onInstall ? '<button type="button" id="tvPwaInstall" style="background:#EFB123;color:#1B211D;border:0;border-radius:9px;padding:0 14px;height:40px;font:inherit;font-weight:700;cursor:pointer;">Yükle</button>' : '') +
      '<button type="button" id="tvPwaClose" aria-label="Kapat" style="background:transparent;color:#C3CDD8;border:0;width:36px;height:40px;font-size:20px;cursor:pointer;">×</button>';
    document.body.appendChild(box);
    document.getElementById('tvPwaClose').addEventListener('click', function(){
      lsSet(snoozeKey, String(Date.now()));
      box.remove();
    });
    if (onInstall) document.getElementById('tvPwaInstall').addEventListener('click', function(){ onInstall(box); });
    track('pwa_prompt_shown');
  }

  // --- Android / Chrome / Edge ---
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    deferred = e;
    if (views < 2 || snoozed('tv_pwa_dismissed', 30)) return;
    var show = function(){
      showBox('<strong style="display:block;">TeknoVersus uygulaması</strong><span style="color:#C3CDD8;font-size:13px;">Ana ekrandan tek dokunuşla aç.</span>',
        function(box){
          if (!deferred) return;
          track('pwa_install_click');
          deferred.prompt();
          deferred.userChoice.then(function(c){
            if (c && c.outcome !== 'accepted') lsSet('tv_pwa_dismissed', String(Date.now()));
          }).catch(function(){});
          deferred = null;
          box.remove();
        }, 'tv_pwa_dismissed');
    };
    // Sayfa açılır açılmaz değil, okumaya başladıktan biraz sonra.
    setTimeout(show, 8000);
  });
  window.addEventListener('appinstalled', function(){
    track('pwa_installed');
    lsSet('tv_pwa_dismissed', String(Date.now()));
    var b = document.getElementById('tvPwaBox'); if (b) b.remove();
  });

  // --- iPhone / iPad Safari ---
  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  if (isIOS && isSafari && views >= 3 && !snoozed('tv_pwa_ios_hint', 60)) {
    window.addEventListener('load', function(){
      setTimeout(function(){
        showBox('<strong style="display:block;">Ana ekrana ekle</strong><span style="color:#C3CDD8;font-size:13px;">Alttaki Paylaş simgesine dokun, sonra “Ana Ekrana Ekle”yi seç.</span>', null, 'tv_pwa_ios_hint');
        if (document.getElementById('tvPwaBox')) lsSet('tv_pwa_ios_hint', String(Date.now()));
      }, 8000);
    });
  }
})();
