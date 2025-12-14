import { verifyToken, JWTPayload } from '../../utils/jwt';

export interface AuthRequest extends Request {
    user?: JWTPayload;
}

/**
 * Extract and verify JWT token from Authorization header
 */
export function authenticateToken(req: Request): JWTPayload {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
        const payload = verifyToken(token);
        return payload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

/**
 * Middleware wrapper for protected routes
 */
export async function requireAuth(
    req: Request,
    handler: (req: Request, user: JWTPayload) => Promise<Response>
): Promise<Response> {
    try {
        const user = authenticateToken(req);
        return await handler(req, user);
    } catch (error: any) {
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Unauthorized',
            }),
            {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}