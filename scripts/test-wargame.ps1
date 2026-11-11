# Aethelgard Wargame Automated Verification Runner (PowerShell)
# Usage: ./scripts/test-wargame.ps1

$ErrorActionPreference = "Stop"
$rootDir = [System.IO.Path]::GetFullPath("$PSScriptRoot\..")

# Step 1: Validate ES6 module graph & generate dist/wargame-bundle.js
& "$PSScriptRoot\build.ps1" -Entry (Join-Path $rootDir "src\wargame\main.js") -OutFile (Join-Path $rootDir "dist\wargame-bundle.js")

# Step 1b: Validate HTML DOM ID Contract (every getElementById in src/wargame/ must exist in wargame.html)
$htmlContent = [System.IO.File]::ReadAllText((Join-Path $rootDir "wargame.html"), [System.Text.Encoding]::UTF8)
$htmlIds = New-Object 'System.Collections.Generic.HashSet[string]'
foreach ($m in [regex]::Matches($htmlContent, 'id="([^"]+)"')) {
    [void]$htmlIds.Add($m.Groups[1].Value)
}
$missingDomIds = @()
$srcFiles = Get-ChildItem -Path (Join-Path $rootDir "src\wargame") -Recurse -Filter "*.js"
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
    Write-Host "DOM CONTRACT ERROR: Missing HTML element IDs referenced in src/wargame/: $($missingDomIds -join ', ')" -ForegroundColor Red
    exit 1
}
Write-Host "Validated Wargame HTML DOM contract ($($htmlIds.Count) element IDs verified, 0 missing references)" -ForegroundColor DarkGray

# Step 2: Execute Headless Automated Self-Test Suite inside Chakra JSRT Engine
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
        int hr = JsRunScript(script, UIntPtr.Zero, "wargame_bundle_test.js", out res);
        if (hr != 0) {
            IntPtr ex;
            if (JsGetAndClearException(out ex) == 0 && ex != IntPtr.Zero) {
                string msg = ValToString(ex);
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
$bundleCode = [System.IO.File]::ReadAllText((Join-Path $rootDir "dist\wargame-bundle.js"), [System.Text.Encoding]::UTF8)

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
    arc: function(){}, ellipse: function(){}, fill: function(){}, stroke: function(){}, fillText: function(){}, setLineDash: function(){}
  };
}

function __makeMockEl(id) {
  var classes = { hidden: id === 'wgTitleScreenOverlay' || id === 'wgPanelCity' || id === 'wgPanelGuild' };
  return {
    id: id, tagName: 'DIV',
    width: id === 'wgOverworldCanvas' ? 672 : 200,
    height: id === 'wgOverworldCanvas' ? 480 : 200,
    value: '', textContent: '', innerHTML: '', className: '', style: {}, children: [], firstChild: null,
    dataset: {},
    appendChild: function(c){ this.children.push(c); this.firstChild = this.children[0]; },
    removeChild: function(){ this.children.shift(); this.firstChild = this.children[0] || null; },
    addEventListener: function(){},
    getBoundingClientRect: function(){ return { left: 0, top: 0, width: this.width, height: this.height }; },
    getContext: function(){ return __makeMockCtx(); },
    click: function(){},
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

var document = {
  readyState: 'complete',
  body: __makeMockEl('body'),
  addEventListener: function(){},
  createElement: function(tag){ var e = __makeMockEl(tag); e.tagName = tag.toUpperCase(); return e; },
  getElementById: function(id){
    if (!__knownIds[id] && __missingRuntimeIds.indexOf(id) === -1) {
      __missingRuntimeIds.push(id);
    }
    if (!__elements[id]) __elements[id] = __makeMockEl(id);
    return __elements[id];
  }
};

var window = {
  location: { protocol: 'http:', href: 'wargame.html' },
  addEventListener: function(){},
  requestAnimationFrame: function(){}
};
var requestAnimationFrame = function(){};

$bundleCode

(function () {
  var results = window.WargameApp.evaluateWargameSelfTests();
  var app = window.WargameApp;

  // Exercise full UI smoke pass: View transitions, controls, and rendering
  app.handleStartNewCampaignSubmit();
  app.handleSwitchView('overworld');
  app.handleStepOverworld(1, 0);
  app.handleSetSimSpeed(5);
  app.handleFoundCity();
  app.handleSwitchView('city');
  app.handleQueueBuilding(1, 'sawmill');
  app.handleSwitchView('overworld');
  app.syncWargameUI();

  var allPass = true;
  for (var i = 0; i < results.length; i++) {
    if (!results[i].pass) allPass = false;
  }

  return JSON.stringify({
    allPass: allPass,
    results: results,
    missingRuntimeIds: __missingRuntimeIds
  });
})();
"@

$rawJson = [AethelgardChakraRunner]::Execute($harness)
if ($rawJson.StartsWith("JS_")) {
    Write-Host "FATAL ERROR DURING HEADLESS WARGAME TEST EXECUTION:" -ForegroundColor Red
    Write-Host $rawJson -ForegroundColor Red
    exit 1
}

$report = $rawJson | ConvertFrom-Json
Write-Host "=== Aethelgard Wargame Automated Verification Suite ===" -ForegroundColor Cyan
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

if ($report.missingRuntimeIds.Count -gt 0) {
    Write-Host "[FAIL] Headless UI Smoke Suite: Missing runtime DOM IDs: $($report.missingRuntimeIds -join ', ')" -ForegroundColor Red
    exit 1
} else {
    Write-Host "[PASS] Headless UI Smoke Suite (All DOM controls and view transitions verified)" -ForegroundColor Green
}

Write-Host "--------------------------------------------------" -ForegroundColor DarkGray
if ($report.allPass -and ($passCount -eq $report.results.Count)) {
    Write-Host "Result: $passCount/$($report.results.Count) Wargame Self-Tests + UI Smoke Suite Passed. Standalone build is healthy!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Result: $passCount/$($report.results.Count) Wargame Tests Passed. REGRESSION DETECTED!" -ForegroundColor Red
    exit 1
}
