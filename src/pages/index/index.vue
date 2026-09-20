<template>
	<view class="page">
		<view class="header">
			<view class="greeting">
				<text class="greeting-text">{{ greeting }}</text>
				<text class="date-text">{{ todayDate }}</text>
			</view>
			<view class="streak" v-if="streak > 0">
				<text class="streak-fire">🔥</text>
				<text class="streak-text">{{ streak }}天</text>
			</view>
		</view>

		<view class="quick-record card">
			<view class="card-header flex-between">
				<text class="section-title">今日情绪</text>
				<text class="record-status text-secondary" :class="{ recorded: todayDiary }">
					{{ todayDiary ? '已记录' : '未记录' }}
				</text>
			</view>
			<view class="emotions-row">
				<view
					v-for="emotion in quickEmotions"
					:key="emotion.id"
					class="emotion-item"
					:class="{ selected: selectedEmotion === emotion.id }"
					@tap="selectEmotion(emotion)"
				>
					<text class="emotion-emoji">{{ emotion.emoji }}</text>
					<text class="emotion-name">{{ emotion.name }}</text>
				</view>
			</view>
			<view class="intensity-section" v-if="selectedEmotion">
				<text class="intensity-label">情绪强度: {{ intensity }}/10</text>
				<slider
					class="intensity-slider"
					:value="intensity"
					min="1"
					max="10"
					activeColor="#9B7BB5"
					@change="onIntensityChange"
				/>
			</view>
			<button class="btn-primary record-btn" @tap="quickSave" v-if="selectedEmotion && !todayDiary">
				快速记录
			</button>
			<view class="recorded-actions" v-if="todayDiary">
				<button class="btn-primary record-btn" @tap="goToEdit">
					编辑详情
				</button>
			</view>
		</view>

		<view class="stats-row">
			<view class="stat-card card">
				<text class="stat-label text-secondary">本周平均</text>
				<text class="stat-value text-primary">{{ weeklyAverage || '--' }}</text>
				<text class="stat-unit">分</text>
			</view>
			<view class="stat-card card">
				<text class="stat-label text-secondary">日记总数</text>
				<text class="stat-value text-primary">{{ totalDiaries }}</text>
				<text class="stat-unit">篇</text>
			</view>
		</view>

		<view class="trend-card card">
			<text class="section-title">近7天情绪趋势</text>
			<view class="trend-chart" v-if="weekTrend.length > 0">
				<view class="chart-y-axis">
					<text>10</text>
					<text>7.5</text>
					<text>5</text>
					<text>2.5</text>
					<text>0</text>
				</view>
				<view class="chart-content">
					<view class="chart-line">
						<view
							v-for="(point, index) in weekTrend"
							:key="index"
							class="chart-point"
							:class="{ empty: !point.value }"
							:style="{ left: (index * 14.28) + '%', bottom: (point.value || 0) * 10 + '%' }"
						>
							<view class="point-dot" v-if="point.value"></view>
							<view class="point-line" v-if="index < weekTrend.length - 1 && point.value && weekTrend[index + 1].value"></view>
						</view>
					</view>
					<view class="chart-x-axis">
						<text v-for="(point, index) in weekTrend" :key="index">{{ point.date }}</text>
					</view>
				</view>
			</view>
			<view class="empty-trend" v-else>
				<text class="text-secondary">暂无数据，开始记录你的情绪吧~</text>
			</view>
		</view>

		<view class="tip-section" v-if="!todayDiary">
			<text class="tip-icon">💡</text>
			<text class="tip-text">今天还没记录情绪哦</text>
		</view>

		<!-- 深夜关怀提示 -->
		<view class="night-reminder card" v-if="nightReminder" @tap="dismissNightReminder">
			<view class="night-header">
				<text class="night-title">{{ nightReminder.title }}</text>
				<text class="night-close">✕</text>
			</view>
			<text class="night-text">{{ nightReminder.subtitle }}</text>
		</view>
	</view>
