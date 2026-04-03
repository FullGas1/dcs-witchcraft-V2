-- ================================================================= --
-- TEST DE LIAISON WITCHCRAFT V2 (BASE64)
-- ================================================================= --
local testMsg = ">>> LIAISON BASE64 : OK <<<"
trigger.action.outText(testMsg, 10)
env.info("WITCHCRAFT TEST: " .. testMsg)

-- Affichage d'une marque fumigène sur le premier groupe joueur pour preuve visuelle
for _, unit in pairs(coalition.getGroups(coalition.side.BLUE)) do
    local pos = unit:getUnit(1):getPoint()
    trigger.action.smoke(pos, 1) -- Fumée orange
    break
end
