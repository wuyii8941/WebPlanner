// 本地存储服务 - 替代Firebase的本地存储方案

const STORAGE_KEYS = {
  USERS: 'webplanner_users',
  TRIPS: 'webplanner_trips',
  API_KEYS: 'webplanner_api_keys',
  CURRENT_USER: 'webplanner_current_user'
}

// 用户管理
export const userService = {
  // 注册用户
  register: async (email, password) => {
    const users = getUsers()
    
    // 检查用户是否已存在
    if (users.find(user => user.email === email)) {
      throw new Error('用户已存在')
    }

    const newUser = {
      id: generateId(),
      email,
      password, // 注意：实际应用中应该加密存储
      displayName: email.split('@')[0],
      createdAt: new Date().toISOString()
    }

    users.push(newUser)
    saveUsers(users)
    
    // 自动登录
    setCurrentUser(newUser)
    return newUser
  },

  // 登录用户
  login: async (email, password) => {
    const users = getUsers()
    const user = users.find(u => u.email === email && u.password === password)
    
    if (!user) {
      throw new Error('邮箱或密码错误')
    }

    setCurrentUser(user)
    return user
  },

  // 登出
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
  },

  // 获取当前用户
  getCurrentUser: () => {
    const userData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    return userData ? JSON.parse(userData) : null
  },

  // 更新用户信息
  updateUser: (userData) => {
    const users = getUsers()
    const updatedUsers = users.map(user => 
      user.id === userData.id ? { ...user, ...userData } : user
    )
    saveUsers(updatedUsers)
    setCurrentUser(userData)
  }
}

// 旅行管理
export const tripService = {
  // 获取用户的所有旅行
  getUserTrips: async (userId) => {
    const trips = getTrips()
    return trips.filter(trip => trip.userId === userId)
  },

  // 创建旅行
  createTrip: async (tripData, userId) => {
    const trips = getTrips()
    const newTrip = {
      ...tripData,
      id: generateId(),
      userId,
      status: 'planning',
      itinerary: tripData.itinerary || [],
      expenses: tripData.expenses || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    trips.push(newTrip)
    saveTrips(trips)
    return newTrip
  },

  // 更新旅行
  updateTrip: async (tripId, tripData) => {
    const trips = getTrips()
    const updatedTrips = trips.map(trip => 
      trip.id === tripId ? { ...trip, ...tripData, updatedAt: new Date().toISOString() } : trip
    )
    saveTrips(updatedTrips)
    return updatedTrips.find(trip => trip.id === tripId)
  },

  // 删除旅行
  deleteTrip: async (tripId) => {
    const trips = getTrips()
    const updatedTrips = trips.filter(trip => trip.id !== tripId)
    saveTrips(updatedTrips)
    return tripId
  },

  // 获取旅行详情
  getTripById: async (tripId) => {
    const trips = getTrips()
    return trips.find(trip => trip.id === tripId)
  },

  // 添加行程项
  addItineraryItem: async (tripId, itineraryItem) => {
    const trips = getTrips()
    const trip = trips.find(t => t.id === tripId)
    if (!trip) throw new Error('旅行不存在')

    const newItem = {
      ...itineraryItem,
      id: generateId()
    }

    trip.itinerary = [...(trip.itinerary || []), newItem]
    trip.updatedAt = new Date().toISOString()
    saveTrips(trips)
    return trip.itinerary
  },

  // 更新行程项
  updateItineraryItem: async (tripId, itemId, updatedItem) => {
    const trips = getTrips()
    const trip = trips.find(t => t.id === tripId)
    if (!trip) throw new Error('旅行不存在')

    trip.itinerary = trip.itinerary.map(item => 
      item.id === itemId ? { ...item, ...updatedItem } : item
    )
    trip.updatedAt = new Date().toISOString()
    saveTrips(trips)
    return trip.itinerary
  },

  // 删除行程项
  deleteItineraryItem: async (tripId, itemId) => {
    const trips = getTrips()
    const trip = trips.find(t => t.id === tripId)
    if (!trip) throw new Error('旅行不存在')

    trip.itinerary = trip.itinerary.filter(item => item.id !== itemId)
    trip.updatedAt = new Date().toISOString()
    saveTrips(trips)
    return trip.itinerary
  },

  // 费用管理
  addExpense: async (tripId, expenseData) => {
    const trips = getTrips()
    const trip = trips.find(t => t.id === tripId)
    if (!trip) throw new Error('旅行不存在')

    const newExpense = {
      ...expenseData,
      id: generateId(),
      createdAt: new Date().toISOString()
    }

    trip.expenses = [...(trip.expenses || []), newExpense]
    trip.updatedAt = new Date().toISOString()
    saveTrips(trips)
    return trip.expenses
  },

  updateExpense: async (tripId, expenseId, updatedExpense) => {
    const trips = getTrips()
    const trip = trips.find(t => t.id === tripId)
    if (!trip) throw new Error('旅行不存在')

    trip.expenses = trip.expenses.map(expense => 
      expense.id === expenseId ? { ...expense, ...updatedExpense } : expense
    )
    trip.updatedAt = new Date().toISOString()
    saveTrips(trips)
    return trip.expenses
  },

  deleteExpense: async (tripId, expenseId) => {
    const trips = getTrips()
    const trip = trips.find(t => t.id === tripId)
    if (!trip) throw new Error('旅行不存在')

    trip.expenses = trip.expenses.filter(expense => expense.id !== expenseId)
    trip.updatedAt = new Date().toISOString()
    saveTrips(trips)
    return trip.expenses
  },

  getExpenseStats: async (tripId) => {
    const trips = getTrips()
    const trip = trips.find(t => t.id === tripId)
    if (!trip) throw new Error('旅行不存在')

    const expenses = trip.expenses || []
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    const expensesByCategory = expenses.reduce((acc, expense) => {
      const category = expense.category
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0 }
      }
      acc[category].total += expense.amount
      acc[category].count += 1
      return acc
    }, {})

    return {
      totalExpenses,
      expensesByCategory,
      expenseCount: expenses.length
    }
  }
}

