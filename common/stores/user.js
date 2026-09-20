// 用户设置状态管理
import { reactive } from 'vue';
import { getUserInfo, saveUserInfo, getSettings, saveSettings } from '../utils/storage.js';

const DEFAULT_SETTINGS = {
	autoWarning: true,
	voiceGuide: true,
	vibration: true,
	backgroundMusic: false,
	darkMode: false
};

class UserStore {
	constructor() {
		this.state = reactive({
			userInfo: { nickname: '用户', avatar: '' },
			settings: { ...DEFAULT_SETTINGS }
		});
	}

	get userInfo() { return this.state.userInfo; }
	get settings() { return this.state.settings; }

	/** 加载用户数据 */
	load() {
		this.state.userInfo = getUserInfo();
		this.state.settings = getSettings();
	}

	/** 保存用户信息 */
	saveInfo(info) {
		Object.assign(this.state.userInfo, info);
		saveUserInfo(this.state.userInfo);
	}

	/** 更新单个设置项 */
	updateSetting(key, value) {
		this.state.settings[key] = value;
		saveSettings(this.state.settings);
	}

	/** 切换暗黑模式 */
	toggleDarkMode(enabled) {
		this.updateSetting('darkMode', enabled);
		if (enabled) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}
}

export const userStore = new UserStore();
