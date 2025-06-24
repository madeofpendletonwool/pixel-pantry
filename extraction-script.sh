#!/bin/bash

# Bulletproof Archive Extraction Script

ASSETS_DIR="${1:-./src/assets}"
ARCHIVES_DIR="${ASSETS_DIR}/_extracted_archives"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🗜️  Archive Extraction Script${NC}"
echo "=============================="
echo "Assets directory: $ASSETS_DIR"
echo ""

# Check if directory exists
if [ ! -d "$ASSETS_DIR" ]; then
    echo -e "${RED}ERROR: Directory '$ASSETS_DIR' does not exist!${NC}"
    exit 1
fi

# Create archives directory
mkdir -p "$ARCHIVES_DIR"

# Extract function
extract_archive() {
    local archive_path="$1"
    local archive_name=$(basename "$archive_path")
    local archive_dir=$(dirname "$archive_path")
    local name_without_ext="${archive_name%.*}"
    local extract_dir="${archive_dir}/${name_without_ext}"

    echo "Processing: $archive_name"

    # Remove existing directory
    [ -d "$extract_dir" ] && rm -rf "$extract_dir"
    mkdir -p "$extract_dir"

    # Extract
    case "${archive_name,,}" in
        *.zip)
            unzip -o -q "$archive_path" -d "$extract_dir" 2>/dev/null
            ;;
        *.rar)
            if command -v unrar >/dev/null; then
                unrar x -o+ -y "$archive_path" "$extract_dir/" >/dev/null 2>&1
            elif command -v 7z >/dev/null; then
                7z x "$archive_path" -o"$extract_dir" -y >/dev/null 2>&1
            else
                echo "  ❌ No unrar or 7z tool found"
                return 1
            fi
            ;;
        *.7z)
            if command -v 7z >/dev/null; then
                7z x "$archive_path" -o"$extract_dir" -y >/dev/null 2>&1
            else
                echo "  ❌ No 7z tool found"
                return 1
            fi
            ;;
        *)
            echo "  ❌ Unknown archive type"
            return 1
            ;;
    esac

    # Check if extraction worked
    if [ $? -eq 0 ] && [ "$(ls -A "$extract_dir" 2>/dev/null)" ]; then
        echo "  ✅ Extracted"

        # Move archive
        local dest="$ARCHIVES_DIR/$archive_name"
        local counter=1
        while [ -f "$dest" ]; do
            dest="$ARCHIVES_DIR/${name_without_ext}_${counter}.${archive_name##*.}"
            ((counter++))
        done

        if mv "$archive_path" "$dest"; then
            echo "  📁 Moved to archives folder"
            return 0
        else
            echo "  ⚠️  Could not move archive"
            return 1
        fi
    else
        echo "  ❌ Extraction failed"
        [ -d "$extract_dir" ] && rm -rf "$extract_dir"
        return 1
    fi
}

# Process archives one by one using find
extracted=0
failed=0
total=0

echo "Processing archives..."
echo ""

# Use find with -exec to process each file
find "$ASSETS_DIR" -type f \( -iname "*.zip" -o -iname "*.rar" -o -iname "*.7z" \) -not -path "$ARCHIVES_DIR/*" -print0 | while IFS= read -r -d '' archive; do
    ((total++))
    echo "[$total] $(basename "$archive")"

    if extract_archive "$archive"; then
        ((extracted++))
    else
        ((failed++))
    fi
    echo ""
done

echo -e "${GREEN}🎉 Processing complete!${NC}"
echo ""
echo "Check the _extracted_archives folder for original files"
echo "All extracted content should be in folders next to the original archives"
