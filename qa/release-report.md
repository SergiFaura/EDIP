# Ajustos i publicació inicial a Git — 23/10/2026

Aquest informe substitueix, per als punts afectats, les conclusions anteriors sobre mapa per clic i absència de commits. L’autorització actual demana commit inicial a `main` i push a `https://github.com/SergiFaura/EDIP.git`, conservant les claus només al PC. El remot s’ha comprovat buit abans del primer push.

## Canvis aplicats

1. **Inici:** retirat el distintiu de color amb «60 € · aprox. 60 min» de Primera visita. Conservats la descripció del pas i els altres continguts.
2. **Serveis:** eliminats cinc paràgrafs introductoris duplicats a adults, infantil/juvenil, pedagogia, logopèdia i parella/família. Els callouts repetits s’han convertit en textos específics de cada servei. Tallers i el llistat de serveis no tenien duplicats literals i s’han conservat. Tarifes i prestacions preservades.
3. **Equip:** nou bloc de formació de Judith dins del mateix perfil i amb el mateix fons, estructura i estil que les altres professionals. Conservades 36 formacions, quatre fotos, dades i CTA. Fons alternats crema/paper per professional, àrees en crema i CTA final en paper.
4. **Contacte:** mapa oficial directament a l’HTML, sense botó d’activació ni codi JS de mostrar/tancar. URL pública sincronitzada des de `site-data.json`. Corregida la contracció del títol «Adreça» amb etiqueta de mida estable i text de valor adaptable. Actualitzats els avisos compartits, textos legals i README per descriure el mapa automàtic.
5. **FAQ:** «La família participa en el procés d’infants i adolescents?» a Inici, Preguntes freqüents i el JSON-LD corresponent.

## Validació final

| Prova | Resultat |
| --- | --- |
| Auditoria estàtica | 18 pàgines, 16 URL al sitemap; 0 errors i 0 avisos a `static-release.json`. |
| Sincronització | `sync_site.py --check`: `changed: []`; els 3 tests d’integració passen. |
| Canvis d’aquesta entrega | 56/56 checks, a 320/375/768/1440 px i mapa també present sense JavaScript d’EDIP. `browser-release/report.json`. |
| Regressió general | 90/90 casos (18 pàgines × 5 amplades), 42/42 interaccions; cap error, desbordament ni imatge trencada. `browser-release-regression/report.json`. |
| Regressió de ressenyes | 168/168 checks amb SDK simulat, `browser-release-reviews/report.json`. |
| Mapa real | HTTP 200, document carregat abans de clic/scroll, ubicació d’EDIP confirmada pel CID i imatges del mapa carregades a 375 i 1440 px. `map-auto-live/report.json` i captures `*-REAL.png`. |
| Contrast i sintaxi | 16 parelles AA correctes; sintaxi de `main.js` correcta. |
| Exclusió de claus | `.gitignore` i índex verificats; 4 tests del detector de credencials correctes. `maintenance/check_staged_secrets.py` revisa els bytes de l’índex abans del commit sense imprimir valors. |
| Revisió visual | Inici, Equip i Contacte en escriptori i mòbil; Judith conserva 9 formacions dins del perfil, les etiquetes no es trenquen i els mapes reals són llegibles. |

La primera passada simultània del carrusel va esgotar el temps d’espera d’un cas; la repetició seqüencial passa les 168 proves sense modificar producció (`release-reviews-first-pass.json` conserva la incidència). La prova inicial del mapa esperava els controls de Google fora de pantalla: el runner ara comprova primer la càrrega automàtica del document i després exposa l’iframe per validar la imatge i el negoci. La prova real requereix accés de xarxa a Google; la primera passada restringida no el tenia.

La regressió general intercepta la configuració real de ressenyes amb camps buits i el mapa amb un document simulat. No llegeix ni modifica la clau. Les proves del carrusel també utilitzen fixtures; no es presenten com una nova validació de ressenyes reals (l’anterior és del 20/10). La prova real del mapa del 23/10 és separada. No s’ha desplegat el web ni validat headers de hosting.

## Fitxers locals i Git

- `edip_site/assets/js/google-reviews-config.js` i `API_GOOGLE.txt`: conservats físicament al PC, ignorats i absents de l’índex.
- `google-reviews-config.example.js`: únic exemple versionat, amb `apiKey` i `placeId` buits. No cal copiar-lo ni canviar res en aquest PC, on la configuració ja existeix.
- Originals de fotos, snapshots, captures, JSON de resultats, diff de QA i scripts històrics d’implementació: conservats localment i exclosos. Les imatges optimitzades del web sí que formen part del commit.
- Repositori sense commits previs: es prepara un commit inicial de tot el codi i la documentació vigents, sense credencials. Branca demanada: `main`; etiqueta de recuperació prevista: `backup-inicial-2026-10-23`.
- No s’inclouen secrets als missatges de commit ni a la documentació. La clau de navegador continua sent visible quan s’executa el web; Git no la publica. Les restriccions de la clau a Google Cloud continuen sent necessàries.

Les sortides detallades de QA no es versionen; es poden regenerar amb els runners mantinguts. El resultat real del commit i el push es confirma amb Git i es comunica al tancament, sense donar-los per fets en aquest informe preparat abans de publicar.
