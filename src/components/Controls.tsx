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
    difficulty: Difficulty;
    onDifficultyChange: (value: Difficulty) => void;
    onNewGame: () => void;
    onSolve: () => void;
    onHint: () => void;
    onReset: () => void;
}

export function Controls({ difficulty, onDifficultyChange, onNewGame, onSolve, onHint, onReset }: ControlsProps) {
    return (
        <div className="flex flex-col gap-4 w-full max-w-md">
            <div className="flex gap-2">
                <Select value={difficulty} onValueChange={(val) => onDifficultyChange(val as Difficulty)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                        <SelectItem value="insane">Insane</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={onNewGame} className="flex-1">New Game</Button>
            </div>

            <div className="flex gap-2">
                <Button variant="secondary" onClick={onHint} className="flex-1">Hint</Button>
                <Button variant="destructive" onClick={onReset} className="flex-1">Reset</Button>
                <Button variant="outline" onClick={onSolve} className="flex-1">Solve</Button>
            </div>
        </div>
    );
}
