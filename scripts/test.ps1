# Aethelgard Automated Verification Runner (PowerShell)
# Usage: ./scripts/test.ps1 [-Browser]

param (
    [switch]$Browser
)

$ErrorActionPreference = "Stop"
$rootDir = [System.IO.Path]::GetFullPath("$PSScriptRoot\..")

# Step 1: Validate ES6 module graph, top-level scope hygiene & update dist/bundle.js
& "$PSScriptRoot\build.ps1"

# Step 1b: Validate HTML DOM ID Contract (every getElementById literal in src/ must exist in index.html)
$htmlContent = [System.IO.File]::ReadAllText((Join-Path $rootDir "index.html"), [System.Text.Encoding]::UTF8)
$htmlIds = New-Object 'System.Collections.Generic.HashSet[string]'
foreach ($m in [regex]::Matches($htmlContent, 'id="([^"]+)"')) {
    [void]$htmlIds.Add($m.Groups[1].Value)
}
$missingDomIds = @()
$srcFiles = Get-ChildItem -Path (Join-Path $rootDir "src") -Recurse -Filter "*.js"
foreach ($jsFile in $srcFiles) {
    $jsText = [System.IO.File]::ReadAllText($jsFile.FullName, [System.Text.Encoding]::UTF8)
    foreach ($m in [regex]::Matches($jsText, "getElementById\(\s*['""]([^'""`$]+)['""]\s*\)")) {
        $reqId = $m.Groups[1].Value
        if (-not $htmlIds.Contains($reqId) -and ($missingDomIds -notcontains $reqId)) {
            $missingDomIds += "$reqId ($($jsFile.Name))"
        }
    }
}
if ($missingDomIds.Count -gt 0) {
    Write-Host "DOM CONTRACT ERROR: Missing HTML element IDs referenced in src/: $($missingDomIds -join ', ')" -ForegroundColor Red
    exit 1
}
Write-Host "Validated HTML DOM contract ($($htmlIds.Count) element IDs verified, 0 missing references)" -ForegroundColor DarkGray

# Step 1c: Validate window.Aethelgard Global Export Contract & Golden Rule / ES2017 Static Gates
$mainJsText = [System.IO.File]::ReadAllText((Join-Path $rootDir "src\main.js"), [System.Text.Encoding]::UTF8)
$apiBlockMatch = [regex]::Match($mainJsText, "export const AethelgardAPI\s*=\s*\{([\s\S]*?)\};")
$exportedApiKeys = New-Object 'System.Collections.Generic.HashSet[string]'
if ($apiBlockMatch.Success) {
    foreach ($m in [regex]::Matches($apiBlockMatch.Groups[1].Value, "\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b")) {
        [void]$exportedApiKeys.Add($m.Groups[1].Value)
    }
}

$missingApiHandlers = @()
foreach ($m in [regex]::Matches($htmlContent, "\bAethelgard\.([a-zA-Z_$][a-zA-Z0-9_$]*)")) {
    $fnName = $m.Groups[1].Value
    if (-not $exportedApiKeys.Contains($fnName) -and ($missingApiHandlers -notcontains "$fnName (index.html)")) {
        $missingApiHandlers += "$fnName (index.html)"
    }
}
foreach ($jsFile in $srcFiles) {
    $jsText = [System.IO.File]::ReadAllText($jsFile.FullName, [System.Text.Encoding]::UTF8)
    foreach ($m in [regex]::Matches($jsText, "\bAethelgard\.([a-zA-Z_$][a-zA-Z0-9_$]*)")) {
        $fnName = $m.Groups[1].Value
        if (-not $exportedApiKeys.Contains($fnName) -and ($missingApiHandlers -notcontains "$fnName ($($jsFile.Name))")) {
            $missingApiHandlers += "$fnName ($($jsFile.Name))"
        }
    }
}
if ($missingApiHandlers.Count -gt 0) {
    Write-Host "API CONTRACT ERROR: Missing window.Aethelgard exports in src/main.js: $($missingApiHandlers -join ', ')" -ForegroundColor Red
    exit 1
}

