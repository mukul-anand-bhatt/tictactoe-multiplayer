import { authRoutes } from './api/routes/auth';
import { roomRoutes } from './api/routes/room';

const PORT = process.env.PORT || 3000;

const server = Bun.serve({
    port: PORT,

    async fetch(req) {
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

        // Auth routes
        if (path.startsWith('/api/auth')) {
            return authRoutes(req);
        }

        // Room routes
        if (path.startsWith('/api/rooms')) {
            return roomRoutes(req);
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
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            h1 { color: #333; }
            .endpoint { background: #f4f4f4; padding: 10px; margin: 10px 0; border-radius: 5px; }
            .method { font-weight: bold; color: #0066cc; }
          </style>
        </head>
        <body>
          <h1>🎮 Tic Tac Toe Multiplayer API</h1>
          <p>Server is running!</p>
          
          <h2>🔐 Auth Endpoints:</h2>
          <div class="endpoint"><span class="method">POST</span> /api/auth/signup</div>
          <div class="endpoint"><span class="method">POST</span> /api/auth/signin</div>
          <div class="endpoint"><span class="method">GET</span> /api/auth/me (protected)</div>
          
          <h2>🏠 Room Endpoints:</h2>
          <div class="endpoint"><span class="method">POST</span> /api/rooms/create (protected)</div>
          <div class="endpoint"><span class="method">POST</span> /api/rooms/join (protected)</div>
          <div class="endpoint"><span class="method">POST</span> /api/rooms/matchmaking (protected)</div>
          <div class="endpoint"><span class="method">GET</span> /api/rooms/public</div>
          <div class="endpoint"><span class="method">GET</span> /api/rooms/my (protected)</div>
          <div class="endpoint"><span class="method">GET</span> /api/rooms/:code</div>
          <div class="endpoint"><span class="method">DELETE</span> /api/rooms/:roomId/leave (protected)</div>
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
});

console.log(`
🚀 Server running on http://localhost:${PORT}

📝 Auth Endpoints:
   POST http://localhost:${PORT}/api/auth/signup
   POST http://localhost:${PORT}/api/auth/signin
   GET  http://localhost:${PORT}/api/auth/me

🏠 Room Endpoints:
   POST   http://localhost:${PORT}/api/rooms/create
   POST   http://localhost:${PORT}/api/rooms/join
   POST   http://localhost:${PORT}/api/rooms/matchmaking
   GET    http://localhost:${PORT}/api/rooms/public
   GET    http://localhost:${PORT}/api/rooms/my
   GET    http://localhost:${PORT}/api/rooms/:code
   DELETE http://localhost:${PORT}/api/rooms/:roomId/leave

💡 Health check: http://localhost:${PORT}/health
`);