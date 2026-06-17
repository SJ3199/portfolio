const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = 'D:/portfolio/public/images/brand-design';
const TARGET_WIDTH = 1200; // max width for brand showcase

async function optimize() {
  const files = fs.readdirSync(DIR).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  console.log(`Found ${files.length} images\n`);

  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const filePath = path.join(DIR, file);
    const stat = fs.statSync(filePath);
    totalBefore += stat.size;

    const ext = path.extname(file).toLowerCase();
    const outFile = file.replace(ext, '.jpg');
    const tmpPath = path.join(DIR, outFile + '.tmp');

    try {
      await sharp(filePath)
        .resize(TARGET_WIDTH, null, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(tmpPath);

      const newSize = fs.statSync(tmpPath).size;
      totalAfter += newSize;

      // Remove original if converted
      if (outFile !== file) {
        fs.unlinkSync(filePath);
      }
      // Replace
      if (fs.existsSync(path.join(DIR, outFile))) {
        fs.unlinkSync(path.join(DIR, outFile));
      }
      fs.renameSync(tmpPath, path.join(DIR, outFile));

      const pct = ((1 - newSize / stat.size) * 100).toFixed(1);
      console.log(`${file} → ${outFile}: ${(stat.size/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB (${pct}%)`);
    } catch (err) {
      console.error(`Failed: ${file} — ${err.message}`);
    }
  }

  console.log(`\nTotal: ${(totalBefore/1024/1024).toFixed(1)}MB → ${(totalAfter/1024/1024).toFixed(1)}MB (saved ${((1-totalAfter/totalBefore)*100).toFixed(1)}%)`);
}

optimize().catch(err => { console.error(err); process.exit(1); });
