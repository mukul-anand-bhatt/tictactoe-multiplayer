export type Player = 'X' | 'O';
export type Cell = 'X' | 'O' | ' ';
export type Board = string; // 9 characters: "X O X O  "

export interface GameState {
    board: Board;
    currentTurn: Player;
    winner: Player | null;
    isDraw: boolean;
    isFinished: boolean;
}

export interface MoveResult {
    success: boolean;
    board: Board;
    currentTurn: Player;
    winner: Player | null;
    isDraw: boolean;
    isFinished: boolean;
    message?: string;
}

export class TicTacToe {
    private board: Cell[];
    private currentTurn: Player;
    private winner: Player | null;
    private isDraw: boolean;
    private isFinished: boolean;

    constructor(initialBoard?: string, initialTurn?: Player) {
        // Initialize board from string or create empty board
        this.board = initialBoard
            ? this.stringToBoard(initialBoard)
            : Array(9).fill(' ');

        this.currentTurn = initialTurn || 'X';
        this.winner = null;
        this.isDraw = false;
        this.isFinished = false;

        // Check if game is already finished (for loading existing games)
        if (initialBoard) {
            this.checkGameState();
        }
    }

    /**
     * Convert string to board array
     */
    private stringToBoard(boardString: string): Cell[] {
        return boardString.split('').map((char) => {
            if (char === 'X' || char === 'O') return char;
            return ' ';
        }) as Cell[];
    }

    /**
     * Convert board array to string
     */
    private boardToString(): string {
        return this.board.join('');
    }

    /**
     * Make a move at the specified position (0-8)
     */
    makeMove(position: number, player: Player): MoveResult {
        // Validate move
        if (this.isFinished) {
            return {
                success: false,
                ...this.getState(),
                message: 'Game is already finished',
            };
        }

        if (player !== this.currentTurn) {
            return {
                success: false,
                ...this.getState(),
                message: `It's ${this.currentTurn}'s turn`,
            };
        }

        if (position < 0 || position > 8) {
            return {
                success: false,
                ...this.getState(),
                message: 'Invalid position',
            };
        }

        if (this.board[position] !== ' ') {
            return {
                success: false,
                ...this.getState(),
                message: 'Cell is already occupied',
            };
        }

        // Make the move
        this.board[position] = player;

        // Check for winner or draw
        this.checkGameState();

        // Switch turn if game is not finished
        if (!this.isFinished) {
            this.currentTurn = this.currentTurn === 'X' ? 'O' : 'X';
        }

        return {
            success: true,
            ...this.getState(),
        };
    }

    /**
     * Check if there's a winner or draw
     */
    private checkGameState(): void {
        // Check for winner
        const winner = this.checkWinner();
        if (winner) {
            this.winner = winner;
            this.isFinished = true;
            return;
        }

        // Check for draw (no empty cells left)
        if (!this.board.includes(' ')) {
            this.isDraw = true;
            this.isFinished = true;
        }
    }

    /**
     * Check if there's a winner
     */
    private checkWinner(): Player | null {
        // All winning combinations
        const winPatterns = [
            [0, 1, 2], // Top row
            [3, 4, 5], // Middle row
            [6, 7, 8], // Bottom row
            [0, 3, 6], // Left column
            [1, 4, 7], // Middle column
            [2, 5, 8], // Right column
            [0, 4, 8], // Diagonal \
            [2, 4, 6], // Diagonal /
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (
                this.board[a] !== ' ' &&
                this.board[a] === this.board[b] &&
                this.board[a] === this.board[c]
            ) {
                return this.board[a] as Player;
            }
        }

        return null;
    }

    /**
     * Get current game state
     */
    getState(): GameState {
        return {
            board: this.boardToString(),
            currentTurn: this.currentTurn,
            winner: this.winner,
            isDraw: this.isDraw,
            isFinished: this.isFinished,
        };
    }

    /**
     * Get board as 2D array (for easier display)
     */
    getBoardAs2D(): Cell[][] {
        return [
            [this.board[0], this.board[1], this.board[2]],
            [this.board[3], this.board[4], this.board[5]],
            [this.board[6], this.board[7], this.board[8]],
        ];
    }

    /**
     * Reset the game
     */
    reset(): void {
        this.board = Array(9).fill(' ');
        this.currentTurn = 'X';
        this.winner = null;
        this.isDraw = false;
        this.isFinished = false;
    }

    /**
     * Check if a position is valid for a move
     */
    isValidMove(position: number): boolean {
        return (
            position >= 0 &&
            position <= 8 &&
            this.board[position] === ' ' &&
            !this.isFinished
        );
    }

    /**
     * Get available moves
     */
    getAvailableMoves(): number[] {
        return this.board
            .map((cell, index) => (cell === ' ' ? index : -1))
            .filter((index) => index !== -1);
    }
}