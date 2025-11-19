import { Button } from "@/components/ui/button";

interface NumberPadProps {
    onNumberClick: (num: number) => void;
    onDelete: () => void;
}

export function NumberPad({ onNumberClick, onDelete }: NumberPadProps) {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
        <div className="grid grid-cols-5 gap-2 w-full max-w-md mt-4">
            {numbers.map((num) => (
                <Button key={num} variant="outline" className="h-12 text-lg" onClick={() => onNumberClick(num)}>
                    {num}
                </Button>
            ))}
            <Button variant="destructive" className="h-12 text-lg" onClick={onDelete}>
                Del
            </Button>
        </div>
    );
}
