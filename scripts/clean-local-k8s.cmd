@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0clean-local-k8s.ps1" %*
