
(() => {
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => [...c.querySelectorAll(s)];
  document.documentElement.classList.add('js');

  const header = $('[data-header]');
  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  const toggle = $('[data-menu-toggle]');
  const mobile = $('[data-mobile-menu]');
  const closeMenu = () => {
    if (!toggle || !mobile) return;
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Obrir el menú');
    mobile.hidden = true;
    document.body.classList.remove('menu-open');
  };
  toggle?.addEventListener('click', () => {
    if (!mobile) return;
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Obrir el menú' : 'Tancar el menú');
    mobile.hidden = open;
    document.body.classList.toggle('menu-open', !open);
    if (!open) mobile.querySelector('a')?.focus();
  });
  mobile?.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => {
    if (!mobile || mobile.hidden) return;
    if (e.key === 'Escape') { closeMenu(); toggle?.focus(); }
    if (e.key === 'Tab') {
      const items = [toggle, ...$$('a, button', mobile)].filter(Boolean);
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 1050) closeMenu(); });

  $$('[data-current-year]').forEach(el => el.textContent = new Date().getFullYear());

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    $$('.reveal').forEach(el => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -5%'});
    $$('.reveal').forEach(el => io.observe(el));
  }

  // Static-site contact form: validates locally and hands off to the user's email client.
  const form = $('[data-contact-form]');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const service = String(data.get('service') || '').trim();
    const contact = String(data.get('preferred_contact') || '').trim();
    const availability = String(data.get('availability') || '').trim();
    const message = String(data.get('message') || '').trim();
    const subject = `Sol·licitud de primera visita — ${name || 'Web EDIP'}`;
    const body = [
      `Nom: ${name}`,
      `Correu: ${email}`,
      `Telèfon: ${phone || 'No indicat'}`,
      `Servei orientatiu: ${service || 'No ho tinc clar'}`,
      `Canal preferit: ${contact || 'Indiferent'}`,
      `Disponibilitat orientativa: ${availability || 'No indicada'}`,
      '',
      message ? `Missatge: ${message}` : 'Sense informació clínica addicional.',
      '',
      'Sol·licitud preparada des del formulari web d’EDIP.'
    ].join('\n');
    const status = $('[data-form-status]', form);
    if (status) { status.hidden = false; status.textContent = 'S’obrirà el teu gestor de correu amb la sol·licitud preparada. Revisa-la i prem enviar al gestor de correu: encara no s’ha enviat. Si no s’obre, pots utilitzar el correu o el telèfon de contacte.'; }
    const recipient = form.getAttribute('action');
    if (!recipient?.startsWith('mailto:')) return;
    window.location.href = `${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  // Lightweight consent state. No analytics library is loaded in this project.
  const key='edip-cookie-consent-v1';
  const banner=$('[data-cookie-banner]');
  const dialog=$('[data-cookie-dialog]');
  const analytics=$('[data-analytics-consent]');
  let memoryConsent = null;
  const readConsent = () => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value && value.essential === true && typeof value.analytics === 'boolean'
        ? {essential:true, analytics:false} : null;
    } catch (_) { return memoryConsent; }
  };
  if (!readConsent() && banner) banner.hidden=false;
  const saveConsent = () => {
    memoryConsent = {essential:true, analytics:false};
    try { localStorage.setItem(key, JSON.stringify(memoryConsent)); } catch (_) { /* Storage may be unavailable; the site remains usable. */ }
    if (banner) banner.hidden=true;
  };
  $('[data-cookie-essential]')?.addEventListener('click',saveConsent);
  $$('[data-open-cookie-settings]').forEach(btn=>btn.addEventListener('click',()=>{
    if (analytics) analytics.checked=false;
    dialog?.showModal();
  }));
  $('[data-save-cookie-settings]')?.addEventListener('click',saveConsent);
})();
