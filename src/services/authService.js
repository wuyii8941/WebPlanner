// 简化的认证服务 - 基于localStorage
const STORAGE_KEYS = {
  USERS: 'webplanner_users',
  CURRENT_USER: 'webplanner_current_user'
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

function setCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
}

/**
 * 简化的用户认证服务
 */
export const authService = {
  /**
   * 用户注册
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   * @returns {Promise<Object>} 用户信息
   */
  register: async (email, password) => {
    try {
      console.log('📝 开始用户注册:', { email })
      
      const users = getUsers()
      
      // 检查用户是否已存在
      if (users.find(user => user.email === email)) {
        throw new Error('用户已存在')
      }

      const newUser = {
        id: generateId(),
        uid: generateId(), // 添加uid字段
        email,
        password, // 注意：实际应用中应该加密存储
        displayName: email.split('@')[0],
        createdAt: new Date().toISOString()
      }

      users.push(newUser)
      saveUsers(users)
      
      console.log('✅ 用户注册成功:', newUser)
      
      return newUser
      
    } catch (error) {
      console.error('❌ 用户注册失败:', error.message)
      throw new Error(`注册失败: ${error.message}`)
    }
  },

  /**
   * 用户登录
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   * @returns {Promise<Object>} 用户信息
   */
  login: async (email, password) => {
    try {
      console.log('🔐 开始用户登录:', { email })
      
      const users = getUsers()
      const user = users.find(u => u.email === email && u.password === password)
      
      if (!user) {
        throw new Error('邮箱或密码错误')
      }

      setCurrentUser(user)
      console.log('✅ 用户登录成功:', user)
      
      return user
      
    } catch (error) {
      console.error('❌ 用户登录失败:', error.message)
      throw new Error(`登录失败: ${error.message}`)
    }
  },

  /**
   * 用户登出
   */
  logout: async () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
      console.log('🚪 用户已登出')
    } catch (error) {
      console.error('❌ 登出失败:', error.message)
      throw new Error(`登出失败: ${error.message}`)
    }
  },

  /**
   * 获取当前用户信息
   * @returns {Object|null} 用户信息或null
   */
  getCurrentUser: () => {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
      const user = userData ? JSON.parse(userData) : null
      console.log('👤 获取当前用户:', user)
      return user
    } catch (error) {
      console.error('❌ 获取当前用户失败:', error)
      return null
    }
  },

  /**
   * 检查用户是否已登录
   * @returns {boolean} 是否已登录
   */
  isLoggedIn: () => {
    const user = authService.getCurrentUser()
    const isLoggedIn = !!user
    console.log('🔍 检查登录状态:', isLoggedIn)
    return isLoggedIn
  },

  /**
   * 更新用户信息
   * @param {Object} userData - 用户数据
   */
  updateUser: (userData) => {
    try {
      const users = getUsers()
      const updatedUsers = users.map(user => 
        user.id === userData.id ? { ...user, ...userData } : user
      )
      saveUsers(updatedUsers)
      setCurrentUser(userData)
      console.log('📝 用户信息已更新:', userData)
    } catch (error) {
      console.error('❌ 更新用户信息失败:', error)
      throw new Error(`更新用户信息失败: ${error.message}`)
    }
  },

  /**
   * 初始化演示数据
   */
  initDemoData: () => {
    const users = getUsers()
    if (users.length === 0) {
      // 创建演示用户
      const demoUser = {
        id: 'demo-user-123',
        uid: 'demo-user-123', // 添加uid字段
        email: 'demo@example.com',
        password: 'demo123',
        displayName: '演示用户',
        createdAt: new Date().toISOString()
      }
      saveUsers([demoUser])
      console.log('🎭 演示数据已初始化')
    }
  }
}

export default authService
