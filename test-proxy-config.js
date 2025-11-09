// 测试代理配置脚本
console.log('🔧 开始测试代理配置...')

// 导入代理服务
import { proxyService } from './src/services/proxyService.js'

// 测试URL列表
const testUrls = [
  {
    url: 'https://webplanner-app.firebaseapp.com',
    service: 'Firebase',
    expectedProxy: true
  },
  {
    url: 'https://api.deepseek.com/v1/models',
    service: 'AI API',
    expectedProxy: false
  },
  {
    url: 'https://restapi.amap.com/v3/geocode/geo',
    service: '高德地图',
    expectedProxy: false
  },
  {
    url: 'https://firebase.googleapis.com',
    service: 'Firebase API',
    expectedProxy: true
  },
  {
    url: 'https://dashscope.aliyuncs.com',
    service: '阿里云AI',
    expectedProxy: false
  }
]

// 测试代理决策
function testProxyDecisions() {
  console.group('🌐 代理决策测试')
  
  let allPassed = true
  
  testUrls.forEach(test => {
    const shouldUseProxy = proxyService.shouldUseProxy(test.url)
    const passed = shouldUseProxy === test.expectedProxy
    
    console.log(`${passed ? '✅' : '❌'} ${test.service}`)
    console.log(`   URL: ${test.url}`)
    console.log(`   预期代理: ${test.expectedProxy ? '是' : '否'}`)
    console.log(`   实际代理: ${shouldUseProxy ? '是' : '否'}`)
    console.log(`   结果: ${passed ? '通过' : '失败'}`)
    
    if (!passed) {
      allPassed = false
    }
  })
  
  console.log(`\n📊 总体结果: ${allPassed ? '✅ 所有测试通过' : '❌ 部分测试失败'}`)
  console.groupEnd()
  
  return allPassed
}

// 测试网络连接
async function testNetworkConnections() {
  console.group('🔗 网络连接测试')
  
  const results = []
  
  for (const test of testUrls) {
    console.log(`\n🔍 测试 ${test.service} 连接...`)
    
    try {
      const startTime = Date.now()
      const response = await fetch(test.url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      })
      const endTime = Date.now()
      
      const result = {
        service: test.service,
        url: test.url,
        success: true,
        status: response.status,
        responseTime: endTime - startTime,
        proxyUsed: proxyService.shouldUseProxy(test.url)
      }
      
      console.log(`✅ ${test.service}: ${response.status} - ${result.responseTime}ms`)
      console.log(`   代理使用: ${result.proxyUsed ? '是' : '否'}`)
      
      results.push(result)
    } catch (error) {
      const result = {
        service: test.service,
        url: test.url,
        success: false,
        error: error.message,
        proxyUsed: proxyService.shouldUseProxy(test.url)
      }
      
      console.log(`❌ ${test.service}: ${error.message}`)
      console.log(`   代理使用: ${result.proxyUsed ? '是' : '否'}`)
      
      results.push(result)
    }
  }
  
  const successCount = results.filter(r => r.success).length
  console.log(`\n📊 连接测试结果: ${successCount}/${results.length} 成功`)
  
  console.groupEnd()
  return results
}

// 生成配置报告
function generateConfigReport() {
  console.group('📋 代理配置报告')
  
  const config = {
    firebaseDomains: proxyService.firebaseDomains,
    aiDomains: proxyService.aiDomains,
    currentSettings: proxyService.getProxyInfo()
  }
  
  console.log('🔧 当前代理配置:')
  console.log('• Firebase域名:', config.firebaseDomains)
  console.log('• AI服务域名:', config.aiDomains)
  console.log('• 代理设置:', config.currentSettings)
  
  console.log('\n🎯 代理策略:')
  console.log('• Firebase服务: 使用代理')
  console.log('• AI服务: 直连模式')
  console.log('• 地图服务: 直连模式')
  console.log('• 其他服务: 直连模式')
  
  console.log('\n💡 使用说明:')
  console.log('1. 确保系统代理已正确配置并运行')
  console.log('2. Firebase将通过代理连接')
  console.log('3. AI API和地图服务将直连')
  console.log('4. 如果Firebase连接失败，请检查代理设置')
  console.log('5. 如果AI API连接失败，请检查网络环境')
  
  console.groupEnd()
  
  return config
}

// 运行完整测试
async function runFullTest() {
  console.log('🚀 开始完整代理配置测试\n')
  
  // 步骤1: 测试代理决策
  const proxyTestsPassed = testProxyDecisions()
  
  // 步骤2: 测试网络连接
  const connectionResults = await testNetworkConnections()
  
  // 步骤3: 生成配置报告
  const configReport = generateConfigReport()
  
  // 分析结果
  const connectionSuccessCount = connectionResults.filter(r => r.success).length
  const allConnectionsSuccessful = connectionSuccessCount === connectionResults.length
  
  console.log('\n🎯 测试总结:')
  console.log(`• 代理决策测试: ${proxyTestsPassed ? '✅ 通过' : '❌ 失败'}`)
  console.log(`• 网络连接测试: ${connectionSuccessCount}/${connectionResults.length} 成功`)
  console.log(`• 总体状态: ${proxyTestsPassed && allConnectionsSuccessful ? '✅ 配置正常' : '⚠️ 需要调整'}`)
  
  if (!proxyTestsPassed) {
    console.log('\n🔧 问题诊断:')
    console.log('• 检查代理服务配置是否正确')
    console.log('• 验证域名匹配规则')
  }
  
  if (!allConnectionsSuccessful) {
    console.log('\n🌐 网络问题:')
    const failedConnections = connectionResults.filter(r => !r.success)
    failedConnections.forEach(failed => {
      console.log(`• ${failed.service}: ${failed.error}`)
    })
  }
  
  return {
    proxyTestsPassed,
    connectionResults,
    configReport,
    overallSuccess: proxyTestsPassed && allConnectionsSuccessful
  }
}

// 如果直接运行此脚本
if (typeof window !== 'undefined') {
  runFullTest().then(result => {
    if (result.overallSuccess) {
      console.log('\n🎉 代理配置测试完成！所有服务配置正确。')
    } else {
      console.log('\n⚠️ 代理配置测试完成，但发现一些问题需要处理。')
    }
  })
}

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testProxyDecisions,
    testNetworkConnections,
    generateConfigReport,
    runFullTest
  }
}
