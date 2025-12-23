const WIN_LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
]

export function checkWinner(board: string): "X" | "O" | null {
    for (const [a, b, c] of WIN_LINES) {
        const v = board[a];
        if (v !== " " && v === board[b] && v === board[c]) {
            return v as "X" | "O";
        }
    }
    return null;
}


export function isDraw(board: string): boolean {
    return !board.includes(" ");
}