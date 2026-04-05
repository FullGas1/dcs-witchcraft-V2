-- select this file + adapte the groupName you want to test + shortcut  Ctrl+LShift+B -> execute the script
local groupName = "para_carrier" -- adapt this name to your groupName in mission running
return Group.getByName(groupName):getUnits()[1]:getName()
