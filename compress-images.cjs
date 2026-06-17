const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if sharp is installed
function ensureSharp() {
  try {
    require.resolve('sharp');
    return require('sharp');
  } catch {
    console.log('Installing sharp...');
    execSync('npm install -g sharp', { stdio: 'inherit' });
    return require('sharp');
  }
}

const sharp = ensureSharp();
const IMG_DIR = 'D:/portfolio/public/images';
const MAX_DIM = 2000; // max width or height

async function compressImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const stat = fs.statSync(filePath);
  const originalSize = stat.size;

  let pipeline = sharp(filePath);

  // Resize large images
  const metadata = await pipeline.metadata();
  if (metadata.width > MAX_DIM || metadata.height > MAX_DIM) {
    pipeline = pipeline.resize(MAX_DIM, MAX_DIM, { fit: 'inside', withoutEnlargement: true });
  }

  // Process based on format
  const tmpPath = filePath + '.tmp';

  if (ext === '.jpg' || ext === '.jpeg') {
    await pipeline.jpeg({ quality: 80, mozjpeg: true }).toFile(tmpPath);
  } else if (ext === '.png') {
    await pipeline.png({ quality: 80, compressionLevel: 9, palette: true }).toFile(tmpPath);
  } else {
    // Skip non-image files
    return null;
  }

  const newSize = fs.statSync(tmpPath).size;
  const saved = originalSize - newSize;
  const pct = ((saved / originalSize) * 100).toFixed(1);

  // Replace original with compressed version
  fs.unlinkSync(filePath);
  fs.renameSync(tmpPath, filePath);

  return { file: path.basename(filePath), before: originalSize, after: newSize, saved: saved, pct: pct };
}

async function walk(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await walk(fullPath);
      results.push(...sub);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

async function main() {
  console.log('Scanning images...');
  const files = await walk(IMG_DIR);
  console.log(`Found ${files.length} images to compress\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  let count = 0;

  // Process sequentially to avoid memory issues
  for (const file of files) {
    const result = await compressImage(file);
    if (result) {
      totalBefore += result.before;
      totalAfter += result.after;
      count++;
      const mb = (result.before / 1_000_000).toFixed(2);
      const savedMb = (result.saved / 1_000_000).toFixed(2);
      process.stdout.write(`\r[${count}/${files.length}] ${result.file}: ${mb}MB → ${savedMb}MB saved (${result.pct}%)`);
    }
  }

  console.log('\n\n=== Summary ===');
  console.log(`Files compressed: ${count}/${files.length}`);
  console.log(`Before: ${(totalBefore / 1_000_000).toFixed(1)} MB`);
  console.log(`After:  ${(totalAfter / 1_000_000).toFixed(1)} MB`);
  console.log(`Saved:  ${((totalBefore - totalAfter) / 1_000_000).toFixed(1)} MB (${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
