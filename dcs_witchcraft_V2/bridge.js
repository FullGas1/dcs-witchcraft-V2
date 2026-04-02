/**
 * DCS-Witchcraft Bridge for VS Code
 * Logiciel de liaison entre VS Code et DCS World via Socket.io
 */

const io = require('socket.io-client');
const fs = require('fs');

const W_URL = "http://127.0.0.1:3000";
const filePath = process.argv[2];

const socket = io(W_URL, { 
    transports: ['websocket'],
    upgrade: false 
});

socket.on('connect_error', (err) => {
    console.error(`\x1b[31m[ERR]\x1b[0m Connexion impossible au serveur : ${err.message}`);
    process.exit(1);
});

socket.on('connect_timeout', () => {
    console.error("\x1b[31m[ERR]\x1b[0m Délai de connexion dépassé.");
    process.exit(1);
});

socket.on('connect', () => {
    try {
        const luaCode = fs.readFileSync(filePath, 'utf8');
        
        // Génération d'un ID identique à celui vu dans votre console
        const msgName = Date.now().toString(); 

        const payload = {
            env: "mission",
            code: luaCode,
            name: msgName, // L'ID que nous avons vu dans votre log
            type: "lua"    // Précisé explicitement
        };

        console.log(`\x1b[34m[SEND]\x1b[0m ID: ${msgName}`);
        socket.emit('lua', payload);

        // On attend la réponse spécifique 'luaresult' avant de quitter
        const timeout = setTimeout(() => {
            console.log("\x1b[31m[TIMEOUT]\x1b[0m Pas de réponse de DCS.");
            process.exit(1);
        }, 5000);

        socket.on('luaresult', (data) => {
            if (data.name === msgName) {
                clearTimeout(timeout);
                console.log("\x1b[32m[SUCCESS]\x1b[0m DCS a acquitté l'exécution.");
                console.dir(data);
                process.exit(0);
            }
        });

    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
});