import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Copy icon files to dist directory
function copyIcons(): void {
  const assetsDir = join(__dirname, '..', 'src', 'renderer', 'assets');
  const distDir = join(__dirname, '..', 'dist');

  // Ensure dist directory exists
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  // Copy icon files
  const iconFiles = ['icon.ico', 'icon.png', 'favicon.ico'];

  for (const file of iconFiles) {
    const sourcePath = join(assetsDir, file);
    const destPath = join(distDir, file);

    if (existsSync(sourcePath)) {
      copyFileSync(sourcePath, destPath);
      console.log(`Copied ${sourcePath} to ${destPath}`);
    } else {
      console.warn(`Warning: ${sourcePath} does not exist`);
    }
  }
}

copyIcons();
