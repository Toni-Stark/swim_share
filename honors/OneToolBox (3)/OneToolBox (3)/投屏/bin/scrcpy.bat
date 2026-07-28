@echo off 
title 正在为你加载投屏
color 0a
mode con cols=60 lines=20
adb shell uname  >1.txt
set "zk=false"
for /f "tokens=*" %%i in ('findstr "Linux" "1.txt"') do set "zk=true"
 
if "%zk%"=="true" (
   goto tp
) else (
   goto sq
)
:tp
adb shell getprop ro.product.name >1.txt
set  /p dh=<1.txt
echo.设备代号：%dh%

adb shell getprop ro.com.google.clientidbase >1.txt
set "opp=false"
for /f "tokens=*" %%i in ('findstr "oppo" "1.txt"') do set "opp=true"
for /f "tokens=*" %%i in ('findstr "oneplus" "1.txt"') do set "opp=true"
if "%opp%"=="true" (
adb shell getprop ro.vendor.oplus.market.enname >1.txt
set  /p xh=<1.txt
adb shell getprop ro.build.display.id >1.txt
set  /p bb=<1.txt
) else (
adb shell getprop ro.build.version.incremental >1.txt
set  /p bb=<1.txt
)
echo.系统版本：%bb%%xh%
adb shell getprop ro.build.version.release >1.txt
set  /p az=<1.txt
echo.安卓版本：%az%

adb shell getprop ro.boot.slot_suffix >1.txt
set "cww=false"
for /f "tokens=*" %%i in ('findstr "a" "1.txt"') do set "cww=true"
for /f "tokens=*" %%i in ('findstr "b" "1.txt"') do set "cww=true"
if "%cww%"=="true" (
set  /p cw=<1.txt
) else (
set  cw=单分区
)
echo.活动槽位：%cw%

adb shell uname -r >1.txt
set  /p nh=<1.txt
echo.内核版本：%nh%

scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
TIMEOUT /T 3
cls
echo.设备代号：%dh%
echo.系统版本：%bb%
echo.安卓版本：%az%
echo.活动槽位：%cw%
echo.内核版本：%nh%
scrcpy.exe >1.txt
pause
:sq
echo.
echo.
echo.
echo.usb调试未开启或未授权
echo.如果已经打开usb调试，请在手机弹窗勾选一律允许并授权
echo.如果已经打开usb调试，手机没有弹窗，拔了重新插一下，并选择传输文件模式
TIMEOUT /T 3
cls
scrcpy.bat