<template>
  <view class="bg-viewport">
    <!-- 旧背景层：fade-out -->
    <view
      v-if="oldStyle"
      class="bg-layer bg-layer-old"
      :style="oldStyle"
    ></view>

    <!-- 新背景层 -->
    <view
      class="bg-layer"
      :class="{ 'bg-visible': showNew }"
      :style="layerStyle"
    ></view>

    <!-- Overlay 遮罩（JS 决策） -->
    <view class="bg-overlay" :style="overlayStyle"></view>

    <!-- Safe Area + scroll-view 内容区 -->
    <view class="safe-area-wrapper">
      <scroll-view scroll-y class="bg-content-scroll">
        <slot />
      </scroll-view>
    </view>
  </view>
</template>

<script>
import { resolveBackground } from '../common/utils/resolveBackground.js';
import { resolveOverlay } from '../common/utils/resolveOverlay.js';

export default {
  props: {
    backgroundId:  { type: String,  default: '' },
    themeMode:     { type: String,  default: 'light' },
    overlayLevel:  { type: String,  default: 'soft' },
    emotionHint:   { type: String,  default: null },
    seasonalTag:   { type: String,  default: null }
  },
  data() {
    return {
      oldStyle: null,
      showNew: false
    };
  },
  computed: {
    layerStyle() {
      return resolveBackground(this.backgroundId, this.themeMode);
    },
    overlayStyle() {
      return resolveOverlay(this.themeMode, this.overlayLevel);
    }
  },
  watch: {
    backgroundId(newId, oldId) {
      if (oldId) {
        // 保存旧背景样式用于 fade-out
        this.oldStyle = resolveBackground(oldId, this.themeMode);
      }
      this.showNew = false;
      this.$nextTick(() => {
        this.showNew = true;
        if (this.oldStyle) {
          setTimeout(() => { this.oldStyle = null; }, 500);
        }
      });
    },
    themeMode() {
      this.showNew = false;
      this.$nextTick(() => { this.showNew = true; });
    }
  },
  created() {
    this.showNew = true;
  }
};
</script>

<style scoped>
.bg-viewport {
  position: relative;
  width: 100%;
  min-height: 100vh;
}

.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.bg-layer.bg-visible {
  opacity: 1;
}

.bg-layer-old {
  z-index: 0;
  opacity: 1;
  transition: opacity 0.4s ease;
}

.bg-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.safe-area-wrapper {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  padding-bottom: env(safe-area-inset-bottom);
}

.bg-content-scroll {
  height: 100vh;
}
</style>
