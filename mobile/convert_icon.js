const sharp = require('sharp');
const fs = require('fs');

async function convert() {
    try {
        const svgBuffer = fs.readFileSync('assets/logomark.svg');

        // Create icon.png (1024x1024)
        await sharp(svgBuffer)
            .resize(1024, 1024)
            .png()
            .toFile('assets/icon.png');

        // Create adaptive-icon.png (1024x1024) - usually requires some padding but we'll use the same for now or resize accordingly
        await sharp(svgBuffer)
            .resize(1024, 1024)
            .png()
            .toFile('assets/adaptive-icon.png');

        console.log('Successfully converted SVG to PNGs');
    } catch (error) {
        console.error('Error converting SVG:', error);
    }
}

convert();
