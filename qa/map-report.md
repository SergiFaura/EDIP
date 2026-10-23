# Mapa de Contacte — 13/10/2026

## Resultat

La secció «Ubicació» de `contacte.html` incorpora el mapa real de Google amb el marcador d'EDIP a Plaça del Carme, 17, altell 1, Tàrrega. Substitueix la fotografia d'aquesta secció; la imatge original es conserva com a asset. Els continguts, perfils d'Equip, tarifes, navegació, formulari i altres imatges es mantenen.

La URL s'ha obtingut des de **Compartir → Incorporar un mapa** a la fitxa oficial. Google ara mostra el nom «EDIP | Psicologia Tàrrega», amb el mateix telèfon 654 29 87 45, adreça i identificador verificats anteriorment: `ChIJD2Lre4XhphIR8x2oRi6jTCE` / CID `2399472120630877683`. No s'ha creat cap compte ni utilitzat cap clau API.

## Comportament i manteniment

- «Mostrar mapa de Google» carrega l'iframe dins de la pàgina; «Tancar mapa» el retira. La càrrega és voluntària i no es recorda en visites posteriors.
- El `<template>` inicial és inert: no es fan peticions a Google abans del clic, tampoc amb scroll, preferències desades o flags manipulats a localStorage.
- Es conserva «Com arribar-hi», accessible sense JavaScript o si Google no està disponible.
- L'iframe té títol accessible, dimensions responsive i origen HTTPS. La CSP permet només `https://www.google.com` com a origen de frames a Contacte; la resta conserva `frame-src 'none'`.
- `maps_embed` és una dada pública de `maintenance/site-data.json`. El sincronitzador comprova domini i ruta exactes i actualitza el `src` del template mitjançant el marcador existent `data-site-src`.
- Avisos compartits, Cookies, Privacitat i README expliquen el servei extern opcional i la configuració CSP del hosting. Tancar el mapa no s'anuncia com una eliminació de cookies de Google.

## Verificacions

| Prova | Resultat |
|---|---|
| `sync_site.py --check` | Sense divergències; comprovat també que no modifica contingut ni dates |
| `qa/test_sync_site.py` | 3 tests correctes: propagació/idempotència, només lectura i rebuig d'URLs de mapa no autoritzades |
| `qa/static-map.json` | 18 HTML, 16 URL indexables/sitemap, 17 imatges; 0 errors i 0 avisos |
| `qa/browser-map-regression/report.json` | 90 casos (18 pàgines × 5 amplades: 320, 375, 768, 1024, 1440); 42 comprovacions funcionals; cap error |
| `qa/browser-map/report.json` | 35 comprovacions correctes; mapa real a 320, 375 i 1440 px, HTTP 200, sense errors de xarxa ni del document pare |
| `qa/contrast-map.json` | 10 parelles amb contrast AA per a text normal, incloent el nou bloc de mapa |

Revisades visualment les captures del mapa i del placeholder: marcador d'EDIP, controls, text llegible, cantonades i estil coherents, sense desbordament horitzontal. La prova funcional cobreix teclat, focus, obertura/tancament, reobertura sense duplicats, recàrrega sense persistència, absència de JavaScript i dades locals manipulades. La regressió existent verifica també el formulari `mailto:` sense enviar correus reals.

La primera prova de xarxa del Chrome de QA va quedar bloquejada pel sandbox. S'ha repetit amb accés de xarxa autoritzat i ha passat amb respostes reals de Google, sense simulacions. També s'ha comprovat la visualització al navegador integrat de Codex.

## Evidències i límits

`browser-map/` conté captures abans/després; `browser-map-regression/` conserva la regressió general. `map-before/` i `map-diff.patch` permeten revisar l'estat preservat i les modificacions. `map-validation.json` registra els hashes finals dels fitxers de producció i manteniment.

Proves locals amb Chrome; el hosting encara ha d'aplicar la variant de CSP indicada al README si utilitza headers HTTP. No s'ha desplegat, fet commit ni push. Aquest canvi integra el mapa; l'automatització de ressenyes de la home continua en l'estat documentat al seu informe separat.
