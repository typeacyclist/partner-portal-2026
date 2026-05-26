<#
Trendzact Partners Portal -- Build the InviteUser.exe from the GUI script.

Produces InviteUser.exe in the repo root: a single double-clickable .exe
with no PowerShell console window. Uses the ps2exe module under the hood.

Usage:
  .\scripts\Build-InviteUserExe.ps1

Output:
  .\InviteUser.exe

Requires:
  - PowerShell 5+ (Windows PowerShell or pwsh 7)
  - ps2exe module (auto-installs if missing)
#>

param(
  [string]$OutputPath = (Join-Path $PSScriptRoot '..\InviteUser.exe')
)

$ErrorActionPreference = 'Stop'

function Write-Step { param([string]$Message) Write-Host "`n==> $Message" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Message) Write-Host "[OK] $Message"  -ForegroundColor Green }
function Write-Warn { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }

$src = Join-Path $PSScriptRoot 'invite-user-gui.ps1'
if (-not (Test-Path $src)) {
  throw "Source script not found: $src"
}

Write-Step 'Ensure ps2exe module is installed'
$mod = Get-Module -ListAvailable -Name ps2exe | Select-Object -First 1
if (-not $mod) {
  Write-Warn 'ps2exe not installed -- installing for current user (one-time)'
  Install-Module ps2exe -Scope CurrentUser -Force -AllowClobber
}
Import-Module ps2exe
Write-Ok 'ps2exe ready'

Write-Step "Compile $src -> $OutputPath"
Invoke-PS2EXE `
  -InputFile $src `
  -OutputFile $OutputPath `
  -NoConsole `
  -Title 'Trendzact Partner Invite' `
  -Description 'Trendzact Partners Portal - User Invite' `
  -Company 'Trendzact' `
  -Product 'Partner Portal' `
  -Version '1.0.0.0'

if (Test-Path $OutputPath) {
  $size = (Get-Item $OutputPath).Length
  Write-Ok ("Built $OutputPath ({0:N0} bytes)" -f $size)
  Write-Host ''
  Write-Host 'Double-click the .exe to launch the GUI. No PowerShell window appears.' -ForegroundColor DarkGray
} else {
  throw 'Build did not produce the expected output file.'
}
