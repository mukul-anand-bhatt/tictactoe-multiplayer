import { gameService } from '../../services/gameService';
import { requireAuth } from '../middlewares/auth';

/**
 * Handle game-related routes
 */
export async function gameRoutes(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    try {
        // GET /api/games/history - Get user's game history
        if (path === '/api/games/history' && req.method === 'GET') {
            return requireAuth(req, async (req, user) => {
                const games = await gameService.getUserGameHistory(user.userId);

                return new Response(
                    JSON.stringify({
                        success: true,
                        data: games,
                    }),
                    { status: 200, headers }
                );
            });
        }

        // GET /api/games/stats - Get user's game statistics
        if (path === '/api/games/stats' && req.method === 'GET') {
            return requireAuth(req, async (req, user) => {
                const stats = await gameService.getUserStats(user.userId);

                return new Response(
                    JSON.stringify({
                        success: true,
                        data: stats,
                    }),
                    { status: 200, headers }
                );
            });
        }

        // GET /api/games/:id - Get specific game
        if (path.startsWith('/api/games/') && req.method === 'GET') {
            const gameId = path.split('/').pop();

            if (!gameId || gameId === 'history' || gameId === 'stats') {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: 'Invalid game ID',
                    }),
                    { status: 400, headers }
                );
            }

            const game = await gameService.getGameById(gameId);

            return new Response(
                JSON.stringify({
                    success: true,
                    data: game,
                }),
                { status: 200, headers }
            );
        }

        // Route not found
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Route not found',
            }),
            { status: 404, headers }
        );
    } catch (error: any) {
        console.error('Game route error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Internal server error',
            }),
            { status: 400, headers }
        );
    }
}