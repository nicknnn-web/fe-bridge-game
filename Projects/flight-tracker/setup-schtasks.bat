@echo off
setlocal enabledelayedexpansion

echo =============================================
echo FlightScan-Hourly 定时任务配置脚本
echo =============================================
echo.

:: 检查是否已有同名任务
schtasks /query /tn "FlightScan-Hourly" >nul 2>&1
if %errorlevel% equ 0 (
    echo [错误] 已存在名为 "FlightScan-Hourly" 的定时任务
    echo 请先删除现有任务后再运行此脚本：
    echo   schtasks /delete /tn "FlightScan-Hourly" /f
    echo.
    echo 或右键以管理员身份运行 PowerShell 执行：
    echo   Remove-ScheduledTask -TaskName "FlightScan-Hourly" -Confirm:$false
    echo.
    pause
    exit /b 1
)

:: 打印即将执行的命令
echo 即将创建定时任务：
echo.
echo   schtasks /create ^
echo     /tn "FlightScan-Hourly" ^
echo     /tr "node D:\Claudecodeworkspace\Projects\flight-tracker\flight-scraper.js" ^
echo     /sc hourly ^
echo     /st 21:00 ^
echo     /ru SYSTEM ^
echo     /f
echo.
echo =============================================
echo [重要] 请右键此脚本，选择"以管理员身份运行"
echo =============================================
echo.

pause
