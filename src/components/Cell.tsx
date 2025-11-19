import { cn } from "@/lib/utils";

interface CellProps {
    value: number | null;
    initial: boolean;
    isSelected: boolean;
    isRelated: boolean; // Same row/col/box or same number
    isValid?: boolean; // null = unknown/neutral, true = correct, false = incorrect
    onClick: () => void;
}

export function Cell({ value, initial, isSelected, isRelated, isValid, onClick }: CellProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center justify-center w-full h-full text-xl font-medium cursor-pointer transition-colors duration-75 select-none border-[0.5px] border-border",
                // Grid borders handled by parent or smart borders here? 
                // Let's rely on parent grid layout for main borders, but this needs to look good.
                // Actually, standard Sudoku has thick borders every 3 cells.

                // Base colors
                "bg-background text-foreground",

                // Interaction states
                isRelated && "bg-accent/50",
                isSelected && "bg-primary text-primary-foreground ring-2 ring-primary z-10",

                // Validation states (override others if needed, but usually subtle)
                isValid === false && "bg-destructive/20 text-destructive",
                isValid === true && "text-green-600 dark:text-green-400",

                // Initial values are bolder/different color
                initial && "font-bold text-foreground",
                !initial && "text-blue-600 dark:text-blue-400"
            )}
        >
            {value}
        </div>
    );
}
