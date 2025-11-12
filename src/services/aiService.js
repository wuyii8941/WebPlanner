// AI服务层 - 调用LLM并生成行程
export class AIService {
  constructor() {
    this.baseURL = 'https://api.deepseek.com/v1'
  }

  // 获取API Key
  getApiKey() {
    const apiKeys = localStorage.getItem('webplanner_api_keys')
    if (!apiKeys) {
      throw new Error('请先在设置中配置DeepSeek API Key')
    }
    
    const parsedKeys = JSON.parse(apiKeys)
    if (!parsedKeys.llmApiKey) {
      throw new Error('请先在设置中配置DeepSeek API Key')
    }
    
    return parsedKeys.llmApiKey
  }

  // 获取请求配置
  getRequestConfig(apiKey, body) {
    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }

    // 只有当body不为null时才添加body
    if (body !== null) {
      config.body = JSON.stringify(body)
    }

    // AI服务始终使用直连模式，不经过代理

    return config
  }

  // 检查网络连接状态 - 简化版本，不进行实际网络测试
  async checkNetworkStatus() {
    // 假设网络连接正常，专注于API调用
    return {
      basicNetwork: true,
      apiEndpoint: true,
      overall: true
    }
  }

  // 智能网络重试策略
  async smartRetryRequest(url, config, maxRetries = 3) {
    let lastError = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 检查网络状态
        const networkStatus = await this.checkNetworkStatus()
        if (!networkStatus.overall) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
          continue
        }
        
        // 添加超时处理
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒超时
        config.signal = controller.signal

        const response = await fetch(url, config)
        clearTimeout(timeoutId)
        
        // 如果是网络错误，重试
        if (!response.ok && response.status >= 500) {
          lastError = new Error(`服务器错误: ${response.status}`)
          continue
        }
        
        return response
        
      } catch (error) {
        lastError = error
        
        // 如果是网络错误或超时，重试
        if (error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
          if (attempt < maxRetries) {
            // 指数退避策略
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
        }
        
        // 其他错误直接抛出
        throw error
      }
    }
    
    // 所有重试都失败
    throw lastError || new Error('API请求失败，重试次数已用完')
  }

  // 调用DeepSeek API生成行程（带重试机制）
  async generateItinerary(tripData) {
    try {
      const apiKey = this.getApiKey()
      const prompt = this.buildPrompt(tripData)
      
      const requestBody = {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的旅行规划师，擅长根据用户需求制定详细、实用的旅行行程。请以JSON格式返回生成的行程数据.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }

      const requestConfig = this.getRequestConfig(apiKey, requestBody)

      // 使用智能重试机制调用API
      const response = await this.smartRetryRequest(
        `${this.baseURL}/chat/completions`,
        requestConfig,
        3 // 重试3次
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        let errorMessage = `API请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`
        
        // 提供更友好的错误信息
        if (response.status === 401) {
          errorMessage = 'API Key无效，请检查设置中的API Key配置'
        } else if (response.status === 429) {
          errorMessage = 'API调用频率超限，请稍后重试'
        } else if (response.status >= 500) {
          errorMessage = 'AI服务暂时不可用，请稍后重试'
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const itineraryData = this.parseAIResponse(data.choices[0].message.content)
      
      return {
        success: true,
        itinerary: itineraryData,
        rawResponse: data
      }
    } catch (error) {
      // 提供更友好的错误信息
      let userFriendlyError = error.message
      if (error.name === 'AbortError') {
        userFriendlyError = 'AI服务响应超时，请检查网络连接后重试'
      } else if (error.message.includes('Failed to fetch')) {
        userFriendlyError = '网络连接失败，请检查网络连接'
      } else if (error.message.includes('API Key')) {
        userFriendlyError = error.message
      } else if (error.message.includes('CORS')) {
        userFriendlyError = '跨域请求失败，请检查网络配置'
      }
      
      return {
        success: false,
        error: userFriendlyError,
        itinerary: []
      }
    }
  }

  // 带重试机制的API请求
  async makeApiRequestWithRetry(url, config, maxRetries = 3) {
    let lastError = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 添加超时处理
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒超时
        config.signal = controller.signal

        const response = await fetch(url, config)
        clearTimeout(timeoutId)
        
        // 如果是网络错误，重试
        if (!response.ok && response.status >= 500) {
          lastError = new Error(`服务器错误: ${response.status}`)
          continue
        }
        
        return response
        
      } catch (error) {
        lastError = error
        
        // 如果是网络错误或超时，重试
        if (error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
          if (attempt < maxRetries) {
            // 指数退避策略
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
        }
        
        // 其他错误直接抛出
        throw error
      }
    }
    
    // 所有重试都失败
    throw lastError || new Error('API请求失败，重试次数已用完')
  }

  // 构建AI提示词
  buildPrompt(tripData) {
    const {
      title,
      destination,
      startDate,
      endDate,
      duration,
      budget,
      travelers,
      preferences,
      description
    } = tripData

    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1

    return `请为以下旅行需求生成详细的${days}天行程：

旅行标题：${title}
目的地：${destination}
旅行日期：${startDate} 至 ${endDate}（共${days}天）
预算：${budget ? budget + '元' : '未指定'}
旅行人数：${travelers}人
旅行描述：${description || '无特殊描述'}

旅行偏好：
- 兴趣：${preferences.interests?.join('、') || '未指定'}
- 节奏：${this.getPaceText(preferences.pace)}
- 住宿：${this.getAccommodationText(preferences.accommodation)}
- 交通：${this.getTransportationText(preferences.transportation)}
- 餐饮：${this.getFoodText(preferences.food)}
- 特殊需求：${this.getSpecialNeeds(preferences)}

请以JSON格式返回生成的行程数据，包含每天的详细安排。每个行程项应包括：
- day: 第几天
- date: 具体日期
- time: 时间段（如"09:00-12:00"）
- title: 活动标题
- description: 详细描述
- location: 具体地点
- category: 活动类别（sightseeing/dining/accommodation/transportation/activity）
- duration: 持续时间（分钟）
- cost: 预估费用
- notes: 注意事项

请确保行程安排合理、符合用户偏好，并考虑预算限制。`
  }

  // 解析AI响应
  parseAIResponse(responseText) {
    try {
      // 尝试从响应中提取JSON
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                       responseText.match(/```([\s\S]*?)```/) ||
                       responseText.match(/{[\s\S]*}/)
      
      let jsonStr = responseText
      if (jsonMatch) {
        jsonStr = jsonMatch[1] || jsonMatch[0]
      }
      
      const parsedData = JSON.parse(jsonStr)
      
      // 标准化行程数据格式
      const normalizedData = this.normalizeItineraryData(parsedData)
      
      return normalizedData
    } catch (error) {
      // 返回示例行程作为降级方案
      return this.generateSampleItinerary()
    }
  }

  // 标准化行程数据
  normalizeItineraryData(data) {
    // 处理daily_itinerary结构（新的AI响应格式）
    if (data.daily_itinerary && Array.isArray(data.daily_itinerary)) {
      const flattenedItinerary = []
      
      data.daily_itinerary.forEach(dayPlan => {
        if (dayPlan.activities && Array.isArray(dayPlan.activities)) {
          dayPlan.activities.forEach(activity => {
            flattenedItinerary.push({
              id: this.generateId(),
              day: dayPlan.day || 1,
              date: dayPlan.date || '',
              time: activity.time || '09:00-18:00',
              title: activity.title || '未命名活动',
              description: activity.description || '',
              location: activity.location || '',
              category: activity.category || 'sightseeing',
              duration: activity.duration || 60,
              cost: activity.cost || 0,
              notes: activity.notes || '',
              images: activity.images || [],
              reservations: activity.reservations || []
            })
          })
        }
      })
      
      return flattenedItinerary
    }
    
    // 处理嵌套的itinerary结构（旧的AI响应格式）
    if (data.itinerary && Array.isArray(data.itinerary)) {
      const flattenedItinerary = []
      
      data.itinerary.forEach(dayPlan => {
        if (dayPlan.activities && Array.isArray(dayPlan.activities)) {
          dayPlan.activities.forEach(activity => {
            flattenedItinerary.push({
              id: this.generateId(),
              day: dayPlan.day || 1,
              date: dayPlan.date || '',
              time: activity.time || '09:00-18:00',
              title: activity.title || '未命名活动',
              description: activity.description || '',
              location: activity.location || '',
              category: activity.category || 'sightseeing',
              duration: activity.duration || 60,
              cost: activity.cost || 0,
              notes: activity.notes || '',
              images: activity.images || [],
              reservations: activity.reservations || []
            })
          })
        }
      })
      
      return flattenedItinerary
    }
    
    // 处理扁平数组格式
    if (Array.isArray(data)) {
      return data.map(item => ({
        id: this.generateId(),
        day: item.day || 1,
        date: item.date || '',
        time: item.time || '09:00-18:00',
        title: item.title || '未命名活动',
        description: item.description || '',
        location: item.location || '',
        category: item.category || 'sightseeing',
        duration: item.duration || 60,
        cost: item.cost || 0,
        notes: item.notes || '',
        images: item.images || [],
        reservations: item.reservations || []
      }))
    }
    
    // 无法识别的数据结构，使用示例行程
    return this.generateSampleItinerary()
  }

  // 生成示例行程（降级方案）
  generateSampleItinerary() {
    return [
      {
        id: this.generateId(),
        day: 1,
        date: '',
        time: '09:00-12:00',
        title: '抵达目的地',
        description: '抵达目的地，办理入住手续，安顿行李',
        location: '机场/车站 → 酒店',
        category: 'transportation',
        duration: 180,
        cost: 0,
        notes: '请提前确认交通方式和时间',
        images: [],
        reservations: []
      },
      {
        id: this.generateId(),
        day: 1,
        date: '',
        time: '12:00-13:30',
        title: '午餐时间',
        description: '在当地特色餐厅享用午餐，品尝当地美食',
        location: '当地特色餐厅',
        category: 'dining',
        duration: 90,
        cost: 80,
        notes: '推荐尝试当地特色菜品',
        images: [],
        reservations: []
      },
      {
        id: this.generateId(),
        day: 1,
        date: '',
        time: '14:00-17:00',
        title: '城市观光',
        description: '游览城市中心景点，感受当地文化氛围',
        location: '市中心景点',
        category: 'sightseeing',
        duration: 180,
        cost: 0,
        notes: '建议穿着舒适的鞋子',
        images: [],
        reservations: []
      },
      {
        id: this.generateId(),
        day: 1,
        date: '',
        time: '18:00-19:30',
        title: '晚餐',
        description: '在推荐的餐厅享用晚餐',
        location: '推荐餐厅',
        category: 'dining',
        duration: 90,
        cost: 120,
        notes: '可以尝试当地特色晚餐',
        images: [],
        reservations: []
      },
      {
        id: this.generateId(),
        day: 2,
        date: '',
        time: '09:00-12:00',
        title: '景点游览',
        description: '参观著名景点，了解历史文化',
        location: '著名景点',
        category: 'sightseeing',
        duration: 180,
        cost: 50,
        notes: '提前查看开放时间',
        images: [],
        reservations: []
      },
      {
        id: this.generateId(),
        day: 2,
        date: '',
        time: '12:30-13:30',
        title: '午餐',
        description: '在景点附近享用午餐',
        location: '景点附近餐厅',
        category: 'dining',
        duration: 60,
        cost: 60,
        notes: '方便快捷的午餐选择',
        images: [],
        reservations: []
      },
      {
        id: this.generateId(),
        day: 2,
        date: '',
        time: '14:30-17:00',
        title: '文化体验',
        description: '参与当地文化活动或参观博物馆',
        location: '文化场所',
        category: 'activity',
        duration: 150,
        cost: 30,
        notes: '体验当地文化特色',
        images: [],
        reservations: []
      }
    ]
  }

  // 生成唯一ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 辅助方法：获取偏好文本
  getPaceText(pace) {
    const paceMap = {
      slow: '悠闲慢游',
      moderate: '适中节奏',
      fast: '紧凑高效'
    }
    return paceMap[pace] || '适中节奏'
  }

  getAccommodationText(accommodation) {
    const accommodationMap = {
      hostel: '青年旅舍',
      hotel: '酒店',
      apartment: '公寓',
      luxury: '豪华酒店'
    }
    return accommodationMap[accommodation] || '酒店'
  }

  getTransportationText(transportation) {
    const transportationMap = {
      public: '公共交通',
      car: '自驾',
      mixed: '混合方式'
    }
    return transportationMap[transportation] || '混合方式'
  }

  getFoodText(food) {
    const foodMap = {
      local: '当地美食',
      international: '国际美食',
      budget: '经济实惠',
      luxury: '高档餐厅'
    }
    return foodMap[food] || '当地美食'
  }

  getSpecialNeeds(preferences) {
    const needs = []
    if (preferences.accessibility) needs.push('无障碍设施')
    if (preferences.petFriendly) needs.push('宠物友好')
    if (preferences.familyFriendly) needs.push('家庭友好')
    return needs.length > 0 ? needs.join('、') : '无'
  }

  // 验证API Key
  async validateApiKey() {
    try {
      const apiKey = this.getApiKey()
      
      const requestConfig = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
      
      // 使用重试机制验证API Key
      const response = await this.makeApiRequestWithRetry(
        `${this.baseURL}/models`,
        requestConfig,
        2 // 重试2次
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        let errorMessage = `API Key验证失败: ${response.status} - ${errorData.error?.message || response.statusText}`
        
        // 提供更友好的错误信息
        if (response.status === 401) {
          errorMessage = 'API Key无效或已过期，请检查设置中的API Key配置'
        } else if (response.status === 429) {
          errorMessage = 'API调用频率超限，请稍后重试'
        } else if (response.status >= 500) {
          errorMessage = 'AI服务暂时不可用，请稍后重试'
        }
        
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      
      return {
        valid: true,
        models: data.data || []
      }
    } catch (error) {
      // 提供更友好的错误信息
      let userFriendlyError = error.message
      if (error.name === 'AbortError') {
        userFriendlyError = 'API Key验证超时，请检查网络连接'
      } else if (error.message.includes('Failed to fetch')) {
        userFriendlyError = '网络连接失败，无法验证API Key'
      }
      
      throw new Error(userFriendlyError)
    }
  }

  // 网络连接诊断
  async diagnoseConnection() {
    const results = {
      dnsResolution: false,
      apiEndpointReachable: false,
      sslConnection: false,
      apiKeyValid: false,
      overallStatus: 'unknown'
    }
    
    try {
      // 测试1: DNS解析
      try {
        // 在浏览器环境中，我们可以通过创建Image对象来测试DNS解析
        await new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = resolve
          img.onerror = reject
          img.src = `https://${this.baseURL.replace('https://', '')}/favicon.ico?t=${Date.now()}`
          setTimeout(() => reject(new Error('DNS解析超时')), 5000)
        })
        results.dnsResolution = true
      } catch (error) {
        results.dnsResolution = false
      }
      
      // 测试2: API端点可达性
      try {
        const response = await fetch(`${this.baseURL}/models`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000)
        })
        results.apiEndpointReachable = response.status < 500
      } catch (error) {
        results.apiEndpointReachable = false
      }
      
      // 测试3: SSL连接
      try {
        const response = await fetch(`${this.baseURL}/models`, {
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        })
        results.sslConnection = true
      } catch (error) {
        results.sslConnection = false
      }
      
      // 测试4: API Key有效性
      try {
        const validationResult = await this.validateApiKey()
        results.apiKeyValid = validationResult.valid
      } catch (error) {
        results.apiKeyValid = false
      }
      
      // 计算总体状态
      const successCount = Object.values(results).filter(Boolean).length - 1 // 减去overallStatus
      if (successCount === 4) {
        results.overallStatus = 'healthy'
      } else if (successCount >= 2) {
        results.overallStatus = 'degraded'
      } else {
        results.overallStatus = 'unhealthy'
      }
      
    } catch (error) {
      results.overallStatus = 'error'
    }
    
    return results
  }
}

// 创建单例实例
export const aiService = new AIService()
