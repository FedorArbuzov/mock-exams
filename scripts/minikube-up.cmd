@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0minikube-up.ps1" %*
