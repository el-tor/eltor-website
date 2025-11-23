#!/bin/sh
# El Tor Installer Script
# Detects OS and architecture, downloads the appropriate binary, and installs El Tor

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Print with color
print_info() {
    printf "${BLUE}ℹ${NC} %s\n" "$1"
}

print_success() {
    printf "${GREEN}✓${NC} %s\n" "$1"
}

print_error() {
    printf "${RED}✗${NC} %s\n" "$1"
}

print_warning() {
    printf "${YELLOW}⚠${NC} %s\n" "$1"
}

print_header() {
    printf "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    printf "${PURPLE}   El Tor Installer${NC}\n"
    printf "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n\n"
}

# Error handler
error_exit() {
    print_error "$1"
    print_info "For manual installation, visit: https://github.com/el-tor/eltor-app/releases"
    exit 1
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect OS
detect_os() {
    OS=$(uname -s)
    case "$OS" in
        Linux*)     OS_TYPE="Linux";;
        Darwin*)    OS_TYPE="Darwin";;
        MINGW*|MSYS*|CYGWIN*) OS_TYPE="Windows";;
        *)          error_exit "Unsupported operating system: $OS";;
    esac
    print_info "Detected OS: $OS_TYPE"
}

# Detect architecture
detect_arch() {
    ARCH=$(uname -m)
    case "$ARCH" in
        x86_64|amd64)   ARCH_TYPE="x86_64";;
        aarch64|arm64)  ARCH_TYPE="aarch64";;
        armv7l)         ARCH_TYPE="armv7";;
        *)              error_exit "Unsupported architecture: $ARCH";;
    esac
    print_info "Detected architecture: $ARCH_TYPE"
}

# Check required dependencies
check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command_exists curl; then
        error_exit "curl is required but not installed. Please install curl and try again."
    fi
    
    # Check for jq (optional, we'll fallback to grep/sed if not available)
    if command_exists jq; then
        HAS_JQ=true
        print_success "Found jq"
    else
        HAS_JQ=false
        print_warning "jq not found, will use grep/sed fallback"
    fi
}

# Fetch latest release info from GitHub
fetch_release_info() {
    print_info "Fetching latest release information..."
    
    RELEASE_URL="https://api.github.com/repos/el-tor/eltor-app/releases/latest"
    RELEASE_JSON=$(curl -sS "$RELEASE_URL") || error_exit "Failed to fetch release information from GitHub"
    
    if [ -z "$RELEASE_JSON" ]; then
        error_exit "Empty response from GitHub API"
    fi
    
    # Extract version tag
    if [ "$HAS_JQ" = true ]; then
        VERSION=$(echo "$RELEASE_JSON" | jq -r '.tag_name')
    else
        VERSION=$(echo "$RELEASE_JSON" | grep -o '"tag_name": *"[^"]*"' | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')
    fi
    
    if [ -z "$VERSION" ] || [ "$VERSION" = "null" ]; then
        error_exit "Could not determine latest version"
    fi
    
    print_success "Latest version: $VERSION"
}

# Determine the correct asset filename based on OS and architecture
get_asset_name() {
    case "$OS_TYPE" in
        Darwin)
            if [ "$ARCH_TYPE" = "aarch64" ]; then
                ASSET_PATTERN="aarch64.*dmg"
            else
                ASSET_PATTERN="x64.*dmg"
            fi
            ASSET_EXT="dmg"
            ;;
        Linux)
            if [ "$ARCH_TYPE" = "aarch64" ]; then
                ASSET_PATTERN="arm64.*deb"
            else
                ASSET_PATTERN="amd64.*deb"
            fi
            ASSET_EXT="deb"
            ;;
        Windows)
            ASSET_PATTERN=".*exe"
            ASSET_EXT="exe"
            ;;
    esac
    
    print_info "Looking for asset matching: $ASSET_PATTERN"
}

