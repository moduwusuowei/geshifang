# 格式坊 — 公众号文章排版工具

纯前端 Markdown 转微信公众号文章排版工具，支持本地排版和 AI 智能排版双模式。

![image-20260617174929540](README.assets/image-20260617174929540.png)

---

## 快速开始

```bash
npm start
# 或
node server.js
```

浏览器打开 `http://localhost:8899` 即可使用。

---

## 功能总览

### 编辑区

| 功能 | 说明 |
|------|------|
| Markdown 编辑 | 左栏文本区域输入或粘贴 Markdown |
| 行号显示 | 编辑区左侧显示行号 |
| 粘贴图片 | 从剪贴板粘贴图片 → 自动插入 `![](pasted:N)` 占位符并渲染到预览 |
| 粘贴 Excel 表格 | 从 Excel 复制单元格 → 自动转为 Markdown 表格语法 |
| 拖入 .md 文件 | 拖拽 Markdown 文件到编辑区 → 自动载入 |
| 导入 .md 文件 | 点击工具栏 📂 按钮选择文件导入 |
| Tab 缩进 | 按 Tab 键插入制表符，非跳转焦点 |
| 快捷插入 | 工具栏 B/I/链接/引用/图片 按钮，快速包裹选中文本 |
| 草稿自动保存 | 输入 500ms 防抖 + 关闭页面时保存到 localStorage |
| 多草稿管理 | 工具栏 📝 按钮管理多个草稿（保存/切换/删除） |

### 一键排版

点击 **"一键排版"** 或按 `Ctrl+S`，将 Markdown 渲染为带内联样式的公众号文章 HTML。

- **本地排版**（默认）：纯客户端渲染，无需联网
- **AI 排版**（配置 API Key 后）：调用 DeepSeek API 智能排版

排版后自动执行：
- 字数/段落/阅读时间 统计注入到标题下方
- 错别字自动修正
- 敏感词检测并警告
- 首行缩进、字体、段间距应用

### 预览区

| 功能 | 说明 |
|------|------|
| WYSIWYG 编辑 | 预览区 `contenteditable`，可直接修改排版结果 |
| 撤销/重做 | `Ctrl+Z` / `Ctrl+Y` 或工具栏按钮，最多 50 步 |
| 搜索替换 | `Ctrl+F` 切换搜索栏，支持前/后导航和全部替换 |
| 一键复制 | 复制排版 HTML 到剪贴板，直接粘贴到公众号后台 |
| 复制纯文本 | 去除所有格式，复制纯文字内容 |
| 自动生成目录 | 根据 H1~H4 标题在文章顶部生成可点击目录 |

### AI 辅助

| 功能 | 说明 |
|------|------|
| 润色 | 优化表达、修正语病，保持原意 |
| 扩写 | 丰富内容、增加细节 |
| 缩写 | 精简提炼核心信息 |
| 翻译 | 支持中译英/日/韩三种语言 |

点击工具栏 **AI** 按钮打开面板，输入或选中文字，选择操作类型即可。需要先配置 DeepSeek API Key。

### 样式控制

| 功能 | 说明 |
|------|------|
| H1~H4 颜色+字号 | 工具栏取色器 + 下拉分别设置各级标题 |
| 表头色 | 自定义表格 `thead` 背景色 |
| 字体 | 系统默认 / 衬线 / 等宽 / 楷体 / 宋体 |
| 段间距 | 0.5em / 1em / 1.5em / 2em |
| 首行缩进 | 开关控制段落 2em 缩进 |
| 样式模板 | 保存当前样式配置为模板，快速切换（右键删除） |
| 模板导入/导出 | 工具栏 📤 按钮导出/导入 JSON 模板文件，方便分享 |
| 自定义 CSS | 写入 CSS 覆盖任意样式，内置 9 套预设模板 |

### 内置 CSS 预设

| 模板 | 风格 |
|------|------|
| 🌿 简约留白 | 干净透气，文字为主 |
| ☀️ 暖阳橙调 | 温暖活力，橙色调 |
| 🌲 森林绿意 | 自然沉稳，绿色系 |
| 🌆 暮色紫调 | 优雅深邃，紫色系 |
| 🌊 海洋蓝调 | 冷静专业，蓝色系 |
| 🏮 国风典雅 | 朱红墨色，楷体宣纸感 |
| 🌙 极客暗色 | 深色背景，GitHub 风格 |
| 🎨 柔和莫兰迪 | 低饱和度，高级克制 |
| 💻 代码舒适 | 暖深灰代码块，阅读友好 |

### 排版支持语法

