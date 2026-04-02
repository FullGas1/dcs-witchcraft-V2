const io = require('socket.io-client');
const fs = require('fs');

const socket = io("http://127.0.0.1:3000", { 
    transports: ['websocket'],
    reconnection: false 
});

socket.on('connect_error', (err) => {
    console.log(`\x1b[31m[ERROR]\x1b[0m ${err.message}`);
    process.exit(1);
});

socket.on('connect', () => {
    console.log("\x1b[36m[INFO]\x1b[0m Connected.");
    try {
        const luaCode = fs.readFileSync(process.argv[2], 'utf8');
        const msgId = Date.now().toString(); 
        socket.emit('lua', {
            env: "mission",
            code: luaCode,
            name: msgId,
            type: "lua"
        });

        socket.on('luaresult', (data) => {
            if (data.name === msgId || !data.name) {
                console.log("\x1b[32m[SUCCESS]\x1b[0m Executed.");
                process.exit(0);
            }
        });
    } catch (err) {
        process.exit(1);
    }
});