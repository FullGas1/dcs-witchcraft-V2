/**
 * DCS-Witchcraft Bridge for VS Code (English Version)
 * Forwards Lua scripts from VS Code to the Node.js Server
 */

const io = require('socket.io-client');
const fs = require('fs');

const SERVER_URL = "http://127.0.0.1:3000";
const filePath = process.argv[2];

// Initialize client (Socket.io v4 compatible)
const socket = io(SERVER_URL, { 
    transports: ['websocket'],
    reconnection: false 
});

socket.on('connect_error', (err) => {
    console.log(`\x1b[31m[ERROR]\x1b[0m Connection failed: ${err.message}`);
    process.exit(1);
});

socket.on('connect', () => {
    console.log("\x1b[36m[INFO]\x1b[0m Connected to Witchcraft Server.");

    try {
        if (!filePath) throw new Error("No file path provided.");

        const luaCode = fs.readFileSync(filePath, 'utf8');
        const msgId = Date.now().toString(); 

        const payload = {
            env: "mission", // Targets port 3001 in server.js
            code: luaCode,
            name: msgId,
            type: "lua"
        };

        console.log(`\x1b[34m[SEND]\x1b[0m Injecting script ID: ${msgId}`);
        socket.emit('lua', payload);

        // Fail-safe timeout
        const timeout = setTimeout(() => {
            console.log("\x1b[31m[TIMEOUT]\x1b[0m No response from DCS (Check port 3001).");
            process.exit(1);
        }, 5000);

        socket.on('luaresult', (data) => {
            // Check if response matches our request ID
            if (!data.name || data.name === msgId) {
                clearTimeout(timeout);
                console.log("\x1b[32m[SUCCESS]\x1b[0m DCS acknowledged execution.");
                
                if (data.result) {
                    console.log(`\x1b[37m[RETURN]\x1b[0m ${data.result}`);
                }
                process.exit(0);
            }
        });

    } catch (err) {
        console.error(`\x1b[31m[ERROR]\x1b[0m ${err.message}`);
        process.exit(1);
    }
});