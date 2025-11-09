// 语音识别服务
class SpeechService {
  constructor() {
    this.recognition = null
    this.isListening = false
    this.shouldContinueListening = false
    this.onResultCallback = null
    this.onErrorCallback = null
    this.onEndCallback = null
    
    this.initSpeechRecognition()
  }

  // 初始化语音识别
  initSpeechRecognition() {
    // 检查浏览器是否支持语音识别
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.warn('浏览器不支持语音识别API')
      return false
    }

    try {
      this.recognition = new SpeechRecognition()
      this.recognition.continuous = true  // 改为true，支持连续识别
      this.recognition.interimResults = true
      this.recognition.lang = 'zh-CN' // 中文识别
      this.recognition.maxAlternatives = 1

      // 设置事件监听器
      this.recognition.onstart = () => {
        this.isListening = true
        console.log('语音识别开始')
      }

      this.recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        const displayText = finalTranscript || interimTranscript
        const isFinal = finalTranscript.length > 0

        if (this.onResultCallback) {
          this.onResultCallback(displayText, isFinal)
        }
      }

      this.recognition.onerror = (event) => {
        console.error('语音识别错误:', event.error, event)
        this.isListening = false
        
        let errorMessage = '语音识别错误'
        let shouldRetry = false
        
        switch(event.error) {
          case 'not-allowed':
            errorMessage = '麦克风权限被拒绝，请允许浏览器访问麦克风'
            break
          case 'no-speech':
            errorMessage = '没有检测到语音，请大声清晰地说话'
            shouldRetry = true
            break
          case 'audio-capture':
            errorMessage = '无法访问麦克风设备，请检查麦克风连接'
            break
          case 'network':
            // 针对网络错误的特殊处理
            if (window.location.protocol === 'http:') {
              errorMessage = '语音识别需要HTTPS连接。在本地开发环境中，请使用Chrome浏览器并启用不安全内容权限，或部署到HTTPS服务器。'
            } else {
              errorMessage = '网络连接错误，请检查网络连接后重试'
            }
            shouldRetry = true
            break
          case 'aborted':
            errorMessage = '语音识别被中止，可能是网络问题或浏览器限制'
            shouldRetry = true
            break
          case 'not-supported':
            errorMessage = '浏览器不支持语音识别功能'
            break
          case 'service-not-allowed':
            errorMessage = '语音识别服务不可用，可能是网络限制'
            break
          case 'bad-grammar':
            errorMessage = '语法错误，请使用标准中文表达'
            break
          case 'language-not-supported':
            errorMessage = '不支持当前语言，请使用中文普通话'
            break
        }
        
        // 添加详细的接口错误信息和解决方案
        let detailedError = `${errorMessage} (错误代码: ${event.error})`
        
        // 为特定错误提供更详细的指导
        if (event.error === 'no-speech') {
          detailedError += '\n💡 解决方案: \n' +
            '• 请大声清晰地说话\n' +
            '• 确保在安静环境中使用\n' +
            '• 检查麦克风是否正常工作\n' +
            '• 尝试靠近麦克风说话'
        } else if (event.error === 'network' && window.location.protocol === 'http:') {
          detailedError += '\n💡 本地开发解决方案: \n' +
            '• 使用Chrome浏览器访问 chrome://flags/#unsafely-treat-insecure-origin-as-secure\n' +
            '• 添加 http://localhost:3000 到允许的域名列表\n' +
            '• 重启浏览器并重试\n' +
            '• 或部署到HTTPS服务器'
        }
        
        if (this.onErrorCallback) {
          this.onErrorCallback(detailedError)
        }
        
        // 输出详细的调试信息到控制台
        console.group('语音识别接口错误详情')
        console.log('错误类型:', event.error)
        console.log('错误消息:', event.message)
        console.log('事件类型:', event.type)
        console.log('时间戳:', event.timeStamp)
        console.log('浏览器信息:', navigator.userAgent)
        console.log('网络状态:', navigator.onLine)
        console.log('当前语言:', navigator.language)
        console.log('当前协议:', window.location.protocol)
        console.groupEnd()
        
        // 如果是可重试的错误，自动重试
        if (shouldRetry && this.shouldContinueListening) {
          console.log(`将在1秒后自动重试 (错误: ${event.error})`)
          setTimeout(() => {
            this._safeRestart()
          }, 1000)
        }
      }

      this.recognition.onend = () => {
        this.isListening = false
        console.log('语音识别结束')
        
        if (this.onEndCallback) {
          this.onEndCallback()
        }
        
        // 如果用户仍在监听状态，自动重新开始（模拟连续识别）
        if (this.shouldContinueListening) {
          console.log('自动重新开始语音识别...')
          setTimeout(() => {
            this._safeRestart()
          }, 1000) // 增加延迟避免冲突
        }
      }

