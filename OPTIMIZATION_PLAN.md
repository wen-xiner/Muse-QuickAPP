# 🏗️ "情绪日记本" 快应用优化规划方案

> 基于快应用官方规范、双线程架构原理及 uni-app quickapp-webview 最佳实践的全面优化方案

---

## 📋 目录

1. [项目现状诊断](#1-项目现状诊断)
2. [Manifest 配置优化](#2-manifest-配置优化)
3. [分包加载改造](#3-分包加载改造)
4. [双线程架构性能优化](#4-双线程架构性能优化)
5. [存储层治理](#5-存储层治理)
6. [安全性加固](#6-安全性加固)
7. [代码架构重构](#7-代码架构重构)
8. [AI 服务层优化](#8-ai-服务层优化)
9. [组件与页面体验优化](#9-组件与页面体验优化)
10. [工程化提升](#10-工程化提升)
11. [实施路线图](#11-实施路线图)

---

## 1. 项目现状诊断

### 1.1 基本信息

| 维度 | 现状 | 问题 |
|------|------|------|
| `minPlatformVersion` | `1060` | 仅刚满足基本要求，分包需要 ≥ `1061` |
| 编译产物 | 单包 `.rpk` | 无分包，首次加载需下载全部代码 |
| 渲染模式 | `quickapp-webview` native 模式 | 双线程架构，需关注通信开销 |
| 存储策略 | 无上限、无监控 | 接近 10MB 上限时毫无预警 |
| 安全 | Token 硬编码 | 前端可反编译获取访问令牌 |
| 测试 | 零覆盖 | 纯人工回归测试 |

### 1.2 性能风险点扫描

| 风险点 | 位置 | 严重程度 |
|--------|------|---------|
| 首页 `loadData()` 每次 `onShow` 全量计算 | `pages/index/index.vue:131` | 🟡 中 |
| 聊天历史全量传递 | `services/ai.js:83-88` | 🟠 高 |
| 三层嵌套 `setInterval` | `pages/regulation/index.vue:179-210` | 🔴 严重 |
| `CrisisModal` 硬编码颜色值 | `components/CrisisModal.vue` | 🟡 中 |
| 无网络超时配置 | `services/ai.js:4` | 🟠 高 |
| Android 权限冗余 | `manifest.json:20-29` | 🟡 中 |

---

## 2. Manifest 配置优化

### 2.1 当前配置问题

```json
// 当前 manifest.json 关键问题：
{
  "quickapp-webview": {
    "minPlatformVersion": 1060,  // ❌ 过低，不支持分包
    // ❌ 缺少 config.logLevel（生产环境应关闭日志）
    // ❌ 缺少 config.designWidth
    // ❌ 缺少 features 声明
    // ❌ 缺少 config.network 超时配置
    // ❌ 缺少 permissionDesc
  },
  "app-plus": {
    "distribute": {
      "android": {
        "permissions": [
          // ❌ READ_LOGS — 不需要
          // ❌ MOUNT_UNMOUNT_FILESYSTEMS — 不需要
          // ❌ READ_PHONE_STATE — 隐私敏感，无需
          // ❌ CHANGE_NETWORK_STATE — 无需主动切换网络
          // ❌ WAKE_LOCK — 无后台需求
        ]
      }
    }
  }
}
```

### 2.2 优化后配置

```json
{
  "name": "情绪日记本",
  "appid": "__UNI__B390407",
  "description": "面向青少年的心理健康辅助快应用",
  "versionName": "1.0.0",
  "versionCode": "100",
  "transformPx": false,
  "quickapp-webview": {
    "mode": "native",
    "icon": "static/logo.png",
    "package": "com.muse.emotiondiary",
    "minPlatformVersion": 1070,
    "versionName": "1.0.0",
    "versionCode": 1,
    "config": {
      "logLevel": "off",
      "designWidth": 750
    },
    "features": [
      { "name": "system.storage" },
      { "name": "system.network" },
      { "name": "system.device" },
      { "name": "system.fetch" },
      { "name": "system.vibrator" },
      { "name": "system.telephony" }
    ]
  },
  "app-plus": {
    "usingComponents": true,
    "nvueStyleCompiler": "uni-app",
    "compilerVersion": 3,
    "splashscreen": {
      "alwaysShowBeforeRender": true,
      "waiting": true,
      "autoclose": true,
      "delay": 0
    },
    "modules": {},
    "distribute": {
      "android": {
        "permissions": [
          "<uses-permission android:name=\"android.permission.ACCESS_NETWORK_STATE\"/>",
          "<uses-permission android:name=\"android.permission.ACCESS_WIFI_STATE\"/>",
          "<uses-permission android:name=\"android.permission.VIBRATE\"/>"
        ]
      },
      "ios": {},
      "sdkConfigs": {}
    }
  },
  "mp-weixin": {
    "appid": "",
    "setting": { "urlCheck": false },
    "usingComponents": true
  },
  "uniStatistics": { "enable": false },
  "vueVersion": "3"
}
```

### 2.3 变更说明

| 变更项 | 旧值 | 新值 | 原因 |
|--------|------|------|------|
| `minPlatformVersion` | `1060` | `1070` | 支持分包 + 更广泛系统能力 |
| `config.logLevel` | 未设置(默认 log) | `off` | 生产环境关闭日志，减少开销 |
| `config.designWidth` | 未设置(默认 750) | `750` | 显式声明设计基准 |
| `features` | 未声明 | 6 项接口声明 | 规范要求，部分接口需声明后调用 |
| Android 权限 | 8 项 | 3 项 | 移除不必要权限，降低隐私风险 |

---

## 3. 分包加载改造

### 3.1 分包原则

根据快应用规范：
- **基础包 ≤ 1MB**，包含首页和公共资源
- **单个分包 ≤ 1MB**
- **总包体积 ≤ 4MB**
- 分包可引用基础包，不可跨分包引用
- `minPlatformVersion` ≥ `1061`

### 3.2 当前页面分布（9 个页面，全部在主包）

```
pages/
├── onboarding/index    # 引导页（仅首次）
├── index/index         # 首页（高频）
├── diary/list          # 日记列表
├── diary/edit          # 日记编辑
├── diary/detail        # 日记详情
├── chat/index          # AI问答入口
├── chat/conversation   # AI对话
├── regulation/index    # 情绪调节
└── user/index          # 用户中心
```

### 3.3 建议分包方案

```
┌─────────────────────────────────────────────────┐
│ 基础包 (main) — ≤ 1MB                            │
│ ├── pages/index/index        # 首页（TabBar）    │
│ ├── common/styles/                              │
│ ├── common/utils/storage.js                     │
│ ├── common/utils/date.js                        │
│ ├── common/constants/emotions.js                 │
│ └── static/tabs/             # TabBar 图标        │
├─────────────────────────────────────────────────┤
│ 分包 diary — ≤ 1MB                               │
│ ├── pages/diary/list                             │
│ ├── pages/diary/edit                             │
│ └── pages/diary/detail                           │
├─────────────────────────────────────────────────┤
│ 分包 chat — ≤ 1MB                                │
│ ├── pages/chat/index                             │
│ ├── pages/chat/conversation                      │
│ ├── services/ai.js                               │
│ └── services/config.js                           │
├─────────────────────────────────────────────────┤
│ 分包 emotion — ≤ 1MB                             │
│ ├── pages/regulation/index                       │
│ └── components/CrisisModal.vue                   │
├─────────────────────────────────────────────────┤
│ 分包 profile — ≤ 1MB                             │
│ ├── pages/user/index                             │
│ └── pages/onboarding/index                       │
└─────────────────────────────────────────────────┘
```

### 3.4 pages.json 配置

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "情绪日记本",
        "navigationBarBackgroundColor": "#FAF7F2",
        "navigationBarTextStyle": "black"
      }
    }
  ],
  "subPackages": [
    {
      "root": "pages/diary",
      "pages": [
        { "path": "list", "style": { "navigationBarTitleText": "我的日记" } },
        { "path": "edit", "style": { "navigationBarTitleText": "写日记" } },
        { "path": "detail", "style": { "navigationBarTitleText": "日记详情" } }
      ]
    },
    {
      "root": "pages/chat",
      "pages": [
        { "path": "index", "style": { "navigationBarTitleText": "AI问答" } },
        { "path": "conversation", "style": { "navigationBarTitleText": "AI对话" } }
      ]
    },
    {
      "root": "pages/regulation",
      "pages": [
        { "path": "index", "style": { "navigationBarTitleText": "情绪调节" } }
      ]
    },
    {
      "root": "pages/user",
      "pages": [
        { "path": "index", "style": { "navigationBarTitleText": "我的" } }
      ]
    },
    {
      "root": "pages/onboarding",
      "pages": [
        { "path": "index", "style": { "navigationStyle": "custom" } }
      ]
    }
  ],
  "preloadRule": {
    "pages/index/index": {
      "network": "all",
      "packages": ["pages/diary"]
    }
  },
  "globalStyle": {
    "navigationBarBackgroundColor": "#FAF7F2",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#FAF7F2"
  },
  "tabBar": {
    "color": "#9B9B9B",
    "selectedColor": "#9B7BB5",
    "backgroundColor": "#FAF7F2",
    "list": [
      { "pagePath": "pages/index/index", "iconPath": "static/tabs/home.png", "selectedIconPath": "static/tabs/home-active.png", "text": "首页" },
      { "pagePath": "pages/diary/list", "iconPath": "static/tabs/diary.png", "selectedIconPath": "static/tabs/diary-active.png", "text": "日记" },
      { "pagePath": "pages/chat/index", "iconPath": "static/tabs/chat.png", "selectedIconPath": "static/tabs/chat-active.png", "text": "AI问答" },
      { "pagePath": "pages/regulation/index", "iconPath": "static/tabs/regulation.png", "selectedIconPath": "static/tabs/regulation-active.png", "text": "调节" },
      { "pagePath": "pages/user/index", "iconPath": "static/tabs/user.png", "selectedIconPath": "static/tabs/user-active.png", "text": "我的" }
    ]
  }
}
```

### 3.5 分包收益

| 指标 | 改造前 | 改造后 | 改善 |
|------|--------|--------|------|
| 首次加载包大小 | ~全量 | ~基础包仅首页 | ↓ 60-70% |
| 冷启动时间 | 基准 | 预计减少 30-40% | ↑ 显著 |
| 按需下载 | 不支持 | 访问时才下载分包 | ↑ 新能力 |
| 分包预加载 | 不支持 | 首页预加载日记分包 | ↑ 体验优化 |

---

## 4. 双线程架构性能优化

### 4.1 核心原理

快应用（quickapp-webview 模式）采用 **逻辑层 (JS 线程) ↔ Native Bridge ↔ 视图层 (WebView)** 的双线程架构。每次 `setData` 涉及 **4 次跨线程通信**，数据通过 `evaluateJavascript` 以 JSON 字符串形式传输。

### 4.2 优化策略

#### A. data 最小化原则

```js
// ❌ 当前：所有变量放在 data 中（pages/chat/conversation.vue）
data() {
  return {
    sceneId: '',
    sceneTitle: '',
    inputText: '',
    messages: [],          // ✅ 渲染需要
    isLoading: false,      // ✅ 渲染需要
    messageHistory: [],    // ❌ 仅逻辑计算用，不应放 data
    currentScene: null,    // ❌ 仅逻辑计算用
    isFromCrisis: false,   // ❌ 仅逻辑判断用
    welcomeMessage: '',    // ❌ 仅逻辑判断用
    showCrisisModal: false,// ✅ 渲染需要
    crisisContentSnippet: ''// ✅ 渲染需要
  };
}

// ✅ 优化后：区分渲染数据与逻辑数据
data() {
  return {
    inputText: '',
    messages: [],
    isLoading: false,
    showCrisisModal: false,
    crisisContentSnippet: ''
  };
},
created() {
  // 非渲染数据挂在实例上，不触发视图更新
  this._sceneId = '';
  this._sceneTitle = '';
  this._messageHistory = [];
  this._currentScene = null;
  this._isFromCrisis = false;
  this._welcomeMessage = '';
}
```

#### B. 批量数据更新

```js
// ❌ 当前：分散更新（pages/index/index.vue loadData）
this.greeting = getGreeting();
this.todayDate = formatDate(new Date(), 'MM月DD日');
this.totalDiaries = diaries.length;
this.streak = calculateStreak(dates);
this.weekTrend = weekDays.map(/* ... */);
this.weeklyAverage = /* ... */;
// 上面 6 次独立赋值，触发 6 次视图更新通知

// ✅ 优化后：批量计算结果，一次性赋值
const dashboard = this._computeDashboard(diaries);
Object.assign(this, dashboard);
// 单次赋值，Vue nextTick 合并视图更新
```

#### C. 计算属性替代手动计算

```js
// ❌ 当前：在 loadData() 中手动计算 weeklyAverage
this.weeklyAverage = (validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(1);

// ✅ 优化后：使用 computed 自动缓存
computed: {
  weeklyAverage() {
    const valid = this.weekTrend.filter(p => p.value).map(p => p.value);
    if (valid.length === 0) return 0;
    return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
  }
}
```

#### D. 高频操作节流

```js
// ✅ 针对 scroll 等高频事件，使用 uni-app 内置节流
import { throttle } from '@/common/utils/performance.js';

// 对输入搜索做防抖
watch: {
  searchQuery: debounce(function(val) {
    this.performSearch(val);
  }, 300)
}
```

### 4.3 首页性能专项

当前首页 `loadData()` 方法的问题：

```js
// pages/index/index.vue 优化后
export default {
  data() {
    return {
      greeting: '',
      todayDate: '',
      streak: 0,
      selectedEmotion: '',
      intensity: 5,
      todayDiary: null,
      totalDiaries: 0,
      weekTrend: []
    };
  },
  computed: {
    // 将计算逻辑移至 computed，自动缓存
    weeklyAverage() {
      const valid = this.weekTrend.filter(p => p.value).map(p => p.value);
      return valid.length > 0
        ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1)
        : 0;
    }
  },
  onShow() {
    // 30 秒内不重复刷新
    const now = Date.now();
    if (this._lastRefresh && (now - this._lastRefresh) < 30000) return;
    this._lastRefresh = now;
    this.refreshDashboard();
  },
  methods: {
    refreshDashboard() {
      // 批量读取 + 计算，一次性赋值
      const diaries = getDiaries();
      const today = formatDate(new Date(), 'YYYY-MM-DD');
      const todayDiary = diaries.find(d => d.date === today);

      const dashboard = {
        greeting: getGreeting(),
        todayDate: formatDate(new Date(), 'MM月DD日') + ' ' + formatDate(new Date(), 'weekday'),
        totalDiaries: diaries.length,
        streak: calculateStreak(diaries.map(d => d.date)),
        todayDiary: todayDiary || null,
        selectedEmotion: todayDiary ? todayDiary.emotionId : '',
        intensity: todayDiary ? todayDiary.intensity : 5,
        weekTrend: getDaysAgo(7).map(day => ({
          date: day.date,
          value: (diaries.find(d => d.date === day.fullDate) || {}).intensity || null
        }))
      };
      Object.assign(this, dashboard);
    }
  }
};
```

---

## 5. 存储层治理

### 5.1 快应用存储约束

| 限制项 | 值 |
|--------|-----|
| 单个 key 最大 | 1MB |
| 总存储上限 | 10MB |
| 同步 API 异常 | 必须 try-catch |

### 5.2 当前问题

```js
// storage.js 现状：
// ❌ 无容量检查
// ❌ 聊天历史无限增长（每场景可超 1MB）
// ❌ 日记无上限
// ❌ 预警记录无限积累
// ❌ generateId 使用 Math.random（不可靠）
```

### 5.3 优化后的 storage.js

```js
// common/utils/storage.js — 优化版
const STORAGE_KEYS = {
  DIARIES: 'emotion_diaries',
  USER_INFO: 'user_info',
  SETTINGS: 'app_settings',
  WARNING_RECORDS: 'warning_records',
  ONBOARDING: 'has_onboarding',
  CHAT_SESSIONS: 'chat_sessions'
};

// ===== 容量管理 =====
const MAX_DIARIES = 300;            // 最多保留 300 条日记
const MAX_WARNING_RECORDS = 50;     // 最多 50 条预警
const MAX_CHAT_MESSAGES = 100;      // 每个场景最多 100 条消息（约 50 轮对话）
const STORAGE_WARN_THRESHOLD = 8 * 1024 * 1024; // 8MB 预警

export function checkStorageQuota() {
  try {
    const info = uni.getStorageInfoSync();
    if (info.currentSize > STORAGE_WARN_THRESHOLD) {
      console.warn(`[Storage] 存储空间不足: ${(info.currentSize / 1024 / 1024).toFixed(1)}MB / 10MB`);
      // 触发自动清理旧数据
      pruneOldRecords();
    }
  } catch (e) {
    // 静默处理
  }
}

function pruneOldRecords() {
  // 清理 3 个月前的日记
  const diaries = getDiaries();
  const threeMonthsAgo = Date.now() - 90 * 24 * 3600 * 1000;
  const recent = diaries.filter(d => new Date(d.date).getTime() > threeMonthsAgo);
  if (recent.length < diaries.length) {
    uni.setStorageSync(STORAGE_KEYS.DIARIES, JSON.stringify(recent));
  }
}

// ===== 日记管理 =====
export function getDiaries() {
  try {
    const data = uni.getStorageSync(STORAGE_KEYS.DIARIES);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveDiary(diary) {
  const diaries = getDiaries();
  const idx = diaries.findIndex(d => d.id === diary.id);
  if (idx >= 0) {
    diaries[idx] = diary;
  } else {
    diaries.unshift(diary);
  }
  // 容量控制
  if (diaries.length > MAX_DIARIES) {
    diaries.length = MAX_DIARIES;
  }
  uni.setStorageSync(STORAGE_KEYS.DIARIES, JSON.stringify(diaries));
  checkStorageQuota();
  return diary;
}

// ===== 聊天历史（心理疏导场景适配）=====
// 心理疏导需要长上下文，不能简单截断
// 策略：保留完整对话，超过上限时对早期轮次做摘要压缩
const MAX_CHAT_MESSAGES = 100;    // 最多 100 条消息（约 50 轮对话）
const MAX_SESSIONS_PER_SCENE = 3; // 每个场景最多 3 个活跃会话

export function saveChatHistory(sceneId, data) {
  const key = `chat_history:${sceneId}`;
  // 保留最近 100 条消息（约 50 轮），足够覆盖一次深入的心理疏导
  const messages = data.messages.slice(-MAX_CHAT_MESSAGES);
  const history = data.history.slice(-MAX_CHAT_MESSAGES * 2);

  uni.setStorageSync(key, JSON.stringify({
    messages,
    history,
    updatedAt: new Date().toISOString()
  }));

  // 更新会话列表
  let sessions = getChatSessions();
  const existing = sessions.find(s => s.id === sceneId);
  if (existing) {
    existing.updatedAt = new Date().toISOString();
  } else {
    sessions.unshift({ id: sceneId, title: data.title || '', updatedAt: new Date().toISOString() });
  }
  uni.setStorageSync(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
  checkStorageQuota();
}

// ===== ID 生成 =====
let _idCounter = 0;
export function generateId() {
  _idCounter++;
  return `${Date.now().toString(36)}-${_idCounter.toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
}
```

---

## 6. 安全性加固

### 6.1 当前安全态势

```
🔴 严重: ACCESS_TOKEN 硬编码在 services/config.js
🟠 高:   前端直接调用代理，无速率限制
🟡 中:   无输入校验，存在 prompt injection 风险
🟡 中:   无 CSP 配置
```

### 6.2 安全加固方案

#### 6.2.1 Token 隐藏

```js
// ❌ 当前: services/config.js
const API_CONFIG = {
  PROXY_URL: 'https://<your-proxy-domain>/deepseek-proxy',
  ACCESS_TOKEN: '<your-access-token>'  // 明文暴露!
};

// ✅ 优化后: 使用环境变量注入
// .env.production (不提交到 Git)
VITE_PROXY_URL=https://<your-proxy-domain>/deepseek-proxy
VITE_ACCESS_TOKEN=<构建时注入>

// services/config.js
const API_CONFIG = {
  PROXY_URL: '__PROXY_URL__',   // 构建时替换
  ACCESS_TOKEN: '__ACCESS_TOKEN__'  // 构建时替换
};
```

#### 6.2.2 Worker 层加固

```js
// worker/index.js — 优化版
export default {
  async fetch(request, env) {
    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Access-Token',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: '方法不允许' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 访问令牌验证
    const token = request.headers.get('X-Access-Token');
    if (token !== env.ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: '未授权访问' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // ===== 新增: 速率限制 =====
    const clientIP = request.headers.get('CF-Connecting-IP');
    const rateLimitKey = `rate:${clientIP}`;
    // 使用 Workers KV 或简单的内存计数
    // 每 IP 每分钟最多 30 次请求

    // ===== 新增: 输入长度限制 =====
    // 防止超长文本滥用 API

    try {
      const body = await request.json();

      // 内容长度校验
      const userContent = body.messages?.[body.messages.length - 1]?.content || '';
      if (userContent.length > 2000) {
        return new Response(JSON.stringify({ error: '内容过长' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: body.model || 'deepseek-v4-flash',
          messages: body.messages,
          max_tokens: Math.min(body.max_tokens || 1000, 2000),  // 上限 2000
          temperature: body.temperature ?? 0.7,
        }),
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: '代理请求失败', detail: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};
```

#### 6.2.3 前端输入校验

```js
// services/ai.js — 心理疏导场景的输入校验与对话管理
const MAX_INPUT_LENGTH = 500;

// 对话窗口策略（心理疏导需要长上下文）：
// - 50 轮以内：完整保留，不做任何裁剪
// - 超过 50 轮：用 AI 对前 30 轮生成摘要（~300字），保留后 20 轮完整内容
// - 摘要缓存在本地，同场景不重复生成
const MAX_FULL_HISTORY_ROUNDS = 50;   // 50 轮以内保留完整历史
const SUMMARY_TRIGGER = 30;            // 超过后压缩前 30 轮为摘要

function sanitizeInput(text) {
  // 去除控制字符
  return text.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

export async function analyzeDiary(content, emotion, intensity) {
  // 输入校验
  if (!content || content.trim().length === 0) {
    throw new Error('日记内容不能为空');
  }
  const sanitized = sanitizeInput(content).substring(0, MAX_INPUT_LENGTH);
  // ... 原有逻辑
}

export async function chatWithAI(message, scene = 'general', history = []) {
  const sanitized = sanitizeInput(message).substring(0, MAX_INPUT_LENGTH);

  const totalRounds = Math.floor(history.length / 2);

  if (totalRounds <= MAX_FULL_HISTORY_ROUNDS) {
    // 50 轮以内：完整保留，不截断
    const recentHistory = history;
    // ... 构建完整消息
  } else {
    // 超过 50 轮：对前 30 轮生成摘要，保留后续 20+ 轮完整对话
    const summary = await getOrCreateSummary(scene, history.slice(0, SUMMARY_TRIGGER * 2));
    const recent = history.slice(-(MAX_FULL_HISTORY_ROUNDS - SUMMARY_TRIGGER) * 2);
    // 用摘要替代早期消息，保证 AI 仍有上下文连贯性
  }
}
```

---

## 7. 代码架构重构

### 7.1 引入 Pinia 状态管理

当前各页面独立调用 `getDiaries()`，缺乏统一的数据流管理。

```
common/
├── stores/
│   ├── diary.js       # 日记状态
│   ├── chat.js        # 聊天状态
│   ├── user.js        # 用户设置状态
│   └── app.js         # 全局应用状态
```

```js
// common/stores/diary.js
import { defineStore } from 'pinia';
import { getDiaries, saveDiary, deleteDiary } from '@/common/utils/storage.js';

export const useDiaryStore = defineStore('diary', {
  state: () => ({
    diaries: [],
    loaded: false
  }),

  getters: {
    todayDiary: (state) => {
      const today = new Date().toISOString().split('T')[0];
      return state.diaries.find(d => d.date === today) || null;
    },
    diaryCount: (state) => state.diaries.length,
    emotionStats: (state) => {
      // 统计各情绪数量
      const stats = {};
      state.diaries.forEach(d => {
        stats[d.emotionId] = (stats[d.emotionId] || 0) + 1;
      });
      return stats;
    }
  },

  actions: {
    load() {
      this.diaries = getDiaries();
      this.loaded = true;
    },
    save(diary) {
      saveDiary(diary);
      this.load();  // 重新加载以保持一致性
    },
    remove(id) {
      deleteDiary(id);
      this.load();
    },
    getById(id) {
      return this.diaries.find(d => d.id === id);
    }
  }
});
```

### 7.2 常量文件拆分

```
common/constants/
├── index.js              # 统一导出
├── emotions.js           # EMOTIONS, QUICK_EMOTIONS, INTENSITY_LEVELS, getEmotionById
├── distortions.js        # COGNITIVE_DISTORTIONS
├── chat-scenes.js        # CHAT_SCENES
├── breathing.js          # BREATHING_PATTERNS
└── crisis.js             # CRISIS_KEYWORDS, detectCrisis()
```

### 7.3 新增服务模块

```
services/
├── ai.js                 # AI 客户端（重构后）
├── config.js             # API 配置（使用环境变量）
├── logger.js             # 错误日志收集
└── analytics.js          # 使用行为埋点（可选）
```

```js
// services/logger.js
const MAX_LOG_ENTRIES = 50;

export function logError(context, error) {
  try {
    const logs = uni.getStorageSync('_error_logs') || [];
    logs.push({
      context,
      message: error?.message || String(error),
      stack: error?.stack?.substring(0, 300),
      time: new Date().toISOString()
    });
    if (logs.length > MAX_LOG_ENTRIES) {
      logs.splice(0, logs.length - MAX_LOG_ENTRIES);
    }
    uni.setStorageSync('_error_logs', logs);
  } catch (e) {
    // 静默处理，避免日志收集本身导致崩溃
  }
}

export function getErrorLogs() {
  try {
    return uni.getStorageSync('_error_logs') || [];
  } catch {
    return [];
  }
}

export function clearErrorLogs() {
  uni.removeStorageSync('_error_logs');
}
```

---

## 8. AI 服务层优化

### 8.1 当前问题

- `callAI` 无超时控制
- `chatWithAI` 全量传递历史
- `analyzeDiary` JSON 解析失败只返回降级数据，无重试
- 无请求去重（用户快速点两次保存）

### 8.2 优化后的 AIClient

```js
// services/ai.js — 重构版
import API_CONFIG from './config.js';
import { logError } from './logger.js';

const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 15000;

// 心理疏导对话窗口策略：
// - ≤50 轮：完整保留全部历史
// - >50 轮：AI 摘要压缩前 30 轮，保留后 20+ 轮完整内容
const MAX_FULL_HISTORY_ROUNDS = 50;
const SUMMARY_TRIGGER_ROUNDS = 30;

// 请求去重
const _pendingRequests = new Map();

class AIClient {
  constructor() {
    this._summaryCache = new Map(); // 对话摘要缓存
  }

  async request(messages, options = {}) {
    const { timeout = REQUEST_TIMEOUT, retries = MAX_RETRIES } = options;

    // 去重 key
    const dedupeKey = JSON.stringify({ model: 'deepseek-v4-flash', messages });
    if (_pendingRequests.has(dedupeKey)) {
      return _pendingRequests.get(dedupeKey);
    }

    const promise = this._doRequest(messages, timeout, retries);
    _pendingRequests.set(dedupeKey, promise);

    try {
      return await promise;
    } finally {
      _pendingRequests.delete(dedupeKey);
    }
  }

  async _doRequest(messages, timeout, retriesLeft) {
    try {
      const response = await uni.request({
        url: API_CONFIG.PROXY_URL,
        method: 'POST',
        timeout,
        header: {
          'Content-Type': 'application/json',
          'X-Access-Token': API_CONFIG.ACCESS_TOKEN
        },
        data: {
          model: 'deepseek-v4-flash',
          messages,
          max_tokens: 1000,
          temperature: 0.7
        }
      });

      if (response.statusCode === 200) {
        return response.data.choices[0].message.content;
      }

      throw new Error(`API错误 (${response.statusCode})`);
    } catch (error) {
      if (retriesLeft > 0) {
        await new Promise(r => setTimeout(r, 1000)); // 等 1 秒重试
        return this._doRequest(messages, timeout, retriesLeft - 1);
      }
      throw error;
    }
  }

  async analyzeDiary(content, emotion, intensity) {
    const messages = [
      {
        role: 'system',
        content: '你是一位专业的心理健康助手。请以JSON格式回复。'
      },
      {
        role: 'user',
        content: `分析用户的情绪日记：\n情绪类型：${emotion}\n强度等级：${intensity}/10\n日记内容：${content}\n\n请从以下三个方面分析，用JSON格式返回，包含strengths、improvements、recommendations三个数组，每个数组2-3条建议。`
      }
    ];

    try {
      const result = await this.request(messages);
      return this._parseJSON(result);
    } catch (error) {
      logError('diary_analysis', error);
      return getFallbackDiaryAnalysis();
    }
  }

  async chat(message, scene, history) {
    const sceneContext = {
      'confused': '用户感到心里有些乱，说不清楚具体原因，需要温暖陪伴',
      'study': '用户关注学习压力、考试、作业相关话题',
      'relationship': '用户关注人际关系、朋友同学相处相关话题',
      'family': '用户关注家庭关系、父母沟通相关话题',
      'future': '用户关注未来规划、职业选择相关话题',
      'emotion': '用户关注情绪管理、情绪调节相关话题',
      'self_doubt': '用户关注自我怀疑、缺乏自信相关话题'
    };

    const systemPrompt = {
      role: 'system',
      content: `你是一位温暖、专业的AI心理助手。请：
1. 倾听并理解用户的感受
2. 给出温暖、支持性的回应
3. 提供实用的建议（但不能替代专业治疗）
4. 如果用户提到自残、自杀等危机内容，请引导他们寻求专业帮助

当前场景：${sceneContext[scene] || '用户有一般的心理困惑'}`
    };

    const totalRounds = Math.floor(history.length / 2);

    if (totalRounds <= MAX_FULL_HISTORY_ROUNDS) {
      // 50 轮以内：完整保留，不截断
      const messages = [systemPrompt];
      for (const msg of history) {
        messages.push({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.content
        });
      }
      messages.push({ role: 'user', content: message });
      return this.request(messages, { timeout: 20000 });
    }

    // 超过 50 轮：对前 30 轮生成摘要（缓存复用），保留最近 20+ 轮完整对话
    const earlyMessages = history.slice(0, SUMMARY_TRIGGER_ROUNDS * 2);
    const recentHistory = history.slice(-(MAX_FULL_HISTORY_ROUNDS - SUMMARY_TRIGGER_ROUNDS) * 2);

    // 获取或生成摘要（同场景缓存，不重复调用 AI）
    const summary = await this._getOrCreateSummary(scene, earlyMessages);

    const messages = [
      systemPrompt,
      { role: 'system', content: `[前序对话摘要，帮助你理解上下文] ${summary}` },
      ...recentHistory.map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    return this.request(messages, { timeout: 20000 });
  }

  // 摘要缓存：避免重复消耗 AI 调用
  async _getOrCreateSummary(sceneId, earlyMessages) {
    const cacheKey = `summary:${sceneId}:${earlyMessages.length}`;
    if (this._summaryCache.has(cacheKey)) {
      return this._summaryCache.get(cacheKey);
    }

    const summaryPrompt = [
      { role: 'system', content: '请用300字以内总结以下心理疏导对话的核心内容：用户的主要困扰、已探讨过的话题、AI给出的关键建议。只输出摘要文本。' },
      { role: 'user', content: earlyMessages.map(m => `${m.role === 'ai' ? 'AI' : '用户'}: ${m.content}`).join('\n') }
    ];

    try {
      const summary = await this.request(summaryPrompt, { timeout: 10000 });
      this._summaryCache.set(cacheKey, summary);
      return summary;
    } catch {
      // 摘要生成失败时降级：只传最近 50 轮，不做压缩
      return '（前序对话摘要暂时无法生成，但 AI 仍可根据最近对话理解你的情况）';
    }
  }

  _parseJSON(data) {
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
      return getFallbackDiaryAnalysis();
    }
  }
}

// 单例导出
export const aiClient = new AIClient();

// 保持向后兼容的导出
export const analyzeDiary = (...args) => aiClient.analyzeDiary(...args);
export const chatWithAI = (...args) => aiClient.chat(...args);
```

---

## 9. 组件与页面体验优化

### 9.1 CrisisModal 修复

```vue
<!-- components/CrisisModal.vue — 使用 CSS 变量 -->
<style scoped>
.crisis-modal {
  background-color: var(--card-bg);       /* 替代 #FAF7F2 */
  border-radius: 24px;
  padding: 32px 24px 24px;
  width: 100%;
  max-width: 340px;
  box-shadow: 0 8px 40px var(--shadow);
}

.modal-title {
  color: var(--text-primary);             /* 替代 #4A4A4A */
}

.modal-text {
  color: var(--text-primary);             /* 替代 #4A4A4A */
}

.modal-subtext {
  color: var(--text-secondary);           /* 替代 #9B9B9B */
}

.btn-cancel {
  background-color: var(--card-secondary-bg);  /* 替代 #F5E6D3 */
  color: var(--text-primary);                   /* 替代 #4A4A4A */
}

.btn-chat {
  background-color: var(--accent);        /* 替代 #9B7BB5 */
  color: var(--white);
}

.btn-hotline {
  border: 1px solid var(--accent);        /* 替代 #9B7BB5 */
  color: var(--accent);
}
</style>
```

### 9.2 呼吸练习定时器重构（状态机模式）

```js
// pages/regulation/index.vue — 消除三层嵌套 setInterval
const PHASE_CONFIG = {
  inhale:  { next: 'hold',  instruction: '吸气...', hint: '深吸气，保持腹部膨胀' },
  hold:    { next: 'exhale',instruction: '屏息...', hint: '保持气息，不要呼气' },
  exhale:  { next: 'inhale',instruction: '呼气...', hint: '缓慢呼出所有气息' }
};

export default {
  methods: {
    startBreathingCycle() {
      const pattern = this.currentPattern;
      let phase = 'inhale';
      let remaining = pattern.inhale;

      this.breathingPhase = phase;
      this.countdown = remaining;
      this.breathingInstruction = PHASE_CONFIG[phase].instruction;
      this.breathingHint = PHASE_CONFIG[phase].hint;

      this.phaseTimer = setInterval(() => {
        remaining--;
        this.countdown = remaining;

        if (remaining <= 0) {
          const config = PHASE_CONFIG[phase];
          phase = config.next;
          remaining = pattern[phase];
          this.triggerVibration();

          this.breathingPhase = phase;
          this.breathingInstruction = PHASE_CONFIG[phase].instruction;
          this.breathingHint = PHASE_CONFIG[phase].hint;
        }
      }, 1000);
    },

    stopExercise() {
      this.isExercising = false;
      if (this.exerciseTimer) {
        clearInterval(this.exerciseTimer);
        this.exerciseTimer = null;
      }
      if (this.phaseTimer) {
        clearInterval(this.phaseTimer);
        this.phaseTimer = null;
      }
    }
  }
};
```

### 9.3 情绪趋势图优化

```vue
<!-- pages/index/index.vue — 图表区域优化 -->
<template>
  <view class="trend-card card">
    <text class="section-title">近7天情绪趋势</text>
    <view class="trend-chart" v-if="weekTrend.length > 0">
      <!-- 使用 canvas 绑制精确图表，替代手写 CSS 折线 -->
      <canvas
        canvas-id="trendCanvas"
        id="trendCanvas"
        class="trend-canvas"
        @touchstart="onChartTouch"
      ></canvas>
    </view>
    <view class="empty-trend" v-else>
      <text class="text-secondary">暂无数据，开始记录你的情绪吧~</text>
    </view>
  </view>
</template>

<script>
export default {
  methods: {
    drawTrendChart() {
      // 使用 uni.createCanvasContext 绑制折线图
      // 正确处理断点（无数据时不连线）
      // 支持触摸交互查看具体数值
    }
  }
};
</script>
```

### 9.4 危机检测优化

```js
// common/constants/crisis.js — 智能检测
export function detectCrisis(text) {
  if (!text || text.trim().length === 0) return false;

  const lowerText = text.toLowerCase();

  // 排除否定语境（"我不想自杀" 不应触发）
  const negationPatterns = [
    /不(想|会|要|可能|打算).{0,3}(自杀|轻生|自残|死)/,
    /没有.{0,3}(自杀|轻生|自残)的(想法|念头|打算)/,
  ];
  if (negationPatterns.some(p => p.test(text))) {
    return false;
  }

  // 统计命中数，阈值 ≥ 2 才触发（减少误报）
  let matchCount = 0;
  for (const keyword of CRISIS_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      matchCount++;
      if (matchCount >= 2) return true;
    }
  }

  // 高危关键词（单次命中即触发）
  const HIGH_RISK_WORDS = ['自杀', '自残', '想死', '轻生', '割腕', '跳楼'];
  for (const word of HIGH_RISK_WORDS) {
    if (lowerText.includes(word)) return true;
  }

  return false;
}
```

---

## 10. 工程化提升

### 10.1 添加核心工具函数

```js
// common/utils/performance.js
export function debounce(fn, delay = 300) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function throttle(fn, interval = 200) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

// 批量数据更新辅助
export function batchUpdate(vm, updates) {
  // 在 Vue 3 中，同步多次赋值会被自动合并到同一个 nextTick
  // 此函数确保更新在下一个微任务中统一执行
  return new Promise(resolve => {
    Object.assign(vm, updates);
    vm.$nextTick(resolve);
  });
}
```

### 10.2 单元测试引入

```js
// tests/storage.test.js (Vitest)
import { describe, it, expect, beforeEach } from 'vitest';
import { getDiaries, saveDiary, deleteDiary, generateId } from '@/common/utils/storage.js';

describe('storage.js', () => {
  beforeEach(() => {
    // 清理测试数据
    uni.clearStorageSync();
  });

  it('getDiaries 应返回空数组当无数据时', () => {
    expect(getDiaries()).toEqual([]);
  });

  it('saveDiary 应正确保存日记', () => {
    const diary = { id: 'test-1', date: '2026-07-04', emotionId: 'happy', intensity: 7 };
    saveDiary(diary);
    expect(getDiaries()).toHaveLength(1);
    expect(getDiaries()[0].id).toBe('test-1');
  });

  it('generateId 应生成唯一 ID', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});
```

### 10.3 推荐的项目目录结构

```
├── App.vue
├── main.js
├── pages.json
├── manifest.json
├── uni.scss
├── index.html
├── .env.production            # 环境变量（不提交 Git）
├── .gitignore
├── package.json
├── vitest.config.js           # 测试配置
│
├── common/
│   ├── styles/
│   │   └── common.scss
│   ├── utils/
│   │   ├── storage.js         # 存储（含容量管理）
│   │   ├── date.js            # 日期
│   │   ├── network.js         # 网络检测
│   │   └── performance.js     # 防抖/节流/批量更新
│   ├── constants/
│   │   ├── index.js
│   │   ├── emotions.js
│   │   ├── distortions.js
│   │   ├── chat-scenes.js
│   │   ├── breathing.js
│   │   └── crisis.js
│   └── stores/
│       ├── diary.js           # Pinia store
│       ├── chat.js
│       ├── user.js
│       └── app.js
│
├── services/
│   ├── ai.js                  # AIClient 类
│   ├── config.js              # 环境变量注入的配置
│   └── logger.js              # 错误日志
│
├── components/
│   └── CrisisModal.vue
│
├── pages/
│   ├── index/                 # 基础包
│   ├── diary/                 # 分包
│   ├── chat/                  # 分包
│   ├── regulation/            # 分包
│   ├── user/                  # 分包
│   └── onboarding/            # 分包
│
├── static/
│   ├── tabs/
│   └── logo.png
│
├── worker/
│   ├── index.js               # CF Worker（含速率限制）
│   └── laf-proxy.js           # Sealaf 云函数
│
└── tests/
    ├── storage.test.js
    ├── date.test.js
    ├── crisis.test.js
    └── ai.test.js
```

---

## 11. 实施路线图

### 阶段一：安全保障（第 1 周）

```
□ Token 隐藏（环境变量 + 构建注入）
□ Worker 层添加速率限制
□ Worker 层添加输入长度校验
□ 前端添加 sanitizeInput
□ 移除不必要 Android 权限
```

### 阶段二：存储与稳定性（第 2 周）

```
□ Storage 容量管理（上限控制 + 自动清理）
□ 聊天对话管理（≤50 轮完整保留，超出智能摘要压缩）
□ 修复 CrisisModal 深色模式
□ 呼吸练习定时器状态机重构
□ AI 请求超时 + 重试机制
```

### 阶段三：性能优化（第 3 周）

```
□ 分包加载改造（pages.json + manifest.json）
□ 首页 data 最小化 + computed 优化
□ 各页面 data 与逻辑数据分离
□ main.js 冷启动预热
□ 添加 debounce/throttle 工具
```

### 阶段四：架构升级（第 4 周）

```
□ 引入 Pinia 状态管理
□ 常量文件拆分
□ AIClient 类重构
□ 添加 logger.js
□ CrisisModal 全面使用 CSS 变量
```

### 阶段五：工程化（持续）

```
□ 添加 Vitest 单元测试
□ 添加测试 CI 流水线
□ 性能埋点（FP/FCP/TTI）
□ 危机检测算法迭代
□ 图表升级为 canvas 绑制
```

---

## 附录：关键指标对照

| 指标 | 优化前 | 优化后目标 |
|------|--------|-----------|
| 冷启动时间 | 未测量 | < 1.5s |
| 首屏渲染 | 全量加载 | 仅基础包 |
| 存储用量 | 无控制 | < 8MB 预警线 |
| 聊天上下文 | 随对话线性增长，无限制 | ≤50 轮完整保留，超出智能摘要压缩 |
| 安全评级 | 🔴 Token 暴露 | 🟢 多层级防护 |
| 测试覆盖率 | 0% | 核心逻辑 > 60% |
| 分包数量 | 0（单包） | 5（1 基础 + 4 分包） |
