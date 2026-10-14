// Consentimiento de cookies. Valores guardados: 'all' | 'necessary'
// Lo que requiere consentimiento (p. ej. el mapa de Google) se carga solo con 'all'.
(function () {
    const KEY = 'sg_cookie_consent';

    function getConsent() {
        try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }

    function setConsent(value) {
        try { localStorage.setItem(KEY, value); } catch (e) { /* sin almacenamiento */ }
        hideBanner();
        applyConsent();
    }

    function hideBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.classList.add('hidden');
        document.dispatchEvent(new CustomEvent('sg:consent-resolved'));
    }

    function showBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.classList.remove('hidden');
    }

    // Carga los contenidos de terceros (data-consent-src) si hay consentimiento
    function applyConsent() {
        const allowed = getConsent() === 'all';
        document.querySelectorAll('[data-consent-src]').forEach(el => {
            const placeholder = document.getElementById(el.dataset.consentPlaceholder);
            if (allowed) {
                if (!el.getAttribute('src')) el.setAttribute('src', el.dataset.consentSrc);
                el.classList.remove('hidden');
                if (placeholder) placeholder.classList.add('hidden');
            } else {
                el.removeAttribute('src');
                el.classList.add('hidden');
                if (placeholder) placeholder.classList.remove('hidden');
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const accept = document.getElementById('cookie-accept');
        const reject = document.getElementById('cookie-reject');
        if (accept) accept.addEventListener('click', () => setConsent('all'));
        if (reject) reject.addEventListener('click', () => setConsent('necessary'));

        document.querySelectorAll('[data-cookie-settings]').forEach(el =>
            el.addEventListener('click', e => { e.preventDefault(); showBanner(); }));
        document.querySelectorAll('[data-cookie-accept]').forEach(el =>
            el.addEventListener('click', () => setConsent('all')));

        if (getConsent()) hideBanner(); else showBanner();
        applyConsent();
    });
})();
