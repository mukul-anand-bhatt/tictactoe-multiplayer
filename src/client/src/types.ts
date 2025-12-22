export const MessageType = {
    // Connection
    AUTHENTICATE: 'AUTHENTICATE',
    AUTHENTICATED: 'AUTHENTICATED',

    // Room events
    JOIN_ROOM: 'JOIN_ROOM',
    LEAVE_ROOM: 'LEAVE_ROOM',
    ROOM_JOINED: 'ROOM_JOINED',
    PLAYER_JOINED: 'PLAYER_JOINED',
    PLAYER_LEFT: 'PLAYER_LEFT',
    ROOM_UPDATED: 'ROOM_UPDATED',

    // Game events
    START_GAME: 'START_GAME',
    GAME_STARTED: 'GAME_STARTED',
    MAKE_MOVE: 'MAKE_MOVE',
    MOVE_MADE: 'MOVE_MADE',
    GAME_STATE: 'GAME_STATE',
    GAME_OVER: 'GAME_OVER',

    // Errors
    ERROR: 'ERROR',
} as const;

export type MessageType = typeof MessageType[keyof typeof MessageType];

export interface WebSocketMessage {
    type: MessageType;
    payload?: any;
    timestamp?: number;
}

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
