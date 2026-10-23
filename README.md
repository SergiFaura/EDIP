# EDIP — web del centre

Web estàtic a `edip_site/`, sense build ni dependències npm de producció. Executar des d’aquesta carpeta:

```sh
python -m http.server 8000 --bind 127.0.0.1 --directory edip_site
```

Obrir `http://127.0.0.1:8000/`. Publicar només el contingut de `edip_site/`; les carpetes de manteniment i QA no són publicables.

## Configuració que es conserva al PC

La configuració real de ressenyes, `edip_site/assets/js/google-reviews-config.js`, i `API_GOOGLE.txt` estan ignorats per Git. No s’han d’esborrar ni sobreescriure en actualitzar aquest equip. El repositori només inclou `google-reviews-config.example.js`, amb els camps buits.

En un clon nou, copiar l’exemple a `google-reviews-config.js` i emplenar `apiKey` i `placeId`. No copiar-lo sobre un fitxer que ja contingui la configuració. El mapa de Contacte utilitza una URL pública de Google i no necessita aquesta clau.

## Manteniment i proves

```sh
python maintenance/sync_site.py --check
python qa/validate_site.py edip_site --output qa/static-release.json
python qa/test_sync_site.py
python qa/test_staged_secrets.py
python maintenance/check_staged_secrets.py
```

L’última comprovació revisa els bytes que són a l’índex de Git, sense imprimir credencials. Executar-la després de preparar el commit i abans de confirmar-lo.

Les suites de navegador es descriuen a [edip_site/README.md](edip_site/README.md); els seus runtimes Playwright/Chrome depenen de l’equip de desenvolupament. Les captures, snapshots, resultats JSON i originals de fotografies es conserven localment i no es versionen. `qa/release-report.md` documenta els ajustos del 23/10/2026.
