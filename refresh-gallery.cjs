const fs = require('fs');

const categories = {
  'live-stream': { nameZh: '直播画面', nameEn: 'Live Stream' },
  'posters': { nameZh: '海报设计', nameEn: 'Posters' },
  'detail-pages': { nameZh: '长图', nameEn: 'Detail Pages' },
  'material-design': { nameZh: '物料设计', nameEn: 'Material Design' },
  'jd-splash': { nameZh: '京东开机屏设计', nameEn: 'JD Splash' },
  'brand-design': { nameZh: '品牌设计', nameEn: 'Brand Design' },
  'douyin-store': { nameZh: '抖音店铺', nameEn: 'Douyin Store' },
  'douyin-products': { nameZh: '抖音产品图', nameEn: 'Douyin Products' },
};

const oldGallery = JSON.parse(fs.readFileSync('D:/portfolio/src/collections/gallery.json', 'utf8'));
const oldMap = {};
oldGallery.forEach(item => {
  const key = item.category + '/' + item.image.split('/').pop();
  oldMap[key] = item;
});

const items = [];
let id = 1;

for (const [cat, meta] of Object.entries(categories)) {
  const dir = `D:/portfolio/public/images/${cat}`;
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir).filter(f => {
    const ext = f.toLowerCase();
    return (ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || ext.endsWith('.webp')) && f !== 'placeholder.jpg';
  });

  files.sort((a, b) => {
    const parse = (s) => {
      const m = s.match(/^(\d+)([a-z]|\.\d+)?/i);
      if (!m) return { n: Infinity, sub: '', rest: s };
      return { n: parseInt(m[1], 10), sub: (m[2] || '').toLowerCase(), rest: s.slice(m[0].length) };
    };
    const pa = parse(a), pb = parse(b);
    if (pa.n !== pb.n) return pa.n - pb.n;
    if (pa.sub || pb.sub) return (pa.sub || '').localeCompare(pb.sub || '');
    return pa.rest.localeCompare(pb.rest);
  });

  files.forEach(f => {
    const old = oldMap[cat + '/' + f];
    const nameNoExt = f.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    items.push({
      id: id++,
      image: `/images/${cat}/${f}`,
      title: old ? old.title : nameNoExt,
      description: old ? old.description : '',
      category: cat,
      categoryName: meta.nameZh,
      categoryNameEn: meta.nameEn,
      details: old ? (old.details || '') : '',
    });
  });
}

// Also preserve old items whose files might still exist but in different names that I didn't pick up
const newImageSet = new Set(items.map(i => i.image));
oldGallery.forEach(old => {
  if (!newImageSet.has(old.image) && fs.existsSync('D:/portfolio/public' + old.image)) {
    items.push(old);
  }
});

fs.writeFileSync('D:/portfolio/src/collections/gallery.json', JSON.stringify(items, null, 2));
console.log('Done: ' + items.length + ' items');
