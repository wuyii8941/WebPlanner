import React from 'react'
import ErrorDisplay from './ErrorDisplay'

/**
 * 全局错误边界组件
 * 用于捕获React组件树中的JavaScript错误，并显示降级UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    // 更新state使下一次渲染能够显示降级UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    console.error('🚨 错误边界捕获到错误:', error)
    console.error('📋 错误详情:', errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // 这里可以添加错误上报逻辑
    // this.reportError(error, errorInfo)
  }

  // 错误上报方法
  reportError(error, errorInfo) {
    // 在实际应用中，这里可以集成错误监控服务
    // 例如：Sentry, LogRocket, 或其他错误监控平台
    console.log('📤 上报错误到监控服务:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
  }

  // 重置错误状态
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  // 刷新页面
  refreshPage = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // 降级UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <ErrorDisplay
              error={this.state.error}
              title="应用发生错误"
              showDetails={true}
              className="mb-6"
            />
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                建议操作
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={this.resetError}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  重试当前操作
                </button>
                
                <button
                  onClick={this.refreshPage}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  刷新页面
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                >
                  返回首页
                </button>
              </div>
              
              <div className="mt-6 text-sm text-gray-600">
                <p className="font-medium mb-2">如果问题持续存在：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>检查网络连接</li>
                  <li>清除浏览器缓存</li>
                  <li>联系技术支持</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
