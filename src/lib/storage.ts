export interface GameState {
    puzzle: (number | null)[];
    solution: number[];
    userGrid: (number | null)[];
    history: (number | null)[][]; // For undo
    timer: number;
    difficulty: string;
    status: 'playing' | 'won' | 'lost';
}

export interface LeaderboardEntry {
    name: string;
    score: number; // Time in seconds
    difficulty: string;
    date: string;
}

const STORAGE_KEY_GAME = 'sudoku_game_save';
const STORAGE_KEY_LEADERBOARD = 'sudoku_leaderboard';

export const saveGame = (state: GameState) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_GAME, JSON.stringify(state));
};

export const loadGame = (): GameState | null => {
    if (typeof window === 'undefined') return null;
    try {
        const saved = localStorage.getItem(STORAGE_KEY_GAME);
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error("Failed to load game save:", error);
        return null;
    }
};

export const clearGame = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_GAME);
};

export const saveScore = (entry: LeaderboardEntry) => {
    if (typeof window === 'undefined') return;
    const current = getLeaderboard();
    const updated = [...current, entry].sort((a, b) => a.score - b.score).slice(0, 10); // Keep top 10
    localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(updated));
};

export const getLeaderboard = (): LeaderboardEntry[] => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
    return saved ? JSON.parse(saved) : [];
};
