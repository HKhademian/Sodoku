import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Difficulty } from "@/lib/sudoku";
import { Camera, Upload, Loader2, Check, RotateCcw, Grid3X3, Menu, Play } from "lucide-react";
import { processSudokuImage } from "@/lib/ocr";
import { getPerspectiveCroppedImg } from "@/lib/perspective";
import { PerspectiveCropper } from "@/components/PerspectiveCropper";
import { SudokuGrid } from "@/components/SudokuGrid";
import { NumberPad } from "@/components/NumberPad";
import { toast } from "sonner";

interface ImageImportProps {
    onImport: (grid: (number | null)[]) => void;
    onNewGame: () => void;
    difficulty: Difficulty;
    onDifficultyChange: (value: Difficulty) => void;
}

export function ImageImport({ onImport, onNewGame, difficulty, onDifficultyChange }: ImageImportProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mode, setMode] = useState<'menu' | 'camera' | 'crop' | 'preview' | 'manual'>('menu');
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [previewSrc, setPreviewSrc] = useState<string | null>(null);
    const [points, setPoints] = useState<any[]>([]);
    const [previewGrid, setPreviewGrid] = useState<(number | null)[]>(Array(81).fill(null));
    const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Manual mode state
    const [manualGrid, setManualGrid] = useState<(number | null)[]>(Array(81).fill(null));
    const [selectedManualIndex, setSelectedManualIndex] = useState<number | null>(null);

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

            // Start analysis immediately
            setIsAnalyzing(true);
            setPreviewGrid(Array(81).fill(null)); // Reset grid

            const file = new File([croppedBlob], "cropped.jpg", { type: "image/jpeg" });
            processSudokuImage(file)
                .then(grid => {
                    setPreviewGrid(grid);
                    toast.success("Numbers detected!");
                })
                .catch(err => {
                    console.error(err);
                    toast.error("Failed to detect numbers.");
                })
                .finally(() => {
                    setIsAnalyzing(false);
                });

        } catch (error) {
            console.error(error);
            toast.error("Failed to generate preview.");
        }
    };

    const handleImport = async () => {
        if (!previewSrc) return;

        onImport(previewGrid);
        setIsOpen(false);
        resetState();
        toast.success("Sudoku imported successfully!");
    };

    const handlePreviewInput = (num: number) => {
        if (selectedPreviewIndex === null) return;
        const newGrid = [...previewGrid];
        newGrid[selectedPreviewIndex] = num;
        setPreviewGrid(newGrid);
    };

    const handlePreviewDelete = () => {
        if (selectedPreviewIndex === null) return;
        const newGrid = [...previewGrid];
        newGrid[selectedPreviewIndex] = null;
        setPreviewGrid(newGrid);
    };

    const handleManualInput = (num: number) => {
        if (selectedManualIndex === null) return;
        const newGrid = [...manualGrid];
        newGrid[selectedManualIndex] = num;
        setManualGrid(newGrid);
    };

    const handleManualDelete = () => {
        if (selectedManualIndex === null) return;
        const newGrid = [...manualGrid];
        newGrid[selectedManualIndex] = null;
        setManualGrid(newGrid);
    };

    const handleManualImport = () => {
        onImport(manualGrid);
        setIsOpen(false);
        resetState();
        toast.success("Puzzle imported manually!");
    };

    const resetState = () => {
        setMode('menu');
        setImageSrc(null);
        setPreviewSrc(null);
        setPoints([]);
        setManualGrid(Array(81).fill(null));
        setSelectedManualIndex(null);
        setPreviewGrid(Array(81).fill(null));
        setSelectedPreviewIndex(null);
        setIsAnalyzing(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetState();
        }}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="w-10 h-10">
                    <Menu className="w-6 h-6" />
                    <span className="sr-only">Game Menu</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Game Menu</DialogTitle>
                </DialogHeader>

                <div className="flex-1 relative min-h-0 flex flex-col overflow-y-auto">
                    {isProcessing ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p>Analyzing image...</p>
                        </div>
                    ) : mode === 'menu' ? (
                        <div className="flex flex-col gap-4 py-4 h-full">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Difficulty</label>
                                <Select value={difficulty} onValueChange={(val) => onDifficultyChange(val as Difficulty)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Difficulty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                        <SelectItem value="insane">Insane</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4 flex-1 content-start">
                                <Button variant="outline" className="h-32 flex-col gap-4 col-span-2" onClick={() => {
                                    onNewGame();
                                    setIsOpen(false);
                                }}>
                                    <Play className="w-12 h-12" />
                                    New Game
                                </Button>
                                <Button variant="outline" className="h-32 flex-col gap-4" onClick={() => setMode('camera')}>
                                    <Camera className="w-12 h-12" />
                                    Take Photo
                                </Button>
                                <Button variant="outline" className="h-32 flex-col gap-4" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="w-12 h-12" />
                                    Upload File
                                </Button>
                                <Button variant="outline" className="h-32 flex-col gap-4 col-span-2" onClick={() => setMode('manual')}>
                                    <Grid3X3 className="w-12 h-12" />
                                    Manual Entry
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
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
                                <div className="relative aspect-square max-h-full max-w-full">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={previewSrc}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 grid grid-cols-9 grid-rows-[repeat(9,minmax(0,1fr))]">
                                        {Array.from({ length: 81 }).map((_, i) => {
                                            const row = Math.floor(i / 9);
                                            const col = i % 9;
                                            const value = previewGrid[i];
                                            const isSelected = selectedPreviewIndex === i;
                                            return (
                                                <div
                                                    key={i}
                                                    onClick={() => setSelectedPreviewIndex(i)}
                                                    className={cn(
                                                        "flex items-center justify-center text-2xl font-bold drop-shadow-md cursor-pointer transition-colors",
                                                        "border-[0.5px] border-cyan-400/30",
                                                        (col + 1) % 3 === 0 && col !== 8 && "border-r-cyan-400/80 border-r-2",
                                                        (row + 1) % 3 === 0 && row !== 8 && "border-b-cyan-400/80 border-b-2",
                                                        isSelected ? "bg-cyan-400/40 ring-2 ring-cyan-400 z-10" : "hover:bg-cyan-400/10",
                                                        value ? "text-blue-600" : ""
                                                    )}
                                                >
                                                    {value}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {isAnalyzing && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                            <div className="bg-background p-4 rounded-lg flex items-center gap-2">
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span>Scanning numbers...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <NumberPad
                                onNumberClick={handlePreviewInput}
                                onDelete={handlePreviewDelete}
                            />
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
                    ) : mode === 'manual' ? (
                        <div className="flex flex-col items-center gap-4 pb-4">
                            <SudokuGrid
                                puzzle={manualGrid}
                                userGrid={manualGrid}
                                initialGrid={Array(81).fill(null)}
                                selectedIndex={selectedManualIndex}
                                onCellClick={setSelectedManualIndex}
                            />
                            <NumberPad
                                onNumberClick={handleManualInput}
                                onDelete={handleManualDelete}
                            />
                            <div className="flex gap-2 w-full max-w-md">
                                <Button variant="outline" className="flex-1" onClick={() => setMode('menu')}>
                                    Back
                                </Button>
                                <Button className="flex-1" onClick={handleManualImport}>
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