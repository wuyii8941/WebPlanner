import React, { useState, useEffect, useRef } from 'react'
// 移除 createTrip 和 updateTrip
// import { createTrip, updateTrip } from '../services/tripService' 
import { Trip, TravelPreferences } from '../models/Trip'
import { aiService } from '../services/aiService'
import { speechService } from '../services/speechService'
import { ErrorAlert } from './ErrorDisplay'

const TripForm = ({ user, trip = null, onSave, onCancel }) => {
  // 简化用户信息，只使用id和email
  const effectiveUser = user || {}
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '', 
    travelers: 1,
    preferences: new TravelPreferences()
  })

  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [errors, setErrors] = useState([])
  const [aiGeneratedItinerary, setAiGeneratedItinerary] = useState([])
  const [speechListening, setSpeechListening] = useState(false)
  const [speechField, setSpeechField] = useState(null)
  const [speechTranscript, setSpeechTranscript] = useState('')
  const [speechStatus, setSpeechStatus] = useState('')
  
  // Bug 2 修复：保留同步锁，防止用户手动双击
  const isSubmittingRef = useRef(false);

  // 兴趣选项
  const interestOptions = [
    '自然风光', '历史文化', '美食体验', '购物娱乐', 
    '户外运动', '艺术展览', '亲子活动', '夜生活',
    '摄影打卡', '温泉SPA', '冒险刺激', '休闲放松'
  ]

  // 如果是编辑模式，填充现有数据
  useEffect(() => {
    if (trip) {
      console.group('🔄 TripForm - 编辑模式数据加载')
      console.log('📋 传入的trip对象:', trip)
      
      setFormData({
        title: trip.title || '',
        description: trip.description || '',
        destination: trip.destination || '',
        startDate: trip.startDate || '',
        endDate: trip.endDate || '',
        budget: trip.budget || '',
        travelers: trip.travelers !== undefined && trip.travelers !== null ? trip.travelers : 1,
        // 确保 preferences 是从 Trip 对象中正确获取
        preferences: trip.preferences ? new TravelPreferences(trip.preferences) : new TravelPreferences()
      })
      
      console.log('✅ 编辑模式数据加载完成')
      console.groupEnd()
    }
  }, [trip])

  // 清理函数
  useEffect(() => {
    return () => {
      isSubmittingRef.current = false;
    }
  }, [])

  // Bug 3 修复：修改 handleInputChange
  const handleInputChange = (field, value) => {
    if (field === 'budget' || field === 'travelers') {
      if (value === '') {
        setFormData(prev => ({ ...prev, [field]: '' }))
        return
      }
      const numValue = field === 'budget' ? parseFloat(value) : parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 0) {
        setFormData(prev => ({ ...prev, [field]: numValue }))
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }


  // 处理偏好设置变化
  const handlePreferenceChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    }))
  }

  // 处理兴趣选择
  const handleInterestToggle = (interest) => {
    const currentInterests = formData.preferences.interests || []
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest]
    
    handlePreferenceChange('interests', newInterests)
  }

  // 表单验证
  const validateForm = () => {
    const newErrors = []

    if (!formData.title.trim()) newErrors.push('旅行标题不能为空')
    if (!formData.destination.trim()) newErrors.push('目的地不能为空')
    if (!formData.startDate) newErrors.push('开始日期不能为空')
    if (!formData.endDate) newErrors.push('结束日期不能为空')
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.push('结束日期必须晚于开始日期')
    }
    if (formData.budget && formData.budget < 0) newErrors.push('预算不能为负数')
    if (formData.travelers < 1) newErrors.push('旅行人数至少为1人')

    setErrors(newErrors)
    return newErrors.length === 0
  }

  // 
  // ---------------------------------------------
  // 最终 Bug 2 修复 (逻辑简化):
  // ---------------------------------------------
  // handleSubmit 现在只负责验证和传递数据，
  // 所有的 create/update 逻辑都交给父组件 (AppPage) 处理。
  //
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isSubmittingRef.current || loading) {
      console.log('⚠️ 提交正在进行中，忽略重复点击')
      return
    }
        
    console.group('🚀 TripForm - 表单提交')
    
    if (!validateForm()) {
      console.error('❌ 表单验证失败:', errors)
      console.groupEnd()
      return
    }

    if (!effectiveUser || !effectiveUser.id) {
      console.error('❌ 用户信息缺失，无法创建行程')
      setErrors(['用户信息缺失，请重新登录'])
      console.groupEnd()
      return
    }

    setLoading(true)
    isSubmittingRef.current = true;
    setErrors([])

    try {
      // Bug 3 修复：确保数据类型正确
      const tripData = {
        ...formData,
        budget: Number(formData.budget) || 0,
        travelers: Number(formData.travelers) || 1,
        status: 0, // 0: 规划中
        // 确保 preferences 是一个普通对象
        preferences: { ...formData.preferences } 
      }

      console.log('📊 准备将表单数据传递给 onSave:', tripData)

      // 
      // **核心修复**：
      // 不再调用 createTrip 或 updateTrip。
      // 只调用 onSave，并传递 *原始表单数据 (tripData)*。
      //
      if (typeof onSave === 'function') {
        await onSave(tripData) // <--- 传递 tripData，而不是 result
      }
      
      console.log('✅ onSave (AppPage.handleSaveTrip) 执行完毕')
      console.groupEnd()

    } catch (error) {
      // onSave 可能会抛出错误 (例如API失败)，在这里捕获
      console.error('❌ onSave (AppPage.handleSaveTrip) 执行失败:', error)
      console.log('💡 错误详情:', { message: error.message, stack: error.stack })
      console.groupEnd()
      
      let errorMessage = error.message
      if (error.message.includes('CONNECTION_TIMED_OUT') || error.message.includes('Failed to fetch')) {
        errorMessage = '网络连接超时，请检查网络连接后重试'
      } else if (error.message.includes('Firebase')) {
        errorMessage = '数据库连接失败，请稍后重试'
      }
      
      setErrors([errorMessage])
    } finally {
      // 释放锁
      setLoading(false)
      isSubmittingRef.current = false;
    }
  }

  // ... (calculateDuration, AI 和 Speech 相关函数保持不变) ...

  // 计算旅行天数
  const calculateDuration = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      const diffTime = Math.abs(end - start)
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    }
    return 0
  }

  // AI生成行程
  const handleGenerateItinerary = async () => {
    if (!validateForm()) {
      return
    }

    setAiLoading(true)
    setErrors([])

    try {
      const result = await aiService.generateItinerary({
        ...formData,
        budget: Number(formData.budget) || 0,
        travelers: Number(formData.travelers) || 1
      })

      if (result.success) {
        console.log('✅ AI行程生成成功:', result.itinerary)
        setAiGeneratedItinerary(result.itinerary)
      } else {
        setErrors([`AI生成失败: ${result.error}`])
      }
    } catch (error) {
      setErrors([`AI生成失败: ${error.message}`])
    } finally {
      setAiLoading(false)
    }
  }

  // 使用AI生成的行程
  const handleUseAiItinerary = () => {
    setFormData(prev => ({
      ...prev,
      itinerary: aiGeneratedItinerary
    }))
    
    alert(`已应用 ${aiGeneratedItinerary.length} 个AI生成的行程项！现在可以保存旅行。`)
  }

  // 检查是否可以生成AI行程
  const canGenerateItinerary = () => {
    return formData.title && formData.destination && formData.startDate && formData.endDate
  }

  // 语音识别处理函数
  const handleSpeechStart = (field) => {
    if (speechListening) {
      handleSpeechStop()
      return
    }

    setSpeechField(field)
    setSpeechTranscript('')
    setSpeechStatus('开始语音输入...')
    
    const success = speechService.startListening({
      onStart: () => {
        setSpeechListening(true)
        setSpeechStatus('语音输入开始，请说话...')
        setErrors([])
      },
      onResult: (transcript, isFinal) => {
        setSpeechTranscript(transcript)
        
        if (isFinal) {
          handleInputChange(field, transcript)
          setSpeechListening(false)
          setSpeechField(null)
          setSpeechTranscript('')
          setSpeechStatus('语音输入结束')
          
          setErrors([])
          
          setTimeout(() => {
            setSpeechStatus('')
          }, 2000)
        }
      },
      onError: (error) => {
        console.error('语音识别错误:', error)
        setSpeechListening(false)
        setSpeechField(null)
        setSpeechTranscript('')
        setSpeechStatus('语音输入失败')
        
        let errorMessage = '语音识别失败'
        if (error.includes('not-allowed')) {
          errorMessage = '麦克风权限被拒绝，请允许浏览器访问麦克风'
        } else if (error.includes('no-speech')) {
          errorMessage = '没有检测到语音，请重试'
        } else if (error.includes('audio-capture')) {
          errorMessage = '无法访问麦克风设备'
        }
        
        setErrors([errorMessage])
        
        setTimeout(() => {
          setSpeechStatus('')
        }, 2000)
      },
      onEnd: () => {
        setSpeechListening(false)
        setSpeechField(null)
        setSpeechTranscript('')
        setSpeechStatus('语音输入结束')
        
        setTimeout(() => {
          setSpeechStatus('')
        }, 2000)
      }
    })
    
    if (!success) {
      setErrors(['语音识别功能不可用，请确保使用支持语音识别的浏览器'])
      setSpeechStatus('语音输入不可用')
    }
  }

  const handleSpeechStop = () => {
    speechService.stopListening()
    setSpeechListening(false)
    setSpeechField(null)
    setSpeechTranscript('')
    setSpeechStatus('语音输入已停止')
    
    setTimeout(() => {
      setSpeechStatus('')
    }, 2000)
  }

  // 检查浏览器是否支持语音识别
  const isSpeechSupported = speechService.isSupported()

  // ... (JSX 渲染部分保持不变) ...
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {trip ? '编辑旅行' : '创建新旅行'}
      </h2>

        {errors.length > 0 && (
          <ErrorAlert 
            error={errors.join('; ')} 
            className="mb-6"
          />
        )}

        {/* 语音状态显示 */}
        {speechStatus && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="font-medium">语音状态:</span>
            </div>
            <p className="text-sm mt-1">{speechStatus}</p>
          </div>
        )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              旅行标题 *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="例如：2024年日本樱花之旅"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {isSpeechSupported && (
                <button
                  type="button"
                  onClick={() => speechField === 'title' && speechListening ? handleSpeechStop() : handleSpeechStart('title')}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                    speechField === 'title' && speechListening
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={speechField === 'title' && speechListening ? '停止语音输入' : '语音输入'}
                >
                  {speechField === 'title' && speechListening ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 6h12v12H6z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
            {speechField === 'title' && speechTranscript && (
              <p className="text-xs text-blue-600 mt-1">识别中: {speechTranscript}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目的地 *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                placeholder="例如：日本东京"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {isSpeechSupported && (
                <button
                  type="button"
                  onClick={() => speechField === 'destination' && speechListening ? handleSpeechStop() : handleSpeechStart('destination')}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                    speechField === 'destination' && speechListening
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={speechField === 'destination' && speechListening ? '停止语音输入' : '语音输入'}
                >
                  {speechField === 'destination' && speechListening ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 6h12v12H6z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
            {speechField === 'destination' && speechTranscript && (
              <p className="text-xs text-blue-600 mt-1">识别中: {speechTranscript}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            旅行描述
          </label>
          <div className="relative">
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="描述您的旅行计划、期望或特殊要求..."
              rows="3"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isSpeechSupported && (
              <button
                type="button"
                onClick={() => speechField === 'description' && speechListening ? handleSpeechStop() : handleSpeechStart('description')}
                className={`absolute right-2 top-2 p-1 rounded-full transition-colors ${
                  speechField === 'description' && speechListening
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={speechField === 'description' && speechListening ? '停止语音输入' : '语音输入'}
              >
                {speechField === 'description' && speechListening ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
            )}
          </div>
          {speechField === 'description' && speechTranscript && (
            <p className="text-xs text-blue-600 mt-1">识别中: {speechTranscript}</p>
          )}
        </div>

        {/* 日期和预算 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              开始日期 *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              结束日期 *
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              旅行天数
            </label>
            <input
              type="text"
              value={calculateDuration()}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              预算 (元)
            </label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', e.target.value)}
              placeholder="例如：5000"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              旅行人数 *
            </label>
            <input
              type="number"
              value={formData.travelers}
              onChange={(e) => handleInputChange('travelers', e.target.value)}
              min="1"
              max="20"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* 旅行偏好 */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">旅行偏好</h3>

          {/* 兴趣选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              兴趣偏好 (可多选)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    formData.preferences.interests?.includes(interest)
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* 其他偏好 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                旅行节奏
              </label>
              <select
                value={formData.preferences.pace}
                onChange={(e) => handlePreferenceChange('pace', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="slow">悠闲慢游</option>
                <option value="moderate">适中节奏</option>
                <option value="fast">紧凑高效</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                住宿偏好
              </label>
              <select
                value={formData.preferences.accommodation}
                onChange={(e) => handlePreferenceChange('accommodation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hostel">青年旅舍</option>
                <option value="hotel">酒店</option>
                <option value="apartment">公寓</option>
                <option value="luxury">豪华酒店</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                交通方式
              </label>
              <select
                value={formData.preferences.transportation}
                onChange={(e) => handlePreferenceChange('transportation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">公共交通</option>
                <option value="car">自驾</option>
                <option value="mixed">混合方式</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                餐饮偏好
              </label>
              <select
                value={formData.preferences.food}
                onChange={(e) => handlePreferenceChange('food', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="local">当地美食</option>
                <option value="international">国际美食</option>
                <option value="budget">经济实惠</option>
                <option value="luxury">高档餐厅</option>
              </select>
            </div>
          </div>

          {/* 特殊需求 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.preferences.accessibility || false}
                onChange={(e) => handlePreferenceChange('accessibility', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">无障碍设施需求</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.preferences.petFriendly || false}
                onChange={(e) => handlePreferenceChange('petFriendly', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">宠物友好</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.preferences.familyFriendly || false}
                onChange={(e) => handlePreferenceChange('familyFriendly', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">家庭友好</span>
            </label>
          </div>
        </div>

        {/* AI行程生成 */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">AI智能行程规划</h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  AI将根据您的旅行偏好自动生成详细的行程安排，包括景点推荐、餐饮建议和交通规划。
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={handleGenerateItinerary}
              disabled={!canGenerateItinerary() || aiLoading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center"
            >
              {aiLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  AI生成中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI生成行程
                </>
              )}
            </button>

            {aiGeneratedItinerary.length > 0 && (
              <button
                type="button"
                onClick={handleUseAiItinerary}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                使用AI行程 ({aiGeneratedItinerary.length}项)
              </button>
            )}
          </div>

          {aiGeneratedItinerary.length > 0 && (
            <div className="mt-4 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-800 font-medium">AI行程已生成！</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  已生成 {aiGeneratedItinerary.length} 个行程项，点击"使用AI行程"按钮应用。
                </p>
              </div>

              {/* AI行程详情显示 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">AI生成的行程详情</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {aiGeneratedItinerary.map((item, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-gray-800">{item.title || `行程项 ${index + 1}`}</h5>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                          {item.location && (
                            <p className="text-xs text-blue-600 mt-1">📍 {item.location}</p>
                          )}
                        </div>
                        {item.time && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">
                            {item.time}
                          </span>
                        )}
                      </div>
                      {item.cost && (
                        <p className="text-xs text-green-600 mt-1">💰 预算: {item.cost}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? '保存中...' : (trip ? '更新旅行' : '创建旅行')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TripForm
