const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const net = require('net');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.json({ limit: '50mb' })); // Support des payloads lourds
app.use(express.static(path.join(__dirname, 'frontend')));

let dcsSocket = null;
let pendingHttpRequest = null; // Stockage de la requête bridge.js

function fromHex(hex) {
    let str = '';
    try { for (let i = 0; i < hex.length; i += 2) { str += String.fromCharCode(parseInt(hex.substr(i, 2), 16)); }
    } catch (e) { return hex; }
    return str;
}

// Endpoint pour bridge.js (VSCode)
app.post('/', (req, res) => {
    if (dcsSocket && dcsSocket.writable) {
        pendingHttpRequest = res; // On garde la connexion ouverte
        dcsSocket.write(JSON.stringify(req.body) + '\n');
        
        // Timeout de sécurité pour ne pas bloquer bridge.js si DCS ne répond pas
        setTimeout(() => {
            if (pendingHttpRequest === res) {
                res.status(408).json({ error: "Timeout: DCS n'a pas répondu" });
                pendingHttpRequest = null;
            }
        }, 5000);
    } else {
        res.status(503).json({ error: "DCS non connecté" });
    }
});

const dcsBridge = net.createServer((socket) => {
    socket.setKeepAlive(true, 1000);
    socket.setNoDelay(true);
    console.log('\x1b[32m[DCS] LIAISON ACTIVE\x1b[0m');
    dcsSocket = socket;

    socket.on('data', (data) => {
        const raw = data.toString();
        try {
            const lines = raw.split('\n').filter(l => l.trim().length > 0);
            lines.forEach(line => {
                let msg = JSON.parse(line);
                if (msg.isHex && msg.result) {
                    let decoded = fromHex(msg.result);
                    try { msg.result = JSON.parse(decoded); } catch(e) { msg.result = decoded; }
                }

                console.log('\x1b[33m[RETOUR DCS]\x1b[0m', msg.result);
                
                // Envoi vers le Web (Witchcraft Console)
                io.emit('luaresult', { success: (msg.success !== false), result: msg.result });

                // Envoi vers VSCode (bridge.js) si une requête est en attente
                if (pendingHttpRequest) {
                    pendingHttpRequest.json({ success: (msg.success !== false), result: msg.result });
                    pendingHttpRequest = null;
                }
            });
        } catch (e) { console.log('\x1b[31m[ERR]\x1b[0m Flux corrompu'); }
    });
    socket.on('close', () => { dcsSocket = null; });
});

dcsBridge.listen(3001, '0.0.0.0');

io.on('connection', (socket) => {
    socket.on('lua', (data) => {
        if (dcsSocket && dcsSocket.writable) { dcsSocket.write(JSON.stringify(data) + '\n'); }
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('\x1b[32m=== HUB WITCHCRAFT MODERNISÉ ACTIF (3000) ===\x1b[0m');
});