# Find and extract download URL
find_download_url() {
    print_info "Finding download URL for your platform..."
    
    if [ "$HAS_JQ" = true ]; then
        DOWNLOAD_URL=$(echo "$RELEASE_JSON" | jq -r ".assets[] | select(.name | test(\"$ASSET_PATTERN\"; \"i\")) | .browser_download_url" | head -1)
    else
        # Fallback: extract browser_download_url matching our pattern
        DOWNLOAD_URL=$(echo "$RELEASE_JSON" | grep -o '"browser_download_url": *"[^"]*'"$ASSET_EXT"'"' | grep -i "$ASSET_EXT" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')
    fi
    
    if [ -z "$DOWNLOAD_URL" ] || [ "$DOWNLOAD_URL" = "null" ]; then
        print_error "Could not find suitable release for your platform"
        print_info "OS: $OS_TYPE, Architecture: $ARCH_TYPE"
        error_exit "Please download manually from: https://github.com/el-tor/eltor-app/releases"
    fi
    
    # Extract filename from URL
    FILENAME=$(basename "$DOWNLOAD_URL")
    print_success "Found: $FILENAME"
}

# Download the file
download_file() {
    print_info "Downloading El Tor..."
    
    TEMP_DIR=$(mktemp -d)
    DOWNLOAD_PATH="$TEMP_DIR/$FILENAME"
    
    if curl -L --progress-bar -o "$DOWNLOAD_PATH" "$DOWNLOAD_URL"; then
        print_success "Download completed: $DOWNLOAD_PATH"
    else
        rm -rf "$TEMP_DIR"
        error_exit "Download failed"
    fi
}

# Install based on OS
install_package() {
    print_info "Installing El Tor..."
    
    case "$OS_TYPE" in
        Darwin)
            print_info "Opening .dmg installer..."
            print_warning "Please drag El Tor to your Applications folder when the installer opens"
            open "$DOWNLOAD_PATH"
            print_success "Installer opened. Follow the on-screen instructions."
            ;;
            
        Linux)
            if command_exists dpkg; then
                print_info "Installing .deb package..."
                if sudo dpkg -i "$DOWNLOAD_PATH"; then
                    print_success "El Tor installed successfully!"
                    print_info "Run 'eltor' to start the application"
                else
                    print_warning "Installation had issues, trying to fix dependencies..."
                    sudo apt-get install -f -y || print_error "Could not fix dependencies automatically"
                fi
            else
                print_error "dpkg not found. Please install manually:"
                print_info "Download: $DOWNLOAD_URL"
                error_exit "Manual installation required"
            fi
            ;;
            
        Windows)
            print_info "Opening Windows installer..."
            print_warning "Please run the downloaded .exe file to install El Tor"
            print_info "Location: $DOWNLOAD_PATH"
            # Try to open the file
            start "$DOWNLOAD_PATH" 2>/dev/null || cmd.exe /c start "$DOWNLOAD_PATH" 2>/dev/null || true
            print_success "Installer ready. Follow the on-screen instructions."
            ;;
    esac
}

# Cleanup
cleanup() {
    if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
        print_info "Cleaning up temporary files..."
        # For macOS, keep the file a bit longer so it can be opened
        if [ "$OS_TYPE" != "Darwin" ] && [ "$OS_TYPE" != "Windows" ]; then
            rm -rf "$TEMP_DIR"
        fi
    fi
}

# Main installation flow
main() {
    print_header
    
    # Parse arguments
    INSTALL_DAEMON=false
    if [ "$1" = "--daemon" ]; then
        INSTALL_DAEMON=true
        print_info "Installing eltord daemon..."
    fi
    
    detect_os
    detect_arch
    check_dependencies
    fetch_release_info
    get_asset_name
    find_download_url
    download_file
    install_package
    
    print_success "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_success "El Tor installation complete!"
    print_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    
    print_info "Next steps:"
    printf "  1. Launch El Tor from your applications\n"
    printf "  2. Configure your Lightning wallet\n"
    printf "  3. Start browsing privately or run a relay\n\n"
    
    print_info "Documentation: https://github.com/el-tor/eltor-app"
    print_info "Support: https://github.com/el-tor/eltor-app/issues"
    
    cleanup
}

# Run main function
main "$@"
