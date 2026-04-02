const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const net = require('net');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// MAPPING DES DOSSIERS (Strictement conforme à votre capture d'écran)
// Le point d'entrée est le dossier frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Déclaration des dossiers de ressources à la racine
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));
app.use('/common', express.static(path.join(__dirname, 'common')));
app.use('/vendor_js', express.static(path.join(__dirname, 'vendor_js')));
// backend/ est conservé physiquement mais n'est pas exposé au Web par sécurité

io.on('connection', (socket) => {
    console.log('[Witchcraft] Connexion établie.');

    socket.on('lua', (data) => {
        const env = data.env || 'mission';
        const dcsPort = (env === 'export') ? 3001 : 3002;

        const dcsClient = new net.Socket();
        
        dcsClient.connect(dcsPort, '127.0.0.1', () => {
            //dcsClient.write(JSON.stringify(data) + '\n');
			dcsClient.write(JSON.stringify(data) + '\r\n');
        });

        dcsClient.on('data', (tcpData) => {
            try {
                const response = JSON.parse(tcpData.toString());
                socket.emit('luaresult', response);
            } catch (e) {
                // Erreur de parsing
            }
            dcsClient.destroy();
        });

        dcsClient.on('error', (err) => {
            socket.emit('luaresult', { 
                success: false, 
                result: "DCS Connection Error on port " + dcsPort 
            });
            dcsClient.destroy();
        });
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`\x1b[32m[READY]\x1b[0m Serveur V2 (Modernisé) : http://localhost:${PORT}`);
});