const axios = require("axios");
const fs = require("fs");
const cliProgress = require("cli-progress");
const path = require("path");

exports.download = async (url, version) => {
  const response = await axios({
          method: "GET",
          url: url,
          responseType: "stream",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Referer": "https://www.minecraft.net/",
          }
        });
        const fileSize = parseInt(response.headers["content-length"], 10);
        console.log("Content-Length:", fileSize || "Unknown");
        const progressBar = new cliProgress.SingleBar({
          format: fileSize ? '⬇ Downloading [{bar}] {percentage}% | {speed} KB/s | {eta_formatted} left' : '⬇ Downloading {value} bytes',
        }, cliProgress.Presets.rect)
        if (fileSize) {
          progressBar.start(fileSize, 0, { speed: "0" });
        } else {
          progressBar.start(0, 0);
        }

        let downloaded = 0;
        let startTime = Date.now();
        response.data.on("data", chunk => {
          downloaded += chunk.length;
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = (downloaded / 1024 / elapsed).toFixed(2);
          progressBar.update(downloaded, fileSize ? { speed } : {})
        })
        response.data.on("end", () => {
          progressBar.stop();
        })

        const outDir = path.join(".", "bin");
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        const filePath = path.join(outDir, `bedrock-server-${version}.zip`);
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish",  () => resolve(filePath));
          writer.on("error", reject);
          response.data.on("error", reject);
        });
        console.log("Download Complete.");
        return filePath;
}