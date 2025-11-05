const puppeteer = require("puppeteer-core");
const fs = require("fs");
const os = require("os");
const cheerio = require("cheerio");
require("dotenv").config();

const { download } = require("./downloader.js");
const { extractZip } = require("./unzipper.js");

exports.autoUpdate = async() => {
  console.log("Running auto Update...")
  let browser;
  const launchOptions = {
  headless: "new",
  args: [
        "--disable-http2",
      ]
};

const queryParams = new URLSearchParams({
  token: process.env.BROWSERLESS_TOKEN,
  launch: JSON.stringify(launchOptions)
});
  try {
    browser = await puppeteer.connect({
        browserWSEndpoint: `wss://production-sfo.browserless.io?${queryParams.toString()}`
    });
 
   const page = await browser.newPage();
   cdp = await page.createCDPSession();
 
   // Use full headers to make Cloudflare think this is a normal browser.
   await page.setExtraHTTPHeaders({
     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
     "Accept-Language": "en-US,en;q=0.9",
   });
 
   await page.goto("https://www.minecraft.net/en-us/download/server/bedrock", {
     waitUntil: "networkidle2",
     timeout: 60000,
   });
 
   const html = await page.content();
   const $ = cheerio.load(html);
   console.log("Your OS:", os.platform());
 
   let downloadLink;
   if (os.platform() === "win32") {
      downloadLink = $('#MC_Download_Server_1').attr("href");
   } else if(os.platform() === "linux") {
      downloadLink = $('#MC_Download_Server_2').attr("href");
   } else {
      console.error("Your OS isn't supported server Bedrock Edition.");
      await browser.close();
      return;
   }
     if (!downloadLink) {
       console.error("Failed to find download link for Bedrock Edition server.");
       await browser.close();
       return;
     }
           version = downloadLink.match(/bedrock-server-([\d\.]+)\.zip/);
     if (!fs.existsSync("./bin")) {
       fs.mkdirSync("./bin", { recursive: true });
     }
     const files = fs.readdirSync("./bin");
     if (files.length > 0) {
       const fileName = new RegExp(`bedrock-server-${version[1]}\\.zip$`);
       if (!files.some(file => fileName.test(file))) {
         console.log("Downloading the latest version of Bedrock Server", version[1]);
         const zip = await download(downloadLink, version[1]);
          await extractZip(zip);
       } else {
          console.log("Bedrock Server is up to date.");
       }
     } else {
       console.log("No Bedrock Server available. downloading Bedrock Server ", version[1]);
       const zip = await download(downloadLink, version[1]);
        await extractZip(zip);
     }
  } catch (error) {
    console.error("Error during Puppeteer operation:", error);
  } finally {
    if (browser) {
      console.log("Closing browser...");
      await browser.close();
    }
  }
}
