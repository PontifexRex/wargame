# Aethelgard Pre-Commit Verification Gate
# Invoked by Git pre-commit hook before any commit is finalized.

$ErrorActionPreference = "Stop"
$rootDir = [System.IO.Path]::GetFullPath("$PSScriptRoot\..")

Write-Host "=== Aethelgard Pre-Commit Verification Gate ===" -ForegroundColor Cyan

# 1. Run full verification suite (Module Graph, DOM IDs, API Exports, ES2017 Gates, 20/20 Self-Tests, UI Smoke)
$testScript = Join-Path $rootDir "scripts\test.ps1"
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $testScript
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[PRE-COMMIT BLOCKED] Verification failed. Fix the issues above before committing." -ForegroundColor Red
    exit 1
}

# 2. Ensure dist/bundle.js is up-to-date and staged if src/ or index.html was modified
$stagedFiles = git diff --cached --name-only
$srcStaged = $stagedFiles | Where-Object { $_ -like "src/*" -or $_ -eq "index.html" }
if ($srcStaged) {
    $bundleStatus = git status --porcelain "dist/bundle.js"
    if ($bundleStatus -match " M ") {
        Write-Host "Auto-staging freshly compiled dist/bundle.js..." -ForegroundColor Yellow
        git add (Join-Path $rootDir "dist\bundle.js")
    }
}

Write-Host "[PRE-COMMIT PASSED] All gates passed. Commit proceeding.`n" -ForegroundColor Green
exit 0
