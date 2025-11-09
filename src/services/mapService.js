// 高德地图服务
export class MapService {
  constructor() {
    this.map = null
    this.geocoder = null
    this.markers = []
    this.isLoaded = false
  }

  // 获取API Key
  getApiKey() {
    const apiKeys = localStorage.getItem('webplanner_api_keys')
    if (!apiKeys) {
      throw new Error('请先在设置中配置高德地图API Key')
    }
    
    const parsedKeys = JSON.parse(apiKeys)
    if (!parsedKeys.amapApiKey) {
      throw new Error('请先在设置中配置高德地图API Key')
    }
    
    return parsedKeys.amapApiKey
  }

  // 加载地图API
  async loadMapAPI() {
    console.group('🗺️ 地图服务 - API加载')
    console.log('🔑 API Key状态:', this.getApiKey() ? '已配置' : '未配置')
    
    if (this.isLoaded) {
      console.log('✅ 地图API已加载，跳过重复加载')
      console.groupEnd()
      return true
    }

    return new Promise((resolve, reject) => {
      const apiKey = this.getApiKey()
      console.log('🚀 开始加载高德地图API...')
      console.log('🌐 API URL:', `https://webapi.amap.com/maps?v=2.0&key=${apiKey}`)
      
      // 检查是否已经加载了高德地图API
      if (window.AMap && window.AMap.Geocoder) {
        console.log('✅ 高德地图API和Geocoder已存在，直接使用')
        this.isLoaded = true
        console.groupEnd()
        resolve(true)
        return
      }
      
      const script = document.createElement('script')
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}`
      script.async = true
      
      script.onload = () => {
        console.log('✅ 高德地图API加载成功')
        
        // 检查Geocoder插件是否可用
        if (typeof AMap.Geocoder === 'function') {
          this.isLoaded = true
          console.log('✅ AMap.Geocoder构造函数可用')
          console.groupEnd()
          resolve(true)
        } else {
          // 如果Geocoder不可用，加载插件
          console.log('🔄 Geocoder插件不可用，加载插件...')
          const geocoderScript = document.createElement('script')
          geocoderScript.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.Geocoder`
          geocoderScript.async = true
          
          geocoderScript.onload = () => {
            this.isLoaded = true
            console.log('✅ Geocoder插件加载成功')
            console.groupEnd()
            resolve(true)
          }
          
          geocoderScript.onerror = () => {
            console.error('❌ Geocoder插件加载失败')
            console.groupEnd()
            reject(new Error('Geocoder插件加载失败'))
          }
          
          document.head.appendChild(geocoderScript)
        }
      }
      
      script.onerror = () => {
        console.error('❌ 高德地图API加载失败')
        console.log('💡 可能的原因:')
        console.log('• API Key无效')
        console.log('• 网络连接问题')
        console.log('• 域名未授权')
        console.log('• 防火墙或网络限制')
        console.groupEnd()
        reject(new Error('高德地图API加载失败，请检查API Key和网络连接'))
      }
      
