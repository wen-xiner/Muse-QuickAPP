# 🏝 心屿计划 · Muse

> **以温柔的方式，让技术成为青少年心理健康的守护者**

[![软著](https://img.shields.io/badge/软著-申请中-9B7BB5)](https://github.com)
[![团队](https://img.shields.io/badge/团队-灯塔象限-9B7BB5)](https://github.com)
[![平台](https://img.shields.io/badge/平台-网页H5-blue)](https://uniapp.dcloud.io)
[![许可](https://img.shields.io/badge/许可-MIT-green)](./LICENSE)

---

## 📖 项目简介

**心屿计划（Muse）** 是一款面向青少年的心理健康辅助应用。通过 **情绪日记记录**、**AI 智能分析**、**心理疏导对话** 和 **呼吸冥想练习** 四大核心功能，帮助青少年认识、理解并调节自己的情绪。

由 **灯塔象限** 团队开发，基于 uni-app 构建，当前以 **网页 H5** 形态部署上线，后续可复用同一套代码扩展多端。

> "心屿" —— 每个人心中都有一座需要被温柔守护的岛屿。

---

## ✨ 核心功能

### 📝 情绪日记

- 16 种情绪类型（快乐、焦虑、愤怒、悲伤等），滑动设置 1-10 强度等级
- **AI 智能分析**：调用 DeepSeek 从优势、改进建议、应对方法三维度给出个性化反馈
- 自动识别 **认知偏差**（灾难化思维、非黑即白、过度概括等 8 种）
- 按情绪类型筛选、关键词搜索历史日记
- 7 天情绪趋势可视化折线图
- 日记数据导出（复制到剪贴板）

### 💬 AI 心理问答

- 6 大对话场景：心有困惑 · 学习压力 · 人际关系 · 家庭关系 · 未来规划 · 情绪管理
- DeepSeek V4 Flash 驱动，温暖专业的心理疏导风格
- **智能摘要压缩**：≤50 轮完整保留，超出自动生成前序摘要，保持上下文连贯
- **实时危机检测**：中英文关键词 + 正则双重匹配，精准识别自杀/自残/霸凌信号
- 检测到危机内容自动弹窗 → 引导与 AI 聊聊 / 一键拨打心理援助热线（400-161-9995）

### 🧘 情绪调节

- 4 种呼吸练习模式：
  | 模式 | 吸气 | 屏息 | 呼气 |
  |------|:---:|:---:|:---:|
  | 4-7-8 放松法 | 4s | 7s | 8s |
  | 盒式呼吸 | 4s | 4s | 4s |
  | 4-4-6 平静法 | 4s | 4s | 6s |
  | 7-11 深度放松 | 7s | — | 11s |
- 3 分钟正念冥想语音引导
- 呼吸球动画可视化 + 震动反馈

### 🎨 个性化

- **暗黑模式**：亮色/暗色双主题，全局 CSS 变量切换
- **独立背景切换**：日记页和对话页各自可选不同背景（晨雾森林、海波纹等 6 种）
- **多账户隔离**：每个账户独立数据空间，支持添加/切换/删除账户

### 🔒 安全与隐私

- 全部数据存储于**本地设备**，采用多账户前缀隔离
- AI 请求通过 Cloudflare Pages Function 安全代理，API Key 不暴露前端
- 访问令牌验证 + IP 速率限制（30次/分钟）
- **预警系统**：手动预警 + 自动危机关键词检测 + 预警记录归档

---

## 🌐 在线访问

| 环境 | 地址 |
|------|------|
| Cloudflare Pages | [https://muse-ember-quickapp.pages.dev](https://muse-ember-quickapp.pages.dev) |
| Surge.sh（纯静态） | [https://muse-ember.surge.sh](https://muse-ember.surge.sh) |

> ⚠️ Surge.sh 不支持 Serverless Functions，AI 功能仅在 Cloudflare Pages 可用。

---

## 🛠 技术架构

```
┌──────────────────────────────────────────────┐
│              前端 · uni-app (Vue 3)           │
│  首页仪表盘 │ 情绪日记 │ AI问答 │ 情绪调节 │ 设置 │
├──────────────────────────────────────────────┤
│     本地存储 (localStorage · 多账户前缀)       │
├──────────────────────────────────────────────┤
│    Cloudflare Pages Function (API 安全代理)    │
├──────────────────────────────────────────────┤
│               DeepSeek API                    │
└──────────────────────────────────────────────┘
```

### 技术栈

| 分类 | 技术选型 |
|------|----------|
| 应用框架 | uni-app 3.x (Vue 3 Options API) |
| 构建工具 | Vite 5 + @dcloudio/vite-plugin-uni |
| 样式方案 | SCSS + CSS 自定义属性 (暗黑模式) |
| AI 模型 | DeepSeek V4 Flash |
| API 代理 | Cloudflare Pages Functions |
| 静态部署 | Cloudflare Pages / Surge.sh |
| 数据存储 | localStorage (多账户前缀隔离) |
| 图片格式 | WebP (构建时保留原始 WebP) |

### 项目结构

```
Muse_QuickAPP/
├── pages/                     # 页面
│   ├── index/index.vue        # 🏠 首页 · 情绪仪表盘 + 快速记录
│   ├── diary/
│   │   ├── list.vue           # 📋 日记列表 + 情绪筛选
│   │   ├── edit.vue           # ✏️ 写日记 + 情绪选择
│   │   └── detail.vue         # 📖 日记详情 + AI分析结果
│   ├── chat/
│   │   ├── index.vue          # 💬 场景选择
│   │   └── conversation.vue   # 🤖 AI 对话界面
│   ├── regulation/index.vue   # 🧘 呼吸练习 + 正念冥想
│   ├── user/index.vue         # ⚙️ 个人中心 + 设置
│   ├── login/index.vue        # 🔑 登录 + 多账户管理
│   └── onboarding/index.vue   # 👋 新用户引导
├── common/                    # 公共模块
│   ├── constants/             # 常量 (情绪类型/认知偏差/背景资源/危机关键词)
│   ├── utils/                 # 工具 (存储/日期/网络/账户/背景Store/背景解析)
│   └── styles/common.scss     # 全局样式 + 背景主题 + 毛玻璃效果
├── components/                # 公共组件
│   ├── ChatMessage.vue        # 对话气泡
│   ├── CrisisModal.vue        # 危机预警弹窗
│   ├── BackgroundLayer.vue    # 背景图层 (淡入淡出切换)
│   └── BackgroundPicker.vue   # 背景选择器
├── services/
│   ├── ai.js                  # AI 客户端 (请求去重/重试/对话摘要/降级)
│   └── config.js              # API 端点配置
├── functions/                 # Cloudflare Pages Functions
│   └── deepseek-proxy.js      # DeepSeek API 安全代理 (令牌/速率限制/校验)
├── static/
│   ├── backgrounds/           # 背景图 (WebP · 亮色/暗色双版本)
│   └── tabs/                  # 底栏图标
├── dist/                      # 🏗 构建产出
├── pages.json                 # 路由 + TabBar 配置
├── vite.config.js             # Vite 构建配置
└── package.json               # 依赖与脚本
├── src/                       # ⚠️ 早期残留副本（已弃用，请勿修改）
```

> ⚠️ `src/` 为早期迁移残留的代码副本（含与根目录重复的页面/组件/工具），**已弃用，请勿修改**。所有开发与构建均以根目录 `pages/`、`components/`、`common/`、`services/` 为准。

---

## 🚀 本地开发

### 前置要求

- Node.js >= 18
- npm >= 9

```bash
# 1. 克隆项目
git clone <repo-url>
cd Muse_QuickAPP

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev:h5

# 4. 浏览器打开
# http://localhost:5173
```

### 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev:h5` | 启动 H5 开发服务器 |
| `npm run build:h5` | 生产构建 (自动同步静态资源 + Functions) |
| `npm run preview` | 预览构建结果 |

---

## 📦 构建与部署

### 构建

```bash
npm run build:h5
```

`build:h5` 脚本自动完成：
1. Vite 编译 Vue/SCSS → `dist/assets/`
2. 复制原始 WebP 背景图 → `dist/static/backgrounds/`
3. 复制底栏图标 → `dist/static/tabs/`
4. 复制 Cloudflare Functions → `dist/functions/`
5. 清理冗余构建产物

### 部署到 Cloudflare Pages

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
npx wrangler pages deploy ./dist --project-name <你的项目名>

# 设置 DeepSeek API Key (仅首次)
npx wrangler pages secret put DEEPSEEK_API_KEY --project-name <你的项目名>
# 粘贴你的 sk-xxx API Key
```

### 构建产物结构

```
dist/
├── index.html                  # 入口
├── assets/                     # JS/CSS (带 hash)
├── static/
│   ├── backgrounds/            # WebP 背景图 (~221KB)
│   └── tabs/                   # 底栏图标
├── functions/
│   └── deepseek-proxy.js       # API 代理
└── _routes.json                # SPA 路由规则
```

---

## 📡 API 说明

### DeepSeek 代理接口

前端通过 Cloudflare Pages Function 安全代理调用 DeepSeek，避免 API Key 暴露。

```
POST /deepseek-proxy
Content-Type: application/json

{
  "model": "deepseek-v4-flash",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "max_tokens": 1000,
  "temperature": 0.7
}
```

**安全机制：**
- API Key 通过 Cloudflare Secrets (`DEEPSEEK_API_KEY`) 注入
- 可选访问令牌验证 (`ACCESS_TOKEN`)
- 单条消息最长 2000 字符
- CORS 跨域支持

### AI 客户端特性

| 特性 | 说明 |
|------|------|
| 超时控制 | 聊天 20s / 分析 15s |
| 自动重试 | 最多 2 次，间隔 1s |
| 请求去重 | 相同内容合并为单次请求 |
| 降级策略 | API 失败返回预设的温暖建议 |
| 对话摘要 | >50 轮自动压缩前 30 轮，缓存复用 |

---

## 🎨 设计系统

| 属性 | 亮色模式 | 暗黑模式 |
|------|---------|---------|
| 主背景 `--bg` | `#FAF7F2` | `#12121E` |
| 卡片背景 `--card-bg` | `#FFFFFF` | `#1E1E32` |
| 主色调 `--accent` | `#9B7BB5`（薰衣草紫） | `#B89DD4` |
| 文字色 `--text-primary` | `#4A4A4A` | `#E8E8F0` |
| 次要背景 `--card-secondary-bg` | `#F5E6D3` | `#2A2A42` |
| 圆角 | 16px 卡片 / 24px 按钮 |

**自定义背景模式下：**
- 页面容器背景透明，露出底层背景图
- 卡片半透明 + 毛玻璃效果（`backdrop-filter: blur(10px)`）
- `body::before` 可读性遮罩确保文字对比度 ≥ 4.5:1（WCAG AA）
- 对话气泡保持不透明，确保对话文字清晰

---

## 👥 团队

| 项目 | 信息 |
|------|------|
| 项目类型 | 网页 H5 (uni-app) |
| 项目名称 | **心屿计划 · Muse** |
| 团队名称 | **灯塔象限** |
| 核心理念 | 以温柔的方式，让技术成为青少年心理健康的守护者 |

---

## 📄 许可证

本项目基于 MIT 许可证开源。

---

*以温柔的方式，让技术成为青少年心理健康的守护者*
