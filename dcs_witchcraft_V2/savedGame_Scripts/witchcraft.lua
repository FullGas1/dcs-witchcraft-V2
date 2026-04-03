-- WITCHCRAFT V2 - CLIENT DCS PROPRE
package.path = package.path .. ";.\\LuaSocket\\?.lua;" .. lfs.writedir() .. "Scripts\\?.lua"

local socket = nil
local status, res = pcall(require, "socket")
if status then socket = res else return end

local function decodeHex(str)
    return (str:gsub('..', function(cc) return string.char(tonumber(cc, 16)) end))
end

local witchcraftClient = socket.tcp()
witchcraftClient:settimeout(0) 
witchcraftClient:connect("127.0.0.1", 3001)

local function processWitchcraft()
    if not witchcraftClient then return end
    local line, err = witchcraftClient:receive("*l")

    if not err and line then
        local success, request = pcall(net.json2lua, line)
        if success and request and request.code then
            local luaCode = request.code
            if request.isHex then luaCode = decodeHex(luaCode) end
            luaCode = luaCode:gsub("%z", "")

            local f, compileErr = loadstring(luaCode, "witchcraft-exec")
            if f then
                local ok, runErr = pcall(f)
                if not ok then env.error("WITCHCRAFT RUNTIME ERR: "..tostring(runErr)) end
            else
                env.error("WITCHCRAFT COMPILE ERR: " .. tostring(compileErr))
            end
        end
    elseif err == "closed" then
        witchcraftClient:connect("127.0.0.1", 3001)
    end
end

local function witchcraftLoop()
    processWitchcraft()
    return timer.getTime() + 0.1
end

timer.scheduleFunction(witchcraftLoop, nil, timer.getTime() + 1)
env.info("WITCHCRAFT V2 READY")