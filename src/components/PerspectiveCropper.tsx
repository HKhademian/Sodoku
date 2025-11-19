import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Point } from '@/lib/perspective';

interface PerspectiveCropperProps {
    imageSrc: string;
    onPointsChange: (points: Point[]) => void;
}

export function PerspectiveCropper({ imageSrc, onPointsChange }: PerspectiveCropperProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [points, setPoints] = useState<Point[]>([
        { x: 0, y: 0 }, // TL
        { x: 100, y: 0 }, // TR
        { x: 100, y: 100 }, // BR
        { x: 0, y: 100 }  // BL
    ]);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);

    // Initialize points when image loads
    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setImgDimensions({ width: naturalWidth, height: naturalHeight });

        // Default to 10% inset
        const w = naturalWidth;
        const h = naturalHeight;
        const insetX = w * 0.1;
        const insetY = h * 0.1;

        const initialPoints = [
            { x: insetX, y: insetY },
            { x: w - insetX, y: insetY },
            { x: w - insetX, y: h - insetY },
            { x: insetX, y: h - insetY }
        ];
        setPoints(initialPoints);
        onPointsChange(initialPoints);
    };

    const getScale = () => {
        if (!imageRef.current || !imgDimensions) return 1;
        const rect = imageRef.current.getBoundingClientRect();
        return imgDimensions.width / rect.width;
    };

    const handleMouseDown = (index: number) => (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setDraggingIndex(index);
    };

    const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (draggingIndex === null || !imageRef.current || !imgDimensions) return;

        const rect = imageRef.current.getBoundingClientRect();
        const scale = getScale();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        const x = (clientX - rect.left) * scale;
        const y = (clientY - rect.top) * scale;

        // Clamp to image bounds
        const clampedX = Math.max(0, Math.min(imgDimensions.width, x));
        const clampedY = Math.max(0, Math.min(imgDimensions.height, y));

        setPoints(prev => {
            const newPoints = [...prev];
            newPoints[draggingIndex] = { x: clampedX, y: clampedY };
            onPointsChange(newPoints);
            return newPoints;
        });
    }, [draggingIndex, imgDimensions, onPointsChange]);

    const handleMouseUp = useCallback(() => {
        setDraggingIndex(null);
    }, []);

    useEffect(() => {
        if (draggingIndex !== null) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleMouseMove, { passive: false });
            window.addEventListener('touchend', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [draggingIndex, handleMouseMove, handleMouseUp]);

    if (!imageSrc) return null;

    return (
        <div className="relative w-full h-full flex items-center justify-center bg-black/90 overflow-hidden select-none touch-none" ref={containerRef}>
            <div className="relative max-w-full max-h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Crop target"
                    className="max-w-full max-h-[70vh] object-contain pointer-events-none select-none"
                    onLoad={onImageLoad}
                />

                {imgDimensions && (
                    <svg
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                        viewBox={`0 0 ${imgDimensions.width} ${imgDimensions.height}`}
                    >
                        {/* Semi-transparent overlay outside polygon */}
                        {/* It's hard to do an inverse clip path easily in SVG without a mask. 
                For now, just draw the polygon outline. */}

                        <polygon
                            points={points.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="rgba(255, 255, 255, 0.2)"
                            stroke="#3b82f6"
                            strokeWidth={Math.max(2, imgDimensions.width * 0.005)}
                        />

                        {points.map((p, i) => (
                            <circle
                                key={i}
                                cx={p.x}
                                cy={p.y}
                                r={Math.max(10, imgDimensions.width * 0.015)}
                                fill="white"
                                stroke="#3b82f6"
                                strokeWidth={Math.max(2, imgDimensions.width * 0.005)}
                                className="cursor-move pointer-events-auto"
                                onMouseDown={handleMouseDown(i)}
                                onTouchStart={handleMouseDown(i)}
                            />
                        ))}
                    </svg>
                )}
            </div>
        </div>
    );
}
