/**
 * PROJECT: WITCHCRAFT V2 MODERNIZATION
 * FILE: bridge.js
 * DESCRIPTION: Encode le script en HEX pour une transmission 100% fiable.
 */

const fs = require('fs');
const http = require('http');

const filePath = process.argv[2];

if (!filePath) {
    console.error(" [ERROR] Aucun fichier spécifié.");
    process.exit(1);
}

try {
    const code = fs.readFileSync(filePath, 'utf8');
    const hexCode = Buffer.from(code).toString('hex');

    const payload = JSON.stringify({
        type: 'script',
        isHex: true,
        code: hexCode
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/', 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log(` [SUCCESS] Code injecté via HEX (${hexCode.length} chars).`);
            } else {
                console.log(` [ERROR] Status: ${res.statusCode} | ${responseData}`);
            }
        });
    });

    req.on('error', (e) => {
        console.error(` [TIMEOUT/ERROR] Serveur Node.js injoignable : ${e.message}`);
    });

    req.write(payload);
    req.end();

} catch (err) {
    console.error(` [ERROR] Lecture fichier : ${err.message}`);
    process.exit(1);
}