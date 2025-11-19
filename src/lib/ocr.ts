import Tesseract from 'tesseract.js';

// Preprocess image to improve OCR accuracy
// 1. Grayscale
// 2. Binarization (Thresholding)
// 3. Noise reduction (optional)
// Preprocess image to improve OCR accuracy
// 1. Grayscale
// 2. Binarization (Thresholding)
// 3. Noise reduction (optional)
// Preprocess image to improve OCR accuracy
// 1. Grayscale
// 2. Binarization (Thresholding) - Simplified to rely more on Tesseract's internal handling
export const preprocessImage = (imageFile: File): Promise<string> => {

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Simple Grayscale
            // Tesseract handles binarization well internally (Otsu's method).
            // We just help it by removing color noise.
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // Luminance
                const v = 0.2126 * r + 0.7152 * g + 0.0722 * b;

                data[i] = v;
                data[i + 1] = v;
                data[i + 2] = v;
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL());
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(imageFile);
    });
};

export const processSudokuImage = async (imageFile: File): Promise<(number | null)[]> => {
    const processedImageUrl = await preprocessImage(imageFile);

    const img = new Image();
    img.src = processedImageUrl;
    await new Promise(r => { img.onload = r; });

    const cellWidth = img.width / 9;
    const cellHeight = img.height / 9;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Canvas context missing");

    const grid: (number | null)[] = [];

    const worker = await Tesseract.createWorker('eng');
    await worker.setParameters({
        tessedit_char_whitelist: '123456789',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_CHAR,
    });

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            // Upscale for better recognition
            const scale = 2;
            canvas.width = cellWidth * scale;
            canvas.height = cellHeight * scale;

            // Reduced padding to ensure we don't cut off parts of the digit
            // Grid lines might appear but Tesseract can often ignore them if they are at the edge
            const paddingX = cellWidth * 0.1;
            const paddingY = cellHeight * 0.1;

            // Fill white background first
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw scaled up
            ctx.drawImage(
                img,
                col * cellWidth + paddingX,
                row * cellHeight + paddingY,
                cellWidth - 2 * paddingX,
                cellHeight - 2 * paddingY,
                0,
                0,
                canvas.width,
                canvas.height
            );

            const cellDataUrl = canvas.toDataURL();
            const { data: { text, confidence } } = await worker.recognize(cellDataUrl);

            const num = parseInt(text.trim());
            // Confidence check
            if (!isNaN(num) && num >= 1 && num <= 9 && confidence > 50) {
                grid.push(num);
            } else {
                grid.push(null);
            }
        }
    }

    await worker.terminate();
    return grid;
};
