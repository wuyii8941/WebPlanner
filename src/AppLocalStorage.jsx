import React, { useState, useEffect } from 'react'
import { userService, tripService, apiKeyService, initDemoData } from './services/localStorageService'
import TripForm from './components/TripForm'
import TripList from './components/TripList'
import TripDetail from './components/TripDetail'
import SpeechTestPage from './pages/SpeechTestPage'
import Settings from './components/Settings'

// 初始化演示数据
initDemoData()

// 页面组件
function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        await userService.login(email, password)
      } else {
        await userService.register(email, password)
      }
      onLogin()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          AI旅行规划器
        </h1>
        <p className="text-center text-gray-600 mb-8">
          智能规划您的完美旅程
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {isLogin ? '没有账号？立即注册' : '已有账号？立即登录'}
          </button>
        </div>

        {/* 演示账号提示 */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">
            <strong>演示账号:</strong> demo@example.com / demo123
          </p>
        </div>
      </div>
    </div>
  )
}

function SettingsPage({ onLogout, onBack }) {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Settings onBack={onBack} />
    </div>
  )
}

function AppPage({ onLogout, onNavigateToSpeechTest, onNavigateToSettings }) {
  const [currentView, setCurrentView] = useState('list') // 'list'、'form' 或 'detail'
  const [editingTrip, setEditingTrip] = useState(null)
  const [viewingTrip, setViewingTrip] = useState(null)
  const [user] = useState(userService.getCurrentUser())
  const [trips, setTrips] = useState([])

  // 加载用户旅行
  useEffect(() => {
    if (user) {
      loadUserTrips()
    }
  }, [user])

  const loadUserTrips = async () => {
    try {
      const userTrips = await tripService.getUserTrips(user.id)
      setTrips(userTrips)
    } catch (error) {
      console.error('加载旅行失败:', error)
    }
  }

  const handleCreateTrip = () => {
    setEditingTrip(null)
    setCurrentView('form')
  }

  const handleEditTrip = (trip) => {
    setEditingTrip(trip)
    setCurrentView('form')
  }

  const handleViewTrip = (trip) => {
    setViewingTrip(trip)
    setCurrentView('detail')
  }

  const handleSaveTrip = async (tripData) => {
    try {
      if (editingTrip) {
        await tripService.updateTrip(editingTrip.id, tripData)
      } else {
        await tripService.createTrip(tripData, user.id)
      }
      await loadUserTrips()
      setCurrentView('list')
      setEditingTrip(null)
    } catch (error) {
      console.error('保存旅行失败:', error)
      alert('保存失败，请重试')
    }
  }

  const handleDeleteTrip = async (tripId) => {
    try {
      await tripService.deleteTrip(tripId)
      await loadUserTrips()
      if (viewingTrip && viewingTrip.id === tripId) {
        setCurrentView('list')
        setViewingTrip(null)
      }
    } catch (error) {
      console.error('删除旅行失败:', error)
      alert('删除失败，请重试')
    }
  }

  const handleCancel = () => {
    setCurrentView('list')
    setEditingTrip(null)
  }

  const handleBackToList = () => {
    setCurrentView('list')
    setViewingTrip(null)
  }

  const handleEditFromDetail = (trip) => {
    setEditingTrip(trip)
    setCurrentView('form')
  }

  const handleDeleteFromDetail = () => {
    if (viewingTrip) {
      handleDeleteTrip(viewingTrip.id)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">旅行规划器</h1>
            <div className="flex gap-4">
              {currentView === 'list' && (
                <button
                  onClick={handleCreateTrip}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  创建新旅行
                </button>
              )}
              <button
                onClick={onNavigateToSpeechTest}
                className="px-4 py-2 text-sm text-green-600 hover:text-green-700 font-medium"
              >
                语音测试
              </button>
              <button
                onClick={onNavigateToSettings}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                设置
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                登出
              </button>
            </div>
          </div>

          {currentView === 'list' ? (
            <TripList 
              user={user}
              onEditTrip={handleEditTrip}
              onCreateTrip={handleCreateTrip}
              onViewTrip={handleViewTrip}
              demoData={trips}
            />
          ) : currentView === 'form' ? (
            <TripForm
              trip={editingTrip}
              onSave={handleSaveTrip}
              onCancel={handleCancel}
            />
          ) : (
            <TripDetail
              trip={viewingTrip}
              onEdit={handleEditFromDetail}
              onDelete={handleDeleteFromDetail}
              onBack={handleBackToList}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function SpeechTestWrapper({ onLogout, onBack }) {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">语音识别测试</h1>
            <div className="flex gap-4">
              <button
                onClick={onBack}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                返回应用
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                登出
              </button>
            </div>
          </div>
          <SpeechTestPage />
        </div>
      </div>
    </div>
  )
}

function AppLocalStorage() {
  const [currentPage, setCurrentPage] = useState('auth')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 检查是否已有登录用户
    const currentUser = userService.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      
      // 检查API Keys是否已设置
      const apiKeys = apiKeyService.getApiKeys()
      if (apiKeys.llmApiKey && apiKeys.amapApiKey) {
        setCurrentPage('app')
      } else {
        setCurrentPage('settings')
      }
    }
  }, [])

  const handleLogin = () => {
    const currentUser = userService.getCurrentUser()
    setUser(currentUser)
    
    // 检查API Keys是否已设置
    const apiKeys = apiKeyService.getApiKeys()
    if (apiKeys.llmApiKey && apiKeys.amapApiKey) {
      setCurrentPage('app')
    } else {
      setCurrentPage('settings')
    }
  }

  const handleLogout = () => {
    userService.logout()
    setUser(null)
    setCurrentPage('auth')
  }

  // 简单的路由系统
  const renderPage = () => {
    switch (currentPage) {
      case 'auth':
        return <AuthPage onLogin={handleLogin} />
      case 'settings':
        return <SettingsPage onLogout={handleLogout} onBack={() => setCurrentPage('app')} />
      case 'app':
        return <AppPage onLogout={handleLogout} onNavigateToSpeechTest={() => setCurrentPage('speech-test')} onNavigateToSettings={() => setCurrentPage('settings')} />
      case 'speech-test':
        return <SpeechTestWrapper onLogout={handleLogout} onBack={() => setCurrentPage('app')} />
      default:
        return <AuthPage onLogin={handleLogin} />
    }
  }

  return renderPage()
}

export default AppLocalStorage
