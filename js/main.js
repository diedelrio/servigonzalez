// --- PREFERENCIAS DE MOVIMIENTO ---
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Mantiene el foco dentro de un diálogo (Tab / Shift+Tab) entre sus elementos enfocables
function trapFocus(container, e) {
    if (e.key !== 'Tab') return;
    const items = [...container.querySelectorAll('button, [href], iframe, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter(el => !el.disabled && el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
        e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
    }
}

// --- URLs DE LA APP: asigna el href de todo elemento con data-config-url="<clave>" ---
// Las URLs vienen de js/config.js, que genera el build a partir de las variables de entorno.
document.addEventListener('DOMContentLoaded', () => {
    const urls = window.SERVIGONZALEZ_CONFIG.urls;
    document.querySelectorAll('[data-config-url]').forEach(el => {
        const url = urls[el.dataset.configUrl];
        if (url) el.setAttribute('href', url);
    });
});

// --- MENÚ MÓVIL ---
const mobileMenu = document.getElementById('mobile-menu');
const menuToggle = document.getElementById('menu-toggle');

function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('hidden');
    menuToggle.setAttribute('aria-expanded', 'false');
}

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        const open = mobileMenu.classList.toggle('hidden') === false;
        menuToggle.setAttribute('aria-expanded', String(open));
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileMenu));
}

// --- MODAL CON LA APP DE REPARACIONES (iframe cargado al abrir) ---
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal-app');
    const frame = document.getElementById('modal-app-frame');
    const closeBtn = document.getElementById('modal-app-close');
    const urls = window.SERVIGONZALEZ_CONFIG.urls;
    let opener = null;

    function openModal(btn) {
        opener = btn;
        frame.title = btn.dataset.modalTitle;
        frame.src = urls[btn.dataset.modalOpen];
        modal.classList.add('is-open');
        document.body.classList.add('overflow-hidden');
        closeBtn.focus();
    }

    function closeModal() {
        modal.classList.remove('is-open');
        document.body.classList.remove('overflow-hidden');
        frame.removeAttribute('src');
        if (opener) opener.focus();
    }

    const isOpen = () => modal.classList.contains('is-open');


    document.querySelectorAll('[data-modal-open]').forEach(b => b.addEventListener('click', () => {
        closeMobileMenu();
        openModal(b);
    }));
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) closeModal(); });
    modal.addEventListener('keydown', e => { if (isOpen()) trapFocus(modal, e); });
});

// --- POPUP DE BIENVENIDA (solo en la home) ---
// Se muestra una sola vez por navegador y solo después de resolver el banner de cookies.
document.addEventListener('DOMContentLoaded', () => {
    const popup = document.getElementById('popup-bienvenida');
    if (!popup) return;
    const POPUP_KEY = 'sg_popup_seen';
    let opener = null;

    const seen = () => { try { return localStorage.getItem(POPUP_KEY) === '1'; } catch (e) { return false; } };
    const markSeen = () => { try { localStorage.setItem(POPUP_KEY, '1'); } catch (e) { /* sin almacenamiento */ } };
    const isOpen = () => popup.classList.contains('is-open');

    function openPopup() {
        if (seen() || isOpen()) return;
        opener = document.activeElement;
        popup.removeAttribute('inert');
        popup.setAttribute('aria-hidden', 'false');
        popup.classList.add('is-open');
        popup.querySelector('[data-popup-close]').focus();
    }

    function closePopup() {
        markSeen();
        popup.classList.remove('is-open');
        popup.setAttribute('aria-hidden', 'true');
        popup.setAttribute('inert', '');
        if (opener && opener.focus) opener.focus();
    }

    popup.querySelectorAll('[data-popup-close]').forEach(b => b.addEventListener('click', closePopup));
    popup.addEventListener('click', e => { if (e.target === popup) closePopup(); });
    popup.addEventListener('keydown', e => {
        if (e.key === 'Escape') closePopup();
        else trapFocus(popup, e);
    });

    const banner = document.getElementById('cookie-banner');
    const schedule = () => setTimeout(openPopup, 1500);
    if (banner && !banner.classList.contains('hidden')) {
        document.addEventListener('sg:consent-resolved', schedule, { once: true });
    } else {
        schedule();
    }
});

