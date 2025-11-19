import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, Upload, Loader2, Check, RotateCcw } from "lucide-react";
import { processSudokuImage } from "@/lib/ocr";
import { getPerspectiveCroppedImg } from "@/lib/perspective";
import { PerspectiveCropper } from "@/components/PerspectiveCropper";
import { toast } from "sonner";

interface ImageImportProps {
    onImport: (grid: (number | null)[]) => void;
}

export function ImageImport({ onImport }: ImageImportProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mode, setMode] = useState<'menu' | 'camera' | 'crop' | 'preview'>('menu');
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [previewSrc, setPreviewSrc] = useState<string | null>(null);
    const [points, setPoints] = useState<any[]>([]);

    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result as string);
                setMode('crop');
            });
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setImageSrc(imageSrc);
            setMode('crop');
        }
    }, [webcamRef]);

    const handlePreview = async () => {
        if (!imageSrc || points.length !== 4) return;

        try {
            const croppedBlob = await getPerspectiveCroppedImg(imageSrc, points);
            const url = URL.createObjectURL(croppedBlob);
            setPreviewSrc(url);
            setMode('preview');
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate preview.");
        }
    };

    const handleImport = async () => {
        if (!previewSrc) return;

        setIsProcessing(true);
        try {
            // Convert blob URL back to blob/file
            const response = await fetch(previewSrc);
            const blob = await response.blob();
            const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });

            toast.info("Processing Sudoku grid...");
            const grid = await processSudokuImage(file);
            onImport(grid);
            setIsOpen(false);
            resetState();
            toast.success("Sudoku imported successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to process image. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const resetState = () => {
        setMode('menu');
        setImageSrc(null);
        setPreviewSrc(null);
        setPoints([]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetState();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-12 gap-2">
                    <Camera className="w-4 h-4" />
                    Import Puzzle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import Sudoku</DialogTitle>
                </DialogHeader>

                <div className="flex-1 relative min-h-0 flex flex-col">
                    {isProcessing ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p>Analyzing image...</p>
                        </div>
                    ) : mode === 'menu' ? (
                        <div className="grid grid-cols-2 gap-4 py-4 h-full content-center">
                            <Button variant="outline" className="h-32 flex-col gap-4" onClick={() => setMode('camera')}>
                                <Camera className="w-12 h-12" />
                                Take Photo
                            </Button>
                            <Button variant="outline" className="h-32 flex-col gap-4" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="w-12 h-12" />
                                Upload File
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    ) : mode === 'camera' ? (
                        <div className="flex flex-col h-full gap-4">
                            <div className="relative flex-1 rounded-lg overflow-hidden bg-black">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{ facingMode: "environment" }}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button variant="outline" className="flex-1" onClick={() => setMode('menu')}>Back</Button>
                                <Button className="flex-1" onClick={capture}>Capture</Button>
                            </div>
                        </div>
                    ) : mode === 'crop' && imageSrc ? (
                        <div className="flex flex-col h-full gap-4">
                            <div className="relative flex-1 rounded-lg overflow-hidden bg-black">
                                <PerspectiveCropper
                                    imageSrc={imageSrc}
                                    onPointsChange={setPoints}
                                />
                            </div>
                            <div className="flex flex-col gap-4 shrink-0">
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setMode('menu')}>
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Retake
                                    </Button>
                                    <Button className="flex-1" onClick={handlePreview}>
                                        <Check className="w-4 h-4 mr-2" />
                                        Preview
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : mode === 'preview' && previewSrc ? (
                        <div className="flex flex-col h-full gap-4">
                            <div className="relative flex-1 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={previewSrc}
                                    alt="Preview"
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button variant="outline" className="flex-1" onClick={() => setMode('crop')}>
                                    Back
                                </Button>
                                <Button className="flex-1" onClick={handleImport}>
                                    <Check className="w-4 h-4 mr-2" />
                                    Import
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}