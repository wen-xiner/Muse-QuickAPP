<template>
	<view class="msg" :class="role">
		<view class="avatar">
			<text>{{ role === 'ai' ? '🤖' : '🧑' }}</text>
		</view>
		<view class="bubble">
			<text v-if="isError">😔 网络开小差了，请稍后重试</text>
			<text v-else>{{ content }}</text>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		role: {
			type: String,
			default: 'ai',
			validator: (v) => ['ai', 'user'].includes(v)
		},
		content: {
			type: String,
			default: ''
		},
		isError: {
			type: Boolean,
			default: false
		}
	}
};
</script>

<style scoped>
.msg {
	display: flex;
	align-items: flex-start;
	width: 100%;
	margin-bottom: 12px;
	box-sizing: border-box;
}

/* AI */
.msg.ai {
	flex-direction: row;
	justify-content: flex-start;
	gap: 8px;
	padding-left: 8px;
}

/* 用户 */
.msg.user {
	flex-direction: row-reverse;
	justify-content: flex-start;
	gap: 8px;
	padding-right: 8px;
}

.avatar {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: var(--card-secondary-bg);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 18px;
	flex-shrink: 0;
}

.bubble {
	flex: 0 1 auto;
	max-width: 70%;
	padding: 14px 16px;
	border-radius: 16px;
	background-color: var(--card-bg);
	line-height: 1.6;
	font-size: 14px;
	color: var(--text-primary);
	word-break: break-word;
	overflow-wrap: break-word;
}

.msg.user .bubble {
	background-color: var(--accent);
	color: var(--white);
}
</style>
