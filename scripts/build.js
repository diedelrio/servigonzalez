// Genera el sitio estático en dist/ (lo que se publica).
//
// Variables de entorno (se configuran en Render > Environment):
//   APP_URL              URL base de la app de reparaciones (https://app.ejemplo.com). Obligatoria en Render.
//   APP_SOLICITAR_URL    (opcional) URL completa del formulario de solicitud. Por defecto APP_URL + /solicitar
//   APP_CONSULTA_URL     (opcional) URL completa de la consulta de estado. Por defecto APP_URL + /consulta
//   SITE_URL             URL pública de este sitio, para canonical, sitemap y robots. Por defecto https://www.servigonzalez.es
const fs = require('fs');
const path = require('path');
const renderCatalog = require('./catalog');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist');
const NAV = ['reparaciones', 'garantias', 'tienda', 'marcas', 'contacto'];

const trimSlash = u => u.replace(/\/+$/, '');
const SITE = trimSlash(process.env.SITE_URL || 'https://www.servigonzalez.es') + '/';

// --- URLs de la app ---
if (process.env.RENDER && !process.env.APP_URL) {
    console.error('\nERROR: falta la variable de entorno APP_URL (URL de la app de reparaciones).');
    console.error('Configúrala en Render > Environment antes de desplegar.\n');
    process.exit(1);
}
const appBase = trimSlash(process.env.APP_URL || 'http://localhost:5173');
const config = {
    urls: {
        app: appBase + '/',
        solicitarReparacion: process.env.APP_SOLICITAR_URL || appBase + '/solicitar',
        consultarReparacion: process.env.APP_CONSULTA_URL || appBase + '/consulta'
    },
    reviews: JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/reviews.json'), 'utf8'))
};

// --- Carpeta de salida limpia + recursos estáticos ---
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'css'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'js'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'css/styles.css'), path.join(OUT, 'css/styles.css'));
for (const f of ['cookies.js', 'main.js']) fs.copyFileSync(path.join(ROOT, 'js', f), path.join(OUT, 'js', f));
fs.cpSync(path.join(ROOT, 'fonts'), path.join(OUT, 'fonts'), { recursive: true });
fs.cpSync(path.join(ROOT, 'img'), path.join(OUT, 'img'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'favicon.svg'), path.join(OUT, 'favicon.svg'));

// --- config.js (URLs de la app y opiniones) ---
fs.writeFileSync(path.join(OUT, 'js/config.js'),
    '// Generado por scripts/build.js. No editar: cambia las variables de entorno o src/data/reviews.json.\n' +
    'window.SERVIGONZALEZ_CONFIG = ' + JSON.stringify(config, null, 4) + ';\n');

// --- Páginas ---
const layout = fs.readFileSync(path.join(ROOT, 'src/partials/layout.html'), 'utf8');
const pagesDir = path.join(ROOT, 'src/pages');
const indexable = [];
for (const file of fs.readdirSync(pagesDir)) {
    if (!file.endsWith('.html') || file.endsWith('.head.html')) continue;
    const name = file.replace(/\.html$/, '');
    const source = fs.readFileSync(path.join(pagesDir, file), 'utf8');
    const m = source.match(/^<!--meta (\{[\s\S]*?\}) -->\n/);
    if (!m) throw new Error(`${file}: falta el bloque <!--meta {...} -->`);
    const meta = JSON.parse(m[1]);
    const content = source.slice(m[0].length).replace('{{catalogo}}', () => renderCatalog(ROOT));
    const headFile = path.join(pagesDir, `${name}.head.html`);
    const head = fs.existsSync(headFile) ? fs.readFileSync(headFile, 'utf8').split('https://www.servigonzalez.es/').join(SITE) : '';
    const canonical = name === 'index' ? SITE : `${SITE}${name}.html`;
    const title = meta.title.includes('Servi-González') ? meta.title : `${meta.title} - Servi-González`;

    let html = layout
        .replace('{{content}}', () => content)
        .replace('{{head}}', () => head)
        .replace('{{robots}}', meta.robots ? `    <meta name="robots" content="${meta.robots}">\n` : '')
        .replace(/\{\{title\}\}/g, () => title)
        .replace(/\{\{description\}\}/g, () => meta.description)
        .replace(/\{\{canonical\}\}/g, canonical);
    for (const key of NAV) html = html.split(`{{cur:${key}}}`).join(meta.nav === key ? 'aria-current="page"' : '');
    fs.writeFileSync(path.join(OUT, `${name}.html`), html);
    if (!meta.robots) indexable.push({ url: canonical, priority: name === 'index' ? '1.0' : (name === 'reparaciones' ? '0.9' : '0.7') });
}

// --- sitemap.xml y robots.txt ---
indexable.sort((a, b) => b.priority.localeCompare(a.priority));
fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    indexable.map(p => `    <url><loc>${p.url}</loc><priority>${p.priority}</priority></url>`).join('\n') + '\n</urlset>\n');
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);

console.log(`dist/ listo: ${indexable.length} páginas indexables`);
console.log(`  app:        ${config.urls.app}`);
console.log(`  solicitar:  ${config.urls.solicitarReparacion}`);
console.log(`  consultar:  ${config.urls.consultarReparacion}`);
console.log(`  sitio:      ${SITE}`);
