# EDIP — projecte web multipàgina

Projecte estàtic HTML/CSS/JavaScript creat a partir del prototip original d’EDIP.

## Configuració local i Git

`assets/js/google-reviews-config.js` i `../API_GOOGLE.txt` es conserven al PC i estan exclosos de Git, juntament amb originals de fotos, captures, snapshots i resultats locals de QA. El repositori inclou només `assets/js/google-reviews-config.example.js`, amb els dos camps buits.

En un clon nou, copiar l’exemple com a `google-reviews-config.js` i posar-hi `apiKey` i `placeId`. **No sobreescriure el fitxer real si ja existeix.** No utilitzar `git add -f` per incloure claus. Abans del commit, `python maintenance/check_staged_secrets.py` verifica l’índex sense mostrar credencials. La clau de navegador continua sent visible en el web executat; excloure-la de Git no la converteix en una clau de servidor.

## Estructura
- `index.html`: home orientada a confiança i conversió.
- `serveis.html` + pàgines de servei individuals.
- `equip.html`: perfils i formació de Judith Faura (`#judith-faura`), Ester (`#ester`), Maria (`#maria`) i Teresa (`#teresa`); `judith-faura.html` es conserva com a accés antic amb canonical cap a Equip.
- `metode.html`, `centre.html`, `preguntes-frequents.html`, `contacte.html`. L'apartat Recursos s'ha retirat.
- pàgines legals bàsiques i `404.html`.
- `assets/css/styles.css`, `assets/js/main.js`, imatges WebP optimitzades.
- `assets/js/google-reviews-config.js`: els dos valors per configurar les ressenyes; `assets/js/google-reviews.js` i `assets/widgets/google-reviews.html`: càrrega automàtica del carrusel d’EDIP amb dades de Google en entrar a Inici amb configuració vàlida.
- `robots.txt`, `sitemap.xml`, `site.webmanifest`.

## Formulari
Aquesta versió és 100% estàtica. El formulari valida les dades al navegador i obre el gestor de correu amb el missatge preparat. La persona ha de revisar-lo i enviar-lo des del seu gestor; el web no confirma un enviament automàtic. El destinatari es pren de l'atribut `action="mailto:…"` de `contacte.html`, sincronitzat amb el correu públic global. Els camps es codifiquen amb `encodeURIComponent` i no s'interpreten com HTML.

Es conserva la recomanació inicial: abans de publicar, és recomanable connectar-lo a un backend/proveïdor adequat amb garanties RGPD, protecció anti-spam i registre d’errors. Aquesta integració és opcional i es pot publicar amb el funcionament actual de `mailto:`. Si es decideix incorporar-la, caldran també validació al servidor, rate limiting, tractament segur dels errors i revisió de privacitat. Aquesta versió no necessita CAPTCHA ni infraestructura CSRF perquè no envia peticions a un backend.

## Abans de producció
1. Confirmar telèfon, correu, preus, horaris, número de col·legiació i tots els textos clínics.
2. Confirmar les dades reals del titular ja incorporades a Avís legal i Privacitat a partir de les fonts autoritzades. El domicili social i el correu legal es mantenen diferenciats de l'adreça assistencial i el correu públic.
3. Revisar textos legals amb assessorament professional.
4. Verificar que el mapa de Contacte carrega Google automàticament, també sense JavaScript i que les ressenyes de la home es carreguen automàticament amb configuració vàlida, sense esperar clic, scroll ni preferències de cookies. Cookies/privacitat han de descriure aquests comportaments. Les ressenyes requereixen configurar la clau de navegador i una prova real abans de publicar-les. Si s’afegeixen analítica, reserves externes, píxels o altres serveis, revisar-ne la càrrega i actualitzar aquests textos.
5. Configurar HTTPS, redireccions, pàgina 404 del servidor, compressió Brotli/Gzip i cache headers.
6. Confirmar el domini existent al projecte, `https://www.ediptarrega.com`. Si el domini de desplegament és diferent, modificar `base_url` a `../maintenance/site-data.json` i sincronitzar: s'actualitzen canonical, Open Graph, URLs de JSON-LD, sitemap i robots. Revisar també referències editorials i legals escrites a mà.

Els textos legals són adaptacions en català de les fonts facilitades, no una validació jurídica. Cal revisar-ne l'adequació als tractaments actuals, els terminis de conservació, les dades identificatives i la llengua jurídica. Les notes de contrast són a `../qa/source-notes.md`, fora del directori publicable.

