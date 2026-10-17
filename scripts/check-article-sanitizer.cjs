const assert = require('assert/strict');
const fs = require('fs');
const ts = require('typescript');
const Module = require('module');
const path = require('path');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<div id="viewer"></div>', { url: 'https://anorcar.test' });
global.window = dom.window;
global.self = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.MutationObserver = dom.window.MutationObserver;
global.getComputedStyle = dom.window.getComputedStyle;
global.Node = dom.window.Node;

const filename = path.resolve(__dirname, '../libs/sanitizeArticle.ts');
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText, filename);
const { sanitizeArticleHtml } = loaded.exports;
const dirty = '<h2>Electric cars</h2><p><strong>Safe text</strong><a href="https://example.com" target="_blank">Guide</a></p>' +
 '<img src="https://example.com/car.jpg" onerror="alert(1)"><script>alert(1)</script>' +
 '<a href="javascript:alert(1)">bad link</a><iframe srcdoc="<script>alert(1)</script>"></iframe>' +
 '<form><input name="x"></form><svg onload="alert(1)"></svg>';
const clean = sanitizeArticleHtml(dirty);
const root = document.createElement('div');
root.innerHTML = clean;
assert.equal(root.querySelector('h2').textContent, 'Electric cars');
assert.equal(root.querySelector('strong').textContent, 'Safe text');
assert.equal(root.querySelector('img').getAttribute('src'), 'https://example.com/car.jpg');
assert.equal(root.querySelector('a').getAttribute('target'), '_blank');
assert.equal(root.querySelectorAll('script,iframe,form,input,svg,[onerror],[onload],[href^="javascript:"]').length, 0);
assert.equal(sanitizeArticleHtml(clean), clean);
for (const component of ['Teditor', 'Tviewer']) {
 const source = fs.readFileSync(path.resolve(__dirname, `../libs/components/community/${component}.tsx`), 'utf8');
 assert(source.includes('customHTMLSanitizer={sanitizeArticleHtml}'));
}
const Viewer = require('@toast-ui/editor/dist/toastui-editor-viewer');
const viewer = new Viewer({ el: document.getElementById('viewer'), initialValue: dirty,
 customHTMLSanitizer: sanitizeArticleHtml, usageStatistics: false });
assert(document.getElementById('viewer').textContent.includes('Electric cars'));
assert.equal(document.getElementById('viewer').querySelectorAll('script,iframe,[onerror],[href^="javascript:"]').length, 0);
viewer.destroy();
dom.window.close();
console.log('Article sanitizer passed: rich text/images preserved, unsafe HTML removed, real Toast UI Viewer compatible.');
