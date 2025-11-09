// 智能代理服务 - 管理不同API的代理需求
export class ProxyService {
  constructor() {
    this.firebaseDomains = [
      'firebaseapp.com',
      'firebaseio.com',
      'googleapis.com',
      'gstatic.com'
    ]
    
    this.aiDomains = [
      'api.deepseek.com',
      'api.openai.com',
      'dashscope.aliyuncs.com',
      'aip.baidubce.com'
    ]
  }

  // 检查URL是否需要代理
  shouldUseProxy(url) {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname
      
      // Firebase相关域名需要代理
      if (this.firebaseDomains.some(domain => hostname.includes(domain))) {
        console.log(`🌐 ${hostname} - 需要代理 (Firebase服务)`)
        return true
      }
      
      // AI相关域名根据设置决定
      if (this.aiDomains.some(domain => hostname.includes(domain))) {
        const settings = localStorage.getItem('webplanner_settings')
        if (settings) {
          try {
            const parsedSettings = JSON.parse(settings)
            if (parsedSettings.useProxyForAI) {
              console.log(`🌐 ${hostname} - 使用代理 (AI服务)`)
              return true
            }
          } catch (error) {
            console.log(`🌐 ${hostname} - 直连模式 (AI服务默认)`)
          }
        }
        console.log(`🌐 ${hostname} - 直连模式 (AI服务)`)
        return false
      }
      
      // 其他域名直连
      console.log(`🌐 ${hostname} - 直连模式 (其他服务)`)
      return false
      
    } catch (error) {
      console.error('解析URL失败:', error)
      return false
    }
  }

  // 获取代理配置信息
  getProxyInfo() {
    const settings = localStorage.getItem('webplanner_settings')
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings)
        if (parsedSettings.useProxyForAI) {
          return {
            enabled: true,
            port: parsedSettings.proxyPort || '7890',
            host: '127.0.0.1'
          }
        }
      } catch (error) {
        console.error('解析代理设置失败:', error)
      }
    }
    
    return {
      enabled: false,
      port: '7890',
      host: '127.0.0.1'
    }
  }

  // 网络连接测试
  async testConnection(url) {
    console.group(`🔧 连接测试: ${url}`)
    
    try {
      const startTime = Date.now()
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      })
      const endTime = Date.now()
      
      const result = {
        success: true,
        status: response.status,
        responseTime: endTime - startTime,
        url: url
      }
      
      console.log(`✅ 连接测试成功: ${response.status} - ${result.responseTime}ms`)
      console.groupEnd()
      return result
      
    } catch (error) {
      const result = {
        success: false,
        error: error.message,
        url: url
      }
      
      console.error(`❌ 连接测试失败: ${error.message}`)
      console.groupEnd()
      return result
    }
  }

  // 批量测试连接
  async testAllConnections() {
    console.group('🔧 批量连接测试')
    
    const testUrls = [
      'https://firebaseapp.com', // Firebase测试
      'https://api.deepseek.com/v1/models', // DeepSeek测试
      'https://lbs.amap.com' // 高德地图测试
    ]
    
    const results = []
    
    for (const url of testUrls) {
      const result = await this.testConnection(url)
      results.push(result)
    }
    
    console.log('📊 批量测试结果:', results)
    console.groupEnd()
    
    return results
  }

  // 获取网络状态报告
  async getNetworkStatus() {
    console.group('📡 网络状态报告')
    
    const proxyInfo = this.getProxyInfo()
    const connectionResults = await this.testAllConnections()
    
    const status = {
      proxyEnabled: proxyInfo.enabled,
      proxyConfig: proxyInfo,
      connections: connectionResults,
      overallStatus: 'unknown'
    }
    
    // 计算总体状态
    const successCount = connectionResults.filter(r => r.success).length
    if (successCount === connectionResults.length) {
      status.overallStatus = 'healthy'
    } else if (successCount >= connectionResults.length / 2) {
      status.overallStatus = 'degraded'
    } else {
      status.overallStatus = 'unhealthy'
    }
    
    console.log('📊 网络状态报告:', status)
    console.groupEnd()
    
    return status
  }

  // 获取推荐配置
  getRecommendedConfig() {
    const proxyInfo = this.getProxyInfo()
    
    return {
      current: {
        firebase: '需要代理',
        ai: proxyInfo.enabled ? '使用代理' : '直连模式',
        amap: '直连模式'
      },
      recommendations: [
        {
          scenario: 'Firebase正常，AI API失败',
          action: '关闭AI代理设置，保持系统代理开启',
          config: {
            useProxyForAI: false,
            systemProxy: true
          }
        },
        {
          scenario: 'Firebase失败，AI API正常',
          action: '开启系统代理，AI代理设置根据网络环境调整',
          config: {
            useProxyForAI: false,
            systemProxy: true
          }
        },
        {
          scenario: '两者都失败',
          action: '检查网络连接和代理配置',
          config: {
            useProxyForAI: false,
            systemProxy: false
          }
        }
      ]
    }
  }
}

// 创建单例实例
export const proxyService = new ProxyService()
