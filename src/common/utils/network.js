export function checkNetwork() {
	return new Promise((resolve) => {
		uni.getNetworkType({
			success: (res) => {
				const online = res.networkType !== 'none';
				resolve({ online, networkType: res.networkType });
			},
			fail: () => {
				resolve({ online: true, networkType: 'unknown' });
			}
		});
	});
}

export function getNetworkDesc(networkType) {
	const map = {
		'wifi': 'Wi-Fi',
		'5g': '5G',
		'4g': '4G',
		'3g': '3G',
		'2g': '2G',
		'ethernet': '有线网络',
		'none': '无网络',
		'unknown': '未知网络'
	};
	return map[networkType] || networkType;
}
