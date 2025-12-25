import { WebSocket } from "ws";



export const roomSockets = new Map<string, Set<WebSocket>>();


export function addSocketToRoom(code: string, ws: WebSocket) {
    console.log("added to the map")
    if (!roomSockets.has(code)) {
        roomSockets.set(code, new Set());
    }
    roomSockets.get(code)!.add(ws);
}

export function removeSocketFromRoom(code: string, ws: WebSocket) {
    console.log("deleted to the map")
    const set = roomSockets.get(code)
    if (!set) return;

    set.delete(ws)

    if (set.size === 0) {
        roomSockets.delete(code)
    }
}
















