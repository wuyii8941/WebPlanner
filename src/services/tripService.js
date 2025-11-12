import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { Trip } from '../models/Trip.js'

// 旅行集合名称
const TRIPS_COLLECTION = 'trips'

// 创建新旅行
export const createTrip = async (tripData, userId) => {
  
  try {
    const trip = new Trip({
      ...tripData,
      userId: userId,
      createdAt: new Date().toISOString()
    })
    
    // 验证数据
    const errors = trip.validate()
    
    if (errors.length > 0) {
      throw new Error(errors.join(', '))
    }

    // 计算持续时间
    trip.calculateDuration()

    const docRef = await addDoc(collection(db, TRIPS_COLLECTION), trip.toFirestore())
    
    const result = { ...trip, id: docRef.id }
    
    return result
  } catch (error) {
    console.error('❌ 创建旅行失败:', error)
    console.log('💡 错误详情:', {
      message: error.message,
      stack: error.stack
    })
    console.groupEnd()
    throw error
  }
}

// 更新旅行
export const updateTrip = async (tripId, tripData) => {
  console.group('🔄 TripService - 更新旅行')
  console.log('📋 输入数据:', { tripId, tripData })
  
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId)
    
    // 检查文档是否存在
    console.log('🔍 检查文档是否存在...')
    const tripSnap = await getDoc(tripRef)
    
    if (!tripSnap.exists()) {
      console.error('❌ 文档不存在，无法更新:', tripId)
      console.groupEnd()
      throw new Error(`旅行不存在: ${tripId}`)
    }
    
    // 获取现有数据
    const existingTrip = Trip.fromFirestore(tripSnap)
    console.log('📊 现有旅行数据:', existingTrip)
    
    // 只更新传入的字段，保留其他字段不变
    const updatedTripData = {
      ...existingTrip,
      ...tripData,
      // 确保这些关键字段不被覆盖
      id: existingTrip.id,
      userId: existingTrip.userId,
      createdAt: existingTrip.createdAt,
      // 重新计算持续时间
      duration: calculateDuration(tripData.startDate || existingTrip.startDate, tripData.endDate || existingTrip.endDate) || existingTrip.duration
    }
    
    // 创建新的Trip对象进行验证
    const trip = new Trip(updatedTripData)
    
    // 验证数据
    const errors = trip.validate()
    console.log('✅ 数据验证结果:', errors)
    
    if (errors.length > 0) {
      console.error('❌ 数据验证失败:', errors)
      console.groupEnd()
      throw new Error(errors.join(', '))
    }

    console.log('✅ 文档存在，开始更新...')
    console.log('📝 更新数据:', trip.toFirestore())
    
    // 只更新需要更新的字段，而不是整个文档
    const updateData = {
      ...trip.toFirestore(),
      updatedAt: new Date().toISOString()
    }
    
    // 移除id字段，因为Firestore文档已经有id
    delete updateData.id
    
    await updateDoc(tripRef, updateData)
    
    const result = { ...trip, id: tripId }
    console.log('🎉 更新旅行成功:', result)
    console.groupEnd()
    
    return result
  } catch (error) {
    console.error('❌ 更新旅行失败:', error)
    console.log('💡 错误详情:', {
      message: error.message,
      stack: error.stack
    })
    console.groupEnd()
    throw error
  }
}

// 计算持续时间辅助函数
const calculateDuration = (startDate, endDate) => {
  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }
  return 0
}

// 删除旅行
export const deleteTrip = async (tripId) => {
  console.group('🗑️ TripService - 删除旅行')
  console.log('📋 输入数据:', { tripId })
  
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId)
    
    // 检查文档是否存在
    console.log('🔍 检查文档是否存在...')
    const tripSnap = await getDoc(tripRef)
    
    if (!tripSnap.exists()) {
      console.error('❌ 文档不存在，无法删除:', tripId)
      console.groupEnd()
      throw new Error(`旅行不存在: ${tripId}`)
    }
    
    console.log('✅ 文档存在，开始删除...')
    await deleteDoc(tripRef)
    
    console.log('🎉 删除旅行成功:', tripId)
    console.groupEnd()
    
    return tripId
  } catch (error) {
    console.error('❌ 删除旅行失败:', error)
    console.log('💡 错误详情:', {
      message: error.message,
      stack: error.stack
    })
    console.groupEnd()
    throw error
  }
}

