import { db } from '../db';
import { games, rooms, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { TicTacToe, Player } from '../models/TicTakToe';

export interface CreateGameData {
    roomId: string;
    player1Id: string;
    player2Id: string;
}

export interface MakeMoveData {
    gameId: string;
    userId: string;
    position: number;
}

export class GameService {
    /**
     * Create a new game in a room
     */
    async createGame(data: CreateGameData) {
        const [newGame] = await db
            .insert(games)
            .values({
                roomId: data.roomId,
                player1Id: data.player1Id,
                player2Id: data.player2Id,
                board: '         ', // 9 empty spaces
                currentTurn: 'X',
            })
            .returning();

        return await this.getGameById(newGame.id);
    }

    /**
     * Get game by ID with all details
     */
    async getGameById(gameId: string) {
        const game = await db.query.games.findFirst({
            where: eq(games.id, gameId),
            with: {
                room: true,
                player1: {
                    columns: {
                        id: true,
                        username: true,
                        isOnline: true,
                    },
                },
                player2: {
                    columns: {
                        id: true,
                        username: true,
                        isOnline: true,
                    },
                },
                winner: {
                    columns: {
                        id: true,
                        username: true,
                    },
                },
            },
        });

        if (!game) {
            throw new Error('Game not found');
        }

        return game;
    }

    /**
     * Get active game in a room
     */
    async getActiveGameInRoom(roomId: string) {
        const game = await db.query.games.findFirst({
            where: and(
                eq(games.roomId, roomId),
                eq(games.isFinished, false)
            ),
            with: {
                room: true,
                player1: {
                    columns: {
                        id: true,
                        username: true,
                        isOnline: true,
                    },
                },
                player2: {
                    columns: {
                        id: true,
                        username: true,
                        isOnline: true,
                    },
                },
            },
        });

        return game;
    }

    /**
     * Make a move in the game
     */
    async makeMove(data: MakeMoveData) {
        const game = await this.getGameById(data.gameId);

        if (!game) {
            throw new Error('Game not found');
        }

        if (game.isFinished) {
            throw new Error('Game is already finished');
        }

        // Determine which player is making the move
        let player: Player;
        if (data.userId === game.player1Id) {
            player = 'X';
        } else if (data.userId === game.player2Id) {
            player = 'O';
        } else {
            throw new Error('You are not a player in this game');
        }

        // Create TicTacToe instance with current game state
        const ticTacToe = new TicTacToe(game.board, game.currentTurn as Player);

        // Make the move
        const result = ticTacToe.makeMove(data.position, player);

        if (!result.success) {
            throw new Error(result.message || 'Invalid move');
        }

        // Update game in database
        const updateData: any = {
            board: result.board,
            currentTurn: result.currentTurn,
            isDraw: result.isDraw,
            isFinished: result.isFinished,
        };

        if (result.winner) {
            updateData.winner = result.winner;
            updateData.winnerId = result.winner === 'X' ? game.player1Id : game.player2Id;
            updateData.finishedAt = new Date();
        } else if (result.isDraw) {
            updateData.finishedAt = new Date();
        }

        await db
            .update(games)
            .set(updateData)
            .where(eq(games.id, data.gameId));

        // Return updated game
        return await this.getGameById(data.gameId);
    }

    /**
     * Get user's game history
     */
    async getUserGameHistory(userId: string, limit: number = 20) {
        const userGames = await db.query.games.findMany({
            where: and(
                eq(games.isFinished, true)
            ),
            with: {
                player1: {
                    columns: {
                        id: true,
                        username: true,
                    },
                },
                player2: {
                    columns: {
                        id: true,
                        username: true,
                    },
                },
                winner: {
                    columns: {
                        id: true,
                        username: true,
                    },
                },
            },
            orderBy: (games, { desc }) => [desc(games.finishedAt)],
            limit,
        });

        // Filter games where user was a player
        return userGames.filter(
            (game) => game.player1Id === userId || game.player2Id === userId
        );
    }

    /**
     * Get game statistics for a user
     */
    async getUserStats(userId: string) {
        const userGames = await this.getUserGameHistory(userId, 1000);

        const stats = {
            totalGames: userGames.length,
            wins: 0,
            losses: 0,
            draws: 0,
        };

        for (const game of userGames) {
            if (game.isDraw) {
                stats.draws++;
            } else if (game.winnerId === userId) {
                stats.wins++;
            } else {
                stats.losses++;
            }
        }

        return stats;
    }

    /**
     * Check if it's a user's turn
     */
    async isUserTurn(gameId: string, userId: string): Promise<boolean> {
        const game = await this.getGameById(gameId);

        if (game.currentTurn === 'X' && game.player1Id === userId) {
            return true;
        }

        if (game.currentTurn === 'O' && game.player2Id === userId) {
            return true;
        }

        return false;
    }
}

export const gameService = new GameService();