| 元素 | 语法示例 | 说明 |
|------|----------|------|
| H1 | `# 标题` / `## 标题` / `一、标题` | 左侧蓝色边框 |
| H2 | `## 标题` / `### 标题` / `（一）标题` | 左侧浅蓝边框 |
| H3 | `### 标题` / `#### 标题` / `【标题】` | 纯文字 |
| H4 | `#### 标题` / `##### 标题` | 纯文字 |
| 段落 | 普通文字 | 行高 1.8 |
| 加粗 | `**文字**` | 深蓝色粗体 |
| 删除线 | `~~文字~~` | 灰色删除线 |
| 内联代码 | `` `代码` `` | 浅灰底 + 红色字 |
| 链接 | `[文字](url)` | 蓝色下划线 |
| 图片 | `![alt](url)` | 居中圆角 |
| 无序列表 | `- 项` / `* 项` | 支持套嵌缩进 |
| 有序列表 | `1. 项` | 支持套嵌缩进 |
| 任务列表 | `- [ ] 待办` / `- [x] 已完成` | 复选框 |
| 引用 | `> 引用` | 浅灰底 + 蓝色左边框 |
| 代码块 | ```` ```语言 ```` | 深色底等宽字体 |
| 缩进代码 | 行首 Tab / 4空格 | 自动识别 |
| 表格 | `\| 列1 \| 列2 \|` | 斑马纹 + 圆角 |
| 分割线 | `---` | 灰色横线 |
| 公式 | `$$ LaTeX $$` | CodeCogs SVG 渲染 |

### 导出

| 功能 | 说明 |
|------|------|
| 导出 Markdown | 下载 `.md` 文件，粘贴图片转为 base64 |
| 导出长图 | 使用 html2canvas 渲染预览为 PNG |
| 导出 PDF | 使用 html2canvas + jsPDF 生成 PDF 文件 |

### 界面主题

| 功能 | 说明 |
|------|------|
| 深色/浅色 | 页眉按钮切换，持久化偏好 |
| 全屏编辑 | 页眉按钮，主区域全屏 |
| 手机预览 | 限制预览宽度 375px 模拟手机 |

### 辅助功能

| 功能 | 说明 |
|------|------|
| 历史版本 | 每次排版保存快照，最多 20 条，可回溯恢复 |
| 快捷键面板 | 按 `?` 键显示快捷键列表 |
| 快捷键自定义 | 工具栏 ⌨ 按钮可自定义快捷键 |
| 页脚配置 | 通过 `window.GS_CONFIG.footer` 自定义创作者信息 |

---

## 配置

### API Key（AI 排版）

编辑 `config/apiConfig.js`：

```js
export const BACKEND_API_KEY = 'your-deepseek-api-key'
```

默认值为 `'your-api-key-here'`，此时使用纯本地排版。

### 页脚信息

编辑 `index.html` 顶部 `<script>` 中的 `window.GS_CONFIG`：

```js
window.GS_CONFIG = {
  footer: {
    text: '格式坊 · 本地 Markdown 转公众号排版工具',
    creator: { label: '创作者', url: 'https://example.com', name: 'Your Name' },
    license: { label: '开源', url: 'https://github.com/...', name: 'MIT License' }
  }
}
```

设为 `null` 或删除则不显示页脚。

---

## 部署

本项目是纯静态前端应用，无需后端服务，可直接部署到任意静态托管平台。

### Cloudflare Pages（推荐）

**方式一：直接上传（最快）**

1. 打开 [Cloudflare Pages](https://pages.cloudflare.com/) → **创建项目**
2. 选 **直接上传** → 将 `geshifang` 文件夹拖入
3. 等待部署完成，获得 `xxx.pages.dev` 链接

**方式二：连接 Git 仓库**

1. Cloudflare Pages → **创建项目** → 连接 Git 仓库
2. 构建设置：框架预设 **None**，构建输出目录 **`.`**
3. 保存并部署

### Vercel

1. 安装 Vercel CLI：`npm i -g vercel`
2. 在 `geshifang` 目录下运行 `vercel`，按提示部署

或直接将 `geshifang` 文件夹拖入 [Vercel](https://vercel.com/) 控制台。

### GitHub Pages

1. 将代码推送到 GitHub 仓库
2. Settings → Pages → 源选择 `main` 分支，目录选 `/`（根目录）
3. 或使用 GitHub Actions 自动部署

### Nginx 部署（VPS 场景）

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/geshifang;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
```

### Docker 部署

在项目根目录创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
EXPOSE 8899
CMD ["node", "server.js"]
```

```bash
docker build -t geshifang .
docker run -d -p 8899:8899 geshifang
```

---

## 数据存储

所有数据存储在浏览器 `localStorage`：

| Key | 用途 |
|-----|------|
| `geshifang_draft` | 当前编辑中的 Markdown 草稿 |
| `geshifang_drafts` | 多草稿管理（JSON 对象） |
| `geshifang_theme` | 主题偏好 `dark` / `light` |
| `gs_templates` | 样式模板（JSON） |
| `gs_custom_css` | 自定义 CSS 文本 |
| `gs_history` | 历史版本快照 |
| `gs_custom_shortcuts` | 自定义快捷键配置 |

---

## 技术栈

- **前端**：原生 HTML / CSS / JavaScript ES Module
- **样式**：Tailwind CSS（CDN）+ CSS 变量主题
- **排版引擎**：纯 JavaScript 内联样式生成器
- **AI 接口**：DeepSeek API（可选）
- **图片渲染**：html2canvas
- **公式渲染**：CodeCogs LaTeX SVG
- **服务器**：Node.js 静态文件服务

## 使用展示

1.一键格式化

![image-20260617175157155](README.assets/image-20260617175157155.png)

2.添加目录

![image-20260617175218499](README.assets/image-20260617175218499.png)



喜欢就添个star，为我的创作提供更强的动力......

