<template>
	<view class="page">
		<scroll-view scroll-y class="messages-scroll" :scroll-top="scrollTopVal" scroll-with-animation>
			<!-- 欢迎区：头像浮于卡片上方 -->
			<view class="welcome-wrapper" v-if="messages.length === 0">
				<view class="robot-avatar">
					<text>🤖</text>
				</view>
				<view class="welcome-card">
					<text class="welcome-title">你好，我是你的AI心理助手</text>
					<text class="welcome-text" v-if="welcomeMessage">{{ welcomeMessage }}</text>
					<text class="welcome-text" v-else>关于「{{ sceneTitle }}」这个话题，你可以说说你的困惑，我会尽力给你一些建议和分析。</text>
				</view>
			</view>

			<ChatMessage
				v-for="(msg, index) in messages"
				:key="index"
				:role="msg.role"
				:content="msg.content"
				:isError="msg.isError || false"
			/>

			<view class="loading-indicator" v-if="isLoading">
				<text class="loading-dots">AI正在思考...</text>
			</view>
		</scroll-view>

		<!-- 输入区 -->
		<view class="input-container">
			<view class="input-wrapper card">
				<textarea
					class="message-input"
					v-model="inputText"
					placeholder="输入你的问题..."
					:disabled="isLoading"
					:auto-height="true"
					:maxlength="500"
					@confirm="sendMessage"
				/>
				<button
					class="send-btn"
					:class="inputText.trim() && !isLoading ? 'send-btn-active' : 'send-btn-disabled'"
					@tap="sendMessage"
					:disabled="!inputText.trim() || isLoading"
				>
					<text class="send-icon">➤</text>
				</button>
			</view>
		</view>

		<CrisisModal
			:visible="showCrisisModal"
			:contentSnippet="crisisContentSnippet"
			@close="showCrisisModal = false"
			@chat="onCrisisChat"
		/>
	</view>
</template>

<script>
import { chatWithAI } from '../../services/ai.js';
import { CHAT_SCENES, detectCrisis } from '../../common/constants/index.js';
import { isLateNight, getNightGreeting } from '../../common/utils/date.js';
import { addWarningRecord, getSettings, getChatHistory, saveChatHistory } from '../../common/utils/storage.js';
import { checkNetwork } from '../../common/utils/network.js';
import CrisisModal from '../../components/CrisisModal.vue';
import ChatMessage from '../../components/ChatMessage.vue';

export default {
	components: { CrisisModal, ChatMessage },
	data() {
		return {
			sceneTitle: '',
			inputText: '',
			messages: [],
			isLoading: false,
			showCrisisModal: false,
			crisisContentSnippet: '',
			welcomeMessage: '',
			scrollTopVal: 0
		};
	},
	created() {
		this._sceneId = '';
		this._messageHistory = [];
		this._isFromCrisis = false;
		this._nightNoticeShown = false;
	},
	onLoad(options) {
		if (options.sceneId) this._sceneId = options.sceneId;
		if (options.title) this.sceneTitle = decodeURIComponent(options.title);

		if (options.scene === 'confused') {
			const scene = CHAT_SCENES.find(s => s.id === 'confused');
			if (scene) {
				this._sceneId = 'confused';
				this.sceneTitle = scene.title;
				this.welcomeMessage = scene.welcomeMessage;
			}
		}
		if (options.from === 'crisis') this._isFromCrisis = true;

		uni.setNavigationBarTitle({ title: this.sceneTitle || 'AI对话' });

		const saved = getChatHistory(this._sceneId);
		if (saved.messages.length > 0) {
			this.messages = saved.messages;
			this._messageHistory = saved.history;
		}

		if (this._isFromCrisis && this.messages.length === 0) {
			this.$nextTick(() => { this.handleCrisisAutoMessage(); });
		}
	},
	onUnload() { this.persistChat(); },
	methods: {
		scrollToBottom() {
			this.scrollTopVal = this.scrollTopVal === 0 ? 1 : 0;
			this.$nextTick(() => {
				setTimeout(() => {
					uni.createSelectorQuery().in(this)
						.select('.messages-scroll')
						.fields({ scrollHeight: true }, res => {
							if (res && res.scrollHeight) this.scrollTopVal = res.scrollHeight + 100;
							else this.scrollTopVal = 999999;
						}).exec();
				}, 100);
			});
		},
		persistChat() {
			if (this._sceneId && this.messages.length > 0) {
				saveChatHistory(this._sceneId, {
					messages: this.messages,
					history: this._messageHistory,
					title: this.sceneTitle
				});
			}
		},
		async sendMessage() {
			const text = this.inputText.trim();
			if (!text || this.isLoading) return;
			this.inputText = '';
			await this._processUserMessage(text);
		},
		async _processUserMessage(text, options = {}) {
			const isAuto = options.isAuto || false;

			this.messages.push({ role: 'user', content: text, isAuto });
			this.scrollToBottom();
			this._messageHistory.push({ role: 'user', content: text });
			this.isLoading = true;

			if (detectCrisis(text)) {
				const settings = getSettings();
				if (settings.autoWarning) {
					addWarningRecord({ reason: 'AI对话中用户发送了危机相关内容', source: 'chat_user', detail: text.substring(0, 100) });
				}
				if (!isAuto) { this.crisisContentSnippet = text; this.showCrisisModal = true; }
			}

			const network = await checkNetwork();
			if (!network.online) {
				this.messages.push({ role: 'ai', content: '当前无网络连接，请检查网络后重试。如果你需要紧急帮助，请拨打心理援助热线：400-161-9995', isError: true });
				this.scrollToBottom();
				this.isLoading = false;
				this.persistChat();
				return;
			}

			// 深夜关怀
			if (!this._nightNoticeShown && isLateNight()) {
				const night = getNightGreeting();
				if (night) {
					this.messages.push({ role: 'ai', content: '💙 ' + night.subtitle + ' 不过既然你在这里，我会陪着你的。' });
					this._messageHistory.push({ role: 'ai', content: '💙 ' + night.subtitle + ' 不过既然你在这里，我会陪着你的。' });
					this.scrollToBottom();
				}
				this._nightNoticeShown = true;
			}

			try {
				const response = await chatWithAI(text, this._sceneId, this._messageHistory);
				this.messages.push({ role: 'ai', content: response });
				this._messageHistory.push({ role: 'ai', content: response });
				this.scrollToBottom();

				if (detectCrisis(response)) {
					const settings = getSettings();
					if (settings.autoWarning) {
						addWarningRecord({ reason: 'AI对话中包含危机相关内容', source: 'chat_ai', detail: response.substring(0, 100) });
					}
				}
			} catch (error) {
				console.error('AI回复失败:', error);
				this.messages.push({ role: 'ai', content: 'AI暂时无法回应，请稍后重试。如果你需要紧急帮助，请拨打心理援助热线：400-161-9995', isError: true });
				this.scrollToBottom();
			}

			this.isLoading = false;
			this.persistChat();
		},
		handleCrisisAutoMessage() {
			const autoText = '我刚刚写下了一些让我自己也不太舒服的话，不知道该怎么描述，但想和你聊聊';
			this._processUserMessage(autoText, { isAuto: true });
		},
		onCrisisChat() { this.showCrisisModal = false; }
	}
};
</script>

