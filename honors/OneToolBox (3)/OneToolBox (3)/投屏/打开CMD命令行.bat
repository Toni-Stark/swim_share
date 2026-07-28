@echo off
title adb fastboot
color 0a

echo. adb-fastboot常用命令：
echo.
echo.
echo.	1 查询连接	    2 重启系统          3 重启edl 
echo.
echo.	4 重启rec	    5 重启fb            6 重启fbt
echo.
echo.	7 查询系统版本	    8 查询活动槽位      9 进入shell	                      
echo.
echo.	A 查询解锁状态      B 切换a/b槽位       C getvar all
echo.
echo.	D 查询设备代码      E erase 数据        T 打开投屏工具
echo.
echo.	fastboot flash boot 		        fastboot flash init_boot    
echo.
cd ./bin
cmd /k