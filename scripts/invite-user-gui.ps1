<#
Trendzact Partners Portal -- Partner Admin GUI

Minimal Windows form that wraps two Cloud Functions:
  - /api/send-user-invite    (mode: New Partner)
  - /api/send-password-reset (mode: Reset Password)

A radio group at the top selects which action to perform. The Display
Name field is only visible/used for New Partner.

Build to .exe (optional):
  Install-Module ps2exe -Scope CurrentUser
  Invoke-PS2EXE .\scripts\invite-user-gui.ps1 .\InviteUser.exe -NoConsole -Title "Trendzact Partner Admin"
#>

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

# Belt-and-suspenders: route any stray output (return values from
# Controls.Add, Add_<Event>, etc.) into a sink. Without this, ps2exe
# -NoConsole shows the value as a MessageBox before the form opens.
$ErrorActionPreference = 'Stop'

# -------- Config --------
$BaseUrl = 'https://trendzact-partners-001.web.app'
$InviteEndpoint = "$BaseUrl/api/send-user-invite"
$ResetEndpoint  = "$BaseUrl/api/send-password-reset"
$InviteContinue = "$BaseUrl/login.html?invite=success"
$ResetContinue  = "$BaseUrl/login.html?reset=success"

# -------- Form shell --------
$form = New-Object Windows.Forms.Form
$form.Text = 'Trendzact Partner Admin'
$form.Size = New-Object Drawing.Size(500, 530)
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

# -------- Mode radio group --------
$grpMode = New-Object Windows.Forms.GroupBox
$grpMode.Text = 'Action'
$grpMode.Location = New-Object Drawing.Point(20, 64)
$grpMode.Size = New-Object Drawing.Size(440, 56)
$grpMode.ForeColor = [Drawing.ColorTranslator]::FromHtml('#7A7F88')
$form.Controls.Add($grpMode)

$rbInvite = New-Object Windows.Forms.RadioButton
$rbInvite.Text = 'New Partner'
$rbInvite.Location = New-Object Drawing.Point(16, 22)
$rbInvite.Size = New-Object Drawing.Size(160, 24)
$rbInvite.Checked = $true
$rbInvite.ForeColor = [Drawing.ColorTranslator]::FromHtml('#353D4A')
$grpMode.Controls.Add($rbInvite)

$rbReset = New-Object Windows.Forms.RadioButton
$rbReset.Text = 'Reset Password'
$rbReset.Location = New-Object Drawing.Point(200, 22)
$rbReset.Size = New-Object Drawing.Size(180, 24)
$rbReset.ForeColor = [Drawing.ColorTranslator]::FromHtml('#353D4A')
$grpMode.Controls.Add($rbReset)

# -------- Email field --------
$lblEmail = New-Object Windows.Forms.Label
$lblEmail.Text = 'Email *'
$lblEmail.Location = New-Object Drawing.Point(20, 136)
$lblEmail.Size = New-Object Drawing.Size(200, 20)
$lblEmail.ForeColor = [Drawing.ColorTranslator]::FromHtml('#353D4A')
$form.Controls.Add($lblEmail)

$txtEmail = New-Object Windows.Forms.TextBox
$txtEmail.Location = New-Object Drawing.Point(20, 158)
$txtEmail.Size = New-Object Drawing.Size(440, 24)
$form.Controls.Add($txtEmail)

# -------- Display name field (invite only) --------
$lblName = New-Object Windows.Forms.Label
$lblName.Text = 'Display Name (optional)'
$lblName.Location = New-Object Drawing.Point(20, 192)
$lblName.Size = New-Object Drawing.Size(300, 20)
$lblName.ForeColor = [Drawing.ColorTranslator]::FromHtml('#353D4A')
$form.Controls.Add($lblName)

$txtName = New-Object Windows.Forms.TextBox
$txtName.Location = New-Object Drawing.Point(20, 214)
$txtName.Size = New-Object Drawing.Size(440, 24)
$form.Controls.Add($txtName)

# -------- Portal Secret field --------
$lblSecret = New-Object Windows.Forms.Label
$lblSecret.Text = 'Portal Secret *'
$lblSecret.Location = New-Object Drawing.Point(20, 248)
$lblSecret.Size = New-Object Drawing.Size(200, 20)
$lblSecret.ForeColor = [Drawing.ColorTranslator]::FromHtml('#353D4A')
$form.Controls.Add($lblSecret)

$txtSecret = New-Object Windows.Forms.TextBox
$txtSecret.Location = New-Object Drawing.Point(20, 270)
$txtSecret.Size = New-Object Drawing.Size(440, 24)
$txtSecret.UseSystemPasswordChar = $true
if ($env:PORTAL_SHARED_SECRET) { $txtSecret.Text = $env:PORTAL_SHARED_SECRET }
$form.Controls.Add($txtSecret)

