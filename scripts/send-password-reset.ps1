<#
Trendzact Partners Portal -- Password reset helper

Sends a branded password-reset email to a specific user via the
sendPasswordReset Cloud Function (which routes through Resend from
deal-desk@trendzact.com). Use this when:
  - A partner says they didn't get the reset email from /login
  - You want to send a reset without exposing the /login UI flow
  - You're testing the auth-email pipeline

Usage:
  .\scripts\send-password-reset.ps1 -Email partner@partnerco.com
  .\scripts\send-password-reset.ps1 -Email partner@partnerco.com -Secret "<value>"
  .\scripts\send-password-reset.ps1 -Email partner@partnerco.com -BaseUrl "https://trendzact-partners-001--pr-6-xxxxx.web.app"

The PORTAL_SHARED_SECRET is required. Provided via (in order of precedence):
  1. -Secret parameter
  2. $env:PORTAL_SHARED_SECRET environment variable
  3. Interactive prompt (secure entry)

NOTE: The function silent-succeeds for unknown emails (anti-enumeration).
A 200 response does NOT confirm the user exists. Look up the resendId in
the Resend dashboard, or check the auth_emails_sent Firestore collection,
to confirm an email was actually queued.
#>

param(
  [Parameter(Mandatory = $true)]
  [string]$Email,

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
  $ContinueUrl = "$BaseUrl/login.html?reset=success"
}

Write-Step "Sending password reset"
Write-Host "  to:           $Email"
Write-Host "  endpoint:     $BaseUrl/api/send-password-reset"
Write-Host "  continueUrl:  $ContinueUrl"

$body = @{
  email       = $Email
  continueUrl = $ContinueUrl
} | ConvertTo-Json -Compress

try {
  $response = Invoke-RestMethod `
    -Method POST `
    -Uri "$BaseUrl/api/send-password-reset" `
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

Write-Ok "Reset email queued"
Write-Host ""
$response | Format-List
Write-Host ""
Write-Host "Next: check the Resend dashboard with the resendId above, or the" -ForegroundColor DarkGray
Write-Host "auth_emails_sent Firestore collection for the matching entry." -ForegroundColor DarkGray
Write-Host ""
Write-Warn "NOTE: A 200 response with no resendId in the body means the email"
Write-Warn "address didn't exist in Firebase Auth -- anti-enumeration silent-success."