// --- REVELADO ÚNICO de la línea de pasos al entrar en pantalla ---
document.addEventListener('DOMContentLoaded', () => {
    const groups = document.querySelectorAll('[data-reveal]');
    if (!groups.length) return;
    if (!('IntersectionObserver' in window)) {
        groups.forEach(g => g.classList.add('is-in'));
        return;
    }
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.1 });
    groups.forEach(g => observer.observe(g));
});

// --- CABECERA: sombra suave al hacer scroll ---
(function () {
    const header = document.querySelector('.site-header');
    if (!header) return;
    let ticking = false;
    const update = () => { header.classList.toggle('is-scrolled', window.scrollY > 8); ticking = false; };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
})();

// --- OPINIONES DE CLIENTES (junto al mapa) ---
// Datos en js/config.js (SERVIGONZALEZ_CONFIG.reviews). Avanza sola cada 6 s; se pausa con el cursor,
// el foco, la pestaña oculta, fuera de pantalla o con el botón Pausar.
document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('reviews');
    if (!root) return;
    const list = (window.SERVIGONZALEZ_CONFIG.reviews || [])
        .filter(r => r && r.author && r.text)
        .sort((a, b) => (b.rating - a.rating) || String(b.date || '').localeCompare(String(a.date || '')))
        .slice(0, 5);
    if (!list.length) return; // se queda el mensaje por defecto

    const stage = root.querySelector('.reviews-stage');
    const controls = root.querySelector('.reviews-controls');
    const dotsBox = root.querySelector('.reviews-dots');
    const toggle = root.querySelector('.reviews-toggle');
    stage.innerHTML = '';

    const fmtDate = iso => {
        const d = new Date(iso);
        return isNaN(d) ? '' : d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    };
    const el = (tag, cls, text) => {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined) n.textContent = text;
        return n;
    };

    const slides = list.map((r, i) => {
        const slide = el('div', 'review');
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'diapositiva');
        slide.setAttribute('aria-label', `${i + 1} de ${list.length}`);
        const rating = Math.max(0, Math.min(5, Math.round(r.rating || 5)));
        const stars = el('p', 'review-stars', '★'.repeat(rating) + '☆'.repeat(5 - rating));
        stars.setAttribute('role', 'img');
        stars.setAttribute('aria-label', `${rating} de 5 estrellas`);
        const quote = el('blockquote', 'review-text text-ink leading-relaxed', `“${r.text}”`);
        const by = el('p', 'text-sm text-muted mt-auto');
        by.append(el('strong', 'text-ink', r.author), r.date && fmtDate(r.date) ? ` · ${fmtDate(r.date)}` : '');
        slide.append(stars, quote, by);
        stage.append(slide);
        return slide;
    });

    if (slides.length < 2) { slides[0].classList.add('is-active'); return; }

    const progress = el('div', 'reviews-progress');
    progress.setAttribute('aria-hidden', 'true');
    stage.append(progress);
    stage.style.paddingBottom = '.75rem';

    const dots = slides.map((_, i) => {
        const b = el('button', 'reviews-dot');
        b.type = 'button';
        b.setAttribute('aria-label', `Ver opinión ${i + 1}`);
        b.addEventListener('click', () => show(i));
        dotsBox.append(b);
        return b;
    });
    controls.classList.remove('hidden');
    controls.classList.add('flex');

    let current = 0;
    let manualPause = false;
    let hovering = false;
    let visible = true;
    const animated = !reduceMotion;

    const DURATION = 6000;
    let remaining = DURATION;
    let startedAt = 0;
    let timer = null;
    const isPaused = () => manualPause || hovering || !visible || document.hidden;

    function schedule() {
        clearTimeout(timer);
        timer = null;
        if (!animated || isPaused()) return;
        startedAt = performance.now();
        timer = setTimeout(() => show(current + 1), remaining);
    }

    // Pausa conservando el tiempo que faltaba para pasar a la siguiente opinión
    function syncPause() {
        const paused = isPaused();
        root.classList.toggle('is-paused', paused);
        if (paused) {
            if (timer) { clearTimeout(timer); timer = null; remaining -= performance.now() - startedAt; }
        } else if (!timer) {
            schedule();
        }
    }

    function restartProgress() {
        root.classList.remove('is-running');
        if (!animated) return;
        void progress.offsetWidth; // reinicia la animación
        root.classList.add('is-running');
    }

    function show(i) {
        const prev = current;
        current = (i + slides.length) % slides.length;
        slides.forEach((s, idx) => {
            const active = idx === current;
            s.classList.toggle('is-active', active);
            s.classList.toggle('is-prev', idx === prev && !active);
            s.toggleAttribute('inert', !active);
            s.setAttribute('aria-hidden', String(!active));
            dots[idx].setAttribute('aria-current', String(active));
        });
        remaining = DURATION;
        restartProgress();
        schedule();
    }

    root.addEventListener('mouseenter', () => { hovering = true; syncPause(); });
    root.addEventListener('mouseleave', () => { hovering = false; syncPause(); });
    root.addEventListener('focusin', () => { hovering = true; syncPause(); });
    root.addEventListener('focusout', () => { hovering = false; syncPause(); });
    document.addEventListener('visibilitychange', syncPause);
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncPause(); }).observe(root);
    }

    if (animated) {
        toggle.addEventListener('click', () => {
            manualPause = !manualPause;
            toggle.setAttribute('aria-pressed', String(manualPause));
            toggle.textContent = manualPause ? 'Reanudar' : 'Pausar';
            syncPause();
        });
    } else {
        toggle.classList.add('hidden');
    }

    show(0);
});

