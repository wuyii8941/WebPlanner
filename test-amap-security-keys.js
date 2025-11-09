// 测试高德地图安全密钥配置
import { autoConfigureApiKeys, checkApiKeysStatus } from './src/services/preconfiguredApiKeys.js'

console.log('🧪 测试高德地图安全密钥配置...')

// 自动配置API密钥
console.log('🔧 自动配置API密钥...')
const configured = autoConfigureApiKeys()

if (configured) {
  console.log('✅ API密钥自动配置成功')
} else {
  console.log('ℹ️ API密钥已存在，无需重新配置')
}

// 检查API密钥状态
console.log('📊 检查API密钥状态...')
const status = checkApiKeysStatus()

console.log('📋 API密钥配置状态:')
console.log(`   - 已配置: ${status.configured}`)
console.log(`   - 消息: ${status.message}`)
console.log(`   - 缺失密钥: ${status.missingKeys.join(', ') || '无'}`)

if (status.keys) {
  console.log('🔑 当前配置的密钥:')
  Object.entries(status.keys).forEach(([key, value]) => {
    const maskedValue = value ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}` : '未配置'
    console.log(`   - ${key}: ${maskedValue}`)
  })
}

// 测试地图服务
console.log('🗺️ 测试地图服务...')
try {
  const { mapService } = await import('./src/services/mapService.js')
  
  const apiKey = mapService.getApiKey()
  console.log(`✅ 高德地图API Key获取成功: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`)
  
  const securityKeys = mapService.getSecurityKeys()
  if (securityKeys && securityKeys.length > 0) {
    console.log(`✅ 高德地图安全密钥获取成功: ${securityKeys.length} 个`)
    securityKeys.forEach((key, index) => {
      console.log(`   - 安全密钥 ${index + 1}: ${key.substring(0, 8)}...${key.substring(key.length - 4)}`)
    })
  } else {
    console.log('⚠️ 未配置高德地图安全密钥')
  }
  
  console.log('🎉 高德地图安全密钥配置测试完成！')
} catch (error) {
  console.error('❌ 地图服务测试失败:', error.message)
}