<style scoped>
/* ===== 页面容器 ===== */
.page {
	background-color: var(--bg);
	background-image: var(--chat-bg-image);
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
	background-attachment: fixed;
	display: flex;
	flex-direction: column;
	min-height: 100vh;
}

/* ===== 消息滚动区 ===== */
.messages-scroll {
	flex: 1;
	min-height: 0;
	padding: 50px 0;
}

/* ===== 欢迎区：头像浮于卡片上方 ===== */
.welcome-wrapper {
	position: relative;
	padding-top: 100rpx;
	margin-bottom: 20px;
}

.robot-avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	background: var(--card-secondary-bg);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 60rpx;
	margin: 0 auto;
	position: relative;
	z-index: 6;
}

.welcome-card {
	width: 92%;
	padding: 60rpx 30rpx 40rpx;
	background: #ffffff;
	border-radius: 24rpx;
	position: relative;
	z-index: 1;
	margin: 0 auto;
	text-align: center;
}

.dark .welcome-card {
	background: #1E1E32;
}

.welcome-title {
	font-size: 18px;
	font-weight: 600;
	color: var(--text-primary);
	display: block;
	margin-bottom: 8px;
}

.welcome-text {
	font-size: 14px;
	color: var(--text-secondary);
	line-height: 1.6;
}

/* ===== 加载 ===== */
.loading-indicator { text-align: center; padding: 12px; }
.loading-dots { font-size: 14px; color: var(--text-secondary); }

/* ===== 输入区 ===== */
.input-container {
	position: fixed;
	bottom: 0; left: 0; right: 0;
	z-index: 10;
	padding: 8px 16px;
	padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
	background-color: var(--bg);
	border-top: 1px solid var(--border);
	box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.input-wrapper {
	display: flex;
	align-items: flex-end;
	padding: 8px 12px;
}

.message-input {
	flex: 1;
	min-height: 40px;
	max-height: 120px;
	font-size: 14px;
	line-height: 1.5;
	background-color: transparent;
	color: var(--text-primary);
}

/* ===== 发送按钮 ===== */
.send-btn {
	width: 40px; height: 40px;
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	border: none; margin-left: 14px;
	background-color: var(--bar-bg);
	transition: background-color 0.2s ease, transform 0.15s ease;
}

.send-btn-active { background-color: #9B7BB5; }
.send-btn-active:active { transform: scale(0.92); }
.send-btn-disabled { background-color: var(--bar-bg); }

.send-icon { color: #FFFFFF; font-size: 18px; }
</style>
