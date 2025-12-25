import { WebSocketServer } from "ws";
import { gameManager } from "./game/gameManager";
import { addSocketToRoom, removeSocketFromRoom, roomSockets } from "./game/room";

export function initWS(server: any) {
    const wss = new WebSocketServer({ server });
    console.log("✅ WebSocket server initialized");

    wss.on("connection", (ws) => {
        console.log("🔌 Client connected");
        let playerId: string | null = null;
        let gameCode: string | null = null;
        console.log("Client connected");


        ws.on("message", async (raw) => {
            try {
                const msg = JSON.parse(raw.toString());


                if (msg.type === 'INIT') {
                    playerId = msg.playerId
                    return;
                }

                if (msg.type === 'CREATE_GAME') {
                    const game = await gameManager.createGame(playerId!);

                    gameCode = game.code;

                    addSocketToRoom(gameCode, ws)

                    ws.send(JSON.stringify({
                        type: "GAME_CREATED",
                        code: game.code,
                        symbol: "X",
                    }));
                }

                if (msg.type === "JOIN_GAME") {
                    console.log(`${playerId} joined game ${msg.code}`)
                    const game = await gameManager.joinGame(msg.code, playerId!);
                    gameCode = msg.code;

                    addSocketToRoom(gameCode, ws)

                    ws.send(JSON.stringify({
                        type: "GAME_JOINED",
                        symbol: playerId === game.playerX ? "X" : "O",
                        state: game,
                    }));

                    roomSockets.get(gameCode)?.forEach((client) => {
                        client.send(JSON.stringify({
                            type: "STATE",
                            state: game,
                        }));
                    });

                    // wss.clients.forEach((Client) => {
                    //     Client.send(JSON.stringify({
                    //         type: "STATE",
                    //         state: game,
                    //     }));
                    // });


                }


                if (msg.type === "MOVE") {
                    console.log(`${playerId} made move ${msg.index} in game ${gameCode}`)
                    const game = await gameManager.makeMove(
                        gameCode!,
                        playerId!,
                        msg.index
                    );


                    roomSockets.get(gameCode!)?.forEach((client) => {
                        client.send(JSON.stringify({
                            type: "STATE",
                            state: game,
                        }));
                    });

                    // wss.clients.forEach((client) => {
                    //     client.send(JSON.stringify({
                    //         type: "STATE",
                    //         state: game,
                    //     }));
                    // });
                }

                ws.send(JSON.stringify({ type: "CONNECTED" }));

                ws.send(JSON.stringify({ type: "CONNECTED" }));

            } catch (err: any) {
                ws.send(JSON.stringify({
                    type: "ERROR",
                    message: err.message,
                }));
            }
        });


        ws.on("close", () => {
            console.log("❌ Client disconnected");
            if (gameCode) {
                removeSocketFromRoom(gameCode, ws)
            }
        })
    });
}




