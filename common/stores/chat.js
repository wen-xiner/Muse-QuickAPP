// 聊天状态管理
import { reactive } from 'vue';
import {
	getChatHistory, saveChatHistory, getChatSessions, clearChatHistory
} from '../utils/storage.js';

class ChatStore {
	constructor() {
		this.state = reactive({
			sessions: [],
			currentSceneId: '',
			loaded: false
		});
	}

	get sessions() { return this.state.sessions; }
	get currentSceneId() { return this.state.currentSceneId; }

	/** 加载会话列表 */
	loadSessions() {
		this.state.sessions = getChatSessions();
		this.state.loaded = true;
	}

	/** 获取指定场景的聊天记录 */
	getHistory(sceneId) {
		return getChatHistory(sceneId);
	}

	/** 保存聊天记录 */
	saveHistory(sceneId, data) {
		saveChatHistory(sceneId, data);
		this.loadSessions();
	}

	/** 清除聊天记录 */
	clearHistory(sceneId) {
		clearChatHistory(sceneId);
		this.loadSessions();
	}

	/** 设置当前场景 */
	setCurrentScene(sceneId) {
		this.state.currentSceneId = sceneId;
	}
}

export const chatStore = new ChatStore();
