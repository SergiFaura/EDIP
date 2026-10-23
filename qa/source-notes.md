# Fonts autoritzades i decisions — revisió de recuperació 23/09/2026

Les tres fonts es van consultar el 22/09/2026 i s'han tornat a comprovar durant la recuperació el 23/09/2026:

- Opinions: https://gratis-4373136.webador.es/opiniones
- Avís legal: https://gratis-4373136.webador.es/1611656_aviso-legal
- Privacitat: https://gratis-4373136.webador.es/1611686_politica-de-privacidad

## Implementació

La primera intervenció sobre textos legals va substituir els cossos de `edip_site/avis-legal.html` i `edip_site/privacitat.html`, preservant llavors el HTML extern. La sessió de recuperació completa també els elements compartits i metadades pendents; aquesta nota no afirma que s'hagin deixat inalterats durant tota la tasca.

Són redaccions resumides pròpies en català amb les dades i clàusules verificades, no reproduccions íntegres dels documents. No es presenten com una validació jurídica. Els textos no incorporen crèdits, promocions, disseny ni dependències de l'antic proveïdor.

`qa/opinions.html` conserva la proposta històrica de tres extractes literals breus, inicials i enllaç a la font, sense puntuacions. Estaven integrats a `edip_site/index.html` en la validació del 25/09. El 29/09 s'han retirat de producció a petició de l'usuari per passar a Google Maps. El fragment de QA continua com a evidència històrica, no és una pàgina de producció.

## Canvi de font de ressenyes — 29/09/2026

Verificació directa al navegador a Google Maps: **EDIP | Educació i Psicologia**, Plaça del Carme, 17, altell 1, Tàrrega, telèfon 654 29 87 45, web ediptarrega.com. Place ID exposat a l'enllaç del resultat: `ChIJD2Lre4XhphIR8x2oRi6jTCE`. S'ha obert la pestanya Ressenyes; la seva URL està guardada a `maintenance/site-data.json`, camp `maps_reviews`.

L'enllaç anterior `https://maps.app.goo.gl/Wgogfz7CfdisprbR6` redirigeix actualment a **Amanda Cervera | Teràpia psicològica**, Carrer de Gerri de la Sal i telèfon 633 18 99 89. No és la fitxa sol·licitada. S'ha substituït globalment `maps` i sincronitzat també `hasMap` del JSON-LD.

No s'han copiat ressenyes, noms d'autors, puntuacions ni recomptes a producció. El bloc actual enllaça a la font; la integració automàtica requereix Google Maps Platform configurat i queda pendent. Vegeu `google-reviews-report.md` per a l'estat i les proves d'aquest canvi.

La revisió ha detectat que la privacitat resumida agrupava les bases i finalitats sense relacionar-les. La correcció de `qa/privacy-reviewed-fragment.html` ja està integrada a `edip_site/privacitat.html`: diferencia els cinc tractaments i vincula finalitat, base, conservació i destinataris. Conserva les dades identificatives i les explicacions tècniques correctes del formulari i preferències. El fragment es conserva com a evidència, no com una validació jurídica ni una pàgina publicable per separat.

## Decisions i punts per al README

- Mostrar diferenciats domicili social i ubicació assistencial. No s'ha inferit que hagin de coincidir.
- Diferenciar correu legal i correu públic actual d'EDIP. No s'han modificat les dades globals de contacte.
- La política original inclou la variant inconsistent `judithfaurapsicologia@gmail.com`. S'ha utilitzat la versió repetida i coherent `judithfaurapsicologa@gmail.com`, també present a l'avís legal.
- La font legal fixa castellà; l'avís català conserva la menció i cal revisió professional de la llengua jurídica abans de producció.
- La política antiga també aborda tractaments professionals fora de la web. Això no implica implementar màrqueting, seguiment, xarxes, eines de reserva ni historial clínic al navegador.
- Revisió professional obligada abans de producció: adequació de tots els tractaments actuals, conservació clínica autonòmica, comunicacions comercials, dades identificatives i abast de les clàusules resumides.
- El comportament tècnic del formulari s'ha descrit com a preparació d'un missatge al gestor de correu, sense enviament automàtic ni emmagatzematge del contingut a la web.
- `cookies.html` i `main.js` ja descrivien només preferència local i absència real d'analítica o trackers en reprendre. Sis HTML encara conservaven controls antics d'acceptació d'analítica; s'han identificat a `qa/recovery-requirements.md` perquè la recuperació els unifiqui.

## Verificació de l'edició

La primera substitució va exigir una única coincidència de la secció legal a cada fitxer, evitant reemplaçaments globals. Els enllaços afegits són `mailto:`, `tel:`, el destí oficial d'AEPD i `cookies.html` existent. La proposta de recuperació només inclou HTML semàntic, text i els mateixos enllaços; no introdueix scripts, recursos externs carregats, inline handlers ni dependències.
