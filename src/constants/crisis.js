// 危机关键词列表
export const CRISIS_KEYWORDS = [
	'自杀', '自残', '轻生', '不想活', '活不下去', '死了一了百了', '割腕', '跳楼', '安眠药',
	'想死', '去死', '死了算了', '结束生命', '了结自己', '自我了断', '上吊', '跳河', '跳海',
	'烧炭', '吃安眠药', '闷死', '撞墙', '割脉', '割手臂', '划手臂', '自伤', '自虐',
	'zs', '紫砂', '想要紫砂', '好似', '重开', '投胎', '下一世', '解脱', '累了毁灭',
	'活着没意思', '活着好累', '人生无望', '没有希望', '一切都完了', '没人需要我',
	'我是累赘', '我不配活着', '我该死', '我不该出生', '没人爱我', '毫无价值',
	'撑不下去了', '坚持不住了', '快要崩溃', '无法忍受', '痛苦到极点', '不想再醒',
	'希望一觉不起', '永远睡着', '消失吧', '蒸发', '人间蒸发',
	'被霸凌', '校园霸凌', '被欺负', '孤立', '被网暴', '想报复', '杀掉', '杀了ta',
	'催吐', '暴食', '节食到死', '厌食', '不吃东西',
	'酗酒', '喝药', '嗱药', '滥用药物', '躯体化'
];

// 高危关键词：单次命中即触发（不需要两次以上匹配）
const HIGH_RISK_WORDS = ['自杀', '自残', '想死', '轻生', '割腕', '跳楼', '安眠药', '烧炭'];

// 否定语境排除模式
const NEGATION_PATTERNS = [
	/不(想|会|要|可能|打算|敢).{0,3}(自杀|轻生|自残|死)/,
	/没有.{0,3}(自杀|轻生|自残)的(想法|念头|打算)/,
	/不会.{0,5}(自杀|轻生|自残)/,
];

/**
 * 智能危机检测
 * - 高危关键词：单次命中即触发
 * - 普通关键词：需要 ≥ 2 个同时命中才触发
 * - 否定语境排除："我不想自杀"不触发
 */
export function detectCrisis(text) {
	if (!text || text.trim().length === 0) return false;

	const lowerText = text.toLowerCase();

	// 排除否定语境
	for (const pattern of NEGATION_PATTERNS) {
		if (pattern.test(text)) {
			return false;
		}
	}

	// 高危关键词：单次命中即触发
	for (const word of HIGH_RISK_WORDS) {
		if (lowerText.includes(word)) return true;
	}

	// 普通关键词：需要 ≥ 2 个同时命中
	let matchCount = 0;
	for (const keyword of CRISIS_KEYWORDS) {
		if (lowerText.includes(keyword)) {
			matchCount++;
			if (matchCount >= 2) return true;
		}
	}

	return false;
}
