<template>
	<view class="page">
		<view class="header-bar">
			<text class="header-title">我的日记</text>
			<view class="add-btn" @tap="goToEdit">
				<text class="add-icon">+</text>
			</view>
		</view>

		<view class="search-bar card">
			<text class="search-icon">🔍</text>
			<input
				class="search-input"
				v-model="searchQuery"
				placeholder="搜索日记内容..."
				confirm-type="search"
			/>
			<text class="search-clear" v-if="searchQuery" @tap="searchQuery = ''">✕</text>
		</view>

		<view class="filter-bar">
			<scroll-view class="filter-scroll" scroll-x show-scrollbar="false">
				<view
					class="filter-chip"
					:class="{ active: activeEmotion === '' }"
					@tap="activeEmotion = ''"
				>
					全部
				</view>
				<view
					v-for="emotion in emotions"
					:key="emotion.id"
					class="filter-chip"
					:class="{ active: activeEmotion === emotion.id }"
					@tap="activeEmotion = emotion.id"
				>
					<text>{{ emotion.emoji }}</text>
					<text class="chip-label">{{ emotion.name }}</text>
				</view>
			</scroll-view>
		</view>

		<view class="filter-summary" v-if="searchQuery || activeEmotion">
			<text class="summary-text">
				共 {{ filteredDiaries.length }} 条结果
			</text>
			<text class="summary-clear" @tap="clearFilters">清除筛选</text>
		</view>

		<view class="diary-list" v-if="filteredDiaries.length > 0">
			<view
				v-for="diary in filteredDiaries"
				:key="diary.id"
				class="diary-card card"
				@tap="goToDetail(diary.id)"
			>
				<view class="diary-header">
					<text class="diary-date">{{ formatDate(diary.date) }}</text>
					<view class="diary-tag" v-if="diary.cognitiveDistortion">
						<text class="tag-text">认知偏差</text>
					</view>
				</view>
				<view class="diary-content">
					<view class="emotion-info">
						<text class="emotion-emoji">{{ getEmotionEmoji(diary.emotionId) }}</text>
						<text class="emotion-name">{{ getEmotionName(diary.emotionId) }}</text>
					</view>
					<view class="intensity-bar">
						<text class="intensity-label">强度</text>
						<view class="bar-track">
							<view class="bar-fill" :style="{ width: (diary.intensity * 10) + '%' }"></view>
						</view>
						<text class="intensity-value">{{ diary.intensity }}/10</text>
					</view>
				</view>
				<view class="diary-preview" v-if="diary.event">
					<text class="preview-text">{{ diary.event }}</text>
				</view>
				<view class="diary-footer" v-if="diary.analyzed">
					<text class="ai-tag">🤖 AI已分析</text>
					<text class="analyze-time">{{ formatTime(diary.analyzedAt) }}</text>
				</view>
			</view>
		</view>

		<view class="empty-state" v-else>
			<text class="empty-icon">📝</text>
			<text class="empty-text">{{ diaries.length === 0 ? '还没有日记' : '没有匹配的日记' }}</text>
			<text class="empty-hint">{{ diaries.length === 0 ? '记录你的第一篇情绪日记吧' : '试试其他关键词或筛选条件' }}</text>
			<button class="btn-primary" v-if="diaries.length === 0" @tap="goToEdit">开始记录</button>
		</view>
	</view>
</template>

<script>
import { formatDate as formatDateUtil } from '../../common/utils/date.js';
import { getDiaries } from '../../common/utils/storage.js';
import { EMOTIONS } from '../../common/constants/emotions.js';

export default {
	data() {
		return {
			diaries: [],
			searchQuery: '',
			activeEmotion: ''
		};
	},
	computed: {
		filteredDiaries() {
			let result = this.diaries;
			if (this.activeEmotion) {
				result = result.filter(d => d.emotionId === this.activeEmotion);
			}
			if (this.searchQuery.trim()) {
				const keyword = this.searchQuery.trim().toLowerCase();
				result = result.filter(d =>
					(d.event && d.event.toLowerCase().includes(keyword)) ||
					(d.aiResult && JSON.stringify(d.aiResult).toLowerCase().includes(keyword))
				);
			}
			return result;
		},
		emotions() {
			return EMOTIONS;
		}
	},
	onShow() {
		this.loadDiaries();
	},
	methods: {
		loadDiaries() {
			this.diaries = getDiaries();
		},
		clearFilters() {
			this.searchQuery = '';
			this.activeEmotion = '';
		},
		formatDate(dateStr) {
			const date = new Date(dateStr);
			return formatDateUtil(date, 'MM月DD日') + ' ' + formatDateUtil(date, 'weekday');
		},
		formatTime(isoString) {
			if (!isoString) return '';
			const date = new Date(isoString);
			return formatDateUtil(date, 'MM/DD HH:mm');
		},
		getEmotionEmoji(emotionId) {
			const emotion = EMOTIONS.find(e => e.id === emotionId);
			return emotion ? emotion.emoji : '😊';
		},
		getEmotionName(emotionId) {
			const emotion = EMOTIONS.find(e => e.id === emotionId);
			return emotion ? emotion.name : '未知';
		},
		goToEdit() {
			uni.navigateTo({ url: '/pages/diary/edit' });
		},
		goToDetail(id) {
			uni.navigateTo({ url: `/pages/diary/detail?id=${id}` });
		}
	}
};
</script>

