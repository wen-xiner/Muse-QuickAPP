<template>
	<view class="page">
		<!-- 头部 -->
		<view class="login-header">
			<view class="logo-circle">
				<text class="logo-emoji">📔</text>
			</view>
			<text class="app-name">情绪日记本</text>
			<text class="app-desc">记录心情，理解自己</text>
		</view>

		<!-- 已有账户：选择登录 -->
		<view class="section" v-if="!showRegister && accountList.length > 0">
			<text class="section-label">选择账户登录</text>
			<view class="account-list">
				<view v-for="acc in accountList" :key="acc.id"
					class="account-card card" @tap="doLogin(acc)">
					<view class="acc-avatar" :style="{ background: getAccentColor(acc.id) }">
						{{ acc.name.substring(0, 1) }}
					</view>
					<view class="acc-body">
						<text class="acc-name">{{ acc.name }}</text>
						<text class="acc-date">创建于 {{ formatDate(acc.createdAt) }}</text>
					</view>
					<text class="acc-enter">登录 ›</text>
				</view>
			</view>
		</view>

		<!-- 注册新账户 -->
		<view class="section" v-if="showRegister || accountList.length === 0">
			<text class="section-label">{{ accountList.length === 0 ? '创建你的第一个账户' : '创建新账户' }}</text>
			<view class="register-card card">
				<view class="input-row">
					<text class="input-icon">👤</text>
					<input
						class="name-input"
						v-model="newName"
						placeholder="输入你的名字或昵称"
						maxlength="12"
						:focus="showRegister"
						@confirm="doRegister"
					/>
				</view>
				<text class="input-hint">这个名字会显示在「我的」页面</text>
				<button class="btn-primary register-btn" @tap="doRegister" :disabled="!newName.trim()">
					创建并进入
				</button>
			</view>
		</view>

		<!-- 切换链接 -->
		<view class="switch-row" v-if="accountList.length > 0">
			<text class="switch-link" @tap="toggleMode">
				{{ showRegister ? '‹ 返回选择账户' : '＋ 创建新账户' }}
			</text>
		</view>

		<!-- 底部说明 -->
		<view class="privacy-note">
			<text class="privacy-icon">🔒</text>
			<text class="privacy-text">你的所有数据只保存在本地设备，不会上传到任何服务器</text>
		</view>
	</view>
</template>

<script>
import { getAccountList, createAccount, switchAccount } from '../../common/utils/account.js';

export default {
	data() {
		return {
			accountList: [],
			showRegister: false,
			newName: ''
		};
	},
	onShow() {
		this.accountList = getAccountList();
		this.showRegister = this.accountList.length === 0;
		this.newName = '';
	},
	methods: {
		doLogin(acc) {
			switchAccount(acc.id);
			uni.reLaunch({ url: '/pages/index/index' });
		},
		doRegister() {
			const name = this.newName.trim();
			if (!name) return;
			const acc = createAccount(name);
			switchAccount(acc.id);
			uni.reLaunch({ url: '/pages/index/index' });
		},
		toggleMode() {
			this.showRegister = !this.showRegister;
			this.newName = '';
		},
		formatDate(iso) {
			if (!iso) return '';
			const d = new Date(iso);
			return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
		},
		getAccentColor(id) {
			const colors = ['#9B7BB5', '#7BA3B5', '#B59B7B', '#7BB59B', '#B57B9B'];
			let hash = 0;
			for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i);
			return colors[Math.abs(hash) % colors.length];
		}
	}
};
</script>

<style scoped>
.page {
	background: linear-gradient(180deg, #FAF7F2 0%, #F0E8F5 100%);
	min-height: 100vh;
	padding: 32px 24px;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.login-header {
	text-align: center;
	margin-top: 40px;
	margin-bottom: 40px;
}

.logo-circle {
	width: 100px; height: 100px;
	background: #fff;
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	margin: 0 auto 20px;
	box-shadow: 0 4px 24px rgba(155, 123, 181, 0.12);
}

.logo-emoji { font-size: 48px; }

.app-name {
	font-size: 26px; font-weight: 700; color: #4A4A4A;
	display: block; margin-bottom: 8px;
}

.app-desc {
	font-size: 15px; color: #9B9B9B;
}

/* 账户列表 */
.section {
	width: 100%; max-width: 360px;
	margin-bottom: 24px;
}

.section-label {
	font-size: 14px; color: #9B9B9B;
	margin-bottom: 12px; display: block; padding-left: 4px;
}

.account-list {
	display: flex; flex-direction: column; gap: 10px;
}

.account-card {
	display: flex; align-items: center;
	padding: 16px; gap: 14px;
	cursor: pointer;
}

.acc-avatar {
	width: 44px; height: 44px; border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	color: #fff; font-size: 20px; font-weight: 600;
	flex-shrink: 0;
}

.acc-body { flex: 1; display: flex; flex-direction: column; }

.acc-name {
	font-size: 16px; color: #4A4A4A; font-weight: 500;
}

.acc-date {
	font-size: 12px; color: #9B9B9B; margin-top: 2px;
}

.acc-enter {
	font-size: 18px; color: #9B7BB5; font-weight: 500;
}

/* 注册卡片 */
.register-card {
	padding: 20px;
}

.input-row {
	display: flex; align-items: center;
	background: var(--input-bg); border-radius: 14px;
	padding: 12px 16px; margin-bottom: 8px;
}

.input-icon { font-size: 20px; margin-right: 10px; }

.name-input {
	flex: 1; font-size: 16px; color: #4A4A4A;
	background: transparent; border: none; height: 40px;
}

.input-hint {
	font-size: 12px; color: #9B9B9B;
	display: block; margin-bottom: 16px; padding-left: 4px;
}

.register-btn {
	margin-top: 4px;
}

.register-btn[disabled] {
	opacity: 0.5;
}

/* 切换 */
.switch-row {
	margin-bottom: 32px;
}

.switch-link {
	font-size: 14px; color: #9B7BB5;
}

/* 隐私说明 */
.privacy-note {
	display: flex; align-items: center; gap: 8px;
	padding: 16px; border-radius: 12px;
	background: rgba(155, 123, 181, 0.08);
	max-width: 360px; width: 100%;
	margin-top: auto;
}

.privacy-icon { font-size: 16px; }

.privacy-text {
	font-size: 12px; color: #9B9B9B;
	line-height: 1.5;
}
</style>
