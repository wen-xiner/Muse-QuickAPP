<template>
	<view class="page">
		<view class="skip-btn" @tap="finishOnboarding">
			<text class="skip-text">跳过</text>
		</view>

		<swiper class="swiper" :current="current" @change="onSwiperChange" circular="false">
			<swiper-item v-for="(slide, index) in slides" :key="index">
				<view class="slide">
					<view class="emoji-container">
						<text class="slide-emoji">{{ slide.emoji }}</text>
					</view>
					<text class="slide-title">{{ slide.title }}</text>
					<text class="slide-desc">{{ slide.description }}</text>
				</view>
			</swiper-item>
		</swiper>

		<view class="bottom-section">
			<view class="dots">
				<view
					v-for="(slide, index) in slides"
					:key="index"
					class="dot"
					:class="{ active: current === index }"
				></view>
			</view>

			<view class="action-btn" @tap="onNext">
				<text class="action-text">{{ current === slides.length - 1 ? '开始使用' : '下一步' }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { setOnboardingCompleted } from '../../common/utils/storage.js';

export default {
	data() {
		return {
			current: 0,
			slides: [
				{
					emoji: '🤗',
					title: '记录每日情绪',
					description: '选择此刻的心情表情，记录生活中触动你的瞬间。每一份情绪都值得被看见。'
				},
				{
					emoji: '📊',
					title: 'AI 智能分析',
					description: 'AI 自动分析你的情绪模式和认知偏差，提供温暖的应对建议，帮你更好地理解自己。'
				},
				{
					emoji: '🧘',
					title: '学会放松自己',
					description: '内置呼吸练习和情绪调节方法，当你感到焦虑或压力时，随时帮你平静下来。'
				}
			]
		};
	},
	methods: {
		onSwiperChange(e) {
			this.current = e.detail.current;
		},
		onNext() {
			if (this.current < this.slides.length - 1) {
				this.current = this.current + 1;
			} else {
				this.finishOnboarding();
			}
		},
		finishOnboarding() {
			setOnboardingCompleted();
			uni.switchTab({
				url: '/pages/index/index'
			});
		}
	}
};
</script>

<style scoped>
.page {
	background: linear-gradient(180deg, var(--bg) 0%, #F0E8F5 100%);
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	position: relative;
}

.skip-btn {
	position: absolute;
	top: 48px;
	right: 20px;
	z-index: 10;
	padding: 8px 16px;
}

.skip-text {
	font-size: 14px;
	color: var(--text-secondary);
}

.swiper {
	flex: 1;
}

.slide {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 0 40px;
	height: 100%;
}

.emoji-container {
	width: 120px;
	height: 120px;
	background-color: var(--card-bg);
	border-radius: 60px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 40px;
	box-shadow: 0 8px 32px var(--shadow);
}

.slide-emoji {
	font-size: 56px;
	font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'EmojiOne Color', sans-serif;
}

.slide-title {
	font-size: 22px;
	font-weight: 600;
	color: var(--text-primary);
	margin-bottom: 16px;
	text-align: center;
}

.slide-desc {
	font-size: 15px;
	color: var(--text-secondary);
	line-height: 1.7;
	text-align: center;
	max-width: 280px;
}

.bottom-section {
	padding: 0 32px 48px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 32px;
}

.dots {
	display: flex;
	gap: 8px;
}

.dot {
	width: 8px;
	height: 8px;
	border-radius: 4px;
	background-color: var(--bar-bg);
	transition: all 0.3s;
}

.dot.active {
	width: 24px;
	background-color: var(--accent);
}

.action-btn {
	width: 100%;
	height: 50px;
	background-color: var(--accent);
	border-radius: 25px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.action-btn:active {
	opacity: 0.85;
}

.action-text {
	font-size: 17px;
	font-weight: 600;
	color: var(--white);
}
</style>
