# Draw Inline

Draw and edit SVG illustrations directly in VS Code using [tldraw](https://github.com/tldraw/tldraw). Save drawings inline in Markdown or as external SVG files, then reopen them for further editing.

This is a customized fork of [zhaouv/vscode-markdown-tldraw-inline](https://github.com/zhaouv/vscode-markdown-tldraw-inline), which originated from [Draw Note](https://github.com/zhaouv/vscode-markdown-draw). It adds thinner small strokes and a VS Code setting for adjusting their width without rebuilding the extension. The original Git history is preserved.

## Features

- Draw with a mouse or pen using the tldraw editor.
- Save editable drawings as inline SVG or external SVG files linked from Markdown.
- Adjust the `S` stroke width in VS Code Settings, including in an open drawing and subsequent SVG exports.
- Start with `S` selected; keep the original `M`, `L`, and `XL` widths.
- Load bundled tldraw assets locally without fetching them from the tldraw CDN.
- Build and package the extension on Windows without Unix shell commands.

## Install or update

Build the VSIX using the instructions below, then run this command from the project directory:

```powershell
code --install-extension .\vscode-markdown-tldraw-inline-thin-stroke-0.1.0.vsix --force
```

Alternatively, open **Extensions → ... → Install from VSIX...** in VS Code and select the package. Run **Developer: Reload Window** after installation.

The extension ID remains `zhaouv.vscode-markdown-tldraw-inline`, so this package replaces an installed copy of the original extension. To keep this custom build, disable automatic updates for this extension in its Extensions menu.

## Use Draw Inline

1. Open a workspace folder and a saved Markdown file.
2. Place the cursor on an empty line and run **Draw Inline** from the Command Palette.
3. Select the freehand drawing tool and draw a line. The initial size is `S`.
4. With the drawing editor focused, press **F2** or **Ctrl+S** to save inline, or **F3** or **Ctrl+Shift+S** to save an external SVG.
5. Save the Markdown document. To edit a saved drawing, place the cursor on its inline SVG, folding region start, or Markdown image link and run **Draw Inline** again.

## Configure stroke width

Open Settings (`Ctrl+,`) and search for **Draw Inline: Small Stroke Width** or `@id:draw-inline.smallStrokeWidth`. You can also add this to your user or workspace `settings.json`:

```json
{
  "draw-inline.smallStrokeWidth": 0.5
}
```

The default is `0.5`; values must be greater than zero. Changes apply immediately without rebuilding the extension or reloading VS Code. `M`, `L`, and `XL` remain unchanged.

This setting controls tldraw's **base** `S` width. Freehand rendering adds `1`, so `0.5` gives a base rendered width of `1.5` at scale `1`. The final outline also depends on pressure and drawing style. Set the value to `2` to restore the original base `S` width.

Existing `S` shapes also become thinner or thicker when reopened in this editor. An SVG already displayed outside the editor changes only after you export it again. The SVG storage format and embedded tldraw snapshot remain compatible with the original extension.

Other settings remain available:

| Setting | Default | Purpose |
| --- | --- | --- |
| `draw-inline.directory` | `""` | Directory for external SVG files, relative to the workspace root. |
| `draw-inline.auto-folding` | `true` | Wrap inline SVG in a folding region. |

## Build and verify

Requirements: Git, Node.js 22.12+ or a newer supported version, and npm. The existing lockfiles pin tldraw to `3.5.1`; no tldraw upgrade is needed.

Run these commands in PowerShell from the project root:

```powershell
npm.cmd ci
npm.cmd --prefix webview-src ci
npm.cmd test
npm.cmd run package
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-package.ps1
```

Packaging builds the frontend automatically and produces `vscode-markdown-tldraw-inline-thin-stroke-0.1.0.vsix`. To build only the frontend, run `npm.cmd run build`. The packaging tool is pinned to `@vscode/vsce@4.1.0` and does not need a global installation.

Automated tests cover settings delivery, live stroke and geometry updates, unchanged drawing data, invalid values, and duplicate shape registration. Package verification checks the extension entry point, compiled settings support, and bundled webview assets. Drawing, saving, and reopening in VS Code still require a manual acceptance test.

Generated files (`board`, `node_modules`, and `*.vsix`) are excluded from Git. Build the VSIX locally after cloning this repository.

## Restore the original extension

To replace this custom build with the original Marketplace version:

```powershell
code --uninstall-extension zhaouv.vscode-markdown-tldraw-inline
code --install-extension zhaouv.vscode-markdown-tldraw-inline
```

Then run **Developer: Reload Window**. The original extension interprets saved `S` shapes using its original stroke width.

Detailed Lithuanian build, installation, rollback, and acceptance-test instructions are available in [THIN-STROKE.lt.md](docs/THIN-STROKE.lt.md).

## License

This project is licensed under the [MIT License](./LICENSE).
