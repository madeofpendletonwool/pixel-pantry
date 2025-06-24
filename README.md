# Pixel Pantry

A Docker-based web application for browsing and previewing game assets locally. Perfect for managing large collections of 2D game assets organized in directories.

## Features

- 🎮 **Game-focused UI** with a modern, responsive design
- 📁 **Directory browsing** with sidebar navigation
- 🖼️ **Image preview** with modal zoom
- 🎵 **Audio playback** with built-in controls
- 🎬 **Video preview** support
- 📦 **Archive file detection** (zip, rar, etc.)
- 📄 **Text file recognition**
- 🔍 **File information** (size, type, extension)
- 🍞 **Breadcrumb navigation**
- 📱 **Mobile responsive**

## Quick Start

1. **Clone or create the project structure:**
```bash
mkdir asset-browser
cd asset-browser
```

2. **Create the files** (Dockerfile, package.json, server.js, public/index.html, docker-compose.yml)

3. **Create the public directory:**
```bash
mkdir public
# Move index.html to public/index.html
```

4. **Update docker-compose.yml** to point to your assets:
```yaml
volumes:
  - /path/to/your/game/src/assets:/app/assets:ro
```

5. **Build and run:**
```bash
docker-compose up --build
```

6. **Open your browser:** http://localhost:3000

## Directory Structure

```
asset-browser/
├── Dockerfile
├── package.json
├── server.js
├── docker-compose.yml
├── public/
│   └── index.html
└── README.md
```

## Supported File Types

### Images
- JPG, JPEG, PNG, GIF, BMP, SVG, WebP, TIFF

### Audio
- MP3, WAV, OGG, M4A, AAC, FLAC, WMA

### Video
- MP4, WebM, AVI, MOV, WMV, FLV

### Archives
- ZIP, RAR, 7Z, TAR, GZ, BZ2

### Text/Code
- TXT, MD, JSON, XML, LUA, JS, PY, C, CPP, H

## Configuration

### Custom Assets Path
Update the volume mount in `docker-compose.yml`:
```yaml
volumes:
  - /your/custom/path:/app/assets:ro
```

### Different Port
Change the port mapping:
```yaml
ports:
  - "8080:3000"  # Access via localhost:8080
```

### Development Mode
For development with auto-reload:
```bash
# Install nodemon
npm install -g nodemon

# Run in dev mode
npm run dev
```

## Security Features

- **Read-only asset mounting** prevents file modification
- **Path traversal protection** prevents access outside assets directory
- **MIME type detection** for proper file handling

## API Endpoints

- `GET /api/browse?path=<path>` - Browse directory contents
- `GET /api/file-info?path=<path>` - Get file information
- `GET /assets/<path>` - Serve static asset files

## Browser Compatibility

- Chrome/Chromium 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Troubleshooting

### Assets not loading
- Check volume mount path in docker-compose.yml
- Ensure assets directory exists and has read permissions
- Check Docker logs: `docker-compose logs`

### File previews not working
- Verify file extensions are supported
- Check browser console for errors
- Ensure MIME types are correctly detected

### Container won't start
- Verify all files are created correctly
- Check for syntax errors in package.json
- Ensure port 3000 is available

## License

MIT License - feel free to modify and use for your projects!
