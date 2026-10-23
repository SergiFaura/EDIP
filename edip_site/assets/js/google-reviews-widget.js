(() => {
  const message = document.querySelector('#reviews-message');
  const content = document.querySelector('#reviews-content');
  const config = window.EDIP_GOOGLE_REVIEWS;
  let timer, finished = false, heightFrame = 0;
  const notify = (state, extra = {}) => window.parent.postMessage({type:'edip-google-reviews', state, ...extra}, location.origin);
  const resize = () => {
    cancelAnimationFrame(heightFrame);
    heightFrame = requestAnimationFrame(() => {
      const height = Math.ceil(document.body.getBoundingClientRect().height);
      notify('resize', {height: Math.max(120, Math.min(6000, height))});
    });
  };
  const fail = reason => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    content.replaceChildren();
    message.hidden = false;
    message.textContent = 'No s’han pogut carregar les ressenyes de Google.';
    notify('error', {reason});
  };
  let sameSiteParent = false;
  try { sameSiteParent = window.parent !== window && new URL(document.referrer).origin === location.origin; } catch (_) { /* No referrer. */ }
  if (!sameSiteParent) {
    message.textContent = 'Consulta les ressenyes des de l’apartat Opinions de la pàgina d’inici.';
    return;
  }
  if (!config || typeof config.apiKey !== 'string' || !/^[A-Za-z0-9_-]{20,128}$/.test(config.apiKey.trim())
      || typeof config.placeId !== 'string' || !/^[A-Za-z0-9_-]{10,256}$/.test(config.placeId.trim())) { fail('configuration'); return; }
  new ResizeObserver(resize).observe(document.body);
  window.gm_authFailure = () => fail('authorization');
  window.edipReviewsReady = async () => {
    if (finished) return;
    try {
      const {Place} = await google.maps.importLibrary('places');
      if (finished) return;
      const place = new Place({id:config.placeId.trim()});
      const fields = ['displayName','rating','userRatingCount','reviews','googleMapsURI','attributions'];
      try {
        await place.fetchFields({fields});
      } catch (error) {
        // Retry a temporary Google outage once, within the original timeout.
        // Authorization, quota and configuration errors need an actual fix.
        if (finished || !['UNAVAILABLE', 'INTERNAL', 'DEADLINE_EXCEEDED'].includes(error?.code)) throw error;
        await new Promise(resolve => setTimeout(resolve, 1200));
        if (finished) return;
        await place.fetchFields({fields});
      }
      if (finished) return;
      const state = window.EDIP_RENDER_REVIEWS(place);
      finished = true;
      clearTimeout(timer);
      message.hidden = true;
      notify('ready', {empty:state === 'empty'});
      resize();
    } catch (_) { fail('places-request'); }
  };
  timer = setTimeout(() => fail('timeout'), 20000);
  const url = new URL('https://maps.googleapis.com/maps/api/js');
  url.search = new URLSearchParams({key:config.apiKey.trim(), callback:'edipReviewsReady', libraries:'places', v:'weekly', language:'ca', region:'ES', loading:'async'}).toString();
  const script = document.createElement('script');
  script.src = url.href;
  script.async = true;
  script.referrerPolicy = 'strict-origin-when-cross-origin';
  script.onerror = () => fail('network');
  document.head.append(script);
})();
