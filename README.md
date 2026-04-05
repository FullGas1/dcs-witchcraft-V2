# 📑 COMPLETE PROTOCOL: DCS WITCHCRAFT V2 INSTALLATION (FROM SCRATCH)

This document is the master technical reference for rebuilding the bridge between **VS Code**, a **Node.js v24 Server**, and **DCS World**.

See https://github.com/jboecker/dcs-witchcraft/tree/master/src/backend for the initial version.
Many thanks to jboecker for this tool which continues to be very useful.
---

## 1. DIRECTORY STRUCTURE

Manually create the following structure on your **E:** drive (or adapt the drive letter).

```text
E:\DCS\Edition_Missions_Tools\WitchCraft\dcs_witchcraft_V2\
├── windows\
│   ├── witchcraft.cmd       <-- Server Launcher
│   └── kill_server.cmd      <-- Cleanup Utility
└── src\
    ├── server.js            <-- Node.js Engine (Port 3000)
    ├── package.json         <-- Node Configuration
    ├── frontend\            <-- Web UI (index.html, console.html)
    ├── common\              <-- witchcraft.js (Logic)
    └── vendor_js\           <-- socket.io.js (v4.x)
```

---

## 2. SERVER HUB CONFIGURATION (NODE.JS)

### A. Node.js Initialization
1.  Open a terminal in `E:\...\dcs_witchcraft_V2\src`.
2.  Run: `npm init -y` followed by `npm install express socket.io`.

### B. The Server Launcher (`windows/witchcraft.cmd`)
Create this file to automate the bridge startup:
```batch
@echo off
TITLE DCS Witchcraft V2 Server
E:
cd /d "\DCS\Edition_Missions_Outils\WitchCraft\dcs_witchcraft_V2\src"
echo --- WITCHCRAFT V2 STARTING ---
node server.js
pause
```

### C. The Cleanup Utility (`windows/kill_server.cmd`)
Use this if you encounter "Port 3000 already in use" errors:
```batch
@echo off
taskkill /f /im node.exe
echo [OK] Port 3000 released.
timeout /t 2
```

---

## 3. TRANSMITTER CONFIGURATION (VS CODE gateway)

### A. Tools Directory
**Path:** `C:\Users\%USERNAME%\.vscode-dcs-tools\`
1.  Create the folder if it does not exist.
2.  Place your `bridge.js` file inside.
3.  **CRITICAL:** Open a terminal **inside this folder** and run:
    `npm install socket.io-client@latest`

### B. VS Code Task (`.vscode/tasks.json`)
In your Lua project, create this file to enable the **Shift + Ctrl + B** shortcut:
```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "DCS-Witchcraft: Send Lua",
            "type": "shell",
            "command": "node",
            "args": [
                "C:/Users/%USERNAME%/.vscode-dcs-tools/bridge.js",
                "${file}"
            ],
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "presentation": {
                "reveal": "always",
                "panel": "shared",
                "clear": true
            }
        }
    ]
}
```

---
## 4. CONSOLE EDITOR

To interact with the currently running mission by passing Lua scripts to it on the fly, open the Witchcraft console in a browser using the URL: http://localhost:3000/console.html
This console allows you to open multiple snippets, making it easy to run several scripts in parallel.

---
## 5. RECEIVER CONFIGURATION (DCS WORLD)

### A. Desanitization (Scripting Engine)
**File:** `C:\Program Files\Eagle Dynamics\DCS World\Scripts\MissionScripting.lua`
1.  Comment out the `io`, `os`, and `lfs` lines by adding `--` at the start.
2.  **Append this specific block to the end of the file:**
```lua
------------- Witchcraft Debugging System ----------------------
witchcraft = {}
witchcraft.host = "localhost"
witchcraft.port = 3001
dofile(lfs.writedir().."Scripts\\Witchcraft.lua")
```

### B. Script Installation
1.  Place the original `Witchcraft.lua` in `%USERPROFILE%\Saved Games\DCS\Scripts\`.
2.  Place the original `WitchcraftExport.lua` in `%USERPROFILE%\Saved Games\DCS\Scripts\`.
or `dofile(lfs.writedir()..[[Scripts\Witchcraft.lua]])` in Export.lua
or `dofile(lfs.writedir()..[[Scripts\WitchcraftExport.lua]])` in Export.lua

---

## 6. MISSION INITIALIZATION (.MIZ)

To allow the mission environment to accept incoming commands, you must open the socket via a trigger within the Mission Editor.

1.  **Trigger:** `ONCE` (ONE TIME).
2.  **Condition:** `TIME MORE (1)`.
3.  **Action:** `EXECUTE SCRIPT`:
```lua
dofile("%USERPROFILE%\\Saved Games\\DCS\\Scripts\\Witchcraft.lua")
```

---

## 7. NETWORK FLOW & PORTS SUMMARY

| Segment | Protocol | Port |
| :--- | :--- | :--- |
| **VS Code -> Node Server** | Socket.io (Websocket) | **3000** |
| **Web Console -> Node Server** | HTTP / Websocket | **3000** |
| **Node Server -> DCS Mission** | TCP (RAW JSON) | **3002** |

---

## 8. DAILY WORKFLOW

1.  **Cleanup:** Run `kill_server.cmd` (Optional, only if ports are locked).
2.  **Server:** Run `witchcraft.cmd`. Keep this window open.
3.  **DCS:** Start your mission. The server console must display `[Witchcraft] Connection established`.
4.  **Edit:** Modify your Lua file in VS Code stay on lua file you want to execute and press **Shift + Ctrl + B**.
5.  **Confirm:** The VS Code terminal will display `[SUCCESS] DCS acknowledged execution`.

---
> **Technical Note:** You must re-apply **Step 4.A** after every DCS World update, as the installer frequently overwrites the `MissionScripting.lua` file.