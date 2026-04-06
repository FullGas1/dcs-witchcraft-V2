const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const net = require('net');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

// --- CONFIGURATION DES CHEMINS ---
// server.js étant dans /src, on expose le contenu de /src/frontend et /src/bower_components
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));
app.use('/scripts', express.static(path.join(__dirname, 'frontend', 'scripts')));

let dcsSocket = null;
let pendingHttpRequest = null;

// Utilitaire de décodage Hex pour DCS
function fromHex(hex) {
    let str = '';
    try { 
        for (let i = 0; i < hex.length; i += 2) { 
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16)); 
        }
    } catch (e) { return hex; }
    return str;
}

// --- LOGIQUE SOCKET.IO (INTERFACE WEB) ---
io.on('connection', (socket) => {
    console.log('\x1b[36m[WEB] Navigateur connecté\x1b[0m (ID: ' + socket.id + ')');

    socket.on('lua', (data) => {
        if (dcsSocket && dcsSocket.writable) { 
            dcsSocket.write(JSON.stringify(data) + '\n'); 
        }
    });

    socket.on('disconnect', () => {
        console.log('\x1b[31m[WEB] Navigateur déconnecté\x1b[0m');
    });
});

// --- ENDPOINT POUR BRIDGE.JS (VSCODE) ---
app.post('/', (req, res) => {
    if (dcsSocket && dcsSocket.writable) {
        pendingHttpRequest = res;
        dcsSocket.write(JSON.stringify(req.body) + '\n');
        
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

// --- SERVEUR TCP POUR DCS WORLD ---
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
                
                io.emit('luaresult', { success: (msg.success !== false), result: msg.result });

                if (pendingHttpRequest) {
                    pendingHttpRequest.json({ success: (msg.success !== false), result: msg.result });
                    pendingHttpRequest = null;
                }
            });
        } catch (e) { console.log('\x1b[31m[ERR]\x1b[0m Flux corrompu'); }
    });

    socket.on('close', () => { 
        console.log('\x1b[31m[DCS] LIAISON PERDUE\x1b[0m');
        dcsSocket = null; 
    });
});

// Lancement des serveurs
dcsBridge.listen(3001, '0.0.0.0');
server.listen(3000, '0.0.0.0', () => {
    console.log('\x1b[32m=== HUB WITCHCRAFT MODERNISÉ ACTIF (PORT 3000) ===\x1b[0m');
    console.log('URL de la console : http://localhost:3000/console.html');
});