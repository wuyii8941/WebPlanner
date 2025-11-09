// Firebase代理问题修复脚本
console.log('🔧 开始修复Firebase代理问题...')

// 修复方案1: 禁用代理设置
function disableProxySettings() {
  console.log('🔄 禁用代理设置...')
  
  try {
    // 清除本地存储中的代理设置
    localStorage.removeItem('webplanner_settings')
    console.log('✅ 已清除本地代理设置')
    
    // 更新环境变量（在浏览器中无法直接修改，但可以提示用户）
    console.log('💡 建议手动修改 .env 文件:')
    console.log('   VITE_PROXY_ENABLED=false')
    console.log('   # VITE_PROXY_SERVER=http://127.0.0.1:7890')
    
    return true
  } catch (error) {
    console.error('❌ 禁用代理设置失败:', error)
    return false
  }
}

// 修复方案2: 测试Firebase连接
async function testFirebaseConnection() {
  console.log('🔍 测试Firebase连接...')
  
  try {
    // 测试Firebase域名连接
    const testUrls = [
      'https://webplanner-app.firebaseapp.com',
      'https://firebase.googleapis.com',
      'https://www.googleapis.com'
    ]
    
    const results = []
    
    for (const url of testUrls) {
      try {
        const startTime = Date.now()
        const response = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000)
        })
        const endTime = Date.now()
        
        results.push({
          url,
          success: true,
          status: response.status,
          responseTime: endTime - startTime
        })
        
        console.log(`✅ ${url}: ${response.status} - ${endTime - startTime}ms`)
      } catch (error) {
        results.push({
          url,
          success: false,
          error: error.message
        })
        
        console.log(`❌ ${url}: ${error.message}`)
      }
    }
    
    return results
  } catch (error) {
    console.error('❌ Firebase连接测试失败:', error)
    return []
  }
}

// 修复方案3: 提供代理配置建议
function provideProxyRecommendations() {
  console.log('📋 代理配置建议:')
  
  const recommendations = [
    {
      scenario: 'Firebase连接失败',
      solution: '禁用代理设置，让Firebase使用直连模式',
      steps: [
        '1. 修改 .env 文件: VITE_PROXY_ENABLED=false',
        '2. 重启开发服务器',
        '3. 清除浏览器缓存'
      ]
    },
    {
      scenario: '需要同时使用代理和直连',
      solution: '配置智能代理规则',
      steps: [
        '1. 确保代理服务器正常运行',
        '2. 在应用设置中关闭AI代理',
        '3. 保持系统代理用于Firebase'
      ]
    },
    {
      scenario: '网络环境复杂',
      solution: '使用降级方案',
      steps: [
        '1. 完全禁用代理',
        '2. 使用本地存储模式',
        '3. 等待网络环境改善'
      ]
    }
  ]
  
  recommendations.forEach((rec, index) => {
    console.log(`\n${index + 1}. ${rec.scenario}`)
    console.log(`   解决方案: ${rec.solution}`)
    rec.steps.forEach(step => console.log(`   ${step}`))
  })
}

// 运行修复
async function runFirebaseFix() {
  console.group('🚀 Firebase代理问题修复')
  
  // 步骤1: 禁用代理设置
  const proxyDisabled = disableProxySettings()
  
  // 步骤2: 测试连接
  const connectionResults = await testFirebaseConnection()
  
  // 步骤3: 提供建议
  provideProxyRecommendations()
  
  // 分析结果
  const successCount = connectionResults.filter(r => r.success).length
  const allSuccess = successCount === connectionResults.length
  
  console.log('\n📊 修复结果:')
  console.log(`• 代理设置: ${proxyDisabled ? '✅ 已禁用' : '❌ 禁用失败'}`)
  console.log(`• 连接测试: ${successCount}/${connectionResults.length} 成功`)
  console.log(`• 总体状态: ${allSuccess ? '✅ 修复成功' : '⚠️ 需要进一步调整'}`)
  
  if (!allSuccess) {
    console.log('\n🔧 进一步建议:')
    console.log('• 检查防火墙设置')
    console.log('• 验证Firebase项目配置')
    console.log('• 尝试使用不同的网络环境')
  }
  
  console.groupEnd()
  
  return {
    proxyDisabled,
    connectionResults,
    overallSuccess: proxyDisabled && allSuccess
  }
}

// 如果直接运行此脚本
if (typeof window !== 'undefined') {
  runFirebaseFix().then(result => {
    if (result.overallSuccess) {
      console.log('\n🎉 Firebase代理问题已修复！')
      console.log('请重启应用并测试Firebase功能。')
    } else {
      console.log('\n⚠️ 部分问题仍需手动调整')
      console.log('请按照上述建议进行配置。')
    }
  })
}

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    disableProxySettings,
    testFirebaseConnection,
    provideProxyRecommendations,
    runFirebaseFix
  }
}
