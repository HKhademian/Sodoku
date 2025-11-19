import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, Upload, Loader2, Check, X, RotateCcw } from "lucide-react";
import { processSudokuImage } from "@/lib/ocr";
import { getCroppedImg } from "@/lib/cropImage";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

interface ImageImportProps {
    onImport: (grid: (number | null)[]) => void;
}

export function ImageImport({ onImport }: ImageImportProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mode, setMode] = useState<'menu' | 'camera' | 'crop'>('menu');
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    
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

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleProcessCrop = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        
        setIsProcessing(true);
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            const file = new File([croppedBlob], "cropped.jpg", { type: "image/jpeg" });
            
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
        setCrop({ x: 0, y: 0 });
        setZoom(1);
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
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                />
                            </div>
                            <div className="flex flex-col gap-4 shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm w-12">Zoom</span>
                                    <Slider
                                        value={[zoom]}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        onValueChange={(value) => setZoom(value[0])}
                                        className="flex-1"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setMode('menu')}>
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Retake
                                    </Button>
                                    <Button className="flex-1" onClick={handleProcessCrop}>
                                        <Check className="w-4 h-4 mr-2" />
                                        Done
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}