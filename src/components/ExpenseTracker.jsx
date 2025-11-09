import React, { useState, useEffect } from 'react'
import { speechService } from '../services/speechService'
import { addExpense, deleteExpense, updateTrip } from '../services/tripService'

const ExpenseTracker = ({ trip, onExpenseUpdate }) => {
  const [expenses, setExpenses] = useState(trip.expenses || [])
  const [showForm, setShowForm] = useState(false)
  const [speechListening, setSpeechListening] = useState(false)
  const [speechTranscript, setSpeechTranscript] = useState('')
  const [formData, setFormData] = useState({
    amount: '',
    category: 'food',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  // 费用类别选项
  const expenseCategories = [
    { value: 'food', label: '餐饮', icon: '🍽️' },
    { value: 'transportation', label: '交通', icon: '🚗' },
    { value: 'accommodation', label: '住宿', icon: '🏨' },
    { value: 'shopping', label: '购物', icon: '🛍️' },
    { value: 'entertainment', label: '娱乐', icon: '🎭' },
    { value: 'sightseeing', label: '景点', icon: '🏛️' },
    { value: 'other', label: '其他', icon: '💰' }
  ]

  // 计算总费用
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const budgetRemaining = trip.budget ? trip.budget - totalExpenses : 0

  // 按类别统计费用
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0 }
    }
    acc[category].total += expense.amount
    acc[category].count += 1
    return acc
  }, {})

  // 添加新费用
  const handleAddExpense = async () => {
    if (!formData.amount || !formData.description) {
      alert('请填写金额和描述')
      return
    }

    try {
      const expenseData = {
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date
      }

      // 保存到数据库
      const updatedExpenses = await addExpense(trip.id, expenseData)
      setExpenses(updatedExpenses)
      setShowForm(false)
      setFormData({
        amount: '',
        category: 'food',
        description: '',
        date: new Date().toISOString().split('T')[0]
      })

      // 通知父组件更新
      if (onExpenseUpdate) {
        onExpenseUpdate(updatedExpenses)
      }
    } catch (error) {
      console.error('保存费用失败:', error)
      alert('保存费用失败，请重试')
    }
  }

  // 删除费用
  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('确定要删除这笔费用吗？')) {
      try {
        const updatedExpenses = await deleteExpense(trip.id, expenseId)
        setExpenses(updatedExpenses)
        
        if (onExpenseUpdate) {
          onExpenseUpdate(updatedExpenses)
        }
      } catch (error) {
        console.error('删除费用失败:', error)
        alert('删除费用失败，请重试')
      }
    }
  }

  // 语音记录费用
  const handleSpeechExpense = () => {
    if (speechListening) {
      handleSpeechStop()
      return
    }

    const success = speechService.startListening({
      onResult: (transcript, isFinal) => {
        setSpeechTranscript(transcript)
        
        if (isFinal) {
          // 解析语音输入
          const parsedExpense = parseSpeechExpense(transcript)
          if (parsedExpense) {
            setFormData(prev => ({
              ...prev,
              amount: parsedExpense.amount.toString(),
              description: parsedExpense.description,
              category: parsedExpense.category
            }))
            setShowForm(true)
          }
          setSpeechListening(false)
          setSpeechTranscript('')
        }
      },
      onStart: () => {
        setSpeechListening(true)
      },
      onError: (error) => {
        console.error('语音识别错误:', error)
        setSpeechListening(false)
        setSpeechTranscript('')
        alert('语音识别失败，请重试')
      },
      onEnd: () => {
        setSpeechListening(false)
        setSpeechTranscript('')
      }
    })
    
    if (!success) {
      alert('语音识别功能不可用')
    }
  }

  // 解析语音输入的费用
  const parseSpeechExpense = (transcript) => {
    console.log('语音识别结果:', transcript)
    
    // 改进的金额识别逻辑，支持中文数字和多种格式
    let amount = null
    let amountMatch = null
    
    // 1. 首先尝试匹配"二百元"、"三百块"等中文数字+货币单位的格式
    const chineseNumberMap = {
      '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5,
      '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
      '百': 100, '千': 1000, '万': 10000
    }
    
    // 匹配"二百元"、"三百块"等格式
    const chineseCurrencyMatch = transcript.match(/([一二两三四五六七八九十])([百千万])(?:[元块])?/)
    if (chineseCurrencyMatch) {
      const numChar = chineseCurrencyMatch[1]
      const unitChar = chineseCurrencyMatch[2]
      const num = chineseNumberMap[numChar]
      const unit = chineseNumberMap[unitChar]
      if (num && unit) {
        amount = num * unit
        amountMatch = chineseCurrencyMatch[0]
      }
    }
    
    // 2. 如果没匹配到中文数字，尝试匹配标准数字格式（整数或小数）
    if (!amountMatch) {
      amountMatch = transcript.match(/(\d+(?:\.\d{1,2})?)/)
      if (amountMatch) {
        amount = parseFloat(amountMatch[1])
      }
    }
    
    // 3. 如果还是没匹配到，尝试匹配"点"分隔的数字
    if (!amountMatch) {
      const pointMatch = transcript.match(/(\d+)点(\d+)/)
      if (pointMatch) {
        amount = parseFloat(`${pointMatch[1]}.${pointMatch[2]}`)
        amountMatch = pointMatch
      }
    }
    
    // 4. 如果还是没匹配到，尝试匹配"块"、"元"等货币单位前的数字
    if (!amountMatch) {
      const currencyMatch = transcript.match(/(\d+(?:\.\d{1,2})?)[块元]/)
      if (currencyMatch) {
        amount = parseFloat(currencyMatch[1])
        amountMatch = currencyMatch
      }
    }

    // 5. 如果还是没匹配到，尝试匹配纯中文数字
    if (!amountMatch) {
      const chinesePattern = /([一二两三四五六七八九十百千万]+)/g
      const matches = transcript.match(chinesePattern)
      
      if (matches) {
        const chineseText = matches[0]
        let tempAmount = 0
        
        // 处理"二百"、"三千"等格式
        const unitMatch = chineseText.match(/([一二两三四五六七八九十])([百千万])/)
        if (unitMatch) {
          const numChar = unitMatch[1]
          const unitChar = unitMatch[2]
          const num = chineseNumberMap[numChar]
          const unit = chineseNumberMap[unitChar]
          if (num && unit) {
            tempAmount = num * unit
          }
        } else {
          // 处理单个数字
          tempAmount = chineseNumberMap[chineseText] || 0
        }
        
        if (tempAmount > 0) {
          amount = tempAmount
          amountMatch = [chineseText]
        }
      }
    }

    if (!amountMatch || amount <= 0) {
      alert(`未识别到有效金额，请重试。识别内容: "${transcript}"`)
      return null
    }

    console.log('识别到的金额:', amount)

    let category = 'other'
    let description = transcript.replace(amountMatch[0], '').trim()

    // 根据关键词判断类别（扩展关键词）
    if (transcript.includes('吃饭') || transcript.includes('餐厅') || transcript.includes('美食') || 
        transcript.includes('早餐') || transcript.includes('午餐') || transcript.includes('晚餐') ||
        transcript.includes('小吃') || transcript.includes('饮料') || transcript.includes('咖啡')) {
      category = 'food'
    } else if (transcript.includes('交通') || transcript.includes('打车') || transcript.includes('地铁') ||
               transcript.includes('公交') || transcript.includes('火车') || transcript.includes('飞机') ||
               transcript.includes('出租车') || transcript.includes('油费') || transcript.includes('停车')) {
      category = 'transportation'
    } else if (transcript.includes('酒店') || transcript.includes('住宿') || transcript.includes('旅馆') ||
               transcript.includes('民宿') || transcript.includes('房间')) {
      category = 'accommodation'
    } else if (transcript.includes('购物') || transcript.includes('买') || transcript.includes('商场') ||
               transcript.includes('超市') || transcript.includes('衣服') || transcript.includes('纪念品')) {
      category = 'shopping'
    } else if (transcript.includes('景点') || transcript.includes('门票') || transcript.includes('公园') ||
               transcript.includes('博物馆') || transcript.includes('展览')) {
      category = 'sightseeing'
    } else if (transcript.includes('电影') || transcript.includes('娱乐') || transcript.includes('游戏') ||
               transcript.includes('演出') || transcript.includes('KTV')) {
      category = 'entertainment'
    }

    // 如果描述为空，使用类别作为默认描述
    if (!description) {
      const categoryInfo = expenseCategories.find(cat => cat.value === category)
      description = `语音记录${categoryInfo?.label || '其他'}费用`
    }

    return {
      amount,
      category,
      description: description || '语音记录费用'
    }
  }

  const handleSpeechStop = () => {
    speechService.stopListening()
    setSpeechListening(false)
    setSpeechTranscript('')
  }

  // 检查浏览器是否支持语音识别
  const isSpeechSupported = speechService.isSupported()

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">费用管理</h3>
        <div className="flex space-x-3">
          {isSpeechSupported && (
            <button
              onClick={handleSpeechExpense}
              className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors ${
                speechListening
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {speechListening ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z"/>
                  </svg>
                  <span>停止录音</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>语音记账</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            手动记账
          </button>
        </div>
      </div>

      {/* 语音识别状态 */}
      {speechListening && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
            <span className="text-blue-800 font-medium">正在录音...</span>
          </div>
          {speechTranscript && (
            <p className="text-blue-700 mt-2">识别中: {speechTranscript}</p>
          )}
        </div>
      )}

      {/* 费用概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-600 text-sm">总支出</div>
          <div className="text-2xl font-bold text-blue-800">¥{totalExpenses.toLocaleString()}</div>
        </div>
        
        {trip.budget && (
          <div className={`border rounded-lg p-4 ${
            budgetRemaining >= 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className={`text-sm ${
              budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {budgetRemaining >= 0 ? '剩余预算' : '超出预算'}
            </div>
            <div className={`text-2xl font-bold ${
              budgetRemaining >= 0 ? 'text-green-800' : 'text-red-800'
            }`}>
              ¥{Math.abs(budgetRemaining).toLocaleString()}
            </div>
          </div>
        )}

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-purple-600 text-sm">记录笔数</div>
          <div className="text-2xl font-bold text-purple-800">{expenses.length}</div>
        </div>
      </div>

      {/* 费用类别统计 */}
      {Object.keys(expensesByCategory).length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">费用分类</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(expensesByCategory).map(([category, data]) => {
              const categoryInfo = expenseCategories.find(cat => cat.value === category)
              return (
                <div key={category} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">{categoryInfo?.label || category}</div>
                      <div className="text-lg font-bold text-gray-800">¥{data.total.toLocaleString()}</div>
                    </div>
                    <div className="text-2xl">{categoryInfo?.icon || '💰'}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{data.count} 笔记录</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 费用表单 */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">记录新费用</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">金额 (元)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">类别</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {expenseCategories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="费用描述..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">日期</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleAddExpense}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              保存费用
            </button>
          </div>
        </div>
      )}

      {/* 费用列表 */}
      {expenses.length > 0 ? (
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">费用记录</h4>
          <div className="space-y-3">
            {expenses.map((expense) => {
              const categoryInfo = expenseCategories.find(cat => cat.value === expense.category)
              return (
                <div key={expense.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                        {categoryInfo?.icon || '💰'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">¥{expense.amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{expense.description}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(expense.date).toLocaleDateString()} · {categoryInfo?.label || expense.category}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">暂无费用记录</h4>
          <p className="text-gray-500">开始记录您的旅行费用吧！</p>
        </div>
      )}
    </div>
  )
}

export default ExpenseTracker