      document.head.appendChild(script)
    })
  }

  // 初始化地图
  async initMap(containerId, center = [116.397428, 39.90923]) {
    try {
      await this.loadMapAPI()
      
      this.map = new AMap.Map(containerId, {
        zoom: 11,
        center: center,
        viewMode: '3D'
      })

      this.geocoder = new AMap.Geocoder({
        city: '全国'
      })

      return this.map
    } catch (error) {
      console.error('地图初始化失败:', error)
      throw error
    }
  }

  // 根据目的地智能设置地图中心
  async setMapCenterByDestination(destination) {
    if (!this.map || !destination) return
    
    try {
      console.group('🗺️ 地图服务 - 智能设置地图中心')
      console.log('📍 目的地:', destination)
      
      // 确保地图服务已初始化
      if (!this.geocoder) {
        await this.loadMapAPI()
        if (!this.geocoder) {
          this.geocoder = new AMap.Geocoder({
            city: '全国'
          })
        }
      }
      
      // 智能提取城市名称
      let city = this.extractCityFromDestination(destination)
      console.log('🏙️ 提取的城市:', city)
      
      // 设置地理编码器的城市参数
      if (this.geocoder) {
        this.geocoder.setCity(city)
      }
      
      // 尝试地理编码
      const location = await this.geocodeAddress(destination)
      if (location) {
        this.map.setCenter([location.lng, location.lat])
        this.map.setZoom(12) // 设置合适的缩放级别
        console.log('✅ 地图中心设置成功:', { location, city })
        console.groupEnd()
        return location
      }
    } catch (error) {
      console.warn('⚠️ 无法设置地图中心:', error)
      console.log('🔄 使用备用方案...')
      
      // 备用方案：使用知名城市的坐标
      const fallbackLocation = this.getFallbackLocation(destination)
      if (fallbackLocation) {
        this.map.setCenter([fallbackLocation.lng, fallbackLocation.lat])
        this.map.setZoom(10)
        console.log('✅ 使用备用位置:', fallbackLocation)
      } else {
        // 最终备用：使用默认位置
        this.map.setCenter([116.397428, 39.90923])
        this.map.setZoom(10)
        console.log('✅ 使用默认位置')
      }
      console.groupEnd()
    }
  }

  // 从目的地中智能提取城市名称
  extractCityFromDestination(destination) {
    if (!destination) return '全国'
    
    // 常见城市名称映射
    const cityMap = {
      '北京': '北京市',
      '上海': '上海市',
      '广州': '广州市',
      '深圳': '深圳市',
      '杭州': '杭州市',
      '成都': '成都市',
      '重庆': '重庆市',
      '西安': '西安市',
      '南京': '南京市',
      '武汉': '武汉市',
      '天津': '天津市',
      '苏州': '苏州市',
      '厦门': '厦门市',
      '青岛': '青岛市',
      '大连': '大连市',
      '长沙': '长沙市',
      '郑州': '郑州市',
      '沈阳': '沈阳市',
      '宁波': '宁波市',
      '无锡': '无锡市'
    }
    
    // 检查是否直接匹配城市名称
    for (const [key, value] of Object.entries(cityMap)) {
      if (destination.includes(key)) {
        return value
      }
    }
    
    // 尝试提取城市名称模式
    const patterns = [
      /([^省]+市)/,           // 匹配"XX市"
      /([^省]+区)/,           // 匹配"XX区"
      /([^省]+县)/,           // 匹配"XX县"
      /([^省]+自治州)/,       // 匹配"XX自治州"
      /([^省]+特别行政区)/     // 匹配"XX特别行政区"
    ]
    
    for (const pattern of patterns) {
      const match = destination.match(pattern)
      if (match) {
        return match[0]
      }
    }
    
    // 如果无法提取，返回"全国"
    return '全国'
  }

  // 获取备用位置坐标
  getFallbackLocation(destination) {
    const fallbackLocations = {
      '北京': { lng: 116.397428, lat: 39.90923 },
      '上海': { lng: 121.473701, lat: 31.230416 },
      '广州': { lng: 113.264385, lat: 23.129112 },
      '深圳': { lng: 114.057868, lat: 22.543099 },
      '杭州': { lng: 120.15507, lat: 30.274085 },
      '成都': { lng: 104.066541, lat: 30.572269 },
      '重庆': { lng: 106.551643, lat: 29.562849 },
      '西安': { lng: 108.940174, lat: 34.341568 },
      '南京': { lng: 118.796877, lat: 32.060255 },
      '武汉': { lng: 114.305392, lat: 30.593099 }
    }
    
    for (const [city, location] of Object.entries(fallbackLocations)) {
      if (destination.includes(city)) {
        return location
      }
    }
    
    return null
  }

  // 地理编码 - 将地址转换为坐标
  async geocodeAddress(address) {
    if (!this.geocoder) {
      throw new Error('地图服务未初始化')
    }

    return new Promise((resolve, reject) => {
      this.geocoder.getLocation(address, (status, result) => {
        if (status === 'complete' && result.geocodes.length > 0) {
          const location = result.geocodes[0].location
          resolve({
            lng: location.lng,
            lat: location.lat,
            address: result.geocodes[0].formattedAddress
          })
        } else {
          reject(new Error(`地址解析失败: ${address}`))
        }
      })
    })
  }

  // 添加标记
  addMarker(lnglat, title, content = '') {
    if (!this.map) return null

    const marker = new AMap.Marker({
      position: lnglat,
      title: title,
      content: content || `<div class="bg-blue-600 text-white px-2 py-1 rounded text-sm">${title}</div>`
    })

    marker.setMap(this.map)
    this.markers.push(marker)

    // 添加信息窗口
    if (content) {
      const infoWindow = new AMap.InfoWindow({
        content: content,
        offset: new AMap.Pixel(0, -30)
      })

      marker.on('click', () => {
        infoWindow.open(this.map, marker.getPosition())
      })
    }

    return marker
  }

  // 批量添加行程标记
  async addItineraryMarkers(itinerary) {
    if (!this.map) return

    // 清除现有标记
    this.clearMarkers()

    const markers = []
    
    for (const item of itinerary) {
      if (item.location) {
        try {
          const location = await this.geocodeAddress(item.location)
          const marker = this.addMarker(
            [location.lng, location.lat],
            item.title,
            this.createMarkerContent(item)
          )
          if (marker) markers.push(marker)
        } catch (error) {
          console.warn(`无法解析地址: ${item.location}`, error)
        }
      }
    }

    // 自动调整地图视野以包含所有标记
    if (markers.length > 0) {
      this.map.setFitView()
    }

    return markers
  }

  // 创建标记内容
  createMarkerContent(item) {
    return `
      <div class="bg-white rounded-lg shadow-lg p-3 max-w-xs">
        <div class="font-semibold text-gray-800 mb-2">${item.title}</div>
        <div class="text-sm text-gray-600 mb-1">
          <strong>时间:</strong> ${item.time}
        </div>
        <div class="text-sm text-gray-600 mb-1">
          <strong>地点:</strong> ${item.location}
        </div>
        ${item.cost > 0 ? `
          <div class="text-sm text-green-600">
            <strong>费用:</strong> ¥${item.cost}
          </div>
        ` : ''}
        ${item.description ? `
          <div class="text-xs text-gray-500 mt-2">
            ${item.description}
          </div>
        ` : ''}
      </div>
    `
  }

  // 清除所有标记
  clearMarkers() {
    this.markers.forEach(marker => {
      marker.setMap(null)
    })
    this.markers = []
  }

  // 设置地图中心
  setCenter(lnglat) {
    if (this.map) {
      this.map.setCenter(lnglat)
    }
  }

  // 设置缩放级别
  setZoom(zoom) {
    if (this.map) {
      this.map.setZoom(zoom)
    }
  }

  // 销毁地图
  destroy() {
    if (this.map) {
      this.map.destroy()
      this.map = null
      this.geocoder = null
      this.isLoaded = false
      this.clearMarkers()
    }
  }

  // 验证API Key
  async validateApiKey() {
    try {
      await this.loadMapAPI()
      return true
    } catch (error) {
      console.error('❌ 地图API Key验证失败:', error)
      throw new Error(`地图API Key验证失败: ${error.message}`)
    }
  }
}

// 创建单例实例
export const mapService = new MapService()
