process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Use wrangler if available, otherwise use curl/rclone approach
const BASE_DIR = 'D:/portfolio/public/images';
const CDN_BASE = 'https://pub-ea6cf7d0fc18449aa9cce3aee87abf18.r2.dev';
const BUCKET = 'portfolio-images';

console.log('Installing wrangler for R2 upload...');

const npm = spawn('npm', ['install', '-g', 'wrangler'], { stdio: 'inherit', shell: true });
npm.on('close', (code) => {
  if (code !== 0) {
    console.error('Failed to install wrangler');
    process.exit(1);
  }
  console.log('Wrangler installed. Now uploading files...');
  uploadWithWrangler();
});

function uploadWithWrangler() {
  const env = {
    ...process.env,
    CLOUDFLARE_ACCOUNT_ID: '93eb059c98d30a883375cfaf04bc20e6',
    CLOUDFLARE_R2_ACCESS_KEY_ID: 'bf60d76fc62b3555e9b88a87c700af49',
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'b6559e116d5b308569514e23f5d42b96888f23fe1644dcca6bed7cd9997d4300',
  };

  function* walkDir(dir, prefix = 'images/') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        yield* walkDir(path.join(dir, entry.name), prefix + entry.name + '/');
      } else {
        yield { key: prefix + entry.name, filePath: path.join(dir, entry.name) };
      }
    }
  }

  const files = [...walkDir(BASE_DIR)];
  console.log(`Found ${files.length} files`);

  const CDN_MAP = {};

  function uploadOne(idx) {
    if (idx >= files.length) {
      fs.writeFileSync('D:/portfolio/_cdn_map.json', JSON.stringify(CDN_MAP, null, 2), 'utf8');
      console.log(`\nAll done! ${Object.keys(CDN_MAP).length} files uploaded`);
      console.log(`CDN Base: ${CDN_BASE}`);
      return;
    }
    const f = files[idx];
    const p = spawn('npx', ['wrangler', 'r2', 'object', 'put', `${BUCKET}/${f.key}`, '--file', f.filePath], {
      env,
      stdio: 'pipe',
      shell: true,
    });
    let stderr = '';
    p.stderr.on('data', d => stderr += d);
    p.on('close', code => {
      if (code === 0) {
        const localPath = '/' + f.key;
        CDN_MAP[localPath] = `${CDN_BASE}/${f.key}`;
        console.log(`[${idx+1}/${files.length}] OK ${f.key}`);
      } else {
        console.log(`[${idx+1}/${files.length}] FAIL ${f.key} - ${stderr.trim()}`);
      }
      setTimeout(() => uploadOne(idx + 1), 50);
    });
  }

  uploadOne(0);
}
