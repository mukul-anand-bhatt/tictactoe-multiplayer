import { ServerWebSocket } from 'bun';

// Message types that can be sent between client and server
export enum MessageType {
    // Connection
    AUTHENTICATE = 'AUTHENTICATE',
    AUTHENTICATED = 'AUTHENTICATED',

    // Room events
    JOIN_ROOM = 'JOIN_ROOM',
    LEAVE_ROOM = 'LEAVE_ROOM',
    ROOM_JOINED = 'ROOM_JOINED',
    PLAYER_JOINED = 'PLAYER_JOINED',
    PLAYER_LEFT = 'PLAYER_LEFT',
    ROOM_UPDATED = 'ROOM_UPDATED',

    // Game events
    START_GAME = 'START_GAME',
    GAME_STARTED = 'GAME_STARTED',
    MAKE_MOVE = 'MAKE_MOVE',
    MOVE_MADE = 'MOVE_MADE',
    GAME_STATE = 'GAME_STATE',
    GAME_OVER = 'GAME_OVER',

    // Errors
    ERROR = 'ERROR',
}

// Generic WebSocket message structure
export interface WebSocketMessage {
    type: MessageType;
    payload?: any;
    timestamp?: number;
}

// Client connection data
export interface ClientConnection {
    ws: ServerWebSocket;
    userId: string;
    username: string;
    roomId?: string;
    role?: 'player1' | 'player2' | 'spectator';
}

// Message payloads for type safety
export interface AuthenticatePayload {
    token: string;
}

export interface JoinRoomPayload {
    roomCode: string;
}

export interface MakeMovePayload {
    gameId: string;
    position: number;
}

export interface ErrorPayload {
    message: string;
    code?: string;
}