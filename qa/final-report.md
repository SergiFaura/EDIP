# EDIP — informe final de recuperació

> **Entrega del 23/10/2026:** aplicats els cinc ajustos de contingut/disseny, mapa automàtic real verificat i configuració de claus exclosa de Git però conservada al PC. Passen 56 comprovacions específiques, 90 casos de pàgina + 42 interaccions, 168 proves del carrusel, contrast i sincronització; auditoria estàtica sense errors/avisos. [release-report.md](release-report.md) és l’informe vigent. L’autorització actual demana commit inicial a `main`, push i etiqueta de recuperació; les notes històriques de no fer commit/push ja no s’apliquen a aquesta entrega.

> **Tancament del 21/10/2026 — ressenyes reals i carrusel:** la clau configurada ja funciona localment. La prova real final del 20/10 registra cinc ressenyes, HTTP 200, fletxes funcionals, quatre targetes a escriptori i una al mòbil, sense errors ni desbordaments. Renovades el 21/10 les **168 comprovacions del carrusel**, auditoria estàtica (0 errors/avisos), 16 parelles de contrast, tres tests de sincronització i `--check` sense divergències. [reviews-carousel-report.md](reviews-carousel-report.md) és l’informe vigent d’aquesta funcionalitat; substitueix les afirmacions històriques següents sobre clau buida, API pendent o widget avançat. Es conserven els altres canvis correctes. No s’ha fet commit ni push.

> **Revisió del 16/10/2026, càrrega automàtica implementada el 15/10:** Inici carrega les ressenyes amb configuració vàlida sense esperar clic, scroll ni elecció de cookies; només ofereix reintent en error. El mapa de Contacte manté el clic. Els textos dels 18 HTML i README descriuen aquest comportament. [reviews-auto-report.md](reviews-auto-report.md) substitueix les conclusions anteriors sobre activació voluntària de ressenyes. Passen 111 comprovacions amb mock, 20 casos de regressió sobre quatre pàgines, 42/42 funcions i l’auditoria estàtica renovada (0 errors/avisos). La nova prova del SDK real **no passa**, amb 0 respostes registrades, tot i detectar càrrega automàtica i fallback. La clau continua buida: no s’han validat ressenyes reals. Vegeu el nou informe, `browser-reviews-auto-regression/report.json` i `reviews-auto-validation.json` per a evidències i límits.

> **Tancament del 15/10/2026, implementació del 14/10:** preparada la consulta de les ressenyes més recents dins d’EDIP amb Advanced Place Details de Places UI Kit (`beta`, `newest`, Preview Pro de pagament), activació per clic i estil del lloc. Només cal configurar `apiKey` i, si canvia la fitxa, `placeId`, ja emplenat. La clau continua buida: **no s’han validat ressenyes ni ordre reals**. Verificats 112 checks amb SDK simulat, SDK real amb clau fictícia invàlida (HTTP 200, cap error CSP observat, fallback correcte), auditoria estàtica renovada sense errors/avisos, 10 parelles de contrast i 3 tests de sincronització. La cobertura combinada suma 90 casos de les 18 pàgines i la suite funcional més recent passa 42/42. Es conserva la passada inicial del 14/10, amb 85 casos i 41/42 funcions: la connexió refusada de `cookies-denied` no es reprodueix el 15/10, sense tocar producció. Vegeu [reviews-api-report.md](reviews-api-report.md), `browser-reviews-final/report.json`, `browser-reviews-recheck/report.json` i `reviews-api-validation.json`. Queden pendents la configuració Cloud/clau vàlida, les ressenyes reals i el hosting. Les afirmacions de setembre sobre una integració encara inexistent són històriques.

> **Actualització del 13/10/2026:** Contacte incorpora el mapa oficial d'EDIP, activat amb «Mostrar mapa de Google» i amb control de tancament, preservant l'estil i la privacitat per defecte. S'han actualitzat les dades globals, la CSP de Contacte, els textos de privacitat/cookies i README. Estat real verificat: 0 errors/avisos estàtics, 90 casos de regressió i 42 comprovacions funcionals, 35 comprovacions del mapa real i 3 tests del sincronitzador correctes. Vegeu [map-report.md](map-report.md), `static-map.json`, `browser-map/`, `browser-map-regression/` i `map-validation.json`. Els informes anteriors queden com a historial.

