/**
 * SR12 Static Site Builder for Vercel / Production
 * Copies all static assets into dist/ directory
 */

const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');

console.log('🚀 Starting SR12 static build...');

// Clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy index.html
const indexSrc = path.join(rootDir, 'index.html');
const indexDest = path.join(distDir, 'index.html');
if (fs.existsSync(indexSrc)) {
  fs.copyFileSync(indexSrc, indexDest);
  console.log('✅ Copied index.html');
} else {
  console.error('❌ index.html not found!');
  process.exit(1);
}

// Folders to copy
const folders = ['css', 'js', 'assets', 'database'];

for (const folder of folders) {
  const src = path.join(rootDir, folder);
  const dest = path.join(distDir, folder);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`✅ Copied folder: ${folder}`);
  } else {
    console.warn(`⚠️ Folder ${folder} does not exist, skipping.`);
  }
}

console.log('🎉 Build complete! All static assets ready in dist/ folder.');
