/**
 * 优先级决策 — 预留 emotion / seasonal 扩展
 * 当前仅 manual 模式，未来扩展：
 *   emotion > seasonal > manual > default
 */

/**
 * @param {string} backgroundId — 手动选择的背景 ID
 * @param {string|null} emotionHint — 预留：情绪类型
 * @param {string|null} seasonalTag — 预留：节气标签
 * @returns {string} 最终背景 ID
 */
export function resolvePriority(backgroundId, emotionHint, seasonalTag) {
  // 预留逻辑：未来可在此处判断 emotionHint / seasonalTag 覆盖 backgroundId
  return backgroundId || '';
}
