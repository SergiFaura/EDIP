# Reconstrucció de requisits — estat rebut el 23/09/2026

Aquest registre descriu l'estat trobat en reprendre la sessió, abans de les correccions de recuperació. No és l'informe de validació final. S'ha contrastat el prompt indicat per la propietària amb els 18 HTML existents, CSS, JavaScript, sitemap, assets i evidències de `qa/`. Git no disposava de commits i els fitxers eren no seguits: no es pot atribuir cada canvi a la sessió anterior mitjançant un diff de commits.

«Complet» en aquesta matriu indica implementació de contingut/codi verificada; les comprovacions de navegador i regressió final es documenten separadament. Les línies corresponen a l'estat rebut i poden canviar després de completar la feina.

| Requisit | Estat rebut | Evidència i acció necessària |
| --- | --- | --- |
| 1. CTA de capçalera | Parcial | `Contacta’ns` present en 12 HTML. Sis encara tenen `Demanar visita` a les línies 30/39: `preguntes-frequents.html`, `privacitat.html`, `psicologia-adults.html`, `psicologia-infantil-juvenil.html`, `serveis.html`, `tallers-formacions.html`. Completar desktop i mòbil sense tocar CTA interns. |
| 2. Recursos → FAQ | Parcial | Els tres HTML de Recursos ja no existeixen. Els sis HTML anteriors encara hi apunten als menús (28/37); `sitemap.xml:18–20` també els inclou. FAQ i bloc de la home conservats. Eliminar referències trencades i completar navegació. |
| 3. Formulari | Complet | `contacte.html:62`: opcions separades de parella/familiar i botó nou. `assets/js/main.js:76–89`: servei incorporat al cos, encoding amb `encodeURIComponent` i estat honest que encara no s'ha enviat. Pendent prova final en navegador. |
| 4. Blocs foscos | Complet | CSS: `--ink` conservat; `--dark-soft:#594038`, `--dark-accent:#f2bea3` aplicats a finder i secció fosca. Contrast calculat accent/fons 5,72:1; blanc/fons 9,48:1. Pendent inspecció visual final. |
| 5. Finder amb Logopèdia | Complet | `index.html:75–80`: cinc opcions i enllaç correcte. CSS: última opció ocupa dues columnes i passa a una al mòbil. |
| 6. Tarifes | Complet | Adults/infantil 60 €/50 €; home procés i FAQ 60 €/50 €/38 €; FAQ general igual; pedagogia 38 € i 45 min; logopèdia 38 €; parella/familiar 70 €/60 € amb abast explícit per als dos serveis. No s'han trobat 55 € o 40 € obsolets. |
| 7. «Ateneu» | Complet | `preguntes-frequents.html:57` conté la pregunta corregida; també en la cadena del JSON-LD, que té un altre error de sintaxi. |
| 8. Pedagogia | Complet | `pedagogia-reeducacions.html:66`: discalcúlia al costat de dislèxia, TEA/neurodesenvolupament i atenció/memòria. |
| 9. Orientacions a la família | Complet | `pedagogia-reeducacions.html:73`: resposta comença amb «Sí.». |
| 10. Especialitats | Complet | `serveis.html:94`: parella i familiar separats; neurodesenvolupament, problemes a la feina i mala conducta presents. CSS amb flex-wrap; validar amplades petites. |
| 11. Targeta de famílies | Complet | `equip.html:63`: «Teràpia de parella i de famílies» i enllaç a `parella-familia.html`. Legacy Judith dirigeix a Equip. |
| 12. Perfil complet a Equip | Complet | `equip.html:61–64`: bloc amb id, foto, nom, rol, col·legiació, direcció, presentació, nou elements de formació, àrees i contacte. Text d'equip sense inventar noms. CSS específic circular i nom contingut. `index.html:134` dirigeix a l'anchor. Legacy sense duplicar el perfil complet. |
| 13. Com treballem | Complet | `metode.html:61`: frase de confiança, escolta i respecte correcta. Hi ha una regressió de CSS independent, descrita més avall. |
| 14. Tallers | Complet | `tallers-formacions.html:59`: «1. Reunió inicial». |
| 15. Online | Complet | `index.html:60`, `contacte.html:61` indiquen online segons servei; `psicologia-adults.html:66` explicita presencial i online. |
| 16. Adreça i Maps | Parcial | Entresol 1a present en adreces visibles i schema. Maps exacte en 12 HTML, però sis footers mantenen cerca genèrica: FAQ:79, privacitat:87, adults/infantil:93, serveis:118, tallers:83. |
| 17. Opinions | Complet | `index.html:165–175`: tres extractes reals, inicials A.M./J.P./C.R., font enllaçada i cap puntuació inventada. Contrastats amb la font autoritzada el 23/09/2026. `qa/source-notes.md` encara deia erròniament que calia integrar-los. |
| 18. Legals i cookies | Parcial | Titular i dades reals incorporats; textos en català sense crèdits del proveïdor. Privacitat havia condensat totes les finalitats/bases en un únic paràgraf, perdent-ne l'associació per tractament; es prepara correcció mínima separada. `cookies.html` concorda amb JS, però sis HTML mantenen un botó «Acceptar analítica» sense listener i checkbox habilitat. README conserva l'avís de revisió professional però encara diu que falta completar identitat. |
| 19. Fotos del centre | Complet | Cinc WebP amb noms estables i 1086 × 1448, entre 108.802 i 161.226 bytes. SHA-256 actuals coincideixen amb `qa/assets-conversion.json`. Assignacions correctes en serveis i galeria de cinc sales. No hi ha `foto1..foto4` en producció. Conservar les imatges i revisar crops en navegador. |
| 20. Parella/família | Complet | Formulari i chips separats; pàgina compartida i tarifes explícites per als dos serveis. |

