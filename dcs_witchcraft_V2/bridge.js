/**
 * DCS-Witchcraft Bridge for VS Code (v4 Compatible)
 * Forwarding Lua scripts to the Node.js Server
 */

const io = require('socket.io-client');
const fs = require('fs');

// Configuration: Using explicit IP to avoid IPv6/localhost resolution issues
const SERVER_URL = "http://127.0.0.1:3000";
const filePath = process.argv[2];

// Initialize connection with Websocket transport (Required for v4 stability)
const socket = io(SERVER_URL, { 
    transports: ['websocket'],
    reconnection: false 
});

// 1. Error Handling
socket.on('connect_error', (err) => {
    console.log(`\x1b[31m[ERROR]\x1b[0m Connection failed: ${err.message}`);
    process.exit(1);
});

// 2. Main Logic
socket.on('connect', () => {
    console.log("\x1b[36m[INFO]\x1b[0m Connected to Witchcraft Server.");

    try {
        if (!filePath) throw new Error("No file path provided by VS Code.");

        const luaCode = fs.readFileSync(filePath, 'utf8');
        const msgId = Date.now().toString(); 

        const payload = {
            env: "mission", // Directs server to DCS Port 3001
            code: luaCode,
            name: msgId,
            type: "lua"
        };

        console.log(`\x1b[34m[SEND]\x1b[0m Injecting script ID: ${msgId}`);
        socket.emit('lua', payload);

        // Security Timeout
        const timeout = setTimeout(() => {
            console.log("\x1b[31m[TIMEOUT]\x1b[0m No response from DCS (Check port 3001).");
            process.exit(1);
        }, 5000);

        // 3. Response Handling
        socket.on('luaresult', (data) => {
            if (!data.name || data.name === msgId) {
                clearTimeout(timeout);
                console.log("\x1b[32m[SUCCESS]\x1b[0m Script executed in DCS.");
                process.exit(0);
            }
        });

    } catch (err) {
        console.error(`\x1b[31m[ERROR]\x1b[0m ${err.message}`);
        process.exit(1);
    }
});