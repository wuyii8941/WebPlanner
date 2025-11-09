// AI服务连接修复脚本
// 解决代理配置导致的连接问题

function fixAIConnection() {
  console.log('🔧 开始修复AI服务连接问题...');
  
  try {
    // 1. 检查当前设置
    const settings = localStorage.getItem('webplanner_settings');
    const apiKeys = localStorage.getItem('webplanner_api_keys');
    
    console.log('📋 当前设置:', settings ? JSON.parse(settings) : '未配置');
    console.log('🔑 API Keys:', apiKeys ? JSON.parse(apiKeys) : '未配置');
    
    // 2. 修复代理设置 - 关闭AI代理，使用直连模式
    let newSettings = {
      useProxyForAI: false, // 关闭AI代理
      proxyPort: '7890',
      theme: 'light'
    };
    
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      newSettings = {
        ...parsedSettings,
        useProxyForAI: false // 强制关闭AI代理
      };
    }
    
    localStorage.setItem('webplanner_settings', JSON.stringify(newSettings));
    console.log('✅ 代理设置已更新:', newSettings);
    
    // 3. 确保API密钥存在
    if (!apiKeys) {
      console.log('⚠️ 未找到API密钥，尝试自动配置...');
      
      // 尝试从预配置文件中获取密钥
      const preconfiguredKeys = {
        llmApiKey: 'sk-674c20d824f942a59d7cb09426c0d33b',
        amapApiKey: '3b5d43530286cf341867ede674447365',
        xunfeiApiKey: '78b46e0bacff3d433ca3fa3e52fc3f56'
      };
      
      localStorage.setItem('webplanner_api_keys', JSON.stringify(preconfiguredKeys));
      console.log('✅ API密钥已自动配置');
    } else {
      console.log('✅ API密钥已存在');
    }
    
    // 4. 测试网络连接
    console.log('\n🌐 测试网络连接...');
    testNetworkConnection();
    
    console.log('\n🎉 AI服务连接修复完成！');
    console.log('💡 建议：');
    console.log('   - 确保系统代理已正确配置');
    console.log('   - 如果仍然失败，请检查防火墙设置');
    console.log('   - 确认API密钥有效且未过期');
    
    return true;
  } catch (error) {
    console.error('❌ 修复失败:', error);
    return false;
  }
}

// 测试网络连接
async function testNetworkConnection() {
  const testUrls = [
    'https://api.deepseek.com/v1/models',
    'https://firebaseapp.com',
    'https://lbs.amap.com'
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
}

// 运行修复
console.log('🚀 启动AI服务连接修复...');
fixAIConnection();
