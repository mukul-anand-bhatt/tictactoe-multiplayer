import { ServerWebSocket } from 'bun';
import { connectionManager } from '../manager';
import { MessageType, AuthenticatePayload } from '../types';
import { verifyToken } from '../../utils/jwt';
import { authService } from '../../services/authService';
import { roomService } from '../../services/roomService';

/**
 * Handle WebSocket authentication
 */
export async function handleAuthenticate(
    ws: ServerWebSocket,
    payload: AuthenticatePayload
): Promise<void> {
    try {
        // Verify JWT token
        const decoded = verifyToken(payload.token);

        let userName = decoded.userName;

        // Fallback: If username is missing in token, fetch from DB
        if (!userName) {
            try {
                const user = await authService.getUserById(decoded.userId);
                userName = user.username;
            } catch (err) {
                console.error('Failed to fetch user during auth:', err);
                throw new Error('User not found');
            }
        }

        // Update user online status
        await authService.updateOnlineStatus(decoded.userId, true);

        // Add connection to manager
        connectionManager.addConnection(ws, decoded.userId, userName);

        // Send success response
        connectionManager.sendToClient(ws, {
            type: MessageType.AUTHENTICATED,
            payload: {
                userId: decoded.userId,
                userName: userName,
            },
        });
    } catch (error: any) {
        connectionManager.sendToClient(ws, {
            type: MessageType.ERROR,
            payload: {
                message: 'Authentication failed: ' + error.message,
                code: 'AUTH_FAILED',
            },
        });

        // Close connection after 1 second
        setTimeout(() => ws.close(), 1000);
    }
}

/**
 * Handle WebSocket disconnection
 */
export async function handleDisconnect(ws: ServerWebSocket): Promise<void> {
    const connection = connectionManager.getConnection(ws);

    if (connection) {
        // Notify room if user was in one
        if (connection.roomId) {
            try {
                // Remove from DB first
                await roomService.leaveRoom(connection.roomId, connection.userId);
            } catch (error) {
                console.error('Error leaving room in DB:', error);
            }

            connectionManager.broadcastToRoom(connection.roomId, {
                type: MessageType.PLAYER_LEFT,
                payload: {
                    userId: connection.userId,
                    username: connection.username,
                    role: connection.role,
                },
            });
        }

        // Update user online status
        try {
            await authService.updateOnlineStatus(connection.userId, false);
        } catch (error) {
            console.error('Error updating online status:', error);
        }

        // Remove connection
        connectionManager.removeConnection(ws);
    }
}