$staticViolations = @()
foreach ($jsFile in $srcFiles) {
    $lines = [System.IO.File]::ReadAllLines($jsFile.FullName, [System.Text.Encoding]::UTF8)
    for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        $trimmed = $line.Trim()
        if ($trimmed.StartsWith("//") -or $trimmed.StartsWith("/*") -or $trimmed.StartsWith("*")) { continue }
        # Strip inline // comments and string literals before checking tokens
        $codeOnly = [regex]::Replace($line, "('([^'\\]|\\.)*'|""([^""\\]|\\.)*""|`([^`\\]|\\.)*`)", "''")
        $codeOnly = [regex]::Replace($codeOnly, "//.*$", "")

        if ($codeOnly -match "\b(window\.)?(alert|confirm|prompt)\s*\(") {
            $staticViolations += "$($jsFile.Name):$($i + 1) - Native browser dialog forbidden by Golden Rule #7"
        }
        if ($codeOnly -match "\?\.") {
            $staticViolations += "$($jsFile.Name):$($i + 1) - Optional chaining (?.) forbidden by ADR-0001 (Chakra ES2017)"
        }
    }
}
if ($staticViolations.Count -gt 0) {
    Write-Host "STATIC GATE ERROR: Architectural or ES2017 syntax violation detected:" -ForegroundColor Red
    foreach ($v in $staticViolations) {
        Write-Host "  - $v" -ForegroundColor Yellow
    }
    exit 1
}
Write-Host "Validated window.Aethelgard API contract ($($exportedApiKeys.Count) exports) & Golden Rule/ES2017 static gates" -ForegroundColor DarkGray

if ($Browser) {
    Write-Host "Opening in-browser diagnostics..." -ForegroundColor Yellow
    $indexPath = Join-Path $rootDir "index.html"
    Start-Process msedge.exe "file:///$($indexPath -replace '\\','/')"
    Write-Host "Click 'Verify Atlas' in the top-right header to view diagnostic results." -ForegroundColor Green
    exit 0
}

# Step 2: Execute Headless Automated Self-Test Suite + UI Smoke Pass
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
    & node (Join-Path $rootDir "src\test\cliRunner.js")
    exit $LASTEXITCODE
}