      return true
    } catch (error) {
      console.error('初始化语音识别失败:', error)
      return false
    }
  }

  // 开始语音识别
  startListening(options = {}) {
    if (!this.recognition) {
      if (!this.initSpeechRecognition()) {
        if (this.onErrorCallback) {
          this.onErrorCallback('浏览器不支持语音识别')
        }
        return false
      }
    }

    // 如果已经在监听，先停止
    if (this.isListening) {
      this.stopListening()
      // 等待一小段时间让之前的识别完全停止
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this._startListeningInternal(options))
        }, 300)
      })
    }

    // 设置20秒超时
    this.timeoutDuration = 20000 // 20秒
    this.timeoutId = setTimeout(() => {
      if (this.isListening) {
        console.log('语音识别超时，自动停止')
        this.stopListening()
        if (this.onEndCallback) {
          this.onEndCallback()
        }
      }
    }, this.timeoutDuration)

    return this._startListeningInternal(options)
  }

  // 内部启动方法
  _startListeningInternal(options = {}) {
    // 设置回调函数
    this.onResultCallback = options.onResult || null
    this.onErrorCallback = options.onError || null
    this.onEndCallback = options.onEnd || null
    this.onStartCallback = options.onStart || null
    this.shouldContinueListening = true  // 启用连续监听

    try {
      // 检查网络连接
      if (!navigator.onLine) {
        throw new Error('网络连接不可用')
      }
      
      // 添加更详细的启动日志
      console.group('语音识别服务启动信息')
      console.log('正在启动语音识别服务...')
      console.log('浏览器支持状态:', this.isSupported())
      console.log('网络状态:', navigator.onLine)
      console.log('识别语言:', 'zh-CN')
      console.log('连续识别模式:', this.recognition.continuous)
      console.groupEnd()
      
      // 调用开始回调
      if (this.onStartCallback) {
        this.onStartCallback()
      }
      
      this.recognition.start()
      console.log('语音识别服务启动成功')
      return true
    } catch (error) {
      console.group('语音识别启动失败详情')
      console.error('启动语音识别失败:', error)
      console.log('错误名称:', error.name)
      console.log('错误消息:', error.message)
      console.log('错误堆栈:', error.stack)
      console.log('浏览器信息:', navigator.userAgent)
      console.groupEnd()
      
      let errorMessage = '启动语音识别失败'
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        errorMessage = '语音识别被中止，请检查网络连接后重试'
      } else if (error.message === '网络连接不可用') {
        errorMessage = '网络连接不可用，请检查网络连接'
      } else if (error.message.includes('already started')) {
        errorMessage = '语音识别已在运行中，请稍后重试'
        // 如果是已经在运行，不需要重试
        this.shouldContinueListening = false
      }
      
      if (this.onErrorCallback) {
        this.onErrorCallback(errorMessage)
      }
      
      // 如果是网络问题，自动重试
      if (error.message === '网络连接不可用' && this.shouldContinueListening) {
        console.log('网络问题，将在2秒后重试...')
        setTimeout(() => {
          this._safeRestart()
        }, 2000)
      }
      
      return false
    }
  }

  // 停止语音识别
  stopListening() {
    this.shouldContinueListening = false  // 停止连续监听
    // 清除超时定时器
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop()
        this.isListening = false
      } catch (error) {
        console.error('停止语音识别失败:', error)
      }
    }
  }

  // 安全重启语音识别
  _safeRestart() {
    if (this.recognition && !this.isListening && this.shouldContinueListening) {
      try {
        // 检查网络状态
        if (!navigator.onLine) {
          console.log('网络不可用，延迟重试...')
          setTimeout(() => {
            this._safeRestart()
          }, 2000)
          return
        }
        
        console.log('正在安全重启语音识别...')
        this.recognition.start()
        console.log('语音识别安全重启成功')
      } catch (error) {
        console.log('安全重启语音识别失败:', error)
        // 如果重启失败，延迟重试
        setTimeout(() => {
          this._safeRestart()
        }, 1000)
      }
    }
  }

  // 检查浏览器是否支持语音识别
  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }

  // 获取支持状态信息
  getSupportInfo() {
    const isSupported = this.isSupported()
    
    if (!isSupported) {
      return {
        supported: false,
        message: '您的浏览器不支持语音识别功能。请使用Chrome、Edge或Safari浏览器。'
      }
    }

    return {
      supported: true,
      message: '语音识别功能可用'
    }
  }

  // 合成语音（文本转语音）
  speak(text, options = {}) {
    if (!window.speechSynthesis) {
      console.warn('浏览器不支持语音合成')
      return false
    }

    try {
      // 取消任何正在进行的语音合成
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      
      // 设置语音选项
      utterance.rate = options.rate || 1
      utterance.pitch = options.pitch || 1
      utterance.volume = options.volume || 1
      utterance.lang = options.lang || 'zh-CN'

      // 开始语音合成
      speechSynthesis.speak(utterance)
      return true
    } catch (error) {
      console.error('语音合成失败:', error)
      return false
    }
  }

  // 停止语音合成
  stopSpeaking() {
    if (window.speechSynthesis) {
      speechSynthesis.cancel()
    }
  }
}

// 创建单例实例
const speechService = new SpeechService()

export { speechService }
