"use client";

import { useEffect, useState, useCallback } from "react";
import { SudokuGrid } from "@/components/SudokuGrid";
import { Controls } from "@/components/Controls";
import { NumberPad } from "@/components/NumberPad";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Leaderboard } from "@/components/Leaderboard";
import { generateSudoku, solveSudoku, isValidMove, Difficulty } from "@/lib/sudoku";
import { saveGame, loadGame, clearGame, saveScore } from "@/lib/storage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { ImageImport } from "@/components/ImageImport";

export default function Home() {
  const [puzzle, setPuzzle] = useState<(number | null)[]>(Array(81).fill(null));
  const [solution, setSolution] = useState<number[]>([]);
  const [userGrid, setUserGrid] = useState<(number | null)[]>(Array(81).fill(null));
  const [initialGrid, setInitialGrid] = useState<(number | null)[]>(Array(81).fill(null));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [timer, setTimer] = useState(0);
  const [status, setStatus] = useState<'playing' | 'won'>('playing');
  const [isClient, setIsClient] = useState(false);

  // Load game on mount
  useEffect(() => {
    setIsClient(true);
    const saved = loadGame();
    if (saved && saved.status === 'playing') {
      setPuzzle(saved.puzzle);
      setSolution(saved.solution);
      setUserGrid(saved.userGrid);
      setInitialGrid(saved.puzzle); // Assuming puzzle in save is the initial state
      setTimer(saved.timer);
      setDifficulty(saved.difficulty as Difficulty);
      setStatus(saved.status);
      toast.success("Game loaded from save!");
    } else {
      startNewGame("medium");
    }
  }, []);

  // Timer
  useEffect(() => {
    if (status !== 'playing') return;
    const interval = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Auto-save
  useEffect(() => {
    if (status === 'playing' && isClient) {
      saveGame({
        puzzle: initialGrid,
        solution,
        userGrid,
        history: [],
        timer,
        difficulty,
        status
      });
    }
  }, [userGrid, timer, status, initialGrid, solution, difficulty, isClient]);

  const startNewGame = useCallback((diff: Difficulty) => {
    const { puzzle: newPuzzle, solution: newSolution } = generateSudoku(diff);
    setPuzzle(newPuzzle);
    setSolution(newSolution);
    setUserGrid([...newPuzzle]);
    setInitialGrid([...newPuzzle]);
    setDifficulty(diff);
    setTimer(0);
    setStatus('playing');
    setSelectedIndex(null);
    clearGame();
  }, []);

  const handleImport = useCallback((importedGrid: (number | null)[]) => {
    const solved = solveSudoku(importedGrid);
    if (!solved) {
      toast.error("Imported puzzle seems invalid or unsolvable.");
      return;
    }

    setPuzzle(importedGrid);
    setInitialGrid(importedGrid);
    setUserGrid(importedGrid);
    setSolution(solved);
    setTimer(0);
    setStatus('playing');
    setSelectedIndex(null);
    clearGame();
    toast.success("Puzzle imported!");
  }, []);

  const handleCellClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleNumberInput = useCallback((num: number) => {
    if (selectedIndex === null || status !== 'playing') return;

    // Cannot edit initial cells
    if (initialGrid[selectedIndex] !== null) return;

    const newGrid = [...userGrid];
    newGrid[selectedIndex] = num;
    setUserGrid(newGrid);

    // Check for win
    if (newGrid.every((val, i) => val === solution[i])) {
      setStatus('won');
      toast.success(`Puzzle Solved! Time: ${formatTime(timer)}`);
      saveScore({
        name: "You",
        score: timer,
        difficulty,
        date: new Date().toISOString()
      });
      clearGame();
    } else if (newGrid.every(val => val !== null)) {
      // Board full but not correct
      // toast.error("Board full but incorrect!");
    }
  }, [selectedIndex, status, initialGrid, userGrid, solution, timer, difficulty]);

  const handleDelete = useCallback(() => {
    if (selectedIndex === null || status !== 'playing') return;
    if (initialGrid[selectedIndex] !== null) return;

    const newGrid = [...userGrid];
    newGrid[selectedIndex] = null;
    setUserGrid(newGrid);
  }, [selectedIndex, status, initialGrid, userGrid]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'playing') return;

      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleDelete();
      } else if (e.key.startsWith('Arrow')) {
        // Navigation
        if (selectedIndex === null) {
          setSelectedIndex(0);
          return;
        }
        let newIndex = selectedIndex;
        if (e.key === 'ArrowUp') newIndex -= 9;
        if (e.key === 'ArrowDown') newIndex += 9;
        if (e.key === 'ArrowLeft') newIndex -= 1;
        if (e.key === 'ArrowRight') newIndex += 1;

        if (newIndex >= 0 && newIndex < 81) {
          setSelectedIndex(newIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, status, handleNumberInput, handleDelete]);

  const handleSolve = () => {
    if (confirm("Are you sure you want to give up?")) {
      setUserGrid([...solution]);
      setStatus('won'); // Technically won but cheated
      clearGame();
    }
  };

  const handleHint = () => {
    if (selectedIndex === null) {
      toast.error("Select a cell first!");
      return;
    }
    if (initialGrid[selectedIndex] !== null) {
      toast.error("This cell is already filled!");
      return;
    }

    const newGrid = [...userGrid];
    newGrid[selectedIndex] = solution[selectedIndex];
    setUserGrid(newGrid);
    toast.info("Hint revealed!");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isClient) return null; // Prevent hydration mismatch

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-background text-foreground transition-colors">
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Sudoku</h1>
        <div className="flex items-center gap-4">
          <div className="text-xl font-mono font-medium">{formatTime(timer)}</div>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full justify-center items-start">
        <div className="flex flex-col items-center w-full max-w-md">
          <SudokuGrid
            puzzle={puzzle}
            userGrid={userGrid}
            initialGrid={initialGrid}
            selectedIndex={selectedIndex}
            onCellClick={handleCellClick}
          />
          <NumberPad onNumberClick={handleNumberInput} onDelete={handleDelete} />
        </div>

        <div className="flex flex-col gap-8 w-full max-w-md">
          <Controls
            difficulty={difficulty}
            onDifficultyChange={startNewGame}
            onNewGame={() => startNewGame(difficulty)}
            onSolve={handleSolve}
            onHint={handleHint}
            onReset={() => startNewGame(difficulty)}
          />

          <ImageImport onImport={handleImport} />

          <Leaderboard />
        </div>
      </div>
    </main>
  );
}
