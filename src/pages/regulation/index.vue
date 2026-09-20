<template>
	<view class="page">
		<view class="header-section">
			<text class="header-title">情绪调节</text>
			<text class="header-subtitle">选择一个练习方式，帮助你放松身心</text>
		</view>

		<!-- 呼吸练习 -->
		<view class="breathing-card card" @tap="startBreathing">
			<view class="breathing-visual">
				<view class="breathing-ball" :class="breathingPhase">
					<text class="ball-text">{{ breathingInstruction }}</text>
				</view>
			</view>
			<text class="breathing-title">{{ currentPattern.name }}</text>
			<text class="breathing-desc">
				吸气{{ currentPattern.inhale }}秒 → 屏息{{ currentPattern.hold }}秒 → 呼气{{ currentPattern.exhale }}秒
			</text>
			<view class="pattern-selector">
				<view v-for="(pattern, key) in patterns" :key="key"
					class="pattern-btn" :class="{ active: selectedPattern === key }"
					@tap.stop="selectPattern(key)">
					<text class="pattern-name">{{ pattern.name }}</text>
				</view>
			</view>
		</view>

		<!-- 更多练习方式 -->
		<view class="exercise-card card">
			<text class="card-title">更多练习方式</text>
			<view class="exercise-list">
				<view class="exercise-item" @tap="startMeditation">
					<text class="exercise-icon">🧘</text>
					<view class="exercise-info">
						<text class="exercise-name">正念冥想</text>
						<text class="exercise-desc">3分钟呼吸引导，专注当下</text>
					</view>
					<text class="exercise-arrow">›</text>
				</view>
				<view class="exercise-item" @tap="goToDiary">
					<text class="exercise-icon">✍️</text>
					<view class="exercise-info">
						<text class="exercise-name">情绪书写</text>
						<text class="exercise-desc">用文字释放内心的情绪</text>
					</view>
					<text class="exercise-arrow">›</text>
				</view>
				<view class="exercise-item" @tap="toggleMusic">
					<text class="exercise-icon">{{ isMusicPlaying ? '🔊' : '🎵' }}</text>
					<view class="exercise-info">
						<text class="exercise-name">音乐疗愈</text>
						<text class="exercise-desc">{{ isMusicPlaying ? '正在播放 · 点击停止' : '舒缓音调，放松神经' }}</text>
					</view>
					<text class="exercise-arrow">{{ isMusicPlaying ? '⏹' : '▶' }}</text>
				</view>
			</view>
		</view>

		<!-- 练习设置 -->
		<view class="settings-card card">
			<text class="card-title">练习设置</text>
			<view class="setting-item">
				<text class="setting-label">语音引导</text>
				<switch :checked="settings.voiceGuide" color="#9B7BB5" @change="onVoiceChange" />
			</view>
			<view class="setting-item">
				<text class="setting-label">震动反馈</text>
				<switch :checked="settings.vibration" color="#9B7BB5" @change="onVibrationChange" />
			</view>
			<view class="setting-item">
				<text class="setting-label">练习时长</text>
				<view class="duration-selector">
					<view v-for="duration in durations" :key="duration"
						class="duration-btn" :class="{ active: selectedDuration === duration }"
						@tap="selectDuration(duration)">
						<text class="duration-text">{{ duration }}分钟</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 呼吸练习弹窗 -->
		<view class="modal-overlay" v-if="isExercising" @tap="stopExercise">
			<view class="exercise-modal card" @tap.stop>
				<text class="modal-phase">{{ phaseLabel }}</text>
				<view class="modal-ball" :class="breathingPhase">
					<text class="modal-count">{{ countdown }}</text>
				</view>
				<text class="modal-hint">{{ breathingHint }}</text>
				<view class="modal-progress">
					<progress :percent="exerciseProgress" activeColor="#9B7BB5" show-info="false" />
					<text class="progress-text">{{ formatTime(elapsedTime) }} / {{ formatTime(selectedDuration * 60) }}</text>
				</view>
				<button class="btn-secondary stop-btn" @tap="stopExercise">结束练习</button>
			</view>
		</view>

		<!-- 正念冥想弹窗 -->
		<view class="modal-overlay" v-if="isMeditating">
			<view class="meditation-modal card">
				<text class="modal-title">🧘 正念冥想</text>

				<!-- 闭眼引导：无需看屏幕 -->
				<view class="med-visual">
					<text class="med-stage-icon">{{ medStageIcon }}</text>
					<text class="med-stage-name">{{ medStageName }}</text>
				</view>

				<!-- 当前引导词 -->
				<view class="med-guide-box">
					<text class="med-guide-text">"{{ medGuideText }}"</text>
				</view>

				<!-- 进度与计时 -->
				<view class="med-info-row">
					<text class="med-info-item">⏱ {{ formatTime(medElapsed) }}</text>
					<text class="med-info-item">🎯 {{ formatTime(medDuration) }}</text>
					<text class="med-info-item" v-if="medVoiceEnabled">🔊 语音引导中</text>
				</view>

				<view class="modal-progress">
					<progress :percent="medProgress" activeColor="#9B7BB5" show-info="false" />
				</view>

				<view class="med-actions">
					<button class="med-btn med-pause" @tap="toggleMedPause">
						{{ medPaused ? '▶ 继续' : '⏸ 暂停' }}
					</button>
					<button class="med-btn med-end" @tap="stopMeditation">结束练习</button>
				</view>
			</view>
		</view>

		<!-- 音乐疗愈控制条（播放时显示） -->
		<view class="music-bar" v-if="isMusicPlaying" @tap="toggleMusic">
			<text class="music-icon">🎵</text>
			<text class="music-text">音乐疗愈播放中…</text>
			<text class="music-stop">⏹ 停止</text>
		</view>
	</view>
