@echo off
cd /d "%~dp0web"
echo Starting CS408 review at http://127.0.0.1:5173
npm run dev -- --host 127.0.0.1 --port 5173
