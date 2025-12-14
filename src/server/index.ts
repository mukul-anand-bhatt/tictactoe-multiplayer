import { authRoutes } from './api/routes/auth';

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

        // Serve frontend (for now, just a placeholder)
        if (path === '/') {
            return new Response(
                `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tic Tac Toe - Multiplayer</title>
        </head>
        <body>
          <h1>🎮 Tic Tac Toe Multiplayer</h1>
          <p>Server is running!</p>
          <h2>API Endpoints:</h2>
          <ul>
            <li>POST /api/auth/signup</li>
            <li>POST /api/auth/signin</li>
            <li>GET /api/auth/me (requires token)</li>
          </ul>
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

📝 Available endpoints:
   POST http://localhost:${PORT}/api/auth/signup
   POST http://localhost:${PORT}/api/auth/signin
   GET  http://localhost:${PORT}/api/auth/me

💡 Health check: http://localhost:${PORT}/health
`);