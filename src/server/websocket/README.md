# WebSocket Module

This directory contains the real-time communication layer for the Tic-Tac-Toe Multiplayer application. It is built using [Bun's native WebSocket support](https://bun.sh/docs/api/websockets) and handles all live game interactions, room management, and player updates.

## 📂 Directory Structure

```
src/server/websocket/
├── handlers/           # Business logic for specific message types
│   ├── connectionHandler.ts  # Authentication & Disconnection
│   ├── gameHandler.ts        # Game moves & state management
│   └── roomHandler.ts        # Room joining/leaving
├── manager.ts          # Connection & Room state manager
├── server.ts           # WebSocket server entry point & routing
└── types.ts            # TypeScript definitions & Message enums
```

## 🔄 How it Works

The WebSocket server provides a bi-directional communication channel between players and the server. It is essential for:
1.  **Instant Game Updates**: Reflecting moves immediately to the opponent and spectators.
2.  **Room Synchronization**: Showing who joins/leaves the lobby in real-time.
3.  **Presence**: Tracking which users are online.

### Architecture

1.  **Entry Point (`server.ts`)**:
    *   Exports `websocketHandlers` which hook into Bun's `serve()` function.
    *   Routes incoming JSON messages to specific handlers based on `message.type`.

2.  **Connection Manager (`manager.ts`)**:
    *   A singleton class that tracks all active WebSocket connections.
    *   Maps `WebSocket` instances to `User IDs` and `Rooms`.
    *   Provides utility methods like `broadcastToRoom`, `sendToUser`, and `joinRoom`.

3.  **Services Integration**:
    *   The WebSocket layer is **stateless regarding business rules**. It delegates actual logic (validating moves, updating DB) to the core services (`gameService`, `roomService`, `authService`).
    *   This ensures consistency between the REST API and WebSocket actions.

## 📡 WebSocket Protocol

Messages are JSON objects with the following structure:
```json
{
  "type": "MESSAGE_TYPE",
  "payload": { ...Data... }
}
```

### 1. Connection & Authentication
**Client** connects to `/ws`.
**Client** sends `AUTHENTICATE`:
```json
{
  "type": "AUTHENTICATE",
  "payload": { "token": "jwt_token_here" }
}
```
**Server** responds with `AUTHENTICATED` or `ERROR`.

### 2. Room Management
**Client** sends `JOIN_ROOM`:
```json
{
  "type": "JOIN_ROOM",
  "payload": { "roomCode": "123456" }
}
```
**Server** broadcasts `PLAYER_JOINED` to the room.

### 3. Gameplay
**Client** sends `START_GAME` (requires 2 players in room).
**Server** broadcasts `GAME_STARTED` with initial board.

**Client** sends `MAKE_MOVE`:
```json
{
  "type": "MAKE_MOVE",
  "payload": { "gameId": "uuid", "position": 4 }
}
```
**Server** broadcasts `MOVE_MADE` (with updated board) or `GAME_OVER` (if win/draw).

## 📜 Message Types

defined in `types.ts`:

| Message Type | Direction | Description |
|--------------|-----------|-------------|
| `AUTHENTICATE` | ➡️ C to S | Send JWT to verify identity |
| `AUTHENTICATED` | ⬅️ S to C | Auth success |
| `JOIN_ROOM` | ➡️ C to S | Request to join a lobby |
| `PLAYER_JOINED` | ⬅️ S to C | Notification that someone entered |
| `START_GAME` | ➡️ C to S | Request to begin match |
| `GAME_STARTED` | ⬅️ S to C | Match begun, board initialized |
| `MAKE_MOVE` | ➡️ C to S | Player clicked a cell |
| `MOVE_MADE` | ⬅️ S to C | Board update after move |
| `GAME_OVER` | ⬅️ S to C | Game finished (Win/Draw) |
| `ERROR` | ⬅️ S to C | Something went wrong |

## 🛠 Usage in System

This module is imported in `src/server/index.ts` and passed to Bun's `serve` options:

```typescript
Bun.serve({
  fetch(req, server) {
    if (server.upgrade(req)) return; // Upgrade to WebSocket
    // ... handle HTTP
  },
  websocket: websocketHandlers, // <-- From ./websocket/server.ts
});
```
