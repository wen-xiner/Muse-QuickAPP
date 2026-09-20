// ===== 背景元数据 =====
// 纯数据描述，不含任何颜色值/渐变/图片 URL
// 视觉资源统一在 backgroundThemes.js 中管理

export const BACKGROUNDS = [
	{
		id: 'mist_forest',
		name: '晨雾森林',
		category: '自然系',
		type: 'image',
		resourceKey: 'mistForest',
		icon: '🌿',
		scenario: '日常记录',
		ready: true
	},
	{
		id: 'ocean_wave',
		name: '海波纹',
		category: '自然系',
		type: 'image',
		resourceKey: 'oceanWave',
		icon: '🌊',
		scenario: '情绪平静时',
		ready: true
	},
	{
		id: 'watercolor',
		name: '水彩晕染',
		category: '抽象系',
		type: 'gradient',
		resourceKey: 'watercolor',
		icon: '🎨',
		scenario: '表达柔软情绪',
		ready: false
	},
	{
		id: 'sunset',
		name: '薄暮渐变',
		category: '抽象系',
		type: 'gradient',
		resourceKey: 'sunset',
		icon: '🌅',
		scenario: '日落时分记录',
		ready: false
	},
	{
		id: 'starry',
		name: '星月夜',
		category: '陪伴系',
		type: 'image',
		resourceKey: 'starry',
		icon: '🌙',
		scenario: '夜间使用',
		ready: false
	},
	{
		id: 'cat',
		name: '猫与窗台',
		category: '陪伴系',
		type: 'image',
		resourceKey: 'cat',
		icon: '🐱',
		scenario: '感到孤独时',
		ready: false
	}
];

export const DEFAULT_BG_ID = '';
