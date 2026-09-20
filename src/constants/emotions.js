// 情绪类型定义
export const EMOTIONS = [
	{ id: 'happy', emoji: '😊', name: '开心', color: '#4CD964' },
	{ id: 'calm', emoji: '😌', name: '平静', color: '#9B7BB5' },
	{ id: 'sad', emoji: '😢', name: '难过', color: '#5AC8FA' },
	{ id: 'anxious', emoji: '😰', name: '焦虑', color: '#FF9500' },
	{ id: 'angry', emoji: '😠', name: '生气', color: '#FF3B30' },
	{ id: 'surprised', emoji: '😮', name: '惊讶', color: '#FFCC00' },
	{ id: 'fearful', emoji: '😨', name: '害怕', color: '#8E8E93' },
	{ id: 'disgusted', emoji: '🤢', name: '厌恶', color: '#AF52DE' }
];

// 首页快捷情绪（前 5 个）
export const QUICK_EMOTIONS = EMOTIONS.slice(0, 5);

// 情绪强度等级描述
export const INTENSITY_LEVELS = [
	{ value: 1, label: '1', description: '很轻微' },
	{ value: 2, label: '2', description: '较轻' },
	{ value: 3, label: '3', description: '轻微' },
	{ value: 4, label: '4', description: '中等偏下' },
	{ value: 5, label: '5', description: '中等' },
	{ value: 6, label: '6', description: '中等偏上' },
	{ value: 7, label: '7', description: '较强烈' },
	{ value: 8, label: '8', description: '很强烈' },
	{ value: 9, label: '9', description: '非常强烈' },
	{ value: 10, label: '10', description: '极强烈' }
];

/** 按 ID 获取情绪 */
export function getEmotionById(id) {
	return EMOTIONS.find(e => e.id === id) || EMOTIONS[0];
}
