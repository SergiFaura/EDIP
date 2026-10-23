(() => {
  let disposeCurrent = null;
  let renderNumber = 0;
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === 'string') node.textContent = text;
    return node;
  };
  const safeURL = value => {
    if (typeof value !== 'string') return null;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
    } catch (_) { return null; }
  };
  const link = (text, url, className) => {
    const node = element('a', className, text);
    node.href = url;
    node.target = '_blank';
    node.rel = 'noopener';
    return node;
  };
  const dateOf = value => {
    const date = value instanceof Date ? value : new Date(typeof value === 'string' ? value : NaN);
    return Number.isFinite(date.getTime()) ? date : null;
  };
  const languageOf = value => {
    if (typeof value !== 'string') return null;
    try { return Intl.getCanonicalLocales(value)[0] || null; } catch (_) { return null; }
  };
  const validRating = value => typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 5;
  const numberFormat = new Intl.NumberFormat('ca', {maximumFractionDigits: 1});
  const dateFormat = new Intl.DateTimeFormat('ca', {day: 'numeric', month: 'long', year: 'numeric'});
  const rating = value => {
    const node = element('span', 'review-rating');
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', `${numberFormat.format(value)} de 5 estrelles`);
    const stars = element('span', 'review-stars', '★'.repeat(Math.round(value)) + '☆'.repeat(5 - Math.round(value)));
    stars.setAttribute('aria-hidden', 'true');
    const score = element('span', 'review-score', `${numberFormat.format(value)}/5`);
    score.setAttribute('aria-hidden', 'true');
    node.append(stars, score);
    return node;
  };

  window.EDIP_RENDER_REVIEWS = place => {
    if (disposeCurrent) disposeCurrent();
    const root = document.querySelector('#reviews-content');
    if (!root) return 'empty';
    root.replaceChildren();
    const renderId = ++renderNumber;
    const data = place && typeof place === 'object' ? place : {};
    // Google selects this limited set by relevance. Date order applies only to
    // this returned selection; it does not retrieve the business's latest reviews.
    const reviews = (Array.isArray(data.reviews) ? data.reviews : [])
      .filter(review => review && typeof review === 'object')
      .slice(0, 5)
      .map((review, order) => ({review, order, date: dateOf(review.publishTime)}))
      .sort((a, b) => (b.date?.getTime() ?? -Infinity) - (a.date?.getTime() ?? -Infinity) || a.order - b.order);
    const placeURL = safeURL(data.googleMapsURI);
    const section = element('section', 'reviews-carousel');
    section.setAttribute('aria-label', 'Ressenyes de Google Maps');
    section.setAttribute('aria-roledescription', 'carrusel');
    const header = element('div', 'reviews-heading');
    const summary = element('div', 'reviews-summary');
    summary.append(element('h2', 'reviews-place-name', typeof data.displayName === 'string' && data.displayName.trim() ? data.displayName : 'Opinions a Google Maps'));
    const summaryRating = element('div', 'reviews-summary-rating');
    if (validRating(data.rating)) summaryRating.append(rating(data.rating));
    if (Number.isSafeInteger(data.userRatingCount) && data.userRatingCount >= 0) {
      summaryRating.append(element('span', 'reviews-total', `${numberFormat.format(data.userRatingCount)} ${data.userRatingCount === 1 ? 'valoració' : 'valoracions'}`));
    }
    if (summaryRating.childElementCount) summary.append(summaryRating);
    header.append(summary);
    if (placeURL) header.append(link('Veure a Google Maps ↗', placeURL, 'reviews-source-link'));
    section.append(header);

    const footer = element('footer', 'reviews-attributions');
    // Unmodified GoogleMaps_Logo_DarkGray.svg from Google's official assets:
    // https://developers.google.com/static/maps/documentation/images/Google_Maps_Attribution_Assets.zip
    // The original 98 × 18 size and CSS clear space follow the attribution policy.
    const google = element('img', 'google-maps-attribution');
    google.src = '../images/google-maps-attribution.svg';
    google.alt = 'Google Maps';
    google.width = 98;
    google.height = 18;
    google.setAttribute('translate', 'no');
    footer.append(google);
    const providers = element('span', 'reviews-providers');
    const seenProviders = new Set();
    for (const attribution of Array.isArray(data.attributions) ? data.attributions : []) {
      const name = typeof attribution === 'string' ? attribution : attribution?.provider;
      if (typeof name !== 'string' || !name.trim()) continue;
      const url = safeURL(attribution?.providerURI);
      const identity = `${name}\n${url || ''}`;
      if (seenProviders.has(identity)) continue;
      seenProviders.add(identity);
      if (providers.childElementCount) providers.append(document.createTextNode(' · '));
      providers.append(url ? link(name, url) : element('span', '', name));
    }
    if (providers.childNodes.length) footer.append(providers);

    if (!reviews.length) {
      section.append(element('p', 'reviews-empty', 'Google no ha retornat ressenyes per mostrar ara.'), footer);
      root.append(section);
      root.dataset.reviewsState = 'empty';
      disposeCurrent = null;
      return 'empty';
    }

    const viewport = element('div', 'reviews-viewport');
    const grid = element('div', 'reviews-grid');
    grid.id = `reviews-grid-${renderId}`;
    viewport.append(grid);
    const controls = element('div', 'reviews-controls');
    const previous = element('button', 'review-nav', '←');
    const next = element('button', 'review-nav', '→');
    previous.type = next.type = 'button';
    previous.dataset.reviewPrev = '';
    next.dataset.reviewNext = '';
    previous.setAttribute('aria-label', 'Ressenya anterior');
    next.setAttribute('aria-label', 'Ressenya següent');
    previous.setAttribute('aria-controls', grid.id);
    next.setAttribute('aria-controls', grid.id);
    const position = element('p', 'reviews-position');
    position.dataset.reviewPosition = '';
    position.setAttribute('role', 'status');
    position.setAttribute('aria-live', 'polite');
    position.setAttribute('aria-atomic', 'true');
    position.tabIndex = -1;
    controls.append(previous, position, next);
    let index = 0, pendingFrame = null;
    const cards = reviews.map(({review, date}, cardIndex) => {
      const card = element('article', 'review-card');
      card.dataset.reviewIndex = String(cardIndex);
      card.setAttribute('aria-label', `Ressenya ${cardIndex + 1} de ${reviews.length}`);
      const author = element('div', 'review-author');
      const attribution = review.authorAttribution;
      const name = typeof attribution?.displayName === 'string' && attribution.displayName.trim() ? attribution.displayName : 'Autor no disponible';
      const authorURL = safeURL(attribution?.uri);
      const photoURL = safeURL(attribution?.photoURI);
      if (photoURL) {
        const photo = element('img', 'review-avatar');
        photo.src = photoURL;
        photo.alt = '';
        photo.width = photo.height = 40;
        photo.loading = 'lazy';
        photo.decoding = 'async';
        photo.referrerPolicy = 'no-referrer';
        photo.addEventListener('error', () => { photo.hidden = true; }, {once: true});
        author.append(photo);
      }
      const authorHeading = element('h3', 'review-author-name');
      authorHeading.append(authorURL ? link(name, authorURL) : document.createTextNode(name));
      author.append(authorHeading);
      card.append(author);
      const meta = element('div', 'review-meta');
      if (validRating(review.rating)) meta.append(rating(review.rating));
      if (date) {
        const time = element('time', 'review-date', dateFormat.format(date));
        time.dateTime = date.toISOString();
        meta.append(time);
      }
      if (meta.childElementCount) card.append(meta);
      const useOriginal = typeof review.originalText === 'string' && review.originalText.trim().length > 0;
      const reviewText = useOriginal ? review.originalText : review.text;
      const hasText = typeof reviewText === 'string' && reviewText.trim().length > 0;
      const text = element('p', hasText ? 'review-text review-text--collapsed' : 'review-text review-text--empty', hasText ? reviewText : 'Aquesta ressenya no inclou text.');
      const language = languageOf(useOriginal ? review.originalTextLanguageCode : review.textLanguageCode);
      if (hasText && language) text.lang = language;
      text.id = `review-text-${renderId}-${cardIndex}`;
      card.append(text);
      const more = element('button', 'review-read-more', 'Llegir més');
      more.type = 'button';
      more.dataset.reviewExpand = '';
      more.setAttribute('aria-controls', text.id);
      more.setAttribute('aria-expanded', 'false');
      more.setAttribute('aria-label', `Llegir més de la ressenya de ${name}`);
      more.hidden = true;
      let expanded = false;
      more.addEventListener('click', () => {
        expanded = !expanded;
        text.classList.toggle('review-text--collapsed', !expanded);
        more.textContent = expanded ? 'Llegir menys' : 'Llegir més';
        more.setAttribute('aria-expanded', String(expanded));
        more.setAttribute('aria-label', `${expanded ? 'Llegir menys' : 'Llegir més'} de la ressenya de ${name}`);
      });
      if (hasText) card.append(more);
      const reviewURL = safeURL(review.googleMapsURI);
      if (reviewURL) card.append(link('Veure ressenya ↗', reviewURL, 'review-original-link'));
      grid.append(card);
      return {card, measure: () => {
        if (hasText && !card.hidden) more.hidden = !expanded && text.scrollHeight <= text.clientHeight + 1;
      }};
    });

    const visibleCount = () => window.innerWidth >= 1120 ? 4 : window.innerWidth >= 900 ? 3 : window.innerWidth >= 600 ? 2 : 1;
    const update = () => {
      const count = visibleCount();
      index = Math.max(0, Math.min(index, reviews.length - count));
      const end = Math.min(index + count, reviews.length);
      let moveFocus = false;
      cards.forEach(({card}, cardIndex) => {
        const hidden = cardIndex < index || cardIndex >= end;
        if (hidden && card.contains(document.activeElement)) moveFocus = true;
        card.hidden = hidden;
        card.inert = hidden;
      });
      previous.disabled = index === 0;
      next.disabled = end >= reviews.length;
      position.textContent = `Ressenyes ${index + 1}${end > index + 1 ? `–${end}` : ''} de ${reviews.length}`;
      if (moveFocus) (!next.disabled ? next : !previous.disabled ? previous : position).focus();
      if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
      pendingFrame = requestAnimationFrame(() => {
        cards.forEach(item => item.measure());
        pendingFrame = null;
      });
    };
    previous.addEventListener('click', () => { index -= 1; update(); });
    next.addEventListener('click', () => { index += 1; update(); });
    const stage = element('div', 'reviews-stage');
    stage.append(viewport, controls);
    section.append(stage, element('p', 'reviews-selection-note', 'Selecció de ressenyes de Google, ordenada per data de publicació.'), footer);
    root.append(section);
    root.dataset.reviewsState = 'ready';
    window.addEventListener('resize', update);
    disposeCurrent = () => {
      window.removeEventListener('resize', update);
      if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
    };
    update();
    return 'ready';
  };
})();
