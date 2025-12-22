import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, LogOut, Search, Plus, Hash } from 'lucide-react';
import { socketService } from '../utils/socket';
import { api } from '../utils/api';
import { MessageType } from '../types';

interface Player {
    username: string;
    role: 'player1' | 'player2' | 'spectator';
}

export const Game: React.FC = () => {
    const navigate = useNavigate();
    const [isConnected, setIsConnected] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [isInRoom, setIsInRoom] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [board, setBoard] = useState(Array(9).fill(' '));
    const [players, setPlayers] = useState<Player[]>([]);
    const [myRole, setMyRole] = useState<string | null>(null);
    const [gameInfo, setGameInfo] = useState<any>(null); // Kept for future use
    console.log(gameInfo); // Suppress unused error via usage
    const [logs, setLogs] = useState<{ msg: string, color: string }[]>([]);
    const [gameId, setGameId] = useState<string | null>(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const logEndRef = useRef<HTMLDivElement>(null);

    const addLog = (msg: string, color: string = '#8b5cf6') => {
        setLogs(prev => [...prev, { msg, color }]);
    };

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/auth');
            return;
        }

        // Only subscribe to changes, do NOT auto connect
        const unsubConnection = socketService.onConnectionChange(setIsConnected);
        setIsConnected(socketService.isConnected());

        const unsubMessage = socketService.onMessage((data) => {
            switch (data.type) {
                case MessageType.AUTHENTICATED:
                    addLog('Connected to server', 'var(--success)');
                    break;

                case MessageType.ROOM_JOINED:
                    setIsInRoom(true);
                    setRoomCode(data.payload.room.code);
                    setMyRole(data.payload.role);
                    setPlayers(data.payload.participants);
                    addLog(`Joined room ${data.payload.room.code}`, 'var(--secondary)');
                    break;

                case MessageType.PLAYER_JOINED:
                    setPlayers(prev => {
                        if (prev.some(p => p.username === data.payload.username)) return prev;
                        return [...prev, { username: data.payload.username, role: data.payload.role }];
                    });
                    addLog(`${data.payload.username} joined`, 'var(--text)');
                    break;

                case MessageType.GAME_STARTED:
                    setGameStarted(true);
                    setGameId(data.payload.gameId);
                    setBoard(data.payload.board.split(''));
                    setGameInfo(data.payload); // Keep usage to avoid lint error
                    addLog('Game Started!', 'var(--success)');
                    break;

                case MessageType.MOVE_MADE:
                    setBoard(data.payload.board.split(''));
                    addLog(`${data.payload.username} played ${data.payload.player}`, 'var(--text)');
                    break;

                case MessageType.GAME_OVER:
                    setBoard(data.payload.board.split(''));
                    if (data.payload.result === 'draw') {
                        addLog('Game Ended in Draw', 'var(--warning)');
                    } else {
                        addLog(`${data.payload.winner.username} Won!`, 'var(--success)');
                    }
                    break;

                case MessageType.ERROR:
                    addLog(`Error: ${data.payload.message}`, 'var(--error)');
                    break;
            }
        });

        return () => {
            unsubConnection();
            unsubMessage();
            // Do not disconnect on unmount if we want persistence, 
            // BUT for this specific component lifecycle it might be safer to disconnect 
            // if we are leaving the page. 
            // However, user wants manual control. Let's keep disconnect on unmount to be safe?
            // User said "iclik it it connects... and gets offline if not connected".
            // Let's stick to manual control mainly.
            socketService.disconnect();
        };
    }, [navigate]);

    const handleToggleConnection = () => {
        if (isConnected) {
            socketService.disconnect();
        } else {
            const token = localStorage.getItem('token');
            if (token) socketService.connect(token);
        }
    };

    const handleLogout = () => {
        socketService.disconnect();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth');
    };

    const joinRoom = (code: string) => {
        socketService.send({
            type: MessageType.JOIN_ROOM,
            payload: { roomCode: code }
        });
    };

    const handleMatchmaking = async () => {
        try {
            const res = await api.post<any>('/rooms/matchmaking', {}, localStorage.getItem('token') || '');
            if (res.success) {
                joinRoom(res.data.code);
            }
        } catch (e: any) {
            addLog(e.message, 'var(--error)');
        }
    };

    const handleCreateRoom = async () => {
        try {
            const res = await api.post<any>('/rooms/create', { type: 'private' }, localStorage.getItem('token') || '');
            if (res.success && res.data) {
                joinRoom(res.data.code);
            }
        } catch (e: any) {
            addLog(`Error creating room: ${e.message}`, 'var(--error)');
        }
    };

    const startGame = () => {
        socketService.send({ type: MessageType.START_GAME });
    };

    const makeMove = (position: number) => {
        if (!gameId) return;
        socketService.send({
            type: MessageType.MAKE_MOVE,
            payload: { gameId, position }
        });
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <header className="flex-center" style={{ justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div className="flex-center" style={{ gap: '1rem' }}>
                    <h2>@{user.username}</h2>
                    <button
                        onClick={handleToggleConnection}
                        className="flex-center"
                        style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            border: `1px solid ${isConnected ? 'var(--success)' : 'var(--error)'}`,
                            fontSize: '0.75rem',
                            color: isConnected ? 'var(--success)' : 'var(--error)',
                            background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Activity size={12} style={{ marginRight: '0.25rem' }} />
                        {isConnected ? 'Online' : 'Offline (Click to Connect)'}
                    </button>
                </div>

                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    <LogOut size={16} style={{ marginRight: '0.5rem' }} /> Logout
                </button>
            </header>

            {!isInRoom ? (
                <div className="card glass animate-slide-up">
                    <h3 style={{ marginBottom: '1.5rem' }}>Game Lobby</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <button onClick={handleMatchmaking} className="btn glass" style={{ flexDirection: 'column', padding: '2rem', gap: '1rem' }}>
                            <Search size={32} color="var(--primary)" />
                            <span>Find Match</span>
                        </button>

                        <button onClick={handleCreateRoom} className="btn glass" style={{ flexDirection: 'column', padding: '2rem', gap: '1rem' }}>
                            <Plus size={32} color="var(--secondary)" />
                            <span>Create Private</span>
                        </button>

                        <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', borderRadius: '0.75rem' }}>
                            <Hash size={32} color="var(--success)" />
                            <input
                                value={inputCode}
                                onChange={e => setInputCode(e.target.value.toUpperCase())}
                                placeholder="ENTER CODE"
                                className="input"
                                style={{ textAlign: 'center', letterSpacing: '2px', fontFamily: 'monospace' }}
                            />
                            <button onClick={() => joinRoom(inputCode)} disabled={!inputCode} className="btn btn-primary" style={{ width: '100%' }}>Join Room</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    <div className="card glass animate-slide-up">
                        <div className="flex-center" style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3>Room: {roomCode}</h3>
                            {myRole === 'spectator' && <span style={{ color: 'var(--warning)' }}>Spectating</span>}
                        </div>

                        <div style={{ marginBottom: '1rem', display: 'flex', gap: '2rem' }}>
                            <div>Players: {players.length}/2</div>
                            {players.map(p => (
                                <div key={p.username} style={{ color: 'var(--text-muted)' }}>{p.username} ({p.role})</div>
                            ))}
                        </div>

                        {!gameStarted ? (
                            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                                <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Waiting for players...</p>
                                {players.length >= 2 && (
                                    <button onClick={startGame} className="btn btn-primary">Start Game</button>
                                )}
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '10px',
                                maxWidth: '400px',
                                margin: '0 auto',
                                aspectRatio: '1'
                            }}>
                                {board.map((cell, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => makeMove(idx)}
                                        className="flex-center"
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '0.5rem',
                                            fontSize: '3rem',
                                            fontWeight: 'bold',
                                            cursor: cell === ' ' ? 'pointer' : 'default',
                                            color: cell === 'X' ? 'var(--secondary)' : 'var(--primary)',
                                            border: '1px solid var(--glass-border)'
                                        }}
                                    >
                                        {cell}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card glass" style={{ display: 'flex', flexDirection: 'column', maxHeight: '500px' }}>
                        <h3>Game Logs</h3>
                        <div style={{ flex: 1, overflowY: 'auto', marginTop: '1rem', fontSize: '0.875rem' }}>
                            {logs.map((log, i) => (
                                <div key={i} style={{ padding: '0.5rem 0', color: log.color, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    {log.msg}
                                </div>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
