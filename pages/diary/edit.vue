<template>
	<view class="page">
		<view class="form-card card">
			<view class="form-section">
				<text class="section-title">选择情绪</text>
				<view class="emotions-grid">
					<view
						v-for="emotion in emotions"
						:key="emotion.id"
						class="emotion-item"
						:class="{ selected: form.emotionId === emotion.id }"
						@tap="selectEmotion(emotion)"
					>
						<text class="emotion-emoji">{{ emotion.emoji }}</text>
						<text class="emotion-name">{{ emotion.name }}</text>
					</view>
				</view>
			</view>

			<view class="form-section" v-if="form.emotionId">
				<text class="section-title">情绪强度: {{ form.intensity }}/10</text>
				<slider
					:value="form.intensity"
					min="1"
					max="10"
					step="1"
					activeColor="#9B7BB5"
					@change="onIntensityChange"
				/>
				<view class="intensity-desc">
					<text class="desc-text">{{ getIntensityDesc() }}</text>
				</view>
			</view>

			<view class="form-section" v-if="form.emotionId">
				<text class="section-title">发生了什么？</text>
				<textarea
					class="event-input"
					v-model="form.event"
					placeholder="描述一下今天发生的事..."
					maxlength="500"
				/>
				<text class="char-count">{{ form.event.length }}/500</text>
			</view>

			<view class="form-section" v-if="form.emotionId">
				<text class="section-title">认知偏差标签</text>
				<view class="distortion-tags">
					<view
						v-for="distortion in cognitiveDistortions"
						:key="distortion.id"
						class="distortion-tag"
						:class="{ selected: form.cognitiveDistortion === distortion.id }"
						@tap="selectDistortion(distortion)"
					>
						<text class="tag-name">{{ distortion.name }}</text>
					</view>
				</view>
			</view>

			<view class="form-section" v-if="form.emotionId">
				<view class="ai-toggle">
					<text class="toggle-label">开启AI分析</text>
					<switch
						:checked="form.enableAI"
						color="#9B7BB5"
						@change="onAIChange"
					/>
				</view>
				<text class="ai-hint">AI将分析你的情绪和认知偏差，提供应对建议</text>
			</view>
		</view>

		<button class="btn-primary save-btn" @tap="saveDiary" :disabled="!canSave">
			保存日记
		</button>

		<CrisisModal
			:visible="showCrisisModal"
			:contentSnippet="crisisContentSnippet"
			@close="showCrisisModal = false"
			@chat="onCrisisChat"
		/>
	</view>
</template>

<script>
import { saveDiary, generateId, getDiaryById, addWarningRecord, getSettings } from '../../common/utils/storage.js';
import { formatDate } from '../../common/utils/date.js';
import { EMOTIONS, INTENSITY_LEVELS } from '../../common/constants/emotions.js';
import { COGNITIVE_DISTORTIONS } from '../../common/constants/distortions.js';
import { detectCrisis } from '../../common/constants/crisis.js';
import { analyzeDiary } from '../../services/ai.js';
import { checkNetwork } from '../../common/utils/network.js';
import { logError } from '../../services/logger.js';
import CrisisModal from '../../components/CrisisModal.vue';

