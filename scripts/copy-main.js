"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
async function copyMain() {
    try {
        await fs_extra_1.default.copy('src/main', 'dist/main');
        console.log('Copied src/main to dist/main');
    }
    catch (error) {
        console.error('Error copying main files:', error);
        process.exit(1);
    }
}
copyMain();
