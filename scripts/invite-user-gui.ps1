<#
Trendzact Partners Portal -- Invite User GUI

A minimal Windows form that wraps the /api/send-user-invite Cloud Function.
Double-click the .bat launcher (or run this .ps1 directly) to open the
window, enter an email, click Send.

Build to .exe (optional):
  Install-Module ps2exe -Scope CurrentUser
  Invoke-PS2EXE .\scripts\invite-user-gui.ps1 .\InviteUser.exe -NoConsole -Title "Trendzact Partner Invite"
#>

[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null
[System.Reflection.Assembly]::LoadWithPartialName('System.Drawing') | Out-Null
[System.Windows.Forms.Application]::EnableVisualStyles()

# -------- Config --------
$BaseUrl = 'https://trendzact-partners-001.web.app'
$Endpoint = "$BaseUrl/api/send-user-invite"
$ContinueUrl = "$BaseUrl/login.html?invite=success"

# -------- Form shell --------
$form = New-Object Windows.Forms.Form
$form.Text = 'Trendzact Partner Invite'
$form.Size = New-Object Drawing.Size(500, 480)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.Font = New-Object Drawing.Font('Segoe UI', 10)
$form.BackColor = [Drawing.Color]::White

# -------- Header --------
$header = New-Object Windows.Forms.Panel
$header.Size = New-Object Drawing.Size(500, 50)
$header.Location = New-Object Drawing.Point(0, 0)
$header.BackColor = [Drawing.ColorTranslator]::FromHtml('#00827C')
$form.Controls.Add($header)

$headerLabel = New-Object Windows.Forms.Label
$headerLabel.Text = 'Invite a New Partner'
$headerLabel.ForeColor = [Drawing.Color]::White
$headerLabel.Font = New-Object Drawing.Font('Segoe UI', 14, [Drawing.FontStyle]::Bold)
$headerLabel.Location = New-Object Drawing.Point(20, 12)
$headerLabel.Size = New-Object Drawing.Size(460, 28)
$header.Controls.Add($headerLabel)

# -------- Email field --------
$lblEmail = New-Object Windows.Forms.Label
$lblEmail.Text = 'Email *'
$lblEmail.Location = New-Object Drawing.Point(20, 70)
$lblEmail.Size = New-Object Drawing.Size(200, 20)
$lblEmail.ForeColor = [Drawing.ColorTranslator]::FromHtml('#353D4A')
$form.Controls.Add($lblEmail)

$txtEmail = New-Object Windows.Forms.TextBox
$txtEmail.Location = New-Object Drawing.Point(20, 92)
$txtEmail.Size = New-Object Drawing.Size(440, 24)
$form.Controls.Add($txtEmail)

# -------- Display name field --------
$lblName = New-Object Windows.Forms.Label
$lblName.Text = 'Display Name (optional)'
$lblName.Location = New-Object Drawing.Point(20, 126)
$lblName.Size = New-Object Drawing.Size(300, 20)
$lblName.ForeColor = [Drawing.ColorTranslator]::FromHtml('#353D4A')
$form.Controls.Add($lblName)

$txtName = New-Object Windows.Forms.TextBox
$txtName.Location = New-Object Drawing.Point(20, 148)
$txtName.Size = New-Object Drawing.Size(440, 24)
$form.Controls.Add($txtName)

# -------- Portal Secret field --------
$lblSecret = New-Object Windows.Forms.Label
$lblSecret.Text = 'Portal Secret *'
$lblSecret.Location = New-Object Drawing.Point(20, 182)
$lblSecret.Size = New-Object Drawing.Size(200, 20)
$lblSecret.ForeColor = [Drawing.ColorTranslator]::FromHtml('#353D4A')
$form.Controls.Add($lblSecret)

$txtSecret = New-Object Windows.Forms.TextBox
$txtSecret.Location = New-Object Drawing.Point(20, 204)
$txtSecret.Size = New-Object Drawing.Size(440, 24)
$txtSecret.UseSystemPasswordChar = $true
# Prefill from user env var if available
if ($env:PORTAL_SHARED_SECRET) { $txtSecret.Text = $env:PORTAL_SHARED_SECRET }
$form.Controls.Add($txtSecret)

$chkRemember = New-Object Windows.Forms.CheckBox
$chkRemember.Text = 'Remember on this PC (saves to PORTAL_SHARED_SECRET env var)'
$chkRemember.Location = New-Object Drawing.Point(20, 232)
$chkRemember.Size = New-Object Drawing.Size(440, 22)
$chkRemember.ForeColor = [Drawing.ColorTranslator]::FromHtml('#7A7F88')
$form.Controls.Add($chkRemember)

# -------- Send button --------
$btnSend = New-Object Windows.Forms.Button
$btnSend.Text = 'Send Invite'
$btnSend.Location = New-Object Drawing.Point(20, 268)
$btnSend.Size = New-Object Drawing.Size(140, 36)
$btnSend.BackColor = [Drawing.ColorTranslator]::FromHtml('#00827C')
$btnSend.ForeColor = [Drawing.Color]::White
$btnSend.FlatStyle = 'Flat'
$btnSend.FlatAppearance.BorderSize = 0
$btnSend.Font = New-Object Drawing.Font('Segoe UI', 10, [Drawing.FontStyle]::Bold)
$form.Controls.Add($btnSend)

# -------- Status output --------
$status = New-Object Windows.Forms.TextBox
$status.Location = New-Object Drawing.Point(20, 320)
$status.Size = New-Object Drawing.Size(440, 110)
$status.Multiline = $true
$status.ReadOnly = $true
$status.BackColor = [Drawing.ColorTranslator]::FromHtml('#F0FAF9')
$status.Font = New-Object Drawing.Font('Consolas', 9)
$status.ScrollBars = 'Vertical'
$status.BorderStyle = 'FixedSingle'
$form.Controls.Add($status)

function Write-Status {
  param([string]$Message, [string]$Color = '#353D4A')
  $status.ForeColor = [Drawing.ColorTranslator]::FromHtml($Color)
  $status.Text = $Message
}

# -------- Send handler --------
$btnSend.Add_Click({
  $email  = $txtEmail.Text.Trim()
  $name   = $txtName.Text.Trim()
  $secret = $txtSecret.Text

  if (-not $email) {
    Write-Status 'ERROR: Email is required.' '#B91C1C'
    $txtEmail.Focus()
    return
  }
  if ($email -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') {
    Write-Status "ERROR: '$email' doesn't look like a valid email address." '#B91C1C'
    $txtEmail.Focus()
    return
  }
  if (-not $secret) {
    Write-Status 'ERROR: Portal Secret is required.' '#B91C1C'
    $txtSecret.Focus()
    return
  }

  $btnSend.Enabled = $false
  $btnSend.Text = 'Sending...'
  Write-Status "Sending invite to $email..." '#7A7F88'
  $form.Refresh()

  $payload = @{
    email       = $email
    continueUrl = $ContinueUrl
  }
  if ($name) { $payload.displayName = $name }
  $body = $payload | ConvertTo-Json -Compress

  try {
    $response = Invoke-RestMethod `
      -Method POST `
      -Uri $Endpoint `
      -Headers @{ 'X-Portal-Secret' = $secret } `
      -ContentType 'application/json' `
      -Body $body

    $statusText = if ($response.userExisted) {
      "OK: Re-invited existing user.`r`nUID:       $($response.uid)`r`nResend ID: $($response.resendId)"
    } else {
      "OK: Created new user and sent invite.`r`nUID:       $($response.uid)`r`nResend ID: $($response.resendId)`r`n`r`nThey should receive the email within 30 seconds."
    }
    Write-Status $statusText '#00827C'

    # Persist secret to env var if requested
    if ($chkRemember.Checked) {
      try {
        [Environment]::SetEnvironmentVariable('PORTAL_SHARED_SECRET', $secret, [EnvironmentVariableTarget]::User)
      } catch {
        # Non-fatal
      }
    }

    # Clear form for the next invite
    $txtEmail.Clear()
    $txtName.Clear()
    $txtEmail.Focus()
  } catch {
    $code = $null
    $errBody = $null
    if ($_.Exception.Response) {
      $code = [int]$_.Exception.Response.StatusCode
      try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errBody = $reader.ReadToEnd()
      } catch { }
    }
    $msg = "ERROR: HTTP $code`r`n$errBody"
    if ($code -eq 401) {
      $msg += "`r`n`r`nThe Portal Secret doesn't match the Cloud Function's value. Verify with: firebase functions:secrets:access PORTAL_SHARED_SECRET"
    }
    Write-Status $msg '#B91C1C'
  } finally {
    $btnSend.Enabled = $true
    $btnSend.Text = 'Send Invite'
  }
})

# -------- Show form --------
Write-Status 'Enter the partner email and click Send Invite. Display Name is optional.'
$txtEmail.Focus()
[void]$form.ShowDialog()
$form.Dispose()
