/**
 * 响应式背景 Store — 唯一状态源
 * 单向数据流: UI → store → reactive update → UI
 * 支持每页独立背景：日记页 / 对话页
 *
 * 注意: 本模块不访问 DOM，所有 CSS 变量设置由 App.vue 负责
 */
import { reactive } from 'vue';
import { getSettings, saveSettings } from './storage.js';
import { BACKGROUNDS } from '../constants/backgrounds.js';
import { BACKGROUND_THEMES } from '../constants/backgroundThemes.js';

const state = reactive({
  diaryBackground: '',
  chatBackground: '',
  darkMode: false
});

function resolveBgValue(bgId, isDark) {
  if (!bgId) return '';
  const meta = BACKGROUNDS.find(b => b.id === bgId);
  if (!meta || !meta.resourceKey) return '';
  const theme = BACKGROUND_THEMES[meta.resourceKey];
  if (!theme) return '';
  return isDark ? theme.dark : theme.light;
}

export function useBackgroundStore() {
  return {
    state,

    refresh() {
      const s = getSettings();
      if (s) {
        state.diaryBackground = s.diaryBackground || '';
        state.chatBackground = s.chatBackground || '';
        state.darkMode = s.darkMode || false;
      }
    },

    setDiaryBackground(id) {
      state.diaryBackground = id || '';
      const s = getSettings();
      if (s) {
        s.diaryBackground = id || '';
        saveSettings(s);
      }
    },

    setChatBackground(id) {
      state.chatBackground = id || '';
      const s = getSettings();
      if (s) {
        s.chatBackground = id || '';
        saveSettings(s);
      }
    },

    getBgValue(bgId, isDark) {
      return resolveBgValue(bgId, isDark);
    },

    getBgStyle(bgId, isDark) {
      const val = resolveBgValue(bgId, isDark);
      if (!val) return { background: 'var(--bg)' };
      return val.startsWith('url(')
        ? { backgroundImage: val, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: val };
    },

    /** 获取所有需要设置的 CSS 变量映射 */
    getCssVarMap() {
      return {
        '--diary-bg-image': resolveBgValue(state.diaryBackground, state.darkMode),
        '--chat-bg-image': resolveBgValue(state.chatBackground, state.darkMode)
      };
    }
  };
}
