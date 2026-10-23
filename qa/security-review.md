# Revisió de seguretat — validada de nou el 25/09/2026

> **Actualització del 23/10/2026:** el mapa de Contacte ara es carrega automàticament, tal com s’ha demanat; avisos i textos actualitzats. La CSP continua limitada al mateix domini oficial d’embed i no es transmeten camps del formulari. `.gitignore` exclou la configuració real, el fitxer de claus, còpies i evidències locals. Detector de credencials sobre l’índex i quatre tests incorporats; els fitxers locals no s’esborren. Vegeu [release-report.md](release-report.md) per a validació i abast del commit inicial autoritzat.

> **Ampliació vigent del 21/10/2026:** ressenyes reals mitjançant Places API (New), amb càrrega automàtica i carrusel propi. La clau pública de navegador ja està configurada i no es reprodueix en informes/diffs. Verificats inserció amb `textContent`, URL HTTPS sense credencials, `noopener`, origen/emissor de missatges, límits d’alçada, reintent temporal limitat i absència de persistència. La prova real del 20/10 passa sense errors CSP/consola; 168 checks mock renovats el 21/10. La CSP específica continua confinada al widget local. Vegeu [reviews-carousel-report.md](reviews-carousel-report.md) i `reviews-live-final.json`. Els apartats datats següents són històrics; les afirmacions de clau buida o absència de serveis externs no descriuen la integració actual.

Abast: HTML/CSS/JS estàtic d'EDIP, configuració pública de manteniment, assets i fitxers del projecte. No hi ha backend ni plataforma de desplegament definida.

Els apartats de la revisió del 25/09 es conserven com a evidència històrica. L'ampliació del 13/10 al final d'aquest document descriu el nou mapa opcional de Contacte i substitueix, per a aquesta funcionalitat, les afirmacions antigues d'absència d'iframes i de recursos externs.

## Troballes corregides

- Sis dels 18 HTML conservaven un script inline redundant, controls d'analítica inoperants i absència de CSP/referrer. Ara tots comparteixen CSP, referrer i controls de preferència local sense analítica.
- El JSON-LD de FAQ contenia cometes sense escapar; ara és JSON vàlid. El sincronitzador també escapa text/atributs i `<` en el JSON-LD que modifica.
- El sincronitzador nou tenia un nom de mètode en conflicte amb HTMLParser. S'ha corregit i provat la propagació de dades, idempotència, mode read-only i rebuig d'URL `javascript:` abans d'escriure.

## Proteccions verificades

- CSP meta a tots els HTML: recursos de mateix origen, cap `unsafe-inline`/`unsafe-eval`, `connect-src 'none'`, `object-src 'none'`, `base-uri 'none'`, `frame-src 'none'` i formularis limitats a self/mailto.
- Referrer Policy `strict-origin-when-cross-origin`; tots els `_blank` tenen `noopener`.
- Cap secret/credencial/clau privada detectat, cap sink dinàmic `innerHTML`, `outerHTML`, `document.write`, `eval`, `new Function` ni event handler inline. El JSON-LD inline és dada inert.
- Cap script/CSS/font remot, iframe, CDN, píxel ni tracker. Els 90 casos de pàgina/amplada no han fet peticions externes ni produït errors de consola/CSP.
- Formulari amb email/tel, límits de longitud, camps obligatoris, consentiment i URI codificat. Dues opcions parella/familiar i caràcters especials provats; el contingut no es converteix en HTML ni es desa. El text indica que encara falta enviar el correu des del gestor.
- `localStorage`: únicament `edip-cookie-consent-v1`, amb `{essential:true,analytics:false}`; lectura validada i `try/catch`. Provats estat nou, JSON invàlid, storage bloquejat i objecte manipulat. Cap `sessionStorage` ni dades clíniques/personals emmagatzemades.
- No existeixen dependències de producció ni package/lockfile que requereixin auditoria npm. Python/lxml/Pillow i Playwright són eines de manteniment/QA, fora del lloc.
- Els fitxers publicables no contenen `.env`, `.git`, backups, ZIP, captures, logs ni rutes internes. `http://` només apareix al namespace XML oficial i en instruccions locals del README, no com a recurs mixt.

Enllaços externs, activats només per l'usuari: Maps, WhatsApp, Instagram, AEPD i font d'opinions autoritzada. Schema.org és un vocabulari declarat, no una llibreria descarregada.

## Configuració de publicació

La CSP meta i referrer estan implementades. `frame-ancestors 'none'`, X-Frame-Options, nosniff, Permissions-Policy i HSTS necessiten HTTP headers del servidor; només estan documentats al README, no es presenten com a actius. HSTS es configurarà exclusivament després de verificar HTTPS permanent. El servidor haurà de servir el 404 amb codi HTTP 404 i les redireccions pertinents.

Publicar només `edip_site/`, excloent README si és possible; mai l'arrel, `qa/`, `maintenance/` ni `.git/`. La configuració global conté només informació pública. Un futur backend necessitaria validació server-side, anti-spam/rate limiting i revisió de privacitat.

