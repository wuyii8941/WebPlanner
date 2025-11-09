// 检查localStorage中的API Key配置
// 在浏览器控制台中运行此脚本

function checkApiKeys() {
  console.log('🔍 检查API Key配置...');
  
  try {
    const apiKeys = localStorage.getItem('webplanner_api_keys');
    const settings = localStorage.getItem('webplanner_settings');
    
    console.log('📋 API Keys:', apiKeys ? JSON.parse(apiKeys) : '未配置');
    console.log('⚙️  Settings:', settings ? JSON.parse(settings) : '未配置');
    
    if (apiKeys) {
      const keys = JSON.parse(apiKeys);
      console.log('\n🔑 配置状态:');
      console.log('   - 高德地图API Key:', keys.amapApiKey ? '✅ 已配置' : '❌ 未配置');
      console.log('   - AI API Key:', keys.llmApiKey ? '✅ 已配置' : '❌ 未配置');
      console.log('   - 语音API Key:', keys.xunfeiApiKey ? '✅ 已配置' : '❌ 未配置');
      console.log('   - 天气API Key:', keys.weatherApiKey ? '✅ 已配置' : '❌ 未配置');
    } else {
      console.log('❌ 未找到API Key配置');
    }
    
    return apiKeys ? JSON.parse(apiKeys) : null;
  } catch (error) {
    console.error('❌ 检查API Key配置失败:', error);
    return null;
  }
}

// 运行检查
checkApiKeys();
