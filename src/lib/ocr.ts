import Tesseract from 'tesseract.js';

// Preprocess image to improve OCR accuracy
// 1. Grayscale
// 2. Binarization (Thresholding)
// 3. Noise reduction (optional)
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

            // Grayscale and Threshold
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // Luminance
                const v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                // Threshold (simple)
                const threshold = v > 128 ? 255 : 0;

                data[i] = threshold;
                data[i + 1] = threshold;
                data[i + 2] = threshold;
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL());
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(imageFile);
    });
};

// Recognize numbers from a preprocessed image
// This is a simplified version. Ideally, we should slice the grid into 81 cells and OCR each.
// For now, we'll try to recognize the whole grid or assume the user uploads a clear grid.
// A robust solution requires OpenCV (server-side or wasm) to detect grid lines and warp perspective.
// Given constraints, we will try to recognize the text and map it, but warn the user.
// Actually, Tesseract has a "sparse text" mode (PSM 11 or 12) which might work for grids.
// But without grid slicing, mapping numbers to positions is very hard.
// Strategy:
// 1. We will assume the user uploads a cropped image of the Sudoku grid.
// 2. We will use a library or logic to slice the image into 9x9.
//    - Since we don't have OpenCV easily available in client JS without heavy wasm, 
//      we can try a naive slice: just divide width/9 and height/9.
export const processSudokuImage = async (imageFile: File): Promise<(number | null)[]> => {
    const processedImageUrl = await preprocessImage(imageFile);

    // Naive slicing strategy
    const img = new Image();
    img.src = processedImageUrl;
    await new Promise(r => { img.onload = r; });

    const cellWidth = img.width / 9;
    const cellHeight = img.height / 9;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Canvas context missing");

    const grid: (number | null)[] = [];

    // We need to run OCR on 81 cells. This might be slow.
    // Optimization: Create one large image with all cells in a line? Or just run parallel?
    // Tesseract worker can be reused.

    const worker = await Tesseract.createWorker('eng');
    await worker.setParameters({
        tessedit_char_whitelist: '123456789',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_CHAR,
    });

    // Create a composite image of all cells to reduce Tesseract calls?
    // Or just loop. 81 calls is a lot.
    // Let's try to recognize the whole image with PSM 6 (Assume a single uniform block of text).
    // But Sudoku grid lines confuse Tesseract.
    // Let's try the naive slicing and OCR each cell. It will be slow but more accurate without OpenCV.

    // To speed up, we can maybe batch them?
    // Let's try to do it for a few cells first or just warn the user it takes time.

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            canvas.width = cellWidth;
            canvas.height = cellHeight;

            // Crop with some padding to avoid grid lines
            const paddingX = cellWidth * 0.1;
            const paddingY = cellHeight * 0.1;

            ctx.drawImage(
                img,
                col * cellWidth + paddingX,
                row * cellHeight + paddingY,
                cellWidth - 2 * paddingX,
                cellHeight - 2 * paddingY,
                0,
                0,
                cellWidth,
                cellHeight
            );

            const cellDataUrl = canvas.toDataURL();
            const { data: { text, confidence } } = await worker.recognize(cellDataUrl);

            const num = parseInt(text.trim());
            if (!isNaN(num) && num >= 1 && num <= 9 && confidence > 60) {
                grid.push(num);
            } else {
                grid.push(null);
            }
        }
    }

    await worker.terminate();
    return grid;
};
