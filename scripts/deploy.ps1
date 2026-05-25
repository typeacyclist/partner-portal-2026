<#
Trendzact Partners Portal - Firebase deploy helper

Usage from repo root:
  .\scripts\deploy.ps1
  .\scripts\deploy.ps1 -Target hosting
  .\scripts\deploy.ps1 -Target functions
  .\scripts\deploy.ps1 -Target all
  .\scripts\deploy.ps1 -Target hosting -SkipGitPull
  .\scripts\deploy.ps1 -Target hosting -DryRun

NPM shortcuts:
  npm run deploy:hosting
  npm run deploy:functions
  npm run deploy:all
#>

param(
  [ValidateSet('hosting', 'functions', 'all')]
  [string]$Target = 'hosting',

  [switch]$SkipGitPull,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Ok {
  param([string]$Message)
  Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
  param([string]$Message)
  Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Assert-Command {
  param([string]$CommandName, [string]$InstallHint)
  $cmd = Get-Command $CommandName -ErrorAction SilentlyContinue
  if (-not $cmd) {
    throw "$CommandName was not found. $InstallHint"
  }
}

function Invoke-Checked {
  param([string]$CommandText)
  Write-Host "> $CommandText" -ForegroundColor DarkGray
  if ($DryRun) { return }

  Invoke-Expression $CommandText
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code ${LASTEXITCODE}: $CommandText"
  }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

Write-Step "Checking prerequisites"
Assert-Command git "Install Git or open this repo in a shell where git is available."
Assert-Command firebase "Install Firebase CLI: npm install -g firebase-tools"
Write-Ok "Prerequisites available"

Write-Step "Checking repository state"
$currentBranch = (git rev-parse --abbrev-ref HEAD).Trim()
Write-Host "Branch: $currentBranch"

$changed = git status --porcelain
if ($changed) {
  Write-Warn "Local uncommitted changes detected. Deploy will use local files exactly as they are."
  git status --short
} else {
  Write-Ok "No uncommitted changes"
}

if (-not $SkipGitPull) {
  Write-Step "Pulling latest from origin/$currentBranch"
  Invoke-Checked "git pull --ff-only origin $currentBranch"
} else {
  Write-Warn "Skipping git pull"
}

Write-Step "Checking Firebase project"
Invoke-Checked "firebase use"

if ($Target -eq 'functions' -or $Target -eq 'all') {
  Write-Step "Installing Cloud Function dependencies"
  if (Test-Path (Join-Path $repoRoot 'functions/package.json')) {
    Invoke-Checked "npm --prefix functions install"
  } else {
    Write-Warn "functions/package.json not found; skipping function dependency install"
  }
}

Write-Step "Deploying to Firebase ($Target)"
if ($Target -eq 'hosting') {
  Invoke-Checked "firebase deploy --only hosting"
} elseif ($Target -eq 'functions') {
  Invoke-Checked "firebase deploy --only functions"
} else {
  Invoke-Checked "firebase deploy"
}

Write-Ok "Deploy complete"