Publicar únicament el contingut de `edip_site/`, preferentment excloent aquest README. No publicar mai la carpeta arrel del projecte ni `qa/`, `maintenance/` o `.git/`: contenen eines, informes, captures i còpies de treball. El hosting definitiu no està identificat i no s'ha afegit configuració específica d'una plataforma. Configurar la resposta HTTP 404 real per a la pàgina d'error; valorar una redirecció permanent de `judith-faura.html` a `equip.html#judith-faura` quan es conegui el hosting.

## Prova local
Des d’aquesta carpeta:
```bash
python -m http.server 8000
```
Obre `http://localhost:8000/`.

## Dades globals i manteniment

La font de dades públiques compartides és `../maintenance/site-data.json`, fora d'aquest directori. `../maintenance/sync_site.py` les aplica als fitxers estàtics amb la biblioteca estàndard de Python, sense build obligatori: el contingut, els enllaços, el contacte i el SEO ja són presents a l'HTML publicat. Les ressenyes tenen una configuració independent que el navegador llegeix directament: `assets/js/google-reviews-config.js`; editar-la no requereix sincronitzar.

Des de l'arrel del projecte, després d'editar les dades:

```bash
python maintenance/sync_site.py
python maintenance/sync_site.py --check
```

`--check` no modifica fitxers: informa de les diferències i retorna un codi d'error si falta sincronitzar. Els atributs `data-site-text`, `data-site-href`, `data-site-src`, `data-site-content` i `data-site-action` identifiquen camps compartits; s'han de conservar en editar l'HTML. Per afegir un ús nou, copia el marcador d'un element equivalent i comprova el resultat. No guardis secrets ni credencials al JSON: només conté dades públiques.

| Dada | Camp a `../maintenance/site-data.json` | Ús / fitxer actual |
| --- | --- | --- |
| Nom del centre | `name` | Textos marcats, `og:site_name`, dades del centre en JSON-LD i manifest |
| Domini | `base_url` | Canonical, `og:url`, URLs del JSON-LD, `sitemap.xml` i `robots.txt` |
| Instagram | `instagram` | Footer i `sameAs` del centre; no hi ha altres perfils socials configurats |
| Google Maps | `maps` | Enllaços a la fitxa oficial i `hasMap` del centre |
| Enllaç a ressenyes de Google Maps | `maps_reviews` | Accés directe a la pestanya de ressenyes; la càrrega dins la home es configura separadament |
| Mapa incrustat de Contacte | `maps_embed` | URL pública de l'iframe oficial, dins del `<template>` inert de `contacte.html`; només es carrega en activar-lo |
| Correu públic | `email` | Contacte, footer, destinatari del formulari i JSON-LD |
| Telèfon | `phone`, `phone_display` | Enllaços `tel:`, text visible i JSON-LD; els dos valors han de coincidir |
| WhatsApp | `whatsapp` | Menú mòbil, botó flotant i altres enllaços marcats; revisar-lo també si canvia el telèfon |
| Adreça assistencial | `address`, `street`, `postal_code`, `city`, `region`, `country` | Textos marcats i `PostalAddress`; mantenir coherent l'adreça completa amb els camps estructurats |
| Logo | `logo` | `assets/images/logo-edip.png` |
| Favicon | `favicon` | `assets/images/logo-edip.png`, enllaços icon i `site.webmanifest` |
| Imatge Open Graph per defecte | `og_image` | `assets/images/logo-edip.png` |
| Imatge del centre | `business_image` | `assets/images/centre-passadis.webp` |
| Foto de Judith | `images.judith` | `assets/images/judith-faura.webp` |
| Foto d’Ester | `images.ester` | `assets/images/ester.webp` |
| Foto de Maria | `images.maria` | `assets/images/maria.webp` |
| Foto de Teresa | `images.teresa` | `assets/images/teresa.webp` |
| Sala adults | `images.adults` | `assets/images/sala-adults.webp` |
| Sala adolescents | `images.adolescents` | `assets/images/sala-adolescents.webp` |
| Sala infants | `images.infants` | `assets/images/sala-infants.webp` |
| Sala logopèdia / psicopedagogia | `images.logopedia` | `assets/images/sala-logopedia.webp` |
| Sala tallers | `images.tallers` | `assets/images/sala-tallers.webp` |

