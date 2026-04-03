const fs = require('fs');
const http = require('http');

const filePath = process.argv[2];
if (!filePath) { process.exit(1); }

try {
    const code = fs.readFileSync(filePath, 'utf8');
    const hexCode = Buffer.from(code).toString('hex');

    const payload = JSON.stringify({
        type: 'lua', // Changé de 'script' à 'lua' pour cohérence console
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
        res.on('end', () => {
            if (res.statusCode === 200) console.log(` [SUCCESS] Injecté via HEX.`);
        });
    });
    req.write(payload);
    req.end();
} catch (err) { process.exit(1); }