$chkRemember = New-Object Windows.Forms.CheckBox
$chkRemember.Text = 'Remember on this PC (saves to PORTAL_SHARED_SECRET env var)'
$chkRemember.Location = New-Object Drawing.Point(20, 298)
$chkRemember.Size = New-Object Drawing.Size(440, 22)
$chkRemember.ForeColor = [Drawing.ColorTranslator]::FromHtml('#7A7F88')
$form.Controls.Add($chkRemember)

# -------- Send button --------
$btnSend = New-Object Windows.Forms.Button
$btnSend.Text = 'Send Invite'
$btnSend.Location = New-Object Drawing.Point(20, 332)
$btnSend.Size = New-Object Drawing.Size(160, 36)
$btnSend.BackColor = [Drawing.ColorTranslator]::FromHtml('#00827C')
$btnSend.ForeColor = [Drawing.Color]::White
$btnSend.FlatStyle = 'Flat'
$btnSend.FlatAppearance.BorderSize = 0
$btnSend.Font = New-Object Drawing.Font('Segoe UI', 10, [Drawing.FontStyle]::Bold)
$form.Controls.Add($btnSend)

# -------- Status output --------
$status = New-Object Windows.Forms.TextBox
$status.Location = New-Object Drawing.Point(20, 380)
$status.Size = New-Object Drawing.Size(440, 100)
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

# -------- Mode switching --------
function Update-Mode {
  if ($rbReset.Checked) {
    $headerLabel.Text = 'Send Password Reset'
    $btnSend.Text = 'Send Reset'
    $lblName.Visible = $false
    $txtName.Visible = $false
    Write-Status 'Reset mode: enter the partner email. NOTE: the function silent-succeeds for unknown emails (anti-enumeration).'
  } else {
    $headerLabel.Text = 'Invite a New Partner'
    $btnSend.Text = 'Send Invite'
    $lblName.Visible = $true
    $txtName.Visible = $true
    Write-Status 'Invite mode: enter the partner email + optional display name. Creates the user if needed.'
  }
}
$rbInvite.Add_CheckedChanged({ Update-Mode })
$rbReset.Add_CheckedChanged({ Update-Mode })

# -------- Send handler --------
$btnSend.Add_Click({
  $email  = $txtEmail.Text.Trim()
  $name   = $txtName.Text.Trim()
  $secret = $txtSecret.Text
  $isReset = $rbReset.Checked

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
  $action = if ($isReset) { 'Sending reset to' } else { 'Sending invite to' }
  $btnSend.Text = 'Sending...'
  Write-Status "$action $email..." '#7A7F88'
  $form.Refresh()

  if ($isReset) {
    $endpoint = $ResetEndpoint
    $continue = $ResetContinue
    $payload = @{ email = $email; continueUrl = $continue }
  } else {
    $endpoint = $InviteEndpoint
    $continue = $InviteContinue
    $payload = @{ email = $email; continueUrl = $continue }
    if ($name) { $payload.displayName = $name }
  }
  $body = $payload | ConvertTo-Json -Compress

  try {
    $response = Invoke-RestMethod `
      -Method POST `
      -Uri $endpoint `
      -Headers @{ 'X-Portal-Secret' = $secret } `
      -ContentType 'application/json' `
      -Body $body

    if ($isReset) {
      if ($response.resendId) {
        $statusText = "OK: Password reset email queued.`r`nResend ID: $($response.resendId)`r`n`r`nThey should receive the email within 30 seconds. Link expires in ~1 hour."
      } else {
        $statusText = "OK: Request accepted.`r`n`r`nNOTE: No resendId in response means the email address didn't exist in Firebase Auth (silent-success for anti-enumeration). If you expected this user to exist, verify the address."
      }
    } else {
      if ($response.userExisted) {
        $statusText = "OK: Re-invited existing user.`r`nUID:       $($response.uid)`r`nResend ID: $($response.resendId)"
      } else {
        $statusText = "OK: Created new user and sent invite.`r`nUID:       $($response.uid)`r`nResend ID: $($response.resendId)`r`n`r`nThey should receive the email within 30 seconds."
      }
    }
    Write-Status $statusText '#00827C'

    if ($chkRemember.Checked) {
      try {
        [Environment]::SetEnvironmentVariable('PORTAL_SHARED_SECRET', $secret, [EnvironmentVariableTarget]::User)
      } catch { }
    }

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
    $btnSend.Text = if ($isReset) { 'Send Reset' } else { 'Send Invite' }
  }
})

# -------- Show form --------
Update-Mode
# Declare initial focus via the form property instead of calling
# Control.Focus() here — Focus() returns a bool indicating whether focus
# was set (it returns False when the control isn't visible yet), and
# ps2exe -NoConsole shows that bool as a MessageBox. Setting
# Form.ActiveControl is the idiomatic WinForms way to choose the
# control that should receive focus when the form opens.
$form.ActiveControl = $txtEmail
[void]$form.ShowDialog()
$form.Dispose()
