export type PlayerSymbol = "X" | "O";

export type GameStatus = "waiting" | "playing" | "finished";

export type GameState = {
    id: string;
    code: string;
    playerX?: string;
    playerO?: string;
    board: string;
    turn: PlayerSymbol;
    status: GameStatus;
    winner?: PlayerSymbol;
    isDraw?: boolean;
};