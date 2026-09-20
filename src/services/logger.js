// 错误日志收集
// 本地记录最近 50 条错误日志，用于问题排查
const MAX_LOG_ENTRIES = 50;
const LOG_KEY = '_error_logs';

/**
 * 记录错误日志
 * @param {string} context - 错误发生位置
 * @param {Error|string} error - 错误对象或消息
 */
export function logError(context, error) {
	try {
		const logs = getLogs();
		logs.push({
			context,
			message: error?.message || String(error),
			stack: error?.stack?.substring(0, 300) || '',
			time: new Date().toISOString()
		});
		if (logs.length > MAX_LOG_ENTRIES) {
			logs.splice(0, logs.length - MAX_LOG_ENTRIES);
		}
		uni.setStorageSync(LOG_KEY, JSON.stringify(logs));
	} catch (e) {
		// 静默处理，避免日志收集本身导致崩溃
	}
}

/**
 * 获取所有错误日志
 */
export function getLogs() {
	try {
		const data = uni.getStorageSync(LOG_KEY);
		return data ? JSON.parse(data) : [];
	} catch {
		return [];
	}
}

/**
 * 清除所有错误日志
 */
export function clearLogs() {
	try {
		uni.removeStorageSync(LOG_KEY);
	} catch (e) {
		// 静默处理
	}
}

/**
 * 导出日志为文本（用于反馈或调试）
 */
export function exportLogs() {
	const logs = getLogs();
	if (logs.length === 0) return '暂无错误日志';

	return logs.map((l, i) =>
		`[${i + 1}] ${l.time}\n  上下文: ${l.context}\n  错误: ${l.message}\n  堆栈: ${l.stack}`
	).join('\n\n');
}