Per a les ressenyes dins la home, editar només `apiKey` i, si cal, `placeId` a `assets/js/google-reviews-config.js`. El Place ID d’EDIP ja està emplenat. Vegeu «Ressenyes de Google» per configurar la clau; aquests camps no es traslladen al JSON de manteniment.

Per substituir una fotografia, es pot conservar la ruta actual o posar una ruta existent al JSON i sincronitzar. Cal revisar manualment les dimensions `width`/`height`, les dimensions i tipus del manifest i les metadades de la imatge OG si canvien. Els `alt` són contextuals i continuen escrits a cada HTML; no se substitueixen per un text genèric. No s'han d'eliminar assets només perquè l'auditoria no hi trobi referències: comprovar-ne abans la funció i l'historial.

`maps_embed` conté la URL obtinguda amb l'opció oficial de Google Maps «Comparteix / Insereix un mapa», amb el format `https://www.google.com/maps/embed?pb=…`. El sincronitzador en valida HTTPS, el domini exacte `www.google.com` i el path `/maps/embed`; no s'ha de substituir per una URL de ressenyes o navegació. És una dada pública, sense clau API. Després de canviar-la, sincronitzar i comprovar visualment que el mapa correspon al centre. L’iframe és directament al document i es carrega automàticament; no tornar-lo a posar dins d’un template ni afegir-hi un botó d’activació.

Els headers i footers continuen com HTML duplicat perquè la navegació i el contacte funcionin sense JavaScript ni processament al servidor. El sincronitzador actualitza les dades marcades, no reconstrueix aquests components: qualsevol canvi de menú, CTA o estructura s'ha d'aplicar als 18 HTML. El CSS i el JavaScript són compartits a `assets/css/styles.css` i `assets/js/main.js`.

El nom del copyright també està marcat. El títol d'adreça de Centre utilitza el camp derivat `street_heading` (el valor de `street` amb el punt final); el contacte assistencial dins de l'avís legal usa `name` i `address`. La identitat i el domicili social del titular continuen separats. Les adreces incloses en meta descriptions editorials requereixen revisió manual quan es canvia d'ubicació.

Els preus, el contingut clínic, els textos legals, els títols, les descripcions, els textos alternatius i les preguntes freqüents continuen als HTML corresponents. Quan canviï una tarifa, revisar també home, FAQ i JSON-LD relacionat. Les dades identificatives legals no es sobreescriuen amb les dades de contacte assistencial. Aquesta duplicació controlada conserva el contingut estàtic accessible i rastrejable; la validació detecta regressions, però no substitueix la revisió editorial.

### Inventari d'assets compartits

Rutes relatives a `edip_site/`. Inventari actualitzat amb `../qa/static-team.json`; inclou referències visibles i de metadades/JSON-LD.

| Asset únic | Pàgines on es referencia |
| --- | --- |
| `assets/images/logo-edip.png` | Tots els 18 HTML; també `site.webmanifest` |
| `assets/images/centre-passadis.webp` | `index.html`, `centre.html`, `contacte.html`; també dades estructurades del centre/proveïdor |
| `assets/images/judith-faura.webp` | `index.html`, `equip.html` |
| `assets/images/ester.webp`, `assets/images/maria.webp`, `assets/images/teresa.webp` | `equip.html`, incloses les dades estructurades de cada professional |
| `assets/images/sala-adults.webp` | `index.html`, `centre.html`, `psicologia-adults.html`, `parella-familia.html` |
| `assets/images/sala-adolescents.webp` | `centre.html`, `psicologia-infantil-juvenil.html` |
| `assets/images/sala-infants.webp` | `index.html`, `centre.html` |
| `assets/images/sala-logopedia.webp` | `index.html`, `centre.html`, `logopedia.html`, `pedagogia-reeducacions.html` |
| `assets/images/sala-tallers.webp` | `centre.html`, `tallers-formacions.html` |

`assets/images/centre-consulta.webp` és una imatge específica de `metode.html`. `assets/images/centre-consulta-llum.webp`, que ocupava el bloc Ubicació de Contacte, es conserva sense referències actuals després de substituir-la pel mapa el 13/10/2026. Les altres fotografies anteriors sense ús actual també es conserven; no s'han purgat automàticament. L'inventari de `static-team.json` és anterior a aquest canvi; comprovar l'informe estàtic més recent per a l'ús actual dels assets.

