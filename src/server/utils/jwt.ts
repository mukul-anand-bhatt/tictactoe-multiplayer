import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN! || '7d';

if (!JWT_EXPIRES_IN) {
    throw new Error('JWT_EXPIRES_IN is not defined in the .env');
}

export interface JWTPayload {
    userId: string;
    userName: string;
    email: string;
}

export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN as any,
    });
}

export function verifyToken(token: string): JWTPayload {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    }
    catch (error) {
        throw new Error('Invalid token');
    }
}