</template>

<script>
import { BREATHING_PATTERNS } from '../../common/constants/breathing.js';
import { getSettings, saveSettings } from '../../common/utils/storage.js';

const PHASE_CONFIG = {
	inhale: { next: 'hold', label: '吸气', hint: '深吸气，保持腹部膨胀' },
	hold:   { next: 'exhale', label: '屏息', hint: '保持气息，不要呼气' },
	exhale: { next: 'inhale', label: '呼气', hint: '缓慢呼出所有气息' }
};

// 冥想引导阶段
const MED_PHASES = [
	{ duration: 15, text: '吸气', hint: '慢慢吸气，感受空气进入身体', phase: 'inhale' },
	{ duration: 60, text: '专注', hint: '将注意力放在呼吸上，让思绪自然流过', phase: 'focus' },
	{ duration: 15, text: '放松', hint: '慢慢呼气，让身体每一块肌肉放松', phase: 'exhale' },
];

export default {
	data() {
		return {
			patterns: BREATHING_PATTERNS,
			selectedPattern: '4-7-8',
			durations: [3, 5, 10],
			selectedDuration: 3,
			settings: { voiceGuide: true, vibration: true, backgroundMusic: false },
			// 呼吸
			isExercising: false, breathingPhase: 'inhale',
			breathingInstruction: '点击开始', countdown: 0, breathingHint: '',
			elapsedTime: 0, exerciseTimer: null, phaseTimer: null,
			// 冥想
			isMeditating: false, medElapsed: 0, medDuration: 180, medTimer: null,
			medStageIcon: '🧘', medStageName: '准备开始', medGuideText: '',
			medPaused: false, medVoiceEnabled: false, medStageIdx: 0, medProgress: 0,
			// 音乐
			isMusicPlaying: false, audioCtx: null, musicNodes: null,
		};
	},
	computed: {
		currentPattern() { return this.patterns[this.selectedPattern]; },
		exerciseProgress() { return Math.floor((this.elapsedTime / (this.selectedDuration * 60)) * 100); },
		phaseLabel() { return PHASE_CONFIG[this.breathingPhase]?.label || '吸气'; },
	},
	onLoad() { this.loadSettings(); },
	onUnload() { this.stopExercise(); this.stopMeditation(); this.stopMusic(); },
	methods: {
		loadSettings() { this.settings = getSettings(); },
		selectPattern(key) { this.selectedPattern = key; },
		selectDuration(d) { this.selectedDuration = d; },
		onVoiceChange(e) { this.settings.voiceGuide = e.detail.value; saveSettings(this.settings); },
		onVibrationChange(e) { this.settings.vibration = e.detail.value; saveSettings(this.settings); },

		// ===== 呼吸练习 =====
		startBreathing() {
			this.isExercising = true; this.elapsedTime = 0;
			this.startBreathingCycle();
			this.exerciseTimer = setInterval(() => {
				this.elapsedTime++;
				if (this.elapsedTime >= this.selectedDuration * 60) this.completeExercise();
			}, 1000);
		},
		startBreathingCycle() {
			const pattern = this.currentPattern;
			let phase = 'inhale'; let remaining = pattern.inhale;
			this.breathingPhase = phase; this.countdown = remaining;
			this.breathingInstruction = PHASE_CONFIG[phase].label + '...';
			this.breathingHint = PHASE_CONFIG[phase].hint;
			this.triggerVibration();
			this.phaseTimer = setInterval(() => {
				remaining--; this.countdown = remaining;
				if (remaining <= 0) {
					phase = PHASE_CONFIG[phase].next;
					remaining = pattern[phase];
					this.triggerVibration();
					this.breathingPhase = phase;
					this.breathingInstruction = PHASE_CONFIG[phase].label + '...';
					this.breathingHint = PHASE_CONFIG[phase].hint;
				}
			}, 1000);
		},
		triggerVibration() {
			if (this.settings.vibration) { try { uni.vibrateShort({}); } catch {} }
		},
		stopExercise() {
			this.isExercising = false;
			if (this.exerciseTimer) { clearInterval(this.exerciseTimer); this.exerciseTimer = null; }
			if (this.phaseTimer) { clearInterval(this.phaseTimer); this.phaseTimer = null; }
		},
		completeExercise() { this.stopExercise(); uni.showToast({ title: '练习完成！', icon: 'success' }); },

		// ===== 正念冥想（语音引导 + 震动 + 背景音）=====
		startMeditation() {
			// iOS Safari 要求语音必须在用户手势中触发
			// 先初始化 SpeechSynthesis
			if (typeof window !== 'undefined' && window.speechSynthesis) {
				window.speechSynthesis.cancel(); // 清除残留
				// 发一个空 utterance 激活语音引擎
				const init = new SpeechSynthesisUtterance('');
				init.volume = 0;
				window.speechSynthesis.speak(init);
				this.medVoiceEnabled = true;
			}

			this.isMeditating = true;
			this.medElapsed = 0;
			this.medDuration = 180;
			this.medPaused = false;
			this.medStageIdx = 0;

			// 启动背景音
			this.startMusic();

			// 冥想引导脚本：阶段 + 时间点 + 引导词
			this._medScript = [
				// 阶段1：安顿（0-40秒）
				{ at: 3, stage: '安顿', icon: '🧘', text: '找到一个舒服的姿势，坐着或躺着都可以。轻轻闭上眼睛。' },
				{ at: 12, stage: '安顿', icon: '🧘', text: '做一次深长的呼吸。吸气……慢慢呼气，让身体沉下来。' },
				{ at: 25, stage: '安顿', icon: '🧘', text: '再呼吸一次。这一次呼气时，放下今天所有的担忧和忙碌。' },
				{ at: 38, stage: '安顿', icon: '🧘', text: '很好。现在让呼吸回到自然的节奏，不需要控制它。' },

				// 阶段2：身体觉察（40-100秒）
				{ at: 45, stage: '身体觉察', icon: '🌿', text: '把注意力带到头顶。感受那里的温度，或者任何细微的感觉。' },
				{ at: 55, stage: '身体觉察', icon: '🌿', text: '慢慢向下，到你的额头、眼睛、脸颊。让这些部位的肌肉放松下来。' },
				{ at: 68, stage: '身体觉察', icon: '🌿', text: '继续向下，到肩膀和脖子。很多人在这里储存压力，让它们松开。' },
				{ at: 82, stage: '身体觉察', icon: '🌿', text: '到你的胸膛和腹部，感受呼吸带来的起伏。不需要改变什么，只是观察。' },
				{ at: 95, stage: '身体觉察', icon: '🌿', text: '最后到手臂、双手、双腿、双脚。整个身体都在这里，安稳地存在。' },

				// 阶段3：呼吸与临在（100-150秒）
				{ at: 105, stage: '呼吸与临在', icon: '🫁', text: '现在把注意力轻轻放在呼吸上。吸气和呼气之间的那个小小的间隙。' },
				{ at: 118, stage: '呼吸与临在', icon: '🫁', text: '如果念头跑掉了——这非常正常。只是注意到，然后温柔地把注意力带回到呼吸。' },
				{ at: 135, stage: '呼吸与临在', icon: '🫁', text: '不需要评判自己，不需要做得"更好"。此刻，你已经足够了。' },
				{ at: 148, stage: '呼吸与临在', icon: '🫁', text: '在这个安静的空间里，休息一会儿。接下来是三十秒的静默。' },

				// 阶段4：温柔回归（150-180秒）
				{ at: 160, stage: '温柔回归', icon: '☀️', text: '慢慢地，把意识带回到这个房间。感受身体与地面的接触。' },
				{ at: 170, stage: '温柔回归', icon: '☀️', text: '动一动手指和脚趾。当你准备好了，可以轻轻地睁开眼睛。' },
				{ at: 177, stage: '温柔回归', icon: '☀️', text: '带着这份平静，回到你的生活中。你随时可以回到这个安静的地方。' },
			];

			this._medTimer = setInterval(() => {
				if (this.medPaused) return;

				this.medElapsed++;
				this._checkMedScript();
				this.medProgress = Math.floor((this.medElapsed / this.medDuration) * 100);

				if (this.medElapsed >= this.medDuration) {
					this.stopMeditation();
					uni.showToast({ title: '冥想完成，愿你平静', icon: 'success' });
				}
			}, 1000);
		},

		_checkMedScript() {
			const item = this._medScript[this.medStageIdx];
			if (item && this.medElapsed >= item.at) {
				this.medStageName = item.stage;
				this.medStageIcon = item.icon;
				this.medGuideText = item.text;
				this.medStageIdx++;

				// 语音播报
				if (this.medVoiceEnabled) {
					this._speak(item.text);
				}

				// 震动提示阶段切换
				if (this.settings.vibration) {
					try { navigator.vibrate?.(30); } catch {}
				}
			}
		},

		_speak(text) {
			try {
				if (!window.speechSynthesis) return;
				const u = new SpeechSynthesisUtterance(text);
				u.lang = 'zh-CN';
				u.rate = 0.8;   // 慢速，适合冥想
				u.pitch = 1.0;
				u.volume = 0.9;
				window.speechSynthesis.speak(u);
			} catch (e) {
				// 语音不可用时静默降级
			}
		},

		toggleMedPause() {
			this.medPaused = !this.medPaused;
			if (this.medPaused) {
				if (window.speechSynthesis) window.speechSynthesis.pause();
			} else {
				if (window.speechSynthesis) window.speechSynthesis.resume();
			}
		},

		stopMeditation() {
			this.isMeditating = false;
			if (this._medTimer) { clearInterval(this._medTimer); this._medTimer = null; }
			if (window.speechSynthesis) window.speechSynthesis.cancel();
			this.stopMusic();
		},

		// ===== 音乐疗愈（Web Audio API）=====
		toggleMusic() {
			if (this.isMusicPlaying) { this.stopMusic(); return; }
			this.startMusic();
		},
		startMusic() {
			try {
				const AudioCtx = window.AudioContext || window.webkitAudioContext;
				this.audioCtx = new AudioCtx();
				const ctx = this.audioCtx;

				// 主音调：432Hz（舒缓频率）
				const osc1 = ctx.createOscillator();
				const gain1 = ctx.createGain();
				osc1.type = 'sine';
				osc1.frequency.value = 432;
				gain1.gain.value = 0.15;
				osc1.connect(gain1); gain1.connect(ctx.destination);

				// 和声：648Hz（432 * 1.5，纯五度）
				const osc2 = ctx.createOscillator();
				const gain2 = ctx.createGain();
				osc2.type = 'sine';
				osc2.frequency.value = 648;
				gain2.gain.value = 0.08;
				osc2.connect(gain2); gain2.connect(ctx.destination);

				// 低频氛围：216Hz（432 / 2）
				const osc3 = ctx.createOscillator();
				const gain3 = ctx.createGain();
				osc3.type = 'sine';
				osc3.frequency.value = 216;
				gain3.gain.value = 0.1;
				osc3.connect(gain3); gain3.connect(ctx.destination);

				// 缓慢的振幅调制（让声音有"呼吸感"）
				const lfo = ctx.createOscillator();
				const lfoGain = ctx.createGain();
				lfo.type = 'sine';
				lfo.frequency.value = 0.07; // 非常慢的周期，约14秒一个循环
				lfoGain.gain.value = 0.05;
				lfo.connect(lfoGain);
				lfoGain.connect(gain1.gain);
				lfoGain.connect(gain2.gain);

				osc1.start(); osc2.start(); osc3.start(); lfo.start();

				this.musicNodes = { osc1, osc2, osc3, lfo, gain1, gain2, gain3, lfoGain, ctx };
				this.isMusicPlaying = true;
			} catch (e) {
				console.error('音乐疗愈启动失败:', e);
				uni.showToast({ title: '当前设备不支持音频播放', icon: 'none' });
			}
		},
		stopMusic() {
			if (this.musicNodes) {
				const n = this.musicNodes;
				[n.osc1, n.osc2, n.osc3, n.lfo].forEach(o => { try { o.stop(); } catch {} });
				if (n.ctx && n.ctx.state !== 'closed') { try { n.ctx.close(); } catch {} }
				this.musicNodes = null;
			}
			this.isMusicPlaying = false;
		},

		// ===== 情绪书写 =====
		goToDiary() {
			uni.navigateTo({ url: '/pages/diary/edit' });
		},

		formatTime(seconds) {
			const mins = Math.floor(seconds / 60);
			const secs = seconds % 60;
			return `${mins}:${String(secs).padStart(2, '0')}`;
		}
	}
};
</script>

