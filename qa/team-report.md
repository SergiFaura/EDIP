# Ampliació d’Equip — 09/10/2026

## Contingut

- Judith Faura: psicòloga i directora d’EDIP; nova foto i 9 entrades de formació segons la llista facilitada. Conservades presentació, col·legiació 29689, condició de psicòloga general sanitària, CTA i anchor `#judith-faura`.
- Ester: psicòloga d’EDIP, foto i 11 entrades; màster en Psicologia General Sanitària expressament en curs.
- Maria: psicòloga col·laboradora d’EDIP, foto i 7 entrades.
- Teresa: orientadora col·laboradora d’EDIP, foto i 9 entrades; màster en Psicopedagogia expressament en curs.
- Coincidència literal i d’ordre de les 36 entrades contrastada en revisió independent. No s’han inventat cognoms, titulacions ni especialitats.

S’han preservat els retrats circulars, colors, tipografia, botons, navegació i àrees d’acompanyament. S’han afegit accessos interns als quatre perfils, ampliat title/description/OG i actualitzat el JSON-LD de les quatre persones. Els estudis en curs no es presenten com a titulacions completades.

## Fotografies i manteniment

Font: els quatre JPG nominats facilitats a `Imateges equip/`. La correspondència prové dels noms dels fitxers i del material etiquetat per l’usuari. El collage és una referència i no s’ha copiat a producció.

Les versions WebP són de 1200 × 1600 px i pesen conjuntament 612.526 bytes. Només s’ha normalitzat l’orientació EXIF, reduït proporcionalment la resolució i codificat a WebP sense metadades EXIF. Sense retocs de persones ni modificacions dels originals; hashes verificats a `team-assets.json`. El retall visual circular s’aplica amb CSS.

La foto de Judith continua compartida entre Equip i Home; s’han actualitzat les dimensions HTML i ajustat el marc de la portada perquè quedi ple. Les rutes es mantenen a `maintenance/site-data.json`, camps `images.judith`, `images.ester`, `images.maria` i `images.teresa`. `sync_site.py` també propaga canvis d’aquestes rutes al JSON-LD. Rols i formació continuen a l’HTML, tal com explica el README.

## Validació

- `sync_site.py --check`: cap divergència, sense modificar fitxers.
- `test_sync_site.py`: 2 proves correctes; la prova de propagació cobreix ara les quatre fotos i les seves dades estructurades, a més de la idempotència, mode check i rebuig d’URL insegura.
- `validate_site.py`: 18 HTML, 16 URL de sitemap i 17 imatges; 0 errors i 0 avisos (`static-team.json`).
- Passada final de navegador després de l’ajust del marc de Home: 10 casos (Equip/Home a 320, 375, 768, 1024 i 1440 px), 42 comprovacions funcionals; cap error, desbordament, imatge trencada, resposta HTTP inesperada ni petició externa (`browser-team/report.json`).
- Retrats i llistes revisats visualment a 375 i 1440 px (`team-visual/`). Una captura llarga de Judith retallava visualment el segon CTA; s’ha comprovat amb scroll i hit testing que el botó és complet i accessible. `judith-cta-375.png` mostra el resultat real.

No s’han canviat les tarifes, el formulari, les ressenyes, els textos legals, les cookies ni el JavaScript de producció. No hi ha noves dependències ni peticions externes. Sense commit ni push.
