<template>
	<view class="page">
		<view class="diary-detail card" v-if="diary">
			<view class="detail-header">
				<text class="detail-date">{{ formatDate(diary.date) }}</text>
				<view class="ai-badge" v-if="diary.analyzed">
					<text class="ai-icon">🤖</text>
					<text class="ai-text">AI已分析</text>
				</view>
			</view>

			<view class="emotion-section">
				<view class="emotion-main">
					<text class="emotion-emoji">{{ emotion.emoji }}</text>
					<view class="emotion-info">
						<text class="emotion-name">{{ emotion.name }}</text>
						<text class="emotion-intensity">强度 {{ diary.intensity }}/10</text>
					</view>
				</view>
				<view class="intensity-visual">
					<view
						v-for="i in 10"
						:key="i"
						class="intensity-dot"
						:class="{ active: i <= diary.intensity }"
					></view>
				</view>
			</view>

			<view class="event-section" v-if="diary.event">
				<text class="section-label">发生了什么</text>
				<text class="event-text">{{ diary.event }}</text>
			</view>

			<view class="distortion-section" v-if="cognitiveDistortion">
				<text class="section-label">认知偏差</text>
				<view class="distortion-card">
					<text class="distortion-name">{{ cognitiveDistortion.name }}</text>
					<text class="distortion-desc">{{ cognitiveDistortion.description }}</text>
				</view>
			</view>

			<view class="ai-result-section" v-if="diary.analyzed && diary.aiResult">
				<text class="section-label">AI分析结果</text>
				<view class="ai-card">
					<view class="ai-part">
						<text class="ai-part-title">✨ 优势</text>
						<view class="ai-item" v-for="(item, index) in diary.aiResult.strengths" :key="index">
							<text class="ai-item-text">{{ item }}</text>
						</view>
					</view>
					<view class="ai-part">
						<text class="ai-part-title">💡 建议改进</text>
						<view class="ai-item" v-for="(item, index) in diary.aiResult.improvements" :key="index">
							<text class="ai-item-text">{{ item }}</text>
						</view>
					</view>
					<view class="ai-part">
						<text class="ai-part-title">🎯 应对建议</text>
						<view class="ai-item" v-for="(item, index) in diary.aiResult.recommendations" :key="index">
							<text class="ai-item-text">{{ item }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="empty-state" v-else>
			<text class="empty-icon">😢</text>
			<text class="empty-text">日记不存在</text>
		</view>

		<view class="action-bar" v-if="diary">
			<button class="btn-secondary" @tap="goToEdit">编辑</button>
			<button class="btn-danger" @tap="deleteDiary">删除</button>
		</view>
	</view>
</template>

<script>
import { formatDate } from '../../common/utils/date.js';
import { getDiaryById, deleteDiary } from '../../common/utils/storage.js';
import { EMOTIONS } from '../../common/constants/emotions.js';
import { COGNITIVE_DISTORTIONS } from '../../common/constants/distortions.js';

export default {
	data() {
		return {
			diary: null
		};
	},
	computed: {
		emotion() {
			if (!this.diary) return { emoji: '😊', name: '未知' };
			return EMOTIONS.find(e => e.id === this.diary.emotionId) || EMOTIONS[0];
		},
		cognitiveDistortion() {
			if (!this.diary || !this.diary.cognitiveDistortion) return null;
			return COGNITIVE_DISTORTIONS.find(d => d.id === this.diary.cognitiveDistortion);
		}
	},
	onLoad(options) {
		if (options.id) {
			this.loadDiary(options.id);
		}
	},
	methods: {
		loadDiary(id) {
			this.diary = getDiaryById(id);
		},
		formatDate(dateStr) {
			const date = new Date(dateStr);
			return formatDate(date, 'YYYY年MM月DD日') + ' ' + formatDate(date, 'weekday');
		},
		goToEdit() {
			uni.navigateTo({
				url: `/pages/diary/edit?id=${this.diary.id}`
			});
		},
		deleteDiary() {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这篇日记吗？删除后无法恢复。',
				success: (res) => {
					if (res.confirm) {
						deleteDiary(this.diary.id);
						uni.showToast({
							title: '删除成功',
							icon: 'success'
						});
						setTimeout(() => {
							uni.navigateBack();
						}, 1500);
					}
				}
			});
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

.diary-detail {
	padding: 20px;
}

.detail-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
}

.detail-date {
	font-size: 18px;
	font-weight: 600;
	color: var(--text-primary);
}

.ai-badge {
	display: flex;
	align-items: center;
	background-color: var(--card-secondary-bg);
	padding: 6px 12px;
	border-radius: 12px;
}

.ai-icon {
	font-size: 14px;
	margin-right: 4px;
}

.ai-text {
	font-size: 12px;
	color: var(--accent);
}

.emotion-section {
	margin-bottom: 24px;
}

.emotion-main {
	display: flex;
	align-items: center;
	margin-bottom: 16px;
}

.emotion-emoji {
	font-size: 48px;
	margin-right: 16px;
}

.emotion-name {
	font-size: 20px;
	font-weight: 600;
	color: var(--text-primary);
}

.emotion-intensity {
	font-size: 14px;
	color: var(--text-secondary);
	margin-top: 4px;
}

.intensity-visual {
	display: flex;
	gap: 6px;
}

.intensity-dot {
	width: 24px;
	height: 8px;
	background-color: var(--bar-bg);
	border-radius: 4px;
}

.intensity-dot.active {
	background-color: var(--accent);
}

.section-label {
	font-size: 14px;
	color: var(--text-secondary);
	margin-bottom: 8px;
	display: block;
}

.event-section {
	margin-bottom: 24px;
}

.event-text {
	font-size: 14px;
	color: var(--text-primary);
	line-height: 1.8;
}

.distortion-section {
	margin-bottom: 24px;
}

.distortion-card {
	background-color: var(--card-secondary-bg);
	padding: 16px;
	border-radius: 12px;
}

.distortion-name {
	font-size: 14px;
	font-weight: 600;
	color: var(--text-primary);
	margin-bottom: 4px;
	display: block;
}

.distortion-desc {
	font-size: 12px;
	color: var(--text-secondary);
}

.ai-result-section {
	margin-bottom: 24px;
}

.ai-card {
	background-color: var(--input-bg);
	padding: 16px;
	border-radius: 12px;
}

.ai-part {
	margin-bottom: 16px;
}

.ai-part:last-child {
	margin-bottom: 0;
}

.ai-part-title {
	font-size: 14px;
	font-weight: 600;
	color: var(--accent);
	margin-bottom: 8px;
	display: block;
}

.ai-item {
	margin-bottom: 4px;
}

.ai-item-text {
	font-size: 14px;
	color: var(--text-primary);
	line-height: 1.5;
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
	color: var(--text-secondary);
}

.action-bar {
	display: flex;
	gap: 12px;
	margin-top: 20px;
}

.btn-danger {
	background-color: var(--danger);
	color: var(--white);
	border-radius: 24px;
	padding: 12px 24px;
	text-align: center;
	font-size: 16px;
	border: none;
	flex: 1;
}
</style>
