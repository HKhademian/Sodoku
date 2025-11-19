export interface Point {
    x: number;
    y: number;
}

export const getPerspectiveCroppedImg = (
    imageSrc: string,
    points: Point[],
    outputWidth: number = 600,
    outputHeight: number = 600
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('No 2d context'));
                return;
            }

            canvas.width = outputWidth;
            canvas.height = outputHeight;

            // Source points
            const srcPoints = points.map(p => p.x);
            const srcPointsY = points.map(p => p.y);

            // Destination points (square)
            // Top-left, Top-right, Bottom-right, Bottom-left
            const dstPoints = [0, outputWidth, outputWidth, 0];
            const dstPointsY = [0, 0, outputHeight, outputHeight];

            // Calculate Homography Matrix
            // We need to map (srcX, srcY) -> (dstX, dstY)
            // This is a simplified approach using a library-free implementation
            // For a robust solution, we might need a small matrix library, but we can implement a basic solver here.

            // However, standard 2D canvas does NOT support perspective transforms (homography) natively via setTransform.
            // It only supports affine transforms (scale, rotate, translate, skew).
            // To do a true perspective warp in Canvas 2D, we have to draw the image slice by slice (scanline) or use WebGL.
            // Given the complexity, a scanline approach is feasible for small images, or we can use a library like 'perspectiv.js' or similar if available.
            // But since we can't easily add libraries without user permission, I will implement a simple scanline renderer.

            // Actually, for Sudoku, a simple affine approximation might be "okay" if the angle isn't too extreme, 
            // but the user specifically asked for "4 points", implying perspective.

            // Let's try a pixel-by-pixel mapping (inverse mapping) which is slow but accurate, 
            // or a triangulation method (splitting quad into 2 triangles and affine mapping them).
            // Triangulation is faster and standard for 2D canvas.

            try {
                // Draw using triangulation (2 triangles)
                // This is an approximation but often sufficient for mild perspective.
                // However, for true rectification, we really want the inverse homography.

                // Let's implement a basic inverse homography pixel mapper. It might be slow for 600x600 (360k pixels),
                // but modern JS engines are fast.

                const imageData = ctx.createImageData(outputWidth, outputHeight);
                const data = imageData.data;

                // Compute H matrix mapping Dest -> Source (Inverse Homography)
                // We want for every pixel (u,v) in Dest, find (x,y) in Source and sample it.
                const H = getHomographyMatrix(
                    0, 0, outputWidth, 0, outputWidth, outputHeight, 0, outputHeight, // Dest (Square)
                    points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y // Source (Quad)
                );

                // Draw source image to a temp canvas to get pixel data
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = image.width;
                tempCanvas.height = image.height;
                const tempCtx = tempCanvas.getContext('2d');
                if (!tempCtx) throw new Error("No temp context");
                tempCtx.drawImage(image, 0, 0);
                const srcData = tempCtx.getImageData(0, 0, image.width, image.height).data;
                const srcWidth = image.width;
                const srcHeight = image.height;

                for (let y = 0; y < outputHeight; y++) {
                    for (let x = 0; x < outputWidth; x++) {
                        // Apply H to (x,y)
                        const val = applyMatrix(H, x, y);
                        const srcX = val.x;
                        const srcY = val.y;

                        // Bilinear interpolation or Nearest Neighbor
                        // Nearest Neighbor for speed
                        const sx = Math.round(srcX);
                        const sy = Math.round(srcY);

                        if (sx >= 0 && sx < srcWidth && sy >= 0 && sy < srcHeight) {
                            const dstIdx = (y * outputWidth + x) * 4;
                            const srcIdx = (sy * srcWidth + sx) * 4;
                            data[dstIdx] = srcData[srcIdx];
                            data[dstIdx + 1] = srcData[srcIdx + 1];
                            data[dstIdx + 2] = srcData[srcIdx + 2];
                            data[dstIdx + 3] = 255; // Alpha
                        }
                    }
                }

                ctx.putImageData(imageData, 0, 0);

                canvas.toBlob((blob) => {
                    if (!blob) reject(new Error('Canvas is empty'));
                    else resolve(blob);
                }, 'image/jpeg');

            } catch (e) {
                reject(e);
            }
        };
        image.onerror = reject;
    });
};

// Gaussian elimination to solve linear system
function solve(A: number[][], b: number[]): number[] {
    const n = A.length;
    for (let i = 0; i < n; i++) {
        let maxEl = Math.abs(A[i][i]);
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(A[k][i]) > maxEl) {
                maxEl = Math.abs(A[k][i]);
                maxRow = k;
            }
        }

        for (let k = i; k < n; k++) {
            const tmp = A[maxRow][k];
            A[maxRow][k] = A[i][k];
            A[i][k] = tmp;
        }
        const tmp = b[maxRow];
        b[maxRow] = b[i];
        b[i] = tmp;

        for (let k = i + 1; k < n; k++) {
            const c = -A[k][i] / A[i][i];
            for (let j = i; j < n; j++) {
                if (i === j) {
                    A[k][j] = 0;
                } else {
                    A[k][j] += c * A[i][j];
                }
            }
            b[k] += c * b[i];
        }
    }

    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let k = i + 1; k < n; k++) {
            sum += A[i][k] * x[k];
        }
        x[i] = (b[i] - sum) / A[i][i];
    }
    return x;
}

function getHomographyMatrix(
    x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number,
    u0: number, v0: number, u1: number, v1: number, u2: number, v2: number, u3: number, v3: number
) {
    // Mapping (x,y) -> (u,v)
    // We want to map Dest -> Source, so (x,y) are Dest coords, (u,v) are Source coords

    const A: number[][] = [];
    const b: number[] = [];

    const addPoint = (x: number, y: number, u: number, v: number) => {
        A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]);
        b.push(u);
        A.push([0, 0, 0, x, y, 1, -x * v, -y * v]);
        b.push(v);
    };

    addPoint(x0, y0, u0, v0);
    addPoint(x1, y1, u1, v1);
    addPoint(x2, y2, u2, v2);
    addPoint(x3, y3, u3, v3);

    const h = solve(A, b);
    return [...h, 1];
}

function applyMatrix(H: number[], x: number, y: number) {
    const w = H[6] * x + H[7] * y + H[8];
    return {
        x: (H[0] * x + H[1] * y + H[2]) / w,
        y: (H[3] * x + H[4] * y + H[5]) / w
    };
}
