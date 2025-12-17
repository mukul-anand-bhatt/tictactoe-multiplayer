import { ServerWebSocket } from 'bun';
import { WebSocketMessage, MessageType } from './types';
import { connectionManager } from './manager';
import {
    handleAuthenticate,
    handleDisconnect,
} from './handlers/connectionHandler';
import { handleJoinRoom, handleLeaveRoom } from './handlers/roomHandler';
import {
    handleStartGame,
    handleMakeMove,
    handleGetGameState,
} from './handlers/gameHandler';

/**
 * Handle incoming WebSocket messages
 */
async function handleMessage(
    ws: ServerWebSocket,
    message: WebSocketMessage
): Promise<void> {
    console.log(`📨 Received: ${message.type}`);

    try {
        switch (message.type) {
            // Authentication
            case MessageType.AUTHENTICATE:
                await handleAuthenticate(ws, message.payload);
                break;

            // Room management
            case MessageType.JOIN_ROOM:
                await handleJoinRoom(ws, message.payload);
                break;

            case MessageType.LEAVE_ROOM:
                await handleLeaveRoom(ws);
                break;

            // Game actions
            case MessageType.START_GAME:
                await handleStartGame(ws);
                break;

            case MessageType.MAKE_MOVE:
                await handleMakeMove(ws, message.payload);
                break;

            default:
                connectionManager.sendToClient(ws, {
                    type: MessageType.ERROR,
                    payload: {
                        message: 'Unknown message type',
                        code: 'UNKNOWN_MESSAGE_TYPE',
                    },
                });
        }
    } catch (error: any) {
        console.error('Error handling message:', error);
        connectionManager.sendToClient(ws, {
            type: MessageType.ERROR,
            payload: {
                message: error.message || 'Internal server error',
                code: 'INTERNAL_ERROR',
            },
        });
    }
}

/**
 * WebSocket server handlers for Bun
 */
export const websocketHandlers = {
    /**
     * Called when a new WebSocket connection is opened
     */
    open(ws: ServerWebSocket) {
        console.log('🔌 New WebSocket connection');
    },

    /**
     * Called when a message is received
     */
    async message(ws: ServerWebSocket, message: string | Buffer) {
        try {
            const data: WebSocketMessage = JSON.parse(message.toString());
            await handleMessage(ws, data);
        } catch (error) {
            console.error('Error parsing message:', error);
            connectionManager.sendToClient(ws, {
                type: MessageType.ERROR,
                payload: {
                    message: 'Invalid message format',
                    code: 'INVALID_FORMAT',
                },
            });
        }
    },

    /**
     * Called when connection is closed
     */
    async close(ws: ServerWebSocket) {
        await handleDisconnect(ws);
    },

    /**
     * Called on WebSocket error
     */
    error(ws: ServerWebSocket, error: Error) {
        console.error('WebSocket error:', error);
    },
};