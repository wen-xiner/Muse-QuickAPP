// ===== 智能危机检测 =====
// 混合策略：中文关键词 + 英文正则模式，覆盖更多表达方式，不依赖海量词库

// ---- 中文高危词：单次命中即触发 ----
const HIGH_RISK_CN = [
	'自杀', '自残', '轻生', '割腕', '跳楼', '安眠药', '烧炭', '上吊', '跳河', '跳海',
	'割脉', '割手臂', '划手臂', '吃安眠药', '自伤', '自虐', '杀了ta', '杀掉'
];

// ---- 中文普通词：需 ≥ 2 个同时命中 ----
const NORMAL_CN = [
	'不想活', '活不下去', '死了一了百了', '想死', '去死', '死了算了',
	'结束生命', '了结自己', '自我了断', '闷死', '撞墙',
	'zs', '紫砂', '想要紫砂', '好似', '重开', '投胎', '下一世', '解脱', '累了毁灭',
	'活着没意思', '活着好累', '人生无望', '没有希望', '一切都完了', '没人需要我',
	'我是累赘', '我不配活着', '我该死', '我不该出生', '没人爱我', '毫无价值',
	'撑不下去了', '坚持不住了', '快要崩溃', '无法忍受', '痛苦到极点', '不想再醒',
	'希望一觉不起', '永远睡着', '消失吧', '蒸发', '人间蒸发',
	'被霸凌', '校园霸凌', '被欺负', '孤立', '被网暴', '想报复',
	'催吐', '暴食', '节食到死', '厌食', '不吃东西',
	'酗酒', '喝药', '嗱药', '滥用药物', '躯体化'
];

// ---- 英文正则模式：一个模式覆盖几十种变体，比堆关键词高效 ----
const CRISIS_PATTERNS_EN = [
	// 自杀/自残意图
	/\bkill\s+(myself|me|herself|himself|yourself)\b/i,
	/\bend\s+(my|this)\s+(life|lives|suffering|pain|misery)\b/i,
	/\btake\s+my\s+own\s+life\b/i,
	/\bsuicid(e|al)\b/i,
	/\bself[\s-]?harm\b/i,

	// 想死/不想活
	/\b(want|wanna)\s+(to\s+)?(die|disappear|end\s+(it|this|everything|all))\b/i,
	/\b(don'?t|not?)\s+want\s+to\s+(live|exist|be\s+(here|alive|around))\b/i,
	/\bno\s+reason\s+to\s+(live|go\s+on|exist|stay)\b/i,
	/\bbetter\s+off\s+dead\b/i,
	/\bwish\s+(i|he|she)\s+(was|were)\s+dead\b/i,

	// 无法忍受/想消失
	/\bcan'?t\s+(go\s+on|take\s+(it|this|anymore)|handle\s+(this|it)|do\s+this)\b/i,
	/\b(want|wanna)\s+(to\s+)?(disappear|vanish|fade\s+away)\b/i,
	/\bi\s+(just\s+)?(want|wanna)\s+(it\s+to\s+)?(end|stop)\b/i,

	// 自伤意图
	/\b(hurt|harm|cut|injure)\s+(myself|yourself)\b/i,
	/\b(hurting|harming|cutting|injuring)\s+(myself|yourself)\b/i,

	// 绝望表达
	/\b(there'?s|there\s+is)\s+no\s+(hope|point|way\s+out)\b/i,
	/\beveryone\s+would\s+be\s+better\s+off\b/i,
	/\bi'?m\s+(a\s+)?(burden|worthless|useless|hopeless)\b/i,
];

// ---- 否定语境排除（中文 + 英文）----
const NEGATION_PATTERNS = [
	/不(想|会|要|可能|打算|敢).{0,3}(自杀|轻生|自残|死)/,
	/没有.{0,3}(自杀|轻生|自残)的(想法|念头|打算)/,
	/不会.{0,5}(自杀|轻生|自残)/,
	/\b(don'?t|not|never|won'?t)\s+(want|gonna)\s+(kill|hurt|die|suicide)\b/i,
	/\bno\s+(suicidal|self-harm)\s+(thoughts|ideation|intent)\b/i,
];

/**
 * 危机检测（优化版）
 * 策略不变：高优先级词单次命中 → 普通词需 ≥2 个 → 英文模式单次命中
 * 新增：英文正则覆盖，不依赖海量词库
 */
export function detectCrisis(text) {
	if (!text || text.trim().length === 0) return false;

	// 排除否定语境
	for (const pattern of NEGATION_PATTERNS) {
		if (pattern.test(text)) return false;
	}

	const lowerText = text.toLowerCase();

	// 第一层：中文高危词（单次命中即触发）
	for (const word of HIGH_RISK_CN) {
		if (lowerText.includes(word)) return true;
	}

	// 第二层：英文正则模式（单次命中即触发）
	for (const pattern of CRISIS_PATTERNS_EN) {
		if (pattern.test(text)) return true;
	}

	// 第三层：中文普通词（需要 ≥ 2 个）
	let matchCount = 0;
	for (const keyword of NORMAL_CN) {
		if (lowerText.includes(keyword)) {
			matchCount++;
			if (matchCount >= 2) return true;
		}
	}

	return false;
}

/**
 * 危机干预建议
 * 检测到危机内容时，返回温暖的引导文案和求助资源
 */
export function getCrisisSuggestion() {
	return {
		message: '你的感受很重要，也完全可以被理解。如果你现在感到非常难过、孤独，或者有伤害自己的想法，请一定记住：你不需要一个人扛着。',
		hotline: '400-161-9995',
		hotlineName: '全国24小时心理援助热线',
		resources: [
			{ name: '北京心理危机研究与干预中心', phone: '010-82951332' },
			{ name: '希望24热线', phone: '400-161-9995' },
			{ name: '青少年心理援助热线', phone: '12355' },
		],
		promptText: '如果你愿意，可以和AI聊聊现在的感受，不用想怎么描述，想到什么就说什么。',
	};
}

// 保留旧接口兼容性
export const CRISIS_KEYWORDS = [...HIGH_RISK_CN, ...NORMAL_CN];
