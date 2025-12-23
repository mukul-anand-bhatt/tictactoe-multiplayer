import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";

export const gameStatusEnum = pgEnum("game_status", [
  "waiting",
  "playing",
  "finished",
]);

export const games = pgTable("games_v0", {
  id: uuid("id").primaryKey().defaultRandom(),

  code: text("code").notNull().unique(), // shareable

  playerX: text("player_x"), // anonymous uuid
  playerO: text("player_o"),

  board: text("board").notNull().default("         "), // 9 chars
  turn: text("turn").notNull().default("X"),

  status: gameStatusEnum("status").notNull().default("waiting"),

  winner: text("winner"), // X | O | null
  isDraw: text("is_draw").notNull().default("false"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