// 获取用户的所有旅行
export const getUserTrips = async (userId) => {
  console.group('📋 TripService - 获取用户旅行')
  console.log('📋 输入数据:', { userId })
  
  try {
    const q = query(
      collection(db, TRIPS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    
    console.log('🔍 开始查询用户旅行...')
    const querySnapshot = await getDocs(q)
    
    const trips = []
    querySnapshot.forEach((doc) => {
      trips.push(Trip.fromFirestore(doc))
    })
    
    console.log('✅ 获取用户旅行成功，数量:', trips.length)
    console.log('📊 旅行列表:', trips)
    console.groupEnd()
    
    return trips
  } catch (error) {
    console.error('❌ 获取用户旅行失败:', error)
    console.log('💡 错误详情:', {
      message: error.message,
      stack: error.stack
    })
    
    // 如果是索引错误，提供降级方案
    if (error.message.includes('requires an index')) {
      console.warn('⚠️ Firebase索引未创建，使用降级查询...')
      console.groupEnd()
      
      // 降级方案：只查询用户ID，然后在客户端排序
      try {
        const fallbackQuery = query(
          collection(db, TRIPS_COLLECTION),
          where('userId', '==', userId)
        )
        
        const fallbackSnapshot = await getDocs(fallbackQuery)
        const fallbackTrips = []
        
        fallbackSnapshot.forEach((doc) => {
          fallbackTrips.push(Trip.fromFirestore(doc))
        })
        
        // 在客户端按创建时间降序排序
        const sortedTrips = fallbackTrips.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )
        
        console.log('✅ 降级查询成功，数量:', sortedTrips.length)
        return sortedTrips
      } catch (fallbackError) {
        console.error('❌ 降级查询也失败:', fallbackError)
        console.groupEnd()
        // 如果降级也失败，返回空数组而不是抛出错误
        return []
      }
    }
    
    console.groupEnd()
    throw error
  }
}

// 获取单个旅行详情
export const getTripById = async (tripId) => {
  console.group('📋 TripService - 获取旅行详情')
  console.log('📋 输入数据:', { tripId })
  
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId)
    
    console.log('🔍 开始查询旅行详情...')
    const docSnap = await getDoc(tripRef)
    
    if (docSnap.exists()) {
      const trip = Trip.fromFirestore(docSnap)
      console.log('✅ 获取旅行详情成功:', trip)
      console.groupEnd()
      return trip
    } else {
      console.error('❌ 旅行不存在:', tripId)
      console.groupEnd()
      throw new Error('旅行不存在')
    }
  } catch (error) {
    console.error('❌ 获取旅行详情失败:', error)
    console.log('💡 错误详情:', {
      message: error.message,
      stack: error.stack
    })
    console.groupEnd()
    throw error
  }
}

// 获取特定状态的旅行
export const getTripsByStatus = async (userId, status) => {
  try {
    const q = query(
      collection(db, TRIPS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const trips = []
    
    querySnapshot.forEach((doc) => {
      trips.push(Trip.fromFirestore(doc))
    })
    
    return trips
  } catch (error) {
    console.error('获取状态旅行失败:', error)
    
    // 如果是索引错误，提供降级方案
    if (error.message.includes('requires an index')) {
      console.warn('⚠️ Firebase索引未创建，使用降级查询...')
      
      // 降级方案：只查询用户ID和状态，然后在客户端排序
      try {
        const fallbackQuery = query(
          collection(db, TRIPS_COLLECTION),
          where('userId', '==', userId),
          where('status', '==', status)
        )
        
        const fallbackSnapshot = await getDocs(fallbackQuery)
        const fallbackTrips = []
        
        fallbackSnapshot.forEach((doc) => {
          fallbackTrips.push(Trip.fromFirestore(doc))
        })
        
        // 在客户端按创建时间降序排序
        const sortedTrips = fallbackTrips.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )
        
        console.log('✅ 状态降级查询成功，数量:', sortedTrips.length)
        return sortedTrips
      } catch (fallbackError) {
        console.error('❌ 状态降级查询也失败:', fallbackError)
        // 如果降级也失败，返回空数组而不是抛出错误
        return []
      }
    }
    
    throw error
  }
}

// 更新旅行状态
export const updateTripStatus = async (tripId, status) => {
  console.group('🔄 TripService - 更新旅行状态')
  console.log('📋 输入数据:', { tripId, status })
  
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId)
    
    // 检查文档是否存在
    console.log('🔍 检查文档是否存在...')
    const tripSnap = await getDoc(tripRef)
    
    if (!tripSnap.exists()) {
      console.error('❌ 文档不存在，无法更新状态:', tripId)
      console.groupEnd()
      throw new Error(`旅行不存在: ${tripId}`)
    }
    
    console.log('✅ 文档存在，开始更新状态...')
    
    await updateDoc(tripRef, {
      status: status,
      updatedAt: new Date().toISOString()
    })
    
    console.log('🎉 更新旅行状态成功:', tripId)
    console.groupEnd()
    
    return tripId
  } catch (error) {
    console.error('❌ 更新旅行状态失败:', error)
    console.log('💡 错误详情:', {
      message: error.message,
      stack: error.stack
    })
    console.groupEnd()
    throw error
  }
}