> **Actualització del 09/10/2026:** Equip inclou Judith Faura, Ester, Maria i Teresa amb els rols, les quatre fotos i les 36 formacions facilitades per l'usuari. Preservats l'estil, la presentació i la col·legiació de Judith, els CTA i els enllaços existents. Les fotos estan optimitzades en WebP, i la de Judith es comparteix amb la home. Vegeu [team-report.md](team-report.md) i les evidències `static-team.json`, `browser-team/` i `team-visual/`. Les evidències de setembre continuen com a historial; no descriuen aquesta ampliació.

> **Actualització del 29/09/2026:** a petició de l'usuari, retirats els fragments de Webador i afegit un accés directe a les ressenyes d'«EDIP | Educació i Psicologia» a Google Maps. Corregit globalment l'enllaç antic, que ara porta a la fitxa d'Amanda Cervera. **La càrrega automàtica de ressenyes dins del web encara queda pendent de disposar de Google Maps Platform configurat; no està implementada.** L'estat i les noves proves es documenten a [google-reviews-report.md](google-reviews-report.md). Les evidències i hashes de `final-validation.json` corresponen a la versió del 25/09 descrita a continuació, no als canvis posteriors de ressenyes.

Recuperació iniciada el 23 de setembre i validació final renovada el 25 de setembre de 2026. Treball continuat sobre `edip_site/`, sense reiniciar el projecte, canviar l'arquitectura, fer commit ni push.

## Reconstrucció i preservació

S'ha llegit el prompt complet i contrastat amb HTML, CSS, JS, assets i proves existents. Git estava inicialitzat, però sense commits: tot el projecte era no seguit i `git diff` no podia mostrar un historial anterior. S'ha conservat una còpia de l'estat rebut a `qa/recovery-before/edip_site/`; `qa/recovery-diff.patch` permet revisar les correccions d'aquesta recuperació.

La matriu `qa/recovery-requirements.md` diferencia requisits completats, parcials i absents en reprendre. Ja eren correctes les tarifes, la major part dels continguts de servei, el perfil complet de Judith, les cinc conversions WebP, les opinions i diversos canvis de privacitat. S'han preservat. Els hashes de les cinc fotografies continuen coincidint amb el registre original de conversió.

## Canvis completats

- **Navegació i contacte (1–3, 15–16, 20):** capçalera desktop/mòbil coherent als 18 HTML, CTA «Contacta’ns», Preguntes freqüents com a apartat principal, Maps exacte i adreça amb Entresol 1a. Eliminades les referències navegables i de sitemap als tres fitxers de Recursos ja retirats. Parella i familiar continuen separats al formulari i als chips.
- **Contingut i visuals (4–14, 17, 19, 22):** verificades tarifes, formació, modalitat online, cinc sales i opinions reals. Corregits l'estil absent d'un H2 accessible a Mètode, la jerarquia de targetes de Serveis i el seu desbordament a 320 px. Augmentat el contrast dels subtítols del finder, també quan se superposen al motiu decoratiu.
- **Menú mòbil:** corregit un problema preexistent després de fer scroll. El filtre de la capçalera contenia el menú fix i el retallava a 40 px. En obrir el menú es desactiva aquest filtre; la prova mostra ara els 828 px disponibles en una finestra de 900 px. No s'ha redissenyat la navegació.
- **Legals (18):** conservades les dades de les fonts autoritzades i completada l'associació de finalitats, bases, conservació i destinataris a Privacitat. Diferenciats domicili/correu legal i contacte assistencial. Eliminats els controls antics d'analítica que encara quedaven en sis pàgines. Les fonts i les decisions estan documentades a `qa/source-notes.md`.
- **SEO (21):** 18 titles/descriptions únics, H1 clar, canonical/OG coherents, 27 blocs JSON-LD vàlids i breadcrumbs concordants amb els visibles. El sitemap conté les 16 pàgines canòniques indexables. El 404 té noindex intencionat; l'accés antic de Judith apunta canònicament a Equip i queda fora del sitemap. Robots permet el rastreig dels recursos necessaris.
- **Manteniment i documentació (23, 25, 27):** font pública de dades globals, sincronització opcional amb Python estàndard, marcadors en HTML i README ampliat conservant les instruccions anteriors. No s'ha afegit framework, dependència de producció, backend ni build obligatori.
- **Revisió del 25/09:** completats tres usos globals que encara eren literals: títol d'adreça de Centre, nom/adreça assistencial de l'avís legal i nom del copyright dels 18 footers. Text i aspecte actuals preservats; la prova d'integració verifica ara que també s'actualitzin en canviar el JSON i que es conservin les dades del titular legal.
- **Seguretat i QA (24, 26, 28):** CSP/referrer coherents, JS revisat, regressions específiques incorporades a les proves i informes renovats.

