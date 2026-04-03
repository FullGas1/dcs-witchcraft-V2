const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const net = require('net');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const baseDir = __dirname; 

// Support mixte : JSON pour bridge.js et Texte brut pour l'extension VS Code
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ type: '*/*', limit: '50mb' })); 

// Configuration des routes statiques (Frontend AngularJS)
app.use(express.static(path.join(baseDir, 'frontend')));
app.use('/scripts', express.static(path.join(baseDir, 'frontend', 'scripts')));
app.use('/styles', express.static(path.join(baseDir, 'frontend', 'styles')));
app.use('/templates', express.static(path.join(baseDir, 'frontend', 'templates')));
app.use('/common', express.static(path.join(baseDir, 'common')));
app.use('/vendor_js', express.static(path.join(baseDir, 'vendor_js')));
app.use('/bower_components', express.static(path.join(baseDir, 'bower_components')));

let dcsSocket = null;

// --- ROUTE POST UNIFIÉE ---
app.post('/', (req, res) => {
    if (dcsSocket && dcsSocket.writable) {
        let payload;
        // Détection du format entrant : JSON (bridge) ou Texte (VS Code extension)
        if (typeof req.body === 'object' && req.body.code) {
            payload = JSON.stringify(req.body) + '\n';
        } else {
            payload = JSON.stringify({ isHex: false, code: req.body }) + '\n';
        }
        
        dcsSocket.write(payload);
        console.log('\x1b[34m[VSCODE/BRIDGE]\x1b[0m Injection transmise à DCS');
        res.status(200).send(`[SUCCESS] Code injecté (${payload.length} chars).`);
    } else {
        console.log('\x1b[31m[ERROR]\x1b[0m VS Code a tenté d\'injecter mais DCS est déconnecté.');
        res.status(503).send("DCS Déconnecté");
    }
});

// --- HUB TCP (DCS) ---
const dcsBridge = net.createServer((socket) => {
    console.log('\x1b[32m[DCS]\x1b[0m Connecté au Hub (Port 3001)');
    dcsSocket = socket;
    socket.on('data', (data) => {
        try {
            const messages = data.toString().split('\n').filter(l => l.trim() !== "");
            messages.forEach(msg => io.emit('luaresult', JSON.parse(msg)));
        } catch (e) { }
    });
    socket.on('close', () => { 
        console.log('\x1b[31m[DCS]\x1b[0m Déconnecté.');
        dcsSocket = null; 
    });
});
dcsBridge.listen(3001, '127.0.0.1');

// --- SOCKET.IO (Console) ---
io.on('connection', (client) => {
    client.on('lua', (data) => {
        if (dcsSocket && dcsSocket.writable) {
            dcsSocket.write(JSON.stringify(data) + '\n');
        }
    });
});

server.listen(3000, () => {
    console.log('\x1b[32m[READY]\x1b[0m Console : http://127.0.0.1:3000');
    console.log('\x1b[34m[HUB]\x1b[0m En attente de DCS sur Port 3001...');
});