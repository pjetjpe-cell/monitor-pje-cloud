@echo off
title GAV - vigia do Antigravity
cd /d "%~dp0..\.."
where node >nul 2>nul || (echo Node.js nao encontrado. Instale em https://nodejs.org e rode de novo. & pause & exit /b 1)
node "%~dp0ponte.mjs" vigiar
pause
