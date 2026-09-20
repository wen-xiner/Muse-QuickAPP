// 日记状态管理（基于 Vue 3 reactive）
// 统一日记数据流，消除各页面独立调用 getDiaries() 的散乱
import { reactive } from 'vue';
import {
	getDiaries, saveDiary, deleteDiary, getDiaryById,
	checkStorageQuota
} from '../utils/storage.js';
import { formatDate } from '../utils/date.js';

class DiaryStore {
	constructor() {
		this.state = reactive({
			diaries: [],
			loaded: false
		});
	}

	get diaries() { return this.state.diaries; }
	get loaded() { return this.state.loaded; }

	/** 总篇数 */
	get count() {
		return this.state.diaries.length;
	}

	/** 今日日记 */
	get todayDiary() {
		const today = formatDate(new Date(), 'YYYY-MM-DD');
		return this.state.diaries.find(d => d.date === today) || null;
	}

	/** 是否已记录今日 */
	get hasRecordedToday() {
		return !!this.todayDiary;
	}

	/** 各情绪统计 */
	get emotionStats() {
		const stats = {};
		this.state.diaries.forEach(d => {
			stats[d.emotionId] = (stats[d.emotionId] || 0) + 1;
		});
		return stats;
	}

	/** 加载全部日记 */
	load() {
		this.state.diaries = getDiaries();
		this.state.loaded = true;
	}

	/** 保存日记 */
	save(diary) {
		saveDiary(diary);
		this.load();
	}

	/** 删除日记 */
	remove(id) {
		deleteDiary(id);
		this.load();
	}

	/** 按 ID 获取 */
	getById(id) {
		return getDiaryById(id);
	}

	/** 检查存储状态 */
	checkQuota() {
		return checkStorageQuota();
	}
}

// 单例导出
export const diaryStore = new DiaryStore();
