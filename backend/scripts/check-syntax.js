const { readdirSync } = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function collectJavaScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectJavaScriptFiles(entryPath);
    return entry.isFile() && entry.name.endsWith('.js') ? [entryPath] : [];
  });
}

const files = ['src', 'test'].flatMap(collectJavaScriptFiles).sort();
for (const file of files) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}

console.log(`Backend syntax check passed (${files.length} JavaScript files).`);
