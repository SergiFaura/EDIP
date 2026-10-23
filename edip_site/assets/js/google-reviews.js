(() => {
  const root = document.querySelector('[data-google-reviews]');
  if (!root) return;
  const config = window.EDIP_GOOGLE_REVIEWS;
  const valid = config && typeof config.apiKey === 'string' && /^[A-Za-z0-9_-]{20,128}$/.test(config.apiKey.trim())
    && typeof config.placeId === 'string' && /^[A-Za-z0-9_-]{10,256}$/.test(config.placeId.trim());
  // Without configuration, the existing direct Google Maps link remains usable.
  if (!valid) return;
  const retry = root.querySelector('[data-reviews-retry]');
  const panel = root.querySelector('[data-reviews-panel]');
  const status = root.querySelector('[data-reviews-status]');
  const template = root.querySelector('template');
  const placeholder = root.querySelector('[data-reviews-placeholder]');
  let iframe = null, timer = null;
  const reset = () => {
    clearTimeout(timer);
    iframe = null;
    panel.replaceChildren();
    panel.hidden = true;
    placeholder.hidden = false;
    panel.setAttribute('aria-busy', 'false');
    status.textContent = '';
  };
  const fail = () => {
    reset();
    status.textContent = 'Ara no podem carregar les ressenyes. Pots consultar-les directament a Google Maps o tornar-ho a provar.';
    retry.hidden = false;
  };
  const load = () => {
    if (iframe) return;
    retry.hidden = true;
    panel.hidden = false;
    placeholder.hidden = true;
    panel.setAttribute('aria-busy', 'true');
    status.textContent = 'Carregant les ressenyes de Google…';
    panel.append(template.content.cloneNode(true));
    iframe = panel.querySelector('iframe');
    timer = setTimeout(fail, 25000);
  };
  retry.addEventListener('click', load);
  window.addEventListener('message', event => {
    if (!iframe || event.source !== iframe.contentWindow || event.origin !== location.origin
        || event.data?.type !== 'edip-google-reviews') return;
    if (event.data.state === 'resize') {
      const height = event.data.height;
      if (Number.isFinite(height) && height >= 120 && height <= 6000) iframe.height = Math.ceil(height);
      return;
    }
    if (event.data.state === 'error') { fail(); return; }
    if (event.data.state === 'ready') {
      clearTimeout(timer);
      panel.setAttribute('aria-busy', 'false');
      status.textContent = event.data.empty ? 'Encara no hi ha ressenyes disponibles a Google Maps.' : '';
    }
  });
  root.querySelector('[data-reviews-notice]').hidden = false;
  // Start immediately on page load; neither scrolling nor a click is required.
  load();
})();
