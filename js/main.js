// --- PREFERENCIAS DE MOVIMIENTO ---
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    // Mantiene el foco dentro del modal: del botón de cierre salta al iframe y viceversa
    modal.addEventListener('keydown', e => {
        if (e.key !== 'Tab' || !isOpen()) return;
        const focusables = [closeBtn, frame];
        const idx = focusables.indexOf(document.activeElement);
        if (e.shiftKey && idx <= 0) { e.preventDefault(); frame.focus(); }
        else if (!e.shiftKey && idx === focusables.length - 1) { e.preventDefault(); closeBtn.focus(); }
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

// --- LÓGICA DEL POPUP DE BIENVENIDA ---
window.addEventListener('DOMContentLoaded', () => {
    const popup = document.getElementById('popup-bienvenida');
    const card = popup.querySelector('.transform');
    setTimeout(() => {
        popup.classList.remove('opacity-0', 'pointer-events-none');
        popup.classList.add('opacity-100');
        card.classList.remove('scale-95');
        card.classList.add('scale-100');
    }, 1500);
});

function cerrarPopup() {
    const popup = document.getElementById('popup-bienvenida');
    const card = popup.querySelector('.transform');
    card.classList.remove('scale-100');
    card.classList.add('scale-95');
    popup.classList.remove('opacity-100');
    popup.classList.add('opacity-0', 'pointer-events-none');
}

// --- LÓGICA DEL SLIDER PRINCIPAL (HERO) ---
let currentSlide = 1;
const totalSlides = 2;
let slideInterval;

function showSlide(slideIndex) {
    const s1 = document.getElementById('slide-1');
    const s2 = document.getElementById('slide-2');
    if (slideIndex === 1) {
        s1.classList.replace('opacity-0', 'opacity-100');
        s1.classList.replace('pointer-events-none', 'pointer-events-auto');
        s2.classList.replace('opacity-100', 'opacity-0');
        s2.classList.replace('pointer-events-auto', 'pointer-events-none');
        currentSlide = 1;
    } else {
        s2.classList.replace('opacity-0', 'opacity-100');
        s2.classList.replace('pointer-events-none', 'pointer-events-auto');
        s1.classList.replace('opacity-100', 'opacity-0');
        s1.classList.replace('pointer-events-auto', 'pointer-events-none');
        currentSlide = 2;
    }
}

function changeSlide(direction) {
    clearInterval(slideInterval);
    let nextSlide = currentSlide + direction;
    if (nextSlide > totalSlides) nextSlide = 1;
    if (nextSlide < 1) nextSlide = totalSlides;
    showSlide(nextSlide);
    startAutoSlide();
}

function startAutoSlide() {
    clearInterval(slideInterval);
    if (reduceMotion) return;
    slideInterval = setInterval(() => {
        let nextSlide = currentSlide + 1;
        if (nextSlide > totalSlides) nextSlide = 1;
        showSlide(nextSlide);
    }, 5000);
}
startAutoSlide();

const heroSection = document.getElementById('inicio');
heroSection.addEventListener('mouseenter', () => clearInterval(slideInterval));
heroSection.addEventListener('mouseleave', startAutoSlide);
heroSection.addEventListener('focusin', () => clearInterval(slideInterval));
heroSection.addEventListener('focusout', startAutoSlide);

// --- LÓGICA DEL CARRUSEL DE PRODUCTOS (TOP 10 EN #VENTAS) ---
let productIndex = 0;
let productInterval;

function getVisibleCards() {
    if (window.innerWidth >= 1024) return 4;
    if (window.innerWidth >= 640) return 2;
    return 1;
}

function updateProductSlider() {
    const track = document.getElementById('product-track');
    if (!track) return;
    const cardsVisible = getVisibleCards();
    const totalProducts = track.children.length;
    const gap = 24; // Brecha de la rejilla (24px)

    const maxIndex = totalProducts - cardsVisible;
    if (productIndex > maxIndex) productIndex = 0;
    if (productIndex < 0) productIndex = maxIndex;

    const cardWidth = track.firstElementChild.getBoundingClientRect().width;
    const amountToMove = productIndex * (cardWidth + gap);

    track.style.transform = `translateX(-${amountToMove}px)`;
}

function nextProduct() {
    clearInterval(productInterval);
    productIndex++;
    updateProductSlider();
    startProductAutoSlide();
}

function prevProduct() {
    clearInterval(productInterval);
    productIndex--;
    updateProductSlider();
    startProductAutoSlide();
}

function startProductAutoSlide() {
    clearInterval(productInterval);
    if (reduceMotion) return;
    productInterval = setInterval(() => {
        productIndex++;
        updateProductSlider();
    }, 4000);
}

startProductAutoSlide();
window.addEventListener('resize', updateProductSlider);

const salesSection = document.getElementById('ventas');
salesSection.addEventListener('mouseenter', () => clearInterval(productInterval));
salesSection.addEventListener('mouseleave', startProductAutoSlide);
salesSection.addEventListener('focusin', () => clearInterval(productInterval));
salesSection.addEventListener('focusout', startProductAutoSlide);
