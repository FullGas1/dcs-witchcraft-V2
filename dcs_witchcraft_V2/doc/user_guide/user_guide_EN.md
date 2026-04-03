# MASTER DOCUMENTATION: WITCHCRAFT_V2 MODERNIZED (HEX EDITION)

This single document contains all the instructions for installation, centralized VS Code workflow configuration, and technical architecture of the real-time code injection system for DCS World.

---

## 1. USER GUIDE (DCS INSTALLATION)

### 1.1 Component Locations in the Repository
| File | Path in Repo | Role in the Chain |
| :--- | :--- | :--- |
| **bridge.js** | `src/node/bridge.js` | **Transmitter**: Encodes source code into HEX and sends it to the server. |
| **server.js** | `src/node/server.js` | **Relay**: Receives HTTP flow and redirects it via TCP to DCS (Port 3001). |
| **Witchcraft.lua** | `src/dcs/Witchcraft.lua` | **Receiver**: Listens, decodes, and executes the code within DCS. |
| **WitchcraftExport.lua** | `src/dcs/WitchcraftExport.lua` | **Logger**: Captures and reports DCS errors back to the console. |
| **JSON.lua** | `src/dcs/lib/JSON.lua` | **Utility**: Data formatting support library. |

### 1.2 File Installation in DCS (Saved Games)
1. Navigate to: `C:\Users\[Name]\Saved Games\DCS\Scripts\`.
2. If the `Scripts` folder does not exist, create it.
3. Copy **Witchcraft.lua**, **WitchcraftExport.lua**, and **JSON.lua** directly into this folder.

### 1.3 Unlocking the Scripting Engine (MissionScripting.lua)
DCS restricts network functions by default. You must authorize the `socket` module:
1. Go to: `...\Eagle Dynamics\DCS World\Scripts\`.
2. Open **MissionScripting.lua** (admin rights required) and comment out the following lines at the end of the file:
   - `-- require = nil`
   - `-- loadlib = nil`

### 1.4 Mission Editor Configuration (ME)
1. Create a trigger: `TYPE: 1 ON MISSION START`.
2. Action: `DO SCRIPT FILE`.
3. Select: `Saved Games\DCS\Scripts\Witchcraft.lua`.

---

## 2. TRANSMITTER CONFIGURATION (VS CODE CENTRALIZATION)

To allow the use of Witchcraft across multiple projects without duplicating tools, the transmitter is installed globally.

### 2.1 Tools Directory
**Path:** `C:\Users\%USERNAME%\.vscode-dcs-tools\`
1. Create this folder if it does not exist.
2. Place your **bridge.js** file inside.
3. **CRITICAL:** Open a terminal **inside this folder** and run the following command to install the required dependencies:
   `npm install socket.io-client@latest`

### 2.2 Starting the Relay Server
The Node.js server must be active to bridge the connection.
1. Open a terminal in your current project.
2. Start the server: `node src/node/server.js`.

### 2.3 VS Code Task Configuration (Multi-Project)
In each DCS project, create or modify the `.vscode/tasks.json` file. Note the use of the absolute path to the global `USERPROFILE` directory:

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

## 3. COMMUNICATION CHAIN ARCHITECTURE

The system operates via a secure "End-to-End" data flow:

1. **VS Code (Source)**: The developer works on their Object-Oriented Lua classes.
2. **Bridge (Encoder)**: The centralized `bridge.js` script transforms raw text into a **Hexadecimal** string. This ensures that special or null characters do not corrupt the transfer.
3. **Server (Relay)**: The `server.js` script receives the HTTP request (port 3000) and forwards it to the TCP socket (port 3001) of DCS.
4. **DCS Client (Receiver)**: `Witchcraft.lua` listens at 10Hz, receives the packet, decodes the HEX, cleans up any parasitic bytes, and executes the code via `pcall(loadstring(code))`.
5. **Export (Feedback)**: If an error occurs, `WitchcraftExport.lua` intercepts the exception and sends it back to the Node.js server for immediate display in the VS Code terminal.

---
*Document generated on 04/03/2026 - End of documentation.*