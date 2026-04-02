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

// FOLDER MAPPING (Strictly matching your directory structure)
// The primary entry point is the frontend folder
app.use(express.static(path.join(__dirname, 'frontend')));

// Define resource folders at the root level
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));
app.use('/common', express.static(path.join(__dirname, 'common')));
app.use('/vendor_js', express.static(path.join(__dirname, 'vendor_js')));
// backend/ folder is kept physically but not exposed to the Web for security reasons

io.on('connection', (socket) => {
    console.log('[Witchcraft] Connection established.');

    socket.on('lua', (data) => {
        const env = data.env || 'mission';
        // Select port based on environment (3002 for export, 3001 for mission)
        const dcsPort = (env === 'export') ? 3002 : 3001;

        const dcsClient = new net.Socket();
        
        dcsClient.connect(dcsPort, '127.0.0.1', () => {
            // Using \r\n to ensure DCS Witchcraft Lua listener correctly parses the JSON end-of-line
            dcsClient.write(JSON.stringify(data) + '\r\n');
        });

        dcsClient.on('data', (tcpData) => {
            try {
                const response = JSON.parse(tcpData.toString());
                socket.emit('luaresult', response);
            } catch (e) {
                // Parsing error - handle malformed JSON from DCS if necessary
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
    console.log(`\x1b[32m[READY]\x1b[0m V2 Server (Modernized): http://localhost:${PORT}`);
});