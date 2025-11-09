import React from 'react'

/**
 * 全局错误显示组件
 * 用于统一显示各种类型的错误信息
 */
const ErrorDisplay = ({ 
  error, 
  type = 'error', 
  title = null, 
  onRetry = null, 
  className = '',
  showDetails = false 
}) => {
  if (!error) return null

  // 根据错误类型确定样式
  const getStyles = () => {
    switch (type) {
      case 'warning':
        return {
          container: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
          icon: 'text-yellow-600',
          title: 'text-yellow-800',
          message: 'text-yellow-700'
        }
      case 'info':
        return {
          container: 'bg-blue-50 border border-blue-200 text-blue-800',
          icon: 'text-blue-600',
          title: 'text-blue-800',
          message: 'text-blue-700'
        }
      case 'success':
        return {
          container: 'bg-green-50 border border-green-200 text-green-800',
          icon: 'text-green-600',
          title: 'text-green-800',
          message: 'text-green-700'
        }
      default: // error
        return {
          container: 'bg-red-50 border border-red-200 text-red-800',
          icon: 'text-red-600',
          title: 'text-red-800',
          message: 'text-red-700'
        }
    }
  }

  const styles = getStyles()

  // 获取错误图标
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'info':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      default: // error
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  // 获取默认标题
  const getDefaultTitle = () => {
    switch (type) {
      case 'warning':
        return '警告'
      case 'info':
        return '提示'
      case 'success':
        return '成功'
      default: // error
        return '错误'
    }
  }

  // 解析错误信息
  const getErrorMessage = () => {
    if (typeof error === 'string') {
      return error
    } else if (error.message) {
      return error.message
    } else if (error.error) {
      return error.error
    } else {
      return '发生未知错误'
    }
  }

  // 获取错误详情
  const getErrorDetails = () => {
    if (typeof error === 'object' && error.stack) {
      return error.stack
    }
    return null
  }

  const errorMessage = getErrorMessage()
  const errorDetails = getErrorDetails()
  const displayTitle = title || getDefaultTitle()

  return (
    <div className={`rounded-lg p-4 ${styles.container} ${className}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${styles.title}`}>
              {displayTitle}
            </h3>
            {onRetry && (
              <button
                onClick={onRetry}
                className={`ml-4 text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${type === 'error' ? 'red' : type === 'warning' ? 'yellow' : type === 'info' ? 'blue' : 'green'}-50 focus:ring-${type === 'error' ? 'red' : type === 'warning' ? 'yellow' : type === 'info' ? 'blue' : 'green'}-600`}
              >
                重试
              </button>
            )}
          </div>
          <div className={`mt-2 text-sm ${styles.message}`}>
            <p>{errorMessage}</p>
          </div>
          
          {/* 错误详情 */}
          {showDetails && errorDetails && (
            <details className="mt-3">
              <summary className="text-sm cursor-pointer hover:underline">
                查看错误详情
              </summary>
              <pre className="mt-2 text-xs bg-black bg-opacity-10 p-2 rounded overflow-auto max-h-32">
                {errorDetails}
              </pre>
            </details>
          )}

          {/* 常见错误解决方案 */}
          {type === 'error' && (
            <div className="mt-3 text-xs">
              <p className="font-medium">建议操作：</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {errorMessage.includes('网络') && (
                  <li>检查网络连接是否正常</li>
                )}
                {errorMessage.includes('API') && (
                  <li>检查API密钥配置是否正确</li>
                )}
                {errorMessage.includes('权限') && (
                  <li>检查是否有足够的访问权限</li>
                )}
                {errorMessage.includes('Firebase') && (
                  <li>检查Firebase连接配置</li>
                )}
                <li>刷新页面重试</li>
                <li>联系技术支持</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 快捷组件
export const ErrorAlert = ({ error, onRetry, className }) => (
  <ErrorDisplay 
    error={error} 
    type="error" 
    onRetry={onRetry} 
    className={className}
  />
)

export const WarningAlert = ({ error, onRetry, className }) => (
  <ErrorDisplay 
    error={error} 
    type="warning" 
    onRetry={onRetry} 
    className={className}
  />
)

export const InfoAlert = ({ error, onRetry, className }) => (
  <ErrorDisplay 
    error={error} 
    type="info" 
    onRetry={onRetry} 
    className={className}
  />
)

export const SuccessAlert = ({ error, onRetry, className }) => (
  <ErrorDisplay 
    error={error} 
    type="success" 
    onRetry={onRetry} 
    className={className}
  />
)

export default ErrorDisplay
