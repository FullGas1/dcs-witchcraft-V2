C'est une erreur de ma part. Pour une utilisation professionnelle et multi-projets, la centralisation du Bridge dans un dossier utilisateur est effectivement la seule méthode propre pour éviter la duplication des scripts et des dépendances `npm`.

Voici le document **intégral et consolidé**, incluant cette architecture centralisée, en un seul bloc Markdown pour votre usage.

```markdown
# DOCUMENTATION MAÎTRE : WITCHCRAFT_V2 MODERNIZED (HEX EDITION)

Ce document unique détaille les instructions d'installation, la configuration centralisée du workflow VS Code et l'architecture de la chaîne de communication.

---

## 1. GUIDE UTILISATEUR (INSTALLATION DCS)

### 1.1 Localisation des composants dans le Repository
| Fichier | Chemin dans le Repo | Rôle dans la chaîne |
| :--- | :--- | :--- |
| **bridge.js** | `src/node/bridge.js` | **Émetteur** : Encode le code source en HEX et l'envoie au serveur. |
| **server.js** | `src/node/server.js` | **Relais** : Reçoit le flux HTTP et le redirige en TCP vers DCS (Port 3001). |
| **Witchcraft.lua** | `src/dcs/Witchcraft.lua` | **Récepteur** : Écoute, décode et exécute le code dans DCS. |
| **WitchcraftExport.lua** | `src/dcs/WitchcraftExport.lua` | **Logger** : Capture et remonte les erreurs DCS vers la console. |
| **JSON.lua** | `src/dcs/lib/JSON.lua` | **Utilitaire** : Support de formatage des données. |

### 1.2 Installation des fichiers dans DCS (Saved Games)
1. Naviguez vers : `C:\Utilisateurs\[Nom]\Parties Enregistrées\DCS\Scripts\`.
2. Copiez **Witchcraft.lua**, **WitchcraftExport.lua** et **JSON.lua** directement dans ce dossier.

### 1.3 Débridage du moteur de script (MissionScripting.lua)
1. Allez dans : `...\Eagle Dynamics\DCS World\Scripts\`.
2. Ouvrez **MissionScripting.lua** (droits admin) et commentez les lignes suivantes à la fin du fichier :
   - `-- require = nil`
   - `-- loadlib = nil`

### 1.4 Configuration dans l'Éditeur de Mission (ME)
1. Créez un déclencheur : `TYPE: 1 ON MISSION START`.
2. Action : `DO SCRIPT FILE`.
3. Sélectionnez : `Parties Enregistrées\DCS\Scripts\Witchcraft.lua`.

---

## 2. CONFIGURATION DU TRANSMETTEUR (CENTRALISATION VS CODE)

Pour permettre l'utilisation de Witchcraft sur plusieurs projets sans dupliquer les outils, le transmetteur est installé de manière globale.

### 2.1 Répertoire des Outils (Tools Directory)
**Chemin :** `C:\Users\%USERNAME%\.vscode-dcs-tools\`
1. Créez ce dossier s'il n'existe pas.
2. Placez votre fichier **bridge.js** à l'intérieur.
3. **IMPORTANT :** Ouvrez un terminal dans ce dossier et exécutez la commande suivante pour installer les dépendances nécessaires :
   `npm install socket.io-client@latest`

### 2.2 Lancement du serveur relais
Le serveur Node.js doit être actif pour faire le pont.
1. Ouvrez un terminal dans votre projet actuel.
2. Lancez le serveur : `node src/node/server.js`.

### 2.3 Configuration de la Task VS Code (Multi-Projets)
Dans chaque projet DCS, créez ou modifiez le fichier `.vscode/tasks.json`. Notez l'utilisation du chemin absolu vers le dossier global `USERPROFILE` :

{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Inject to DCS (HEX)",
            "type": "shell",
            "command": "node C:/Users/${env:USERNAME}/.vscode-dcs-tools/bridge.js ${file}",
            "group": { "kind": "build", "isDefault": true },
            "presentation": { "reveal": "always", "panel": "new" }
        }
    ]
}

---

## 3. ARCHITECTURE DE LA CHAÎNE DE COMMUNICATION

Le système fonctionne selon un flux de données "Bout-en-Bout" sécurisé :

1. **VS Code (Source)** : Le développeur travaille sur ses classes Lua.
2. **Bridge (Encoder)** : Le script centralisé `bridge.js` transforme le texte brut en chaîne **Hexadécimale**. Cela garantit que les caractères spéciaux ou nuls ne corrompent pas le transfert.
3. **Server (Relay)** : Le script `server.js` reçoit la requête HTTP (port 3000) et la transmet au socket TCP (port 3001) de DCS.
4. **DCS Client (Receiver)** : `Witchcraft.lua` écoute à 10Hz, réceptionne le paquet, décode l'HEX, nettoie les octets parasites et exécute le code via `pcall(loadstring(code))`.
5. **Export (Feedback)** : En cas d'erreur, `WitchcraftExport.lua` intercepte l'exception et la renvoie au serveur Node.js pour affichage immédiat dans le terminal VS Code.

---
*Document généré le 03/04/2026 - Fin de documentation.*
```