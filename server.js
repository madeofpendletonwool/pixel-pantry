const express = require("express");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");

const app = express();
const PORT = 3000;
const ASSETS_DIR = "/app/assets";

// Serve static files
app.use(express.static("public"));
app.use("/assets", express.static(ASSETS_DIR));
app.use(express.json());

// Helper functions
function isImage(filename) {
  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".svg",
    ".webp",
    ".tiff",
    ".ico",
  ];
  return imageExtensions.includes(path.extname(filename).toLowerCase());
}

function isAudio(filename) {
  const audioExtensions = [
    ".mp3",
    ".wav",
    ".ogg",
    ".m4a",
    ".aac",
    ".flac",
    ".wma",
  ];
  return audioExtensions.includes(path.extname(filename).toLowerCase());
}

function isVideo(filename) {
  const videoExtensions = [
    ".mp4",
    ".webm",
    ".ogg",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
  ];
  return videoExtensions.includes(path.extname(filename).toLowerCase());
}

function isArchive(filename) {
  const archiveExtensions = [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"];
  return archiveExtensions.includes(path.extname(filename).toLowerCase());
}

function isGameAsset(filename) {
  const gameExtensions = [
    ".lua",
    ".json",
    ".xml",
    ".tmx",
    ".tsx",
    ".atlas",
    ".fnt",
  ];
  return gameExtensions.includes(path.extname(filename).toLowerCase());
}

function isText(filename) {
  const textExtensions = [
    ".txt",
    ".md",
    ".js",
    ".py",
    ".c",
    ".cpp",
    ".h",
    ".css",
    ".html",
    ".yaml",
    ".yml",
  ];
  return textExtensions.includes(path.extname(filename).toLowerCase());
}

// Get directory contents
function getDirectoryContents(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    const directories = [];
    const files = [];

    items.forEach((item) => {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      const relativePath = path.relative(ASSETS_DIR, itemPath);

      if (stats.isDirectory()) {
        directories.push({
          name: item,
          path: relativePath,
          type: "directory",
          modified: stats.mtime,
        });
      } else {
        const ext = path.extname(item).toLowerCase();
        let fileType = "unknown";

        if (isImage(item)) fileType = "image";
        else if (isAudio(item)) fileType = "audio";
        else if (isVideo(item)) fileType = "video";
        else if (isArchive(item)) fileType = "archive";
        else if (isGameAsset(item)) fileType = "game";
        else if (isText(item)) fileType = "text";

        files.push({
          name: item,
          path: relativePath,
          type: fileType,
          size: stats.size,
          extension: ext,
          modified: stats.mtime,
          tags: extractTags(item),
          mimeType: mime.lookup(item) || "application/octet-stream",
        });
      }
    });

    return { directories, files };
  } catch (error) {
    console.error("Error reading directory:", error);
    return { directories: [], files: [] };
  }
}

// Extract tags from filename
function extractTags(filename) {
  const name = path.parse(filename).name;
  return name
    .toLowerCase()
    .split(/[_\-\s\.]+/)
    .filter((tag) => tag.length > 2)
    .filter((tag) => !/^\d+$/.test(tag)); // Remove pure numbers
}

// Enhanced search with tag support
function searchFiles(searchTerm, rootPath = ASSETS_DIR) {
  const results = [];
  const visited = new Set();

  function searchRecursive(dirPath) {
    const realPath = fs.realpathSync(dirPath);
    if (visited.has(realPath)) return;
    visited.add(realPath);

    try {
      const items = fs.readdirSync(dirPath);

      items.forEach((item) => {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        const relativePath = path.relative(ASSETS_DIR, itemPath);

        if (stats.isDirectory()) {
          if (item.toLowerCase().includes(searchTerm.toLowerCase())) {
            results.push({
              name: item,
              path: relativePath,
              type: "directory",
              parent_path: path.relative(ASSETS_DIR, dirPath),
            });
          }
          searchRecursive(itemPath);
        } else {
          // Check filename and tags
          const tags = extractTags(item);
          const matchesName = item
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
          const matchesTags = tags.some((tag) =>
            tag.includes(searchTerm.toLowerCase()),
          );

          if (matchesName || matchesTags) {
            const ext = path.extname(item).toLowerCase();
            let fileType = "unknown";

            if (isImage(item)) fileType = "image";
            else if (isAudio(item)) fileType = "audio";
            else if (isVideo(item)) fileType = "video";
            else if (isArchive(item)) fileType = "archive";
            else if (isGameAsset(item)) fileType = "game";
            else if (isText(item)) fileType = "text";

            results.push({
              name: item,
              path: relativePath,
              type: fileType,
              size: stats.size,
              extension: ext,
              tags: tags,
              parent_path: path.relative(ASSETS_DIR, dirPath),
            });
          }
        }
      });
    } catch (error) {
      console.error("Error searching in directory:", dirPath, error);
    }
  }

  searchRecursive(rootPath);
  return results;
}

// API endpoint to browse directories
app.get("/api/browse", (req, res) => {
  const requestedPath = req.query.path || "";
  const fullPath = path.join(ASSETS_DIR, requestedPath);

  if (!fullPath.startsWith(ASSETS_DIR)) {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "Directory not found" });
    }

    const stats = fs.statSync(fullPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: "Path is not a directory" });
    }

    const contents = getDirectoryContents(fullPath);
    const pathParts = requestedPath ? requestedPath.split(path.sep) : [];

    res.json({
      currentPath: requestedPath,
      pathParts: pathParts,
      ...contents,
    });
  } catch (error) {
    console.error("Error browsing directory:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint for searching
app.post("/api/search", (req, res) => {
  const { query } = req.body;

  if (!query || query.length < 2) {
    return res
      .status(400)
      .json({ error: "Search query must be at least 2 characters" });
  }

  try {
    const results = searchFiles(query);
    res.json({ query, results, count: results.length });
  } catch (error) {
    console.error("Error searching files:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// API endpoint to get file content
app.get("/api/file-content", (req, res) => {
  const requestedPath = req.query.path || "";
  const fullPath = path.join(ASSETS_DIR, requestedPath);

  if (!fullPath.startsWith(ASSETS_DIR)) {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      return res.status(400).json({ error: "Path is a directory, not a file" });
    }

    const ext = path.extname(fullPath).toLowerCase();
    const textExtensions = [
      ".txt",
      ".md",
      ".json",
      ".xml",
      ".lua",
      ".js",
      ".py",
      ".c",
      ".cpp",
      ".h",
      ".css",
      ".html",
      ".yaml",
      ".yml",
    ];

    if (!textExtensions.includes(ext)) {
      return res
        .status(400)
        .json({ error: "File type not supported for content preview" });
    }

    const content = fs.readFileSync(fullPath, "utf8");

    res.json({
      content: content,
      extension: ext,
      size: stats.size,
      encoding: "utf8",
    });
  } catch (error) {
    console.error("Error reading file content:", error);
    res.status(500).json({ error: "Failed to read file content" });
  }
});

// Serve the main HTML page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Asset browser running on http://localhost:${PORT}`);
  console.log(`Assets directory: ${ASSETS_DIR}`);
});
