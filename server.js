require("dotenv").config();
const { spawn, execSync } = require("child_process");
const WebSocket = require("ws");
const extract = require("extract-zip");
const axios = require("axios");
const readline = require("readline");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { autoUpdate } = require("./lib/auto-update.js");
const port = process.env.WEBSOCKET_PORT || 3000;
const auto_update = process.env.AUTO_UPDATER === 'true' || false;
let idle = false;

/*=============[ CREATED BY MiKako Sou ]=============*/

async function start() {
    //Auto Update
    if (auto_update) await autoUpdate();

    //Put chat logger
    serverProperties = fs.readFileSync("./Bedrock Server/server.properties", "utf8");
    let startup = serverProperties.replace(/^content-log-console-output-enabled=false/m, `content-log-console-output-enabled=${process.env.LOGGER === 'true' ? 'true' : 'false'}`)
        .replace(/^server-name=.*$/m, `server-name=${process.env.SERVER_NAME || "Bedrock Server"}`)
        .replace(/^gamemode=.*$/m, `gamemode=${process.env.GAME_MODE || "survival"}`)
        .replace(/^difficulty=.*$/m, `difficulty=${process.env.DIFFICULTY || "normal"}`)
        .replace(/^allow-cheats=.*$/m, `allow-cheats=${process.env.CHEATS || "false"}`)
        .replace(/^server-port=.*$/m, `server-port=${process.env.BEDROCK_PORT || 19132}`)
        .replace(/^level-name=.*$/m, `level-name=${process.env.WORLD_NAME || "Bedrock level"}`);

        if (/^emit-server-telemetry=.*$/m.test(startup)) {
            startup = startup.replace(
                /^emit-server-telemetry=.*$/m,
                `emit-server-telemetry=${process.env.TELEMETRY === 'true' ? 'true' : 'false'}`
            );
        } else {
            startup += `\nemit-server-telemetry=${process.env.TELEMETRY === 'true' ? 'true' : 'false'}`;
        }

    const worldName = startup.match(/^level-name=(.*)$/m)[1];
    if(!fs.existsSync(`./Bedrock Server/worlds/${worldName}/behavior_packs`)) {
        fs.mkdirSync(`./Bedrock Server/worlds/${worldName}/behavior_packs`, { recursive: true });
    }
    try {
        if(!fs.existsSync(`./Bedrock Server/behavior_packs/chatReceiver`)) await extract("./add-on/chatReceiver.zip", { dir: path.resolve(`./Bedrock Server/behavior_packs`) });
        if(!fs.existsSync(`./Bedrock Server/worlds/${worldName}/behavior_packs/chatReceiver`)) await extract("./add-on/chatReceiver.zip", { dir: path.resolve(`./Bedrock Server/worlds/${worldName}/behavior_packs`) });
        console.log("Chat Logger installed successfully.");
    } catch (err) {
        console.error("Failed to install Chat Logger:", err);
    }
    console.log("⚙ Configure chat logger...")
    if(fs.existsSync(`./Bedrock Server/worlds/${worldName}/world_behavior_pack_history.json`)) {
        bhHistory = JSON.parse(fs.readFileSync(`./Bedrock Server/worlds/${worldName}/world_behavior_pack_history.json`, "utf8"));

        const checkHistory = bhHistory.packs.some(pack => {
            if (typeof pack.name === "string") {
                return pack.name === "Chat_Receiver";
            } else if (typeof pack.name === "object") {
                return Object.values(pack.name).includes("Chat_Receiver");
            }
                return false;
        })

        if(!checkHistory) {
            bhHistory.packs.push({
                can_be_redownloaded: false,
                name: "Chat_Receiver",
                uuid: "7e58bedb-07d8-40f6-826f-e3d113c0fbe6",
                version: [1, 0, 0]
            })
        }
        fs.writeFileSync(`./Bedrock Server/worlds/${worldName}/world_behavior_pack_history.json`, JSON.stringify(bhHistory, null, 2))
    } else {
        bhHistory = {
            packs: [
                {
                    can_be_redownloaded: false,
                    name: "Chat_Receiver",
                    uuid: "7e58bedb-07d8-40f6-826f-e3d113c0fbe6",
                    version: [1, 0, 0]
                }
            ]
        }
        fs.writeFileSync(`./Bedrock Server/worlds/${worldName}/world_behavior_pack_history.json`, JSON.stringify(bhHistory, null, 2))
    }

    if(!fs.existsSync(`./Bedrock Server/worlds/${worldName}/world_behavior_packs.json`)) {
        bhData = [
            {
                "pack_id" : "7e58bedb-07d8-40f6-826f-e3d113c0fbe6",
                "version" : [ 1, 0, 0 ]
            }
        ]
        fs.writeFileSync(`./Bedrock Server/worlds/${worldName}/world_behavior_packs.json`, JSON.stringify(bhData, null, 2))
    } else {
        bhData = JSON.parse(fs.readFileSync(`./Bedrock Server/worlds/${worldName}/world_behavior_packs.json`, "utf8"));
        const checkData = bhData.some(pack => pack.pack_id === "7e58bedb-07d8-40f6-826f-e3d113c0fbe6");
        if(!checkData) {
            bhData.push({
                "pack_id" : "7e58bedb-07d8-40f6-826f-e3d113c0fbe6",
                "version" : [ 1, 0, 0 ]
            })
        }
        fs.writeFileSync(`./Bedrock Server/worlds/${worldName}/world_behavior_packs.json`, JSON.stringify(bhData, null, 2))
    }

    //Setting allowlist
    const whitelistData = JSON.parse(fs.readFileSync("./db/allowlist.json"))
    const toggleFeatures = JSON.parse(fs.readFileSync("./db/toggle_features.json"))
    startup = startup.replace(/^allow-list=.*$/m, `allow-list=${toggleFeatures.allowlist ? 'true' : 'false'}`)
    fs.writeFileSync("./Bedrock Server/server.properties", startup, "utf8");
    fs.writeFileSync("./Bedrock Server/allowlist.json", JSON.stringify(whitelistData, null, 2))
    

    console.log("✅ Configure complete. Starting server...");
    
    // Run Bedrock Server
    let bds;
    if (os.platform() === "win32") {
     bds = spawn("./bedrock_server.exe", [], {cwd: path.join(__dirname, "Bedrock Server"), stdio : 'pipe'});
    } else {
     execSync('chmod +x "./Bedrock Server/bedrock_server"');
     bds = spawn("./bedrock_server", [], {cwd: path.join(__dirname, "Bedrock Server"), stdio : 'pipe'});
    }
    // Setup WebSocket server
    const wss = new WebSocket.Server({ port });
    const clients = new Set();

    //Setup Console Input
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    rl.on("line", (input) => {
        if(!input) return;

        if(input.startsWith("[BACKUP]")) {
            clients.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(input);
                }
            });
        }else {
            console.info("[EXECUTE]", input)
            bds.stdin.write(input + "\n")
        }
    })



    function heartBeat() {
        this.isAlive = true;
    }
    
    bds.stdout.on("data", (data) => {
        console.log(`BDS: ${data}`);

        //error detection
        if (data.toString().includes("requested invalid version") && data.toString().includes("Chat_Receiver")) {
            if (data.toString().includes("@minecraft/server")) {
                match = data.toString().match(/Current \[beta\] version is \[(?<version>[^\]]+)\]/);
                if (!match || !match.groups) console.error("Failed to detect current version from log.");
                manifest = JSON.parse(fs.readFileSync(`./Bedrock Server/worlds/${worldName}/behavior_packs/chatReceiver/manifest.json`));
                manifest.dependencies[0].version = match.groups.version
                fs.writeFileSync(`./Bedrock Server/worlds/${worldName}/behavior_packs/chatReceiver/manifest.json`, JSON.stringify(manifest, null, 2));
            }
            if (data.toString().includes("@minecraft/server-ui")) {
                match = data.toString().match(/Current \[beta\] version is \[(?<version>[^\]]+)\]/);
                if (!match || !match.groups) console.error("Failed to detect current version from log.");
                manifest = JSON.parse(fs.readFileSync(`./Bedrock Server/worlds/${worldName}/behavior_packs/chatReceiver/manifest.json`));
                manifest.dependencies[1].version = match.groups.version
                fs.writeFileSync(`./Bedrock Server/worlds/${worldName}/behavior_packs/chatReceiver/manifest.json`, JSON.stringify(manifest, null, 2));
            }
        }
        
        clients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data.toString());
            }
        });
    });
    
    bds.stderr.on("data", (data) => {
        console.error(`Error: ${data}`);
    });
    
    wss.on("connection", (ws, req) => {
        console.log("Client connected: " + req.socket.remoteAddress);
        clients.add(ws);
    
        ws.isAlive = true;
        ws.on('pong', heartBeat);

        ws.on("message", async(message) => {
            console.log(`Received: ${message}`);
            const str = message.split(" ")
            const command = str[0]
            const method = str[1]
            if(command === "whitelist") {
                const rawGamertag = str.slice(2).join(" ");
                const gamertag = rawGamertag.replace(/"/g, "");
                switch(method) {
                    case "add":
                    case "remove":{
                        const check = await axios.get(`https://mcprofile.io/api/v1/bedrock/gamertag/${encodeURIComponent(gamertag)}`);
                        if(check.data.message) {
                            console.error(`Player "${gamertag}" isn't register`)
                            clients.forEach(ws => {
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send(`Player "${gamertag}" isn't register`);
                                }
                            });
                            return;
                        }
                        const allowlistData = JSON.parse(fs.readFileSync("./db/allowlist.json"))
                        if(method === "add") {
                            if(allowlistData.some(player => player.name === gamertag)) {
                                console.error(`Player "${gamertag}" is already in the allowlist`)
                                clients.forEach(ws => {
                                    if (ws.readyState === WebSocket.OPEN) {
                                        ws.send(`Player "${gamertag}" is already in the allowlist`);
                                    }
                                });
                                return;
                            }
                            allowlistData.push({
                                ignoresPlayerLimit:false,
                                name: gamertag
                            })
                            fs.writeFileSync("./db/allowlist.json", JSON.stringify(allowlistData, null, 2))
                        } else if(method === "remove") {
                            if(!allowlistData.some(player => player.name === gamertag)) {
                                console.error(`Player "${gamertag}" isn't registered in the allowlist`)
                                clients.forEach(ws => {
                                    if (ws.readyState === WebSocket.OPEN) {
                                        ws.send(`Player "${gamertag}" isn't registered in the allowlist`);
                                    }
                                });
                                return;
                            }
                            const newData = allowlistData.filter(player => player.name !== gamertag);
                            fs.writeFileSync("./db/allowlist.json", JSON.stringify(newData, null, 2))
                        }
                    }
                    break

                    case "on": {
                        const toggleData = JSON.parse(fs.readFileSync("./db/toggle_features.json"));
                        if(toggleData.allowlist) {
                            console.error("Allowlist is already on.")
                            clients.forEach(ws => {
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send("Allowlist is already on.");
                                }
                            });
                            return;
                        }
                        toggleData.allowlist = true;
                        fs.writeFileSync("./db/toggle_features.json", JSON.stringify(toggleData, null, 2))
                    }
                    break

                    case "off": {
                        const toggleData = JSON.parse(fs.readFileSync("./db/toggle_features.json"));
                        if(!toggleData.allowlist) {
                            console.error("Allowlist is already OFF.")
                            clients.forEach(ws => {
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send("Allowlist is already OFF.");
                                }
                            });
                            return;
                        }
                        toggleData.allowlist = false;
                        fs.writeFileSync("./db/toggle_features.json", JSON.stringify(toggleData, null, 2))
                    }
                    break
                }

            }
            bds.stdin.write(`${message}\n`);
        });
    
        ws.on("close", () => {
            console.log("Client disconnected");
            clients.delete(ws);
        });

        ws.on("error", (error) => {
            console.error("WebSocket error:", error.message);
        });
    });

    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if(ws.isAlive === false) {
                console.log("Terminating unresponsive client");
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        })
    }, Number(process.env.HEARTBEAT_INTERVAL) || 45000);
    
    wss.on("close", () => {
        clearInterval(interval);
    })
    
    console.log("WebSocket running on port: " + port);
}

start();