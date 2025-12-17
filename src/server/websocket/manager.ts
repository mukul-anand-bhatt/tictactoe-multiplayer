import { ServerWebSocket } from 'bun';
import { ClientConnection, WebSocketMessage, MessageType } from './types';

/**
 * Manages all WebSocket connections, rooms, and user presence
 */
export class ConnectionManager {
    // Map of WebSocket -> ClientConnection
    private connections: Map<ServerWebSocket, ClientConnection>;

    // Map of userId -> ClientConnection (for finding users)
    private userConnections: Map<string, ClientConnection>;

    // Map of roomId -> Set of WebSockets (for room broadcasting)
    private rooms: Map<string, Set<ServerWebSocket>>;

    constructor() {
        this.connections = new Map();
        this.userConnections = new Map();
        this.rooms = new Map();
    }

    /**
     * Add a new connection after authentication
     */
    addConnection(ws: ServerWebSocket, userId: string, username: string): void {
        const connection: ClientConnection = {
            ws,
            userId,
            username,
        };

        this.connections.set(ws, connection);
        this.userConnections.set(userId, connection);

        console.log(`✅ User connected: ${username} (${userId})`);
    }

    /**
     * Get connection by WebSocket
     */
    getConnection(ws: ServerWebSocket): ClientConnection | undefined {
        return this.connections.get(ws);
    }

    /**
     * Get connection by user ID
     */
    getConnectionByUserId(userId: string): ClientConnection | undefined {
        return this.userConnections.get(userId);
    }

    /**
     * Remove a connection
     */
    removeConnection(ws: ServerWebSocket): void {
        const connection = this.connections.get(ws);

        if (connection) {
            // Remove from room if in one
            if (connection.roomId) {
                this.leaveRoom(ws, connection.roomId);
            }

            // Remove from maps
            this.userConnections.delete(connection.userId);
            this.connections.delete(ws);

            console.log(`❌ User disconnected: ${connection.username}`);
        }
    }

    /**
     * Add user to a room
     */
    joinRoom(
        ws: ServerWebSocket,
        roomId: string,
        role: 'player1' | 'player2' | 'spectator'
    ): void {
        const connection = this.connections.get(ws);
        if (!connection) return;

        // Create room set if it doesn't exist
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }

        // Add to room
        this.rooms.get(roomId)!.add(ws);
        connection.roomId = roomId;
        connection.role = role;

        console.log(
            `🏠 ${connection.username} joined room ${roomId} as ${role}`
        );
    }

    /**
     * Remove user from a room
     */
    leaveRoom(ws: ServerWebSocket, roomId: string): void {
        const connection = this.connections.get(ws);
        const room = this.rooms.get(roomId);

        if (room) {
            room.delete(ws);

            // Delete room if empty
            if (room.size === 0) {
                this.rooms.delete(roomId);
                console.log(`🗑️  Room ${roomId} is now empty and removed`);
            }
        }

        if (connection) {
            connection.roomId = undefined;
            connection.role = undefined;
            console.log(`👋 ${connection.username} left room ${roomId}`);
        }
    }

    /**
     * Broadcast message to all users in a room
     */
    broadcastToRoom(roomId: string, message: WebSocketMessage): void {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const messageStr = JSON.stringify({
            ...message,
            timestamp: Date.now(),
        });

        let sentCount = 0;
        room.forEach((ws) => {
            try {
                ws.send(messageStr);
                sentCount++;
            } catch (error) {
                console.error('Error sending message to client:', error);
            }
        });

        console.log(
            `📢 Broadcast to room ${roomId}: ${message.type} (${sentCount} recipients)`
        );
    }

    /**
     * Send message to a specific user
     */
    sendToUser(userId: string, message: WebSocketMessage): void {
        const connection = this.userConnections.get(userId);
        if (!connection) return;

        try {
            connection.ws.send(
                JSON.stringify({
                    ...message,
                    timestamp: Date.now(),
                })
            );
        } catch (error) {
            console.error('Error sending message to user:', error);
        }
    }

    /**
     * Send message to a specific WebSocket
     */
    sendToClient(ws: ServerWebSocket, message: WebSocketMessage): void {
        try {
            ws.send(
                JSON.stringify({
                    ...message,
                    timestamp: Date.now(),
                })
            );
        } catch (error) {
            console.error('Error sending message to client:', error);
        }
    }

    /**
     * Get all users in a room
     */
    getRoomUsers(roomId: string): ClientConnection[] {
        const room = this.rooms.get(roomId);
        if (!room) return [];

        return Array.from(room)
            .map((ws) => this.connections.get(ws))
            .filter((conn): conn is ClientConnection => conn !== undefined);
    }

    /**
     * Check if user is in a room
     */
    isUserInRoom(userId: string, roomId: string): boolean {
        const connection = this.userConnections.get(userId);
        return connection?.roomId === roomId;
    }

    /**
     * Get total connected users
     */
    getConnectionCount(): number {
        return this.connections.size;
    }

    /**
     * Get total active rooms
     */
    getRoomCount(): number {
        return this.rooms.size;
    }

    /**
     * Get all online user IDs
     */
    getOnlineUserIds(): string[] {
        return Array.from(this.userConnections.keys());
    }
}

// Singleton instance
export const connectionManager = new ConnectionManager();