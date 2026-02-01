"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
function copyIcons() {
    const assetsDir = (0, node_path_1.join)(__dirname, '..', 'src', 'renderer', 'assets');
    const distDir = (0, node_path_1.join)(__dirname, '..', 'dist');
    if (!(0, node_fs_1.existsSync)(distDir)) {
        (0, node_fs_1.mkdirSync)(distDir, { recursive: true });
    }
    const iconFiles = ['icon.ico', 'icon.png', 'favicon.ico'];
    for (const file of iconFiles) {
        const sourcePath = (0, node_path_1.join)(assetsDir, file);
        const destPath = (0, node_path_1.join)(distDir, file);
        if ((0, node_fs_1.existsSync)(sourcePath)) {
            (0, node_fs_1.copyFileSync)(sourcePath, destPath);
            console.log(`Copied ${sourcePath} to ${destPath}`);
        }
        else {
            console.warn(`Warning: ${sourcePath} does not exist`);
        }
    }
}
copyIcons();
