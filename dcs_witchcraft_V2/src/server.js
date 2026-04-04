const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const net = require('net');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));
app.use('/scripts', express.static(path.join(__dirname, 'frontend/scripts')));
app.use('/styles', express.static(path.join(__dirname, 'frontend/styles')));

let dcsSocket = null;

function fromHex(hex) {
    let str = '';
    try { for (let i = 0; i < hex.length; i += 2) { str += String.fromCharCode(parseInt(hex.substr(i, 2), 16)); }
    } catch (e) { return hex; }
    return str;
}

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
            });
        } catch (e) { console.log('\x1b[31m[ERR]\x1b[0m Flux corrompu'); }
    });
    socket.on('close', () => { dcsSocket = null; });
});

dcsBridge.listen(3001, '0.0.0.0');

io.on('connection', (socket) => {
    console.log(`\x1b[36m[WEB] Client connecté : ${socket.id}\x1b[0m`);
    socket.on('lua', (data) => {
        if (dcsSocket && dcsSocket.writable) { dcsSocket.write(JSON.stringify(data) + '\n'); }
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('\x1b[32m=== HUB WITCHCRAFT MODERNISÉ ACTIF (3000) ===\x1b[0m');
});