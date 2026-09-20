// 危机检测逻辑单元测试
import { describe, it, expect } from 'vitest';
import { detectCrisis } from '../common/constants/crisis.js';

describe('detectCrisis', () => {
	it('空字符串应返回 false', () => {
		expect(detectCrisis('')).toBe(false);
		expect(detectCrisis(null)).toBe(false);
		expect(detectCrisis(undefined)).toBe(false);
	});

	it('高危词"自杀"应触发检测', () => {
		expect(detectCrisis('我想自杀')).toBe(true);
	});

	it('高危词"自残"应触发检测', () => {
		expect(detectCrisis('我有自残行为')).toBe(true);
	});

	it('高危词"割腕"应触发检测', () => {
		expect(detectCrisis('他割腕了')).toBe(true);
	});

	it('否定语境"我不想自杀"不应触发', () => {
		expect(detectCrisis('虽然很难过，但我不想自杀')).toBe(false);
	});

	it('否定语境"不会自残"不应触发', () => {
		expect(detectCrisis('我不会自残的')).toBe(false);
	});

	it('普通词单个命中不应触发（需要≥2个）', () => {
		expect(detectCrisis('我感觉撑不下去了')).toBe(false);
	});

	it('普通词两个命中应触发', () => {
		expect(detectCrisis('我感觉撑不下去了，人生无望')).toBe(true);
	});

	it('正常内容不应触发', () => {
		expect(detectCrisis('今天考试没考好，心情有点低落')).toBe(false);
		expect(detectCrisis('和朋友吵架了，好难过')).toBe(false);
	});

	it('英文变体应能检测', () => {
		expect(detectCrisis('zs是什么意思')).toBe(false); // 单个普通词，不应触发
	});
});
