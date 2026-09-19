@echo off
setlocal
cd /d "%~dp0"
title Adventurer: Expeditions
echo Starting Adventurer: Expeditions locally...
echo Artwork needs a local web address, not a double-clicked index.html.
echo.
set ADV_PORT=8735

where node >nul 2>&1
if %errorlevel%==0 (
  node play_local.js
  if errorlevel 1 goto fail
  goto done
)

where py >nul 2>&1
if %errorlevel%==0 (
  echo Opening http://127.0.0.1:8735/index.html
  echo Leave this window open while you play. Close it to stop.
  start "" cmd /c "timeout /t 1 /nobreak >nul && start http://127.0.0.1:8735/index.html"
  py -m http.server 8735 --bind 127.0.0.1
  goto done
)

where python >nul 2>&1
if %errorlevel%==0 (
  echo Opening http://127.0.0.1:8735/index.html
  echo Leave this window open while you play. Close it to stop.
  start "" cmd /c "timeout /t 1 /nobreak >nul && start http://127.0.0.1:8735/index.html"
  python -m http.server 8735 --bind 127.0.0.1
  goto done
)

echo Adventurer needs Node.js or Python installed to run locally.
echo Install one of those, then double-click this file again.
echo.
pause
goto done

:fail
echo.
echo The local server could not start.
pause

:done
endlocal
