# Zero-Dependency Local ES6 Development Server (PowerShell TcpListener)
# Serves Aethelgard over http://127.0.0.1:8080 so native ES6 <script type="module"> runs directly from src/.

param (
    [int]$Port = 8080
)

$root = [System.IO.Path]::GetFullPath("$PSScriptRoot\..")
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()

Write-Host "=== Aethelgard Local Dev Server ===" -ForegroundColor Cyan
Write-Host "Serving native ES6 modules from: $root" -ForegroundColor Gray
Write-Host "Open in browser: http://localhost:$Port/" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow

$mimeMap = @{
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.mjs'  = 'application/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.ico'  = 'image/x-icon'
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $stream = $client.GetStream()
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
            $reqLine = $reader.ReadLine()
            if ($reqLine) {
                while ($true) {
                    $hdr = $reader.ReadLine()
                    if ([string]::IsNullOrEmpty($hdr)) { break }
                }
                $parts = $reqLine -split ' '
                $urlPath = ($parts[1] -split '\?')[0]
                if ($urlPath -eq '/') { $urlPath = '/index.html' }
                $relPath = [System.Uri]::UnescapeDataString($urlPath.TrimStart('/')) -replace '/', '\'
                $fullPath = [System.IO.Path]::GetFullPath((Join-Path $root $relPath))

                if ($fullPath.StartsWith($root) -and (Test-Path $fullPath -PathType Leaf)) {
                    $ext = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
                    $mime = if ($mimeMap.ContainsKey($ext)) { $mimeMap[$ext] } else { 'application/octet-stream' }
                    $bytes = [System.IO.File]::ReadAllBytes($fullPath)
                    $headerStr = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
                    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerStr)
                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    $stream.Write($bytes, 0, $bytes.Length)
                } else {
                    $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                    $headerStr = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($notFound.Length)`r`nConnection: close`r`n`r`n"
                    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerStr)
                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    $stream.Write($notFound, 0, $notFound.Length)
                }
            }
        } finally {
            $client.Close()
        }
    }
} finally {
    $listener.Stop()
}
