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
        modal.classList.remove('opacity-0', 'pointer-events-none');
        document.body.classList.add('overflow-hidden');
        closeBtn.focus();
    }

    function closeModal() {
        modal.classList.add('opacity-0', 'pointer-events-none');
        document.body.classList.remove('overflow-hidden');
        frame.removeAttribute('src');
        if (opener) opener.focus();
    }

    const isOpen = () => !modal.classList.contains('pointer-events-none');

    document.querySelectorAll('[data-modal-open]').forEach(b => b.addEventListener('click', () => {
        closeMobileMenu();
        openModal(b);
    }));
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) closeModal(); });
    modal.addEventListener('keydown', e => { if (isOpen()) trapFocus(modal, e); });
});

// --- POPUP DE BIENVENIDA ---
// Se muestra una sola vez por navegador y solo después de resolver el banner de cookies.
document.addEventListener('DOMContentLoaded', () => {
    const POPUP_KEY = 'sg_popup_seen';
    const popup = document.getElementById('popup-bienvenida');
    const card = popup.querySelector('.transform');
    let opener = null;

    const seen = () => { try { return localStorage.getItem(POPUP_KEY) === '1'; } catch (e) { return false; } };
    const markSeen = () => { try { localStorage.setItem(POPUP_KEY, '1'); } catch (e) { /* sin almacenamiento */ } };
    const isOpen = () => !popup.classList.contains('pointer-events-none');

    function openPopup() {
        if (seen() || isOpen()) return;
        opener = document.activeElement;
        popup.removeAttribute('inert');
        popup.setAttribute('aria-hidden', 'false');
        popup.classList.remove('opacity-0', 'pointer-events-none');
        popup.classList.add('opacity-100');
        card.classList.remove('scale-95');
        card.classList.add('scale-100');
        popup.querySelector('[data-popup-close]').focus();
    }

    function closePopup() {
        markSeen();
        card.classList.remove('scale-100');
        card.classList.add('scale-95');
        popup.classList.remove('opacity-100');
        popup.classList.add('opacity-0', 'pointer-events-none');
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

    const bannerPending = () => {
        const banner = document.getElementById('cookie-banner');
        return banner && !banner.classList.contains('hidden');
    };
    const schedule = () => setTimeout(openPopup, 1500);

    if (bannerPending()) document.addEventListener('sg:consent-resolved', schedule, { once: true });
    else schedule();
});

// --- AUTOPLAY: pausa con la pestaña oculta o la sección fuera de pantalla ---
function createAutoplay(section, tick, delay) {
    let timer = null;
    let visible = true;
    let hovering = false;
    let paused = false;

    const running = () => !reduceMotion && visible && !hovering && !paused && !document.hidden;
    const sync = () => {
        clearInterval(timer);
        timer = running() ? setInterval(tick, delay) : null;
    };

    section.addEventListener('mouseenter', () => { hovering = true; sync(); });
    section.addEventListener('mouseleave', () => { hovering = false; sync(); });
    section.addEventListener('focusin', () => { hovering = true; sync(); });
    section.addEventListener('focusout', () => { hovering = false; sync(); });
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(section);
    }
    sync();

    return {
        restart: sync,
        setPaused(value) { paused = value; sync(); },
        isPaused: () => paused
    };
}

// --- SLIDER PRINCIPAL (HERO) ---
(function () {
    const hero = document.getElementById('inicio');
    const slides = [...hero.querySelectorAll('.slide')];
    const pauseBtn = document.getElementById('slide-toggle');
    let current = 0;

    function show(index) {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, i) => {
            const active = i === current;
            slide.classList.toggle('opacity-100', active);
            slide.classList.toggle('pointer-events-auto', active);
            slide.classList.toggle('opacity-0', !active);
            slide.classList.toggle('pointer-events-none', !active);
            slide.toggleAttribute('inert', !active);
            slide.setAttribute('aria-hidden', String(!active));
        });
    }

    const autoplay = createAutoplay(hero, () => show(current + 1), 5000);

    hero.querySelectorAll('[data-slide]').forEach(btn => btn.addEventListener('click', () => {
        show(current + Number(btn.dataset.slide));
        autoplay.restart();
    }));

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            autoplay.setPaused(!autoplay.isPaused());
            pauseBtn.setAttribute('aria-pressed', String(autoplay.isPaused()));
            pauseBtn.setAttribute('aria-label', autoplay.isPaused() ? 'Reanudar rotación automática' : 'Pausar rotación automática');
            pauseBtn.textContent = autoplay.isPaused() ? 'Reanudar' : 'Pausar';
        });
    }
})();

// --- CARRUSEL DE PRODUCTOS (TOP 10 EN #VENTAS) ---
(function () {
    const section = document.getElementById('ventas');
    const track = document.getElementById('product-track');
    const GAP = 24; // Brecha entre tarjetas (gap-6)
    let index = 0;

    function visibleCards() {
        if (window.innerWidth >= 1024) return 4;
        if (window.innerWidth >= 640) return 2;
        return 1;
    }

    function update() {
        const cards = [...track.children];
        const visible = visibleCards();
        const maxIndex = Math.max(cards.length - visible, 0);
        // Da la vuelta en ambos extremos
        if (index > maxIndex) index = 0;
        if (index < 0) index = maxIndex;

        const cardWidth = cards[0].getBoundingClientRect().width;
        track.style.transform = `translateX(-${index * (cardWidth + GAP)}px)`;

        // Las tarjetas fuera de vista no deben recibir foco ni leerse
        cards.forEach((card, i) => {
            const inView = i >= index && i < index + visible;
            card.toggleAttribute('inert', !inView);
            card.setAttribute('aria-hidden', String(!inView));
        });
    }

    const autoplay = createAutoplay(section, () => { index++; update(); }, 4000);

    section.querySelectorAll('[data-product]').forEach(btn => btn.addEventListener('click', () => {
        index += Number(btn.dataset.product);
        update();
        autoplay.restart();
    }));

    let resizeFrame = null;
    window.addEventListener('resize', () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(update);
    });
    update();
})();