<style scoped>
.page {
	background-color: var(--bg);
	min-height: 100vh;
	padding: 16px;
}
.header-section { text-align: center; margin-bottom: 24px; padding: 20px 0; }
.header-title { font-size: 24px; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 8px; }
.header-subtitle { font-size: 14px; color: var(--text-secondary); }

/* 呼吸练习卡片 */
.breathing-card { padding: 20px; text-align: center; }
.breathing-visual { display: flex; justify-content: center; margin-bottom: 16px; }
.breathing-ball {
	width: 80px; height: 80px;
	background: linear-gradient(135deg, var(--accent), var(--accent-light));
	border-radius: 50%; display: flex; align-items: center; justify-content: center;
	transition: transform 0.5s ease;
}
.breathing-ball.inhale, .breathing-ball.hold { transform: scale(1.2); }
.breathing-ball.exhale { transform: scale(1); }
.ball-text { font-size: 12px; color: var(--white); }
.breathing-title { font-size: 18px; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 4px; }
.breathing-desc { font-size: 12px; color: var(--text-secondary); margin-bottom: 16px; display: block; }
.pattern-selector { display: flex; justify-content: center; gap: 8px; }
.pattern-btn { padding: 8px 16px; border-radius: 16px; background-color: var(--input-bg); }
.pattern-btn.active { background-color: var(--accent); }
.pattern-name { font-size: 12px; color: var(--text-primary); }
.pattern-btn.active .pattern-name { color: var(--white); }

