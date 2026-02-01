import fs from 'fs-extra';

async function copyMain(): Promise<void> {
  try {
    await fs.copy('src/main', 'dist/main');
    console.log('Copied src/main to dist/main');
  } catch (error) {
    console.error('Error copying main files:', error);
    process.exit(1);
  }
}

copyMain();
