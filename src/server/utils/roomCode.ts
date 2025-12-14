import { db } from '../db';
import { rooms } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate a random 6-character room code
 */
export function generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Generate a unique room code (checks database for duplicates)
 */
export async function generateUniqueRoomCode(): Promise<string> {
    let code = generateRandomCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Keep trying until we get a unique code
    while (attempts < maxAttempts) {
        const existingRoom = await db.query.rooms.findFirst({
            where: eq(rooms.code, code),
        });

        if (!existingRoom) {
            return code;
        }

        code = generateRandomCode();
        attempts++;
    }

    // If we can't generate unique code after max attempts, throw error
    throw new Error('Unable to generate unique room code. Please try again.');
}