### Manteniment dels perfils d’Equip

Els rols i les formacions es mantenen a `equip.html`, segons la informació facilitada el 09/10/2026. Els màsters en curs d’Ester i Teresa s’han de distingir de les titulacions completades. Si es modifica un nom o rol, revisar també el bloc `Person` del JSON-LD i els textos alternatius. Les metadades de la pàgina descriuen l’equip complet.

Les quatre fotografies provenen dels JPG nominats de `../Imateges equip/`, conservats sense modificar. Les versions WebP són de 1200 × 1600 px, amb orientació normalitzada i sense EXIF; el retall circular es fa amb CSS. El collage amb noms només és una referència i no es publica. La foto de Judith es comparteix amb la home. El sincronitzador actualitza les imatges de `Person` segons el fragment de l’ID (`ester`, `maria`, `teresa`; `judith-faura` correspon a `images.judith`). El registre de conversió és `../qa/team-assets.json`.

## Seguretat i privacitat tècnica

### Proteccions implementades

Els 18 HTML principals inclouen una CSP mitjançant `<meta>`. Aquesta és la política base de les pàgines sense mapa ni ressenyes incrustades:

```text
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self' mailto:; frame-src 'none'
```

`contacte.html` substitueix `frame-src 'none'` per `frame-src https://www.google.com` per permetre el mapa automàtic. `index.html` utilitza `frame-src 'self'` per al document local de ressenyes, que es carrega automàticament quan hi ha configuració vàlida. En tots dos casos, la resta de directives es conserva.

Les pàgines principals no permeten `unsafe-inline` ni `unsafe-eval`. El document `assets/widgets/google-reviews.html` té una CSP pròpia que autoritza els orígens requerits pel SDK, les imatges, fonts i connexions de Google; només els estils d’aquest document admeten `unsafe-inline`. Cap política permet `unsafe-eval` ni scripts inline. Els blocs JSON-LD són dades no executables. També està aplicada la meta Referrer Policy `strict-origin-when-cross-origin`. Els enllaços que obren una pestanya nova tenen `rel="noopener"`.

A Inici, amb la integració configurada, les ressenyes carreguen automàticament recursos de Google en entrar a la pàgina. Google rep l’adreça IP i dades tècniques i pot utilitzar cookies; les preferències de l’avís no bloquegen aquesta càrrega. A Contacte, el mapa també carrega Google automàticament, independentment de la preferència local. Google pot carregar scripts, estils, fonts i altres recursos i tractar dades segons la seva política de privacitat. El web no incorpora analítica pròpia ni píxels publicitaris. Els accessos directes a Google Maps, Instagram i WhatsApp continuen disponibles com a enllaços voluntaris. No hi ha dependències npm de producció.

### Mapa de Contacte — 23/10/2026

El bloc Ubicació de `contacte.html` incorpora directament l’iframe oficial de Google Maps. Es carrega en entrar a la pàgina, sense botó, scroll ni dependència de JavaScript. La URL pública `maps_embed` prové de `maintenance/site-data.json`; no utilitza la clau de les ressenyes. L’adreça i «Com arribar-hi» continuen disponibles si Google no respon.

Els avisos de les 18 pàgines i els textos de privacitat/cookies descriuen aquesta càrrega automàtica: Google rep l’adreça IP i dades tècniques i pot utilitzar cookies. Desar la preferència local no bloqueja el mapa ni esborra cookies de Google. No es transmeten els camps del formulari al mapa.

`qa/release_qa.cjs` comprova el mapa immediat, també sense JS, i la resta dels ajustos del 23/10. El mapa està simulat a les suites generals per evitar xarxa externa; la validació real és separada. `qa/map_qa.cjs` i els informes del 13/10 documenten l’antic flux per clic i no són proves del comportament actual.

### Ressenyes de Google — carrusel propi amb Places API (New), documentació revisada el 21/10/2026

**La configuració continua limitada a `apiKey` i `placeId` a `assets/js/google-reviews-config.js`.** La clau de navegador ja està configurada i el Place ID d’EDIP és `ChIJD2Lre4XhphIR8x2oRi6jTCE`; conservar-los en actualitzar la implementació. No cal instal·lar dependències, executar el sincronitzador ni fer un build.

