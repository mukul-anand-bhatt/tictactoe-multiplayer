import { ServerWebSocket } from 'bun';
import { connectionManager } from '../manager';
import { MessageType, MakeMovePayload } from '../types';
import { gameService } from '../../services/gameService';
import { roomService } from '../../services/roomService';

/**
 * Handle starting a new game
 */
export async function handleStartGame(ws: ServerWebSocket): Promise<void> {
    const connection = connectionManager.getConnection(ws);

    if (!connection || !connection.roomId) {
        connectionManager.sendToClient(ws, {
            type: MessageType.ERROR,
            payload: {
                message: 'Not in a room',
                code: 'NOT_IN_ROOM',
            },
        });
        return;
    }

    try {
        const room = await roomService.getRoomById(connection.roomId);

        // Check if room has 2 players
        const players = room.participants.filter(
            (p) => p.role === 'player1' || p.role === 'player2'
        );

        if (players.length !== 2) {
            throw new Error('Need 2 players to start game');
        }

        const player1 = players.find((p) => p.role === 'player1');
        const player2 = players.find((p) => p.role === 'player2');

        if (!player1 || !player2) {
            throw new Error('Invalid player configuration');
        }

        // Check if there's already an active game
        let game = await gameService.getActiveGameInRoom(room.id);

        // Create new game if none exists
        if (!game) {
            game = await gameService.createGame({
                roomId: room.id,
                player1Id: player1.userId,
                player2Id: player2.userId,
            });
        }

        // Ensure player2 exists before proceeding
        // This check is necessary because the database schema allows nullable player2,
        // but for a started game, we strictly require both players to be present.
        if (!game.player2) {
            throw new Error('Game state invalid: Player 2 is missing');
        }

        // Broadcast game started to all in room
        connectionManager.broadcastToRoom(room.id, {
            type: MessageType.GAME_STARTED,
            payload: {
                gameId: game.id,
                player1: {
                    id: game.player1.id,
                    username: game.player1.username,
                    symbol: 'X',
                },
                player2: {
                    id: game.player2.id,
                    username: game.player2.username,
                    symbol: 'O',
                },
                board: game.board,
                currentTurn: game.currentTurn,
            },
        });

        console.log(`🎮 Game started in room ${room.code}`);
    } catch (error: any) {
        connectionManager.sendToClient(ws, {
            type: MessageType.ERROR,
            payload: {
                message: 'Failed to start game: ' + error.message,
                code: 'START_GAME_FAILED',
            },
        });
    }
}

/**
 * Handle player making a move
 */
export async function handleMakeMove(
    ws: ServerWebSocket,
    payload: MakeMovePayload
): Promise<void> {
    const connection = connectionManager.getConnection(ws);

    if (!connection) {
        connectionManager.sendToClient(ws, {
            type: MessageType.ERROR,
            payload: {
                message: 'Not authenticated',
                code: 'NOT_AUTHENTICATED',
            },
        });
        return;
    }

    try {
        // Make move via service
        const game = await gameService.makeMove({
            gameId: payload.gameId,
            userId: connection.userId,
            position: payload.position,
        });

        // Broadcast move to all in room
        connectionManager.broadcastToRoom(connection.roomId!, {
            type: MessageType.MOVE_MADE,
            payload: {
                gameId: game.id,
                position: payload.position,
                player: connection.userId === game.player1Id ? 'X' : 'O',
                username: connection.username,
                board: game.board,
                currentTurn: game.currentTurn,
            },
        });

        // If game is finished, broadcast game over
        if (game.isFinished) {
            let result: 'win' | 'draw';
            let winnerUsername: string | null = null;

            if (game.isDraw) {
                result = 'draw';
            } else {
                result = 'win';
                winnerUsername = game.winner?.username || null;
            }

            connectionManager.broadcastToRoom(connection.roomId!, {
                type: MessageType.GAME_OVER,
                payload: {
                    gameId: game.id,
                    result,
                    winner: game.winner ? {
                        id: game.winner.id,
                        username: game.winner.username,
                        symbol: game.winner.id === game.player1Id ? 'X' : 'O',
                    } : null,
                    board: game.board,
                },
            });

            console.log(
                `🏁 Game ${game.id} finished: ${result === 'draw' ? 'Draw' : winnerUsername + ' won'}`
            );
        }
    } catch (error: any) {
        connectionManager.sendToClient(ws, {
            type: MessageType.ERROR,
            payload: {
                message: 'Invalid move: ' + error.message,
                code: 'INVALID_MOVE',
            },
        });
    }
}

/**
 * Handle getting current game state
 */
export async function handleGetGameState(
    ws: ServerWebSocket,
    gameId: string
): Promise<void> {
    const connection = connectionManager.getConnection(ws);

    if (!connection) {
        return;
    }

    try {
        const game = await gameService.getGameById(gameId);

        connectionManager.sendToClient(ws, {
            type: MessageType.GAME_STATE,
            payload: {
                gameId: game.id,
                board: game.board,
                currentTurn: game.currentTurn,
                isFinished: game.isFinished,
                winner: game.winner,
                isDraw: game.isDraw,
                player1: {
                    id: game.player1.id,
                    username: game.player1.username,
                    symbol: 'X',
                },
                player2: game.player2 ? {
                    id: game.player2.id,
                    username: game.player2.username,
                    symbol: 'O',
                } : null,
            },
        });
    } catch (error: any) {
        connectionManager.sendToClient(ws, {
            type: MessageType.ERROR,
            payload: {
                message: 'Failed to get game state: ' + error.message,
                code: 'GET_STATE_FAILED',
            },
        });
    }
}