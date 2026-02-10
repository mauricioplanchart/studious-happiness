import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

const players = new Map();
let messageId = 0;

wss.on('connection', (ws) => {
    // Generate unique player ID
    const playerId = Math.random().toString(36).substr(2, 9);

    console.log(`Player ${playerId} connected`);

    // Assign random color to player
    const colors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe67e22, 0x34495e];
    const playerColor = colors[Math.floor(Math.random() * colors.length)];

    players.set(playerId, {
        id: playerId,
        color: playerColor,
        position: { x: 0, y: 10, z: 30 },
        rotation: 0
    });

    // Send player their ID and color
    ws.send(JSON.stringify({
        type: 'init',
        playerId: playerId,
        color: playerColor
    }));

    // Send current players to new player
    const currentPlayers = Array.from(players.values()).filter(p => p.id !== playerId);
    ws.send(JSON.stringify({
        type: 'players',
        players: currentPlayers
    }));

    // Broadcast new player to all other players
    broadcast({
        type: 'playerJoined',
        player: players.get(playerId)
    }, playerId);

    // Send welcome message
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
                    // Update player position
                    if (players.has(playerId)) {
                        players.get(playerId).position = message.position;
                        players.get(playerId).rotation = message.rotation;

                        // Broadcast position to all other players
                        broadcast({
                            type: 'playerMoved',
                            playerId: playerId,
                            position: message.position,
                            rotation: message.rotation
                        }, playerId);
                    }
                    break;

                case 'chat':
                    // Broadcast chat message to all players
                    broadcast({
                        type: 'chat',
                        id: messageId++,
                        playerId: playerId,
                        username: message.username || playerId.substr(0, 6),
                        message: message.message,
                        timestamp: Date.now()
                    });
                    break;
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log(`Player ${playerId} disconnected`);
        players.delete(playerId);

        // Broadcast player left to all other players
        broadcast({
            type: 'playerLeft',
            playerId: playerId
        });

        // Send disconnect message
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
        if (client.readyState === 1) { // WebSocket.OPEN
            // Send to all except the excluded player
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
