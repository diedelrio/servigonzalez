// Configuración del sitio. Cambia aquí las URLs al pasar a producción.
window.SERVIGONZALEZ_CONFIG = {
    urls: {
        app: 'http://localhost:5173/',
        solicitarReparacion: 'http://localhost:5173/solicitar',
        consultarReparacion: 'http://localhost:5173/consulta'
    }
};

// Asigna las URLs a todo elemento con data-config-url="<clave>"
// (los iframes se cargan al abrir el modal, ver index.html)
document.addEventListener('DOMContentLoaded', () => {
    const urls = window.SERVIGONZALEZ_CONFIG.urls;
    document.querySelectorAll('[data-config-url]').forEach(el => {
        const url = urls[el.dataset.configUrl];
        if (url) el.setAttribute('href', url);
    });
});
