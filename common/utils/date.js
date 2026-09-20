export function formatDate(date, format = 'YYYY-MM-DD') {
	if (!(date instanceof Date)) {
		date = new Date(date);
	}
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
	const weekDay = weekDays[date.getDay()];
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');

	const formatMap = {
		'YYYY': year,
		'MM': month,
		'DD': day,
		'HH:mm': `${hours}:${minutes}`,
		'weekday': weekDay
	};

	let result = format;
	for (const [key, value] of Object.entries(formatMap)) {
		result = result.replace(key, value);
	}
	return result;
}

export function getGreeting() {
	const hour = new Date().getHours();
	if (hour < 6) return '夜深了';
	if (hour < 9) return '早上好';
	if (hour < 12) return '上午好';
	if (hour < 14) return '中午好';
	if (hour < 18) return '下午好';
	if (hour < 22) return '晚上好';
	return '夜深了';
}

/**
 * 深夜关怀问候（比 getGreeting 更温暖）
 * 根据具体时段返回不同的关怀语
 */
export function getNightGreeting() {
	const hour = new Date().getHours();
	if (hour >= 0 && hour < 3) {
		return { title: '🌙 凌晨了', subtitle: '已经凌晨了，你的身体需要休息。明天醒来，一切都会好一点。' };
	}
	if (hour >= 3 && hour < 5) {
		return { title: '🌙 快要天亮了', subtitle: '如果你还没睡，是不是心里有事放不下？写下来，然后闭上眼睛休息一会儿吧。' };
	}
	if (hour >= 5 && hour < 7) {
		return { title: '🌅 天快亮了', subtitle: '新的一天即将开始。如果一夜没睡，别忘了白天给自己一个喘息的机会。' };
	}
	if (hour >= 22 && hour < 24) {
		return { title: '🌙 夜深了', subtitle: '忙碌了一天，记得给自己一点放松的时间。' };
	}
	return null; // 白天不触发
}

/**
 * 是否深夜时段（需要关怀的时间）
 */
export function isLateNight() {
	const hour = new Date().getHours();
	return hour >= 23 || hour <= 5;
}

export function getDaysAgo(days) {
	const result = [];
	for (let i = days - 1; i >= 0; i--) {
		const date = new Date();
		date.setDate(date.getDate() - i);
		result.push({
			date: formatDate(date, 'MM/DD'),
			fullDate: formatDate(date, 'YYYY-MM-DD'),
			weekday: formatDate(date, 'weekday')
		});
	}
	return result;
}

export function calculateStreak(dates) {
	if (!dates || dates.length === 0) return 0;
	const sortedDates = [...dates].sort((a, b) => new Date(b) - new Date(a));
	const today = formatDate(new Date(), 'YYYY-MM-DD');
	const yesterday = formatDate(new Date(Date.now() - 86400000), 'YYYY-MM-DD');
	if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0;

	let streak = 1;
	for (let i = 1; i < sortedDates.length; i++) {
		const current = new Date(sortedDates[i - 1]);
		const prev = new Date(sortedDates[i]);
		const diffDays = Math.floor((current - prev) / 86400000);
		if (diffDays === 1) {
			streak++;
		} else {
			break;
		}
	}
	return streak;
}
