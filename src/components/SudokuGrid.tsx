import { Cell } from "./Cell";
import { cn } from "@/lib/utils";

interface SudokuGridProps {
    puzzle: (number | null)[];
    userGrid: (number | null)[];
    initialGrid: (number | null)[];
    selectedIndex: number | null;
    onCellClick: (index: number) => void;
    validation?: boolean[]; // Array of validity for each cell if checked
}

export function SudokuGrid({ puzzle, userGrid, initialGrid, selectedIndex, onCellClick, validation }: SudokuGridProps) {
    // Helper to determine if a cell is related to the selected cell (same row, col, box, or same number)
    const isRelated = (index: number) => {
        if (selectedIndex === null) return false;
        const selectedVal = userGrid[selectedIndex];
        const currentVal = userGrid[index];

        // Highlight same number
        if (selectedVal !== null && currentVal === selectedVal) return true;

        const row = Math.floor(index / 9);
        const col = index % 9;
        const sRow = Math.floor(selectedIndex / 9);
        const sCol = selectedIndex % 9;

        // Same row or col
        if (row === sRow || col === sCol) return true;

        // Same box
        const boxRow = Math.floor(row / 3);
        const boxCol = Math.floor(col / 3);
        const sBoxRow = Math.floor(sRow / 3);
        const sBoxCol = Math.floor(sCol / 3);

        if (boxRow === sBoxRow && boxCol === sBoxCol) return true;

        return false;
    };

    return (
        <div className="grid grid-cols-9 grid-rows-[repeat(9,minmax(0,1fr))] border-2 border-black dark:border-white w-full max-w-md aspect-square bg-background">
            {userGrid.map((value, index) => {
                const row = Math.floor(index / 9);
                const col = index % 9;

                // Add thick borders for 3x3 boxes
                const borderRight = (col + 1) % 3 === 0 && col !== 8 ? "border-r-2 border-r-black dark:border-r-white" : "";
                const borderBottom = (row + 1) % 3 === 0 && row !== 8 ? "border-b-2 border-b-black dark:border-b-white" : "";

                return (
                    <div key={index} className={cn("w-full h-full", borderRight, borderBottom)}>
                        <Cell
                            value={value}
                            initial={initialGrid[index] !== null}
                            isSelected={selectedIndex === index}
                            isRelated={isRelated(index)}
                            isValid={validation ? validation[index] : undefined}
                            onClick={() => onCellClick(index)}
                        />
                    </div>
                );
            })}
        </div>
    );
}
