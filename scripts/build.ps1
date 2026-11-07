# ES6 Module Graph Validator & Topological Bundler for Aethelgard
# Validates imports/exports, checks for circular dependencies, and generates dist/bundle.js for file:// support.

param (
    [string]$Entry = "$PSScriptRoot\..\src\main.js",
    [string]$OutFile = "$PSScriptRoot\..\dist\bundle.js",
    [switch]$Quiet
)

$ErrorActionPreference = "Stop"
$entryFull = [System.IO.Path]::GetFullPath($Entry)

$modules = @{}
$visiting = New-Object 'System.Collections.Generic.HashSet[string]'
$visited  = New-Object 'System.Collections.Generic.HashSet[string]'
$topoOrder = New-Object 'System.Collections.Generic.List[string]'

function Parse-ESModule([string]$filePath) {
    if ($modules.ContainsKey($filePath)) { return $modules[$filePath] }
    if (-not (Test-Path $filePath)) {
        throw "Module not found: $filePath"
    }

    $raw = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
    $dir = [System.IO.Path]::GetDirectoryName($filePath)

    $imports = @()
    $exports = New-Object 'System.Collections.Generic.HashSet[string]'

    # Parse static import statements (single-line and multi-line)
    $importRegex = [regex]'(?ms)^\s*import\s+\{([^}]+)\}\s+from\s+[''"]([^''"]+)[''"]\s*;?'
    foreach ($m in $importRegex.Matches($raw)) {
        $specList = $m.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
        $relTarget = $m.Groups[2].Value
        $targetFull = [System.IO.Path]::GetFullPath((Join-Path $dir $relTarget))
        $names = @()
        foreach ($sp in $specList) {
            if ($sp -match '^(\w+)\s+as\s+(\w+)$') {
                $names += $Matches[1]
            } else {
                $names += $sp
            }
        }
        $imports += [PSCustomObject]@{
            Target = $targetFull
            Rel    = $relTarget
            Names  = $names
        }
    }

    # Parse named exports: export const/let/var/function/class NAME
    $declExportRegex = [regex]'(?m)^\s*export\s+(?:const|let|var|function|class)\s+(\w+)'
    foreach ($m in $declExportRegex.Matches($raw)) {
        [void]$exports.Add($m.Groups[1].Value)
    }

    # Parse re-exports: export { A, B }
    $reExportRegex = [regex]'(?ms)^\s*export\s+\{([^}]+)\}\s*(?:from\s+[''"]([^''"]+)[''"])?\s*;?'
    foreach ($m in $reExportRegex.Matches($raw)) {
        $items = $m.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
        foreach ($it in $items) {
            if ($it -match '^(\w+)\s+as\s+(\w+)$') {
                [void]$exports.Add($Matches[2])
            } else {
                [void]$exports.Add($it)
            }
        }
    }

    # Transform module body for bundle
    $body = $importRegex.Replace($raw, '')
    $body = $reExportRegex.Replace($body, '')
    $body = [regex]::Replace($body, '(?m)^(\s*)export\s+(const|let|var|function|class)\s+', '$1$2 ')

    $info = [PSCustomObject]@{
        Path    = $filePath
        Raw     = $raw
        Body    = $body.Trim()
        Imports = $imports
        Exports = $exports
    }
    $modules[$filePath] = $info
    return $info
}

function Visit-Module([string]$filePath, [string[]]$stack) {
    if ($visited.Contains($filePath)) { return }
    if ($visiting.Contains($filePath)) {
        $cycle = ($stack + $filePath) -join " -> "
        throw "Circular dependency detected: $cycle"
    }

    [void]$visiting.Add($filePath)
    $mod = Parse-ESModule $filePath

    foreach ($imp in $mod.Imports) {
        $depMod = Parse-ESModule $imp.Target
        foreach ($sym in $imp.Names) {
            if (-not $depMod.Exports.Contains($sym)) {
                throw "Import contract error in '$filePath': symbol '$sym' is not exported by '$($imp.Target)'"
            }
        }
        Visit-Module $imp.Target ($stack + $filePath)
    }

    [void]$visiting.Remove($filePath)
    [void]$visited.Add($filePath)
    $topoOrder.Add($filePath)
}

Visit-Module $entryFull @()

$outDir = [System.IO.Path]::GetDirectoryName([System.IO.Path]::GetFullPath($OutFile))
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$sb = [System.Text.StringBuilder]::new()
[void]$sb.AppendLine("/* Auto-generated from modular ES6 sources in src/ via scripts/build.ps1 */")
[void]$sb.AppendLine("(function () {")
[void]$sb.AppendLine("  'use strict';")
[void]$sb.AppendLine("")

$rootDir = [System.IO.Path]::GetFullPath("$PSScriptRoot\..")
foreach ($modPath in $topoOrder) {
    $relLabel = $modPath.Substring($rootDir.Length + 1) -replace '\\', '/'
    [void]$sb.AppendLine("  // --- Module: $relLabel ---")
    [void]$sb.AppendLine($modules[$modPath].Body)
    [void]$sb.AppendLine("")
}

[void]$sb.AppendLine("})();")

[System.IO.File]::WriteAllText([System.IO.Path]::GetFullPath($OutFile), $sb.ToString(), [System.Text.UTF8Encoding]::new($false))

if (-not $Quiet) {
    Write-Host "Validated $($topoOrder.Count) ES6 modules (0 circular dependencies) -> dist/bundle.js" -ForegroundColor DarkGray
}
