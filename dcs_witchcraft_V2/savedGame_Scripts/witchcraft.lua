-- ================================================================= --
-- PROJECT: WITCHCRAFT V2 MODERNIZATION
-- FILE: Saved Games/DCS/Scripts/Witchcraft.lua
-- DESCRIPTION: Système fiabilisé via HEX - AUTO-EXECUTABLE
-- ================================================================= --

package.path = package.path .. ";.\\LuaSocket\\?.lua;" .. lfs.writedir() .. "Scripts\\?.lua"
package.cpath = package.cpath .. ";.\\bin\\?.dll"

local socket = nil
local status, err = pcall(function() return require("socket") end)

if not (status and err) then
    env.error("WITCHCRAFT FATAL : Socket indisponible.")
    return
end
socket = err

-- 1. Décodeur HEX ultra-robuste
local function decodeHex(str)
    return (str:gsub('..', function(cc)
        return string.char(tonumber(cc, 16))
    end))
end

-- 2. Gestionnaire JSON (Natif DCS)
local function parseJSON(line)
    local s, res = pcall(net.json2lua, line)
    if s and res then return res end
    if JSON and JSON.decode then
        local s2, r2 = pcall(JSON.decode, line)
        if s2 and r2 then return r2 end
    end
    return nil
end

-- 3. Initialisation Serveur TCP (Port 3001)
local witchcraftServer = socket.tcp()
local res, bindErr = witchcraftServer:bind("*", 3001)
if not res then
    env.error("WITCHCRAFT BIND ERROR: " .. tostring(bindErr))
else
    witchcraftServer:listen(1)
    witchcraftServer:settimeout(0)
end

-- 4. Traitement des requêtes
local function processWitchcraft()
    if not witchcraftServer then return end
    local client = witchcraftServer:accept()
    if client then
        client:settimeout(5)
        local line, receiveErr = client:receive("*l")

        if not receiveErr and line then
            local request = parseJSON(line)
            if request and request.code then
                local luaCode = request.code

                if request.isHex then
                    luaCode = decodeHex(luaCode)
                end

                luaCode = luaCode:gsub("%z", "")

                local f, compileError = loadstring(luaCode, "witchcraft-exec")
                if f then
                    -- Exécution avec pcall pour éviter de faire planter DCS en cas d'erreur logique
                    local ok, runtimeError = pcall(f)
                    if not ok then
                        local msg = "WITCHCRAFT RUNTIME ERROR: " .. tostring(runtimeError)
                        env.error(msg)
                        trigger.action.outText(msg, 10)
                    end
                else
                    env.error("WITCHCRAFT COMPILE ERROR: " .. tostring(compileError))
                end
            end
        end
        client:close()
    end
end

-- 5. Scheduler (10 Hz)
local function witchcraftLoop()
    processWitchcraft()
    return timer.getTime() + 0.1
end

timer.scheduleFunction(witchcraftLoop, nil, timer.getTime() + 1)
env.info("WITCHCRAFT MODERNIZED: HEX Tunnel Ready.")