// 添加行程项到旅行
export const addItineraryItem = async (tripId, itineraryItem) => {
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId)
    const tripSnap = await getDoc(tripRef)
    
    if (!tripSnap.exists()) {
      throw new Error('旅行不存在')
    }
    
    const tripData = tripSnap.data()
    const updatedItinerary = [...(tripData.itinerary || []), itineraryItem]
    
    await updateDoc(tripRef, {
      itinerary: updatedItinerary,
      updatedAt: new Date().toISOString()
    })
    
    return updatedItinerary
  } catch (error) {
    console.error('添加行程项失败:', error)
    throw error
  }
}

// 更新行程项
export const updateItineraryItem = async (tripId, itemId, updatedItem) => {
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId)
    const tripSnap = await getDoc(tripRef)
    
    if (!tripSnap.exists()) {
      throw new Error('旅行不存在')
    }
    
    const tripData = tripSnap.data()
    const updatedItinerary = tripData.itinerary.map(item => 
      item.id === itemId ? { ...item, ...updatedItem } : item
    )
    
    await updateDoc(tripRef, {
      itinerary: updatedItinerary,
      updatedAt: new Date().toISOString()
    })
    
    return updatedItinerary
  } catch (error) {
    console.error('更新行程项失败:', error)
    throw error
  }
}

// 删除行程项
export const deleteItineraryItem = async (tripId, itemId) => {
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId)
    const tripSnap = await getDoc(tripRef)
    
    if (!tripSnap.exists()) {
      throw new Error('旅行不存在')
    }
    
    const tripData = tripSnap.data()
    const updatedItinerary = tripData.itinerary.filter(item => item.id !== itemId)
    
    await updateDoc(tripRef, {
      itinerary: updatedItinerary,
      updatedAt: new Date().toISOString()
    })
    
    return updatedItinerary
  } catch (error) {
    console.error('删除行程项失败:', error)
    throw error
  }
}

// 费用管理相关函数

// 添加费用记录
export const addExpense = async (tripId, expenseData) => {
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId)
    const tripSnap = await getDoc(tripRef)
    
    if (!tripSnap.exists()) {
      throw new Error('旅行不存在')
    }
    
    const tripData = tripSnap.data()
    const newExpense = {
      id: Date.now().toString(),
      amount: expenseData.amount,
      category: expenseData.category,
      description: expenseData.description,
      date: expenseData.date,
      createdAt: new Date().toISOString()
    }
    
    const updatedExpenses = [...(tripData.expenses || []), newExpense]
    
    await updateDoc(tripRef, {
      expenses: updatedExpenses,
      updatedAt: new Date().toISOString()
    })
    
    return updatedExpenses
  } catch (error) {
    console.error('添加费用失败:', error)
    throw error
  }
}

// 更新费用记录
export const updateExpense = async (tripId, expenseId, updatedExpense) => {
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId)
    const tripSnap = await getDoc(tripRef)
    
    if (!tripSnap.exists()) {
      throw new Error('旅行不存在')
    }
    
    const tripData = tripSnap.data()
    const updatedExpenses = tripData.expenses.map(expense => 
      expense.id === expenseId ? { ...expense, ...updatedExpense } : expense
    )
    
    await updateDoc(tripRef, {
      expenses: updatedExpenses,
      updatedAt: new Date().toISOString()
    })
    
    return updatedExpenses
  } catch (error) {
    console.error('更新费用失败:', error)
    throw error
  }
}

// 删除费用记录
export const deleteExpense = async (tripId, expenseId) => {
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId)
    const tripSnap = await getDoc(tripRef)
    
    if (!tripSnap.exists()) {
      throw new Error('旅行不存在')
    }
    
    const tripData = tripSnap.data()
    const updatedExpenses = tripData.expenses.filter(expense => expense.id !== expenseId)
    
    await updateDoc(tripRef, {
      expenses: updatedExpenses,
      updatedAt: new Date().toISOString()
    })
    
    return updatedExpenses
  } catch (error) {
    console.error('删除费用失败:', error)
    throw error
  }
}

// 获取费用统计
export const getExpenseStats = async (tripId) => {
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId)
    const tripSnap = await getDoc(tripRef)
    
    if (!tripSnap.exists()) {
      throw new Error('旅行不存在')
    }
    
    const tripData = tripSnap.data()
    const expenses = tripData.expenses || []
    
    // 计算总费用
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    // 按类别统计
    const expensesByCategory = expenses.reduce((acc, expense) => {
      const category = expense.category
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0 }
      }
      acc[category].total += expense.amount
      acc[category].count += 1
      return acc
    }, {})
    
    // 按日期统计
    const expensesByDate = expenses.reduce((acc, expense) => {
      const date = expense.date
      if (!acc[date]) {
        acc[date] = { total: 0, count: 0 }
      }
      acc[date].total += expense.amount
      acc[date].count += 1
      return acc
    }, {})
    
    return {
      totalExpenses,
      expensesByCategory,
      expensesByDate,
      expenseCount: expenses.length
    }
  } catch (error) {
    console.error('获取费用统计失败:', error)
    throw error
  }
}
