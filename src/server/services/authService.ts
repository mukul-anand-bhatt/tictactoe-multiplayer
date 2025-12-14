import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateToken } from '../utils/jwt';
import { validateSignupData, validateSigninData } from '../utils/validators';

export interface SignupData {
    username: string;
    email: string;
    password: string;
}

export interface SigninData {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: {
        id: string;
        username: string;
        email: string;
        createdAt: Date;
    };
    token: string;
}

export class AuthService {
    /**
     * Register a new user
     */
    async signup(data: SignupData): Promise<AuthResponse> {
        // Validate input
        const validationErrors = validateSignupData(data);
        if (validationErrors.length > 0) {
            throw new Error(
                validationErrors.map((e) => e.message).join(', ')
            );
        }

        // Check if email already exists
        const existingEmail = await db.query.users.findFirst({
            where: eq(users.email, data.email.toLowerCase()),
        });

        if (existingEmail) {
            throw new Error('Email already registered');
        }

        // Check if username already exists
        const existingUsername = await db.query.users.findFirst({
            where: eq(users.username, data.username),
        });

        if (existingUsername) {
            throw new Error('Username already taken');
        }

        // Hash password
        const hashedPassword = await hashPassword(data.password);

        // Create user
        const [newUser] = await db
            .insert(users)
            .values({
                username: data.username,
                email: data.email.toLowerCase(),
                password: hashedPassword,
            })
            .returning();

        // Generate JWT token
        const token = generateToken({
            userId: newUser.id,
            userName: newUser.username,
            email: newUser.email,
        });

        return {
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                createdAt: newUser.createdAt,
            },
            token,
        };
    }

    /**
     * Login existing user
     */
    async signin(data: SigninData): Promise<AuthResponse> {
        // Validate input
        const validationErrors = validateSigninData(data);
        if (validationErrors.length > 0) {
            throw new Error(
                validationErrors.map((e) => e.message).join(', ')
            );
        }

        // Find user by email
        const user = await db.query.users.findFirst({
            where: eq(users.email, data.email.toLowerCase()),
        });

        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Verify password
        const isPasswordValid = await comparePassword(data.password, user.password);

        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        // Update online status
        await db
            .update(users)
            .set({ isOnline: true, lastSeen: new Date() })
            .where(eq(users.id, user.id));

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            userName: user.username,
            email: user.email,
        });

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
            },
            token,
        };
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            isOnline: user.isOnline,
            lastSeen: user.lastSeen,
            createdAt: user.createdAt,
        };
    }

    /**
     * Update user online status
     */
    async updateOnlineStatus(userId: string, isOnline: boolean) {
        await db
            .update(users)
            .set({
                isOnline,
                lastSeen: new Date(),
            })
            .where(eq(users.id, userId));
    }
}

export const authService = new AuthService();