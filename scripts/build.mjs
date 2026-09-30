import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('extension/vendor', { recursive: true });
await copyFile('node_modules/darkreader/darkreader.js', 'extension/vendor/darkreader.js');
await copyFile('node_modules/darkreader/LICENSE', 'extension/vendor/DARKREADER-LICENSE');
