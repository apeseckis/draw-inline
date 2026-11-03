const fs = require('node:fs');
const path = require('node:path');

const board = path.resolve(__dirname, '../board');
// Synchronous operations make missing assets / failed replacements fail the build.
fs.cpSync(path.join(__dirname, 'node_modules/@tldraw/assets'), path.join(board, 'cdn'), {
  recursive: true,
});

const htmlPath = path.join(board, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const script = /\/assets\/(index-[\w-]+\.js)/.exec(html);
if (!script) throw new Error('Cannot find the generated webview script');
fs.writeFileSync(htmlPath, html.replace(/"\/assets\//g, '"./assets/'));

const scriptPath = path.join(board, 'assets', script[1]);
const source = fs.readFileSync(scriptPath, 'utf8');
let replacements = 0;
const localSource = source.replace(/return`\$\{\w+\}\/\$\{\w+\}`/g, () => {
  replacements++;
  return 'return`./cdn`';
});
if (replacements !== 1) {
  throw new Error(`Expected one tldraw asset URL replacement, got ${replacements}`);
}
fs.writeFileSync(scriptPath, localSource);
console.log(`Local assets ready: ${script[1]}`);
