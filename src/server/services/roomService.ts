import { db } from '../db';
import { rooms, roomParticipants, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { generateUniqueRoomCode } from '../utils/roomCode';

export interface CreateRoomData {
    type: 'public' | 'private';
    userId: string;
    maxPlayers?: string;
    maxSpectators?: string;
}

export interface JoinRoomData {
    roomCode: string;
    userId: string;
    role?: 'player1' | 'player2' | 'spectator';
}

export class RoomService {
    /**
     * Create a new room
     */
    async createRoom(data: CreateRoomData) {
        const roomCode = await generateUniqueRoomCode();

        // Create the room
        const [newRoom] = await db
            .insert(rooms)
            .values({
                code: roomCode,
                type: data.type,
                creatorId: data.userId,
                maxPlayers: data.maxPlayers || '2',
                maxSpectators: data.maxSpectators || '10',
                status: 'waiting',
            })
            .returning();

        // Add creator as player1
        await db.insert(roomParticipants).values({
            roomId: newRoom.id,
            userId: data.userId,
            role: 'player1',
            status: 'active',
        });

        // Get room with participants
        const roomWithDetails = await this.getRoomById(newRoom.id);

        return roomWithDetails;
    }

    /**
     * Get room by ID with all details
     */
    async getRoomById(roomId: string) {
        const room = await db.query.rooms.findFirst({
            where: eq(rooms.id, roomId),
            with: {
                creator: {
                    columns: {
                        id: true,
                        username: true,
                        isOnline: true,
                    },
                },
                participants: {
                    with: {
                        user: {
                            columns: {
                                id: true,
                                username: true,
                                isOnline: true,
                            },
                        },
                    },
                    where: eq(roomParticipants.status, 'active'),
                },
            },
        });

        if (!room) {
            throw new Error('Room not found');
        }

        return room;
    }

    /**
     * Get room by code
     */
    async getRoomByCode(code: string) {
        const room = await db.query.rooms.findFirst({
            where: eq(rooms.code, code.toUpperCase()),
            with: {
                creator: {
                    columns: {
                        id: true,
                        username: true,
                        isOnline: true,
                    },
                },
                participants: {
                    with: {
                        user: {
                            columns: {
                                id: true,
                                username: true,
                                isOnline: true,
                            },
                        },
                    },
                    where: eq(roomParticipants.status, 'active'),
                },
            },
        });

        if (!room) {
            throw new Error('Room not found');
        }

        return room;
    }

    /**
     * Join a room
     */
    async joinRoom(data: JoinRoomData) {
        const room = await this.getRoomByCode(data.roomCode);

        // Check if user is already in the room
        const existingParticipant = room.participants.find(
            (p) => p.userId === data.userId
        );

        if (existingParticipant) {
            // User already in room, just return the room
            return room;
        }

        // Check if room is private and user has permission (we'll check invites later)
        if (room.type === 'private' && room.creatorId !== data.userId) {
            // For now, allow joining private rooms with code
            // Later we'll add invite verification
        }

        // Determine the role for the new participant
        // Check which roles are taken
        const isPlayer1Taken = room.participants.some(p => p.role === 'player1');
        const isPlayer2Taken = room.participants.some(p => p.role === 'player2');

        let role: 'player1' | 'player2' | 'spectator';

        if (data.role) {
            role = data.role;
        } else if (!isPlayer1Taken) {
            role = 'player1';
        } else if (!isPlayer2Taken) {
            role = 'player2';
        } else {
            role = 'spectator';
        }

        // Add user to room
        await db.insert(roomParticipants).values({
            roomId: room.id,
            userId: data.userId,
            role,
            status: 'active',
        });

        // If we now have 2 players, update room status to playing
        if (role === 'player2') {
            await db
                .update(rooms)
                .set({
                    status: 'playing',
                    startedAt: new Date(),
                })
                .where(eq(rooms.id, room.id));
        }

        // Return updated room
        return await this.getRoomById(room.id);
    }

    /**
     * Leave a room
     */
    async leaveRoom(roomId: string, userId: string) {
        // Update participant status
        await db
            .update(roomParticipants)
            .set({
                status: 'left',
                leftAt: new Date(),
            })
            .where(
                and(
                    eq(roomParticipants.roomId, roomId),
                    eq(roomParticipants.userId, userId)
                )
            );

        // Check if room should be closed
        const activeParticipants = await db.query.roomParticipants.findMany({
            where: and(
                eq(roomParticipants.roomId, roomId),
                eq(roomParticipants.status, 'active')
            ),
        });

        // If no active participants, close the room
        if (activeParticipants.length === 0) {
            await db
                .update(rooms)
                .set({
                    status: 'finished',
                    closedAt: new Date(),
                })
                .where(eq(rooms.id, roomId));
        }

        return { success: true };
    }

    /**
     * Get all public rooms that are waiting for players
     */
    async getPublicRooms() {
        const publicRooms = await db.query.rooms.findMany({
            where: and(
                eq(rooms.type, 'public'),
                eq(rooms.status, 'waiting')
            ),
            with: {
                creator: {
                    columns: {
                        id: true,
                        username: true,
                        isOnline: true,
                    },
                },
                participants: {
                    with: {
                        user: {
                            columns: {
                                id: true,
                                username: true,
                                isOnline: true,
                            },
                        },
                    },
                    where: eq(roomParticipants.status, 'active'),
                },
            },
            orderBy: (rooms, { desc }) => [desc(rooms.createdAt)],
            limit: 20,
        });

        return publicRooms;
    }

    /**
     * Find or create a public room for matchmaking
     */
    async findOrCreatePublicRoom(userId: string) {
        // Find an available public room with only 1 player
        const availableRoom = await db.query.rooms.findFirst({
            where: and(
                eq(rooms.type, 'public'),
                eq(rooms.status, 'waiting')
            ),
            with: {
                participants: {
                    where: eq(roomParticipants.status, 'active'),
                },
            },
        });

        if (availableRoom && availableRoom.participants.length === 1) {
            // Check if user is already in the room
            const isUserInRoom = availableRoom.participants.some(
                (p) => p.userId === userId
            );

            if (!isUserInRoom) {
                // Join this room as player2
                return await this.joinRoom({
                    roomCode: availableRoom.code,
                    userId,
                    role: 'player2',
                });
            }
        }

        // No available room, create a new public room
        return await this.createRoom({
            type: 'public',
            userId,
        });
    }

    /**
     * Get user's active rooms
     */
    async getUserRooms(userId: string) {
        const userParticipations = await db.query.roomParticipants.findMany({
            where: and(
                eq(roomParticipants.userId, userId),
                eq(roomParticipants.status, 'active')
            ),
            with: {
                room: {
                    with: {
                        creator: {
                            columns: {
                                id: true,
                                username: true,
                                isOnline: true,
                            },
                        },
                        participants: {
                            with: {
                                user: {
                                    columns: {
                                        id: true,
                                        username: true,
                                        isOnline: true,
                                    },
                                },
                            },
                            where: eq(roomParticipants.status, 'active'),
                        },
                    },
                },
            },
        });

        return userParticipations.map((p) => p.room);
    }

    /**
     * Update room status
     */
    async updateRoomStatus(
        roomId: string,
        status: 'waiting' | 'playing' | 'finished'
    ) {
        await db
            .update(rooms)
            .set({ status })
            .where(eq(rooms.id, roomId));

        return await this.getRoomById(roomId);
    }

    /**
     * Check if user can join room
     */
    async canUserJoinRoom(roomId: string, userId: string): Promise<boolean> {
        const room = await this.getRoomById(roomId);

        // Check if room is full
        const playerCount = room.participants.filter(
            (p) => p.role === 'player1' || p.role === 'player2'
        ).length;

        const spectatorCount = room.participants.filter(
            (p) => p.role === 'spectator'
        ).length;

        // If room is closed
        if (room.status === 'finished') {
            return false;
        }

        // If room is public, allow joining
        if (room.type === 'public') {
            return (
                playerCount < parseInt(room.maxPlayers) ||
                spectatorCount < parseInt(room.maxSpectators)
            );
        }

        // For private rooms, check invitations (we'll implement this later)
        return true;
    }
}

export const roomService = new RoomService();