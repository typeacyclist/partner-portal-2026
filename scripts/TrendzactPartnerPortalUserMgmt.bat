@echo off
:: Double-click launcher for the Trendzact Partners Portal User Management GUI.
:: Hides the cmd console -- the GUI opens on top.
:: Use this if you don't want to compile to .exe; otherwise just
:: double-click TrendzactPartnerPortalUserMgmt.exe at the repo root.
start "" /min powershell -NoLogo -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0invite-user-gui.ps1"
exit /b
