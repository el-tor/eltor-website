@echo off
REM El Tor Installer Script for Windows
REM Detects architecture, downloads the appropriate binary, and installs El Tor

setlocal enabledelayedexpansion

REM Version configurations
set ELTOR_APP_VERSION=0.0.18
set ELTORD_VERSION=0.0.2

REM Check if --daemon flag is passed
set INSTALL_DAEMON=false
if "%1"=="--daemon" set INSTALL_DAEMON=true

REM Colors
set "GREEN=[92m"
set "BLUE=[94m"
set "YELLOW=[93m"
set "RED=[91m"
set "PURPLE=[95m"
set "NC=[0m"

echo.
echo %PURPLE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%
echo %PURPLE%   El Tor Installer%NC%
echo %PURPLE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%
echo.

if "%INSTALL_DAEMON%"=="true" (
    echo %BLUE%ℹ%NC% Installing eltord daemon...
) else (
    echo %BLUE%ℹ%NC% Installing El Tor VPN...
)

REM Detect architecture
echo %BLUE%ℹ%NC% Detected OS: Windows
set ARCH=x86_64
echo %BLUE%ℹ%NC% Detected architecture: %ARCH%

REM Check for curl
where curl >nul 2>&1
if errorlevel 1 (
    echo %RED%✗%NC% curl is required but not installed.
    echo %BLUE%ℹ%NC% Please install curl from: https://curl.se/windows/
    pause
    exit /b 1
)

REM Check for tar (for extraction on Windows 10+)
where tar >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%⚠%NC% tar not found, will try PowerShell extraction
    set USE_POWERSHELL=true
) else (
    set USE_POWERSHELL=false
)

REM Create temp directory
set TEMP_DIR=%TEMP%\eltor-install-%RANDOM%
mkdir "%TEMP_DIR%"

if "%INSTALL_DAEMON%"=="true" (
    REM Install eltord daemon
    echo %BLUE%ℹ%NC% Using eltord version: v%ELTORD_VERSION%
    set DOWNLOAD_URL=https://github.com/el-tor/eltord/releases/download/v%ELTORD_VERSION%/eltord-windows-x86_64.zip
    set FILENAME=eltord-windows-x86_64.zip
    set INSTALL_DIR=%USERPROFILE%\bin
    set BINARY_NAME=eltord.exe
    
    echo %BLUE%ℹ%NC% Downloading eltord daemon...
    curl -L --progress-bar -o "%TEMP_DIR%\!FILENAME!" "!DOWNLOAD_URL!"
    if errorlevel 1 (
        echo %RED%✗%NC% Download failed
        rmdir /s /q "%TEMP_DIR%"
        pause
        exit /b 1
    )
    
    echo %GREEN%✓%NC% Download completed
    
    REM Extract
    echo %BLUE%ℹ%NC% Extracting archive...
    if "%USE_POWERSHELL%"=="true" (
        powershell -command "Expand-Archive -Path '%TEMP_DIR%\!FILENAME!' -DestinationPath '%TEMP_DIR%\extracted' -Force"
    ) else (
        tar -xf "%TEMP_DIR%\!FILENAME!" -C "%TEMP_DIR%"
    )
    
    if errorlevel 1 (
        echo %RED%✗%NC% Extraction failed
        rmdir /s /q "%TEMP_DIR%"
        pause
        exit /b 1
    )
    
    REM Find the binary
    echo %BLUE%ℹ%NC% Installing eltord to !INSTALL_DIR!...
    if not exist "!INSTALL_DIR!" mkdir "!INSTALL_DIR!"
    
    REM Search for eltord.exe in extracted files
    for /r "%TEMP_DIR%" %%f in (eltord.exe) do (
        if exist "%%f" (
            copy "%%f" "!INSTALL_DIR!\eltord.exe" >nul
            echo %GREEN%✓%NC% eltord installed successfully!
            goto :daemon_installed
        )
    )
    
    echo %RED%✗%NC% Could not find eltord.exe in archive
    rmdir /s /q "%TEMP_DIR%"
    pause
    exit /b 1
    
    :daemon_installed
    echo.
    echo %GREEN%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%
    echo %GREEN%eltord daemon installation complete!%NC%
    echo %GREEN%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%
    echo.
    echo %YELLOW%⚠%NC% Make sure %USERPROFILE%\bin is in your PATH
    echo.
    echo %BLUE%ℹ%NC% To add to PATH, run:
    echo   setx PATH "%%PATH%%;%USERPROFILE%\bin"
    echo.
    echo %BLUE%ℹ%NC% Next steps:
    echo   1. Restart your terminal
    echo   2. Run 'eltord --help' to see available commands
    echo   3. Configure your relay settings
    echo.
    echo %BLUE%ℹ%NC% Documentation: https://github.com/el-tor/eltord
    echo %BLUE%ℹ%NC% Support: https://github.com/el-tor/eltord/issues
    
) else (
    REM Install El Tor VPN
    echo %BLUE%ℹ%NC% Fetching latest release information...
    
    REM Use PowerShell to get JSON and extract version
    for /f "delims=" %%i in ('powershell -command "(Invoke-WebRequest -Uri 'https://api.github.com/repos/el-tor/eltor-app/releases/latest').Content | ConvertFrom-Json | Select-Object -ExpandProperty tag_name"') do set VERSION=%%i
    
    if "!VERSION!"=="" (
        echo %RED%✗%NC% Could not determine latest version
        echo %BLUE%ℹ%NC% Please download manually from: https://github.com/el-tor/eltor-app/releases
        pause
        exit /b 1
    )
    
    echo %GREEN%✓%NC% Latest version: !VERSION!
    
    REM Note: Windows builds might not be available yet
    echo %YELLOW%⚠%NC% Windows installer not yet available via this script
    echo %BLUE%ℹ%NC% Please download from: https://github.com/el-tor/eltor-app/releases/tag/!VERSION!
    echo.
    echo %BLUE%ℹ%NC% Opening releases page in browser...
    start https://github.com/el-tor/eltor-app/releases/tag/!VERSION!
)

REM Cleanup
rmdir /s /q "%TEMP_DIR%"

echo.
pause
