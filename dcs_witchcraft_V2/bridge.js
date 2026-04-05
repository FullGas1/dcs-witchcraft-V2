const fs = require('fs');
const http = require('http');

const filePath = process.argv[2];
if (!filePath) { process.exit(1); }

try {
    const code = fs.readFileSync(filePath, 'utf8');
    const hexCode = Buffer.from(code).toString('hex');

    const payload = JSON.stringify({
        type: 'lua',
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
                try {
                    const parsed = JSON.parse(responseData);
                    console.log('\x1b[32m[SUCCESS]\x1b[0m');
                    // Affichage formaté du résultat DCS
                    console.log(JSON.stringify(parsed.result, null, 2));
                } catch (e) {
                    console.log(` [SUCCESS] Injecté via HEX (Réponse brute: ${responseData})`);
                }
            } else {
                console.log(`\x1b[31m[ERREUR]\x1b[0m Status: ${res.statusCode}`);
                console.log(responseData);
            }
            process.exit(0);
        });
    });

    req.on('error', (err) => {
        console.error(`\x1b[31m[ERREUR SERVEUR]\x1b[0m ${err.message}`);
        process.exit(1);
    });

    req.write(payload);
    req.end();
} catch (err) { 
    console.error(`\x1b[31m[ERR]\x1b[0m ${err.message}`);
    process.exit(1); 
}