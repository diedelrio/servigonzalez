// Renderiza el catálogo de la tienda (src/data/catalogo.json): filtros + listado en el HTML.
// El filtrado en el navegador está en js/main.js (sección CATÁLOGO DE LA TIENDA).
const fs = require('fs');
const path = require('path');

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fold = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

module.exports = function renderCatalog(root) {
    const items = JSON.parse(fs.readFileSync(path.join(root, 'src/data/catalogo.json'), 'utf8'));
    const brands = [];
    const categories = {};
    for (const i of items) {
        if (!brands.find(b => b.id === i.brand)) brands.push({ id: i.brand, name: i.brandName });
        categories[i.category] = (categories[i.category] || 0) + 1;
    }

    const brandButtons = [{ id: 'todas', name: 'Todas' }, ...brands].map((b, n) => {
        const count = b.id === 'todas' ? items.length : items.filter(i => i.brand === b.id).length;
        return `<button type="button" data-brand="${b.id}" aria-pressed="${n === 0}" class="chip">${esc(b.name)} <span class="chip-count">${count}</span></button>`;
    }).join('\n                    ');

    const categoryOptions = Object.keys(categories)
        .sort((a, b) => a.localeCompare(b, 'es'))
        .map(c => `<option value="${esc(c)}">${esc(c)} (${categories[c]})</option>`)
        .join('');

    const rows = items.map(i => {
        const subject = encodeURIComponent(`Consulta de stock: ${i.model} (${i.brandName})`);
        const body = encodeURIComponent(`Hola, quisiera consultar el stock de ${i.model} (${i.brandName}), ref. ${i.sku}.`);
        const search = fold([i.brandName, i.model, i.sku, i.category, i.description].join(' '));
        return `                <li class="product grid md:grid-cols-[190px_1fr_auto] items-start gap-2 md:gap-8 py-6 border-b border-line" data-brand="${i.brand}" data-category="${esc(i.category)}" data-search="${esc(search)}">
                    <div><span class="text-brand-dark font-semibold text-sm block">${esc(i.brandName)}</span><span class="text-xs text-muted">${esc(i.category)}</span></div>
                    <div class="max-w-2xl"><h3 class="font-title text-xl font-semibold">${esc(i.model)}</h3><p class="text-muted mt-1">${esc(i.description)}</p><p class="text-xs text-muted mt-2">Ref. ${esc(i.sku)}</p></div>
                    <a href="mailto:sat@servigonzalez.es?subject=${subject}&body=${body}" class="btn md:mt-1">Consultar stock<span class="sr-only"> de ${esc(i.model)} ${esc(i.brandName)}</span></a>
                </li>`;
    }).join('\n');

    return `            <div class="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" id="catalogo-filtros">
                <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar por marca">
                    ${brandButtons}
                </div>
                <div class="flex flex-col sm:flex-row gap-3">
                    <label class="sr-only" for="cat-q">Buscar en el catálogo</label>
                    <input id="cat-q" type="search" placeholder="Buscar modelo o referencia" autocomplete="off" class="field sm:w-64">
                    <label class="sr-only" for="cat-categoria">Categoría</label>
                    <select id="cat-categoria" class="field sm:w-56"><option value="">Todas las categorías</option>${categoryOptions}</select>
                </div>
            </div>
            <p id="cat-count" class="mt-4 text-sm text-muted" role="status" aria-live="polite">${items.length} productos</p>
            <ul id="cat-list" class="mt-2 border-t-2 border-ink">
${rows}
            </ul>
            <p id="cat-empty" class="hidden mt-6 text-muted">No hay productos que coincidan. Prueba con otra búsqueda o <a href="mailto:sat@servigonzalez.es" class="font-semibold text-brand-dark underline underline-offset-4">escríbenos por correo</a>.</p>
            <div class="mt-8"><button type="button" id="cat-more" class="btn btn-lg hidden">Ver más productos</button></div>
            <p class="mt-8 text-sm text-muted max-w-2xl">Los productos mostrados no constituyen una oferta en firme: precios, existencias y disponibilidad se confirman antes de cualquier compra.</p>`;
};
