/**
 * 背景层决策 — async interface 预留
 * 当前同步实现，未来支持网络图片/远程资源
 */
import { BACKGROUNDS } from '../constants/backgrounds.js';
import { BACKGROUND_THEMES } from '../constants/backgroundThemes.js';

/**
 * @param {string} backgroundId
 * @param {'light'|'dark'} themeMode
 * @returns {Promise<Object>} style 对象
 */
export function resolveBackground(backgroundId, themeMode) {
  if (!backgroundId) return { background: 'var(--bg)' };

  const bg = BACKGROUNDS.find(b => b.id === backgroundId);
  if (!bg) return {};

  const themes = BACKGROUND_THEMES[bg.resourceKey];
  if (!themes) return {};

  const val = themeMode === 'dark' ? themes.dark : themes.light;

  return val.startsWith('url(')
    ? { backgroundImage: val }
    : { background: val };
}
