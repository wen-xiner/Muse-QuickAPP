// 性能工具函数

/**
 * 防抖：延迟执行，多次触发只执行最后一次
 * @param {Function} fn - 目标函数
 * @param {number} delay - 延迟毫秒数
 */
export function debounce(fn, delay = 300) {
	let timer = null;
	return function (...args) {
		clearTimeout(timer);
		timer = setTimeout(() => fn.apply(this, args), delay);
	};
}

/**
 * 节流：固定间隔执行，忽略间隔内的重复触发
 * @param {Function} fn - 目标函数
 * @param {number} interval - 间隔毫秒数
 */
export function throttle(fn, interval = 200) {
	let lastTime = 0;
	return function (...args) {
		const now = Date.now();
		if (now - lastTime >= interval) {
			lastTime = now;
			fn.apply(this, args);
		}
	};
}

/**
 * 批量数据更新辅助
 * 将多次 data 赋值合并到下一个微任务统一执行，
 * 减少双线程架构下 setData 的通信次数
 * @param {Object} vm - Vue 组件实例
 * @param {Object} updates - 批量更新数据
 */
export function batchUpdate(vm, updates) {
	Object.assign(vm, updates);
	return vm.$nextTick();
}
