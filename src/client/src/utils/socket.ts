import { MessageType } from '../types';
import type { WebSocketMessage } from '../types';

class SocketService {
    private ws: WebSocket | null = null;
    private messageHandlers: Set<(msg: WebSocketMessage) => void> = new Set();
    private connectionHandlers: Set<(connected: boolean) => void> = new Set();
    private messageQueue: WebSocketMessage[] = [];

    connect(token: string) {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            console.log('WS already connecting/connected');
            return;
        }

        // Use current host (Vite proxy handles the rest)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const url = `${protocol}//${host}/ws`;

        console.log('Connecting to WebSocket:', url);
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log('WS Connected, Authenticating...');
            this.send({
                type: MessageType.AUTHENTICATE,
                payload: { token }
            });
            // Don't flush queue yet, wait for AUTHENTICATED
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WS Received:', data);

                if (data.type === MessageType.AUTHENTICATED) {
                    this.notifyConnection(true);
                    console.log('Authenticated, flushing queue...');
                    this.flushQueue();
                }

                this.messageHandlers.forEach(h => h(data));
            } catch (e) {
                console.error('WS Parse Error:', e);
            }
        };

        this.ws.onclose = () => {
            console.log('WS Disconnected');
            this.ws = null;
            this.notifyConnection(false);
            // Optional: Reconnect logic here
        };

        this.ws.onerror = (err) => {
            console.error('WS Error:', err);
        };
    }

    send(msg: WebSocketMessage) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        } else {
            console.log('WS connecting, queueing message:', msg);
            this.messageQueue.push(msg);
        }
    }

    private flushQueue() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            while (this.messageQueue.length > 0) {
                const msg = this.messageQueue.shift();
                if (msg) this.send(msg);
            }
        }
    }

    onMessage(handler: (msg: WebSocketMessage) => void) {
        this.messageHandlers.add(handler);
        return () => {
            this.messageHandlers.delete(handler);
        };
    }

    onConnectionChange(handler: (connected: boolean) => void) {
        this.connectionHandlers.add(handler);
        return () => {
            this.connectionHandlers.delete(handler);
        };
    }

    private notifyConnection(connected: boolean) {
        this.connectionHandlers.forEach(h => h(connected));
    }

    disconnect() {
        this.ws?.close();
        this.ws = null;
    }

    isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

export const socketService = new SocketService();
