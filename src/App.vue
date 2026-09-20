<script>
	import { hasCompletedOnboarding, getSettings, getDiaries } from './common/utils/storage.js';
	import { getAccountList, createAccount, switchAccount, getCurrentAccountId } from './common/utils/account.js';
	import { useBackgroundStore } from './common/utils/reactiveBackgroundStore.js';

	const bgStore = useBackgroundStore();

	/** 将背景 store 状态同步到 DOM CSS 变量（供外部调用） */
	function applyThemeToDocument() {
		try {
			const html = document && document.documentElement;
			if (!html) return;

			const settings = getSettings() || {};
			const isDark = settings.darkMode;
			if (isDark) html.classList.add('dark');
			else html.classList.remove('dark');

			bgStore.refresh();
			const varMap = bgStore.getCssVarMap();
			let hasAnyBg = false;
			Object.keys(varMap).forEach(name => {
				const val = varMap[name];
				if (val) {
					html.style.setProperty(name, val);
					hasAnyBg = true;
				} else {
					html.style.removeProperty(name);
				}
			});

			if (hasAnyBg) {
				html.classList.add('has-custom-bg');
			} else {
				html.classList.remove('has-custom-bg');
			}
		} catch (e) {
			console.warn('[App] applyTheme 失败:', e);
		}
	}

	// 挂载到全局，方便其他页面触发刷新
	if (typeof window !== 'undefined') {
		window.__applyTheme = applyThemeToDocument;
	}

	export default {
		onLaunch: function () {
			const accounts = getAccountList();
			let currentId = getCurrentAccountId();

			if (accounts.length === 0) {
				uni.reLaunch({ url: '/pages/login/index' });
				return;
			}
			if (currentId === 'default' || !accounts.find(a => a.id === currentId)) {
				switchAccount(accounts[0].id);
			}
			if (currentId === 'default' || currentId === '__logged_out__') {
				uni.reLaunch({ url: '/pages/login/index' });
				return;
			}

			bgStore.refresh();
			this._preloadData();
			applyThemeToDocument();

			if (!hasCompletedOnboarding()) {
				uni.navigateTo({ url: '/pages/onboarding/index' });
			}
		},
		onShow: function () {
			applyThemeToDocument();
		},
		onHide: function () {
			console.log('App Hide');
		},
		methods: {
			_preloadData() {
				try { getDiaries(); getSettings(); } catch (e) {}
			}
		}
	};
</script>

<style>
	@import "./common/styles/common.scss";
</style>
