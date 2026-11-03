param(
    [string]$Package = (Join-Path $PSScriptRoot '../vscode-markdown-tldraw-inline-thin-stroke-0.1.0.vsix')
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root = Split-Path $PSScriptRoot -Parent
$archive = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Package))
function Read-Entry([string]$name) {
    $entry = $archive.GetEntry($name)
    if (!$entry) { throw "Missing VSIX entry: $name" }
    $reader = [System.IO.StreamReader]::new($entry.Open())
    try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
}
try {
    $manifest = Read-Entry 'extension/package.json' | ConvertFrom-Json
    if ("$($manifest.publisher).$($manifest.name)" -ne 'zhaouv.vscode-markdown-tldraw-inline') {
        throw 'Extension identity changed'
    }
    $null = Read-Entry 'extension/src/extension.js'
    $setting = $manifest.contributes.configuration.properties.'draw-inline.smallStrokeWidth'
    if ($setting.type -ne 'number' -or $setting.default -ne 0.5 -or $setting.exclusiveMinimum -ne 0) {
        throw 'Small stroke width setting schema missing or incorrect'
    }
    $null = Read-Entry 'extension.vsixmanifest'
    $html = Read-Entry 'extension/board/index.html'
    $jsMatch = [regex]::Match($html, 'src="\./assets/([^"]+\.js)"')
    $cssMatch = [regex]::Match($html, 'href="\./assets/([^"]+\.css)"')
    if (!$jsMatch.Success -or !$cssMatch.Success) { throw 'Webview entry references missing' }
    $js = Read-Entry ('extension/board/assets/' + $jsMatch.Groups[1].Value)
    $null = Read-Entry ('extension/board/assets/' + $cssMatch.Groups[1].Value)
    if ($js -notmatch 'draw-inline\.smallStrokeWidth"\s*,\s*\.5' -or $js -notmatch 'Object\.defineProperty\([^,]+,"s"') {
        throw 'Reactive S width setting missing from bundle'
    }
    if ([regex]::Matches($js, 'setStyleForNextShapes\([^,]+,"s"\)').Count -lt 2) {
        throw 'Expected S defaults after mount and snapshot load'
    }
    if ($js -notmatch 'return`\./cdn`') { throw 'Local asset URL replacement missing' }
    $assetsRoot = Join-Path $root 'webview-src/node_modules/@tldraw/assets'
    $assets = Get-ChildItem -LiteralPath $assetsRoot -Recurse -File
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        foreach ($asset in $assets) {
            $relative = $asset.FullName.Substring($assetsRoot.Length + 1).Replace('\', '/')
            $entry = $archive.GetEntry("extension/board/cdn/$relative")
            if (!$entry) { throw "Missing local asset: $relative" }
            $stream = $entry.Open()
            try { $actual = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '') }
            finally { $stream.Dispose() }
            if ($actual -ne (Get-FileHash -LiteralPath $asset.FullName -Algorithm SHA256).Hash) {
                throw "Local asset content mismatch: $relative"
            }
        }
    } finally { $sha.Dispose() }
    Write-Host "PASS: extension identity, entry point, JS/CSS, configurable S width, S defaults, local URLs, $($assets.Count) matching local assets."
    Write-Host "VSIX entries: $($archive.Entries.Count)"
} finally { $archive.Dispose() }
