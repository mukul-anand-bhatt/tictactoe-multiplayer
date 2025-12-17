import { authRoutes } from './api/routes/auth';
import { roomRoutes } from './api/routes/room';
import { gameRoutes } from './api/routes/game';
import { websocketHandlers } from './websocket/server';
import { connectionManager } from './websocket/manager';

const PORT = process.env.PORT || 3000;

const server = Bun.serve({
    port: PORT,

    async fetch(req, server) {
        const url = new URL(req.url);
        const path = url.pathname;

        // CORS headers for all responses
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders,
            });
        }

        // WebSocket upgrade
        if (path === '/ws') {
            const upgraded = server.upgrade(req);
            if (upgraded) {
                return undefined; // Return undefined on successful upgrade
            }
            return new Response('WebSocket upgrade failed', { status: 400 });
        }

        // Auth routes
        if (path.startsWith('/api/auth')) {
            return authRoutes(req);
        }

        // Room routes
        if (path.startsWith('/api/rooms')) {
            return roomRoutes(req);
        }

        // Game routes
        if (path.startsWith('/api/games')) {
            return gameRoutes(req);
        }

        // Server stats (for monitoring)
        if (path === '/api/stats') {
            return new Response(
                JSON.stringify({
                    success: true,
                    data: {
                        connectedUsers: connectionManager.getConnectionCount(),
                        activeRooms: connectionManager.getRoomCount(),
                        timestamp: new Date().toISOString(),
                    },
                }),
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                }
            );
        }

        // Health check
        if (path === '/health') {
            return new Response(
                JSON.stringify({
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                }),
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                }
            );
        }

        // Serve frontend
        if (path === '/') {
            return new Response(
                `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tic Tac Toe - Multiplayer</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              max-width: 900px; 
              margin: 50px auto; 
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #333; margin-bottom: 10px; }
            .subtitle { color: #666; margin-bottom: 30px; }
            h2 { 
              color: #0066cc; 
              margin-top: 30px;
              border-bottom: 2px solid #0066cc;
              padding-bottom: 10px;
            }
            .endpoint { 
              background: #f8f9fa; 
              padding: 12px 15px; 
              margin: 8px 0; 
              border-radius: 5px;
              border-left: 4px solid #0066cc;
              font-family: 'Courier New', monospace;
            }
            .method { 
              font-weight: bold; 
              color: #0066cc; 
              margin-right: 10px;
            }
            .protected {
              color: #dc3545;
              font-size: 12px;
              margin-left: 10px;
            }
            .stats {
              background: #e3f2fd;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎮 Tic Tac Toe Multiplayer</h1>
            <p class="subtitle">Real-time multiplayer game with WebSocket support</p>
            
            <div class="stats">
              <strong>🟢 Server Status:</strong> Running<br>
              <strong>📊 Stats:</strong> <a href="/api/stats">View live stats</a>
            </div>

            <h2>🔐 Authentication Endpoints</h2>
            <div class="endpoint"><span class="method">POST</span> /api/auth/signup</div>
            <div class="endpoint"><span class="method">POST</span> /api/auth/signin</div>
            <div class="endpoint"><span class="method">GET</span> /api/auth/me <span class="protected">🔒 Protected</span></div>
            
            <h2>🏠 Room Endpoints</h2>
            <div class="endpoint"><span class="method">POST</span> /api/rooms/create <span class="protected">🔒 Protected</span></div>
            <div class="endpoint"><span class="method">POST</span> /api/rooms/join <span class="protected">🔒 Protected</span></div>
            <div class="endpoint"><span class="method">POST</span> /api/rooms/matchmaking <span class="protected">🔒 Protected</span></div>
            <div class="endpoint"><span class="method">GET</span> /api/rooms/public</div>
            <div class="endpoint"><span class="method">GET</span> /api/rooms/my <span class="protected">🔒 Protected</span></div>
            <div class="endpoint"><span class="method">GET</span> /api/rooms/:code</div>
            <div class="endpoint"><span class="method">DELETE</span> /api/rooms/:roomId/leave <span class="protected">🔒 Protected</span></div>

            <h2>🎮 Game Endpoints</h2>
            <div class="endpoint"><span class="method">GET</span> /api/games/history <span class="protected">🔒 Protected</span></div>
            <div class="endpoint"><span class="method">GET</span> /api/games/stats <span class="protected">🔒 Protected</span></div>
            <div class="endpoint"><span class="method">GET</span> /api/games/:id</div>

            <h2>🔌 WebSocket</h2>
            <div class="endpoint"><span class="method">WS</span> /ws <span class="protected">🔒 Requires token</span></div>
            <p style="margin-top: 10px; color: #666; font-size: 14px;">
              Connect with: <code>ws://localhost:${PORT}/ws</code>
            </p>
          </div>
        </body>
        </html>
      `,
                {
                    headers: {
                        'Content-Type': 'text/html',
                        ...corsHeaders,
                    },
                }
            );
        }

        // 404
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Not found',
            }),
            {
                status: 404,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            }
        );
    },

    // WebSocket handlers
    websocket: websocketHandlers,
});

console.log(`
╔════════════════════════════════════════════════════════════╗
║  🎮 TIC TAC TOE MULTIPLAYER SERVER                         ║
╚════════════════════════════════════════════════════════════╝

🚀 Server running on http://localhost:${PORT}
🔌 WebSocket endpoint: ws://localhost:${PORT}/ws

📝 HTTP Endpoints:
   Auth:
     POST   /api/auth/signup
     POST   /api/auth/signin
     GET    /api/auth/me 🔒

   Rooms:
     POST   /api/rooms/create 🔒
     POST   /api/rooms/join 🔒
     POST   /api/rooms/matchmaking 🔒
     GET    /api/rooms/public
     GET    /api/rooms/my 🔒
     GET    /api/rooms/:code
     DELETE /api/rooms/:roomId/leave 🔒

   Games:
     GET    /api/games/history 🔒
     GET    /api/games/stats 🔒
     GET    /api/games/:id

📊 Stats: http://localhost:${PORT}/api/stats
💚 Health: http://localhost:${PORT}/health

🔒 = Requires JWT token in Authorization header
`);