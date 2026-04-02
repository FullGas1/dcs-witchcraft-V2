const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const net = require('net');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- CONFIGURATION DES ROUTES PORTABLES ---
// __dirname détecte automatiquement si tu es sur F:\... ou C:\...
const baseDir = __dirname; 

app.use(express.static(path.join(baseDir, 'frontend')));
app.use('/common', express.static(path.join(baseDir, 'common')));
app.use('/vendor_js', express.static(path.join(baseDir, 'vendor_js')));
app.use('/bower_components', express.static(path.join(baseDir, 'bower_components')));

// Optionnel : Route pour charger la console directement sur l'index
app.get('/', (req, res) => {
    res.sendFile(path.join(baseDir, 'frontend', 'console.html'));
});

let dcsSocket = null;

// --- HUB TCP POUR DCS (Port 3001) ---
const dcsBridge = net.createServer((socket) => {
    console.log('\x1b[32m[DCS]\x1b[0m Connecté au Hub.');
    dcsSocket = socket;

    socket.on('data', (data) => {
        // --- AJOUT DE CETTE LIGNE ---
        console.log('\x1b[33m[DCS DATA]\x1b[0m Flux reçu de DCS'); 
        // ----------------------------

        try {
            const rawData = data.toString();
            const messages = rawData.split('\n').filter(line => line.trim() !== "");
            messages.forEach(msg => {
                io.emit('luaresult', JSON.parse(msg));
            });
        } catch (e) { /* Trame incomplète */ }
    });

    socket.on('close', () => { 
        console.log('\x1b[31m[DCS]\x1b[0m Déconnecté du Hub.');
        dcsSocket = null; 
    });
    socket.on('error', () => { dcsSocket = null; });
});

// Écoute impérative sur le port 3001
dcsBridge.listen(3001, '127.0.0.1', () => {
    console.log('\x1b[34m[HUB]\x1b[0m En attente de DCS (Port 3001)...');
});

// --- HUB SOCKET.IO (Navigateur -> Serveur -> DCS) ---
io.on('connection', (client) => {
    console.log('\x1b[36m[CLIENT]\x1b[0m Interface connectée.');

    client.on('lua', (data) => {
        if (dcsSocket && dcsSocket.writable) { // Vérifie si le socket est prêt à écrire
            console.log('\x1b[34m[SEND]\x1b[0m Injection vers DCS...');
            
            // Conversion en string + Séquence de fin de ligne universelle
            const payload = JSON.stringify(data) + '\r\n'; // \n est le standard attendu par LuaSocket
			dcsSocket.write(payload);
        } else {
            console.log('\x1b[31m[ERR]\x1b[0m Échec : DCS n\'est pas connecté au Hub (Port 3001).');
        }
    });
});

server.listen(3000, () => {
    console.log('\x1b[32m[READY]\x1b[0m Serveur actif sur http://127.0.0.1:3000');
});