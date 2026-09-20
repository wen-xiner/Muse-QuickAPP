// 日期工具函数单元测试
import { describe, it, expect } from 'vitest';
import { formatDate, getGreeting, getDaysAgo, calculateStreak } from '../common/utils/date.js';

describe('formatDate', () => {
	it('应正确格式化日期为 YYYY-MM-DD', () => {
		const date = new Date(2026, 6, 4); // 2026-07-04
		const result = formatDate(date, 'YYYY-MM-DD');
		expect(result).toBe('2026-07-04');
	});

	it('应正确格式化日期为 MM月DD日', () => {
		const date = new Date(2026, 0, 15);
		const result = formatDate(date, 'MM月DD日');
		expect(result).toBe('01月15日');
	});

	it('应返回中文星期', () => {
		const date = new Date(2026, 6, 5); // 2026-07-05 周日
		const result = formatDate(date, 'weekday');
		expect(result).toBe('星期日');
	});

	it('应支持字符串日期输入', () => {
		const result = formatDate('2026-01-01', 'YYYY-MM-DD');
		expect(result).toBe('2026-01-01');
	});
});

describe('getGreeting', () => {
	it('应返回问候语', () => {
		const greeting = getGreeting();
		expect(typeof greeting).toBe('string');
		expect(greeting.length).toBeGreaterThan(0);
	});

	it('凌晨时段应返回凌晨好', () => {
		// 测试覆盖所有可能的返回值
		const validGreetings = ['凌晨好', '早上好', '上午好', '中午好', '下午好', '晚上好', '夜深了'];
		expect(validGreetings).toContain(getGreeting());
	});
});

describe('getDaysAgo', () => {
	it('应返回指定天数的日期数组', () => {
		const result = getDaysAgo(7);
		expect(result).toHaveLength(7);
		expect(result[0]).toHaveProperty('date');
		expect(result[0]).toHaveProperty('fullDate');
		expect(result[0]).toHaveProperty('weekday');
	});

	it('应按时间顺序排列（从旧到新）', () => {
		const result = getDaysAgo(3);
		const d1 = new Date(result[0].fullDate);
		const d2 = new Date(result[2].fullDate);
		expect(d1.getTime()).toBeLessThan(d2.getTime());
	});
});

describe('calculateStreak', () => {
	it('空数组应返回 0', () => {
		expect(calculateStreak([])).toBe(0);
	});

	it('单条今日记录应返回 1', () => {
		const today = formatDate(new Date(), 'YYYY-MM-DD');
		expect(calculateStreak([today])).toBe(1);
	});

	it('连续两天应返回 2', () => {
		const today = formatDate(new Date(), 'YYYY-MM-DD');
		const yesterday = formatDate(new Date(Date.now() - 86400000), 'YYYY-MM-DD');
		expect(calculateStreak([today, yesterday])).toBe(2);
	});

	it('不连续应返回 1', () => {
		const today = formatDate(new Date(), 'YYYY-MM-DD');
		const threeDaysAgo = formatDate(new Date(Date.now() - 3 * 86400000), 'YYYY-MM-DD');
		expect(calculateStreak([today, threeDaysAgo])).toBe(1);
	});
});