## Fitxers principals

- Els 18 HTML de `edip_site/`, amb dades globals marcades i elements compartits coherents.
- `edip_site/assets/css/styles.css` i `edip_site/assets/js/main.js`.
- `edip_site/sitemap.xml`, `edip_site/site.webmanifest` i `edip_site/README.md`. `robots.txt` s'ha revisat i conserva el comportament correcte.
- Nous `maintenance/site-data.json`, `maintenance/sync_site.py` i proves/informes dins `qa/`.
- Els 14 assets físics rebuts es conserven, sense crear còpies de producció de les fotografies.

## Comprovacions realitzades

| Comprovació | Resultat / evidència |
| --- | --- |
| Sincronització | `sync_site.py --check`: cap canvi pendent. |
| Seguretat del sincronitzador | 2 proves d'integració: propagació de domini/contacte/assets/schema, idempotència, URL insegura rebutjada i mode check sense canvis de hashes ni dates. |
| Auditoria estàtica | 18 HTML, 16 URL de sitemap, 14 imatges; **0 errors i 0 warnings** a `qa/static-final.json`. |
| Enllaços i estructura | href/src/anchors, ID, labels, noms accessibles, headings, navegació compartida, canonical/OG, sitemap i JSON-LD verificats. |
| Navegador | **90 casos**: 18 pàgines × 320, 375, 768, 1024 i 1440 px; zero errors de consola, 404 inesperats, imatges trencades, peticions externes o overflow. `qa/browser-final/report.json`. Després dels últims marcadors globals, **15 casos addicionals** a Home, Centre i Avís legal també passen a `qa/browser-global-final/report.json`. |
| Funcionalitat | **46 comprovacions** entre suite principal i focalitzada: menú/teclat/focus, menú després de scroll, FAQ, camps obligatoris, email, consentiment, dues opcions parella/familiar, encoding d'accents i signes, missatge d'estat, absència de dades de formulari a storage, preferències, storage manipulat/bloquejat i fallback sense JS. |
| Fotografies | Cinc WebP preservats, 1086 × 1448 i aproximadament 109–161 kB; dimensions, alt, assignació i galeria verificades. `qa/assets-services-report.json`. |
| Contrast | Vuit parelles comprovades. Accent sobre fons fosc 5,72:1; subtítol finder en el cas decoratiu més desfavorable 4,57:1. `qa/contrast-final.json`. |
| Regressió visual | Captures de 12 pàgines a 375/1440, comparades amb l'estat rebut de les cinc principals; revisió independent d'equip, centre i serveis. Detalls de formulari, finder, opinions, menú i privacitat a `qa/focused-final/`. |
| Rendiment local | A cinc pàgines: LCP observat entre 0,764 i 0,948 s i CLS màxim 0,00189, en Chrome local sense limitació de xarxa i amb reutilització de caché. No són mesures de producció ni d'INP de camp. |
| Revisió final | Sintaxi JS, cerques de cadenes antigues/secrets, diff contra l'estat rebut i estat Git revisats. Sense commit ni push. |

