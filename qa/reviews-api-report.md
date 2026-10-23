# Ressenyes dins d’EDIP — implementació del 14/10 i tancament del 15/10/2026

> **Substituït per [reviews-auto-report.md](reviews-auto-report.md), revisió del 16/10/2026.** Aquest document conserva la versió amb activació per clic. Des del canvi del 15/10, les ressenyes es carreguen automàticament a Inici amb configuració vàlida, independentment de clic, scroll i preferència de cookies. Les 112 proves i el SDK HTTP 200 descrits aquí són històrics: el flux automàtic té 111 checks amb mock correctes i una nova prova del SDK real no superada, amb 0 respostes registrades. No s’han validat ressenyes reals.

La integració està preparada perquè el visitant consulti les ressenyes de Google dins la home, demanant les més recents. **Encara no s’ha validat la càrrega de ressenyes reals:** la clau de producció continua buida. Les proves simulades i la càrrega del SDK amb una clau fictícia invàlida no acrediten les ressenyes retornades, el seu ordre ni l’autorització d’un projecte de Google Cloud.

## Configuració que queda a l’usuari

Editar només `edip_site/assets/js/google-reviews-config.js`: emplenar `apiKey` amb una clau de navegador restringida i conservar `placeId: 'ChIJD2Lre4XhphIR8x2oRi6jTCE'`, ja emplenat per a EDIP, llevat que la fitxa canviï. No hi ha altres paràmetres a tocar, sincronització obligatòria ni build.

El projecte de Google Cloud necessita facturació i **Maps JavaScript API** i **Places UI Kit** habilitades. La clau ha de tenir restriccions d’API per a aquests dos serveis i de lloc web/HTTP referrers per als dominis autoritzats. La clau de navegador és pública; no s’hi ha de posar una clau privada de servidor. El [README de la web](../edip_site/README.md) conté els dominis de producció i desenvolupament i el procediment complet. No s’ha llegit ni incorporat cap clau real, activat serveis ni configurat facturació durant aquest treball.

## Implementació

- `index.html` carrega la configuració i el controlador locals. Amb configuració vàlida en format, mostra «Mostrar ressenyes de Google». Sense clau, conserva l’estat informatiu i l’enllaç directe a Google Maps.
- El clic crea l’iframe local `assets/widgets/google-reviews.html`; només llavors el controlador del widget carrega el SDK de Google. El tancament retira l’iframe i el SDK del document, i permet tornar-lo a obrir. L’activació no es conserva entre càrregues.
- S’utilitza `gmp-advanced-place-details`, SDK `v=beta` i `gmp-place-reviews` amb `rank-preference="newest"`. Els fills directes demanen la fitxa, el nom, la valoració, les ressenyes i l’atribució oficial, sense resums d’IA.
- El component avançat és **Preview de pagament, nivell Pro**. Google controla la disponibilitat i la selecció de ressenyes: no es garanteix tot l’historial ni l’aparició immediata d’una ressenya nova. Es demana l’ordre més recent a Google; no s’ordena localment una mostra triada per rellevància.
- La targeta, els controls i les variables de color i tipografia conserven la paleta d’EDIP, amb amplada adaptable a mòbil i escriptori. Les atribucions de Google es mantenen visibles. No hi ha testimonis, puntuacions o recomptes copiats al codi de producció.
- Errors de xarxa, autorització, component o temps d’espera mostren un missatge i permeten reintentar. L’enllaç alternatiu continua disponible. No es desen ressenyes ni l’activació a `localStorage` o `sessionStorage`.

## Proves i límits

