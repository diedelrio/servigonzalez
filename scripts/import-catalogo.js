// Importa el catálogo desde un .md (tablas por marca) a src/data/catalogo.json
// Uso: node scripts/import-catalogo.js "C:/ruta/catalogo.md"
const fs = require('fs');
const path = require('path');

const input = process.argv[2];
if (!input) { console.error('Indica el .md del catálogo'); process.exit(1); }

const BRANDS = {
    'black+decker': { id: 'black-decker', name: 'Black & Decker' },
    'dewalt': { id: 'dewalt', name: 'DeWalt' },
    'stanley': { id: 'stanley', name: 'Stanley' }
};
const CATEGORY_LABELS = { Multitool: 'Multiherramientas', Rebajadoras: 'Fresadoras', Sopladores: 'Jardín', Pistolas: 'Pistolas de calor' };
const TYPOS = [[/Martillo combinados/g, 'Martillo combinado']];

const items = [];
for (const line of fs.readFileSync(input, 'utf8').split(/\r?\n/)) {
    if (!line.startsWith('|') || /^\|\s*:?-/.test(line) || /Marca\s*\|\s*SKU/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    const brand = BRANDS[cells[0].replace(/\*/g, '').toLowerCase()];
    if (!brand) continue;
    const sku = cells[1].replace(/`/g, '');
    let model, category, description;
    if (cells.length >= 5) [, , model, category, description] = cells;
    else { [, , category, description] = cells; model = sku.replace(/-(QS|QW|XJ)$/, ''); } // filas sin columna "Modelo"
    for (const [re, to] of TYPOS) description = description.replace(re, to);
    items.push({ brand: brand.id, brandName: brand.name, sku, model, category: CATEGORY_LABELS[category] || category, description });
}
fs.writeFileSync(path.join(__dirname, '../src/data/catalogo.json'), JSON.stringify(items, null, 1) + '\n');
const count = items.reduce((a, i) => (a[i.brand] = (a[i.brand] || 0) + 1, a), {});
console.log(items.length, count);