El validador HTML és una auditoria estructural local amb lxml, no una certificació W3C. Les proves de `mailto:` intercepten la destinació per comprovar el correu preparat sense enviar res; l'obertura real requereix un gestor configurat al dispositiu. No s'ha executat una certificació en Safari/Firefox/Edge ni Google Search Console.

`qa/final-validation.json` resumeix les evidències i registra els hashes dels fitxers finals del lloc i de manteniment per facilitar una futura continuació sense confondre'ls amb els baselines històrics.

## Dades globals i mantenibilitat

La font de veritat és `maintenance/site-data.json`. Instagram, Maps, email, telèfon/WhatsApp, adreça, domini, logo, favicon, OG i rutes de fotografies compartides es modifiquen allà. Després s'executa `python maintenance/sync_site.py` i es revisa amb `--check`.

El sincronitzador actualitza HTML, JSON-LD, sitemap, robots i manifest. Tot continua disponible sense JavaScript. Els headers/footers es mantenen duplicats per preservar HTML estàtic rastrejable i usable; el validador comprova que els enllaços coincideixin. La navegació estructural, el contingut clínic/legal, preus, titles/descriptions i alt contextuals continuen als HTML. Canviar fotografies de dimensions diferents requereix revisar width/height i metadades d'imatge. El README explica aquestes limitacions i no presenta com centralitzat allò que encara és editorial.

### Inventari d'assets compartits

Totes les rutes següents són relatives a `edip_site/` i apunten a un únic fitxer físic.

| Asset | Ús real |
| --- | --- |
| `assets/images/logo-edip.png` | Logo dels 18 HTML, favicon, OG per defecte i icona del manifest. |
| `assets/images/judith-faura.webp` | Home i Equip, inclòs Person JSON-LD. |
| `assets/images/sala-adults.webp` | Home, Centre, Adults i Parella/família. |
| `assets/images/sala-adolescents.webp` | Centre i Infantil/juvenil. |
| `assets/images/sala-infants.webp` | Home i Centre. |
| `assets/images/sala-logopedia.webp` | Home, Centre, Logopèdia i Pedagogia/reeducacions. |
| `assets/images/sala-tallers.webp` | Centre i Tallers/formacions. |
| `assets/images/centre-passadis.webp` | Hero de la home i imatge del negoci en JSON-LD de deu pàgines. |

`centre-consulta.webp` i `centre-consulta-llum.webp` continuen a Mètode i Contacte respectivament. Les quatre fotografies antigues sense referències es conserven deliberadament; no s'ha fet una purga d'assets o CSS sense necessitat. No hi ha duplicats binaris ni captures `foto1..foto4` a producció.

## Seguretat

**Implementat:** CSP meta restrictiva basada en self als 18 HTML, referrer prudent, enllaços externs amb noopener, absència d'executables/styles inline i sinks XSS, inputs codificats i validats, storage limitat a preferències sense analítica. No s'han detectat secrets ni introduït recursos remots, trackers o dependències de producció. El detall és a `qa/security-review.md`.

**Depèn del hosting:** headers HTTP CSP amb frame-ancestors, X-Frame-Options, nosniff, Permissions-Policy, HTTPS/HSTS, caché/compressió, redireccions i resposta 404 real. Estan documentats al README; no s'afirma que ja estiguin desplegats. Publicar exclusivament `edip_site/`, excloent README si és possible, i mai `qa/`, `maintenance/` o `.git/`.

## Condicions abans de publicar

Totes les fonts autoritzades necessàries han estat accessibles. No queden requisits d'implementació pendents per falta de contingut. S'ha conservat el domini existent `https://www.ediptarrega.com`, que s'ha de confirmar al desplegar. Cal configurar el hosting, revisar professionalment els textos legals i fer les comprovacions de producció descrites al README. La revisió local no garanteix indexació, rendiment de camp ni seguretat absoluta.
