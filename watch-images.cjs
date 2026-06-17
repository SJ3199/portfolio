/**
 * 监听图片目录变化，自动重新生成 gallery.json
 * 配合 astro dev 使用：保存图片 → 自动刷新浏览器
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WATCH_DIR = path.join(__dirname, 'public', 'images');
const GEN_SCRIPT = path.join(__dirname, 'gen-gallery.cjs');
const DEBOUNCE_MS = 500;

console.log('👁️  正在监听图片目录...');
console.log(`   ${WATCH_DIR}\n`);

let timer = null;

function onFileChange(eventType, filename) {
  if (!filename || filename.startsWith('.')) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      console.log(`🔄 检测到图片变动: ${filename}`);
      execSync(`node "${GEN_SCRIPT}"`, { cwd: __dirname, stdio: 'inherit' });
      console.log('✅ gallery.json 已更新，刷新浏览器即可查看\n');
    } catch (e) {
      console.error('❌ 生成失败:', e.message);
    }
  }, DEBOUNCE_MS);
}

// 递归监听所有子目录
function watchRecursive(dir) {
  if (!fs.existsSync(dir)) return;
  fs.watch(dir, { persistent: true }, onFileChange);
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      watchRecursive(path.join(dir, entry.name));
    }
  });
}

watchRecursive(WATCH_DIR);
console.log('✅ 已就绪 — 修改 public/images 下的图片后刷新浏览器即可。\n');
