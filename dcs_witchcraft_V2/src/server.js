/**
 * DCS-Witchcraft Server (Modernized v4)
 * Handles communication between Web Console/VS Code and DCS World
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const net = require('net');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS for modern browser/client security
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// FOLDER MAPPING
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));
app.use('/common', express.static(path.join(__dirname, 'common')));
app.use('/vendor_js', express.static(path.join(__dirname, 'vendor_js')));

io.on('connection', (socket) => {
    console.log('[Witchcraft] Client connected.');

    socket.on('lua', (data) => {
        const env = data.env || 'mission';
        // Logic: 'mission' maps to 3001 (MissionScripting.lua default)
        // 'export' maps to 3002
        const dcsPort = (env === 'export') ? 3002 : 3001;

        const dcsClient = new net.Socket();
        
        dcsClient.connect(dcsPort, '127.0.0.1', () => {
            // Append \r\n to ensure DCS TCP listener triggers processing
            dcsClient.write(JSON.stringify(data) + '\r\n');
        });

        dcsClient.on('data', (tcpData) => {
            try {
                const response = JSON.parse(tcpData.toString());
                socket.emit('luaresult', response);
            } catch (e) {
                // Silently catch malformed chunks
            }
            dcsClient.destroy();
        });

        dcsClient.on('error', (err) => {
            socket.emit('luaresult', { 
                success: false, 
                result: "Connection refused by DCS on port " + dcsPort 
            });
            dcsClient.destroy();
        });
    });

    socket.on('disconnect', () => {
        console.log('[Witchcraft] Client disconnected.');
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`\x1b[32m[READY]\x1b[0m Server running at http://127.0.0.1:${PORT}`);
    console.log(`\x1b[36m[INFO]\x1b[0m Target DCS Port: 3001 (Mission Environment)`);
});