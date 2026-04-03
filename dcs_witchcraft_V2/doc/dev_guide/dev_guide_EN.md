# DEVELOPER DOCUMENTATION: ARCHITECTURE & REAL REPOSITORY MAPPING (WITCHCRAFT_V2)

This document provides the exact technical specifications and file locations based on the functional bridge-relay-client architecture.

---

## 1. REAL REPOSITORY DELIVERABLES

| Component | Path in Repository | Deployment Target | Role |
| :--- | :--- | :--- | :--- |
| **bridge.js** | `bridge.js` | `~/.vscode-dcs-tools/` | CLI Encoder (Node.js) |
| **server.js** | `src/server.js` | Project Root | Relay Server (HTTP/TCP/WS) |
| **Witchcraft.lua** | `savedGame_Scripts/Witchcraft.lua` | `Saved Games/DCS/Scripts/` | Main Listener (Lua) |
| **WitchcraftExport.lua** | `savedGame_Scripts/WitchcraftExport.lua` | `Saved Games/DCS/Scripts/` | Log & Error Exporter |
| **JSON.lua** | `savedGame_Scripts/JSON.lua` | `Saved Games/DCS/Scripts/` | JSON Support Library |
| **console.html** | `src/frontend/console.html` | `witchcraft instal folder` | witchcraft lua editor |

---

## 2. NETWORK ARCHITECTURE & PORT ASSIGNMENTS

| Port | Protocol | Logic Flow | Responsibility |
| :--- | :--- | :--- | :--- |
| **3000** | **HTTP** | VS Code -> Relay | Inbound injection requests (POST JSON). |
| **3001** | **TCP** | Relay -> DCS | Outbound HEX-encoded stream to Lua socket. |
| **3000** | **WS** | DCS -> Relay | Bi-directional Socket.io logs for the console. |

---

## 3. CRITICAL TECHNICAL CONSTRAINTS (THE "WHY")

### 3.1 The "Unexpected Symbol near '0000'" Issue
DCS's Lua environment often fails when receiving raw strings over network sockets due to null-byte (`\0`) injection or encoding mismatches.
* **Solution**: `bridge.js` converts the entire script into a **Hexadecimal string**.
* **Integrity**: This ensures that only alphanumeric characters are sent over TCP Port 3001.

### 3.2 Global Tooling Integration (VS Code)
To avoid duplicating `node_modules` in every mission project, the bridge is centralized:
1. **Location**: `C:\Users\%USERNAME%\.vscode-dcs-tools\`
2. **Setup**: Run `npm install socket.io-client@latest express@latest` ONLY in this folder.
3. **Execution**: VS Code tasks must use the absolute path to this global `bridge.js`.

---

## 4. DEVELOPMENT & CODING STANDARDS (OOP LUA)

* **Namespacing**: Use unique tables (e.g., `BASE_MODULE = {}`) to avoid polluting the DCS global environment.
* **Sandboxing**: All injections are wrapped in `pcall(loadstring(code))`.
* **DCS API**: Strictly use the **Simulator Scripting Engine (SSE)** documentation. Do not attempt to use `io` or `os` modules unless the `MissionScripting.lua` has been properly sanitized (commented out).

---

## 5. VS CODE TASK DEFINITION (VERIFIED PATHS)

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Inject to DCS (HEX)",
            "type": "shell",
            "command": "node C:/Users/${env:USERNAME}/.vscode-dcs-tools/bridge.js ${file}",
            "group": { "kind": "build", "isDefault": true }
        }
    ]
}