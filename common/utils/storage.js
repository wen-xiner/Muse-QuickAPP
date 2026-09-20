// ===== 本地存储（多账户隔离）=====
// 每个账户的数据前缀隔离，切换账户 = 切换数据空间
import { getStoragePrefix } from './account.js';

function pk(key) { return getStoragePrefix() + key; }
function g(k) { try { const v = uni.getStorageSync(pk(k)); return v || ''; } catch { return ''; } }
function s(k, v) { uni.setStorageSync(pk(k), v); }
function r(k) { uni.removeStorageSync(pk(k)); }
function gi() {
	try {
		const info = uni.getStorageInfoSync();
		const prefix = getStoragePrefix();
		let size = 0, count = 0;
		if (info.keys && Array.isArray(info.keys)) {
			info.keys.forEach(k => { if (k.startsWith(prefix)) { size += (uni.getStorageSync(k) || '').length * 2; count++; } });
		}
		return { currentSize: size, keys: Array(count), limitSize: 10 * 1024 * 1024 };
	} catch { return { currentSize: 0, keys: [], limitSize: 10 * 1024 * 1024 }; }
}

// ===== 存储键 =====
const K = {
	DIARIES: 'emotion_diaries',
	USER_INFO: 'user_info',
	SETTINGS: 'app_settings',
	WARNING_RECORDS: 'warning_records',
	ONBOARDING: 'has_onboarding',
	CHAT_SESSIONS: 'chat_sessions'
};

// ===== 容量控制 =====
const MAX_DIARIES = 300;
const MAX_WARNING_RECORDS = 50;
const MAX_CHAT_MESSAGES = 100;
const STORAGE_WARN_BYTES = 8 * 1024 * 1024;

let _idCounter = 0;
export function generateId() { _idCounter++; return `${Date.now().toString(36)}-${_idCounter.toString(36)}-${Math.random().toString(36).substr(2, 6)}`; }

export function checkStorageQuota() {
	try {
		const info = gi();
		if (info.currentSize > STORAGE_WARN_BYTES) {
			console.warn(`[Storage] 空间告警: ${(info.currentSize / 1024 / 1024).toFixed(1)}MB / 10MB`);
			pruneOldRecords();
			return false;
		}
		return true;
	} catch { return true; }
}

function pruneOldRecords() {
	try {
		const diaries = getDiaries();
		const threeMonthsAgo = Date.now() - 90 * 24 * 3600 * 1000;
		const recent = diaries.filter(d => new Date(d.date).getTime() > threeMonthsAgo);
		if (recent.length < diaries.length) {
			console.log(`[Storage] 自动清理 ${diaries.length - recent.length} 条旧日记`);
			s(K.DIARIES, JSON.stringify(recent));
		}
	} catch {}
}

// ===== 日记 =====
export function getDiaries() {
	try { const d = g(K.DIARIES); return d ? JSON.parse(d) : []; } catch { return []; }
}
export function saveDiary(diary) {
	const diaries = getDiaries();
	const idx = diaries.findIndex(d => d.id === diary.id);
	if (idx >= 0) diaries[idx] = diary; else diaries.unshift(diary);
	if (diaries.length > MAX_DIARIES) diaries.length = MAX_DIARIES;
	s(K.DIARIES, JSON.stringify(diaries));
	checkStorageQuota();
	return diary;
}
export function getDiaryById(id) { return getDiaries().find(d => d.id === id) || null; }
export function deleteDiary(id) {
	s(K.DIARIES, JSON.stringify(getDiaries().filter(d => d.id !== id)));
}

// ===== 用户信息 =====
export function getUserInfo() { try { const d = g(K.USER_INFO); return d ? JSON.parse(d) : { nickname: '用户', avatar: '' }; } catch { return { nickname: '用户', avatar: '' }; } }
export function saveUserInfo(info) { s(K.USER_INFO, JSON.stringify(info)); }

// ===== 设置 =====
const DEFAULT_SETTINGS = { autoWarning: true, voiceGuide: true, vibration: true, backgroundMusic: false, darkMode: false, backgroundTheme: '' };
export function getSettings() { try { const d = g(K.SETTINGS); return d ? JSON.parse(d) : { ...DEFAULT_SETTINGS }; } catch { return { ...DEFAULT_SETTINGS }; } }
export function saveSettings(settings) { s(K.SETTINGS, JSON.stringify(settings)); }

// ===== 预警记录 =====
export function getWarningRecords() { try { const d = g(K.WARNING_RECORDS); return d ? JSON.parse(d) : []; } catch { return []; } }
export function addWarningRecord(record) {
	const records = getWarningRecords();
	records.unshift({ ...record, id: Date.now(), time: new Date().toISOString() });
	if (records.length > MAX_WARNING_RECORDS) records.length = MAX_WARNING_RECORDS;
	s(K.WARNING_RECORDS, JSON.stringify(records));
	return records;
}

// ===== 深夜提醒 =====
export function shouldShowNightReminder() {
	const today = new Date().toISOString().split('T')[0];
	return g('night_reminder_date') !== today;
}
export function markNightReminderShown() {
	s('night_reminder_date', new Date().toISOString().split('T')[0]);
}

// ===== 引导页 =====
export function hasCompletedOnboarding() {
	const v = g(K.ONBOARDING);
	return v === 'true' || v === true;
}
export function setOnboardingCompleted() { s(K.ONBOARDING, true); }

// ===== 聊天 =====
export function getChatHistory(sceneId) {
	try {
		const key = `chat_history:${sceneId}`;
		const d = g(key);
		return d ? JSON.parse(d) : { messages: [], history: [] };
	} catch { return { messages: [], history: [] }; }
}
export function saveChatHistory(sceneId, data) {
	const key = `chat_history:${sceneId}`;
	const messages = data.messages.slice(-MAX_CHAT_MESSAGES);
	const history = data.history.slice(-MAX_CHAT_MESSAGES * 2);
	s(key, JSON.stringify({ messages, history, updatedAt: new Date().toISOString() }));
	let sessions = getChatSessions();
	const existing = sessions.find(x => x.id === sceneId);
	if (existing) { existing.title = data.title || existing.title; existing.updatedAt = new Date().toISOString(); }
	else { sessions.unshift({ id: sceneId, title: data.title || '', updatedAt: new Date().toISOString() }); }
	s(K.CHAT_SESSIONS, JSON.stringify(sessions));
	checkStorageQuota();
}
export function getChatSessions() { try { const d = g(K.CHAT_SESSIONS); return d ? JSON.parse(d) : []; } catch { return []; } }
export function clearChatHistory(sceneId) {
	r(`chat_history:${sceneId}`);
	s(K.CHAT_SESSIONS, JSON.stringify(getChatSessions().filter(x => x.id !== sceneId)));
}

// ===== 多账户数据清除（切换/删除账户时用）=====
export function clearAllAccountData() {
	const prefix = getStoragePrefix();
	try {
		const info = uni.getStorageInfoSync();
		if (info.keys && Array.isArray(info.keys)) {
			info.keys.forEach(k => { if (k.startsWith(prefix)) uni.removeStorageSync(k); });
		}
	} catch {}
	// 兜底清除已知 key
	Object.values(K).forEach(k => r(k));
	r('night_reminder_date');
	r('_error_logs');
	r('_user_feedbacks');
}
