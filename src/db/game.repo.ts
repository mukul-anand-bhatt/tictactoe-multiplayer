import { db } from "./client";
import { games } from "./schema";
import { eq } from "drizzle-orm";




export const createGame = async (code: string, playerX: string) => {
    const [game] = await db
        .insert(games)
        .values({
            code,
            playerX
        })
        .returning();

    return game
}

export const findGameByCode = async (code: string) => {
    const [game] = await db
        .select()
        .from(games)
        .where(eq(games.code, code))

    return game ?? null;

};

export const updateGameState = async (id: string, state: Partial<{ board: string; turn: string; status: "waiting" | "playing" | "finished"; winner: string | null; isDraw: string; }>) => {
    await db
        .update(games)
        .set({
            ...state,
            updatedAt: new Date(),
        })
        .where(eq(games.id, id))

};