# Zero-dependency fallback: Execute compiled ES6 bundle inside Windows Chakra JSRT Engine
if (-not ("AethelgardChakraRunner" -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class AethelgardChakraRunner {
    [DllImport("chakra.dll", CharSet = CharSet.Unicode)] static extern int JsCreateRuntime(int attrs, IntPtr threadService, out IntPtr runtime);
    [DllImport("chakra.dll", CharSet = CharSet.Unicode)] static extern int JsCreateContext(IntPtr runtime, out IntPtr context);
    [DllImport("chakra.dll", CharSet = CharSet.Unicode)] static extern int JsSetCurrentContext(IntPtr context);
    [DllImport("chakra.dll", CharSet = CharSet.Unicode)] static extern int JsRunScript(string script, UIntPtr sourceContext, string sourceUrl, out IntPtr result);
    [DllImport("chakra.dll", CharSet = CharSet.Unicode)] static extern int JsGetAndClearException(out IntPtr exception);
    [DllImport("chakra.dll", CharSet = CharSet.Unicode)] static extern int JsConvertValueToString(IntPtr value, out IntPtr strVal);
    [DllImport("chakra.dll", CharSet = CharSet.Unicode)] static extern int JsStringToPointer(IntPtr value, out IntPtr strPtr, out UIntPtr len);
    [DllImport("chakra.dll", CharSet = CharSet.Unicode)] static extern int JsGetPropertyIdFromName(string name, out IntPtr propId);
    [DllImport("chakra.dll", CharSet = CharSet.Unicode)] static extern int JsGetProperty(IntPtr obj, IntPtr propId, out IntPtr val);
    [DllImport("chakra.dll", CharSet = CharSet.Unicode)] static extern int JsDisposeRuntime(IntPtr runtime);

    static string ValToString(IntPtr val) {
        IntPtr strVal, ptr; UIntPtr len;
        if (JsConvertValueToString(val, out strVal) != 0) return "<unconvertible>";
        if (JsStringToPointer(strVal, out ptr, out len) != 0) return "<bad_ptr>";
        return Marshal.PtrToStringUni(ptr, (int)len);
    }

    public static string Execute(string script) {
        IntPtr rt, ctx, res;
        JsCreateRuntime(0, IntPtr.Zero, out rt);
        JsCreateContext(rt, out ctx);
        JsSetCurrentContext(ctx);
        int hr = JsRunScript(script, UIntPtr.Zero, "bundle_test.js", out res);
        if (hr != 0) {
            IntPtr ex;
            if (JsGetAndClearException(out ex) == 0 && ex != IntPtr.Zero) {
                IntPtr stackId, stackVal;
                string msg = ValToString(ex);
                if (JsGetPropertyIdFromName("stack", out stackId) == 0 && JsGetProperty(ex, stackId, out stackVal) == 0) {
                    msg += "\n" + ValToString(stackVal);
                }
                JsDisposeRuntime(rt);
                return "JS_EXCEPTION: " + msg;
            }
            JsDisposeRuntime(rt);
            return "JS_ERROR_CODE: 0x" + hr.ToString("X");
        }
        string output = ValToString(res);
        JsDisposeRuntime(rt);
        return output;
    }
}
'@
}

$idsArray = @($htmlIds)
$idsJson = ($idsArray | ConvertTo-Json -Compress)
$bundleCode = [System.IO.File]::ReadAllText((Join-Path $rootDir "dist\bundle.js"), [System.Text.Encoding]::UTF8)

$harness = @"
var __missingRuntimeIds = [];
var __knownIds = {};
var __idList = $idsJson;
for (var __i = 0; __i < __idList.length; __i++) {
  __knownIds[__idList[__i]] = true;
}

function __makeMockCtx() {
  return {
    fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: 'left',
    save: function(){}, restore: function(){}, translate: function(){}, scale: function(){},
    clearRect: function(){}, fillRect: function(){}, strokeRect: function(){},
    beginPath: function(){}, closePath: function(){}, moveTo: function(){}, lineTo: function(){},
    quadraticCurveTo: function(){}, arc: function(){}, ellipse: function(){}, fill: function(){}, stroke: function(){}, fillText: function(){}, setLineDash: function(){},
    createRadialGradient: function(){ return { addColorStop: function(){} }; }
  };
}

function __makeMockEl(id) {
  var classes = { hidden: id.indexOf('Modal') !== -1 || id === 'dungeonViewPanel' || id === 'bossHudBar' };
  return {
    id: id, tagName: 'DIV',
    width: id === 'dungeonCanvas' ? 672 : (id === 'fullMapCanvas' ? 720 : 232),
    height: id === 'dungeonCanvas' ? 480 : (id === 'fullMapCanvas' ? 520 : 164),
    value: id === 'charterSizeSelect' ? 'sprawling' : (id === 'charterWidthInput' ? '128' : (id === 'charterHeightInput' ? '96' : (id === 'charterDepthInput' ? '3' : ''))),
    textContent: '', innerHTML: '', className: '', style: {}, children: [], firstChild: null, scrollTop: 0, scrollHeight: 0,
    appendChild: function(c){ this.children.push(c); this.firstChild = this.children[0]; },
    removeChild: function(){ this.children.shift(); this.firstChild = this.children[0] || null; },
    addEventListener: function(){},
    getBoundingClientRect: function(){ return { left: 0, top: 0, width: this.width, height: this.height }; },
    getContext: function(){ return __makeMockCtx(); },
    select: function(){}, click: function(){},
    classList: {
      add: function(c){ classes[c] = true; },
      remove: function(c){ delete classes[c]; },
      toggle: function(c, force){
        if (force === undefined) classes[c] = !classes[c];
        else if (force) classes[c] = true;
        else delete classes[c];
      },
      contains: function(c){ return !!classes[c]; }
    }
  };
}

var __elements = {};
var __storage = {};
var localStorage = {
  getItem: function(k){ return __storage.hasOwnProperty(k) ? __storage[k] : null; },
  setItem: function(k, v){ __storage[k] = String(v); }
};
var navigator = { clipboard: null };
var URL = { createObjectURL: function(){ return 'blob:mock'; } };
function Blob(parts) { this.parts = parts; }

var document = {
  readyState: 'complete',
  body: __makeMockEl('body'),
  createElement: function(tag){ var e = __makeMockEl(tag); e.tagName = tag.toUpperCase(); return e; },
  execCommand: function(){},
  getElementById: function(id){
    if (!__knownIds[id] && __missingRuntimeIds.indexOf(id) === -1) {
      __missingRuntimeIds.push(id);
    }
    if (!__elements[id]) __elements[id] = __makeMockEl(id);
    return __elements[id];
  }
};

var window = {
  location: { protocol: 'http:' },
  addEventListener: function(){},
  requestAnimationFrame: function(){}
};
var requestAnimationFrame = function(){};
var setTimeout = function(){ return 1; };
var clearTimeout = function(){};

$bundleCode

(function () {
  var results = window.Aethelgard.evaluateSelfTests();
  var allPass = window.Aethelgard.runSelfTests(false);
  var fuzzer = window.Aethelgard.runChaosFuzzer(10);

  // Headless UI, 6-Tab Guild Hub, Atlas Charter & Canvas Render Smoke Suite
  var api = window.Aethelgard;
  var tabs = ['tavern', 'shop', 'assay', 'lapidary', 'research', 'bounties', 'talents', 'codex'];
  for (var ti = 0; ti < tabs.length; ti++) {
    api.switchGuildTab(tabs[ti]);
  }
  api.openExpeditionAtlasModal();
  api.onCharterSizePresetChange();
  api.submitCharterForm(false);
  api.handleSelectDungeonFromAtlas('dng_quarry', true);
  api.openFullMapModal();
  api.closeFullMapModal();
  api.handlePlayerAction(1, 0);
  api.openSaveSyncModal();
  api.closeSaveSyncModal();
  api.openDiagnosticsModal();
  api.closeDiagnosticsModal();
  api.openInventoryModal();
  api.setInventoryFilter('weapon');
  api.closeInventoryModal();

  var uiSmokeOk = (__missingRuntimeIds.length === 0) && (Object.keys(api.gameState.dungeons).length >= 5) && (fuzzer.errorCount === 0);
  return JSON.stringify({
    allPass: allPass && uiSmokeOk,
    results: results,
    uiSmokeOk: uiSmokeOk,
    fuzzer: fuzzer,
    missingRuntimeIds: __missingRuntimeIds
  });
})();
"@

$rawJson = [AethelgardChakraRunner]::Execute($harness)
if ($rawJson.StartsWith("JS_")) {
    Write-Host "FATAL ERROR DURING HEADLESS TEST EXECUTION:" -ForegroundColor Red
    Write-Host $rawJson -ForegroundColor Red
    exit 1
}

$report = $rawJson | ConvertFrom-Json
Write-Host "=== Aethelgard Automated Verification Suite ===" -ForegroundColor Cyan
$passCount = 0
foreach ($r in $report.results) {
    if ($r.pass) {
        $passCount += 1
        Write-Host "[PASS] $($r.name)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $($r.name)" -ForegroundColor Red
        Write-Host "       Detail: $($r.detail)" -ForegroundColor Yellow
    }
}
if ($report.uiSmokeOk) {
    Write-Host "[PASS] Headless UI, 6-Tab Guild Hub, Atlas Charter & Canvas Render Smoke Suite" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Headless UI Smoke Suite (Missing runtime DOM IDs: $($report.missingRuntimeIds -join ', '))" -ForegroundColor Red
}
Write-Host "--------------------------------------------------" -ForegroundColor DarkGray
if ($report.allPass -and ($passCount -eq $report.results.Count) -and $report.uiSmokeOk) {
    Write-Host "Result: $passCount/$($report.results.Count) Self-Tests + UI Smoke Suite Passed. Build is healthy!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Result: $passCount/$($report.results.Count) Tests Passed. REGRESSION DETECTED!" -ForegroundColor Red
    exit 1
}
