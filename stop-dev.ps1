[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$runDir = Join-Path $repoRoot ".run"

function Get-ChildProcessIds {
    param(
        [Parameter(Mandatory = $true)]
        [int]$ParentId
    )

    $children = @(Get-CimInstance Win32_Process -Filter "ParentProcessId = $ParentId" | Select-Object -ExpandProperty ProcessId)
    $descendants = New-Object System.Collections.Generic.List[int]

    foreach ($childId in $children) {
        $descendants.Add([int]$childId)
        foreach ($descendantId in Get-ChildProcessIds -ParentId ([int]$childId)) {
            $descendants.Add([int]$descendantId)
        }
    }

    return $descendants
}

function Stop-ProcessTree {
    param(
        [Parameter(Mandatory = $true)]
        [int]$RootProcessId
    )

    $descendants = @(Get-ChildProcessIds -ParentId $RootProcessId)
    [array]::Reverse($descendants)

    foreach ($processId in $descendants) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
        } catch {
        }
    }

    Stop-Process -Id $RootProcessId -Force -ErrorAction SilentlyContinue
}

function Stop-ManagedService {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [string]$PidFile
    )

    if (-not (Test-Path -LiteralPath $PidFile)) {
        Write-Host "$Name is not managed by this script right now."
        return
    }

    $rawPid = (Get-Content -LiteralPath $PidFile | Select-Object -First 1).Trim()
    if ([string]::IsNullOrWhiteSpace($rawPid)) {
        Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
        Write-Host "Removed empty PID file for $Name."
        return
    }

    try {
        $process = Get-Process -Id ([int]$rawPid) -ErrorAction Stop
        Stop-ProcessTree -RootProcessId $process.Id
        Write-Host "Stopped $Name (PID $($process.Id))"
    } catch {
        Write-Host "$Name was not running anymore."
    } finally {
        Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
    }
}

Stop-ManagedService -Name "Spring backend" -PidFile (Join-Path $runDir "backend.pid")
Stop-ManagedService -Name "OCR sidecar" -PidFile (Join-Path $runDir "ocr-service.pid")