</template>

<script>
import { getGreeting, getNightGreeting, formatDate, getDaysAgo, calculateStreak } from '../../common/utils/date.js';
import { getDiaries, saveDiary, generateId, shouldShowNightReminder, markNightReminderShown } from '../../common/utils/storage.js';
import { QUICK_EMOTIONS } from '../../common/constants/emotions.js';

export default {
	data() {
		return {
			// 仅渲染相关数据放在 data 中
			greeting: '',
			todayDate: '',
			streak: 0,
			quickEmotions: QUICK_EMOTIONS,
			selectedEmotion: '',
			intensity: 5,
			todayDiary: null,
			totalDiaries: 0,
			weekTrend: [],
				nightReminder: null
		};
	},
	computed: {
		// weeklyAverage 改为 computed，自动缓存，无需在 loadData 中手动计算
		weeklyAverage() {
			const valid = this.weekTrend.filter(p => p.value).map(p => p.value);
			if (valid.length === 0) return 0;
			return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
		}
	},
	created() {
		// 非渲染数据挂实例，不触发视图更新
		this._lastRefresh = 0;
	},
	onShow() {
		// 30 秒内不重复刷新
		const now = Date.now();
		if (this._lastRefresh && (now - this._lastRefresh) < 30000) return;
		this._lastRefresh = now;
		this.refreshDashboard();
	},
	methods: {
		refreshDashboard() {
			// 批量计算所有数据，一次性赋值（减少 setData 通信次数）
			const diaries = getDiaries();
			const today = formatDate(new Date(), 'YYYY-MM-DD');
			const todayDiary = diaries.find(d => d.date === today) || null;
			const weekDays = getDaysAgo(7);
			const weekTrend = weekDays.map(day => ({
				date: day.date,
				value: (diaries.find(d => d.date === day.fullDate) || {}).intensity || null
			}));

			// 一次性批量赋值
			// 深夜提醒（每天仅一次）
			const nightGreeting = getNightGreeting();
			const showNight = nightGreeting && shouldShowNightReminder();

			Object.assign(this, {
				greeting: getGreeting(),
				todayDate: formatDate(new Date(), 'MM月DD日') + ' ' + formatDate(new Date(), 'weekday'),
				totalDiaries: diaries.length,
				streak: calculateStreak(diaries.map(d => d.date)),
				todayDiary,
				selectedEmotion: todayDiary ? todayDiary.emotionId : '',
				intensity: todayDiary ? todayDiary.intensity : 5,
				weekTrend,
				nightReminder: showNight ? nightGreeting : null
			});
		},
		selectEmotion(emotion) {
			this.selectedEmotion = emotion.id;
		},
		onIntensityChange(e) {
			this.intensity = e.detail.value;
		},
		quickSave() {
			const today = formatDate(new Date(), 'YYYY-MM-DD');
			const diary = {
				id: generateId(),
				date: today,
				emotionId: this.selectedEmotion,
				intensity: this.intensity,
				event: '',
				cognitiveDistortion: '',
				enableAI: false,
				analyzed: false,
				analyzedAt: null,
				aiResult: null
			};
			saveDiary(diary);
			uni.showToast({ title: '记录成功', icon: 'success' });
			this._lastRefresh = 0; // 强制下次刷新
			this.refreshDashboard();
		},
				dismissNightReminder() {
			this.nightReminder = null;
			markNightReminderShown();
		},
		goToEdit() {
			uni.navigateTo({
				url: `/pages/diary/edit?id=${this.todayDiary.id}`
			});
		}
	}
};
</script>

<style scoped>
.page {
	background-color: var(--bg);
	min-height: 100vh;
	padding: 16px;
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
}

.greeting-text {
	font-size: 24px;
	font-weight: 600;
	color: var(--text-primary);
	display: block;
}

