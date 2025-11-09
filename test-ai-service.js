// AI服务连接测试脚本
// 在浏览器控制台中运行此脚本

async function testAIService() {
  console.log('🚀 开始测试AI服务连接...');
  
  try {
    // 1. 检查API密钥配置
    const apiKeys = localStorage.getItem('webplanner_api_keys');
    if (!apiKeys) {
      console.error('❌ 未找到API密钥配置');
      return false;
    }
    
    const keys = JSON.parse(apiKeys);
    console.log('🔑 API密钥状态:', keys.llmApiKey ? '已配置' : '未配置');
    
    // 2. 检查代理设置
    const settings = localStorage.getItem('webplanner_settings');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      console.log('🌐 代理设置:', parsedSettings.useProxyForAI ? '使用代理' : '直连模式');
    } else {
      console.log('🌐 代理设置: 直连模式（默认）');
    }
    
    // 3. 测试网络连接
    console.log('\n🌐 测试网络连接...');
    const testUrls = [
      'https://api.deepseek.com/v1/models',
      'https://firebaseapp.com'
    ];
    
    for (const url of testUrls) {
      try {
        const startTime = Date.now();
        const response = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000)
        });
        const endTime = Date.now();
        console.log(`✅ ${url} - 连接成功 (${endTime - startTime}ms)`);
      } catch (error) {
        console.log(`❌ ${url} - 连接失败: ${error.message}`);
      }
    }
    
    // 4. 测试AI服务
    console.log('\n🤖 测试AI服务...');
    try {
      const { aiService } = await import('./src/services/aiService.js');
      
      // 测试API密钥验证
      console.log('🔑 验证API密钥...');
      const validationResult = await aiService.validateApiKey();
      console.log('✅ API密钥验证成功:', validationResult.valid);
      
      return true;
    } catch (error) {
      console.error('❌ AI服务测试失败:', error.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
    return false;
  }
}

// 运行测试
testAIService().then(result => {
  console.log('\n📊 测试结果:', result ? '✅ 成功' : '❌ 失败');
});
