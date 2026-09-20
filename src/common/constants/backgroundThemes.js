/**
 * 背景视觉资源 — CSS 渐变值 / 图片路径
 * key 与 backgrounds.js 中 resourceKey 一一对应
 * 每个 resource 包含 light / dark 双版本
 */
export const BACKGROUND_THEMES = {
  // 自然系-晨雾森林（图片）
  mistForest: {
    light: 'url(/static/backgrounds/自然系-晨雾森林-亮色版.webp)',
    dark:  'url(/static/backgrounds/自然系-晨雾森林-暗色版.webp)'
  },
  // 自然系-海波纹（图片）
  oceanWave: {
    light: 'url(/static/backgrounds/自然系-海波纹-亮色版.webp)',
    dark:  'url(/static/backgrounds/自然系-海波纹-暗色版.webp)'
  },
  // 抽象系-水彩晕染（CSS 渐变）
  watercolor: {
    light: 'linear-gradient(180deg, #F3E5F5 0%, #FCE4EC 50%, #FFF8E1 100%)',
    dark:  'linear-gradient(180deg, #2A1A30 0%, #2A1A28 50%, #1A1A20 100%)'
  },
  // 抽象系-薄暮渐变（CSS 渐变）
  sunset: {
    light: 'linear-gradient(135deg, #FFF3E0 0%, #F3E5F5 50%, #E8EAF6 100%)',
    dark:  'linear-gradient(135deg, #2A1A10 0%, #2A1A20 50%, #1A1A2A 100%)'
  },
  // 陪伴系-星月夜（图片）
  starry: {
    light: 'url(/static/backgrounds/starry-light.webp)',
    dark:  'url(/static/backgrounds/starry-dark.webp)'
  },
  // 陪伴系-猫与窗台（图片）
  cat: {
    light: 'url(/static/backgrounds/cat-light.webp)',
    dark:  'url(/static/backgrounds/cat-dark.webp)'
  }
};
