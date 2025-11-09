import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AppPage from './pages/AppPage'
import Settings from './components/Settings'
import authService from './services/authService'
import ErrorBoundary from './components/ErrorBoundary'

// 受保护的路由组件
function ProtectedRoute({ children }) {
  const isLoggedIn = authService.isLoggedIn()
  
  if (!isLoggedIn) {
    console.log('🔒 访问受保护路由，重定向到登录页面')
    return <Navigate to="/login" replace />
  }
  
  return children
}

// 公共路由组件（已登录用户访问时重定向到主页）
function PublicRoute({ children }) {
  const isLoggedIn = authService.isLoggedIn()
  
  if (isLoggedIn) {
    console.log('🔒 已登录用户访问公共路由，重定向到主页')
    return <Navigate to="/app" replace />
  }
  
  return children
}

function App() {
  useEffect(() => {
    // 初始化演示数据
    authService.initDemoData()
    console.log('🎭 应用启动，演示数据已初始化')
  }, [])

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            {/* 公共路由 */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } 
            />
            
            {/* 受保护的路由 */}
            <Route 
              path="/app" 
              element={
                <ProtectedRoute>
                  <AppPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            {/* 默认路由 */}
            <Route path="/" element={<Navigate to="/app" replace />} />
            
            {/* 404 页面 */}
            <Route path="*" element={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                  <p className="text-gray-600 mb-4">页面未找到</p>
                  <a href="/app" className="text-blue-600 hover:text-blue-700 font-medium">
                    返回主页
                  </a>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
