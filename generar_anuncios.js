const fs = require('fs');
const path = require('path');

// URL base de producción - los GIFs necesitan URLs absolutas para funcionar en sitios externos
const BASE_URL = 'https://dinamic-ads-system.pages.dev';

// Idiomas soportados actualmente (carpetas base)
const LANGUAGES = ['es', 'en'];
const CATEGORIES = ['lateral', 'centro'];

function generateIndex() {
    console.log('Iniciando generador de índices de anuncios...\n');

    LANGUAGES.forEach(lang => {
        const langPath = path.join(__dirname, lang);
        
        if (!fs.existsSync(langPath)) {
            console.log(`[SKIP] La carpeta de idioma '${lang}' no existe.`);
            return;
        }

        CATEGORIES.forEach(cat => {
            const catPath = path.join(langPath, cat);
            const adsList = [];

            if (fs.existsSync(catPath)) {
                const items = fs.readdirSync(catPath);

                items.forEach(item => {
                    const adFolderPath = path.join(catPath, item);
                    
                    if (fs.statSync(adFolderPath).isDirectory()) {
                        const adId = `ad_${lang}_${cat}_${item}`;
                        let gifUrl = '';
                        let linkUrl = 'https://www.google.com'; // Default fallback

                        const adFiles = fs.readdirSync(adFolderPath);
                        const gifFile = adFiles.find(file => file.toLowerCase().endsWith('.gif'));
                        
                        if (gifFile) {
                            gifUrl = `${BASE_URL}/${lang}/${cat}/${item}/${gifFile}`;
                        }

                        const linkPath = path.join(adFolderPath, 'link.txt');
                        if (fs.existsSync(linkPath)) {
                            linkUrl = fs.readFileSync(linkPath, 'utf8').trim();
                        } else {
                            fs.writeFileSync(linkPath, linkUrl, 'utf8');
                        }

                        if (gifUrl) {
                            adsList.push({
                                id: adId,
                                gif: gifUrl,
                                link: linkUrl,
                                duration: 0
                            });
                        }
                    }
                });
            }

            // Guardar el array generado en el ad_CATEGORIA.json
            const indexPath = path.join(langPath, `ad_${cat}.json`);
            fs.writeFileSync(indexPath, JSON.stringify(adsList, null, 4), 'utf8');
            console.log(`[OK] Generado el índice para '${lang}/${cat}' con ${adsList.length} anuncios.`);
        });
    });

    console.log('\n¡Proceso de generación completado con éxito!');
}

generateIndex();
