const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { FORMATS } = require('../utils/images');

const ROOT = path.join(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'images');
const SEARCH_DIR = path.join(ROOT, 'src');
// Only text source files can reference an image by name — this also keeps the search away from
// the large binary asset directories (src/images, src/videos, src/pdfs).
const SEARCHABLE_EXTENSIONS = ['.njk', '.json', '.js', '.scss', '.css', '.md'];

// Recursively list files under `dir`, returned as paths relative to `dir`.
function listFiles(dir, base = dir, results = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) {
            continue;
        }
        const absolute = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            listFiles(absolute, base, results);
        } else {
            results.push(path.relative(base, absolute));
        }
    }
    return results;
}

// Group generated files by logical base name, e.g. "portfolio/emily-150.avif" and
// "portfolio/emily-1920.webp" both belong to the "portfolio/emily" group. SVGs (copied through
// as-is, not resized) group under their own full relative path.
function groupByLogicalName(files) {
    const groups = new Map();
    const variantPattern = new RegExp(`^(.*)-\\d+\\.(${FORMATS.join('|')})$`);

    for (const file of files) {
        const withoutExt = file.replace(/\.[^.]+$/, '');
        const match = withoutExt.match(new RegExp(`^(.*)-\\d+$`));
        const isVariant = variantPattern.test(file);
        const logicalName = isVariant ? match[1] : withoutExt;

        if (!groups.has(logicalName)) {
            groups.set(logicalName, []);
        }
        groups.get(logicalName).push(file);
    }

    return groups;
}

function buildSearchableText() {
    const files = listFiles(SEARCH_DIR).filter((file) => SEARCHABLE_EXTENSIONS.includes(path.extname(file)));
    return files.map((file) => fs.readFileSync(path.join(SEARCH_DIR, file), 'utf8')).join('\n');
}

function ask(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) =>
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        })
    );
}

async function main() {
    if (!fs.existsSync(IMAGES_DIR)) {
        console.log('No images/ directory found — nothing to clean.');
        return;
    }

    const groups = groupByLogicalName(listFiles(IMAGES_DIR));
    const searchableText = buildSearchableText();

    const unreferenced = [...groups.entries()].filter(([logicalName]) => {
        const stem = path.basename(logicalName);
        return !searchableText.includes(stem);
    });

    if (unreferenced.length === 0) {
        console.log('No unreferenced images found.');
        return;
    }

    console.log(`Found ${unreferenced.length} unreferenced image group(s):\n`);
    for (const [logicalName, files] of unreferenced) {
        console.log(`  ${logicalName} (${files.length} file(s))`);
        files.forEach((file) => console.log(`    images/${file}`));
    }

    console.log(
        "\nThis is a text search across src/ for each image's filename stem — it can only " +
            "under-flag (miss something still referenced in a way it doesn't recognise), not over-flag. " +
            'Review the list above before confirming.'
    );

    const answer = await ask(`\nDelete all ${unreferenced.length} group(s) listed above? [y/N] `);
    if (answer.trim().toLowerCase() !== 'y') {
        console.log('Aborted — nothing deleted.');
        return;
    }

    let deletedCount = 0;
    for (const [, files] of unreferenced) {
        for (const file of files) {
            fs.unlinkSync(path.join(IMAGES_DIR, file));
            deletedCount++;
        }
    }
    console.log(`Deleted ${deletedCount} file(s). Run \`git add images\` (or \`git status\`) to review the change.`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