| Comprovació | Resultat verificat | Evidència |
| --- | --- | --- |
| Suite específica amb SDK simulat | **112 comprovacions, 0 fallades**, en 12 casos: configuració buida/invàlida, absència de JS, consentiment per clic, configuració `newest`, atribució, variables EDIP, tancament/reobertura, errors, missatges falsos i absència de persistència. | `browser-reviews-newest/report.json` |
| Layout del component simulat | Sense desbordament a 320, 350 i 1440 px. Les captures amb sufix `MOCK` contenen dades fictícies de prova; no acrediten la UI final ni ressenyes de Google. | `browser-reviews-newest/reviews-*-before.png`, `reviews-*-loaded-MOCK.png` |
| SDK real amb clau fictícia invàlida | SDK beta HTTP **200**, **0 errors CSP** observats, fallback correcte. S’han fet peticions reals al SDK i recursos de Google, però no s’han obtingut ressenyes reals ni emprat credencials d’un projecte facturable. | `reviews-sdk-smoke.json` |
| Auditoria estàtica | Renovada el 15/10: **18 HTML principals, 16 URL de sitemap, 17 imatges; 0 errors i 0 avisos.** | `static-reviews-api.json` |
| Sincronització | Renovada el 15/10: `maintenance/sync_site.py --check` retorna `changed: []`. | `reviews-api-validation.json` |
| Contrast | **10 parelles superen AA per a text normal.** Aquesta comprovació de la paleta local no és una auditoria de tots els elements interns de Google. | `contrast-reviews-api.json` |
| Regressió inicial del 14/10 | **85 casos de pàgina/amplada correctes** (17 pàgines × 5 amplades). La suite funcional dona **41/42**: `cookies-denied` registra `net::ERR_CONNECTION_REFUSED`. Es conserva aquest resultat inicial. | `browser-reviews-final/report.json` |
| Comprovació del 15/10 | **5 casos correctes** de l’accés antic `judith-faura.html` i **42/42 comprovacions funcionals correctes**. Els quatre escenaris d’emmagatzematge de cookies tenen `errors: []` i `failedRequests: []`. | `browser-reviews-recheck/report.json` |
| Cobertura combinada | **90 casos sobre les 18 pàgines** a 320, 375, 768, 1024 i 1440 px, reunint les dues passades; la suite funcional més recent passa **42/42**. No són 90 casos d’una única execució. | Els dos informes de navegador anteriors |
| Tests del sincronitzador | **3 proves correctes** el 14/10: propagació i idempotència, comprovació actual sense escriptures i rebuig d’una URL de mapa no autoritzada. Les dades globals es conserven segons la comparació de hashes amb la còpia anterior. | `reviews-api-validation.json` |

La incidència de connexió del 14/10 no s’ha reproduït el 15/10, sense modificar els fitxers de producció. El runner incorpora el registre `requestfailed` per identificar possibles futures fallades de xarxa; el primer informe continua intacte. No s’ha determinat retrospectivament la petició concreta que va fallar. L’inventari geomètric de Mètode també registra l’H2 `visually-hidden` a −1 px: és el posicionament accessible deliberat, sense desbordament de la pàgina.

Les 112 comprovacions amb mock, la prova del SDK real amb clau invàlida i les deu parelles de contrast són evidències del 14/10 que es conserven. La represa del 15/10 completa el navegador, renova l’auditoria estàtica i comprova de nou la sincronització.

La prova del SDK real cobreix la seva descàrrega i el tractament d’una clau invàlida. No certifica una resposta correcta de Places UI Kit, la facturació, l’ordre real, totes les peticions del component carregat ni la CSP amb ressenyes reals. Les proves amb mock tampoc ho certifiquen. Abans de publicar aquesta funcionalitat cal comprovar la fitxa d’EDIP amb una clau restringida vàlida, l’ordre retornat, les atribucions, el layout i els headers reals del hosting.

## Seguretat i desplegament

La home permet l’iframe local amb `frame-src 'self'`. La resta de la seva CSP continua restrictiva. El widget té una política específica per als scripts, connexions, imatges i fonts de Google; només els seus estils permeten `unsafe-inline`. No s’autoritza `unsafe-eval` ni scripts inline. El controlador comprova origen, finestra emissora, tipus i estat dels missatges. El widget no inicia càrrega quan s’obre directament fora del pare del mateix origen.

El README diferencia les polítiques HTTP: la home necessita `frame-src 'self'`; el widget necessita `frame-ancestors 'self'` i `X-Frame-Options: SAMEORIGIN`. Aplicar-li `DENY` o la CSP base de les pàgines sense contingut incrustat impediria el funcionament. Aquests headers no s’han desplegat ni validat en producció.

Abans del clic no es carrega Google. Després, Google pot rebre IP i dades tècniques i carregar recursos o establir cookies. Tancar el component no desfà les transmissions ni esborra cookies anteriors. La preferència local de cookies d’EDIP no activa les ressenyes. Els textos de privacitat i cookies descriuen aquest servei opcional.

## Fonts i traçabilitat

Fonts oficials: [Advanced Place Details, Preview Pro i ordre de ressenyes](https://developers.google.com/maps/documentation/javascript/places-ui-kit/advanced-place-details), [configuració de Places UI Kit](https://developers.google.com/maps/documentation/javascript/places-ui-kit/get-started) i [restriccions i protecció de claus](https://developers.google.com/maps/api-security-best-practices).

El [report del 29/09](google-reviews-report.md) descriu l’accés directe provisional i la correcció de la fitxa Maps; és un antecedent. La preparació inicial del 13/10 encara no resolia l’ordre de més recents. Aquest informe correspon a l’adaptació del 14/10 al component avançat i al tancament local del 15/10. `reviews-api-before/` conserva l’estat anterior; `reviews-api-diff.patch` compara els canvis del lloc i `reviews-api-validation.json` recull el resum i els hashes de tancament. Queden pendents la clau restringida vàlida, la configuració del servei a Google Cloud, la prova amb ressenyes reals i la validació del hosting. Sense commit ni push.
