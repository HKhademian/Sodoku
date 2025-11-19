import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Difficulty } from "@/lib/sudoku";

interface ControlsProps {
    onSolve: () => void;
    onHint: () => void;
    onReset: () => void;
}

export function Controls({ onSolve, onHint, onReset }: ControlsProps) {
    return (
        <div className="flex flex-col gap-4 w-full max-w-md">
            <div className="flex gap-2">
                <Button variant="secondary" onClick={onHint} className="flex-1">Hint</Button>
                <Button variant="destructive" onClick={onReset} className="flex-1">Reset</Button>
                <Button variant="outline" onClick={onSolve} className="flex-1">Solve</Button>
            </div>
        </div>
    );
}
