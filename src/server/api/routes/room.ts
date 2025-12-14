import { roomService } from '../../services/roomService';
import { requireAuth } from '../middlewares/auth';

/**
 * Handle room-related routes
 */
export async function roomRoutes(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    try {
        // POST /api/rooms/create - Create a new room
        if (path === '/api/rooms/create' && req.method === 'POST') {
            return requireAuth(req, async (req, user) => {
                const body = await req.json() as {
                    type?: 'public' | 'private';
                    maxPlayers?: number;
                    maxSpectators?: number;
                };

                const room = await roomService.createRoom({
                    type: body.type || 'public',
                    userId: user.userId,
                    maxPlayers: body.maxPlayers?.toString(),
                    maxSpectators: body.maxSpectators?.toString(),
                });

                return new Response(
                    JSON.stringify({
                        success: true,
                        data: room,
                    }),
                    { status: 201, headers }
                );
            });
        }

        // POST /api/rooms/join - Join a room by code
        if (path === '/api/rooms/join' && req.method === 'POST') {
            return requireAuth(req, async (req, user) => {
                const body = await req.json() as {
                    code: string;
                    role?: 'player1' | 'player2' | 'spectator';
                };

                if (!body.code) {
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: 'Room code is required',
                        }),
                        { status: 400, headers }
                    );
                }

                const room = await roomService.joinRoom({
                    roomCode: body.code,
                    userId: user.userId,
                    role: body.role,
                });

                return new Response(
                    JSON.stringify({
                        success: true,
                        data: room,
                    }),
                    { status: 200, headers }
                );
            });
        }

        // POST /api/rooms/matchmaking - Find or create public room
        if (path === '/api/rooms/matchmaking' && req.method === 'POST') {
            return requireAuth(req, async (req, user) => {
                const room = await roomService.findOrCreatePublicRoom(user.userId);

                return new Response(
                    JSON.stringify({
                        success: true,
                        data: room,
                    }),
                    { status: 200, headers }
                );
            });
        }

        // GET /api/rooms/public - Get all public rooms
        if (path === '/api/rooms/public' && req.method === 'GET') {
            const rooms = await roomService.getPublicRooms();

            return new Response(
                JSON.stringify({
                    success: true,
                    data: rooms,
                }),
                { status: 200, headers }
            );
        }

        // GET /api/rooms/my - Get user's active rooms
        if (path === '/api/rooms/my' && req.method === 'GET') {
            return requireAuth(req, async (req, user) => {
                const rooms = await roomService.getUserRooms(user.userId);

                return new Response(
                    JSON.stringify({
                        success: true,
                        data: rooms,
                    }),
                    { status: 200, headers }
                );
            });
        }

        // GET /api/rooms/:code - Get room by code
        if (path.startsWith('/api/rooms/') && req.method === 'GET') {
            const code = path.split('/').pop();

            if (!code) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: 'Room code is required',
                    }),
                    { status: 400, headers }
                );
            }

            const room = await roomService.getRoomByCode(code);

            return new Response(
                JSON.stringify({
                    success: true,
                    data: room,
                }),
                { status: 200, headers }
            );
        }

        // DELETE /api/rooms/:roomId/leave - Leave a room
        if (path.match(/\/api\/rooms\/[^/]+\/leave$/) && req.method === 'DELETE') {
            return requireAuth(req, async (req, user) => {
                const roomId = path.split('/')[3];

                const result = await roomService.leaveRoom(roomId, user.userId);

                return new Response(
                    JSON.stringify({
                        success: true,
                        data: result,
                    }),
                    { status: 200, headers }
                );
            });
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
        console.error('Room route error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Internal server error',
            }),
            { status: 400, headers }
        );
    }
}