// API Keys管理
export const apiKeyService = {
  getApiKeys: () => {
    const keys = localStorage.getItem(STORAGE_KEYS.API_KEYS)
    return keys ? JSON.parse(keys) : {}
  },

  saveApiKeys: (keys) => {
    localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(keys))
  }
}

// 辅助函数
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

function getUsers() {
  const users = localStorage.getItem(STORAGE_KEYS.USERS)
  return users ? JSON.parse(users) : []
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
}

function getTrips() {
  const trips = localStorage.getItem(STORAGE_KEYS.TRIPS)
  return trips ? JSON.parse(trips) : []
}

function saveTrips(trips) {
  localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips))
}

function setCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
}

// 初始化演示数据
export const initDemoData = () => {
  const users = getUsers()
  if (users.length === 0) {
    // 创建演示用户
    const demoUser = {
      id: 'demo-user-123',
      email: 'demo@example.com',
      password: 'demo123',
      displayName: '演示用户',
      createdAt: new Date().toISOString()
    }
    saveUsers([demoUser])
    
    // 创建演示旅行数据
    const demoTrips = [
      {
        id: 'demo-trip-1',
        userId: 'demo-user-123',
        title: '北京三日游',
        destination: '北京',
        description: '探索北京的历史文化和现代魅力',
        startDate: '2025-01-15',
        endDate: '2025-01-17',
        duration: 3,
        budget: 5000,
        status: 'planning',
        itinerary: [
          {
            id: 'item-1',
            day: 1,
            time: '09:00',
            title: '天安门广场',
            location: '北京市东城区',
            category: 'sightseeing',
            description: '参观天安门广场，感受国家象征',
            duration: 120,
            cost: 0
          },
          {
            id: 'item-2',
            day: 1,
            time: '11:00',
            title: '故宫博物院',
            location: '北京市东城区景山前街4号',
            category: 'sightseeing',
            description: '探索明清两代的皇家宫殿',
            duration: 180,
            cost: 60
          }
        ],
        expenses: [
          {
            id: 'expense-1',
            amount: 60,
            category: 'sightseeing',
            description: '故宫门票',
            date: '2025-01-15',
            createdAt: '2025-01-15T09:00:00Z'
          }
        ],
        createdAt: '2025-01-10T10:00:00Z',
        updatedAt: '2025-01-10T10:00:00Z'
      }
    ]
    saveTrips(demoTrips)
  }
}

// 导出所有服务
export default {
  userService,
  tripService,
  apiKeyService,
  initDemoData
}
