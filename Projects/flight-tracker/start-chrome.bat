@echo off
chcp 65001 >nul 2>&1

echo [Chrome] 正在检查 Chrome 是否运行在端口 9223...
curl -s http://localhost:9223/json >nul 2>&1
if %errorlevel% equ 0 (
    echo [Chrome] 已在运行，跳过启动
    goto :done
)

echo [Chrome] 未运行，正在启动...
start "" "C:/Program Files/Google/Chrome/Application/chrome.exe" --user-data-dir="D:/Claudecodeworkspace/chrome-profiles/claude" --remote-debugging-port=9223 --no-first-run --no-default-browser-check
echo [Chrome] 启动命令已执行

:done
exit /b 0
