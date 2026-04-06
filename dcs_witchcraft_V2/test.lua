-- select this file + adapte the groupName you want to test + shortcut  Ctrl+LShift+B -> execute the script
local testNumber = 2 -- type 1 or 2

if testNumber == 1 then
    trigger.action.outText('fromVscode : test witcraft from vscode', 10) -- Look at the DCS window; the message should appear.
else
    local groupName =
    "Rotateur_g-1"                                                       -- adapt this name to your groupName in mission running
    return Group.getByName(groupName):getUnits()[1]:getName()            -- Look in the VS Code terminal; the unit name should appear.
end
