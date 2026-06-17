# Portfolio 作品集网站

基于 [Ricoui Portfolio](https://github.com/ricocc/ricoui-portfolio) 开源模板定制。

## 项目结构

```
portfolio/
├── public/
│   └── images/           ← 📁 图片文件夹（放你的作品图）
│       ├── resume/        → 个人简历
│       ├── live-stream/   → 直播画面设计图
│       ├── posters/       → 海报设计
│       ├── douyin-products/ → 抖音产品图
│       ├── douyin-store/  → 抖音店铺装修图
│       └── detail-pages/  → 详情页
├── src/
│   ├── config/site.js    ← 🌐 网站配置（标题、社交链接等）
│   ├── collections/
│   │   └── gallery.json  ← 📋 画廊数据（图片列表）
│   ├── components/
│   │   └── sections/
│   │       └── GallerySection.astro ← 🖼️ 画廊组件
│   └── pages/
│       └── index.astro   ← 🏠 首页
└── package.json
```

## 使用方法

### 1. 启动开发服务器

```bash
cd portfolio
npm run dev
```

浏览器访问 http://localhost:5200/

### 2. 添加你的作品图片

1. 将图片放入 `public/images/` 下对应分类的文件夹
2. 编辑 `src/collections/gallery.json`，参照现有格式添加图片条目：
   ```json
   {
     "category": "posters",
     "categoryName": "海报设计",
     "title": "你的作品标题",
     "description": "作品描述",
     "image": "/images/posters/你的文件名.jpg"
   }
   ```
3. 保存后页面会自动刷新

### 3. 自定义网站信息

编辑 `src/config/site.js` 修改：
- 网站标题、作者名
- 社交链接（GitHub、小红书、站酷、Behance）
- SEO 关键词和描述

### 4. 构建上线

```bash
npm run build
```

构建产物在 `dist/` 目录，可直接部署到任何静态托管服务。

## 功能特性

- 🎨 暗色/亮色主题切换
- 📱 PC端 + 手机端响应式适配
- 🏷️ 分类筛选标签
- 🔍 点击查看大图（灯箱效果）
- ✨ 滚动动画（AOS）
- ⚡ Astro 高性能静态生成
