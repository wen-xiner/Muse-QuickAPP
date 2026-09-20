<template>
	<view class="page">
		<view class="header-section">
			<text class="header-title">AI心理问答</text>
			<text class="header-subtitle">选择一个话题，我来帮你分析</text>
		</view>

		<view class="confused-card card scene-card-highlighted" @tap="selectScene(confusedScene)">
			<text class="scene-emoji">{{ confusedScene.emoji }}</text>
			<text class="scene-title">{{ confusedScene.title }}</text>
			<text class="scene-desc">{{ confusedScene.description }}</text>
		</view>

		<view class="scenes-grid">
			<view
				v-for="scene in otherScenes"
				:key="scene.id"
				class="scene-card card"
				@tap="selectScene(scene)"
			>
				<text class="scene-emoji">{{ scene.emoji }}</text>
				<text class="scene-title">{{ scene.title }}</text>
				<text class="scene-desc">{{ scene.description }}</text>
			</view>
		</view>

		<view class="notice-section card">
			<text class="notice-icon">⚠️</text>
			<view class="notice-content">
				<text class="notice-title">温馨提示</text>
				<text class="notice-text">AI问答仅供参考，不能替代专业心理咨询。如有严重心理困扰，请寻求专业帮助。</text>
			</view>
		</view>
	</view>
</template>

<script>
import { CHAT_SCENES } from '../../common/constants/chat-scenes.js';

export default {
	data() {
		return {
			scenes: CHAT_SCENES
		};
	},
	computed: {
		confusedScene() {
			return this.scenes.find(s => s.id === 'confused') || this.scenes[0];
		},
		otherScenes() {
			return this.scenes.filter(s => s.id !== 'confused');
		}
	},
	methods: {
		selectScene(scene) {
			uni.navigateTo({
				url: `/pages/chat/conversation?sceneId=${scene.id}&title=${encodeURIComponent(scene.title)}`
			});
		}
	}
};
</script>

<style scoped>
.page {
	background-color: var(--bg);
	background-image: var(--chat-bg-image);
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
	background-attachment: fixed;
	min-height: 100vh;
	padding: 16px;
}

.header-section {
	text-align: center;
	margin-bottom: 24px;
	padding: 20px 0;
}

.header-title {
	font-size: 24px;
	font-weight: 600;
	color: var(--text-primary);
	display: block;
	margin-bottom: 8px;
}

.header-subtitle {
	font-size: 14px;
	color: var(--text-secondary);
}

.confused-card {
	padding: 20px 16px;
	text-align: center;
	margin-bottom: 16px;
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.scenes-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 12px;
	margin-bottom: 24px;
}

.scene-card {
	padding: 20px 16px;
	text-align: center;
}

.scene-card-highlighted {
	background-color: var(--card-secondary-bg);
	position: relative;
}

.scene-card-highlighted::after {
	content: '推荐';
	position: absolute;
	top: 8px;
	right: 8px;
	font-size: 10px;
	color: var(--white);
	background-color: var(--accent);
	padding: 2px 8px;
	border-radius: 8px;
}

.scene-emoji {
	font-size: 40px;
	display: block;
	margin-bottom: 12px;
}

.scene-title {
	font-size: 16px;
	font-weight: 600;
	color: var(--text-primary);
	display: block;
	margin-bottom: 4px;
}

.scene-desc {
	font-size: 12px;
	color: var(--text-secondary);
}

.notice-section {
	display: flex;
	padding: 16px;
	background-color: var(--tag-bg);
}

.notice-icon {
	font-size: 24px;
	margin-right: 12px;
}

.notice-title {
	font-size: 14px;
	font-weight: 600;
	color: var(--text-primary);
	margin-bottom: 4px;
	display: block;
}

.notice-text {
	font-size: 12px;
	color: var(--text-secondary);
	line-height: 1.5;
}
</style>
