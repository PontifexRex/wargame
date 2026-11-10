# Aethelgard Deterministic Chaos & Seed Fuzzer
# Simulates thousands of procedural turns across all classes, layouts, and size tiers.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\fuzz.ps1 [-Seeds <int>]

param (
    [int]$Seeds = 25
)

$ErrorActionPreference = "Stop"
$rootDir = [System.IO.Path]::GetFullPath("$PSScriptRoot\..")

# 1. Ensure dist/bundle.js is up to date
& "$PSScriptRoot\build.ps1" -Quiet

# 2. Setup Chakra runner type if not present
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
        int hr = JsRunScript(script, UIntPtr.Zero, "fuzz_test.js", out res);
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

$bundleCode = [System.IO.File]::ReadAllText((Join-Path $rootDir "dist\bundle.js"), [System.Text.Encoding]::UTF8)

$harness = @"
function __makeMockCtx() {
  return {
    fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: 'left',
    save: function(){}, restore: function(){}, translate: function(){}, scale: function(){},
    clearRect: function(){}, fillRect: function(){}, strokeRect: function(){},
    beginPath: function(){}, closePath: function(){}, moveTo: function(){}, lineTo: function(){},
    arc: function(){}, fill: function(){}, stroke: function(){}, fillText: function(){}
  };
}

function __makeMockEl(id) {
  var classes = {};
  return {
    id: id, tagName: 'DIV', width: 672, height: 480, value: '',
    textContent: '', innerHTML: '', className: '', style: {}, children: [], firstChild: null,
    appendChild: function(c){ this.children.push(c); this.firstChild = this.children[0]; },
    removeChild: function(){ this.children.shift(); this.firstChild = this.children[0] || null; },
    addEventListener: function(){},
    getBoundingClientRect: function(){ return { left: 0, top: 0, width: this.width, height: this.height }; },
    getContext: function(){ return __makeMockCtx(); },
    classList: {
      add: function(c){ classes[c] = true; },
      remove: function(c){ delete classes[c]; },
      toggle: function(c){ classes[c] = !classes[c]; },
      contains: function(c){ return !!classes[c]; }
    }
  };
}

var __elements = {};
var document = {
  readyState: 'complete',
  body: __makeMockEl('body'),
  createElement: function(tag){ return __makeMockEl(tag); },
  getElementById: function(id){
    if (!__elements[id]) __elements[id] = __makeMockEl(id);
    return __elements[id];
  }
};

var window = { location: { protocol: 'http:' }, addEventListener: function(){}, requestAnimationFrame: function(){} };
var requestAnimationFrame = function(){};
var localStorage = { getItem: function(){ return null; }, setItem: function(){} };

$bundleCode

(function () {
  var report = window.Aethelgard.runChaosFuzzer($Seeds);
  return JSON.stringify(report);
})();
"@

$rawJson = [AethelgardChakraRunner]::Execute($harness)
if ($rawJson.StartsWith("JS_")) {
    Write-Host "FATAL ERROR IN FUZZ HARNESS:" -ForegroundColor Red
    Write-Host $rawJson -ForegroundColor Red
    exit 1
}

$report = $rawJson | ConvertFrom-Json
Write-Host "=== Aethelgard Deterministic Chaos & Seed Fuzzer ===" -ForegroundColor Cyan
Write-Host "Simulated $($report.totalSeeds) Dungeon Seeds across 4 Sizes & 4 Layouts ($($report.totalTurns) total turns)" -ForegroundColor DarkGray

if ($report.errorCount -eq 0) {
    Write-Host "[PASS] 100% Stability across $($report.totalSeeds) Seeds ($($report.totalTurns) turns). Zero crashes!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAIL] $($report.errorCount) errors detected during fuzz testing:" -ForegroundColor Red
    foreach ($err in $report.errors) {
        Write-Host "  - $err" -ForegroundColor Yellow
    }
    exit 1
}
