[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$backendDir = Join-Path $repoRoot "backend"

Set-Location -LiteralPath $backendDir
& .\mvnw.cmd spring-boot:run
exit $LASTEXITCODE
