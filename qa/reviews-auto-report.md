# Ressenyes automàtiques — implementació del 15/10 i revisió del 16/10/2026

Amb `apiKey` i `placeId` vàlids en format, entrar a Inici inicia automàticament el component de ressenyes: no espera clic, scroll ni cap elecció a l’avís de cookies. Es manté la petició de les més recents amb Advanced Place Details (`beta`, `rank-preference="newest"`, Preview Pro). **La clau de producció continua buida i no s’han validat ressenyes ni ordre reals.**

Aquest informe substitueix, per al comportament actual, [reviews-api-report.md](reviews-api-report.md), que es conserva com a historial de la versió amb activació per clic.

## Canvis

- Inici inicia un únic iframe local amb configuració vàlida. No hi ha controls per mostrar o tancar les ressenyes; «Torna-ho a provar» només apareix en cas d’error. El focus no es trasllada al component en carregar-lo. Sense configuració o sense JavaScript es conserva l’enllaç directe a Google Maps.
- La càrrega demana a Google les ressenyes més recents i conserva les atribucions oficials. No es publiquen còpies de ressenyes ni puntuacions fixes. No es desen ressenyes ni estat d’activació al navegador.
- Els textos compartits dels 18 HTML, Privacitat, Cookies, Avís legal i README descriuen la càrrega automàtica quan la integració està configurada. Google rep IP i dades tècniques i pot utilitzar cookies; la preferència local de l’avís no bloqueja les ressenyes. El botó de l’avís diu «Entesos».
- El mapa de Contacte conserva l’activació per clic, el tancament i la càrrega inicial desactivada. Les dades legals i les fotografies es conserven.

## Evidències disponibles

| Comprovació | Resultat i abast |
| --- | --- |
| SDK simulat, 15/10 | `browser-reviews-auto/report.json`: **111 comprovacions correctes**, 0 fallades. Inclou càrrega sense clic/scroll/elecció de cookies, focus, petició `newest`, recàrrega, configuració absent/invàlida, errors, reintents i absència de persistència. No certifica ressenyes ni ordre reals. |
| SDK real amb clau fictícia invàlida, 15/10 | `browser-reviews-auto/sdk-smoke.json`: **prova no superada** (`passed: false`), amb **0 respostes del SDK** registrades. `automaticLoad: true`, 0 clics, 0 scrolls, un iframe inserit i `fallbackWorks: true`. El resultat no determina la causa de la manca de resposta ni valida la càrrega real. |
| Auditoria estàtica, renovada el 16/10 | `static-reviews-auto.json`: **18 HTML principals, 16 URL de sitemap i 17 imatges; 0 errors i 0 avisos**. |
| Sincronització, 16/10 | `maintenance/sync_site.py --check`: **`changed: []`**. |
| Regressió local del 16/10 | `browser-reviews-auto-regression/report.json`: **20 casos correctes** d’Inici, Contacte, Cookies i Privacitat a cinc amplades i **42/42 comprovacions funcionals**, sense errors ni fallades. Els nous textos compartits s’han verificat als **18/18 HTML**. |
| Revisió visual local completada | Revisades `browser-reviews-auto-regression/index-375-initial.png` i `index-1440-initial.png`: composició coherent i, a 375 px, avís i dos botons sencers dins del viewport. `browser-reviews-auto/reviews-320-loaded-MOCK.png` té amplada correcta; la posició dels elements fixos és un artefacte del scroll de la captura de secció. Les captures amb `MOCK` no mostren ressenyes reals ni validen el component amb contingut de Google. |

La prova `reviews-sdk-smoke.json` del 14/10 sí que va obtenir HTTP 200 amb una clau fictícia, però pertany a la versió anterior. No substitueix la prova fallida del flux automàtic ni demostra que aquesta nova versió hagi carregat el SDK real correctament.

## Configuració i límits

Es mantenen només dos valors a `edip_site/assets/js/google-reviews-config.js`: `apiKey`, buida, i `placeId`, ja emplenat amb la fitxa d’EDIP. No s’han llegit claus reals ni configurat Cloud/facturació. El [README](../edip_site/README.md) explica les API necessàries, les restriccions de clau pública de navegador i les variants CSP del hosting; no cal sincronització ni build per configurar aquests valors.

Queda pendent provar amb una clau vàlida restringida i Google Cloud configurat: càrrega real, fitxa d’EDIP, ordre retornat, atribucions, responsive i CSP amb tots els recursos servits. Google controla els resultats disponibles. Les dades que Google hagi rebut i les cookies que estableixi no s’esborren des de la preferència local d’EDIP. El mapa continua separat d’aquest comportament automàtic.

`reviews-auto-validation.json` recull el resum i els hashes de tancament, i `reviews-auto-diff.patch` permet revisar els canvis. Els informes anteriors es mantenen sense reescriure’n els resultats. Sense commit ni push.
