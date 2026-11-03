const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const frontendRequire = createRequire(path.join(root, 'webview-src/package.json'));
const tldraw = frontendRequire('tldraw');
const ts = frontendRequire('typescript');
const moduleExports = {};
vm.runInNewContext(ts.transpileModule(
    fs.readFileSync(path.join(root, 'webview-src/src/smallStrokeWidth.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }
).outputText, { exports: moduleExports, require: frontendRequire });
const { applySmallStrokeWidth } = moduleExports;

test('width changes invalidate real tldraw geometry without changing serialized shapes', () => {
    const { STROKE_SIZES, createTLStore, DrawShapeUtil } = tldraw;
    const store = createTLStore({ shapeUtils: tldraw.defaultShapeUtils });
    const util = new DrawShapeUtil({});
    const makeShape = (id, size) => store.schema.types.shape.create({
        id, type: 'draw', parentId: 'page:page', index: 'a1',
        props: { ...util.getDefaultProps(), size, segments: [{ type: 'free', points: [{ x: 0, y: 0, z: 0.5 }] }] },
    });
    store.put([makeShape('shape:small', 's'), makeShape('shape:medium', 'm')]);
    const geometry = store.createComputedCache('test geometry', shape => util.getGeometry(shape), (a, b) => a.props === b.props);
    const before = JSON.stringify(store.getStoreSnapshot());
    const smallBefore = store.get('shape:small');
    const mediumBefore = store.get('shape:medium');
    const smallContent = tldraw.computed('small content', () => util.component(store.get('shape:small')));
    const mediumContent = tldraw.computed('medium content', () => util.component(store.get('shape:medium')));
    const smallElementBefore = smallContent.get();
    const mediumElementBefore = mediumContent.get();
    assert.equal(geometry.get('shape:small').bounds.width, 3);
    applySmallStrokeWidth(0.75);
    assert.equal(STROKE_SIZES.s, 0.75);
    assert.equal(geometry.get('shape:small').bounds.width, 3.5);
    assert.notEqual(smallContent.get(), smallElementBefore);
    assert.equal(mediumContent.get(), mediumElementBefore);
    assert.equal(store.get('shape:small').props, smallBefore.props);
    assert.equal(store.get('shape:medium'), mediumBefore);
    assert.equal(JSON.stringify(store.getStoreSnapshot()), before);
    assert.deepEqual([STROKE_SIZES.m, STROKE_SIZES.l, STROKE_SIZES.xl], [3.5, 5, 10]);
    for (const value of [0, -1, NaN, Infinity, '1', undefined, null]) applySmallStrokeWidth(value);
    assert.equal(STROKE_SIZES.s, 0.75);
    applySmallStrokeWidth(2); // settings can arrive before the editor mounts
    assert.equal(STROKE_SIZES.s, 2);
    applySmallStrokeWidth(0.5);
});

test('App lets Tldraw register its defaults without duplicate shape types', () => {
    const appExports = {};
    vm.runInNewContext(ts.transpileModule(
        fs.readFileSync(path.join(root, 'webview-src/src/App.tsx'), 'utf8'),
        { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }
    ).outputText, {
        exports: appExports,
        require: id => id === './smallStrokeWidth' ? moduleExports : id.endsWith('.css') ? {} : frontendRequire(id),
        addEventListener() {}, console,
    });
    const editorElement = appExports.default().props.children.props.children;
    assert.equal(editorElement.type, tldraw.Tldraw);
    const allUtils = [...tldraw.defaultShapeUtils, ...(editorElement.props.shapeUtils ?? [])];
    assert.equal(new Set(allUtils.map(Util => Util.type)).size, allUtils.length);
    assert.doesNotThrow(() => tldraw.createTLStore({ shapeUtils: allUtils }));
});

test('backend sends initial settings, live changes and safe defaults', () => {
    let configurationChanged, receiveMessage, disposePanel, openCommand;
    let value = 0.75;
    const messages = [];
    const disposable = { dispose() {} };
    const panel = {
        webview: {
            asWebviewUri: uri => uri,
            postMessage: message => messages.push(message),
            onDidReceiveMessage: fn => { receiveMessage = fn; return disposable; },
        },
        onDidDispose: fn => { disposePanel = fn; return disposable; },
    };
    const vscode = {
        workspace: {
            getConfiguration: () => ({ get: () => value }),
            onDidChangeConfiguration: fn => { configurationChanged = fn; return disposable; },
        },
        window: { createWebviewPanel: () => panel, showErrorMessage() {} },
        ViewColumn: { Two: 2 }, Uri: { file: file => file },
        commands: { registerCommand: (_id, fn) => { openCommand = fn; return disposable; } },
    };
    const exports = {};
    vm.runInNewContext(fs.readFileSync(path.join(root, 'src/extension.js'), 'utf8'), {
        exports, __dirname: path.join(root, 'src'),
        require: id => id === 'vscode' ? vscode : require(id),
        setInterval: () => 1, clearInterval() {},
    });
    const subscriptions = [];
    exports.activate({ extensionPath: root, subscriptions });
    configurationChanged({ affectsConfiguration: () => true }); // no open panel
    openCommand();
    receiveMessage({ command: 'requestSettings' });
    assert.equal(messages.at(-1).smallStrokeWidth, 0.75);
    assert.equal(messages.at(-1).command, 'settings');
    const count = messages.length;
    configurationChanged({ affectsConfiguration: () => false });
    assert.equal(messages.length, count);
    value = 1.25;
    configurationChanged({ affectsConfiguration: name => name === 'draw-inline.smallStrokeWidth' });
    assert.equal(messages.at(-1).smallStrokeWidth, 1.25);
    for (value of [0, -1, NaN, Infinity, '1', null]) {
        receiveMessage({ command: 'requestSettings' });
        assert.equal(messages.at(-1).smallStrokeWidth, 0.5);
    }
    disposePanel();
    configurationChanged({ affectsConfiguration: () => true }); // disposed panel
    assert.equal(subscriptions.length, 2);
});

test('VS Code settings schema exposes a positive number with default 0.5', () => {
    const manifest = require('../package.json');
    const setting = manifest.contributes.configuration.properties['draw-inline.smallStrokeWidth'];
    assert.equal(setting.type, 'number');
    assert.equal(setting.default, 0.5);
    assert.equal(setting.exclusiveMinimum, 0);
});
