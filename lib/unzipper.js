const yauzl = require("yauzl");
const mkdirp = require("mkdirp");
const cliProgress = require("cli-progress");
const path = require("path");
const fs = require("fs");

exports.extractZip = async(zip) => {
  console.log("📂 Extract Bedrock Server...")

    return new Promise((resolve, reject) => {
        yauzl.open(zip, { lazyEntries: true }, (err, zipFile) => {
            if (err) return reject(err);

            let totalFiles = 0;
            let processed = 0;

            console.log("Preparing extraction...");
            zipFile.on("entry", () => {
                totalFiles++;
                zipFile.readEntry();
            });
            zipFile.on("end", () => {
                extraction(totalFiles)
            })
            zipFile.readEntry();

            function extraction(total) {
                yauzl.open(zip, { lazyEntries: true}, (err, zipRes) => {
                    if(err) return reject(err);

                    const progressBar = new cliProgress.SingleBar({
                        format: "📤 Extracting [{bar}] {percentage}% | {value}/{total} files",
                    }, cliProgress.Presets.shades_classic);

                    progressBar.start(total, 0);
                    zipRes.readEntry();
                    zipRes.on("entry", (entry) => {
                        const filePath = path.join(__dirname, "..", "Bedrock Server", entry.fileName);
                        const dirPath = path.dirname(filePath);

                        if (!fs.existsSync(dirPath)) {
                            mkdirp.sync(dirPath);
                        }

                        if (/\/$/.test(entry.fileName)) {
                            mkdirp.sync(filePath);
                            processed++;
                            progressBar.update(processed);
                            zipRes.readEntry();
                        } else {
                            zipRes.openReadStream(entry, (err, ReadStream) => {
                                if (err) return reject(err);

                                writeStream = fs.createWriteStream(filePath);
                                ReadStream.pipe(writeStream);
                                writeStream.on("finish", () => {
                                    processed++;
                                    progressBar.update(processed);
                                    zipRes.readEntry();
                                });
                            })
                        }
                    })

                    zipRes.on("end", () => {
                        progressBar.stop();
                        console.log("✅ Extraction complete.");
                        resolve();
                    });

                    zipRes.on("error", (err) => {
                        reject(err);
                    })
                })
            }
        })
    })
}