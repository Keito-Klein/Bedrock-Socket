const axios = require("axios");
const fs =  require("fs")
const os = require("os");
const chalk = require("chalk");

const { download } = require("./downloader.js");
const { extractZip } = require("./unzipper.js");

exports.autoUpdate = async() => {
    console.log(chalk.keyword("white").italic("Running auto Update..."))

    try{
        const request = await axios({
            method: "GET",
            url: "https://net-secondary.web.minecraft-services.net/api/v1.0/download/links",
            headers: {
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Upgrade-Insecure-Request": 1,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0"
            }
        })
        if(request.status !== 200) throw new Error("Failed to fetch minecraft latest url!")
        console.log(chalk.bold.white("Your OS:"), chalk.bold.cyan(os.platform()));

        let downloadLink;
        let data = request.data;
        if(os.platform() === "win32") {
            downloadLink = data.result.links.find(srv => srv.downloadType === "serverBedrockWindows")?.downloadUrl
        } else if(os.platform() === "linux") {
            downloadLink = data.result.links.find(srv => srv.downloadType === "serverBedrockLinux")?.downloadUrl
        } else {
            console.error(chalk.redBright("Your OS isn't supported server Bedrock Edition."));
            return;
        }
        if(!downloadLink) {
            console.error(chalk.redBright("Your OS isn't supported server Bedrock Edition."));
            return
        }
        const version = downloadLink.match(/bedrock-server-([\d\.]+)\.zip/);
        if (!fs.existsSync("./bin")) {
            fs.mkdirSync("./bin", { recursive: true });
        }
        const files = fs.readdirSync("./bin");
        if(files.length > 0) {
            const fileName = new RegExp(`bedrock-server-${version[1]}\\.zip$`);
            if (!files.some(file => fileName.test(file))) {
                console.log(chalk.white("Downloading the latest version of Bedrock Server"), chalk.bold.cyan(version[1]));
                const zip = await download(downloadLink, version[1]);
                await extractZip(zip);
            } else if(!fs.existsSync("./Bedrock Server")) {
                console.log(chalk.yellowBright("Bedrock Server is missing!"), chalk.italic.yellowBright("restoring from the latest version..."))
                await extractZip(`./bin/bedrock-server-${version[1]}.zip`)
            } else {
                console.log(chalk.greenBright("Bedrock Server is up to date."));
            }
        } else {
            console.log(chalk.bold.yellowBright("No Bedrock Server available. downloading Bedrock Server"), chalk.cyan(version[1]));
            const zip = await download(downloadLink, version[1]);
            await extractZip(zip);
        }
    }catch(e) {
        console.error(chalk.redBright(e))
    }
}