/* 更多练习 */
.exercise-card { padding: 20px; }
.card-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px; display: block; }
.exercise-list { display: flex; flex-direction: column; gap: 10px; }
.exercise-item {
	display: flex; align-items: center; padding: 14px 12px;
	background-color: var(--input-bg); border-radius: 12px;
}
.exercise-icon { font-size: 28px; margin-right: 12px; }
.exercise-info { flex: 1; display: flex; flex-direction: column; }
.exercise-name { font-size: 14px; color: var(--text-primary); font-weight: 500; }
.exercise-desc { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.exercise-arrow { font-size: 20px; color: var(--text-secondary); }

/* 设置 */
.settings-card { padding: 20px; }
.setting-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); }
.setting-item:last-child { border-bottom: none; flex-direction: column; align-items: flex-start; }
.setting-label { font-size: 14px; color: var(--text-primary); }
.duration-selector { display: flex; gap: 8px; margin-top: 12px; }
.duration-btn { padding: 8px 16px; border-radius: 16px; background-color: var(--input-bg); }
.duration-btn.active { background-color: var(--accent); }
.duration-text { font-size: 12px; color: var(--text-primary); }
.duration-btn.active .duration-text { color: var(--white); }

/* 弹窗 */
.modal-overlay {
	position: fixed; inset: 0; z-index: 900;
	background: var(--overlay);
	display: flex; align-items: center; justify-content: center;
}
.exercise-modal { width: 280px; padding: 30px; text-align: center; }
.meditation-modal { width: 280px; padding: 30px; text-align: center; }
.modal-title { font-size: 20px; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 20px; }
.modal-phase { font-size: 20px; color: var(--accent); margin-bottom: 20px; display: block; }
.modal-ball {
	width: 150px; height: 150px;
	background: linear-gradient(135deg, var(--accent), var(--accent-light));
	border-radius: 50%; display: flex; align-items: center; justify-content: center;
	margin: 0 auto 20px; transition: all 0.5s ease;
}
.modal-ball.inhale, .modal-ball.hold { transform: scale(1.3); }
.modal-ball.exhale { transform: scale(1); }
.modal-count { font-size: 48px; font-weight: 300; color: var(--white); }

