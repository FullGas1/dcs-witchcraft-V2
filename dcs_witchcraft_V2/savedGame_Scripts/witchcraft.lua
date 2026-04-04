-- WITCHCRAFT CLIENT DCS - PERSISTENT HEX VERSION
package.path = package.path .. ";.\\LuaSocket\\?.lua;" .. lfs.writedir() .. "Scripts\\?.lua"

local socket = require("socket")
local witchcraftClient = nil
local lastAttempt = 0

-- Utilitaire Hex
local function toHex(str)
    return (str:gsub('.', function(c) return string.format('%02x', string.byte(c)) end))
end

-- Sérialisation simplifiée
local function basicSerialize(val)
    local t = type(val)
    if t == "table" then
        local res = "{"
        local first = true
        for k, v in pairs(val) do
            if not first then res = res .. "," end
            local key = (type(k) == "string") and '"'..k..'"' or tostring(k)
            res = res .. key .. ":" .. basicSerialize(v)
            first = false
        end
        return res .. "}"
    elseif t == "string" then
        return '"' .. val:gsub('"', '\\"'):gsub('\n', '\\n') .. '"'
    elseif t == "number" or t == "boolean" then return tostring(val)
    else return '"' .. tostring(val) .. '"' end
end

-- Fonction de connexion persistante
local function tryConnect()
    local now = os.time()
    if now - lastAttempt < 2 then return end 
    lastAttempt = now

    local tcp = socket.tcp()
    tcp:settimeout(0.5) -- Timeout court pour ne pas figer DCS
    
    local success, err = tcp:connect("127.0.0.1", 3001)
    
    if success then
        tcp:settimeout(0) -- Passage en non-bloquant
        witchcraftClient = tcp
        env.info("WITCHCRAFT : CONNECTÉ AU HUB")
        trigger.action.outText("Witchcraft : Connecté au Hub", 2)
    else
        tcp:close()
    end
end

function processWitchcraft()
    if not witchcraftClient then
        tryConnect()
        return
    end
    
    local line, err = witchcraftClient:receive("*l")

    if not err and line then
        local success, request = pcall(net.json2lua, line)
        if success and request and request.code then
            local luaCode = request.code
            if request.isHex then
                luaCode = (luaCode:gsub('..', function(cc) return string.char(tonumber(cc, 16)) end))
            end

            local f, compileErr = loadstring(luaCode, "witchcraft-exec")
            local isOk, resultData
            
            if f then
                isOk, resultData = pcall(f)
            else
                isOk = false
                resultData = "Compile Error: " .. tostring(compileErr)
            end

            -- Retour sécurisé en Hex
            local rawResult = basicSerialize(resultData)
            local responseJSON = '{"type":"luaresult","success":' .. tostring(isOk) .. ',"result":"' .. toHex(rawResult) .. '","isHex":true}'
            
            local sendOk, sendErr = witchcraftClient:send(responseJSON .. "\n")
            if not sendOk then
                witchcraftClient:close()
                witchcraftClient = nil
            end
        end
    elseif err == "closed" then
        witchcraftClient = nil
    end
end

function witchcraftLoop()
    processWitchcraft()
    return timer.getTime() + 0.1
end

-- Lancement de la boucle
timer.scheduleFunction(witchcraftLoop, nil, timer.getTime() + 1)
env.info("WITCHCRAFT : Système de reconnexion initialisé")