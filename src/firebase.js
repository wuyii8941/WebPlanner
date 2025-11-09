import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

console.group('🔥 Firebase服务 - 初始化')
console.log('🚀 开始初始化Firebase...')

// Firebase配置
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key-here",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
}

console.log('📋 Firebase配置信息:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKeyConfigured: !!import.meta.env.VITE_FIREBASE_API_KEY,
  authDomainConfigured: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectIdConfigured: !!import.meta.env.VITE_FIREBASE_PROJECT_ID
})

let app, auth, db

try {
  // 初始化Firebase
  app = initializeApp(firebaseConfig)
  console.log('✅ Firebase初始化成功')

  // 初始化Firebase服务
  auth = getAuth(app)
  db = getFirestore(app)
  
  console.log('✅ Firebase服务初始化成功:', {
    auth: !!auth,
    firestore: !!db,
    app: !!app
  })
  
  console.log('🎉 Firebase所有服务就绪!')
  console.groupEnd()

} catch (error) {
  console.error('❌ Firebase初始化失败:', error)
  console.log('💡 错误详情:', {
    message: error.message,
    stack: error.stack
  })
  console.log('🔧 故障排除建议:')
  console.log('• 检查.env文件中的Firebase配置')
  console.log('• 验证Firebase项目是否已启用')
  console.log('• 检查网络连接')
  console.groupEnd()
  
  throw error
}

export { auth, db }
export default app
