// ===========================
// 百度地图服务(简化版)
// ===========================

export class MapService {
  constructor() {
    this.map = null
    this.markers = []
    this.isMapInitialized = false
  }

  // 获取API Key
  getApiKey() {
    const apiKeys = localStorage.getItem('webplanner_api_keys')
    if (!apiKeys) {
      throw new Error('请先在设置中配置百度地图API Key')
    }
    
    const parsedKeys = JSON.parse(apiKeys)
    if (!parsedKeys.baiduApiKey) {
      throw new Error('请先在设置中配置百度地图API Key')
    }
    
    return parsedKeys.baiduApiKey
  }

  // 检查百度地图API是否加载
  isBMapLoaded() {
    return typeof BMap !== 'undefined' && BMap.Map
  }

  // 加载地图API
  async loadMapAPI() {
    if (this.isBMapLoaded()) {
      return true
    }

    return new Promise((resolve, reject) => {
      const apiKey = this.getApiKey()
      
      const script = document.createElement('script')
      script.src = `https://api.map.baidu.com/api?v=3.0&ak=${apiKey}&callback=baiduMapInitCallback`
      script.async = true
      
      // 创建全局回调函数
      window.baiduMapInitCallback = () => {
        resolve(true)
      }
      
      script.onerror = () => {
        reject(new Error('百度地图API加载失败，请检查API Key和网络连接'))
      }
      
      document.head.appendChild(script)
      
      // 添加超时检查
      setTimeout(() => {
        if (!this.isBMapLoaded()) {
          reject(new Error('百度地图API加载超时，请检查网络连接'))
        }
      }, 10000)
    })
  }

  // 地理编码 - 直接使用百度地图API
  async geocodeAddress(address, city = '') {
    return new Promise((resolve, reject) => {
      const geocoder = new BMap.Geocoder()
      
      // 组合完整地址，优先使用城市限定
      const fullAddress = city ? `${city}${address}` : address
      
      geocoder.getPoint(fullAddress, (point) => {
        if (point) {
          resolve({
            lng: point.lng,
            lat: point.lat,
            address: address,
            fullAddress: fullAddress
          })
        } else {
          reject(new Error(`地址解析失败: ${address}`))
        }
      }, city)
    })
  }

  // 显示目的地和行程地点
  async showTripOnMap(trip, containerElement = null) {
    if (!containerElement) {
      throw new Error('需要提供 DOM 元素。')
    }
    
    try {
      // 加载百度地图API
      await this.loadMapAPI()
      
      // 创建地图实例 - 使用传入的 DOM 元素
      const map = new BMap.Map(containerElement)
      
      // 提取城市名称用于地理编码限定
      const city = this.extractCityFromDestination(trip.destination)
      
      // 首先尝试定位到目的地
      let initialPoint = new BMap.Point(104.195397, 35.86166) // 默认兰州
      let initialZoom = 12
      
      if (trip.destination) {
        try {
          const destinationLocation = await this.geocodeAddress(trip.destination, city)
          if (destinationLocation) {
            initialPoint = new BMap.Point(destinationLocation.lng, destinationLocation.lat)
            initialZoom = 14 // 目的地定位时放大一些
          }
        } catch (error) {
          // 如果目的地解析失败，使用默认点
        }
      }
      
      // 设置地图初始中心和缩放级别
      map.centerAndZoom(initialPoint, initialZoom)
      
      // 启用滚轮缩放
      map.enableScrollWheelZoom(true)
      
      // 添加地图控件
      map.addControl(new BMap.NavigationControl())
      map.addControl(new BMap.ScaleControl())
      map.addControl(new BMap.OverviewMapControl())
      
      this.map = map
      this.isMapInitialized = true
      
      // 清除旧标记
      this.clearMarkers()
      
      const points = []
      const markers = []
      
      // 1. 添加目的地标记
      if (trip.destination) {
        try {
          const destinationLocation = await this.geocodeAddress(trip.destination, city)
          if (destinationLocation) {
            const point = new BMap.Point(destinationLocation.lng, destinationLocation.lat)
            points.push(point)
            
            // 添加目的地标记
            const marker = this.addMarker(point, trip.destination, '目的地')
            markers.push(marker)
          }
        } catch (error) {
          // 静默处理目的地解析失败
        }
      }
      
      // 2. 显示行程地点
      if (trip.itinerary && trip.itinerary.length > 0) {
        for (const [index, item] of trip.itinerary.entries()) {
          if (item.location) {
            try {
              const location = await this.geocodeAddress(item.location, city)
              if (location) {
                const point = new BMap.Point(location.lng, location.lat)
                points.push(point)
                
                // 添加行程地点标记
                const marker = this.addNumberedMarker(point, item, index + 1)
                markers.push(marker)
              }
            } catch (error) {
              // 静默处理行程地点解析失败
            }
          }
        }
      }
      
      // 3. 如果有标记，调整地图视野以显示所有标记
      if (points.length > 0) {
        const viewport = map.getViewport(points)
        
        // 根据标记数量调整缩放级别
        let zoomLevel = viewport.zoom
        if (markers.length === 1) {
          zoomLevel = 14
        } else if (markers.length <= 3) {
          zoomLevel = 12
        } else if (markers.length > 5) {
          zoomLevel = 10 // 标记较多时缩小一些
        }
        
        map.centerAndZoom(viewport.center, zoomLevel)
      }
      
      // 返回地图实例
      return map
      
    } catch (error) {
      throw error
    }
  }