export default {
	components: {
		CrisisModal
	},
	data() {
		return {
			emotions: EMOTIONS,
			cognitiveDistortions: COGNITIVE_DISTORTIONS,
			form: {
				id: '',
				date: '',
				emotionId: '',
				intensity: 5,
				event: '',
				cognitiveDistortion: '',
				enableAI: true,
				analyzed: false,
				analyzedAt: null,
				aiResult: null
			},
			isEdit: false,
			isAnalyzing: false,
			showCrisisModal: false,
			crisisContentSnippet: ''
		};
	},
	computed: {
		canSave() {
			return this.form.emotionId && this.form.intensity > 0;
		}
	},
	onLoad(options) {
		if (options.id) {
			this.isEdit = true;
			this.loadDiary(options.id);
		} else {
			if (options.emotionId) {
				this.form.emotionId = options.emotionId;
			}
			if (options.intensity) {
				this.form.intensity = parseInt(options.intensity);
			}
			if (options.date) {
				this.form.date = options.date;
			} else {
				this.form.date = formatDate(new Date(), 'YYYY-MM-DD');
			}
		}
	},
	methods: {
		loadDiary(id) {
			const diary = getDiaryById(id);
			if (diary) {
				this.form = { ...diary };
			}
		},
		selectEmotion(emotion) {
			this.form.emotionId = emotion.id;
		},
		onIntensityChange(e) {
			this.form.intensity = e.detail.value;
		},
		getIntensityDesc() {
			const level = INTENSITY_LEVELS.find(l => l.value === this.form.intensity);
			return level ? level.description : '';
		},
		selectDistortion(distortion) {
			if (this.form.cognitiveDistortion === distortion.id) {
				this.form.cognitiveDistortion = '';
			} else {
				this.form.cognitiveDistortion = distortion.id;
			}
		},
		onAIChange(e) {
			this.form.enableAI = e.detail.value;
		},
		async saveDiary() {
			if (!this.canSave) return;

			if (detectCrisis(this.form.event)) {
				const settings = getSettings();
				if (settings.autoWarning) {
					addWarningRecord({
						reason: '日记内容包含危机关键词',
						source: 'diary',
						detail: this.form.event.substring(0, 100)
					});
				}
				this.crisisContentSnippet = this.form.event;
				this.showCrisisModal = true;
				return;
			}

			if (!this.form.id) {
				this.form.id = generateId();
			}

			if (this.form.enableAI && this.form.event) {
				this.isAnalyzing = true;
				uni.showLoading({ title: 'AI分析中...' });

				const network = await checkNetwork();
				if (!network.online) {
					uni.hideLoading();
					this.isAnalyzing = false;
					uni.showModal({
						title: '网络不可用',
						content: '当前无网络连接，AI分析已跳过。日记已保存成功，联网后可再次编辑开启分析。',
						showCancel: false
					});
				} else {
					try {
						const emotionName = EMOTIONS.find(e => e.id === this.form.emotionId)?.name || '未知';
						const aiResult = await analyzeDiary(this.form.event, emotionName, this.form.intensity);
						this.form.aiResult = aiResult;
						this.form.analyzed = true;
						this.form.analyzedAt = new Date().toISOString();
					} catch (error) {
						logError('diary_save_ai', error);
						uni.showToast({
							title: 'AI分析暂不可用，已使用默认分析',
							icon: 'none',
							duration: 3000
						});
					}

					uni.hideLoading();
					this.isAnalyzing = false;
				}
			}

			saveDiary(this.form);

			uni.showToast({
				title: '保存成功',
				icon: 'success'
			});

			setTimeout(() => {
				uni.navigateBack();
			}, 1500);
		},
		onCrisisChat() {
			this.showCrisisModal = false;
			if (!this.form.id) {
				this.form.id = generateId();
			}
			if (!this.form.date) {
				this.form.date = formatDate(new Date(), 'YYYY-MM-DD');
			}
			saveDiary(this.form);
			uni.navigateTo({
				url: '/pages/chat/conversation?scene=confused&from=crisis'
			});
		}
	}
};
</script>

<style scoped>
.page {
	background-color: var(--bg);
	background-image: var(--diary-bg-image);
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
	background-attachment: fixed;
	min-height: 100vh;
	padding: 16px;
}

.form-card {
	padding: 20px;
}

.form-section {
	margin-bottom: 24px;
}

.section-title {
	font-size: 16px;
	font-weight: 600;
	color: var(--text-primary);
	margin-bottom: 12px;
	display: block;
}

.emotions-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 12px;
}

.emotion-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 12px 8px;
	border-radius: 12px;
	background-color: var(--input-bg);
	transition: all 0.3s;
}

.emotion-item.selected {
	background-color: var(--card-secondary-bg);
}

.emotion-emoji {
	font-size: 28px;
	margin-bottom: 4px;
}

.emotion-name {
	font-size: 12px;
	color: var(--text-primary);
}

.intensity-desc {
	text-align: center;
	margin-top: 8px;
}

.desc-text {
	font-size: 12px;
	color: var(--text-secondary);
}

.event-input {
	width: 100%;
	height: 120px;
	padding: 12px;
	background-color: var(--input-bg);
	border-radius: 12px;
	font-size: 14px;
	color: var(--text-primary);
	box-sizing: border-box;
}

.char-count {
	font-size: 12px;
	color: var(--text-secondary);
	text-align: right;
	margin-top: 4px;
}

.distortion-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.distortion-tag {
	padding: 8px 12px;
	border-radius: 16px;
	background-color: var(--input-bg);
	border: 1px solid var(--bar-bg);
}

.distortion-tag.selected {
	background-color: var(--card-secondary-bg);
	border-color: var(--accent);
}

.tag-name {
	font-size: 12px;
	color: var(--text-primary);
}

.ai-toggle {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.toggle-label {
	font-size: 14px;
	color: var(--text-primary);
}

.ai-hint {
	font-size: 12px;
	color: var(--text-secondary);
	margin-top: 8px;
	display: block;
}

.save-btn {
	margin-top: 20px;
}
</style>
