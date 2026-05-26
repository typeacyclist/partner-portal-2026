@echo off
:: Double-click launcher for the Trendzact Partner Invite GUI.
:: Hides the cmd console — the GUI opens on top.
:: Place this next to invite-user-gui.ps1 and double-click.
start "" /min powershell -NoLogo -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0invite-user-gui.ps1"
exit /b
