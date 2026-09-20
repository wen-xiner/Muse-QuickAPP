// ===== 本地多账户管理 =====
// 所有数据在本地，不上传服务器，切换账户即切换 localStorage 命名空间
// 适用场景：同一设备多人共用 / 测试阶段多角色切换

const ACCOUNT_KEY = 'muse_current_account';
const ACCOUNT_LIST_KEY = 'muse_account_list';

/**
 * 获取当前登录账户 ID
 */
export function getCurrentAccountId() {
	return uni.getStorageSync(ACCOUNT_KEY) || 'default';
}

/**
 * 切换账户
 */
export function switchAccount(accountId) {
	uni.setStorageSync(ACCOUNT_KEY, accountId);
}

/**
 * 获取所有账户列表
 */
export function getAccountList() {
	try {
		const data = uni.getStorageSync(ACCOUNT_LIST_KEY);
		return data ? JSON.parse(data) : [];
	} catch {
		return [];
	}
}

/**
 * 创建新账户
 */
export function createAccount(name, avatar = '') {
	const list = getAccountList();
	const id = 'u_' + Date.now().toString(36);
	list.push({
		id,
		name: name || ('用户' + (list.length + 1)),
		avatar,
		createdAt: new Date().toISOString()
	});
	uni.setStorageSync(ACCOUNT_LIST_KEY, JSON.stringify(list));
	return list[list.length - 1];
}

/**
 * 删除账户（同时清空该账户所有数据）
 */
export function deleteAccount(accountId) {
	// 清空该账户的所有数据
	const currentId = getCurrentAccountId();
	const wasCurrent = currentId === accountId;

	// 切换到 default
	switchAccount('default');

	// 删除账户数据（如果当前正是这个账户）
	if (wasCurrent) {
		// 只清空该账户前缀的数据
		clearAccountData(accountId);
	}

	// 从列表移除
	const list = getAccountList().filter(a => a.id !== accountId);
	uni.setStorageSync(ACCOUNT_LIST_KEY, JSON.stringify(list));
}

/**
 * 清空指定账户的所有数据
 */
function clearAccountData(accountId) {
	const prefix = accountId + ':';
	const keysToRemove = [];
	// 获取所有存储 key（H5 环境）
	try {
		const info = uni.getStorageInfoSync();
		if (info.keys && Array.isArray(info.keys)) {
			info.keys.forEach(k => {
				if (k.startsWith(prefix)) keysToRemove.push(k);
			});
		}
	} catch (e) {
		// 降级：清空已知的 key
		const knownKeys = ['emotion_diaries', 'user_info', 'app_settings',
			'warning_records', 'has_onboarding', 'chat_sessions'];
		knownKeys.forEach(k => uni.removeStorageSync(prefix + k));
	}
	keysToRemove.forEach(k => uni.removeStorageSync(k));
}

/**
 * 获取存储时使用的 key 前缀（用于数据隔离）
 * 每个账户的数据使用独立前缀，如 "default:emotion_diaries"
 */
export function getStoragePrefix() {
	return getCurrentAccountId() + ':';
}
