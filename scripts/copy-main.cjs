const fs = require('fs-extra');

async function copyMain() {
  try {
    await fs.copy('src/main', 'dist/main');
    console.log('Copied src/main to dist/main');
  } catch (error) {
    console.error('Error copying main files:', error);
    process.exit(1);
  }
}

copyMain();
