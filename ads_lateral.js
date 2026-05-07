/**
 * AD NETWORK SYSTEM - EMBED SCRIPT
 * Sistema ligero de publicidad tipo Embed
 * Mejorado: soporte duration infinito, arrays, preload GIF y estabilidad
 */

(function () {

    if (typeof window === 'undefined') return;

    if (window.__AdNetworkInitialized) return;
    window.__AdNetworkInitialized = true;

    const CONFIG = {
        baseUrl: 'https://dinamic-ads-system.pages.dev',
        mode: 'B',
        iframeUrl: 'https://dinamic-ads-system.pages.dev/ad.html',
        containerId: 'ad-network-wrapper-lateral'
    };

    function sanitizeUrl(url) {
        if (!url) return '';

        try {
            const parsed = new URL(url, window.location.href);

            if (['http:', 'https:'].includes(parsed.protocol)) {
                return parsed.href;
            }

        } catch (e) {}

        return '';
    }

    function closeAd(adId, timerId) {

        const container = document.getElementById(CONFIG.containerId);

        if (container) {

            container.remove();

            sessionStorage.setItem(
                'ad_closed_' + adId,
                'true'
            );

            if (timerId) {
                clearTimeout(timerId);
            }
        }
    }

    function injectStyles() {

        if (document.getElementById('ad-network-styles')) return;

        const style = document.createElement('style');

        style.id = 'ad-network-styles';

        style.innerHTML = `
            #${CONFIG.containerId} {
                position: fixed;
                top: 50%;
                transform: translateY(-50%);
                left: 20px;
                width: 160px;
                height: auto;
                z-index: 2147483647;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                background: transparent;
                margin: 0;
                padding: 0;
            }

            #${CONFIG.containerId} > * {
                pointer-events: auto;
            }

            .ad-net-content {
                position: relative;
                display: inline-block;
                width: 100%;
                max-width: 160px;
                padding-top: 10px;
                padding-right: 10px;
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
                background: rgba(0,0,0,0.4);
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
                font-weight: bold;
                transition: background 0.3s, transform 0.2s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }

            .ad-net-close:hover {
                background: #ff3333;
                transform: scale(1.1);
            }

            .ad-net-iframe {
                border: none;
                width: 100%;
                min-height: 300px;
                background: transparent;
                overflow: hidden;
            }
        `;

        document.head.appendChild(style);
    }

    function renderModeA(adData, container) {

        const preloadImg = new Image();
        preloadImg.src = adData.gif;

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

        let timerId = null;

        // duration 0 = infinito
        if (
            typeof adData.duration === 'number' &&
            adData.duration > 0
        ) {

            timerId = setTimeout(() => {
                closeAd(adData.id, null);
            }, adData.duration);
        }

        closeBtn.onclick = function (e) {

            e.preventDefault();
            e.stopPropagation();

            closeAd(adData.id, timerId);
        };

        content.appendChild(link);
        content.appendChild(closeBtn);

        container.appendChild(content);
    }

    function renderModeB(adData, container) {

        const iframe = document.createElement('iframe');

        const dataStr = encodeURIComponent(
            JSON.stringify(adData)
        );

        iframe.src =
            `${CONFIG.iframeUrl}?data=${dataStr}`;

        iframe.className = 'ad-net-iframe';

        iframe.allowTransparency = 'true';

        iframe.scrolling = 'no';

        let timerId = null;

        // duration 0 = infinito
        if (
            typeof adData.duration === 'number' &&
            adData.duration > 0
        ) {

            timerId = setTimeout(() => {
                closeAd(adData.id, null);
            }, adData.duration);
        }

        window.addEventListener('message', function (event) {

            if (!event.data) return;

            if (
                event.data.action === 'closeAd' &&
                event.data.id === adData.id
            ) {

                closeAd(adData.id, timerId);
            }

            if (
                event.data.action === 'resizeAd' &&
                event.data.height
            ) {

                iframe.style.height =
                    event.data.height + 'px';
            }

        });

        container.appendChild(iframe);
    }

    async function initAdNetwork() {

        try {

            const userLang =
                (
                    navigator.language ||
                    navigator.userLanguage ||
                    'en'
                )
                .substring(0, 2)
                .toLowerCase();

            const adLang =
                ['es', 'en'].includes(userLang)
                    ? userLang
                    : 'en';

            const dynamicApiUrl =
                `${CONFIG.baseUrl}/${adLang}/ad_lateral.json`;

            const response = await fetch(dynamicApiUrl);

            if (!response.ok) {
                throw new Error('Network error');
            }

            let adsList = await response.json();

            // Compatibilidad objeto antiguo
            if (!Array.isArray(adsList)) {

                if (adsList && adsList.id) {
                    adsList = [adsList];
                } else {
                    return;
                }
            }

            if (adsList.length === 0) return;

            const availableAds =
                adsList.filter(ad => {

                    return (
                        sessionStorage.getItem(
                            'ad_closed_' + ad.id
                        ) !== 'true'
                    );

                });

            if (availableAds.length === 0) return;

            const randomIndex =
                Math.floor(
                    Math.random() *
                    availableAds.length
                );

            const adData =
                availableAds[randomIndex];

            if (
                !adData ||
                !adData.id ||
                !adData.gif ||
                !adData.link
            ) {
                return;
            }

            adData.gif =
                sanitizeUrl(adData.gif);

            adData.link =
                sanitizeUrl(adData.link);

            if (
                !adData.gif ||
                !adData.link
            ) {
                return;
            }

            injectStyles();

            const container =
                document.createElement('div');

            container.id =
                CONFIG.containerId;

            if (!document.body) {

                document.addEventListener(
                    'DOMContentLoaded',
                    () => {
                        document.body.appendChild(container);
                    }
                );

            } else {

                document.body.appendChild(container);

            }

            if (CONFIG.mode === 'A') {

                renderModeA(
                    adData,
                    container
                );

            } else if (CONFIG.mode === 'B') {

                renderModeB(
                    adData,
                    container
                );

            }

        } catch (error) {

            // fallo silencioso

        }
    }

    if (document.readyState === 'loading') {

        document.addEventListener(
            'DOMContentLoaded',
            initAdNetwork
        );

    } else {

        initAdNetwork();

    }

})();
