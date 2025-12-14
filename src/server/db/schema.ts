import { pgTable, text, timestamp, boolean, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==================== ENUMS ====================

export const roomTypeEnum = pgEnum('room_type', ['public', 'private']);
export const roomStatusEnum = pgEnum('room_status', ['waiting', 'playing', 'finished']);
export const participantRoleEnum = pgEnum('participant_role', ['player1', 'player2', 'spectator']);
export const participantStatusEnum = pgEnum('participant_status', ['active', 'disconnected', 'left']);
export const inviteStatusEnum = pgEnum('invite_status', ['pending', 'accepted', 'declined', 'expired']);

// ==================== USERS TABLE ====================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  isOnline: boolean('is_online').default(false).notNull(),
  lastSeen: timestamp('last_seen'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==================== ROOMS TABLE ====================

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // e.g., "ABC123" for sharing
  type: roomTypeEnum('type').default('public').notNull(), // public or private
  status: roomStatusEnum('status').default('waiting').notNull(),
  creatorId: uuid('creator_id').notNull().references(() => users.id),
  maxPlayers: text('max_players').default('2').notNull(), // "2" for 1v1
  maxSpectators: text('max_spectators').default('10').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  startedAt: timestamp('started_at'),
  closedAt: timestamp('closed_at'),
});

// ==================== ROOM PARTICIPANTS TABLE ====================
// Tracks who's in the room and their role

export const roomParticipants = pgTable('room_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  role: participantRoleEnum('role').notNull(), // player1, player2, spectator
  status: participantStatusEnum('status').default('active').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  leftAt: timestamp('left_at'),
});

// ==================== INVITATIONS TABLE ====================
// For private room invites

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  fromUserId: uuid('from_user_id').notNull().references(() => users.id),
  toUserId: uuid('to_user_id').notNull().references(() => users.id),
  status: inviteStatusEnum('status').default('pending').notNull(),
  message: text('message'), // Optional invite message
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(), // Auto-expire after X minutes
  respondedAt: timestamp('responded_at'),
});

// ==================== GAMES TABLE ====================

export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().references(() => rooms.id),
  player1Id: uuid('player1_id').notNull().references(() => users.id),
  player2Id: uuid('player2_id').references(() => users.id),
  board: text('board').default('         ').notNull(), // 9 spaces
  currentTurn: text('current_turn').default('X').notNull(),
  winner: text('winner'), // 'X', 'O', or null
  winnerId: uuid('winner_id').references(() => users.id), // User who won
  isDraw: boolean('is_draw').default(false).notNull(),
  isFinished: boolean('is_finished').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  finishedAt: timestamp('finished_at'),
});

// ==================== FRIENDSHIPS TABLE (Optional but recommended) ====================

export const friendships = pgTable('friendships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  friendId: uuid('friend_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').default('accepted').notNull(), // 'pending', 'accepted', 'blocked'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==================== RELATIONS ====================

export const usersRelations = relations(users, ({ many }) => ({
  createdRooms: many(rooms),
  participations: many(roomParticipants),
  sentInvites: many(invitations, { relationName: 'sentInvites' }),
  receivedInvites: many(invitations, { relationName: 'receivedInvites' }),
  gamesAsPlayer1: many(games, { relationName: 'player1' }),
  gamesAsPlayer2: many(games, { relationName: 'player2' }),
  friendships: many(friendships, { relationName: 'userFriends' }),
  friendOf: many(friendships, { relationName: 'friendOfUsers' }),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  creator: one(users, {
    fields: [rooms.creatorId],
    references: [users.id],
  }),
  participants: many(roomParticipants),
  invitations: many(invitations),
  games: many(games),
}));

export const roomParticipantsRelations = relations(roomParticipants, ({ one }) => ({
  room: one(rooms, {
    fields: [roomParticipants.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [roomParticipants.userId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  room: one(rooms, {
    fields: [invitations.roomId],
    references: [rooms.id],
  }),
  fromUser: one(users, {
    fields: [invitations.fromUserId],
    references: [users.id],
    relationName: 'sentInvites',
  }),
  toUser: one(users, {
    fields: [invitations.toUserId],
    references: [users.id],
    relationName: 'receivedInvites',
  }),
}));

export const gamesRelations = relations(games, ({ one }) => ({
  room: one(rooms, {
    fields: [games.roomId],
    references: [rooms.id],
  }),
  player1: one(users, {
    fields: [games.player1Id],
    references: [users.id],
    relationName: 'player1',
  }),
  player2: one(users, {
    fields: [games.player2Id],
    references: [users.id],
    relationName: 'player2',
  }),
  winner: one(users, {
    fields: [games.winnerId],
    references: [users.id],
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(users, {
    fields: [friendships.userId],
    references: [users.id],
    relationName: 'userFriends',
  }),
  friend: one(users, {
    fields: [friendships.friendId],
    references: [users.id],
    relationName: 'friendOfUsers',
  }),
}));

// ==================== TYPES ====================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;

export type RoomParticipant = typeof roomParticipants.$inferSelect;
export type NewRoomParticipant = typeof roomParticipants.$inferInsert;

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;

export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;