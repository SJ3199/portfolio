const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'public', 'images');
const categories = {
  'live-stream': { zh: '直播画面', en: 'Live Stream' },
  'posters': { zh: '海报设计', en: 'Posters' },
  'detail-pages': { zh: '长图', en: 'Detail Pages' },
  'material-design': { zh: '物料设计', en: 'Material Design' },
  'jd-splash': { zh: '京东开机屏设计', en: 'JD Splash' },
  'brand-design': { zh: '品牌设计', en: 'Brand Design' },
  'douyin-store': { zh: '抖音店铺', en: 'Douyin Store' },
  'douyin-products': { zh: '抖音产品图', en: 'Douyin Products' },
};

const gallery = [];

Object.entries(categories).forEach(([folder, meta]) => {
  const dir = path.join(baseDir, folder);
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(f) && !f.toLowerCase().startsWith('placeholder'));

  /**
   * Smart natural sort by leading number + optional sub-suffix.
   * Examples:
   *   1.jpg, 2.jpg, 3a.jpg, 3b.jpg, 4.png, 7.jpg, 12.jpg
   * Inserts: 3a/3b sit between 3 and 4 — no need to rename 4+.
   * Jumps:  1,2,3,7 → ordered by numeric value (7 > 3).
   */
  imageFiles.sort((a, b) => {
    // Extract: main number (integer) + sub suffix (letters or .digits)
    const parse = (s) => {
      const m = s.match(/^(\d+)([a-z]|\.\d+)?/i);
      if (!m) return { n: Infinity, sub: '', rest: s };
      const n = parseInt(m[1], 10);
      const sub = (m[2] || '').toLowerCase();
      return { n, sub, rest: s.slice(m[0].length) };
    };
    const pa = parse(a), pb = parse(b);
    if (pa.n !== pb.n) return pa.n - pb.n;
    if (pa.sub || pb.sub) return (pa.sub || '').localeCompare(pb.sub || '');
    return pa.rest.localeCompare(pb.rest);
  });

  imageFiles.forEach(file => {
    const nameNoExt = file.replace(/\.[^.]+$/, '');
    gallery.push({
      id: nameNoExt,
      image: `/images/${folder}/${file}`,
      title: nameNoExt.replace(/[-_]/g, ' '),
      description: '',
      category: folder,
      categoryName: meta.zh,
      categoryNameEn: meta.en,
      details: '',
    });
  });
});

const outputPath = path.join(__dirname, 'src', 'collections', 'gallery.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(gallery, null, 2), 'utf-8');
console.log(`Generated ${gallery.length} items → src/collections/gallery.json`);
