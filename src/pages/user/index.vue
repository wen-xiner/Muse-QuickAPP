<template>
	<view class="page">
		<view class="profile-section card">
			<view class="avatar-area">
				<view class="avatar">
					<text class="avatar-text">{{ userInfo.nickname.substring(0, 1) }}</text>
				</view>
				<view class="profile-info">
					<input
						class="nickname-input"
						v-model="userInfo.nickname"
						placeholder="点击编辑昵称"
						@blur="saveUserInfo"
					/>
					<text class="edit-hint">账户：{{ userInfo.accountName || '用户' }}</text>
				</view>
			</view>
		</view>

		<!-- 安全与预警 -->
		<view class="section-group">
			<view class="section-header"><text class="section-title">安全与预警</text></view>
			<view class="menu-list card">
				<view class="menu-item" @tap="goToManualWarning">
					<text class="menu-icon">🆘</text>
					<text class="menu-label">手动预警</text>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item">
					<text class="menu-icon">⚡</text>
					<view class="menu-label-group">
						<text class="menu-label">自动预警</text>
						<text class="menu-hint">检测到危机内容时自动生成预警记录</text>
					</view>
					<switch :checked="settings.autoWarning" color="#9B7BB5" @change="onAutoWarningChange" />
				</view>
				<view class="menu-item" @tap="goToWarningRecords">
					<text class="menu-icon">📋</text>
					<text class="menu-label">预警记录</text>
					<view class="menu-right">
						<text class="record-count" v-if="warningCount > 0">{{ warningCount }}条</text>
						<text class="menu-arrow">›</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 数据与隐私 -->
		<view class="section-group">
			<view class="section-header"><text class="section-title">数据与隐私</text></view>
			<view class="menu-list card">
				<view class="menu-item" @tap="openDataManagement">
					<text class="menu-icon">📦</text>
					<text class="menu-label">数据管理</text>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item" @tap="showPrivacyPolicy">
					<text class="menu-icon">🔒</text>
					<text class="menu-label">隐私政策</text>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item" @tap="showAbout">
					<text class="menu-icon">ℹ️</text>
					<text class="menu-label">关于</text>
					<text class="version-text">v1.0.0</text>
				</view>
			</view>
		</view>

		<!-- 其他 -->
		<view class="section-group">
			<view class="section-header"><text class="section-title">其他</text></view>
			<view class="menu-list card">
				<view class="menu-item">
					<text class="menu-icon">🌙</text>
					<view class="menu-label-group">
						<text class="menu-label">暗黑模式</text>
						<text class="menu-hint">切换深色主题</text>
					</view>
					<switch :checked="settings.darkMode" color="#9B7BB5" @change="onDarkModeChange" />
				</view>
				<view class="menu-item" @tap="showBgPicker('diary')">
					<text class="menu-icon">🎨</text>
					<view class="menu-label-group">
						<text class="menu-label">日记页背景</text>
						<text class="menu-hint">{{ diaryBgName || '未设置' }}</text>
					</view>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item" @tap="showBgPicker('chat')">
					<text class="menu-icon">💬</text>
					<view class="menu-label-group">
						<text class="menu-label">对话页背景</text>
						<text class="menu-hint">{{ chatBgName || '未设置' }}</text>
					</view>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item" @tap="openFeedback">
					<text class="menu-icon">💬</text>
					<text class="menu-label">意见反馈</text>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item" @tap="contactCustomerService">
					<text class="menu-icon">📧</text>
					<text class="menu-label">联系客服</text>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item" @tap="doLogout">
					<text class="menu-icon">🚪</text>
					<text class="menu-label">退出登录</text>
					<text class="menu-arrow">›</text>
				</view>
			</view>
		</view>

		<view class="disclaimer">
			<text class="disclaimer-icon">⚠️</text>
			<text class="disclaimer-text">本工具不能替代专业医疗建议</text>
		</view>

		<!-- 数据管理弹窗 -->
		<view class="modal-overlay" v-if="showDataModal" @tap.self="showDataModal = false">
			<view class="modal-card">
				<text class="modal-title">📦 数据管理</text>

				<view class="data-stats">
					<view class="stat-row">
						<text class="stat-label">日记总数</text>
						<text class="stat-val">{{ dataStats.diaryCount }} 篇</text>
					</view>
					<view class="stat-row">
						<text class="stat-label">聊天会话</text>
						<text class="stat-val">{{ dataStats.chatSessions }} 个</text>
					</view>
					<view class="stat-row">
						<text class="stat-label">预警记录</text>
						<text class="stat-val">{{ dataStats.warningCount }} 条</text>
					</view>
					<view class="stat-row">
						<text class="stat-label">存储占用</text>
						<text class="stat-val">{{ dataStats.storageUsed }}</text>
					</view>
				</view>

				<view class="modal-actions">
					<button class="act-btn act-export" @tap="exportDiaries">📤 导出日记</button>
					<button class="act-btn act-clear" @tap="confirmClearChat">🗑 清空聊天记录</button>
					<button class="act-btn act-clear" @tap="confirmClearDiaries">🗑 清空所有日记</button>
					<button class="act-btn act-clear act-danger" @tap="confirmClearAll">⚠️ 清空全部数据</button>
				</view>

				<button class="act-close" @tap="showDataModal = false">关闭</button>
			</view>
		</view>

		<!-- 背景选择弹窗 -->
		<view class="modal-overlay" v-if="showPicker" @tap="showPicker = false">
			<view class="picker-modal card" @tap.stop>
				<text class="picker-title">{{ pickerType === 'diary' ? '日记页背景' : '对话页背景' }}</text>
				<view class="picker-grid">
					<view class="picker-item" :class="{ selected: currentBg === '' }" @tap="onBgChange('')">
						<view class="picker-preview bg-none"><text class="bg-none-text">默认</text></view>
						<text class="picker-name">无背景</text>
					</view>
					<view v-for="bg in bgList" :key="bg.id" class="picker-item"
						:class="{ selected: currentBg === bg.id, disabled: !bg.ready }"
						@tap="bg.ready && onBgChange(bg.id)">
						<view class="picker-preview" :style="bgPreviewStyle(bg)">
							<text v-if="!bg.ready" class="picker-coming">开发中</text>
						</view>
						<text class="picker-icon">{{ bg.icon }}</text>
						<text class="picker-name">{{ bg.name }}</text>
					</view>
				</view>
				<button class="btn-primary" @tap="showPicker = false">完成</button>
			</view>
		</view>

		<!-- 意见反馈弹窗 -->
		<view class="modal-overlay" v-if="showFeedbackModal" @tap.self="showFeedbackModal = false">
			<view class="modal-card">
				<text class="modal-title">💬 意见反馈</text>
				<textarea
					class="feedback-input"
					v-model="feedbackText"
					placeholder="请描述你的问题或建议（如遇 bug 请说明操作步骤）..."
					maxlength="500"
				/>
				<text class="char-count">{{ feedbackText.length }}/500</text>
				<view class="modal-actions">
					<button class="act-btn act-submit" @tap="submitFeedback" :disabled="!feedbackText.trim()">提交反馈</button>
				</view>
				<button class="act-close" @tap="showFeedbackModal = false">关闭</button>
			</view>
		</view>
	</view>
