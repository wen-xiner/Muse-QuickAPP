/**
 * 遮罩 JS 单一决策源
 * CSS 仅提供 fallback 变量，不参与逻辑
 */

const OVERLAY_MAP = {
  soft:   { light: 'rgba(255,255,255,0.3)', dark: 'rgba(0,0,0,0.45)' },
  medium: { light: 'rgba(255,255,255,0.5)', dark: 'rgba(0,0,0,0.6)' },
  strong: { light: 'rgba(255,255,255,0.7)', dark: 'rgba(0,0,0,0.75)' }
};

export const OVERLAY_LEVELS = { soft: 'soft', medium: 'medium', strong: 'strong' };

export function resolveOverlay(themeMode, level = 'soft') {
  const colors = OVERLAY_MAP[level] || OVERLAY_MAP.soft;
  return { background: colors[themeMode] || colors.light };
}
