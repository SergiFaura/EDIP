# EDIP — ressenyes de Google en carrusel

Tancament i revisió: **21/10/2026**. Càrrega real validada el **20/10/2026**; suite del carrusel, auditoria estàtica, sincronització i contrast comprovats de nou el 21/10. Es continua sobre el projecte rebut, conservant els canvis correctes. Sense commit ni push.

## Resultat real

La home carrega automàticament les ressenyes amb la clau i el Place ID que ja ha introduït la propietària. No cal prémer un botó d’activació ni afegir més dades al codi. `reviews-live-final.json` registra `passed: true`: SDK i `Places/GetPlace` HTTP 200, cinc ressenyes reals, cap error de consola, cap petició fallida i cap error JavaScript.

El component anterior de Places UI Kit fallava perquè aquesta API no estava activada al projecte (HTTP 403 a `reviews-live-before.json`). S’ha substituït per la biblioteca estable Places de Maps JavaScript API i `Place.fetchFields()`. La primera prova d’aquesta consulta va rebre un error temporal 503 (`reviews-live-after.json`); el reintent i la prova final van retornar HTTP 200. S’ha afegit un únic reintent automàtic als 1,2 segons per a `UNAVAILABLE`, `INTERNAL` o `DEADLINE_EXCEEDED`, dins del límit inicial de 20 segons. No es repeteixen automàticament errors d’autorització ni de quota.

## Presentació i funcionament

- Targetes pròpies amb els colors, les vores i la tipografia d’EDIP; autor, fotografia quan Google la proporciona, estrelles, data, text i enllaç original.
- Quatre targetes visibles amb amplada disponible de 1120 px o més; tres des de 900 px; dues des de 600 px; una per sota. Les amplades es mesuren dins de l’iframe.
- Fletxes laterals en tauleta/escriptori i sota la targeta al mòbil. Avancen una posició, oculten la targeta anterior i mostren la següent. Les cinc targetes es creen inicialment; les fletxes no tornen a consultar l’API.
- Controls de teclat, nom accessible, límits desactivats, comptador i targetes ocultes amb `hidden` i `inert`. Text complet accessible mitjançant «Llegir més», amb idioma identificat quan Google el proporciona.
- Alçada ajustada al contingut, inclosa l’expansió dels textos i els canvis d’amplada; cap contenidor vertical fix de la integració anterior.
- Atribució oficial de Google Maps en SVG local, sense modificar l’original, amb mida 98 × 18 px i espai de respecte. Origen documentat al renderer: paquet oficial `Google_Maps_Attribution_Assets.zip`.

