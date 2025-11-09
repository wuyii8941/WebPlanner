import React, { useState } from 'react'

const TripList = ({ user, onEditTrip, onCreateTrip, onViewTrip, onDeleteTrip, onUpdateTripStatus, demoData = [] }) => {
  const [trips, setTrips] = useState(demoData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, 0, 1

  // 使用从AppPage传递的数据
  React.useEffect(() => {
    setTrips(demoData)
  }, [demoData])

  // 删除旅行 - 现在由AppPage处理
  const handleDeleteTrip = async (tripId) => {
    if (window.confirm('确定要删除这个旅行吗？此操作无法撤销。')) {
      try {
        // 调用AppPage传递的删除函数
        if (typeof onDeleteTrip === 'function') {
          await onDeleteTrip(tripId)
        }
      } catch (err) {
        setError('删除旅行失败')
        console.error('Error deleting trip:', err)
      }
    }
  }

  // 更新旅行状态 - 现在由AppPage处理
  const handleUpdateStatus = async (tripId, newStatus) => {
    try {
      if (typeof onUpdateTripStatus === 'function') {
        await onUpdateTripStatus(tripId, newStatus)
      }
    } catch (err) {
      setError('更新状态失败')
      console.error('Error updating status:', err)
    }
  }

  // 过滤旅行
  const filteredTrips = trips.filter(trip => {
    if (filter === 'all') return true
    return trip.status === filter
  })

  // 状态标签样式
  const getStatusStyle = (status) => {
    const styles = {
      0: 'bg-blue-100 text-blue-800', // 规划中
      1: 'bg-green-100 text-green-800' // 已完成
    }
    return styles[status] || styles[0]
  }

  // 状态显示文本
  const getStatusText = (status) => {
    const texts = {
      0: '规划中',
      1: '已完成'
    }
    return texts[status] || '规划中'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载旅行列表...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">我的旅行</h1>
          <p className="text-gray-600 mt-1">管理您的旅行计划</p>
        </div>
        
        <button
          onClick={onCreateTrip}
          className="mt-4 md:mt-0 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          创建新旅行
        </button>
      </div>

      {/* 过滤器 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部 ({trips.length})
          </button>
          <button
            onClick={() => setFilter(0)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 0
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            规划中 ({trips.filter(t => t.status === 0).length})
          </button>
          <button
            onClick={() => setFilter(1)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 1
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            已完成 ({trips.filter(t => t.status === 1).length})
          </button>
        </div>
      </div>

      {/* 旅行列表 */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">暂无旅行计划</h3>
          <p className="text-gray-600 mb-6">开始创建您的第一个旅行计划吧！</p>
          <button
            onClick={onCreateTrip}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            创建新旅行
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredTrips.map((trip) => (
            <div key={trip.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                {/* 旅行信息 */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-800">{trip.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(trip.status)}`}>
                      {getStatusText(trip.status)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{trip.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">目的地：</span>
                      <span className="font-medium">{trip.destination}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">时间：</span>
                      <span className="font-medium">
                        {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">天数：</span>
                      <span className="font-medium">{trip.duration} 天</span>
                    </div>
                    <div>
                      <span className="text-gray-500">预算：</span>
                      <span className="font-medium">
                        {trip.budget ? `¥${trip.budget.toLocaleString()}` : '未设置'}
                      </span>
                    </div>
                  </div>

                  {/* 兴趣标签 */}
                  {trip.preferences?.interests?.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {trip.preferences.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
                  <button
                    onClick={() => onViewTrip(trip)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    查看详情
                  </button>
                  
                  <button
                    onClick={() => onEditTrip(trip)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    编辑
                  </button>

                  {trip.status === 0 && (
                    <button
                      onClick={() => handleUpdateStatus(trip.id, 1)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      完成
                    </button>
                  )}
                  
                  {trip.status === 1 && (
                    <button
                      onClick={() => handleUpdateStatus(trip.id, 0)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      重新规划
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteTrip(trip.id)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    删除
                  </button>
                </div>
              </div>

              {/* 创建时间 */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  创建于 {new Date(trip.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TripList
