-- JSON.lua pour DCS Witchcraft
local JSON = {}

function JSON:decode(s)
    local func = loadstring("return " .. s:gsub('"(.-)":', '[%1]='):gsub(':(.-),', '=%1,'):gsub(':(.-)}', '=%1}'))
    if func then return func() else return nil end
end

function JSON:encode(v)
    if v == nil then return "null" end
    local vtype = type(v)
    if vtype == "string" then return '"' .. v .. '"'
    elseif vtype == "number" or vtype == "boolean" then return tostring(v)
    elseif vtype == "table" then
        local r = {}
        for k, n in pairs(v) do table.insert(r, '"' .. k .. '":' .. JSON:encode(n)) end
        return "{" .. table.concat(r, ",") .. "}"
    end
end

return JSON