// --- CATÁLOGO DE LA TIENDA: filtros por marca, categoría y búsqueda ---
// El listado completo ya viene en el HTML (visible sin JS); aquí solo se oculta lo que no coincide.
document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('cat-list');
    if (!list) return;
    const PAGE = 20;
    const items = [...list.querySelectorAll('.product')];
    const brandBtns = [...document.querySelectorAll('#catalogo-filtros [data-brand]')];
    const catSel = document.getElementById('cat-categoria');
    const input = document.getElementById('cat-q');
    const count = document.getElementById('cat-count');
    const empty = document.getElementById('cat-empty');
    const more = document.getElementById('cat-more');
    const fold = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    let brand = 'todas';
    let limit = PAGE;

    function render() {
        const words = fold(input.value).split(/\s+/).filter(Boolean);
        const category = catSel.value;
        const matches = items.filter(li =>
            (brand === 'todas' || li.dataset.brand === brand) &&
            (!category || li.dataset.category === category) &&
            words.every(w => li.dataset.search.includes(w)));
        const shown = new Set(matches.slice(0, limit));
        items.forEach(li => { li.hidden = !shown.has(li); });
        empty.classList.toggle('hidden', matches.length > 0);
        more.classList.toggle('hidden', matches.length <= limit);
        more.textContent = `Ver más productos (${matches.length - limit} restantes)`;
        count.textContent = matches.length === items.length
            ? `${items.length} productos`
            : `${matches.length} ${matches.length === 1 ? 'producto' : 'productos'}`;
    }

    brandBtns.forEach(btn => btn.addEventListener('click', () => {
        brand = btn.dataset.brand;
        brandBtns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
        limit = PAGE;
        render();
    }));
    catSel.addEventListener('change', () => { limit = PAGE; render(); });
    input.addEventListener('input', () => { limit = PAGE; render(); });
    more.addEventListener('click', () => { limit += PAGE; render(); });

    // Enlaces desde otras páginas: tienda.html?marca=dewalt&q=taladro
    const params = new URLSearchParams(location.search);
    const wanted = params.get('marca');
    const btn = brandBtns.find(b => b.dataset.brand === wanted);
    if (btn) btn.click();
    if (params.get('q')) input.value = params.get('q');
    render();
});
