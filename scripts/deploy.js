const fs = require("fs");
const path = require("path");
const { Client } = require("basic-ftp");

// Ports the gulpfile's `deploy` task (previously vinyl-ftp) to a plain script run manually via
// `npm run deploy`, after `npm run build`. Same upload rule as before: always push HTML files
// (working out which specific HTML files have stale references after a CSS/JS change is more
// complex than just re-pushing all of them, and there aren't many), push anything new or
// changed, skip everything else.
const DIST_DIR = path.join(__dirname, "..", "dist");

function listLocalFiles(rootDir, dir = rootDir, results = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const absolute = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            listLocalFiles(rootDir, absolute, results);
        } else {
            results.push(path.relative(rootDir, absolute).split(path.sep).join("/"));
        }
    }
    return results;
}

// Assumes the client's current working directory is already the file's remote directory.
async function shouldUpload(client, filename, extension, localMtime) {
    if (extension === ".html") {
        return true;
    }
    try {
        const remoteMtime = await client.lastMod(filename);
        return localMtime > remoteMtime;
    } catch (error) {
        // MDTM fails (typically 550) when the remote file doesn't exist yet.
        return true;
    }
}

async function deploy() {
    if (!fs.existsSync(DIST_DIR)) {
        throw new Error("dist/ does not exist — run `npm run build` first.");
    }

    const config = require("../config");
    const client = new Client();
    client.ftp.log = console.log;

    await client.access({
        host: config.host,
        user: config.FTP_USERNAME,
        password: config.FTP_PASSWORD,
    });

    // Absolute, so every remoteDir we compute below is unambiguous regardless of whether
    // config.remoteFolder is itself relative or absolute.
    const loginCwd = await client.pwd();

    const relativeFiles = listLocalFiles(DIST_DIR);
    let uploaded = 0;

    for (const relativePath of relativeFiles) {
        const localPath = path.join(DIST_DIR, ...relativePath.split("/"));
        const localMtime = fs.statSync(localPath).mtime;
        const dirname = path.posix.dirname(relativePath);
        const filename = path.posix.basename(relativePath);
        const remoteDir = dirname === "." ? config.remoteFolder : `${config.remoteFolder}/${dirname}`;

        await client.cd(loginCwd);
        await client.ensureDir(remoteDir);

        if (!(await shouldUpload(client, filename, path.extname(filename), localMtime))) {
            continue;
        }

        console.log(`Uploading ${relativePath}`);
        await client.uploadFrom(localPath, filename);
        uploaded++;
    }

    console.log(`Deployed ${uploaded}/${relativeFiles.length} file(s).`);
    client.close();
}

if (require.main === module) {
    deploy().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = { deploy };
