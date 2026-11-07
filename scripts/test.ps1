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
foreach ($jsFile in Get-ChildItem -Path (Join-Path $rootDir "src") -Recurse -Filter "*.js") {
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

if ($Browser) {
    Write-Host "Opening in-browser diagnostics..." -ForegroundColor Yellow
    $indexPath = Join-Path $rootDir "index.html"
    Start-Process msedge.exe "file:///$($indexPath -replace '\\','/')"
    Write-Host "Click 'Verify Atlas' in the top-right header to view diagnostic results." -ForegroundColor Green
    exit 0
}

# Step 2: Execute Headless Automated Self-Test Suite
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

$bundleCode = [System.IO.File]::ReadAllText((Join-Path $rootDir "dist\bundle.js"), [System.Text.Encoding]::UTF8)
$harness = @"
var window = {};
$bundleCode
(function () {
  var results = window.Aethelgard.evaluateSelfTests();
  var allPass = window.Aethelgard.runSelfTests(false);
  return JSON.stringify({ allPass: allPass, results: results });
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
Write-Host "--------------------------------------------------" -ForegroundColor DarkGray
if ($report.allPass -and ($passCount -eq $report.results.Count)) {
    Write-Host "Result: $passCount/$($report.results.Count) Tests Passed. Build is healthy!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Result: $passCount/$($report.results.Count) Tests Passed. REGRESSION DETECTED!" -ForegroundColor Red
    exit 1
}
