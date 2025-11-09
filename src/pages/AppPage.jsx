import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TripForm from '../components/TripForm'
import TripList from '../components/TripList'
import TripDetail from '../components/TripDetail'
import authService from '../services/authService'
import { getUserTrips, createTrip, updateTrip, deleteTrip } from '../services/tripService'

function AppPage() {
  const [currentView, setCurrentView] = useState('list') // 'list'、'form' 或 'detail'
  const [editingTrip, setEditingTrip] = useState(null)
  const [viewingTrip, setViewingTrip] = useState(null)
  const [user, setUser] = useState(null)
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // 检查用户是否已登录
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      console.log('🔒 用户未登录，重定向到登录页面')
      navigate('/login')
      return
    }

    console.log('👤 当前用户:', currentUser)
    setUser(currentUser)
    loadUserTrips(currentUser.id)
  }, [navigate])

  const loadUserTrips = async (userId) => {
    try {
      setLoading(true)
      console.log('🔍 AppPage - 加载用户旅行，用户ID:', userId)
      const userTrips = await getUserTrips(userId)
      console.log('📊 AppPage - 加载到的旅行:', userTrips)
      setTrips(userTrips)
    } catch (error) {
      console.error('❌ 加载旅行失败:', error)
    } finally {
      setLoading(false)
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
      console.log('💾 AppPage - 保存旅行数据:', tripData)
      console.log('📝 AppPage - 编辑模式:', editingTrip ? '是' : '否')
      console.log('🔑 AppPage - 编辑的旅行ID:', editingTrip?.id)
      
      let result
      if (editingTrip) {
        console.log('🔄 AppPage - 更新旅行:', editingTrip.id)
        result = await updateTrip(editingTrip.id, tripData)
      } else {
        console.log('➕ AppPage - 创建新旅行，用户ID:', user.id)
        result = await createTrip(tripData, user.id)
      }
      
      console.log('✅ AppPage - 保存成功，重新加载数据')
      await loadUserTrips(user.id)
      
      // 确保状态正确重置
      setCurrentView('list')
      setEditingTrip(null)
      
      console.log('✅ AppPage - 状态重置完成')
    } catch (error) {
      console.error('❌ 保存旅行失败:', error)
      alert('保存失败，请重试')
    }
  }

  const handleDeleteTrip = async (tripId) => {
    try {
      console.log('🗑️ AppPage - 删除旅行:', tripId)
      await deleteTrip(tripId)
      await loadUserTrips(user.id)
      if (viewingTrip && viewingTrip.id === tripId) {
        setCurrentView('list')
        setViewingTrip(null)
      }
    } catch (error) {
      console.error('❌ 删除旅行失败:', error)
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

  const handleUpdateTripStatus = async (tripId, newStatus) => {
    try {
      console.log('🔄 AppPage - 更新旅行状态:', tripId, newStatus)
      await updateTrip(tripId, { status: newStatus })
      await loadUserTrips(user.id)
      // 如果当前正在查看的旅行状态被更新，也需要更新viewingTrip
      if (viewingTrip && viewingTrip.id === tripId) {
        setViewingTrip(prev => ({ ...prev, status: newStatus }))
      }
    } catch (error) {
      console.error('❌ 更新旅行状态失败:', error)
      alert('更新状态失败，请重试')
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      navigate('/login')
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">旅行规划器</h1>
              {user && (
                <p className="text-gray-600 text-sm mt-1">
                  欢迎，{user.displayName} ({user.email})
                </p>
              )}
            </div>
            <div className="flex gap-4">
              {currentView === 'list' && (
                <button
                  onClick={handleCreateTrip}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  创建新旅行
                </button>
              )}
              <button
                onClick={() => navigate('/settings')}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                设置
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
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
              onDeleteTrip={handleDeleteTrip}
              onUpdateTripStatus={handleUpdateTripStatus}
              demoData={trips}
            />
          ) : currentView === 'form' ? (
            <TripForm
              user={user}
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

export default AppPage
