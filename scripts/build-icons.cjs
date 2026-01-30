const fs = require('node:fs');
const path = require('node:path');

// Copy icon files to dist directory
function copyIcons() {
  const assetsDir = path.join(__dirname, '..', 'src', 'renderer', 'assets');
  const distDir = path.join(__dirname, '..', 'dist');

  // Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Copy icon files
  const iconFiles = ['icon.ico', 'icon.png', 'favicon.ico'];

  for (const file of iconFiles) {
    const sourcePath = path.join(assetsDir, file);
    const destPath = path.join(distDir, file);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${sourcePath} to ${destPath}`);
    } else {
      console.warn(`Warning: ${sourcePath} does not exist`);
    }
  }
}

copyIcons();