.date-text {
	font-size: 14px;
	color: var(--text-secondary);
	margin-top: 4px;
	display: block;
}

.streak {
	display: flex;
	align-items: center;
	background-color: var(--card-secondary-bg);
	padding: 8px 12px;
	border-radius: 16px;
}

.streak-fire {
	font-size: 18px;
}

.streak-text {
	font-size: 14px;
	color: var(--text-primary);
	margin-left: 4px;
}

.quick-record {
	padding: 20px;
}

.card-header {
	margin-bottom: 16px;
}

.record-status {
	font-size: 12px;
}

.record-status.recorded {
	color: var(--success);
}

.emotions-row {
	display: flex;
	justify-content: space-between;
	margin-bottom: 20px;
}

.emotion-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 12px;
	border-radius: 12px;
	transition: all 0.3s;
}

.emotion-item.selected {
	background-color: var(--card-secondary-bg);
}

.emotion-emoji {
	font-size: 32px;
	margin-bottom: 4px;
}

.emotion-name {
	font-size: 12px;
	color: var(--text-primary);
}

.intensity-section {
	margin-bottom: 16px;
}

.intensity-label {
	font-size: 14px;
	color: var(--text-primary);
	margin-bottom: 8px;
	display: block;
}

.intensity-slider {
	margin: 0 8px;
}

.record-btn {
	margin-top: 8px;
}

.stats-row {
	display: flex;
	gap: 12px;
	margin-bottom: 16px;
}

.stat-card {
	flex: 1;
	text-align: center;
	padding: 16px;
}

.stat-label {
	font-size: 12px;
	display: block;
	margin-bottom: 8px;
}

.stat-value {
	font-size: 28px;
	font-weight: 600;
}

.stat-unit {
	font-size: 12px;
	color: var(--text-secondary);
}

.trend-card {
	padding: 20px;
	overflow: visible;
}

.trend-chart {
	display: flex;
	height: 160px;
	margin-top: 12px;
	padding-bottom: 28px;
}

.chart-y-axis {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	font-size: 10px;
	color: var(--text-secondary);
	padding-right: 8px;
	text-align: right;
	width: 30px;
}

.chart-content {
	flex: 1;
	position: relative;
	border-left: 1px solid var(--bar-bg);
	border-bottom: 1px solid var(--bar-bg);
}

.chart-line {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	top: 0;
}

.chart-point {
	position: absolute;
	transform: translateX(-50%);
}

.point-dot {
	width: 10px;
	height: 10px;
	background-color: var(--accent);
	border-radius: 50%;
}

.chart-point.empty {
	visibility: hidden;
}

.point-line {
	position: absolute;
	height: 2px;
	background-color: var(--accent);
	width: 14.28%;
	left: 50%;
	top: 50%;
	transform: translateY(-50%);
}

.chart-x-axis {
	position: absolute;
	left: 0;
	right: 0;
	bottom: -24px;
	display: flex;
	justify-content: space-between;
	font-size: 10px;
	color: var(--text-secondary);
}

.empty-trend {
	height: 120px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.tip-section {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 16px;
	background-color: var(--card-secondary-bg);
	border-radius: 16px;
	margin-top: 16px;
}

.tip-icon {
	margin-right: 8px;
}

.tip-text {
	font-size: 14px;
	color: var(--text-primary);
}

/* 深夜关怀 */
.night-reminder {
	padding: 16px;
	background: linear-gradient(135deg, #2A2A42, #1E1E32);
	border-radius: 16px;
	margin-top: 16px;
}
.night-header {
	display: flex; justify-content: space-between; align-items: center;
	margin-bottom: 8px;
}
.night-title { font-size: 16px; font-weight: 600; color: #E8D5F5; }
.night-close { font-size: 16px; color: #8E8EA0; padding: 4px 8px; }
.night-text { font-size: 13px; color: #B8B8CC; line-height: 1.6; }
</style>
