# Antigravity Stop Hook Handler for Aethelgard
# Prevents agent from completing a turn if game code in src/ or index.html is modified but failing tests.

$ErrorActionPreference = "SilentlyContinue"
$rootDir = [System.IO.Path]::GetFullPath("$PSScriptRoot\..")

# 1. Check if any code files in src/ or index.html are modified or untracked
$status = & git -C $rootDir status --porcelain "src" "index.html" 2>$null

# If no code was modified during this turn, allow stop immediately (<50ms)
if ([string]::IsNullOrWhiteSpace($status)) {
    [Console]::Out.WriteLine('{"decision": "allow"}')
    exit 0
}

# 3. If code was modified, run automated verification pipeline
$testScript = Join-Path $rootDir "scripts\test.ps1"
$testOutput = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $testScript 2>&1
$pass = ($LASTEXITCODE -eq 0)

if ($pass) {
    [Console]::Out.WriteLine('{"decision": "allow"}')
    exit 0
} else {
    # Escape output for JSON reason string
    $safeReason = "Aethelgard automated verification failed. Please inspect test errors and resolve regressions before finishing turn. Summary: " + ($testOutput -join " | ")
    $safeReason = $safeReason.Replace('\', '\\').Replace('"', '\"').Replace("`r", "").Replace("`n", " ")
    if ($safeReason.Length > 400) {
        $safeReason = $safeReason.Substring(0, 397) + "..."
    }
    [Console]::Out.WriteLine("{""decision"": ""continue"", ""reason"": ""$safeReason""}")
    exit 0
}