</template>

<script>
import {
	getUserInfo, saveUserInfo, getSettings, saveSettings,
	getWarningRecords, getDiaries, getChatSessions,
	checkStorageQuota, clearChatHistory, generateId
} from '../../common/utils/storage.js';
import { getCurrentAccountId, getAccountList, switchAccount } from '../../common/utils/account.js';
import { BACKGROUNDS } from '../../common/constants/backgrounds.js';
import { useBackgroundStore } from '../../common/utils/reactiveBackgroundStore.js';

const bgStore = useBackgroundStore();

export default {
	data() {
		return {
			userInfo: { nickname: '用户', avatar: '', accountName: '用户' },
			settings: {
				autoWarning: true, voiceGuide: true, vibration: true,
				backgroundMusic: false, darkMode: false
			},
			warningCount: 0,
			// 数据管理弹窗
			showDataModal: false,
			dataStats: { diaryCount: 0, chatSessions: 0, warningCount: 0, storageUsed: '--' },
			// 背景选择
			showPicker: false, pickerType: '', bgList: BACKGROUNDS,
			diaryBgName: '', chatBgName: '',
			// 意见反馈弹窗
			showFeedbackModal: false,
			feedbackText: ''
		};
	},
	onShow() {
		this.loadData();
	},
	computed: {
		currentBg() {
			return this.pickerType === 'diary'
				? bgStore.state.diaryBackground
				: bgStore.state.chatBackground;
		}
	},
	methods: {
		loadData() {
			this.userInfo = getUserInfo();
			this.settings = getSettings();
			this.warningCount = getWarningRecords().length;
			const accs = getAccountList();
			const curId = getCurrentAccountId();
			const cur = accs.find(a => a.id === curId);
			this.userInfo.accountName = cur ? cur.name : '用户';
			// 背景
			if (typeof window !== "undefined" && window.__applyTheme) {
				window.__applyTheme();
			}
			const dBg = BACKGROUNDS.find(t => t.id === bgStore.state.diaryBackground);
			const cBg = BACKGROUNDS.find(t => t.id === bgStore.state.chatBackground);
			this.diaryBgName = dBg ? dBg.name : '';
			this.chatBgName = cBg ? cBg.name : '';
		},
		saveUserInfo() { saveUserInfo(this.userInfo); },
		onAutoWarningChange(e) {
			this.settings.autoWarning = e.detail.value;
			saveSettings(this.settings);
		},
		onDarkModeChange(e) {
			this.settings.darkMode = e.detail.value;
			saveSettings(this.settings);
			const html = document.documentElement;
			if (e.detail.value) html.classList.add('dark');
			else html.classList.remove('dark');
			if (typeof window !== "undefined" && window.__applyTheme) {
				window.__applyTheme();
			}
		},
		goToManualWarning() {
			uni.showModal({
				title: '紧急预警',
				content: '如果你正处于危机中，请立即拨打心理援助热线：400-161-9995\n\n是否现在拨打？',
				confirmText: '拨打热线', cancelText: '取消',
				success: (res) => { if (res.confirm) uni.makePhoneCall({ phoneNumber: '400-161-9995' }); }
			});
		},
		goToWarningRecords() {
			const records = getWarningRecords();
			if (records.length === 0) {
				uni.showModal({ title: '预警记录', content: '暂无预警记录', showCancel: false });
				return;
			}
			const list = records.slice(0, 10).map((r, i) => {
				const time = new Date(r.time).toLocaleString('zh-CN');
				return `${i + 1}. ${r.reason}\n   ${time}\n   ${r.detail ? '"' + r.detail.substring(0, 40) + '..."' : ''}`;
			}).join('\n\n');
			uni.showModal({
				title: `预警记录 (${records.length}条)`,
				content: list + (records.length > 10 ? '\n\n...仅显示最近10条' : ''),
				confirmText: '我知道了', showCancel: false
			});
		},

		// ===== 数据管理 =====
		openDataManagement() {
			const diaries = getDiaries();
			const sessions = getChatSessions();
			const warnings = getWarningRecords();
			let storageUsed = '--';
			try {
				const info = uni.getStorageInfoSync();
				storageUsed = info.currentSize
					? (info.currentSize / 1024 / 1024).toFixed(2) + ' MB'
					: '< 1 KB';
			} catch (e) { /* 忽略 */ }
			this.dataStats = {
				diaryCount: diaries.length,
				chatSessions: sessions.length,
				warningCount: warnings.length,
				storageUsed
			};
			this.showDataModal = true;
		},
		confirmClearChat() {
			uni.showModal({
				title: '清空聊天记录',
				content: '确定清空所有 AI 对话记录吗？此操作不可恢复。',
				success: (res) => {
					if (!res.confirm) return;
					const sessions = getChatSessions();
					sessions.forEach(s => clearChatHistory(s.id));
					uni.showToast({ title: '聊天记录已清空', icon: 'success' });
					this.openDataManagement();
				}
			});
		},
		confirmClearDiaries() {
			uni.showModal({
				title: '清空日记',
				content: '确定清空所有情绪日记吗？此操作不可恢复。',
				success: (res) => {
					if (!res.confirm) return;
					uni.setStorageSync('emotion_diaries', JSON.stringify([]));
					uni.showToast({ title: '日记已清空', icon: 'success' });
					this.openDataManagement();
				}
			});
		},
		confirmClearAll() {
			uni.showModal({
				title: '⚠️ 清空全部数据',
				content: '这将删除所有日记、聊天记录、预警记录和设置。此操作不可恢复！',
				confirmText: '确认清空', cancelText: '取消',
				success: (res) => {
					if (!res.confirm) return;
					try {
						const keys = ['emotion_diaries', 'user_info', 'app_settings',
							'warning_records', 'has_onboarding', 'chat_sessions', '_error_logs'];
						keys.forEach(k => uni.removeStorageSync(k));
						// 清空聊天历史
						getChatSessions().forEach(s => uni.removeStorageSync('chat_history:' + s.id));
						uni.showToast({ title: '全部数据已清空', icon: 'success' });
						this.showDataModal = false;
						this.loadData();
					} catch (e) {
						uni.showToast({ title: '操作失败', icon: 'none' });
					}
				}
			});
		},
		exportDiaries() {
			const diaries = getDiaries();
			if (diaries.length === 0) {
				uni.showToast({ title: '暂无日记可导出', icon: 'none' });
				return;
			}
			// 格式化为可读文本
			const text = diaries.map((d, i) => {
				const date = d.date || '未知日期';
				const emotion = d.emotionId || '未记录';
				const intensity = d.intensity || '--';
				const event = d.event || '（无描述）';
				return `【${i + 1}】${date} | 情绪:${emotion} | 强度:${intensity}/10\n${event}\n`;
			}).join('\n---\n\n');

			// H5 环境：复制到剪贴板
			try {
				if (typeof navigator !== 'undefined' && navigator.clipboard) {
					navigator.clipboard.writeText(text).then(() => {
						uni.showToast({ title: '日记内容已复制到剪贴板', icon: 'success' });
					}).catch(() => {
						this._fallbackExport(text);
					});
				} else {
					this._fallbackExport(text);
				}
			} catch (e) {
				this._fallbackExport(text);
			}
		},
		_fallbackExport(text) {
			uni.showModal({
				title: '导出日记',
				content: '日记内容预览：\n\n' + text.substring(0, 200) + (text.length > 200 ? '...' : ''),
				confirmText: '复制全部',
				cancelText: '关闭',
				success: (res) => {
					if (res.confirm) {
						uni.setClipboardData?.({ data: text, success: () => {
							uni.showToast({ title: '已复制', icon: 'success' });
						}});
					}
				}
			});
		},

		// ===== 意见反馈 =====
		openFeedback() {
			this.feedbackText = '';
			this.showFeedbackModal = true;
		},
		submitFeedback() {
			const content = this.feedbackText.trim();
			if (!content) return;

			// 本地保存反馈记录
			try {
				const feedbacks = uni.getStorageSync('_user_feedbacks');
				const list = feedbacks ? JSON.parse(feedbacks) : [];
				list.unshift({
					id: generateId(),
					content,
					time: new Date().toISOString(),
					version: '1.0.0'
				});
				uni.setStorageSync('_user_feedbacks', JSON.stringify(list.slice(0, 20)));
			} catch (e) { /* 忽略 */ }

			uni.showToast({ title: '感谢反馈！我们会认真查看', icon: 'success' });
			this.showFeedbackModal = false;

			// H5 环境同时尝试复制
			try {
				if (typeof navigator !== 'undefined' && navigator.clipboard) {
					navigator.clipboard.writeText('[情绪日记本反馈]\n' + content);
				}
			} catch (e) { /* 忽略 */ }
		},

		showPrivacyPolicy() {
			uni.showModal({
				title: '隐私政策',
				content: '我们非常重视您的隐私保护。\n\n1. 数据存储：您的日记数据仅存储在本地设备，不会自动上传。\n2. AI分析：开启AI分析时，日记内容和对话记录会发送到DeepSeek云端进行处理，分析完成后不会永久保存在第三方服务器。\n3. 预警功能：仅在您主动触发或检测到危机关键词时才会提示求助。\n\n如您对隐私有顾虑，可在日记编辑页关闭"开启AI分析"开关。',
				showCancel: false
			});
		},
		showAbout() {
			uni.showModal({
				title: '关于',
				content: '情绪日记本 v1.0.0\n\n面向青少年的心理健康辅助工具\n\n© 2024 Muse Team',
				showCancel: false
			});
		},
		// ===== 背景选择 =====
		showBgPicker(type) {
			this.pickerType = type;
			this.showPicker = true;
		},
		bgPreviewStyle(bg) {
			if (!bg.ready) return { background: '#e0e0e0' };
			return bgStore.getBgStyle(bg.id, false);
		},
		onBgChange(id) {
			if (this.pickerType === 'diary') {
				bgStore.setDiaryBackground(id);
			} else {
				bgStore.setChatBackground(id);
			}
			const bg = BACKGROUNDS.find(t => t.id === id);
			if (this.pickerType === 'diary') this.diaryBgName = bg ? bg.name : '';
			else this.chatBgName = bg ? bg.name : '';
			// 立即更新 CSS 变量
		if (typeof window !== 'undefined' && window.__applyTheme) {
			window.__applyTheme();
		}
		uni.showToast({ title: id ? '背景已更换' : '已恢复默认', icon: 'success' });
	},

		// ===== 退出登录 =====
		doLogout() {
			uni.showModal({
				title: '退出登录',
				content: '退出后数据不会丢失，重新登录即可恢复。确定退出吗？',
				confirmText: '退出', cancelText: '取消',
				success: (res) => {
					if (!res.confirm) return;
					// 标记为已登出并跳转到登录页
					switchAccount('__logged_out__');
					uni.reLaunch({ url: '/pages/login/index' });
				}
			});
		},

		contactCustomerService() {
			uni.showModal({
				title: '联系客服',
				content: '客服邮箱：support@museapp.com',
				showCancel: false
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
	padding-bottom: 32px;
}
.profile-section { padding: 24px; }
.avatar-area { display: flex; align-items: center; }
.avatar {
	width: 64px; height: 64px;
	background: linear-gradient(135deg, var(--accent), var(--accent-light));
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	margin-right: 16px;
}
.avatar-text { font-size: 28px; color: var(--white); font-weight: 600; }
.profile-info { flex: 1; }
.nickname-input {
	font-size: 20px; font-weight: 600; color: var(--text-primary);
	border: none; background: transparent; padding: 0;
}
.edit-hint { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.section-group { margin-bottom: 20px; }
.section-header { padding: 8px 0; margin-bottom: 8px; }
.section-title { font-size: 14px; color: var(--text-secondary); }
.menu-list { padding: 0; }
.menu-item {
	display: flex; align-items: center; padding: 16px;
	border-bottom: 1px solid var(--border);
}
.menu-item:last-child { border-bottom: none; }
.menu-icon { font-size: 20px; margin-right: 12px; }
.menu-label { flex: 1; font-size: 14px; color: var(--text-primary); }
.menu-label-group { flex: 1; display: flex; flex-direction: column; }
.menu-hint { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
.menu-right { display: flex; align-items: center; }
.record-count { font-size: 12px; color: var(--text-secondary); margin-right: 8px; }
.menu-arrow { font-size: 18px; color: var(--text-secondary); }
.version-text { font-size: 12px; color: var(--text-secondary); }
.disclaimer {
	display: flex; align-items: center; justify-content: center;
	padding: 24px; margin-top: 16px;
}
.disclaimer-icon { font-size: 16px; margin-right: 8px; }
.disclaimer-text { font-size: 12px; color: #9B9B9B; }

/* 弹窗 */
.modal-overlay {
	position: fixed; inset: 0; z-index: 900;
	background: var(--overlay);
	display: flex; align-items: center; justify-content: center;
	padding: 24px;
}
.modal-card {
	background: var(--card-bg); border-radius: 20px;
	padding: 24px 20px 20px;
	width: 100%; max-width: 360px; max-height: 80vh;
	overflow-y: auto;
}
.modal-title { font-size: 18px; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 16px; text-align: center; }

/* 数据统计 */
.data-stats {
	background: var(--input-bg); border-radius: 12px; padding: 12px 16px;
	margin-bottom: 16px;
}
.stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); }
.stat-row:last-child { border-bottom: none; }
.stat-label { font-size: 14px; color: var(--text-secondary); }
.stat-val { font-size: 14px; color: var(--text-primary); font-weight: 500; }

/* 操作按钮 */
.modal-actions { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.act-btn {
	width: 100%; height: 44px; border-radius: 22px; font-size: 14px;
	border: none; text-align: center; padding: 0;
}
.act-export { background: var(--accent); color: #fff; }
.act-clear { background: var(--input-bg); color: var(--text-primary); }
.act-danger { background: var(--danger); color: #fff; }
.act-submit { background: var(--accent); color: #fff; }
.act-submit[disabled] { background: var(--bar-bg); color: var(--text-secondary); }
.act-close {
	width: 100%; height: 40px; border-radius: 20px; font-size: 14px;
	border: none; background: transparent; color: var(--text-secondary);
}

/* 反馈输入 */
.feedback-input {
	width: 100%; height: 120px; padding: 12px;
	background: var(--input-bg); border-radius: 12px;
	font-size: 14px; color: var(--text-primary); box-sizing: border-box;
}
.char-count { font-size: 12px; color: var(--text-secondary); text-align: right; margin: 4px 0 12px; display: block; }

/* 背景选择弹窗 */
.picker-modal {
	width: 85%; max-height: 80vh; overflow-y: auto; padding: 30rpx;
}
.picker-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
.picker-item { display: flex; flex-direction: column; align-items: center; padding: 8px 4px; border-radius: 14px; background: var(--card-bg); transition: transform 0.15s ease, box-shadow 0.15s ease; }
.picker-item:active { transform: scale(0.95); }
.picker-item.selected { box-shadow: 0 0 0 3px var(--accent); }
.picker-item.disabled { opacity: 0.5; pointer-events: none; }
.picker-preview { width: 100%; height: 80px; border-radius: 12px; margin-bottom: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background-color: var(--input-bg); background-size: cover; background-position: center; }
.bg-none-text { font-size: 12px; color: var(--text-secondary); }
.picker-coming { font-size: 11px; color: #fff; background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 8px; }
.picker-icon { font-size: 20px; margin-bottom: 2px; }
.picker-name { font-size: 12px; color: var(--text-primary); }

.picker-title {
	font-size: 18px; font-weight: 600; color: var(--text-primary);
	text-align: center; margin-bottom: 20rpx; display: block;
}

/* 背景选择 */
.bg-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
.bg-item { text-align: center; padding: 6px; border-radius: 14px; transition: all 0.2s; }
.bg-item.active { background: var(--card-secondary-bg); }
.bg-item.disabled { opacity: 0.5; pointer-events: none; }
.bg-preview {
	width: 100%; height: 72px; border-radius: 12px;
	margin-bottom: 6px; overflow: hidden;
	display: flex; align-items: center; justify-content: center;
	border: 2px solid transparent; transition: border-color 0.2s;
}
.bg-item.active .bg-preview { border-color: var(--accent); }
.bg-none { background: var(--input-bg); }
.bg-none-text { font-size: 12px; color: var(--text-secondary); }
.bg-coming { font-size: 11px; color: #fff; background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 8px; }
.bg-name { font-size: 13px; color: var(--text-primary); display: block; }
.bg-desc { font-size: 10px; color: var(--text-secondary); display: block; margin-top: 1px; }

/* 账户管理 */
.account-notice { font-size: 12px; color: var(--text-secondary); text-align: center; display: block; margin-bottom: 16px; }
.account-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; max-height: 200px; overflow-y: auto; }
.account-row {
	display: flex; align-items: center; padding: 12px;
	background: var(--input-bg); border-radius: 12px; gap: 12px;
}
.account-row.current { background: var(--card-secondary-bg); }
.acc-avatar {
	width: 36px; height: 36px; border-radius: 50%;
	background: var(--accent); color: var(--white);
	display: flex; align-items: center; justify-content: center;
	font-size: 16px; font-weight: 600; flex-shrink: 0;
}
.acc-info { flex: 1; display: flex; align-items: center; gap: 8px; }
.acc-name { font-size: 14px; color: var(--text-primary); font-weight: 500; }
.acc-tag { font-size: 10px; color: var(--accent); background: var(--card-bg); padding: 2px 8px; border-radius: 8px; }
.acc-actions { display: flex; gap: 6px; }
.acc-btn {
	font-size: 12px; padding: 6px 12px; border-radius: 12px; border: none;
}
.acc-switch { background: var(--accent); color: #fff; }
.acc-delete { background: var(--input-bg); color: var(--text-secondary); }
.acc-delete[disabled] { opacity: 0.4; }
.add-account-row { display: flex; gap: 8px; align-items: center; margin-bottom: 16px; }
.acc-input {
	flex: 1; height: 40px; padding: 0 12px;
	background: var(--input-bg); border-radius: 12px;
	font-size: 14px; color: var(--text-primary);
}
</style>