A Google Cloud, cal un projecte amb facturació i les API **Maps JavaScript API** i **Places API (New)** habilitades. El carrusel utilitza `Place.fetchFields()` de la biblioteca Places amb el canal de producció `weekly`; no depèn del component Advanced de Places UI Kit ni del canal beta. Referències: [classe Place](https://developers.google.com/maps/documentation/javascript/place) i [canals de versions](https://developers.google.com/maps/documentation/javascript/versions).

Normalment es fa una consulta de dades per càrrega del carrusel. Si Google retorna un error transitori `UNAVAILABLE`, `INTERNAL` o `DEADLINE_EXCEEDED`, es fa un únic reintent automàtic al cap d’1,2 segons, dins del límit global de 20 segons. Els altres errors no es reintenten automàticament. Si l’usuari prem «Torna-ho a provar» després d’un error, s’inicia una nova càrrega. La selecció dels camps, inclòs `reviews`, determina la facturació: Google l’associa a **Place Details Enterprise + Atmosphere**. Consultar els preus, quotes i consum del projecte abans de publicar; no es fixa aquí un preu ni es garanteix gratuïtat. Referència: [camps i categoria de facturació de Place](https://developers.google.com/maps/documentation/javascript/place-class-data-fields).

Google retorna **fins a cinc ressenyes seleccionades per rellevància**. EDIP ordena localment aquesta selecció per data descendent; això **no garanteix les últimes ressenyes del negoci** ni permet consultar tot l’historial. El carrusel mostra quatre, tres, dues o una targeta segons l’amplada disponible. Les fletxes mostren la targeta següent o anterior, sense tornar a consultar Google; les targetes fora del grup visible queden amagades. Es mantenen l’atribució Google Maps i les atribucions/enllaços d’autoria de les ressenyes. Referències: [límit i selecció de ressenyes](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places#Place) i [ressenyes i autoria](https://developers.google.com/maps/documentation/javascript/place-reviews).

Configurar la clau amb restricció d’aplicació **Llocs web / HTTP referrers** i restriccions d’API limitades a **Maps JavaScript API** i **Places API (New)**. Autoritzar els dominis reals de publicació; per al domini actual:

```text
https://www.ediptarrega.com/*
https://ediptarrega.com/*
```

Per provar localment, autoritzar també aquests orígens en una clau de desenvolupament:

```text
http://127.0.0.1:8000/*
http://localhost:8000/*
```

La clau de navegador és pública i serà visible al codi i a les peticions: les restriccions de web i API són necessàries. No posar-hi una clau privada de servidor. Revisar ús i facturació al projecte de Google. Referència: [protecció de claus de Google Maps Platform](https://developers.google.com/maps/api-security-best-practices).

Amb la configuració en un format vàlid, entrar a la home crea automàticament l’iframe local `assets/widgets/google-reviews.html`, sense esperar clic, scroll ni una elecció a l’avís de cookies. `assets/js/google-reviews-widget.js` carrega el SDK, consulta `Place.fetchFields()` i presenta les dades en targetes pròpies d’EDIP. La comprovació local del format no garanteix que Google accepti la clau. Si no hi ha configuració o la càrrega falla, l’enllaç directe a Google Maps continua disponible; en cas d’error s’ofereix «Torna-ho a provar».

La preferència local de cookies no bloqueja les ressenyes. En carregar-les, Google rep l’adreça IP i dades tècniques i pot utilitzar cookies. No es guarden còpies de ressenyes ni un estat d’activació a `localStorage` o `sessionStorage`; cada visita a Inici torna a iniciar la càrrega amb la configuració vàlida. No hi ha testimonis copiats, puntuacions fixes ni contingut inventat. Les cookies que Google pugui establir es gestionen des del navegador.

**Validació real executada el 20/10/2026 i revisada el 21/10/2026:** amb la clau i el Place ID ja configurats, la nova consulta `Places/GetPlace` retorna HTTP 200 i cinc ressenyes reals. S’han comprovat quatre targetes visibles a escriptori, el desplaçament a la cinquena amb la fletxa, una targeta al mòbil i el retorn amb la fletxa anterior. L’alçada de l’iframe s’adapta al contingut i no hi ha desbordament horitzontal, errors de consola ni peticions fallides en aquesta prova. Evidència final: `../qa/reviews-live-final.json` (`passed: true`); informe del canvi: `../qa/reviews-carousel-report.md`. La bateria amb SDK simulat renovada el 21/10 suma **168 comprovacions correctes i cap error**, registrades a `../qa/browser-reviews-carousel/report.json`. La configuració actual no ha necessitat canvis addicionals a Google Cloud per funcionar localment. Abans de publicar, comprovar les restriccions del domini de producció i els headers del hosting.

L’atribució de Google Maps utilitza el fitxer oficial sense modificar, servit localment a `assets/images/google-maps-attribution.svg`. L’origen de l’asset, les dimensions originals i l’ús estan documentats al renderer `assets/js/google-reviews-carousel.js`; conservar-ne la llegibilitat i l’espai lliure en modificar el disseny.

El diagnòstic del component anterior registrava SDK HTTP 200 i `GetPlaceWidgetMetadata` HTTP 403 perquè Places UI Kit no estava habilitada (`../qa/reviews-live-before.json`). La primera consulta de la nova versió va rebre un HTTP 503 transitori de Places (`../qa/reviews-live-after.json`), resolt en la prova posterior. Es conserven aquests resultats com a historial, amb les dades sensibles ocultes. No copiar la clau en captures, informes ni exemples de documentació.

Antecedents: el 29/09/2026 es van retirar els fragments de Webador i es va deixar l’enllaç a la fitxa d’**EDIP | Educació i Psicologia**. Els canvis del 14/10 i 15/10 van preparar el component avançat i la càrrega automàtica. Entre el 17/10 i el 20/10 se substitueix per `Place.fetchFields()` i un carrusel propi; es conserva la càrrega automàtica, amb el límit de selecció de Google explicat més amunt. Els informes anteriors es conserven com a historial.

`assets/js/main.js` només desa la preferència local amb la clau `edip-cookie-consent-v1` i el valor `{ "essential": true, "analytics": false }`. La lectura valida el format i força analítica desactivada; un valor antic `true` no activa cap eina. El lloc continua funcionant si l'emmagatzematge és invàlid o està bloquejat. No utilitza `sessionStorage` ni desa camps del formulari, informació clínica, credencials o tokens.

### Configuració pendent del hosting

La CSP meta ja està activa, però no pot implementar `frame-ancestors`. Quan s'identifiqui el servidor, configurar els headers HTTP següents com a base per a les pàgines principals sense mapa ni ressenyes i comprovar el formulari, les imatges i la navegació:

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self' mailto:; frame-src 'none'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=(), usb=()
X-Frame-Options: DENY
```

Per a la resposta de `contacte.html`, substituir el header CSP anterior per aquesta variant, conservant els altres headers:

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self' mailto:; frame-src https://www.google.com; frame-ancestors 'none'
```

Per a `index.html`, substituir únicament `frame-src 'none'` per `frame-src 'self'`, mantenint `frame-ancestors 'none'` i `X-Frame-Options: DENY`. Això permet carregar automàticament el document local de ressenyes amb configuració vàlida.

Per a `assets/widgets/google-reviews.html`, aplicar aquesta CSP, que correspon a la meta del fitxer amb `frame-ancestors` afegit, i **substituir** `X-Frame-Options: DENY` per `SAMEORIGIN`:

```text
Content-Security-Policy: default-src 'none'; script-src 'self' https://maps.googleapis.com https://maps.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.googleusercontent.com https://*.ggpht.com; font-src https://fonts.gstatic.com; connect-src https://*.googleapis.com https://*.gstatic.com https://*.google.com; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; frame-ancestors 'self'
X-Frame-Options: SAMEORIGIN
```

Conservar els altres headers base al widget. `frame-ancestors 'self'` i `SAMEORIGIN` li permeten aparèixer dins la home del mateix origen; `DENY` el bloquejaria. Si canvia la CSP del widget, actualitzar també el header del hosting.

No afegir simultàniament la CSP base a aquestes respostes especials: els headers i la meta s’apliquen conjuntament, i una política més restrictiva bloquejaria el mapa, l’iframe local o els recursos del SDK. Les pàgines principals mantenen `frame-ancestors 'none'` i `X-Frame-Options: DENY`.

Aquests headers són recomanacions, no configuració desplegada. Es pot provar primer el nou header CSP amb `Content-Security-Policy-Report-Only`; això no desactiva la CSP meta ja aplicada. No s'ha configurat cap servei de recepció d'informes.

Activar `Strict-Transport-Security` només quan el domini funcioni permanentment sota HTTPS; per exemple, `max-age=31536000` després de verificar el desplegament. No aplicar HSTS en desenvolupament local ni afegir `includeSubDomains` o `preload` sense comprovar tots els dominis afectats. Configurar també redirecció HTTP→HTTPS i els tipus MIME correctes. Qualsevol incorporació futura de recursos externs obliga a revisar la CSP i els textos de privacitat/cookies.

## Comprovacions de manteniment

L'ordre recomanat, des de l'arrel del projecte, és:

1. Editar les dades o l'HTML afectat, executar `python maintenance/sync_site.py` si cal i revisar-ne els canvis.
2. Executar `python maintenance/sync_site.py --check`; ha d'indicar que no hi ha fitxers pendents.
3. Executar l'auditoria estàtica amb un Python que disposi de `lxml` i `Pillow`:

   ```bash
   python qa/validate_site.py edip_site --output qa/static-final.json
   ```

4. Iniciar el servidor local des d'`edip_site/` amb la instrucció anterior i passar la regressió de navegador des de l'arrel:

   ```bash
   node qa/browser_qa.cjs http://127.0.0.1:8000 qa/browser-final --site edip_site
   node qa/map_qa.cjs http://127.0.0.1:8000 qa/map-final
   node qa/reviews_carousel_qa.cjs http://127.0.0.1:8000 qa/browser-reviews-carousel
   ```

   L'eina de navegador utilitza el Playwright del runtime local de Codex i el Chrome instal·lat. Les seves rutes estan explícites a `qa/browser_qa.cjs`; en un altre equip cal ajustar-les al runtime disponible. Aquestes eines de QA no són dependències del lloc publicat.

   `qa/browser_qa.cjs` intercepta la configuració de ressenyes amb camps buits i el mapa amb un document simulat en tots els contexts de prova, sense llegir ni canviar la clau real. Només accepta la petició automàtica prevista del mapa; la resta de peticions externes fan fallar la regressió. La prova específica `qa/release_qa.cjs` cobreix els cinc ajustos del 23/10 i comprova que el mapa es crea sense interacció, també sense JavaScript. Les proves reals de Google es documenten separadament; no executar `qa/map_qa.cjs`, que conserva expectatives antigues d’activació per clic.

   `qa/reviews_carousel_qa.cjs` comprova el carrusel amb un SDK simulat i intercepta la configuració sense modificar la clau real: càrrega automàtica, targetes i fletxes, responsive, configuració absent, errors, reintent i absència de persistència. Comprovar també que la preferència local no bloqueja el component. Aquesta prova no acredita la càrrega de ressenyes reals ni la compatibilitat final de la CSP amb tots els recursos que serveixi Google; repetir la prova real amb una clau restringida abans de publicar. `qa/reviews_qa.cjs` i els informes dels components anteriors es conserven com a historial.

5. Revisar l'informe i les captures, incloent home, serveis, equip, centre i contacte. Comprovar 320, 375, 768, 1024 i 1440 px; menú mòbil i teclat, imatges, overflow, formulari, estat honest de `mailto:`, preferències locals i ús sense JavaScript. El test de formulari intercepta el `mailto:` per validar-lo sense enviar correus; l'obertura efectiva del client requereix un gestor configurat al dispositiu.
6. Revisar els canvis finals amb Git, si està disponible, i publicar només els fitxers del lloc autoritzats. La validació local no acredita la indexació de Google, els headers del hosting ni les Core Web Vitals reals de producció.

`qa/validate_site.py` comprova enllaços i anchors locals, assets, dimensions, metadades, JSON-LD, navegació, indexabilitat i coherència del sitemap. El sitemap conté 16 pàgines canòniques, exclou l'accés antic a Judith i el 404; `robots.txt` permet rastrejar els recursos públics. Els informes i les captures es desen fora d'`edip_site/`. Revisar sempre els avisos contextualment: una URL local dins d'aquestes instruccions de prova no és una URL de producció.

Proves complementàries: `python qa/test_sync_site.py` valida el sincronitzador amb còpies temporals, sense tocar la web; `python qa/contrast_check.py` comprova les parelles de color principals; `node qa/focused_browser.cjs` revisa FAQ, menú després de scroll, captures de detall i mètriques locals. L'informe de recuperació és `../qa/final-report.md`; les evidències antigues i els scripts històrics estan identificats a `../qa/README.md`.
