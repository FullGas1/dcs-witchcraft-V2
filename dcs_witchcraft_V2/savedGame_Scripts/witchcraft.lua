--[[
Add the following to MissionScripting.lua:

witchcraft = {}
witchcraft.host = "localhost"
witchcraft.port = 3001
dofile(lfs.writedir().."Scripts\\witchcraft.lua")
]]--

do
	local require = require
	local loadfile = loadfile
	
	env.info("WITCHCRAFT: Initializing...")
	
	if not witchcraft then
		env.info("WITCHCRAFT ERROR: global witchcraft object does not exist. Check MissionScripting.lua.")
		return
	end
	
	package.path = package.path..";.\\LuaSocket\\?.lua"
	package.cpath = package.cpath..";.\\LuaSocket\\?.dll"
	
	-- Chargement portable du décodeur JSON
	local json_path = lfs.writedir().."Scripts\\JSON.lua"
	local json_file = loadfile(json_path)
	if json_file then
		witchcraft.JSON = json_file()
		env.info("WITCHCRAFT: JSON decoder loaded successfully.")
	else
		env.info("WITCHCRAFT FATAL ERROR: Could not find JSON.lua at " .. json_path)
		return
	end
	
	local socket = require("socket")
	
	function witchcraft.luaMissionToJSONable()
		local mission = mist.utils.deepCopy(env.mission)
		for _, coalition in pairs(mission.coalition) do
			for _, country in pairs(coalition.country) do
				for _, category_name in pairs({"vehicle", "helicopter", "plane", "ship"}) do
					local category = country[category_name]
					if category then
						for _, group in pairs(category.group) do
							for _, unit in pairs(group.units) do
								if type(unit.callsign) == "table" then
									local new_callsign = {
										name = unit.callsign.name,
										["1"] = unit.callsign[1],
										["2"] = unit.callsign[2],
										["3"] = unit.callsign[3]
									}
									unit.callsign = new_callsign
								end
							end
						end
					end
				end
			end
		end
		return mission
	end

	function witchcraft.considerUnit(unit)
		if not unit then return false end
		if not Unit.isExist(unit) then return false end
		if not unit:isActive() then return false end
		return true
	end
	
	function witchcraft.unitUpdate()
		local msg = {}
		msg.type = "unitupdate"
		msg.units = {}
		for _, aliveUnit in pairs(mist.DBs.aliveUnits) do
			local unit = Unit.getByName(aliveUnit.unitName)
			if witchcraft.considerUnit(unit) then
				local pos = unit:getPosition()
				msg.units[#msg.units+1] = {
					uN = aliveUnit.unitName,
					pd = pos, 
					cat = aliveUnit.category,
					t = unit:getTypeName(),
					c = unit:getCoalition(),
					alt = pos.p.y - land.getHeight({ x = pos.p.x, y = pos.p.z}),
				}
			end
		end
		witchcraft.txbuf = witchcraft.txbuf .. witchcraft.JSON:encode(msg):gsub("\n", "").."\n"
	end
	
	function witchcraft.step(arg, time)
		-- 1. Gestion de l'envoi vers le serveur
		if witchcraft.txbuf:len() > 0 then
			local bytes_sent = nil
			local ret1, ret2, ret3 = witchcraft.conn:send(witchcraft.txbuf)
			if ret1 then
				bytes_sent = ret1
			else
				if ret3 == 0 then
					if ret2 == "closed" then
						witchcraft.txbuf = '{"type":"dummy"}\n'
						witchcraft.conn = socket.tcp()
						witchcraft.conn:settimeout(.0001)
					end
					witchcraft.conn:connect(witchcraft.host, witchcraft.port)
					return
				end
				bytes_sent = ret3
			end
			witchcraft.txbuf = witchcraft.txbuf:sub(bytes_sent + 1)
		end
		
		-- 2. RÉCEPTION ET EXÉCUTION (VERSION HYBRIDE VSCODE/CONSOLE)
		local line, err = witchcraft.conn:receive("*l")
		if not err and line and line:len() > 0 then
			env.info("WITCHCRAFT RAW: " .. tostring(line))
			
			local code_to_run = nil
			local script_name = "remote-exec"
			
			-- TENTATIVE 1 : Décodage JSON standard (Idéal pour VS Code)
			local status, decoded = pcall(function() return witchcraft.JSON:decode(line) end)
			if status and type(decoded) == "table" then
				code_to_run = decoded["code"] or decoded["lua"]
				script_name = decoded["name"] or script_name
			end
			
			-- TENTATIVE 2 : Pattern Matching précis (Si JSON échoue ou console simple)
			if not code_to_run then
				-- On cherche spécifiquement le contenu de "code":"..." sans déborder sur la suite
				code_to_run = line:match('.-"code"%s*:%s*"(.-)"%s*[,}]')
			end
			
			if code_to_run then
				-- Nettoyage des caractères d'échappement et des retours chariots JSON
				code_to_run = code_to_run:gsub('\\"', '"'):gsub('\\\\', '\\'):gsub('\\r', '\r'):gsub('\\n', '\n')
				
				env.info("WITCHCRAFT: Executing: " .. code_to_run:sub(1, 50) .. "...")
				
				local f, error_msg = loadstring(code_to_run, script_name)
				if f then
					setfenv(f, witchcraft.mission_env)
					local exec_status, exec_result = pcall(f)
					
					-- 1. Préparation de la réponse
					local response = {
						type = "luaresult",
						success = exec_status,
						result = tostring(exec_result),
						name = script_name
					}
					
					pcall(function()
						local encoded_resp = witchcraft.JSON:encode(response):gsub("\n","").."\n"
						witchcraft.txbuf = witchcraft.txbuf .. encoded_resp
						
						-- 2. FORCE SEND (FLUSH) : On envoie tout de suite ce qui est dans le buffer
						-- Cela permet à VS Code de recevoir la réponse AVANT que le bridge ne coupe
						if witchcraft.txbuf:len() > 0 then
							local bytes_sent, err, partial = witchcraft.conn:send(witchcraft.txbuf)
							if bytes_sent then
								witchcraft.txbuf = witchcraft.txbuf:sub(bytes_sent + 1)
							elseif partial then
								witchcraft.txbuf = witchcraft.txbuf:sub(partial + 1)
							end
						end
					end)
				else
					env.info("WITCHCRAFT: Loadstring Error: " .. tostring(error_msg))
					-- Optionnel : Envoyer l'erreur à VS Code aussi pour qu'il ne timeout pas
				end
			else
				env.info("WITCHCRAFT: Failed to extract code from line")
			end
		end
	end
	
	function witchcraft_start(mission_env_)
		witchcraft.mission_env = mission_env_
		if not witchcraft.scheduled then
			witchcraft.txbuf = '{"type":"dummy"}\n'
			witchcraft.conn = socket.tcp()
			witchcraft.conn:settimeout(.0001)
			witchcraft.conn:connect(witchcraft.host, witchcraft.port)
			
			timer.scheduleFunction(function(arg, time)
					local status, err = pcall(witchcraft.step)
					if not status then env.info("WITCHCRAFT STEP ERROR: "..tostring(err)) end
					return timer.getTime() + .1
				end, nil, timer.getTime() + .1)
			
			witchcraft.scheduled = true
		end
	end
	witchcraft.start = witchcraft_start
end