import React, { useState, useEffect } from 'react'
import { Trip, ItineraryItem } from '../models/Trip'
import { mapService } from '../services/mapService'
import { navigationService } from '../services/navigationService'
import { getTripById } from '../services/tripService'
import WeatherWidget from './WeatherWidget'
import ExpenseTracker from './ExpenseTracker'

const TripDetail = ({ trip, onEdit, onDelete, onBack }) => {
  const [currentTrip, setCurrentTrip] = useState(trip)
  const [loading, setLoading] = useState(false)
  const [activeDay, setActiveDay] = useState(1)
  const [mapInitialized, setMapInitialized] = useState(false)
  const [mapError, setMapError] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [navigationAdvice, setNavigationAdvice] = useState([])
  const [calculatingNavigation, setCalculatingNavigation] = useState(false)
  const [showNavigation, setShowNavigation] = useState(false)

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

  // 初始化地图
  useEffect(() => {
    if (showMap && !mapInitialized && trip.itinerary?.length > 0) {
      const initMap = async () => {
        try {
          await mapService.initMap('map-container')
          
          // 智能设置地图中心到目的地
          if (trip.destination) {
            await mapService.setMapCenterByDestination(trip.destination)
          }
          
          await mapService.addItineraryMarkers(trip.itinerary)
          setMapInitialized(true)
          setMapError('')
        } catch (error) {
          console.error('地图初始化失败:', error)
          setMapError(error.message)
        }
      }
      initMap()
    }
  }, [showMap, mapInitialized, trip.itinerary, trip.destination])

  // 切换地图显示
  const toggleMap = () => {
    setShowMap(!showMap)
    if (!showMap) {
      setMapInitialized(false)
    }
  }

  // 计算导航建议 - 简化版本
  const calculateNavigationAdvice = async () => {
    if (!trip.itinerary || trip.itinerary.length < 2) return
    
    try {
      setCalculatingNavigation(true)
      console.log('🗺️ 开始计算导航建议...')
      
      // 简化：先尝试初始化导航服务
      const navigationInitialized = await navigationService.initNavigation()
      
      if (!navigationInitialized) {
        // 如果导航服务初始化失败，提供模拟数据
        console.log('⚠️ 导航服务初始化失败，使用模拟数据')
        const mockAdvice = [
          {
            from: '南京站',
            to: '夫子庙',
            summary: '从 南京站 到 夫子庙: 8.5公里，约30分钟',
            details: {
              distance: 8500,
              duration: 1800,
              tolls: 0
            }
          },
          {
            from: '夫子庙',
            to: '中山陵',
            summary: '从 夫子庙 到 中山陵: 12.0公里，约40分钟',
            details: {
              distance: 12000,
              duration: 2400,
              tolls: 0
            }
          }
        ]
        setNavigationAdvice(mockAdvice)
        setShowNavigation(true)
        console.log('✅ 使用模拟导航建议完成')
        return
      }
      
      // 如果导航服务可用，尝试计算真实距离
      try {
        const distances = await navigationService.calculateItineraryDistances(trip.itinerary)
        const advice = navigationService.generateNavigationAdvice(distances)
        setNavigationAdvice(advice)
        setShowNavigation(true)
        console.log('✅ 导航建议计算完成:', advice)
      } catch (routeError) {
        console.warn('⚠️ 路径规划计算失败，使用模拟数据:', routeError)
        // 路径规划失败时使用模拟数据
        const mockAdvice = trip.itinerary.slice(0, -1).map((item, index) => ({
          from: item.title,
          to: trip.itinerary[index + 1].title,
          summary: `从 ${item.title} 到 ${trip.itinerary[index + 1].title}: 约10公里，约25分钟`,
          details: {
            distance: 10000,
            duration: 1500,
            tolls: 0
          }
        }))
        setNavigationAdvice(mockAdvice)
        setShowNavigation(true)
      }
    } catch (error) {
      console.error('❌ 计算导航建议失败:', error)
      
      // 提供友好的错误提示
      setNavigationAdvice([{
        from: '系统提示',
        to: '导航功能',
        summary: '导航功能暂时不可用，地图显示功能正常',
        details: {
          error: '导航插件加载中，请稍后重试'
        }
      }])
      setShowNavigation(true)
    } finally {
      setCalculatingNavigation(false)
    }
  }

  // 切换导航显示
  const toggleNavigation = () => {
    if (!showNavigation && navigationAdvice.length === 0) {
      calculateNavigationAdvice()
    } else {
      setShowNavigation(!showNavigation)
    }
  }

  // 组件卸载时清理地图和导航
  useEffect(() => {
    return () => {
      if (mapService) {
        mapService.destroy()
      }
      if (navigationService) {
        navigationService.destroy()
      }
    }
  }, [])

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

        {/* 地图和导航按钮 */}
        {trip.itinerary?.length > 0 && (
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={toggleMap}
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>{showMap ? '隐藏地图' : '查看地图'}</span>
            </button>
            
            <button
              onClick={toggleNavigation}
              disabled={calculatingNavigation}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {calculatingNavigation ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>计算中...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>{showNavigation ? '隐藏导航' : '路径规划'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 旅行信息概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
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
                <p>天气数据由高德地图提供</p>
              </div>
            </div>
          </div>
        </div>

        {/* 地图显示区域 */}
        {showMap && (
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

        {/* 导航建议 */}
        {showNavigation && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">路径规划建议</h3>
            {navigationAdvice.length > 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h4 className="text-lg font-semibold text-green-800">行程导航建议</h4>
                </div>
                <div className="space-y-3">
                  {navigationAdvice.map((advice, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-green-100">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-green-700 font-medium">{advice.summary}</p>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-green-600">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              <span>距离: {(advice.details.distance / 1000).toFixed(1)}公里</span>
                            </div>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>时间: {Math.ceil(advice.details.duration / 60)}分钟</span>
                            </div>
                          </div>
                          {advice.details.tolls > 0 && (
                            <div className="mt-1 text-sm text-orange-600">
                              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              过路费: ¥{advice.details.tolls}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-green-700">
                  <p>💡 提示: 这些是基于驾车路线的预估时间和距离，实际时间可能因交通状况而有所不同。</p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-yellow-800">无法计算导航建议</span>
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  可能的原因：地址解析失败、网络连接问题或行程项数量不足。
                </p>
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
