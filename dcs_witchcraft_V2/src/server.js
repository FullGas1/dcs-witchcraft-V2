const express = require('express');
const http = require('http');
const { Server } = require('socket.io'); 
const net = require('net');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Socket.io v4 initialization with CORS
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));
app.use('/common', express.static(path.join(__dirname, 'common')));
app.use('/vendor_js', express.static(path.join(__dirname, 'vendor_js')));

io.on('connection', (socket) => {
    console.log('[Witchcraft] Client connected (v4)');

    socket.on('lua', (data) => {
        const env = data.env || 'mission';
        const dcsPort = (env === 'export') ? 3002 : 3001;
        const dcsClient = new net.Socket();
        
        dcsClient.connect(dcsPort, '127.0.0.1', () => {
            dcsClient.write(JSON.stringify(data) + '\r\n');
        });

        dcsClient.on('data', (tcpData) => {
            try {
                const response = JSON.parse(tcpData.toString());
                socket.emit('luaresult', response);
            } catch (e) {}
            dcsClient.destroy();
        });

        dcsClient.on('error', () => {
            socket.emit('luaresult', { success: false, result: "DCS Error" });
            dcsClient.destroy();
        });
    });
});

server.listen(3000, () => {
    console.log(`\x1b[32m[READY]\x1b[0m Server: http://127.0.0.1:3000`);
});