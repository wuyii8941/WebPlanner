// 预配置的API密钥
export const preconfiguredApiKeys = {
  llmApiKey: 'sk-674c20d824f942a59d7cb09426c0d33b', // DeepSeek API
  amapApiKey: '3b5d43530286cf341867ede674447365', // 高德地图API
  xunfeiApiKey: '78b46e0bacff3d433ca3fa3e52fc3f56' // 科大讯飞API
}

// 自动配置API密钥到localStorage
export function autoConfigureApiKeys() {
  try {
    const existingKeys = localStorage.getItem('webplanner_api_keys')
    if (!existingKeys) {
      // 如果没有配置过，自动配置预定义的API密钥
      localStorage.setItem('webplanner_api_keys', JSON.stringify(preconfiguredApiKeys))
      console.log('✅ API密钥已自动配置:', preconfiguredApiKeys)
      return true
    }
    
    const parsedKeys = JSON.parse(existingKeys)
    // 检查是否有缺失的密钥，如果有则补充
    let updated = false
    for (const [key, value] of Object.entries(preconfiguredApiKeys)) {
      if (!parsedKeys[key]) {
        parsedKeys[key] = value
        updated = true
      }
    }
    
    if (updated) {
      localStorage.setItem('webplanner_api_keys', JSON.stringify(parsedKeys))
      console.log('✅ 缺失的API密钥已补充:', parsedKeys)
      return true
    }
    
    console.log('ℹ️ API密钥已存在，无需更新')
    return false
  } catch (error) {
    console.error('❌ 自动配置API密钥失败:', error)
    return false
  }
}

// 检查API密钥配置状态
export function checkApiKeysStatus() {
  try {
    const keys = localStorage.getItem('webplanner_api_keys')
    if (!keys) {
      return {
        configured: false,
        missingKeys: ['llmApiKey', 'amapApiKey', 'xunfeiApiKey'],
        message: 'API密钥未配置'
      }
    }
    
    const parsedKeys = JSON.parse(keys)
    const missingKeys = []
    
    if (!parsedKeys.llmApiKey) missingKeys.push('llmApiKey')
    if (!parsedKeys.amapApiKey) missingKeys.push('amapApiKey')
    if (!parsedKeys.xunfeiApiKey) missingKeys.push('xunfeiApiKey')
    
    return {
      configured: missingKeys.length === 0,
      missingKeys,
      keys: parsedKeys,
      message: missingKeys.length === 0 ? '所有API密钥已配置' : `缺少API密钥: ${missingKeys.join(', ')}`
    }
  } catch (error) {
    return {
      configured: false,
      missingKeys: ['llmApiKey', 'amapApiKey', 'xunfeiApiKey'],
      message: 'API密钥配置读取失败'
    }
  }
}
