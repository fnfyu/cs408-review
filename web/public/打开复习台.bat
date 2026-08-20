@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8080
set URL=http://127.0.0.1:%PORT%/

echo.
echo  CS408 考点复习台
echo  正在启动本地预览：%URL%
echo  关闭本窗口即停止服务。
echo.

where python >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" "%URL%"
  python -m http.server %PORT% --bind 127.0.0.1
  goto :eof
)

where py >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" "%URL%"
  py -3 -m http.server %PORT% --bind 127.0.0.1
  goto :eof
)

echo 未检测到 Python，改用系统自带 PowerShell 起服务…
start "" "%URL%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0_serve.ps1" -Port %PORT%
