@echo off
chcp 65001 >nul 2>&1

echo [run-all] 正在检查 Chrome 是否运行在端口 9223...
curl -s http://localhost:9223/json >nul 2>&1
if %errorlevel% equ 0 (
    echo [run-all] Chrome 已在运行，跳过启动
    goto :run_scraper
)

echo [run-all] Chrome 未运行，正在启动...
call "%~dp0start-chrome.bat"

echo [run-all] 等待 3 秒...
timeout /t 3 /nobreak >nul

:run_scraper
echo [run-all] 执行航班扫描...
node flight-scraper.js

echo.
echo [run-all] 扫描完成，按任意键退出...
pause >nul
