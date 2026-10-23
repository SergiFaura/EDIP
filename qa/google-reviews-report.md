# Ressenyes de Google — 29/09/2026

> **Nota de tancament del 15/10/2026:** aquest document conserva l’estat històric del 29/09. El 14/10 s’ha implementat la preparació de ressenyes dins d’EDIP amb Advanced Place Details de Places UI Kit (`beta`, `newest`, Preview Pro de pagament). La clau continua buida i falta validar una resposta real amb Google Cloud configurat; no s’han comprovat ressenyes ni ordre reals. Les 112 comprovacions amb mock i la prova del SDK real amb clau fictícia invàlida cobreixen el flux local i el fallback. La regressió inicial conserva una connexió refusada a `cookies-denied`; la passada del 15/10 no la reprodueix i passa 42/42 funcions, sense canvis a producció. Les dues passades cobreixen 90 casos de les 18 pàgines. L’estat vigent, els límits i les evidències són a [reviews-api-report.md](reviews-api-report.md). Les afirmacions següents que indiquen que la integració encara no existeix es refereixen exclusivament al 29/09.

## Estat real

La petició d'obtenir ressenyes automàticament de Google Maps **no està completada**: falta configurar Google Maps Platform (projecte, facturació i clau restringida). S'ha demanat a l'usuari si ja en disposa o prefereix l'accés directe. No s'ha rebut configuració ni s'ha activat cap compte o servei de pagament.

Mentrestant s'ha implementat un accés directe funcional a la pestanya de ressenyes de la fitxa correcta, retirant els tres fragments de Webador. No hi ha ressenyes, noms d'autors, puntuacions o recomptes codificats al web. El text visible explica que el botó obre Google Maps en una pestanya nova; no promet càrrega en directe dins de la pàgina.

## Fitxa verificada

Google Maps, consultat amb navegador el 29/09/2026:

- Nom: **EDIP | Educació i Psicologia**.
- Adreça: Plaça del Carme, 17, altell 1, 25300 Tàrrega.
- Telèfon: 654 29 87 45.
- Web: ediptarrega.com.
- Place ID exposat a l'enllaç del resultat: `ChIJD2Lre4XhphIR8x2oRi6jTCE`.
- Pestanya Ressenyes oberta i verificada visualment. L'URL observada es desa a `maintenance/site-data.json`, camp `maps_reviews`; s'han omès paràmetres de seguiment de Google.

El Maps antic `Wgogfz7CfdisprbR6` ara redirigeix a Amanda Cervera, amb un altre telèfon i adreça. S'ha substituït `maps` i sincronitzat els 18 HTML, incloses les propietats `hasMap` dels JSON-LD. La còpia anterior és a `qa/google-reviews-before/`.

## Implementació

- `index.html`: substitució del bloc de fragments pel bloc de Google Maps.
- `styles.css`: targeta adaptada a mòbil i escriptori, conservant colors, tipografia i botons del lloc.
- `site-data.json` i `sync_site.py`: Maps correcte i camp central `maps_reviews`, validat com a HTTPS i sincronitzable.
- Prova de sincronització existent actualitzada per verificar que també canvia l'enllaç de ressenyes.
- README, notes de fonts i informe final actualitzats per distingir accés directe de càrrega automàtica.
- Cap canvi a formulari, tarifes, fotografies, dades legals, cookies, CSP o JavaScript de producció. No s'han introduït peticions externes ni secrets. Sense commit ni push.

## Validacions

- `maintenance/sync_site.py --check`: cap divergència.
- `qa/test_sync_site.py`: 2 proves correctes, inclosa propagació del nou enllaç i comprovació sense escriptures.
- `qa/validate_site.py`: 18 HTML, 16 URL canòniques, 14 imatges; 0 errors i 0 avisos. Evidència: `qa/static-google-reviews.json`.
- Browser QA: 15 casos (Home, Centre i Contacte a 320, 375, 768, 1024 i 1440 px), 42 comprovacions funcionals, 0 errors, peticions externes, imatges trencades o desbordaments. Evidència: `qa/browser-google-reviews/report.json`.
- Suite focalitzada: 4 comprovacions addicionals correctes de FAQ, menú després de scroll i Serveis a 320 px. Evidència: `qa/focused-google-reviews/report.json`.
- Revisió visual del bloc a 320, 375 i 1440 px, amb captures a `qa/focused-google-reviews/google-reviews-*.png`; la targeta i el botó caben sense retalls.
- Revisió independent dels canvis: sense regressions de codi detectades; corregida una referència documental antiga al fragment d'opinions.

## Integració automàtica pendent

Google ofereix [Places UI Kit](https://developers.google.com/maps/documentation/javascript/places-ui-kit/place-details) amb un component de ressenyes. Requereix [configuració del projecte i clau](https://developers.google.com/maps/documentation/javascript/places-ui-kit/get-started). Quan aquestes dades estiguin disponibles caldrà implementar-lo, ajustar CSP/privacitat i validar la resposta real de Google. Les proves locals actuals no acrediten aquesta integració, que encara no existeix.
