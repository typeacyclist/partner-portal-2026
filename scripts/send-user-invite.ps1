<#
Trendzact Partners Portal -- User invite helper

Onboards a new partner: creates the Firebase Auth account if missing,
seeds users/{uid} with mustResetPassword: true, and emails a branded
welcome with a password-set link via Resend (deal-desk@trendzact.com).

Idempotent -- calling for an existing email re-sends the invite without
creating a duplicate.

Usage:
  .\scripts\send-user-invite.ps1 -Email partner@partnerco.com
  .\scripts\send-user-invite.ps1 -Email partner@partnerco.com -DisplayName "Jane Smith"
  .\scripts\send-user-invite.ps1 -Email partner@partnerco.com -Secret "<value>"

The PORTAL_SHARED_SECRET is required. Provided via (in order of precedence):
  1. -Secret parameter
  2. $env:PORTAL_SHARED_SECRET environment variable
  3. Interactive prompt (secure entry)
#>

param(
  [Parameter(Mandatory = $true)]
  [string]$Email,

  [string]$DisplayName,

  [string]$Secret,

  [string]$BaseUrl = 'https://trendzact-partners-001.web.app',

  [string]$ContinueUrl
)

$ErrorActionPreference = 'Stop'

function Write-Step { param([string]$Message) Write-Host "`n==> $Message" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Message) Write-Host "[OK] $Message"  -ForegroundColor Green }
function Write-Warn { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }

# ----- Resolve secret -----
if (-not $Secret -and $env:PORTAL_SHARED_SECRET) {
  $Secret = $env:PORTAL_SHARED_SECRET
  Write-Host "Using PORTAL_SHARED_SECRET from environment variable." -ForegroundColor DarkGray
}
if (-not $Secret) {
  $secure = Read-Host -Prompt "PORTAL_SHARED_SECRET" -AsSecureString
  $Secret = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}
if (-not $Secret) {
  throw "PORTAL_SHARED_SECRET is required."
}

# ----- Validate email shape -----
if ($Email -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') {
  throw "Email '$Email' doesn't look like a valid address."
}

# ----- Default continueUrl -----
if (-not $ContinueUrl) {
  $ContinueUrl = "$BaseUrl/login.html?invite=success"
}

Write-Step "Sending invite"
Write-Host "  to:           $Email"
if ($DisplayName) { Write-Host "  displayName:  $DisplayName" }
Write-Host "  endpoint:     $BaseUrl/api/send-user-invite"
Write-Host "  continueUrl:  $ContinueUrl"

$payload = @{
  email       = $Email
  continueUrl = $ContinueUrl
}
if ($DisplayName) { $payload.displayName = $DisplayName }
$body = $payload | ConvertTo-Json -Compress

try {
  $response = Invoke-RestMethod `
    -Method POST `
    -Uri "$BaseUrl/api/send-user-invite" `
    -Headers @{ 'X-Portal-Secret' = $Secret } `
    -ContentType 'application/json' `
    -Body $body
} catch {
  $statusCode = $null
  $errorBody = $null
  if ($_.Exception.Response) {
    $statusCode = [int]$_.Exception.Response.StatusCode
    try {
      $stream = $_.Exception.Response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      $errorBody = $reader.ReadToEnd()
    } catch { }
  }
  Write-Host "[ERROR] HTTP $statusCode" -ForegroundColor Red
  if ($errorBody) { Write-Host $errorBody -ForegroundColor Red }
  if ($statusCode -eq 401) {
    Write-Warn "Got 401 Unauthorized. The Secret you provided doesn't match the function's PORTAL_SHARED_SECRET (Firebase Secret Manager v3). Verify with:  firebase functions:secrets:access PORTAL_SHARED_SECRET"
  }
  throw
}

if ($response.userExisted) {
  Write-Ok "Re-invited existing user (uid: $($response.uid))"
} else {
  Write-Ok "Created new user (uid: $($response.uid)) and sent invite"
}
Write-Host ""
$response | Format-List
Write-Host ""
Write-Host "Next: check the Resend dashboard with the resendId above, or the" -ForegroundColor DarkGray
Write-Host "auth_emails_sent Firestore collection for the matching entry." -ForegroundColor DarkGray
