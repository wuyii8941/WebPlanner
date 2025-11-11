import React, { useState, useEffect, useRef } from 'react' // 1. 引入 useRef
import { Trip, ItineraryItem } from '../models/Trip'
import { mapService } from '../services/mapService'
import { getTripById } from '../services/tripService'
import WeatherWidget from './WeatherWidget'
import ExpenseTracker from './ExpenseTracker'

const TripDetail = ({ trip, onEdit, onDelete, onBack }) => {
  const [currentTrip, setCurrentTrip] = useState(trip)
  const [loading, setLoading] = useState(false)
  const [activeDay, setActiveDay] = useState(1)
  const [mapInitialized, setMapInitialized] = useState(false)
  const [mapError, setMapError] = useState('')
  const [mapLoading, setMapLoading] = useState(false)
  
  // 创建 Refs 来持有 DOM 元素和地图实例
  const mapContainerRef = useRef(null) // 持有 DOM 容器
  const mapInstanceRef = useRef(null)  // 持有地图 API 实例 (e.g., BMap.Map)

  // 从数据库重新加载旅行数据
  useEffect(() => {
    const loadTripData = async () => {
      if (trip && trip.id) {
        try {
          setLoading(true)
          console.log('🔄 TripDetail - 从数据库重新加载旅行数据:', trip.id)
          const freshTrip = await getTripById(trip.id)
          setCurrentTrip(freshTrip)
          console.log('✅ TripDetail - 旅行数据重新加载成功')
        } catch (error) {
          console.error('❌ TripDetail - 重新加载旅行数据失败:', error)
          // 如果重新加载失败，继续使用传入的数据
          setCurrentTrip(trip)
        } finally {
          setLoading(false)
        }
      }
    }

    loadTripData()
  }, [trip])

  // 按天分组行程项
  const itineraryByDay = trip.itinerary?.reduce((acc, item) => {
    const day = item.day || 1
    if (!acc[day]) {
      acc[day] = []
    }
    acc[day].push(item)
    return acc
  }, {}) || {}

  // 获取所有天数
  const days = Object.keys(itineraryByDay).map(Number).sort((a, b) => a - b)

  // 获取类别图标
  const getCategoryIcon = (category) => {
    const icons = {
      sightseeing: '🏛️',
      dining: '🍽️',
      accommodation: '🏨',
      transportation: '🚗',
      activity: '🎯'
    }
    return icons[category] || '📍'
  }

  // 获取类别颜色
  const getCategoryColor = (category) => {
    const colors = {
      sightseeing: 'bg-blue-100 text-blue-800 border-blue-200',
      dining: 'bg-green-100 text-green-800 border-green-200',
      accommodation: 'bg-purple-100 text-purple-800 border-purple-200',
      transportation: 'bg-orange-100 text-orange-800 border-orange-200',
      activity: 'bg-pink-100 text-pink-800 border-pink-200'
    }
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // 计算总费用
  const totalCost = trip.itinerary?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 懒加载地图 - 组件挂载后自动初始化
  useEffect(() => {
    // 检查是否有行程项，如果没有则不显示地图
    if (!trip.itinerary || trip.itinerary.length === 0) {
      return
    }

    // 检查 DOM 元素是否存在，如果不存在则返回
    if (!mapContainerRef.current) {
      return
    }
    
    // 检查是否已经初始化，如果已经初始化则返回
    if (mapInstanceRef.current) {
      return
    }

    setMapLoading(true)
    setMapError('')
    
    // 延迟加载地图，避免阻塞页面渲染
    const timer = setTimeout(() => {
      mapService.showTripOnMap(trip, mapContainerRef.current) 
        .then((mapInstance) => {
          if (!mapInstance) {
            throw new Error('mapService.showTripOnMap 未返回 map 实例')
          }
          
          mapInstanceRef.current = mapInstance // 保存实例
          setMapInitialized(true)
        })
        .catch((error) => {
          console.error('地图初始化失败:', error)
          setMapError(error.message)
        })
        .finally(() => {
          setMapLoading(false)
        })
    }, 500) // 延迟500ms加载，确保DOM已渲染

    return () => {
      clearTimeout(timer)
    }
  }, [trip]) // 只在 trip 变化时重新初始化

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm">
      {/* 头部信息 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl p-6">
        <div className="flex justify-between items-start">
          <div>
            <button
              onClick={onBack}
              className="flex items-center text-blue-100 hover:text-white mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回列表
            </button>
            <h1 className="text-3xl font-bold mb-2">{trip.title}</h1>
            <p className="text-blue-100 text-lg">{trip.destination}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              删除
            </button>
          </div>
        </div>


        {/* 旅行信息概览 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="text-sm text-blue-100">旅行日期</div>
            <div className="font-semibold">
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="text-sm text-blue-100">旅行天数</div>
            <div className="font-semibold">{trip.duration} 天</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="text-sm text-blue-100">预算</div>
            <div className="font-semibold">
              {trip.budget ? `¥${trip.budget.toLocaleString()}` : '未设置'}
            </div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="text-sm text-blue-100">旅行人数</div>
            <div className="font-semibold">{trip.travelers || 1} 人</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="text-sm text-blue-100">行程项</div>
            <div className="font-semibold">{trip.itinerary?.length || 0} 项</div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        {/* 旅行描述 */}
        {trip.description && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">旅行描述</h3>
            <p className="text-gray-600 leading-relaxed">{trip.description}</p>
          </div>
        )}

        {/* 目的地天气信息 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">目的地天气</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WeatherWidget 
              location={{ city: trip.destination }}
              className="w-full"
            />
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <h4 className="text-cyan-800 font-medium mb-2">天气提示</h4>
              <ul className="text-cyan-700 text-sm space-y-2">
                <li>• 实时天气信息帮助您更好地准备行程</li>
                <li>• 根据天气调整户外活动安排</li>
                <li>• 注意携带合适的衣物和雨具</li>
                <li>• 点击"刷新天气"获取最新天气数据</li>
              </ul>
              <div className="mt-4 text-xs text-cyan-600">
                <p>天气数据由百度地图提供</p>
              </div>
            </div>
          </div>
        </div>

        {/* 地图显示区域 - 始终显示（如果有行程项） */}
        {trip.itinerary && trip.itinerary.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">行程地图</h3>
            {mapError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>{mapError}</span>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  ref={mapContainerRef}
                  id="map-container"
                  className="w-full h-96 bg-gray-100"
                >
                  {!mapInitialized && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">地图加载中...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    地图显示了所有行程地点的位置，点击标记查看详细信息
                  </p>
                </div>
              </div>
            )}
          </div>
        )}


        {/* 费用概览 */}
        {totalCost > 0 && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-yellow-800">费用概览</h4>
                <p className="text-yellow-700">预估总费用: ¥{totalCost.toLocaleString()}</p>
              </div>
              {trip.budget && (
                <div className="text-right">
                  <p className="text-yellow-700">预算: ¥{trip.budget.toLocaleString()}</p>
                  <p className={`text-sm ${totalCost > trip.budget ? 'text-red-600' : 'text-green-600'}`}>
                    {totalCost > trip.budget ? '超出预算' : '在预算内'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 行程导航 */}
        {days.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">行程安排</h3>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {days.map(day => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeDay === day
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  第 {day} 天
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 行程详情 */}
        {itineraryByDay[activeDay] ? (
          <div className="space-y-4">
            {itineraryByDay[activeDay].map((item, index) => (
              <div
                key={item.id || index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getCategoryColor(item.category)}`}>
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-800">{item.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(item.category)}`}>
                          {item.category === 'sightseeing' && '景点'}
                          {item.category === 'dining' && '餐饮'}
                          {item.category === 'accommodation' && '住宿'}
                          {item.category === 'transportation' && '交通'}
                          {item.category === 'activity' && '活动'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{item.time}</span>
                            <span>·</span>
                            <span>{item.duration}分钟</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{item.location}</span>
                          </div>
                        </div>
                        
                        <div>
                          {item.cost > 0 && (
                            <div className="flex items-center space-x-2 mb-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              <span>¥{item.cost.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {item.description && (
                        <p className="mt-2 text-gray-700 leading-relaxed">{item.description}</p>
                      )}

                      {item.notes && (
                        <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">注意事项: </span>
                            {item.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无行程安排</h3>
            <p className="text-gray-500">该日期没有安排任何活动</p>
          </div>
        )}

        {/* 费用管理 */}
        <div className="mt-8">
          <ExpenseTracker 
            trip={trip}
            onExpenseUpdate={(expenses) => {
              // 这里可以添加保存到数据库的逻辑
              console.log('费用更新:', expenses)
            }}
          />
        </div>

        {/* AI生成标识 */}
        {trip.aiGenerated && (
          <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-purple-800 font-medium">AI智能生成</span>
            </div>
            <p className="text-sm text-purple-700 mt-1">
              此行程由AI根据您的旅行偏好自动生成，您可以根据需要进行调整。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TripDetail
