$ErrorActionPreference = "Stop"

$backendDirectory = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$backendPython = Join-Path $backendDirectory ".venv\Scripts\python.exe"
$stdoutLog = Join-Path $env:TEMP "islamic-hikmah-asr-server.stdout.log"
$stderrLog = Join-Path $env:TEMP "islamic-hikmah-asr-server.stderr.log"
$statusUrl = "http://127.0.0.1:8000/api/learn/status"

try {
    $currentStatus = Invoke-RestMethod -Uri $statusUrl -TimeoutSec 2
    if ($currentStatus.state -eq "ready") {
        Write-Output "Islamic Hikmah backend is already ready on $($currentStatus.device)."
        exit 0
    }
} catch {
    # No healthy backend is currently listening; start one below.
}

if (-not (Test-Path -LiteralPath $backendPython)) {
    throw "Backend virtual environment not found at $backendPython"
}

# Some managed terminals supply both Path and PATH. Start-Process treats those
# as duplicate keys on Windows, so normalize them before creating the child.
$processPath = [System.Environment]::GetEnvironmentVariable("Path", "Process")
[System.Environment]::SetEnvironmentVariable("PATH", $null, "Process")
[System.Environment]::SetEnvironmentVariable("Path", $processPath, "Process")

$backendProcess = Start-Process `
    -FilePath $backendPython `
    -ArgumentList "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000" `
    -WorkingDirectory $backendDirectory `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru

for ($attempt = 0; $attempt -lt 60; $attempt++) {
    Start-Sleep -Seconds 1
    try {
        $status = Invoke-RestMethod -Uri $statusUrl -TimeoutSec 2
        if ($status.state -eq "ready") {
            Write-Output "Islamic Hikmah backend started (PID $($backendProcess.Id), device $($status.device))."
            Write-Output "Logs: $stderrLog"
            exit 0
        }
    } catch {
        # Model preload is still in progress.
    }
}

Write-Output "Backend did not become ready. Review $stderrLog"
exit 1
