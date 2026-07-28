@echo off
fastboot devices >log.txt
set "reboot=adb shell getprop ro.product.name "
for /f "tokens=*" %%i in ('findstr "fastboot" "log.txt"') do set "reboot=fastboot getvar product"
%reboot%