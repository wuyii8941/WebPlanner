// 测试AI网络连接修复效果
console.log('🧪 测试AI网络连接修复效果')

// 模拟测试环境
const testApiKey = 'test-api-key-1234567890'

// 模拟localStorage
const mockLocalStorage = {
  getItem: (key) => {
    if (key === 'webplanner_api_keys') {
      return JSON.stringify({
        llmApiKey: testApiKey
      })
    }
    return null
  }
}

// 临时替换全局localStorage
const originalLocalStorage = global.localStorage
global.localStorage = mockLocalStorage

// 导入AI服务
import { AIService } from './src/services/aiService.js'

async function testNetworkStatus() {
  console.log('\n🔍 测试网络状态检查...')
  
  const aiService = new AIService()
  
  try {
    const networkStatus = await aiService.checkNetworkStatus()
    console.log('📊 网络状态检查结果:', {
      basicNetwork: networkStatus.basicNetwork,
      apiEndpoint: networkStatus.apiEndpoint,
      apiAuthenticated: networkStatus.apiAuthenticated,
      overall: networkStatus.overall
    })
    
    if (!networkStatus.basicNetwork) {
      console.log('❌ 基本网络连接测试失败')
    } else {
      console.log('✅ 基本网络连接正常')
    }
    
    if (!networkStatus.apiEndpoint) {
      console.log('❌ API端点连接测试失败')
    } else {
      console.log('✅ API端点连接正常')
    }
    
    if (!networkStatus.apiAuthenticated) {
      console.log('⚠️ API认证失败（可能是API Key无效）')
    } else {
      console.log('✅ API认证正常')
    }
    
  } catch (error) {
    console.error('❌ 网络状态检查失败:', error.message)
  }
}

async function testSmartRetry() {
  console.log('\n🔄 测试智能重试机制...')
  
  const aiService = new AIService()
  
  try {
    // 模拟一个会失败的请求
    const testConfig = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testApiKey}`
      }
    }
    
    console.log('📡 测试API请求...')
    const response = await aiService.smartRetryRequest(
      'https://api.deepseek.com/v1/models',
      testConfig,
      2 // 重试2次
    )
    
    console.log('✅ 智能重试测试成功')
    
  } catch (error) {
    console.log('📝 预期错误（API Key无效）:', error.message)
    if (error.message.includes('API Key无效')) {
      console.log('✅ 正确识别了API认证问题')
    } else {
      console.log('❌ 错误处理不正确')
    }
  }
}

async function runTests() {
  console.log('🚀 开始AI网络连接修复测试...')
  console.log('================================')
  
  await testNetworkStatus()
  await testSmartRetry()
  
  console.log('\n================================')
  console.log('🎉 测试完成！')
  
  // 恢复原始localStorage
  global.localStorage = originalLocalStorage
}

// 运行测试
runTests().catch(console.error)