La revisió és local i no acredita absència absoluta de vulnerabilitats ni configura un hosting que encara no es coneix. Els textos legals requereixen la revisió professional indicada al prompt.

## Ampliació del 13/10/2026 — mapa voluntari a Contacte

Aquesta nota documenta la integració i les proves locals del 13/10. Les comprovacions històriques del 25/09 es mantenen separades. La nova evidència és `browser-map/report.json` (35 comprovacions i HTTP 200 real a les tres amplades), `browser-map-regression/report.json` (90 casos, 42 comprovacions funcionals), `static-map.json` (cap error/avís) i els tres tests del sincronitzador superats.

- `contacte.html` incorpora el codi oficial de Google Maps Share/Embed dins d'un `<template>` inert. El botó «Mostrar mapa de Google» clona l'iframe al document; abans d'aquest gest no s'han de carregar el mapa, recursos externs ni preconnexions a Google.
- «Tancar mapa» retira l'iframe. No implica esborrar dades ja transmeses ni cookies de Google. L'activació no es desa al navegador; una nova càrrega de pàgina torna a mostrar el control d'activació. La preferència local existent continua separada i no autoritza automàticament el mapa.
- `maintenance/site-data.json` incorpora `maps_embed`, una URL pública amb HTTPS, domini exacte `www.google.com` i path `/maps/embed`, validats pel sincronitzador. Es manté separada dels enllaços `maps` i `maps_reviews`. Aquesta inserció no utilitza Places API ni necessita llegir o publicar claus API.
- Només la meta CSP de Contacte permet `frame-src https://www.google.com`; la resta de pàgines manté `frame-src 'none'`. Les directives de scripts, estils i connexions del document pare no s'amplien. Les peticions del document extern incrustat depenen de Google i s'han d'observar separadament.
- Els textos del mapa, privacitat, cookies i avís compartit han de diferenciar l'emmagatzematge propi d'EDIP del servei extern activat pel visitant. No correspon mantenir una garantia absoluta de «cap mapa incrustat» o «cap recurs extern» després d'activar-lo. Google informa de tractament d'adreces IP, dades tècniques, cookies i possibles transferències fora del país a la seva [política de privacitat](https://policies.google.com/privacy?hl=ca).
- L'adreça i l'enllaç alternatiu a Google Maps han de continuar accessibles sense JavaScript, amb el mapa tancat o si el servei extern no es pot carregar. El control i l'iframe han de tenir nom accessible i espai reservat al layout.

### Validació del canvi

Executar la regressió general i `node qa/map_qa.cjs BASE_URL OUTPUT_DIR`, revisar-ne l'informe i les captures. Comprovar zero peticions externes abans del clic, també després de scroll i de desar preferències; activació amb teclat; un únic iframe amb l'URL oficial; tancament i reactivació; absència de preferència Maps en storage; estat inicial restaurat en recarregar; funcionament sense JavaScript i layout mòbil/desktop. La verificació del mapa activat ha de distingir peticions/errors de Google dels del document pare. Un esdeveniment `load` de l'iframe no és suficient per confirmar que Google ha mostrat el mapa.

### Hosting

El README manté una política HTTP base amb `frame-src 'none'` i una variant per a Contacte amb `frame-src https://www.google.com`. No s'han d'enviar les dues polítiques a Contacte, perquè la restricció `none` impediria carregar el mapa. Es conserven `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, Referrer Policy i Permissions Policy com a recomanacions de desplegament. No s'ha configurat el hosting ni verificat headers de producció com a part d'aquesta nota.

## Ampliació del 14/10 i tancament del 15/10/2026 — ressenyes opcionals dins la home

Aquesta ampliació substitueix, per a la nova integració, les afirmacions històriques d’absència de SDK remots i `frame-src 'none'` a la home. L’estat complet és a [reviews-api-report.md](reviews-api-report.md). La configuració conté només `apiKey`, buida, i el Place ID públic d’EDIP ja emplenat. No s’ha llegit ni incorporat una clau real ni activat serveis o facturació d’un projecte Google Cloud.

- Només una configuració vàlida en format mostra el control d’activació. El clic carrega un iframe local i, dins seu, el SDK beta de Google i Advanced Place Details. El component demana `rank-preference="newest"`, conserva atribucions i no desa còpies de ressenyes. La clau pública de navegador requereix restriccions d’HTTP referrers i d’API; el format local no acredita l’autorització de Google. L’ús real és Preview Pro de pagament i necessita configuració de Cloud.
- La CSP de `index.html` canvia només l’autorització d’iframes a `frame-src 'self'`; no amplia els seus permisos de scripts, fonts ni connexions. El widget té una CSP específica per a orígens de Google. Només els estils del widget admeten `unsafe-inline`; cap política permet scripts inline o `unsafe-eval`. El document local serveix per separar configuració i cicle de vida del component, sense presentar-se com una barrera de seguretat contra el SDK del mateix origen.
- El widget comprova que l’obre un pare del mateix origen i valida els dos camps de configuració. El controlador pare accepta únicament missatges de l’iframe actiu, amb origen, tipus i estat esperats. Errors d’autorització, xarxa, component i temps d’espera tanquen el frame i ofereixen reintent o enllaç alternatiu.
- Abans de l’activació no es demanen recursos de Google. Després, les peticions, fonts, estils, cookies i tractament de dades depenen també de Google. Tancar el component retira el frame i el SDK, però no desfà dades transmeses ni cookies establertes. No es persisteixen les ressenyes ni l’activació a `localStorage` o `sessionStorage`; la preferència local de cookies no les activa.
- El hosting ha de servir la variant de la home amb `frame-src 'self'` i la del widget amb els orígens autoritzats pel seu fitxer. El widget requereix `frame-ancestors 'self'` i `X-Frame-Options: SAMEORIGIN`; `DENY` el bloquejaria. Les pàgines principals mantenen `frame-ancestors 'none'` i `DENY`. No s’han de sumar polítiques incompatibles. Les variants concretes són al README i continuen pendents de desplegament.

Validació del 14/10: `browser-reviews-newest/report.json` registra **112 comprovacions correctes amb SDK simulat**, incloent intents de missatges falsos, configuració invàlida, tancament ràpid, reintents i absència de persistència. `reviews-sdk-smoke.json` registra una descàrrega **real** del SDK beta amb clau fictícia invàlida, HTTP 200, cap error CSP observat i fallback correcte. Aquesta prova ha contactat Google, però no ha obtingut ressenyes reals ni usat credencials d’un projecte facturable. Els tres tests del sincronitzador passen. El 15/10, l’auditoria renovada `static-reviews-api.json` registra 18 HTML, 16 URL de sitemap i 17 imatges, amb 0 errors i 0 avisos; `sync_site.py --check` retorna `changed: []`.

Es conserva `browser-reviews-final/report.json`: el 14/10 passa 85 casos de pàgina/amplada i 41/42 comprovacions funcionals; `cookies-denied` registra `net::ERR_CONNECTION_REFUSED`. El 15/10, `browser-reviews-recheck/report.json` afegeix els cinc casos de l’accés antic de Judith i passa 42/42 funcions. Els quatre escenaris de cookies tenen `errors: []` i `failedRequests: []`; la incidència no es reprodueix sense modificar producció. El runner afegeix diagnòstic `requestfailed`, sense ocultar l’error inicial ni atribuir-li una causa que no s’ha pogut determinar. La cobertura combinada és de 90 casos sobre 18 pàgines, amb 42/42 funcions en la passada més recent.

Aquestes proves no certifiquen la CSP amb una resposta real completa, l’ordre de les ressenyes, l’autorització d’una clau vàlida, la facturació ni headers del hosting. El resum i els hashes de tancament són a `reviews-api-validation.json`. Cal configurar Google Cloud i validar la integració amb la clau restringida, les ressenyes reals i els headers de producció abans de publicar-la.

## Càrrega automàtica del 15/10 — revisió del 16/10/2026

Aquesta secció substitueix les afirmacions anteriors sobre activació de ressenyes per clic. Amb configuració vàlida, Inici insereix automàticament el document local i inicia el SDK de Google, sense esperar clic, scroll ni elecció a l’avís. La preferència local no bloqueja les ressenyes. Els 18 HTML i README expliquen que Google rep IP i dades tècniques i pot utilitzar cookies. El mapa de Contacte continua carregant-se només per clic.

El controlador manté la validació de configuració i missatges, un únic iframe, el tractament d’errors i l’absència de persistència de ressenyes. «Torna-ho a provar» només apareix en error; no hi ha botons de mostrar/tancar ressenyes. Es conserven les polítiques CSP del pare i del widget i les variants HTTP descrites al README. La càrrega automàtica no modifica les limitacions dels headers encara no desplegats ni esborra dades o cookies de Google mitjançant la preferència local.

`browser-reviews-auto/report.json` acredita **111 comprovacions amb SDK simulat correctes** el 15/10. La prova nova del SDK real amb clau fictícia, `browser-reviews-auto/sdk-smoke.json`, **no passa**: no registra respostes del SDK, encara que detecta inici automàtic, un iframe, cap clic/scroll i fallback correcte. La causa no queda determinada per aquesta evidència. El HTTP 200 del 14/10 correspon al flux anterior i no es reutilitza com a validació real del nou flux.

L’auditoria renovada del 16/10, `static-reviews-auto.json`, no té errors ni avisos i `sync_site.py --check` retorna `changed: []`. `browser-reviews-auto-regression/report.json` passa 20 casos de quatre pàgines i 42/42 comprovacions funcionals, sense errors ni fallades. Els textos compartits són coherents als 18 HTML. El resum i els hashes són a `reviews-auto-validation.json`; [reviews-auto-report.md](reviews-auto-report.md) en detalla l’abast. La clau de producció continua buida; no s’han llegit claus reals ni s’han validat ressenyes, ordre retornat o CSP amb la resposta completa de Google. Cal completar aquesta comprovació amb Cloud, clau restringida i hosting configurats.
