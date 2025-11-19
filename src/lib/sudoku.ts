import { makepuzzle, solvepuzzle, ratepuzzle } from 'sudoku';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'insane';

// Map difficulty to number of holes or use library's rating if possible.
// The 'sudoku' library generates puzzles but doesn't strictly enforce difficulty by name in 'makepuzzle'.
// We can filter or just use it as is for now. 
// Actually 'sudoku' library 'makepuzzle' doesn't take arguments. 
// We might need to implement a custom generator or use the library's raw output and mask it.
// Let's check the library's behavior. 'makepuzzle()' returns a puzzle.
// 'solvepuzzle(puzzle)' returns the solution.

// The 'sudoku' library uses 0-indexed integers 0-8 for numbers (so 0=1, 8=9) and null/null for empty?
// Let's verify the data structure. Usually it's 0-80 array.
// Actually, looking at 'sudoku' npm package docs (or common usage):
// makepuzzle() returns an array of 81 integers. 0-8 are values, null is empty.
// Wait, let's assume standard 1-9 for display and 0 or null for empty.
// I'll write a wrapper to normalize this to 0-81 array where 0 = empty, 1-9 = value.

export const generateSudoku = (difficulty: Difficulty = 'medium') => {
  // The 'sudoku' library generates a puzzle.
  // It returns an array of 81 items.
  // Items are 0-indexed numbers (0-8) or null.
  const rawPuzzle = makepuzzle();
  const rawSolution = solvepuzzle(rawPuzzle);

  // Convert to our format: 1-9 for values, null for empty.
  // The library returns 0-8 for values. So we add 1.
  const puzzle = rawPuzzle.map((val: number | null) => (val !== null ? val + 1 : null));
  const solution = rawSolution.map((val: number) => val + 1);

  // TODO: Implement difficulty filtering if needed. 
  // For now, we just return what the library gives.
  
  return { puzzle, solution };
};

export const solveSudoku = (board: (number | null)[]) => {
  // Convert 1-9 back to 0-8 for the library
  const rawBoard = board.map(val => (val !== null ? val - 1 : null));
  const rawSolution = solvepuzzle(rawBoard);
  
  if (!rawSolution) return null;
  
  return rawSolution.map((val: number) => val + 1);
};

export const isValidMove = (board: (number | null)[], index: number, value: number) => {
  // Basic row/col/box check
  const row = Math.floor(index / 9);
  const col = index % 9;
  
  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row * 9 + c] === value) return false;
  }
  
  // Check col
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r * 9 + col] === value) return false;
  }
  
  // Check box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const idx = (boxRow + r) * 9 + (boxCol + c);
      if (idx !== index && board[idx] === value) return false;
    }
  }
  
  return true;
};