<style scoped>
.page {
	background-color: var(--bg);
	background-image: var(--diary-bg-image);
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
	background-attachment: fixed;
	min-height: 100vh;
	padding: 16px;
}

.header-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
}

.header-title {
	font-size: 24px;
	font-weight: 600;
	color: var(--text-primary);
}

.add-btn {
	width: 40px;
	height: 40px;
	background-color: var(--accent);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.add-icon {
	font-size: 24px;
	color: var(--white);
	font-weight: 300;
}

.diary-card {
	padding: 16px;
}

.diary-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.diary-date {
	font-size: 14px;
	color: var(--text-primary);
	font-weight: 500;
}

.diary-tag {
	background-color: var(--warning);
	padding: 4px 8px;
	border-radius: 8px;
}

.tag-text {
	font-size: 10px;
	color: var(--white);
}

.diary-content {
	display: flex;
	align-items: center;
	margin-bottom: 12px;
}

.emotion-info {
	display: flex;
	align-items: center;
	margin-right: 16px;
}

.emotion-emoji {
	font-size: 28px;
	margin-right: 8px;
}

.emotion-name {
	font-size: 14px;
	color: var(--text-primary);
}

.intensity-bar {
	flex: 1;
	display: flex;
	align-items: center;
}

.intensity-label {
	font-size: 12px;
	color: var(--text-secondary);
	margin-right: 8px;
}

.bar-track {
	flex: 1;
	height: 6px;
	background-color: var(--bar-bg);
	border-radius: 3px;
	margin-right: 8px;
}

.bar-fill {
	height: 100%;
	background-color: var(--accent);
	border-radius: 3px;
}

.intensity-value {
	font-size: 12px;
	color: var(--text-secondary);
}

.diary-preview {
	padding: 12px;
	background-color: var(--input-bg);
	border-radius: 8px;
	margin-bottom: 12px;
}

.preview-text {
	font-size: 14px;
	color: var(--text-primary);
	line-height: 1.5;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.diary-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.ai-tag {
	font-size: 12px;
	color: var(--accent);
}

.analyze-time {
	font-size: 12px;
	color: var(--text-secondary);
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 100px;
}

.empty-icon {
	font-size: 64px;
	margin-bottom: 16px;
}

.empty-text {
	font-size: 18px;
	color: var(--text-primary);
	margin-bottom: 8px;
}

.empty-hint {
	font-size: 14px;
	color: var(--text-secondary);
	margin-bottom: 24px;
}

.search-bar {
	display: flex;
	align-items: center;
	padding: 10px 16px;
	margin-bottom: 12px;
}

.search-icon {
	font-size: 16px;
	margin-right: 8px;
}

.search-input {
	flex: 1;
	font-size: 14px;
	color: var(--text-primary);
	height: 36px;
}

.search-clear {
	font-size: 16px;
	color: var(--text-secondary);
	padding: 8px;
}

.filter-bar {
	margin-bottom: 12px;
}

.filter-scroll {
	display: flex;
	white-space: nowrap;
	padding-bottom: 4px;
}

.filter-chip {
	display: inline-flex;
	align-items: center;
	padding: 6px 14px;
	border-radius: 16px;
	background-color: var(--hover-bg);
	margin-right: 8px;
	font-size: 13px;
	color: var(--text-secondary);
}

.filter-chip.active {
	background-color: var(--accent);
	color: var(--white);
}

.chip-label {
	margin-left: 4px;
}

.filter-summary {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
	padding: 0 4px;
}

.summary-text {
	font-size: 13px;
	color: var(--text-secondary);
}

.summary-clear {
	font-size: 13px;
	color: var(--accent);
	padding: 4px 8px;
}
</style>
