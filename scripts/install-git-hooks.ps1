# Installs Aethelgard Git Hooks (Pre-commit Verification Gate)
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-git-hooks.ps1

$ErrorActionPreference = "Stop"
$rootDir = [System.IO.Path]::GetFullPath("$PSScriptRoot\..")
$githooksDir = Join-Path $rootDir ".githooks"
$gitDirHooks = Join-Path $rootDir ".git\hooks"

if (-not (Test-Path $githooksDir)) {
    New-Item -ItemType Directory -Path $githooksDir -Force | Out-Null
}

# 1. Point Git to version-controlled .githooks directory
git config core.hooksPath .githooks
Write-Host "Configured Git core.hooksPath -> .githooks" -ForegroundColor Green

# 2. Also install fallback directly into .git/hooks/pre-commit if .git exists
if (Test-Path $gitDirHooks) {
    $sourceHook = Join-Path $githooksDir "pre-commit"
    $targetHook = Join-Path $gitDirHooks "pre-commit"
    if (Test-Path $sourceHook) {
        Copy-Item -Path $sourceHook -Destination $targetHook -Force
        Write-Host "Copied fallback hook -> .git/hooks/pre-commit" -ForegroundColor Green
    }
}

Write-Host "`nGit Pre-Commit Hook is now active!" -ForegroundColor Cyan
Write-Host "Every commit will now automatically run ./scripts/pre-commit.ps1." -ForegroundColor DarkGray
