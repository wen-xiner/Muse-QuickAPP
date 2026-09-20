// ===== AI 服务层（心理疏导场景优化版）=====
// 特性：超时控制 + 重试 + 请求去重 + 智能摘要压缩 + 输入校验
import API_CONFIG from './config.js';
import { logError } from './logger.js';

// ===== 配置常量 =====
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 15000;
const CHAT_TIMEOUT = 20000;
const MAX_INPUT_LENGTH = 500;

// 心理疏导对话窗口策略：
// - ≤50 轮：完整保留全部历史，不截断
// - >50 轮：AI 摘要压缩前 30 轮，保留最近 20+ 轮完整内容
const MAX_FULL_HISTORY_ROUNDS = 50;
const SUMMARY_TRIGGER_ROUNDS = 30;

// ===== 请求去重 =====
const _pendingRequests = new Map();

// ===== 输入校验 =====
function sanitizeInput(text) {
	if (!text || typeof text !== 'string') return '';
	return text.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

// ===== 场景上下文 =====
const SCENE_CONTEXT = {
	'confused': '用户感到心里有些乱，说不清楚具体原因，需要温暖陪伴',
	'study': '用户关注学习压力、考试、作业相关话题',
	'relationship': '用户关注人际关系、朋友同学相处相关话题',
	'family': '用户关注家庭关系、父母沟通相关话题',
	'future': '用户关注未来规划、职业选择相关话题',
	'emotion': '用户关注情绪管理、情绪调节相关话题',
	'self_doubt': '用户关注自我怀疑、缺乏自信相关话题'
};

// ===== AI 客户端类 =====
class AIClient {
	constructor() {
		this._summaryCache = new Map(); // 对话摘要缓存，避免重复生成
	}

	/**
	 * 核心请求方法：超时 + 重试 + 去重
	 */
	async request(messages, options = {}) {
		const { timeout = REQUEST_TIMEOUT, retries = MAX_RETRIES } = options;

		// 请求去重：相同消息内容合并为一次请求
		const dedupeKey = JSON.stringify({ model: 'deepseek-v4-flash', messages });
		if (_pendingRequests.has(dedupeKey)) {
			return _pendingRequests.get(dedupeKey);
		}

		const promise = this._doRequest(messages, timeout, retries);
		_pendingRequests.set(dedupeKey, promise);

		try {
			return await promise;
		} finally {
			_pendingRequests.delete(dedupeKey);
		}
	}

	async _doRequest(messages, timeout, retriesLeft) {
		try {
			const response = await uni.request({
				url: API_CONFIG.PROXY_URL,
				method: 'POST',
				timeout,
				header: {
					'Content-Type': 'application/json',
					'X-Access-Token': API_CONFIG.ACCESS_TOKEN
				},
				data: {
					model: 'deepseek-v4-flash',
					messages,
					max_tokens: 1000,
					temperature: 0.7
				}
			});

			if (response.statusCode === 200) {
				return response.data.choices[0].message.content;
			}

			// HTTP 错误
			const errorMsg = `API错误 (${response.statusCode}): ${JSON.stringify(response.data)}`;
			console.error(errorMsg);
			throw new Error(errorMsg);
		} catch (error) {
			// 超时或网络错误，尝试重试
			if (retriesLeft > 0) {
				console.warn(`[AI] 请求失败，${retriesLeft}次重试剩余...`, error.message);
				await new Promise(r => setTimeout(r, 1000));
				return this._doRequest(messages, timeout, retriesLeft - 1);
			}
			logError('ai_request', error);
			throw error;
		}
	}

	/**
	 * 日记分析
	 */
	async analyzeDiary(content, emotion, intensity) {
		if (!content || content.trim().length === 0) {
			throw new Error('日记内容不能为空');
		}
		const sanitized = sanitizeInput(content).substring(0, MAX_INPUT_LENGTH);

		const messages = [
			{
				role: 'system',
				content: '你是一位专业的心理健康助手。请以JSON格式回复用户的问题。'
			},
			{
				role: 'user',
				content: [
					'分析用户的情绪日记：',
					`情绪类型：${emotion}`,
					`强度等级：${intensity}/10`,
					`日记内容：${sanitized}`,
					'',
					'请从以下三个方面分析：',
					'1. 优势（strengths）：用户做得好的地方',
					'2. 改进建议（improvements）：可以改进的地方',
					'3. 应对建议（recommendations）：具体的应对方法',
					'',
					'请用JSON格式返回，包含strengths、improvements、recommendations三个数组，每个数组2-3条建议。'
				].join('\n')
			}
		];

		try {
			const result = await this.request(messages);
			return this._parseJSON(result);
		} catch (error) {
			logError('diary_analysis', error);
			return getFallbackDiaryAnalysis();
		}
	}

	/**
	 * AI 聊天（心理疏导核心方法）
	 * 50 轮以内完整保留，超出后智能摘要压缩
	 */
	async chat(message, scene = 'general', history = []) {
		const sanitized = sanitizeInput(message).substring(0, MAX_INPUT_LENGTH);

		const systemPrompt = {
			role: 'system',
			content: [
				'你是一位温暖、专业的AI心理助手。请：',
				'1. 倾听并理解用户的感受',
				'2. 给出温暖、支持性的回应',
				'3. 提供实用的建议（但不能替代专业治疗）',
				'4. 如果用户提到自残、自杀等危机内容，请引导他们寻求专业帮助',
				'',
				`当前场景：${SCENE_CONTEXT[scene] || '用户有一般的心理困惑'}`
			].join('\n')
		};

		const totalRounds = Math.floor(history.length / 2);

		if (totalRounds <= MAX_FULL_HISTORY_ROUNDS) {
			// 50 轮以内：完整保留，不截断
			const messages = [systemPrompt];
			for (const msg of history) {
				messages.push({
					role: msg.role === 'ai' ? 'assistant' : 'user',
					content: msg.content
				});
			}
			messages.push({ role: 'user', content: sanitized });
			return this.request(messages, { timeout: CHAT_TIMEOUT });
		}

		// 超过 50 轮：对前 30 轮生成摘要（缓存复用），保留最近 20+ 轮完整对话
		const earlyMessages = history.slice(0, SUMMARY_TRIGGER_ROUNDS * 2);
		const recentHistory = history.slice(-(MAX_FULL_HISTORY_ROUNDS - SUMMARY_TRIGGER_ROUNDS) * 2);

		const summary = await this._getOrCreateSummary(scene, earlyMessages);

		const messages = [
			systemPrompt,
			{ role: 'system', content: `[前序对话摘要，帮助你理解上下文] ${summary}` },
			...recentHistory.map(msg => ({
				role: msg.role === 'ai' ? 'assistant' : 'user',
				content: msg.content
			})),
			{ role: 'user', content: sanitized }
		];

		return this.request(messages, { timeout: CHAT_TIMEOUT });
	}

	/**
	 * 获取或生成对话摘要（缓存复用，避免重复调用 AI）
	 */
	async _getOrCreateSummary(sceneId, earlyMessages) {
		const cacheKey = `summary:${sceneId}:${earlyMessages.length}`;
		if (this._summaryCache.has(cacheKey)) {
			return this._summaryCache.get(cacheKey);
		}

		const summaryPrompt = [
			{
				role: 'system',
				content: '请用300字以内总结以下心理疏导对话的核心内容：用户的主要困扰、已探讨过的话题、AI给出的关键建议。只输出摘要文本，不要加任何前缀。'
			},
			{
				role: 'user',
				content: earlyMessages
					.map(m => `${m.role === 'ai' ? 'AI' : '用户'}: ${m.content}`)
					.join('\n')
			}
		];

		try {
			const summary = await this.request(summaryPrompt, { timeout: 10000 });
			this._summaryCache.set(cacheKey, summary);
			return summary;
		} catch (error) {
			logError('chat_summary', error);
			// 摘要生成失败时降级：返回友好提示，不影响对话
			return '（前序对话摘要暂时无法生成，但 AI 仍可根据最近对话理解你的情况）';
		}
	}

	/**
	 * JSON 解析（带降级）
	 */
	_parseJSON(data) {
		try {
			return typeof data === 'string' ? JSON.parse(data) : data;
		} catch {
			return getFallbackDiaryAnalysis();
		}
	}
}

// ===== 降级数据 =====
function getFallbackDiaryAnalysis() {
	return {
		strengths: [
			'你愿意把情绪写下来，说明你没有忽视自己，这本身就是一种力量',
			'能觉察到自己的状态，已经走在很多人前面了'
		],
		improvements: [
			'现在不需要急着改变什么，先陪自己待一会儿就好'
		],
		recommendations: [
			'喝口水，或者站起来走两步，让身体先放松下来',
			'问自己一个简单的问题："如果现在我放下所有"应该"，我会想做什么？"',
			'也可以什么都不做，安静地呼吸10次',
			'如果你愿意，可以在心里轻轻对自己说一句："辛苦了，我知道你在努力"',
			'允许自己暂时"不处理好一切"，只做一件小事就够了'
		],
		note: '✨ 先给你一些简单的小建议，完整分析马上回来～'
	};
}

// ===== 单例导出 =====
const aiClient = new AIClient();

// 保持向后兼容的具名导出
export const analyzeDiary = (content, emotion, intensity) =>
	aiClient.analyzeDiary(content, emotion, intensity);

export const chatWithAI = (message, scene, history) =>
	aiClient.chat(message, scene, history);

// 底层 API（仅用于摘要生成等内部场景）
export const callAI = (messages, context = {}) =>
	aiClient.request(messages, context);

export default aiClient;