  // 添加标记
  addMarker(point, title, type = '地点') {
    if (!this.map) return null

    const marker = new BMap.Marker(point)

    // 添加信息窗口
    const infoWindow = new BMap.InfoWindow(
      `<div style="padding:10px;">
        <strong>${type}: ${title}</strong>
      </div>`,
      {
        width: 200,
        height: 50
      }
    )

    marker.addEventListener('click', () => {
      this.map.openInfoWindow(infoWindow, point)
    })

    this.map.addOverlay(marker)
    this.markers.push(marker)

    return marker
  }

  // 添加带编号的标记
  addNumberedMarker(point, item, index) {
    if (!this.map) return null

    // 创建自定义标签（带数字）
    const label = new BMap.Label(`${index}`, {
      offset: new BMap.Size(-6, -20)
    })
    label.setStyle({
      backgroundColor: '#4A90E2',
      color: 'white',
      border: '2px solid white',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      lineHeight: '20px',
      textAlign: 'center',
      fontSize: '12px',
      fontWeight: 'bold'
    })
    
    // 创建标记
    const marker = new BMap.Marker(point)
    marker.setLabel(label)
    
    // 添加信息窗口
    const infoWindow = new BMap.InfoWindow(
      `<div style="padding:10px;">
        <strong>${index}. ${item.title}</strong><br>
        <small>${item.location}</small>
        ${item.time ? `<br><small>时间: ${item.time}</small>` : ''}
      </div>`,
      {
        width: 200,
        height: 'auto'
      }
    )
    
    marker.addEventListener('click', () => {
      this.map.openInfoWindow(infoWindow, point)
    })
    
    this.map.addOverlay(marker)
    this.markers.push(marker)
    
    return marker
  }

  // 清除所有标记
  clearMarkers() {
    if (this.map) {
      this.markers.forEach(marker => {
        this.map.removeOverlay(marker)
      })
    }
    this.markers = []
  }

  // 销毁地图
  destroy() {
    try {
      if (this.map) {
        this.clearMarkers()
        this.map = null
        this.isMapInitialized = false
      }
    } catch (error) {
      this.map = null
      this.isMapInitialized = false
    }
  }

  // 从目的地提取城市名称
  extractCityFromDestination(destination) {
    if (!destination) return ''
    
    // 常见城市名称匹配
    const cityPatterns = [
      /(北京市|上海[市]?|天津[市]?|重庆[市]?)/,
      /(南京[市]?|杭州[市]?|苏州[市]?|无锡[市]?|常州[市]?|镇江[市]?|扬州[市]?|南通[市]?|泰州[市]?|盐城[市]?|淮安[市]?|连云港[市]?|宿迁[市]?|徐州[市]?)/,
      /(广州[市]?|深圳[市]?|珠海[市]?|汕头[市]?|佛山[市]?|韶关[市]?|湛江[市]?|肇庆[市]?|江门[市]?|茂名[市]?|惠州[市]?|梅州[市]?|汕尾[市]?|河源[市]?|阳江[市]?|清远[市]?|东莞[市]?|中山[市]?|潮州[市]?|揭阳[市]?|云浮[市]?)/,
      /(成都[市]?|绵阳[市]?|德阳[市]?|南充[市]?|宜宾[市]?|自贡[市]?|乐山[市]?|泸州[市]?|达州[市]?|内江[市]?|遂宁[市]?|攀枝花[市]?|眉山[市]?|广安[市]?|资阳[市]?|雅安[市]?|巴中[市]?)/,
      /(武汉[市]?|黄石[市]?|十堰[市]?|宜昌[市]?|襄阳[市]?|鄂州[市]?|荆门[市]?|孝感[市]?|荆州[市]?|黄冈[市]?|咸宁[市]?|随州[市]?|恩施[市]?)/,
      /(西安[市]?|铜川[市]?|宝鸡[市]?|咸阳[市]?|渭南[市]?|延安[市]?|汉中[市]?|榆林[市]?|安康[市]?|商洛[市]?)/,
      /(沈阳[市]?|大连[市]?|鞍山[市]?|抚顺[市]?|本溪[市]?|丹东[市]?|锦州[市]?|营口[市]?|阜新[市]?|辽阳[市]?|盘锦[市]?|铁岭[市]?|朝阳[市]?|葫芦岛[市]?)/,
      /(济南[市]?|青岛[市]?|淄博[市]?|枣庄[市]?|东营[市]?|烟台[市]?|潍坊[市]?|济宁[市]?|泰安[市]?|威海[市]?|日照[市]?|临沂[市]?|德州[市]?|聊城[市]?|滨州[市]?|菏泽[市]?)/,
      /(郑州[市]?|开封[市]?|洛阳[市]?|平顶山[市]?|安阳[市]?|鹤壁[市]?|新乡[市]?|焦作[市]?|濮阳[市]?|许昌[市]?|漯河[市]?|三门峡[市]?|南阳[市]?|商丘[市]?|信阳[市]?|周口[市]?|驻马店[市]?)/,
      /(长沙[市]?|株洲[市]?|湘潭[市]?|衡阳[市]?|邵阳[市]?|岳阳[市]?|常德[市]?|张家界[市]?|益阳[市]?|郴州[市]?|永州[市]?|怀化[市]?|娄底[市]?|湘西[市]?)/
    ]
    
    for (const pattern of cityPatterns) {
      const match = destination.match(pattern)
      if (match) {
        return match[1]
      }
    }
    
    // 如果没有匹配到具体城市，返回原目的地
    return destination
  }

  // 验证API Key
  async validateApiKey() {
    try {
      await this.loadMapAPI()
      return true
    } catch (error) {
      throw new Error(`地图API Key验证失败: ${error.message}`)
    }
  }
}

// 创建单例实例
export const mapService = new MapService()
