# tictactoe-multiplayer

To install dependencies:

```bash
bun install
```

tictactoe-multiplayer/
├── .env                           # Environment variables
├── .gitignore                     # Git ignore file
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript configuration
├── drizzle.config.ts              # Drizzle ORM configuration
├── bun.lockb                      # Bun lock file (auto-generated)
│
├── drizzle/                       # Auto-generated migrations
│   └── [migration files]
│
└── src/
    │
    ├── server/
    │   │
    │   ├── index.ts               # 🟢 Main server entry (HTTP + WebSocket)
    │   │
    │   ├── db/
    │   │   ├── index.ts           # 🟢 Database client instance
    │   │   └── schema.ts          # 🟢 Drizzle schema (already done!)
    │   │
    │   ├── services/
    │   │   ├── authService.ts     # 🔐 Auth logic (signup, signin, JWT)
    │   │   ├── roomService.ts     # 🏠 Room CRUD operations
    │   │   ├── gameService.ts     # 🎮 Game logic & state management
    │   │   ├── inviteService.ts   # 💌 Invitation system
    │   │   └── userService.ts     # 👤 User operations
    │   │
    │   ├── api/
    │   │   ├── routes/
    │   │   │   ├── auth.ts        # POST /api/auth/signup, /signin
    │   │   │   ├── rooms.ts       # POST /api/rooms/create, GET /api/rooms/:code
    │   │   │   ├── invites.ts     # POST /api/invites/send, GET /api/invites/pending
    │   │   │   ├── games.ts       # GET /api/games/history
    │   │   │   └── users.ts       # GET /api/users/me, /api/users/search
    │   │   │
    │   │   └── middleware/
    │   │       ├── auth.ts        # JWT token verification
    │   │       └── errorHandler.ts # Error handling
    │   │
    │   ├── websocket/
    │   │   ├── server.ts          # 🔌 WebSocket server setup
    │   │   ├── manager.ts         # 📡 Connection manager (tracks users/rooms)
    │   │   │
    │   │   ├── handlers/
    │   │   │   ├── connectionHandler.ts  # Handle connect/disconnect
    │   │   │   ├── roomHandler.ts        # JOIN_ROOM, LEAVE_ROOM
    │   │   │   ├── gameHandler.ts        # MAKE_MOVE, GAME_STATE
    │   │   │   └── inviteHandler.ts      # SEND_INVITE, ACCEPT_INVITE
    │   │   │
    │   │   └── types.ts           # WebSocket message types & interfaces
    │   │
    │   ├── models/
    │   │   └── TicTacToe.ts       # 🎯 Game logic class (win check, moves)
    │   │
    │   └── utils/
    │       ├── jwt.ts             # JWT token generation/verification
    │       ├── bcrypt.ts          # Password hashing
    │       ├── validators.ts      # Input validation helpers
    │       └── roomCode.ts        # Generate unique room codes
    │
    └── client/
        ├── index.html             # 🌐 Main HTML file
        ├── styles/
        │   └── main.css           # 🎨 Styles
        │
        └── ts/
            ├── main.ts            # Client entry point
            ├── config.ts          # API & WebSocket URLs
            │
            ├── api/
            │   └── client.ts      # HTTP API wrapper
            │
            ├── websocket/
            │   ├── client.ts      # WebSocket client manager
            │   └── handlers.ts    # Handle incoming WS messages
            │
            ├── components/
            │   ├── Auth.ts        # Login/Signup UI
            │   ├── Lobby.ts       # Room list & matchmaking
            │   ├── Room.ts        # Room/Party management
            │   ├── Board.ts       # Tic-Tac-Toe board
            │   ├── Invites.ts     # Invitation notifications
            │   └── GameHistory.ts # Past games list
            │
            ├── state/
            │   └── store.ts       # Client-side state management
            │
            └── utils/
                └── helpers.ts     # Utility functions




To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.3. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
