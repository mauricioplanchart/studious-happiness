import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

const players = new Map(); // playerId -> player data
const connections = new Map(); // playerId -> websocket
let messageId = 0;

wss.on('connection', (ws) => {
    const playerId = Math.random().toString(36).substr(2, 9);

    console.log(`Player ${playerId} connected`);

    const colors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe67e22, 0x34495e];
    const playerColor = colors[Math.floor(Math.random() * colors.length)];

    players.set(playerId, {
        id: playerId,
        name: null,
        color: playerColor,
        position: { x: 0, y: 10, z: 30 },
        rotation: 0
    });

    connections.set(playerId, ws);

    ws.send(JSON.stringify({
        type: 'init',
        playerId: playerId,
        color: playerColor
    }));

    const currentPlayers = Array.from(players.values()).filter(p => p.id !== playerId);
    ws.send(JSON.stringify({
        type: 'players',
        players: currentPlayers
    }));

    broadcast({
        type: 'playerJoined',
        player: players.get(playerId)
    }, playerId);

    broadcast({
        type: 'chat',
        id: messageId++,
        playerId: 'system',
        username: 'System',
        message: `Player ${playerId.substr(0, 6)} joined the metaverse!`,
        timestamp: Date.now()
    });

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());

            switch (message.type) {
                case 'position':
                    if (players.has(playerId)) {
                        players.get(playerId).position = message.position;
                        players.get(playerId).rotation = message.rotation;

                        broadcast({
                            type: 'playerMoved',
                            playerId: playerId,
                            position: message.position,
                            rotation: message.rotation
                        }, playerId);
                    }
                    break;

                case 'typing':
                    broadcast({
                        type: 'typing',
                        playerId: playerId,
                        isTyping: !!message.isTyping
                    }, playerId);
                    break;

                case 'reaction':
                    if (message.reaction) {
                        const playerName = players.get(playerId)?.name;
                        const displayName = playerName && playerName.length > 0 ? playerName : playerId.substr(0, 6);
                        broadcast({
                            type: 'reaction',
                            playerId: playerId,
                            username: displayName,
                            reaction: message.reaction,
                            timestamp: Date.now()
                        });
                    }
                    break;

                case 'setName':
                    if (players.has(playerId)) {
                        const cleanName = (message.name || '').toString().trim().slice(0, 16);
                        players.get(playerId).name = cleanName || null;
                        broadcast({
                            type: 'playerUpdated',
                            playerId: playerId,
                            name: players.get(playerId).name
                        });
                    }
                    break;

                case 'chat':
                    const playerName = players.get(playerId)?.name;
                    const displayName = playerName && playerName.length > 0 ? playerName : playerId.substr(0, 6);
                    if (message.private && message.toPlayerId) {
                        const privateMsg = {
                            type: 'chat',
                            id: messageId++,
                            playerId: playerId,
                            username: displayName,
                            message: message.message,
                            timestamp: Date.now(),
                            private: true
                        };

                        if (connections.has(playerId)) {
                            connections.get(playerId).send(JSON.stringify(privateMsg));
                        }

                        if (connections.has(message.toPlayerId)) {
                            connections.get(message.toPlayerId).send(JSON.stringify(privateMsg));
                        }
                    } else {
                        broadcast({
                            type: 'chat',
                            id: messageId++,
                            playerId: playerId,
                            username: displayName,
                            message: message.message,
                            timestamp: Date.now(),
                            private: false
                        });
                    }
                    break;
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log(`Player ${playerId} disconnected`);
        players.delete(playerId);
        connections.delete(playerId);

        broadcast({
            type: 'playerLeft',
            playerId: playerId
        });

        broadcast({
            type: 'chat',
            id: messageId++,
            playerId: 'system',
            username: 'System',
            message: `Player ${playerId.substr(0, 6)} left the metaverse`,
            timestamp: Date.now()
        });
    });
});

function broadcast(message, excludePlayerId = null) {
    const messageStr = JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            const shouldSend = excludePlayerId === null ||
                !players.has(excludePlayerId) ||
                Array.from(players.keys()).indexOf(excludePlayerId) !==
                Array.from(wss.clients).indexOf(client);
            if (shouldSend) {
                client.send(messageStr);
            }
        }
    });
}

console.log('WebSocket server running on ws://localhost:8080');
