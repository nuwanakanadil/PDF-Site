[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$runDir = Join-Path $repoRoot ".run"

# Use PaddleOCR PPStructureV3 as the only OCR engine.
$env:PADDLEOCR_ENABLE_PPSTRUCTURE = "true"
$env:PADDLEOCR_PREFER_PPSTRUCTURE = "true"
$env:PADDLEOCR_PPSTRUCTURE_TIMEOUT_SECONDS = "300"

$ocrService = @{
    Name = "OCR sidecar"
    Url = "http://127.0.0.1:8001/health"
    TimeoutSeconds = 30
    PidFile = Join-Path $runDir "ocr-service.pid"
    StdOutLog = Join-Path $runDir "ocr-service.out.log"
    StdErrLog = Join-Path $runDir "ocr-service.err.log"
    Workdir = Join-Path $repoRoot "ocr-service"
    FilePath = Join-Path $repoRoot "venv\Scripts\python.exe"
    ArgumentList = @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8001")
}

$backendService = @{
    Name = "Spring backend"
    Url = "http://127.0.0.1:8080/api/health"
    TimeoutSeconds = 120
    PidFile = Join-Path $runDir "backend.pid"
    StdOutLog = Join-Path $runDir "backend.out.log"
    StdErrLog = Join-Path $runDir "backend.err.log"
    Workdir = $repoRoot
    FilePath = (Join-Path $PSHOME "powershell.exe")
    ArgumentList = @(
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        (Join-Path $repoRoot "scripts\run-backend.ps1")
    )
}

function Assert-PathExists {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "$Label not found: $Path"
    }
}

function Test-ServiceReady {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    try {
        $null = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
        return $true
    } catch {
        return $false
    }
}

function Get-ManagedProcess {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PidFile
    )

    if (-not (Test-Path -LiteralPath $PidFile)) {
        return $null
    }

    $rawPid = (Get-Content -LiteralPath $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
    if ([string]::IsNullOrWhiteSpace($rawPid)) {
        Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
        return $null
    }

    try {
        return Get-Process -Id ([int]$rawPid) -ErrorAction Stop
    } catch {
        Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
        return $null
    }
}

function Show-RecentLog {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (Test-Path -LiteralPath $Path) {
        Get-Content -LiteralPath $Path -Tail 20
    }
}

function Start-ManagedService {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Service
    )

    if (Test-ServiceReady -Url $Service.Url) {
        Write-Host "$($Service.Name) is already responding at $($Service.Url)"
        return
    }

    $existingProcess = Get-ManagedProcess -PidFile $Service.PidFile
    if ($null -ne $existingProcess) {
        Write-Host "$($Service.Name) is already running with PID $($existingProcess.Id)"
    } else {
        Remove-Item -LiteralPath $Service.StdOutLog, $Service.StdErrLog -Force -ErrorAction SilentlyContinue

        $process = Start-Process `
            -FilePath $Service.FilePath `
            -ArgumentList $Service.ArgumentList `
            -WorkingDirectory $Service.Workdir `
            -WindowStyle Hidden `
            -RedirectStandardOutput $Service.StdOutLog `
            -RedirectStandardError $Service.StdErrLog `
            -PassThru

        Set-Content -LiteralPath $Service.PidFile -Value $process.Id
        Write-Host "Started $($Service.Name) with PID $($process.Id)"
    }

    $deadline = (Get-Date).AddSeconds($Service.TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-ServiceReady -Url $Service.Url) {
            Write-Host "$($Service.Name) is ready"
            return
        }
        Start-Sleep -Seconds 2
    }

    Write-Host "$($Service.Name) failed to become ready."
    Write-Host "Recent stdout:"
    Show-RecentLog -Path $Service.StdOutLog
    Write-Host "Recent stderr:"
    Show-RecentLog -Path $Service.StdErrLog
    throw "Startup failed for $($Service.Name)."
}

New-Item -ItemType Directory -Path $runDir -Force | Out-Null

Assert-PathExists -Path $ocrService.FilePath -Label "Python virtual environment"
Assert-PathExists -Path (Join-Path $repoRoot "backend\mvnw.cmd") -Label "Maven wrapper"
Assert-PathExists -Path (Join-Path $repoRoot "scripts\run-backend.ps1") -Label "Backend launcher"

Start-ManagedService -Service $ocrService
Start-ManagedService -Service $backendService

Write-Host ""
Write-Host "Services are up:"
Write-Host "  OCR sidecar:    $($ocrService.Url)"
Write-Host "  Spring backend: $($backendService.Url)"
Write-Host ""
Write-Host "To stop them later, run:"
Write-Host "  .\stop-dev.ps1"
