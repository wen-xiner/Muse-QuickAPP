<template>
  <view class="picker-grid">
    <!-- 无背景 -->
    <view class="picker-item" :class="{ selected: value === '' }" @tap="$emit('change', '')">
      <view class="picker-preview bg-none">
        <text class="bg-none-text">默认</text>
      </view>
      <text class="picker-name">无背景</text>
    </view>
    <!-- 各主题 -->
    <view
      v-for="bg in backgrounds"
      :key="bg.id"
      class="picker-item"
      :class="{ selected: value === bg.id, disabled: !bg.ready }"
      @tap="bg.ready && $emit('change', bg.id)"
    >
      <view class="picker-preview" :style="previewStyle(bg)">
        <text v-if="!bg.ready" class="picker-coming">开发中</text>
      </view>
      <text class="picker-icon">{{ bg.icon }}</text>
      <text class="picker-name">{{ bg.name }}</text>
    </view>
  </view>
</template>

<script>
import { BACKGROUNDS } from '../common/constants/backgrounds.js';
import { useBackgroundStore } from '../common/utils/reactiveBackgroundStore.js';

const store = useBackgroundStore();

export default {
  props: {
    value: { type: String, default: '' }
  },
  computed: {
    backgrounds() { return BACKGROUNDS; }
  },
  methods: {
    previewStyle(bg) {
      if (!bg.ready) return { background: '#e0e0e0' };
      return store.getBgStyle(bg.id, false);
    }
  }
};
</script>

<style scoped>
.picker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.picker-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border-radius: 14px;
  background: var(--card-bg);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.picker-item:active { transform: scale(0.95); }

.picker-item.selected {
  box-shadow: 0 0 0 3px var(--accent);
}

.picker-item.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.picker-preview {
  width: 100%;
  height: 80px;
  border-radius: 12px;
  margin-bottom: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--input-bg);
  background-size: cover;
  background-position: center;
}

.bg-none-text { font-size: 12px; color: var(--text-secondary); }

.picker-coming {
  font-size: 11px; color: #fff;
  background: rgba(0,0,0,0.4);
  padding: 4px 8px; border-radius: 8px;
}

.picker-icon { font-size: 20px; margin-bottom: 2px; }

.picker-name { font-size: 12px; color: var(--text-primary); }
</style>
