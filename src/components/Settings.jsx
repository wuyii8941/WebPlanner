import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { aiService } from '../services/aiService'
import { proxyService } from '../services/proxyService'

const Settings = ({ onBack }) => {
  const navigate = useNavigate()
  const [apiKeys, setApiKeys] = useState({
    amapApiKey: '',
    amapSecurityKey1: '',
    amapSecurityKey2: '',
    llmApiKey: '',
    xunfeiApiKey: '',
    weatherApiKey: ''
  })
  const [settings, setSettings] = useState({
    useProxyForAI: false,
    proxyPort: '7890'
  })
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState({})
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [diagnosingConnection, setDiagnosingConnection] = useState(false)
  const [diagnosisResult, setDiagnosisResult] = useState(null)

  // 处理返回按钮点击
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/app')
    }
  }

  // 从localStorage加载保存的API密钥和设置
  useEffect(() => {
    const savedKeys = localStorage.getItem('webplanner_api_keys')
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys)
        setApiKeys(prev => ({
          ...prev,
          ...parsedKeys
        }))
      } catch (error) {
        console.error('解析保存的API密钥失败:', error)
      }
    }

    const savedSettings = localStorage.getItem('webplanner_settings')
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings(prev => ({
          ...prev,
          ...parsedSettings
        }))
      } catch (error) {
        console.error('解析保存的设置失败:', error)
      }
    }
  }, [])

  // 处理API密钥输入变化
  const handleInputChange = (key, value) => {
    setApiKeys(prev => ({
      ...prev,
      [key]: value
    }))
    
    // 清除该字段的错误
    if (errors[key]) {
      setErrors(prev => ({
        ...prev,
        [key]: ''
      }))
    }
  }

  // 处理设置变化
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 验证API密钥
  const validateApiKeys = () => {
    const newErrors = {}

    // 高德地图API Key验证 - 更宽松的验证
    if (apiKeys.amapApiKey && apiKeys.amapApiKey.trim()) {
      const trimmedKey = apiKeys.amapApiKey.trim()
      if (trimmedKey.length !== 32) {
        newErrors.amapApiKey = '高德地图API Key应为32位字符'
      } else if (!/^[a-zA-Z0-9]+$/.test(trimmedKey)) {
        newErrors.amapApiKey = '高德地图API Key应仅包含字母和数字'
      }
    }

    // AI API Key验证 - 更宽松的验证
    if (apiKeys.llmApiKey && apiKeys.llmApiKey.trim() && apiKeys.llmApiKey.trim().length < 10) {
      newErrors.llmApiKey = 'AI API Key格式不正确，请检查长度'
    }

    // 语音API Key验证 - 更宽松的验证
    if (apiKeys.xunfeiApiKey && apiKeys.xunfeiApiKey.trim() && apiKeys.xunfeiApiKey.trim().length < 10) {
      newErrors.xunfeiApiKey = '语音API Key格式不正确，请检查长度'
    }

    // 天气API Key验证 - 更宽松的验证
    if (apiKeys.weatherApiKey && apiKeys.weatherApiKey.trim()) {
      const trimmedKey = apiKeys.weatherApiKey.trim()
      if (trimmedKey.length !== 32) {
        newErrors.weatherApiKey = '天气API Key应为32位字符'
      } else if (!/^[a-zA-Z0-9]+$/.test(trimmedKey)) {
        newErrors.weatherApiKey = '天气API Key应仅包含字母和数字'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 保存API密钥和设置
  const handleSave = () => {
    console.log('开始保存API密钥和设置...', { apiKeys, settings })
    
    if (!validateApiKeys()) {
      console.log('验证失败，无法保存')
      return
    }

    try {
      // 过滤掉空值
      const keysToSave = Object.fromEntries(
        Object.entries(apiKeys).filter(([_, value]) => value.trim() !== '')
      )
      
      console.log('要保存的密钥:', keysToSave)
      console.log('要保存的设置:', settings)
      
      localStorage.setItem('webplanner_api_keys', JSON.stringify(keysToSave))
      localStorage.setItem('webplanner_settings', JSON.stringify(settings))
      console.log('保存成功到localStorage')
      
      setSaved(true)
      console.log('显示保存成功提示')
      
      // 3秒后隐藏保存成功提示
      setTimeout(() => {
        setSaved(false)
        console.log('隐藏保存成功提示')
      }, 3000)
    } catch (error) {
      console.error('保存失败:', error)
      setErrors({ general: '保存失败，请重试' })
    }
  }

  // 验证AI API Key
  const handleValidateApiKey = async () => {
    if (!apiKeys.llmApiKey || !apiKeys.llmApiKey.trim()) {
      setErrors({ llmApiKey: '请先输入AI API Key' })
      return
    }

    setValidating(true)
    setValidationResult(null)

    try {
      // 临时保存当前设置以进行验证
      const tempKeys = { ...apiKeys }
      const tempSettings = { ...settings }
      
      // 临时保存到localStorage用于验证
      localStorage.setItem('webplanner_api_keys', JSON.stringify(tempKeys))
      localStorage.setItem('webplanner_settings', JSON.stringify(tempSettings))
      
      const result = await aiService.validateApiKey()
      setValidationResult({
        valid: true,
        message: 'API Key验证成功！',
        models: result.models
      })
    } catch (error) {
      setValidationResult({
        valid: false,
        message: error.message
      })
    } finally {
      setValidating(false)
    }
  }

  // 清除所有API密钥
  const handleClear = () => {
    if (window.confirm('确定要清除所有API密钥吗？这将导致相关功能无法使用。')) {
      localStorage.removeItem('webplanner_api_keys')
      setApiKeys({
        amapApiKey: '',
        amapSecurityKey1: '',
        amapSecurityKey2: '',
        llmApiKey: '',
        xunfeiApiKey: '',
        weatherApiKey: ''
      })
      setSaved(false)
      setErrors({})
      setValidationResult(null)
      setDiagnosisResult(null)
    }
  }

  // 网络连接诊断
  const handleDiagnoseConnection = async () => {
    if (!apiKeys.llmApiKey || !apiKeys.llmApiKey.trim()) {
      setErrors({ llmApiKey: '请先输入AI API Key' })
      return
    }

    setDiagnosingConnection(true)
    setDiagnosisResult(null)

    try {
      // 临时保存当前设置以进行诊断
      const tempKeys = { ...apiKeys }
      const tempSettings = { ...settings }
      
      // 临时保存到localStorage用于诊断
      localStorage.setItem('webplanner_api_keys', JSON.stringify(tempKeys))
      localStorage.setItem('webplanner_settings', JSON.stringify(tempSettings))
      
      const result = await aiService.diagnoseConnection()
      setDiagnosisResult(result)
    } catch (error) {
      console.error('网络诊断失败:', error)
      setDiagnosisResult({
        dnsResolution: false,
        apiEndpointReachable: false,
        sslConnection: false,
        apiKeyValid: false,
        overallStatus: 'error'
      })
    } finally {
      setDiagnosingConnection(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl p-6">
        <div className="flex justify-between items-start">
          <div>
            <button
              onClick={handleBack}
              className="flex items-center text-blue-100 hover:text-white mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回主页
            </button>
            <h1 className="text-3xl font-bold mb-2">API密钥设置</h1>
            <p className="text-blue-100">配置第三方服务的API密钥以启用完整功能</p>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        {saved && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium">API密钥保存成功！</p>
                <p className="text-sm mt-1">设置已完成，请点击左上角的"返回主页"按钮开始使用应用。</p>
              </div>
            </div>
          </div>
        )}

        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.general}
          </div>
        )}

        {/* 高德地图API设置 */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            高德地图 API
          </h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 text-sm">
              <strong>功能：</strong>地图显示、地理位置服务、路径规划
            </p>
            <p className="text-blue-700 text-sm mt-1">
              <strong>获取方式：</strong>访问 <a href="https://lbs.amap.com/" target="_blank" rel="noopener noreferrer" className="underline">高德开放平台</a> 注册并创建应用
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                高德地图 API Key
              </label>
              <input
                type="password"
                value={apiKeys.amapApiKey}
                onChange={(e) => handleInputChange('amapApiKey', e.target.value)}
                placeholder="请输入32位高德地图API Key"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amapApiKey ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.amapApiKey && (
                <p className="text-red-600 text-sm">{errors.amapApiKey}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                高德地图安全密钥 1
              </label>
              <input
                type="password"
                value={apiKeys.amapSecurityKey1}
                onChange={(e) => handleInputChange('amapSecurityKey1', e.target.value)}
                placeholder="请输入高德地图安全密钥 1"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amapSecurityKey1 ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.amapSecurityKey1 && (
                <p className="text-red-600 text-sm">{errors.amapSecurityKey1}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                高德地图安全密钥 2
              </label>
              <input
                type="password"
                value={apiKeys.amapSecurityKey2}
                onChange={(e) => handleInputChange('amapSecurityKey2', e.target.value)}
                placeholder="请输入高德地图安全密钥 2"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amapSecurityKey2 ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.amapSecurityKey2 && (
                <p className="text-red-600 text-sm">{errors.amapSecurityKey2}</p>
              )}
            </div>
          </div>
        </div>

        {/* AI API设置 */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI 服务 API
          </h3>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <p className="text-purple-800 text-sm">
              <strong>功能：</strong>智能行程规划、费用预算分析
            </p>
            <p className="text-purple-700 text-sm mt-1">
              <strong>支持：</strong>OpenAI、阿里云百炼、百度文心一言等
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                AI API Key
              </label>
              <input
                type="password"
                value={apiKeys.llmApiKey}
                onChange={(e) => handleInputChange('llmApiKey', e.target.value)}
                placeholder="请输入AI服务API Key"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.llmApiKey ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.llmApiKey && (
                <p className="text-red-600 text-sm">{errors.llmApiKey}</p>
              )}
            </div>
            
            {/* 验证按钮 */}
            <div className="flex space-x-2">
              <button
                onClick={handleValidateApiKey}
                disabled={validating || !apiKeys.llmApiKey?.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validating ? '验证中...' : '验证API Key'}
              </button>
            </div>
            
            {/* 验证结果 */}
            {validationResult && (
              <div className={`p-3 rounded-lg ${
                validationResult.valid 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <div className="flex items-start">
                  <svg className={`w-5 h-5 mr-2 mt-0.5 flex-shrink-0 ${
                    validationResult.valid ? 'text-green-600' : 'text-red-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {validationResult.valid ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    )}
                  </svg>
                  <div>
                    <p className="font-medium">{validationResult.message}</p>
                    {validationResult.valid && validationResult.models && (
                      <p className="text-sm mt-1">
                        可用模型: {validationResult.models.length} 个
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 网络诊断按钮 */}
            <div className="flex space-x-2">
              <button
                onClick={handleDiagnoseConnection}
                disabled={diagnosingConnection}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {diagnosingConnection ? '诊断中...' : '网络连接诊断'}
              </button>
            </div>

            {/* 网络诊断结果 */}
            {diagnosisResult && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">网络连接诊断结果</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">DNS解析</span>
                    <span className={`text-sm font-medium ${
                      diagnosisResult.dnsResolution ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {diagnosisResult.dnsResolution ? '✅ 正常' : '❌ 异常'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">API端点可达性</span>
                    <span className={`text-sm font-medium ${
                      diagnosisResult.apiEndpointReachable ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {diagnosisResult.apiEndpointReachable ? '✅ 正常' : '❌ 异常'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">SSL连接</span>
                    <span className={`text-sm font-medium ${
                      diagnosisResult.sslConnection ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {diagnosisResult.sslConnection ? '✅ 正常' : '❌ 异常'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">API Key有效性</span>
                    <span className={`text-sm font-medium ${
                      diagnosisResult.apiKeyValid ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {diagnosisResult.apiKeyValid ? '✅ 正常' : '❌ 异常'}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">总体状态</span>
                      <span className={`text-sm font-bold ${
                        diagnosisResult.overallStatus === 'healthy' ? 'text-green-600' :
                        diagnosisResult.overallStatus === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {diagnosisResult.overallStatus === 'healthy' && '✅ 健康'}
                        {diagnosisResult.overallStatus === 'degraded' && '⚠️ 降级'}
                        {diagnosisResult.overallStatus === 'unhealthy' && '❌ 异常'}
                        {diagnosisResult.overallStatus === 'error' && '❌ 错误'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 语音API设置 */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            语音识别 API
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 text-sm">
              <strong>功能：</strong>语音输入旅行需求、语音记录费用
            </p>
            <p className="text-green-700 text-sm mt-1">
              <strong>支持：</strong>科大讯飞、百度语音、阿里云语音等
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              语音识别 API Key
            </label>
            <input
              type="password"
              value={apiKeys.xunfeiApiKey}
              onChange={(e) => handleInputChange('xunfeiApiKey', e.target.value)}
              placeholder="请输入语音识别API Key"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.xunfeiApiKey ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.xunfeiApiKey && (
              <p className="text-red-600 text-sm">{errors.xunfeiApiKey}</p>
            )}
          </div>
        </div>

        {/* 天气API设置 */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            天气服务 API
          </h3>
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-4">
            <p className="text-cyan-800 text-sm">
              <strong>功能：</strong>实时天气查询、旅行目的地天气信息
            </p>
            <p className="text-cyan-700 text-sm mt-1">
              <strong>获取方式：</strong>使用高德地图API Key即可，无需额外申请
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              天气服务 API Key
            </label>
            <input
              type="password"
              value={apiKeys.weatherApiKey}
              onChange={(e) => handleInputChange('weatherApiKey', e.target.value)}
              placeholder="请输入天气服务API Key（与高德地图API Key相同）"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                errors.weatherApiKey ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.weatherApiKey && (
              <p className="text-red-600 text-sm">{errors.weatherApiKey}</p>
            )}
          </div>
        </div>

        {/* 代理设置 */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            网络代理设置
          </h3>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-orange-800 text-sm">
              <strong>说明：</strong>Firebase使用代理连接，AI API和地图服务使用直连模式
            </p>
            <p className="text-orange-700 text-sm mt-1">
              <strong>当前配置：</strong>Firebase → 代理 | AI API → 直连 | 地图服务 → 直连
            </p>
          </div>
          
          {/* 代理配置说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-blue-800 font-medium mb-2">代理配置说明</h4>
            <div className="space-y-2 text-blue-700 text-sm">
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Firebase：</strong>始终使用代理连接，确保稳定访问</span>
              </div>
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>AI API：</strong>使用直连模式，避免代理导致的连接问题</span>
              </div>
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>地图服务：</strong>使用直连模式，确保地图正常显示</span>
              </div>
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>系统要求：</strong>请确保系统代理已正确配置并运行</span>
              </div>
            </div>
          </div>
        </div>

        {/* 安全提示 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-yellow-800 font-medium">安全提示</h4>
              <ul className="text-yellow-700 text-sm mt-1 space-y-1">
                <li>• API密钥仅保存在您的浏览器本地，不会上传到服务器</li>
                <li>• 请勿在公共计算机上保存API密钥</li>
                <li>• 定期检查API密钥的使用量，避免超额费用</li>
                <li>• 建议为每个服务创建独立的API密钥</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex space-x-4">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            保存设置
          </button>
          <button
            onClick={handleClear}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            清除所有
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
