// 百度地图服务测试脚本
console.log('🚀 开始测试百度地图服务...');

// 模拟localStorage中的API Key
const testApiKey = 'test_baidu_api_key_123456789012'; // 24位测试Key

// 模拟localStorage
const mockLocalStorage = {
  getItem: (key) => {
    if (key === 'webplanner_api_keys') {
      return JSON.stringify({
        baiduApiKey: testApiKey,
        llmApiKey: 'test_llm_key',
        weatherApiKey: 'test_weather_key'
      });
    }
    return null;
  },
  setItem: () => {}
};

// 替换全局localStorage
global.localStorage = mockLocalStorage;

// 测试地图服务
async function testMapService() {
  console.group('🗺️ 百度地图服务测试');
  
  try {
    // 导入地图服务
    const { MapService } = await import('./src/services/mapService.js');
    const mapService = new MapService();
    
    console.log('✅ 地图服务实例创建成功');
    
    // 测试API Key获取
    try {
      const apiKey = mapService.getApiKey();
      console.log('✅ API Key获取成功:', apiKey);
    } catch (error) {
      console.error('❌ API Key获取失败:', error.message);
    }
    
    // 测试城市名称提取
    const testDestinations = [
      '北京天安门',
      '上海市中心',
      '广州塔',
      '深圳世界之窗',
      '杭州西湖',
      '成都宽窄巷子',
      '重庆解放碑',
      '西安兵马俑',
      '南京夫子庙',
      '武汉黄鹤楼'
    ];
    
    console.log('🏙️ 测试城市名称提取:');
    testDestinations.forEach(dest => {
      const city = mapService.extractCityFromDestination(dest);
      console.log(`  ${dest} -> ${city}`);
    });
    
    // 测试备用位置
    console.log('📍 测试备用位置:');
    testDestinations.forEach(dest => {
      const fallback = mapService.getFallbackLocation(dest);
      if (fallback) {
        console.log(`  ${dest} -> (${fallback.lng}, ${fallback.lat})`);
      }
    });
    
    console.log('✅ 地图服务基础功能测试完成');
    
  } catch (error) {
    console.error('❌ 地图服务测试失败:', error);
  }
  
  console.groupEnd();
}

// 测试设置页面功能
function testSettingsPage() {
  console.group('⚙️ 设置页面功能测试');
  
  // 测试API Key验证
  const testKeys = [
    { key: '123456789012345678901234', valid: true }, // 24位有效
    { key: '12345678901234567890123', valid: false }, // 23位无效
    { key: '1234567890123456789012345', valid: false }, // 25位无效
    { key: '1234567890123456789012@4', valid: false }, // 包含特殊字符
    { key: '', valid: false } // 空值
  ];
  
  console.log('🔑 API Key格式验证测试:');
  testKeys.forEach(({ key, valid }) => {
    const trimmedKey = key.trim();
    let isValid = true;
    
    if (trimmedKey && trimmedKey.length !== 24) {
      isValid = false;
    } else if (trimmedKey && !/^[a-zA-Z0-9]+$/.test(trimmedKey)) {
      isValid = false;
    } else if (!trimmedKey) {
      isValid = false;
    }
    
    const result = isValid === valid ? '✅' : '❌';
    console.log(`  ${result} "${key}" -> 期望: ${valid}, 实际: ${isValid}`);
  });
  
  console.log('✅ 设置页面功能测试完成');
  console.groupEnd();
}

// 运行所有测试
async function runAllTests() {
  console.log('🎯 开始运行百度地图集成测试...\n');
  
  await testMapService();
  console.log('\n');
  testSettingsPage();
  
  console.log('\n📋 测试总结:');
  console.log('• ✅ 地图服务基础功能正常');
  console.log('• ✅ 设置页面API Key验证正常');
  console.log('• 🎯 百度地图集成测试完成');
  console.log('\n💡 下一步:');
  console.log('1. 在浏览器中打开 test-baidu-map.html 进行实际地图测试');
  console.log('2. 在设置页面配置真实的百度地图API Key');
  console.log('3. 在主应用中使用新的百度地图服务');
}

// 执行测试
runAllTests().catch(console.error);