**Límit de la font:** Places API retorna fins a cinc ressenyes seleccionades per Google per rellevància. El carrusel ordena aquesta selecció per data descendent; no garanteix les últimes cinc ressenyes del negoci ni recupera tot l’historial. No es copien testimonis antics ni s’inventen ressenyes. Referències: [ressenyes de Place](https://developers.google.com/maps/documentation/javascript/place-reviews), [dades retornades](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places#Place), [atribució](https://developers.google.com/maps/documentation/javascript/policies#google-maps-attribution-requirements) i [errors temporals RPC](https://developers.google.com/maps/documentation/javascript/reference/errors#RPCStatus).

## Validacions

| Comprovació | Resultat i evidència |
| --- | --- |
| Resposta real de Google, 20/10 | Cinc ressenyes, HTTP 200 i cap error. `reviews-live-final.json`. |
| Carrusel real | Escriptori: visibles 0–3, després 1–4; mòbil: una targeta i retorn amb fletxa. Alçada de document i iframe coincidents, sense overflow. Mateix informe real. |
| Suite de navegador, 21/10 | **168 comprovacions correctes, 0 fallides**. `browser-reviews-carousel/report.json`. |
| Cobertura funcional | Autocàrrega abans de clic/scroll, 4/3/2/1 targetes, fletxes i teclat, límits, canvi d’amplada, expansió i alçada, ordre de dates, màxim cinc, missatges falsificats rebutjats, errors/reintent/timeout, configuració buida/invàlida, sense JavaScript, sense persistència i independència de la preferència local. |
| Auditoria estàtica, 21/10 | 18 pàgines principals, 16 URL de sitemap, 17 imatges de contingut; **0 errors i 0 avisos**. `static-reviews-carousel.json`. |
| Sincronització, 21/10 | `maintenance/sync_site.py --check`: `changed: []`. Els tres tests de `qa/test_sync_site.py` passen, inclòs mode check sense escriptures. |
| Contrast i sintaxi, 21/10 | 16 parelles AA correctes, incloses sis del carrusel, a `contrast-reviews-carousel.json`; sintaxi Node dels tres scripts de ressenyes correcta. |
| Revisió visual | Captures de la suite a 320, 375, 800, 1100 i 1440 px. Revisades directament les de 320, 800 i 1440: targetes, marges, fletxes, textos i atribució llegibles. |
| Preservació | Comparació amb `reviews-carousel-before/`: cap fitxer eliminat, 35 fitxers idèntics, fotografies d’equip/sales i mapa de Contacte preservats. `reviews-carousel-diff.patch` exclou la configuració amb la clau. |

Les captures `*-MOCK.png` contenen dades sintètiques per comprovar disseny i casos límit; no són ressenyes reals ni formen part de producció. La prova real es registra separadament sense copiar textos de ressenyes ni la clau. Les captures de secció amaguen temporalment la capçalera fixa del navegador de prova per evitar superposicions del mecanisme de captura; això no modifica producció.

## Fitxers i manteniment

- `edip_site/assets/js/google-reviews-config.js`: continuen sent els únics dos camps, `apiKey` i `placeId`. S’han conservat els valors de la propietària; només s’han actualitzat comentaris de la integració.
- `edip_site/assets/js/google-reviews-widget.js`: SDK, consulta i reintent limitat; `google-reviews.js`: host automàtic, estat i alçada; nou `google-reviews-carousel.js`: targetes i controls.
- `edip_site/assets/css/google-reviews-widget.css`, `assets/css/styles.css`, `assets/widgets/google-reviews.html` i `index.html`: presentació i integració.
- Nou `assets/images/google-maps-attribution.svg`: atribució oficial. Les 17 imatges de contingut preexistents no s’han alterat.
- `edip_site/README.md`, `cookies.html`, `privacitat.html` i `avis-legal.html`: documentació coherent amb Places API i la càrrega automàtica.
- QA actual: `reviews_carousel_qa.cjs` (mock, sense xarxa externa real), `reviews_live_diagnose.cjs` (Google real amb diagnòstic redactat), `validate_site.py`, `contrast_check.py`, `test_sync_site.py`.

Per repetir: `node qa/reviews_carousel_qa.cjs http://127.0.0.1:8000 qa/browser-reviews-carousel`. La prova real és `node qa/reviews_live_diagnose.cjs http://127.0.0.1:8000 qa/reviews-live-final.json`, necessita xarxa a Google i fa una consulta amb la clau configurada; no cal executar-la com a part de cada prova mock. Les rutes de Node/Chrome d’aquest equip consten als runners/README. No executar els scripts històrics `implement_*`.

## Seguretat i límits de la validació

La clau de navegador és pública per disseny; ha de tenir restriccions de webs i API a Google Cloud. No s’ha imprès als informes ni s’ha incorporat al diff. Els textos externs s’insereixen amb `textContent`; només s’accepten URL HTTPS sense credencials, amb `noopener` als enllaços externs. Els missatges d’alçada/estat han de provenir de l’iframe actiu i del mateix origen, i l’alçada té límits numèrics. La CSP de Google queda confinada al document local del widget; no s’ha afegit `unsafe-eval` ni scripts inline. El logotip oficial és local.

No hi ha backend, dependències npm de producció, còpia persistent de ressenyes ni claus en storage. Google rep dades tècniques en entrar a Inici amb configuració vàlida, segons el comportament automàtic sol·licitat i els textos de privacitat actualitzats. El mapa de Contacte conserva l’activació voluntària anterior.

Aquest tancament valida la versió local en Chrome. No acredita desplegament, restriccions de referer del domini final ni headers del hosting; aquests es comproven en publicar, segons README. Tampoc converteix la selecció de cinc ressenyes en una garantia de novetat global. El resum de proves i hashes finals és `reviews-carousel-validation.json`; les evidències anteriors es conserven com a historial.
