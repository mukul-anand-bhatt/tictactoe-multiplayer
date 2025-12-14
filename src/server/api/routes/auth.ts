import { authService } from '../../services/authService';
import { requireAuth } from '../middlewares/auth';

/**
 * Handle auth-related routes
 */
export async function authRoutes(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    try {
        // POST /api/auth/signup
        if (path === '/api/auth/signup' && req.method === 'POST') {
            const body = await req.json();
            const result = await authService.signup(body as any);

            return new Response(
                JSON.stringify({
                    success: true,
                    data: result,
                }),
                { status: 201, headers }
            );
        }

        // POST /api/auth/signin
        if (path === '/api/auth/signin' && req.method === 'POST') {
            const body = await req.json();
            const result = await authService.signin(body as any);

            return new Response(
                JSON.stringify({
                    success: true,
                    data: result,
                }),
                { status: 200, headers }
            );
        }

        // GET /api/auth/me (protected)
        if (path === '/api/auth/me' && req.method === 'GET') {
            return requireAuth(req, async (req, user) => {
                const userData = await authService.getUserById(user.userId);

                return new Response(
                    JSON.stringify({
                        success: true,
                        data: userData,
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
        console.error('Auth route error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Internal server error',
            }),
            { status: 400, headers }
        );
    }
}