## Regressions addicionals verificades

- `preguntes-frequents.html:20`: JSON-LD invàlid perquè conté anchors amb cometes dobles no escapades dins de cadenes JSON. Cal regenerar-lo a partir del contingut visible de manera segura.
- `metode.html:60`: s'ha introduït un H2 amb classe `visually-hidden`, però CSS no defineix aquesta classe; es mostra com un títol gran fora del contenidor. Cal completar l'estil d'accessibilitat.
- `sitemap.xml:9`: encara promociona `judith-faura.html`, que ja declara Equip com a canonical. Cal deixar al sitemap només la versió canònica.
- Sis HTML conserven l'estat anterior dels elements compartits (navegació, CTA, Maps, privacitat i metadades), evidència coherent amb una actualització interrompuda.
- Els informes anteriors no representen tots els fitxers actuals: `qa/assets-services-report.json` encara enumera HTML de Recursos que ja no existeixen; tornar a executar les validacions finals.

## Fonts de contingut extern autoritzades comprovades

- Opinions: https://gratis-4373136.webador.es/opiniones
- Avís legal: https://gratis-4373136.webador.es/1611656_aviso-legal
- Privacitat: https://gratis-4373136.webador.es/1611686_politica-de-privacidad

No s'ha consultat la web antiga com a referència d'arquitectura o disseny.

## Requisits 21–29

| Requisit | Estat rebut | Resultat final |
| --- | --- | --- |
| 21. SEO global/local | Parcial | Completats 18 heads, navegació, metadades socials, 27 JSON-LD vàlids i breadcrumbs; sitemap de 16 canòniques. Legacy Judith fora del sitemap i canonical Equip. |
| 22. Responsive/accessibilitat | Parcial, sense validació final | Cinc amplades en 18 pàgines; corregits H2 sense estil i desbordament de Serveis a 320 px. Teclat, FAQ, menú, formulari, focus, preferències i fallback sense JS verificats. |
| 23. Manteniment/dades/assets | Faltava font global | `maintenance/site-data.json` i sincronitzador estàndard sense dependències de runtime; HTML preexistent conservat i camps marcats. 14 assets, cap duplicat binari, cinc WebP originals preservats. |
| 24. Automatització/regressió | Scripts i captures parcials existents | Validador ampliat i informes renovats: zero errors/warnings estàtics, 90 casos de navegador i 46 comprovacions funcionals, inclòs menú després de scroll. |
| 25. Informe mantenibilitat | Faltava | README i `qa/final-report.md` amb font de veritat, duplicació real i inventari. |
| 26. Seguretat | CSP i UI de privacitat parcials | CSP/referrer als 18 HTML, sense executable inline; storage només preferència, cap tracker ni secret detectat. Headers HTTP documentats perquè el hosting no està definit. |
| 27. README | Inicial, amb instruccions obsoletes | Contingut conservat i ampliat; corregides les indicacions antigues de Recursos i identitat legal pendent. |
| 28. Validació final | No finalitzada | Servidor local, proves Chrome, imatges, enllaços, JSON-LD, sitemap i diff contra snapshot revisats. |
| 29. Informe final | Faltava | `qa/final-report.md` documenta resultats i límits de producció; sense commit ni push. |

Els parcials dels requisits 1, 2, 16 i 18 també han quedat corregits. Els requisits ja correctes de contingut, tarifes, equip, fotos i opinions s'han preservat. Les proves completes i els límits figuren a l'informe final; aquesta matriu continua diferenciant l'estat rebut del resultat.

Revalidació del 25/09/2026: proves estàtiques, sincronització, assets, contrast i navegador renovades. La revisió independent ha completat els marcadors del títol d'adreça de Centre, del contacte assistencial a Avís legal i del nom al copyright. La prova d'integració comprova aquests usos; els canvis no alteren el text visible actual ni la identitat legal separada.