/* 冥想弹窗 */
.med-visual { text-align: center; margin-bottom: 16px; }
.med-stage-icon { font-size: 48px; display: block; margin-bottom: 4px; }
.med-stage-name { font-size: 16px; color: var(--accent); font-weight: 600; }
.med-guide-box {
	background: var(--card-secondary-bg); border-radius: 16px;
	padding: 20px 16px; margin-bottom: 16px; text-align: center;
}
.med-guide-text { font-size: 15px; color: var(--text-primary); line-height: 1.8; }
.med-info-row {
	display: flex; justify-content: space-around; margin-bottom: 12px;
}
.med-info-item { font-size: 13px; color: var(--text-secondary); }
.med-actions { display: flex; gap: 10px; margin-top: 12px; }
.med-btn {
	flex: 1; height: 44px; border-radius: 22px; font-size: 14px; border: none;
}
.med-pause { background: var(--input-bg); color: var(--text-primary); }
.med-end { background: var(--card-secondary-bg); color: var(--text-secondary); }

.modal-hint { font-size: 14px; color: var(--text-secondary); margin-bottom: 20px; display: block; }
.modal-progress { margin-bottom: 20px; }
.progress-text { font-size: 12px; color: var(--text-secondary); margin-top: 8px; display: block; }
.stop-btn { margin-top: 12px; }

/* 音乐底部控制条 */
.music-bar {
	position: fixed; bottom: 16px; left: 16px; right: 16px; z-index: 800;
	background: var(--accent); border-radius: 24px;
	padding: 12px 20px; display: flex; align-items: center; gap: 12px;
	box-shadow: 0 4px 20px rgba(155,123,181,0.3);
}
.music-icon { font-size: 22px; }
.music-text { flex: 1; font-size: 14px; color: #fff; }
.music-stop { font-size: 14px; color: rgba(255,255,255,0.8); }
</style>
