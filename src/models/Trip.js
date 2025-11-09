// 旅行数据结构模型
export class Trip {
  constructor(data = {}) {
    this.id = data.id || ''
    this.userId = data.userId || ''
    this.title = data.title || ''
    this.description = data.description || ''
    this.destination = data.destination || ''
    this.startDate = data.startDate || ''
    this.endDate = data.endDate || ''
    this.duration = data.duration || 0
    this.budget = data.budget || 0
    this.travelers = data.travelers || 1
    this.preferences = data.preferences || {
      interests: [],
      pace: 'moderate', // slow, moderate, fast
      accommodation: 'hotel', // hotel, hostel, apartment, luxury
      transportation: 'mixed', // car, public, mixed
      food: 'local' // local, international, budget, luxury
    }
    this.itinerary = data.itinerary || []
    this.status = data.status || 0 // 0: 规划中, 1: 已完成
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
    this.aiGenerated = data.aiGenerated || false
    this.expenses = data.expenses || []
  }

  // 验证旅行数据
  validate() {
    const errors = []

    if (!this.title.trim()) {
      errors.push('旅行标题不能为空')
    }

    if (!this.destination.trim()) {
      errors.push('目的地不能为空')
    }

    if (!this.startDate) {
      errors.push('开始日期不能为空')
    }

    if (!this.endDate) {
      errors.push('结束日期不能为空')
    }

    if (new Date(this.startDate) >= new Date(this.endDate)) {
      errors.push('结束日期必须晚于开始日期')
    }

    if (this.budget < 0) {
      errors.push('预算不能为负数')
    }

    if (this.travelers < 1) {
      errors.push('旅行人数至少为1人')
    }

    return errors
  }

  // 计算旅行天数
  calculateDuration() {
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate)
      const end = new Date(this.endDate)
      const diffTime = Math.abs(end - start)
      this.duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    }
    return this.duration
  }

  // 转换为Firestore文档格式
  toFirestore() {
    return {
      userId: this.userId,
      title: this.title,
      description: this.description,
      destination: this.destination,
      startDate: this.startDate,
      endDate: this.endDate,
      duration: this.duration,
      budget: this.budget,
      travelers: this.travelers,
      preferences: this.preferences,
      itinerary: this.itinerary,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: new Date().toISOString(),
      aiGenerated: this.aiGenerated,
      expenses: this.expenses
    }
  }

  // 从Firestore文档创建Trip实例
  static fromFirestore(doc) {
    const data = doc.data()
    return new Trip({
      id: doc.id,
      ...data
    })
  }
}

// 行程项数据结构
export class ItineraryItem {
  constructor(data = {}) {
    this.id = data.id || ''
    this.day = data.day || 1
    this.date = data.date || ''
    this.time = data.time || ''
    this.title = data.title || ''
    this.description = data.description || ''
    this.location = data.location || ''
    this.coordinates = data.coordinates || { lat: 0, lng: 0 }
    this.category = data.category || 'sightseeing' // sightseeing, dining, accommodation, transportation, activity
    this.duration = data.duration || 60 // 分钟
    this.cost = data.cost || 0
    this.notes = data.notes || ''
    this.images = data.images || []
    this.reservations = data.reservations || []
  }
}

// 旅行偏好结构
export class TravelPreferences {
  constructor(data = {}) {
    this.interests = data.interests || []
    this.pace = data.pace || 'moderate'
    this.accommodation = data.accommodation || 'hotel'
    this.transportation = data.transportation || 'mixed'
    this.food = data.food || 'local'
    this.accessibility = data.accessibility || false
    this.petFriendly = data.petFriendly || false
    this.familyFriendly = data.familyFriendly || false
  }
}
