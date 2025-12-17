import { ServerWebSocket } from 'bun';
import { connectionManager } from '../manager';
import { MessageType, JoinRoomPayload } from '../types';
import { roomService } from '../../services/roomService';

/**
 * Handle user joining a room
 */
export async function handleJoinRoom(
    ws: ServerWebSocket,
    payload: JoinRoomPayload
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
        // Join room via service
        const room = await roomService.joinRoom({
            roomCode: payload.roomCode,
            userId: connection.userId,
        });

        // Find user's role in the room
        const participant = room.participants.find(
            (p) => p.userId === connection.userId
        );

        if (!participant) {
            throw new Error('Failed to join room');
        }

        // Add to connection manager's room
        connectionManager.joinRoom(ws, room.id, participant.role);

        // Send success to the user
        connectionManager.sendToClient(ws, {
            type: MessageType.ROOM_JOINED,
            payload: {
                room: {
                    id: room.id,
                    code: room.code,
                    type: room.type,
                    status: room.status,
                },
                role: participant.role,
                participants: room.participants.map((p) => ({
                    userId: p.user.id,
                    username: p.user.username,
                    role: p.role,
                    isOnline: p.user.isOnline,
                })),
            },
        });

        // Notify others in the room
        connectionManager.broadcastToRoom(room.id, {
            type: MessageType.PLAYER_JOINED,
            payload: {
                userId: connection.userId,
                username: connection.username,
                role: participant.role,
            },
        });

        console.log(
            `🎮 ${connection.username} joined room ${room.code} as ${participant.role}`
        );
    } catch (error: any) {
        connectionManager.sendToClient(ws, {
            type: MessageType.ERROR,
            payload: {
                message: 'Failed to join room: ' + error.message,
                code: 'JOIN_ROOM_FAILED',
            },
        });
    }
}

/**
 * Handle user leaving a room
 */
export async function handleLeaveRoom(ws: ServerWebSocket): Promise<void> {
    const connection = connectionManager.getConnection(ws);

    if (!connection || !connection.roomId) {
        return;
    }

    const roomId = connection.roomId;
    const userId = connection.userId;
    const username = connection.username;

    try {
        // Leave room via service
        await roomService.leaveRoom(roomId, userId);

        // Remove from connection manager
        connectionManager.leaveRoom(ws, roomId);

        // Notify others
        connectionManager.broadcastToRoom(roomId, {
            type: MessageType.PLAYER_LEFT,
            payload: {
                userId,
                username,
            },
        });

        console.log(`👋 ${username} left room ${roomId}`);
    } catch (error: any) {
        console.error('Error leaving room:', error);
    }
}