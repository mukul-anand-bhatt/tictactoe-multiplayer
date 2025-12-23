// src/game/gameManager.ts
import { randomUUID } from "crypto";
import { GameState, PlayerSymbol } from "./types";
import { checkWinner, isDraw } from "./rules";
import {
  createGame,
  findGameByCode,
  updateGameState,
} from "../db/game.repo";

class GameManager {
  private games = new Map<string, GameState>();

  async createGame(playerId: string) {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();

    const game = await createGame(code, playerId);

    const state: GameState = {
      id: game.id,
      code: game.code,
      playerX: playerId,
      board: game.board,
      turn: "X",
      status: "waiting",
      isDraw: false,
    };

    this.games.set(code, state);
    return state;
  }

  async joinGame(code: string, playerId: string) {
    let game = this.games.get(code);

    if (!game) {
      const dbGame = await findGameByCode(code);
      if (!dbGame) throw new Error("Game not found");

      game = {
        id: dbGame.id,
        code: dbGame.code,
        playerX: dbGame.playerX ?? undefined,
        playerO: dbGame.playerO ?? undefined,
        board: dbGame.board,
        turn: dbGame.turn as PlayerSymbol,
        status: dbGame.status,
        winner: dbGame.winner as PlayerSymbol | undefined,
        isDraw: dbGame.isDraw === "true",
      };

      this.games.set(code, game);
    }

    if (!game.playerO && playerId !== game.playerX) {
      game.playerO = playerId;
      game.status = "playing";

      await updateGameState(game.id, {
        status: "playing",
      });
    }

    return game;
  }

  async makeMove(code: string, playerId: string, index: number) {
    const game = this.games.get(code);
    if (!game) throw new Error("Game not loaded");

    if (game.status !== "playing") throw new Error("Game not active");

    const symbol =
      playerId === game.playerX ? "X" :
      playerId === game.playerO ? "O" :
      null;

    if (!symbol) throw new Error("Not a player");

    if (game.turn !== symbol) throw new Error("Not your turn");

    if (game.board[index] !== " ") throw new Error("Cell occupied");

    // Apply move
    const boardArr = game.board.split("");
    boardArr[index] = symbol;
    game.board = boardArr.join("");

    // Check end state
    const winner = checkWinner(game.board);
    if (winner) {
      game.status = "finished";
      game.winner = winner;
    } else if (isDraw(game.board)) {
      game.status = "finished";
      game.isDraw = true;
    } else {
      game.turn = symbol === "X" ? "O" : "X";
    }

    // Persist snapshot
    await updateGameState(game.id, {
      board: game.board,
      turn: game.turn,
      status: game.status,
      winner: game.winner ?? null,
      isDraw: game.isDraw ? "true" : "false",
    });

    return game;
  }
}

export const gameManager = new GameManager();
