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
import { Camera, Upload, Loader2 } from "lucide-react";
import { processSudokuImage } from "@/lib/ocr";
import { toast } from "sonner";

interface ImageImportProps {
    onImport: (grid: (number | null)[]) => void;
}

export function ImageImport({ onImport }: ImageImportProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mode, setMode] = useState<'menu' | 'camera' | 'upload'>('menu');
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await processImage(e.target.files[0]);
        }
    };

    const capture = useCallback(async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            // Convert base64 to File
            const res = await fetch(imageSrc);
            const blob = await res.blob();
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            await processImage(file);
        }
    }, [webcamRef]);

    const processImage = async (file: File) => {
        setIsProcessing(true);
        try {
            toast.info("Processing image... This may take a minute.");
            const grid = await processSudokuImage(file);
            onImport(grid);
            setIsOpen(false);
            setMode('menu');
            toast.success("Sudoku imported successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to process image. Please try a clearer image.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-12 gap-2">
                    <Camera className="w-4 h-4" />
                    Import Puzzle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import Sudoku</DialogTitle>
                </DialogHeader>

                {isProcessing ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p>Analyzing image...</p>
                    </div>
                ) : mode === 'menu' ? (
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setMode('camera')}>
                            <Camera className="w-8 h-8" />
                            Camera
                        </Button>
                        <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-8 h-8" />
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
                    <div className="flex flex-col gap-4">
                        <div className="relative rounded-lg overflow-hidden bg-black aspect-[3/4]">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{ facingMode: "environment" }}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setMode('menu')}>Back</Button>
                            <Button className="flex-1" onClick={capture}>Capture</Button>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
