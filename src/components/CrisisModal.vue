<template>
	<view class="crisis-overlay" v-if="visible" @tap.self="onClose">
		<view class="crisis-modal">
			<view class="modal-header">
				<text class="modal-icon">😔</text>
				<text class="modal-title">我们有点担心你</text>
			</view>
			<view class="modal-body">
				<text class="modal-text">
					你写的内容里有一些让人担心的信号。
				</text>
				<text class="modal-subtext">
					你愿意和AI随便聊聊吗？不用想怎么描述，说什么都可以。
				</text>
			</view>
			<view class="modal-actions">
				<button class="action-btn btn-cancel" @tap="onClose">不了</button>
				<button class="action-btn btn-chat" @tap="onChat">和AI聊聊</button>
				<button class="action-btn btn-hotline" @tap="onHotline">拨打热线</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		visible: {
			type: Boolean,
			default: false
		},
		contentSnippet: {
			type: String,
			default: ''
		}
	},
	methods: {
		onClose() {
			this.$emit('close');
		},
		onChat() {
			this.$emit('chat');
		},
		onHotline() {
			uni.makePhoneCall({ phoneNumber: '400-161-9995' });
		}
	}
};
</script>

<style scoped>
.crisis-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 999;
	background-color: var(--overlay);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 32px;
}

.crisis-modal {
	background-color: var(--card-bg);
	border-radius: 24px;
	padding: 32px 24px 24px;
	width: 100%;
	max-width: 340px;
	box-shadow: 0 8px 40px var(--shadow);
}

.modal-header {
	text-align: center;
	margin-bottom: 20px;
}

.modal-icon {
	font-size: 48px;
	display: block;
	margin-bottom: 12px;
}

.modal-title {
	font-size: 20px;
	font-weight: 600;
	color: var(--text-primary);
	display: block;
}

.modal-body {
	margin-bottom: 28px;
}

.modal-text {
	font-size: 15px;
	color: var(--text-primary);
	line-height: 1.6;
	display: block;
	margin-bottom: 12px;
	text-align: center;
}

.modal-subtext {
	font-size: 14px;
	color: var(--text-secondary);
	line-height: 1.6;
	display: block;
	text-align: center;
}

.modal-actions {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.action-btn {
	width: 100%;
	height: 48px;
	border-radius: 24px;
	font-size: 16px;
	font-weight: 500;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	padding: 0;
	margin: 0;
}

.action-btn:active {
	opacity: 0.8;
}

.btn-cancel {
	background-color: var(--card-secondary-bg);
	color: var(--text-primary);
}

.btn-chat {
	background-color: var(--accent);
	color: var(--white);
}

.btn-hotline {
	background-color: transparent;
	color: var(--accent);
	border: 1px solid var(--accent);
}
</style>
