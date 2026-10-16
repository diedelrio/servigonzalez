# Servi-González · sitio web

Web institucional/comercial estática (HTML + Tailwind 4). El código fuente está en `src/`; el sitio que se publica se genera en `dist/`.

## Desarrollo

```
npm install
npm run build        # genera dist/
npm run watch        # genera dist/ y recompila el CSS al cambiar
```

Abre `dist/index.html` en el navegador (o sírvelo con `npx serve dist`). No edites `dist/`: se regenera en cada build.

| Qué | Dónde |
|---|---|
| Páginas | `src/pages/*.html` (cabecera con `<!--meta {...} -->`) |
| Cabecera, pie y banner de cookies | `src/partials/layout.html` |
| Catálogo de la tienda | `src/data/catalogo.json` (se importa con `node scripts/import-catalogo.js "ruta/catalogo.md"`) |
| Opiniones junto al mapa | `src/data/reviews.json` |
| Colores y tipografías | `src/input.css` (`@theme`) |

## Despliegue en Render (Static Site)

- **Build Command:** `npm ci --include=dev && npm run build`
- **Publish Directory:** `dist`
- También puedes usar `render.yaml` (Blueprint).

### Variables de entorno (Render > Environment)

| Variable | Obligatoria | Descripción |
|---|---|---|
| `APP_URL` | Sí | URL base de la app de reparaciones, p. ej. `https://app.servigonzalez.es`. Si falta en Render, el build falla a propósito para no publicar enlaces a `localhost`. |
| `APP_SOLICITAR_URL` | No | URL completa del formulario de solicitud. Por defecto `APP_URL` + `/solicitar`. |
| `APP_CONSULTA_URL` | No | URL completa de la consulta de estado. Por defecto `APP_URL` + `/consulta`. |
| `SITE_URL` | Recomendada | URL pública del sitio (canonical, sitemap y robots). Por defecto `https://www.servigonzalez.es`. |

Tras cambiar una variable hay que volver a desplegar (las URLs se escriben en `dist/js/config.js` durante el build).

La app debe servirse por HTTPS y permitir ser incrustada desde el dominio de este sitio (cabecera `Content-Security-Policy: frame-ancestors`).
