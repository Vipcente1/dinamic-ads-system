/**
 * AD NETWORK SYSTEM - EMBED SCRIPT
 * Sistema ligero de publicidad tipo Embed (similar a YouTube)
 * Características: Transparente, No bloqueante, Soporte Multi-Modo (Directo / Iframe)
 */

(function () {
    // Protección para entornos SSR (Server-Side Rendering) como Next.js
    if (typeof window === 'undefined') return;

    // 1. CONTROL DE DUPLICACIÓN
    // Evitar que el sistema se inicialice más de una vez si el webmaster inserta el script varias veces.
    // Para ads_centro, permitimos múltiples instancias guardando el script actual
    const currentScript = document.currentScript;

    // 2. CONFIGURACIÓN PRINCIPAL
    const CONFIG = {
        // Dominio base donde está alojado el sistema
        baseUrl: 'https://dinamic-662.pages.dev', 

        // MODO A: Inyección directa en el DOM (Mejor para imágenes transparentes sin bordes)
        // MODO B: Aislamiento mediante iframe 'ad.html' (Mejor encapsulamiento tipo YouTube)
        mode: 'B', // Cambiar a 'B' para probar el modo iframe

        // URL absoluta del iframe para el MODO B
        iframeUrl: 'https://dinamic-662.pages.dev/ad.html',

        // ID único para el contenedor global (generamos uno dinámico por si hay varios)
        containerId: 'ad-network-wrapper-centro-' + Math.random().toString(36).substr(2, 9)
    };

    /**
     * 3. FUNCIONES DE SEGURIDAD
     * Sanitiza las URLs (GIFs y Links) provistas por la API (JSON)
     * para mitigar inyecciones de código malicioso XSS.
     */
    function sanitizeUrl(url) {
        if (!url) return '';
        try {
            const parsed = new URL(url, window.location.href);
            // Solo permitir protocolos seguros
            if (['http:', 'https:'].includes(parsed.protocol)) {
                return parsed.href;
            }
        } catch (e) {
            // Falla silenciosa si la URL no es válida
        }
        return '';
    }

    /**
     * 4. LÓGICA DE CIERRE
     * Cierra el anuncio actual y guarda el estado en sessionStorage.
     * @param {string} adId - El ID unico del anuncio.
     * @param {number|null} timerId - ID del timeout de autodestrucción.
     */
    function closeAd(adId, timerId) {
        const container = document.getElementById(CONFIG.containerId);
        if (container) {
            container.remove();
            // Evitar que este anuncio aparezca de nuevo durante esta sesión de navegación
            sessionStorage.setItem('ad_closed_' + adId, 'true');
            if (timerId) clearTimeout(timerId); // Limpiar el timer si el usuario lo cerró antes
        }
    }

    /**
     * 5. INYECCIÓN DE ESTILOS CSS
     * Se inyectan estilos globales necesarios solo para el MODO A y el contenedor.
     * Mantener los estilos livianos y sin interferir en la página padre.
     */
    function injectStyles() {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            #${CONFIG.containerId} {
                position: relative;
                width: 100%;
                max-width: 728px; /* Ancho de banner clásico */
                height: auto;
                margin: 20px auto; /* Centrado con margen */
                display: flex;
                justify-content: center;
                align-items: center;
                align-items: flex-start;
                background: transparent;
                margin: 0;
                padding: 0;
            }
            /* Reactivamos los eventos de mouse solo sobre el contenido visible */
            #${CONFIG.containerId} > * {
                pointer-events: auto; 
            }
            
            /* --- ESTILOS MODO A --- */
            .ad-net-content {
                position: relative;
                display: inline-block;
                width: 100%;
                max-width: 100%;
                padding-top: 15px;
                padding-right: 15px;
            }
            .ad-net-link {
                display: block;
                text-decoration: none;
            }
            .ad-net-img {
                width: 100%;
                height: auto;
                border: none;
                display: block;
                background: transparent;
            }
            .ad-net-close {
                position: absolute;
                top: 1px;
                right: 1px;
                background: rgba(0, 0, 0, 0.4);
                color: white;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                text-align: center;
                line-height: 20px;
                font-size: 14px;
                font-family: Arial, sans-serif;
                cursor: pointer;
                border: 2px solid white;
                text-decoration: none !important;
                font-weight: bold;
                transition: background 0.3s, transform 0.2s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .ad-net-close:hover {
                background: #ff3333;
                transform: scale(1.1);
            }
            
            /* --- ESTILOS MODO B --- */
            .ad-net-iframe {
                border: none;
                width: 100%; 
                height: 90px; /* Altura inicial para un banner ancho horizontal */
                background: transparent;
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 6. RENDERIZADO: MODO A
     * Render directo utilizando elementos del DOM (div + img).
     */
    function renderModeA(adData, container) {
        const content = document.createElement('div');
        content.className = 'ad-net-content';

        const link = document.createElement('a');
        link.href = adData.link;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'ad-net-link';

        const img = document.createElement('img');
        img.src = adData.gif;
        img.className = 'ad-net-img';
        img.alt = 'Advertisement';

        link.appendChild(img);

        const closeBtn = document.createElement('div');
        closeBtn.className = 'ad-net-close';
        closeBtn.innerHTML = '×';
        closeBtn.title = 'Cerrar anuncio';

        // Auto-cierre basado en property "duration"
        let timerId = null;
        if (adData.duration && adData.duration > 0) {
            timerId = setTimeout(() => {
                closeAd(adData.id, null);
            }, adData.duration);
        }

        // Evento de cerrar manual
        closeBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            closeAd(adData.id, timerId);
        };

        content.appendChild(link);
        content.appendChild(closeBtn);
        container.appendChild(content);
    }

    /**
     * 7. RENDERIZADO: MODO B
     * Render mediante iframe de aislamiento (ad.html).
     */
    function renderModeB(adData, container) {
        const iframe = document.createElement('iframe');

        // Inyectamos la información al iframe a través de la URL de forma segura
        const dataStr = encodeURIComponent(JSON.stringify(adData));
        iframe.src = `${CONFIG.iframeUrl}?data=${dataStr}`;

        iframe.className = 'ad-net-iframe';
        iframe.allowTransparency = 'true'; // Necesario en algunos navegadores antiguos para ver fondos transparentes
        iframe.scrolling = 'no';

        // Auto-cierre
        let timerId = null;
        if (adData.duration && adData.duration > 0) {
            timerId = setTimeout(() => {
                closeAd(adData.id, null);
            }, adData.duration);
        }

        // Comunicar con el iframe a través de postMessage (Manejo de estados)
        window.addEventListener('message', function (event) {
            if (!event.data) return;

            // Cerrar provocado desde el botón dentro del iframe
            if (event.data.action === 'closeAd' && event.data.id === adData.id) {
                closeAd(adData.id, timerId);
            }

            // Auto redimensionar el iframe al alto real de la imagen calculada
            if (event.data.action === 'resizeAd' && event.data.height) {
                iframe.style.height = event.data.height + 'px';
            }
        });

        container.appendChild(iframe);
    }

    /**
     * 8. NUCLEO PRINCIPAL DE INICIO
     * Ejecuta el fetch asíncrono y dispara la inyección.
     */
    async function initAdNetwork() {
        try {
            // Detectar idioma del navegador (ej: 'es-ES' -> 'es')
            const userLang = (navigator.language || navigator.userLanguage || 'en').substring(0, 2).toLowerCase();
            // Validar si el idioma está entre nuestras carpetas (ingles por defecto)
            const adLang = ['es', 'en'].includes(userLang) ? userLang : 'en';

            // Construir ruta absoluta hacia la carpeta del idioma (ej: 'http://localhost:8080/es/ad_centro.json')
            const dynamicApiUrl = `${CONFIG.baseUrl}/${adLang}/ad_centro.json`;

            // Solicitar anuncios a la API (que ahora es una lista/array)
            const response = await fetch(dynamicApiUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            let adsList = await response.json();

            // Validar que sea un array y contenga anuncios. Si es un objeto (formato antiguo), lo convertimos a array.
            if (!Array.isArray(adsList)) {
                if (adsList && adsList.id) {
                    adsList = [adsList];
                } else {
                    return;
                }
            }
            if (adsList.length === 0) return;

            // Filtrar los anuncios que ya fueron cerrados en esta sesión
            const availableAds = adsList.filter(ad => {
                return sessionStorage.getItem('ad_closed_' + ad.id) !== 'true';
            });

            // Si no quedan anuncios disponibles, detener ejecución
            if (availableAds.length === 0) return;

            // Escoger un anuncio al azar
            const randomIndex = Math.floor(Math.random() * availableAds.length);
            const adData = availableAds[randomIndex];

            // Validar esquema básico del anuncio elegido
            if (!adData || !adData.id || !adData.gif || !adData.link) return;

            // Sanitizar inputs
            adData.gif = sanitizeUrl(adData.gif);
            adData.link = sanitizeUrl(adData.link);

            // En caso que sanitización falle la URL es maliciosa y se aborta
            if (!adData.gif || !adData.link) return;

            // Inyectar CSS global
            injectStyles();

            // Insertar div contenedor justo después del script que lo llamó
            const container = document.createElement('div');
            container.id = CONFIG.containerId;
            if (currentScript && currentScript.parentNode) {
                currentScript.parentNode.insertBefore(container, currentScript.nextSibling);
            } else {
                document.body.appendChild(container); // Fallback
            }

            // Bifurcación funcional dependiendo del modo elegido
            if (CONFIG.mode === 'A') {
                renderModeA(adData, container);
            } else if (CONFIG.mode === 'B') {
                renderModeB(adData, container);
            } else {
                console.warn('Ad Network: MODO no valido especificado.');
            }

        } catch (error) {
            // Falla de manera silenciosa para no ensuciar la consola de la pagina publicadora
            // Ni quebrar funcionalidades del sitio.
            // console.error('Ad Network API Error:', error.message);
        }
    }

    /**
     * 9. EVENTOS DE CARGA MÚLTIPLE
     * Ejecutará el código después de que el DOM esté interactivo, o inmediatamente
     * si el script se ha inyectado con retraso (deferred load).
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdNetwork);
    } else {
        initAdNetwork();
    }

})();
