// 测试地图坐标解析修复
console.log('🚀 开始测试地图坐标解析修复...')

// 模拟百度地图API环境
const mockBMap = {
  Map: class {
    constructor() {
      console.log('🗺️ 创建地图实例')
    }
    centerAndZoom() {
      console.log('📍 设置地图中心')
    }
    enableScrollWheelZoom() {
      console.log('🔧 启用滚轮缩放')
    }
    addControl() {
      console.log('➕ 添加地图控件')
    }
  },
  Point: class {
    constructor(lng, lat) {
      this.lng = lng
      this.lat = lat
    }
  },
  Geocoder: class {
    constructor() {
      console.log('🗺️ 创建地理编码器')
    }
    
    getPoint(address, callback) {
      console.log(`🔍 地理编码请求: "${address}"`)
      
      // 模拟百度地图地理编码响应
      setTimeout(() => {
        // 南京的正确坐标
        if (address.includes('南京') || address === '南京市') {
          console.log('✅ 返回南京坐标')
          callback({ lng: 118.796877, lat: 32.060255 })
        } 
        // 北京的坐标
        else if (address.includes('北京') || address === '北京市') {
          console.log('✅ 返回北京坐标')
          callback({ lng: 116.397428, lat: 39.90923 })
        }
        // 其他地址返回null，触发备用方案
        else {
          console.log('❌ 地理编码失败，返回null')
          callback(null)
        }
      }, 100)
    }
  },
  NavigationControl: class {},
  ScaleControl: class {},
  OverviewMapControl: class {},
  Marker: class {
    constructor(point) {
      this.point = point
    }
  },
  InfoWindow: class {
    constructor(content, options) {
      this.content = content
      this.options = options
    }
  }
}

// 设置全局BMap对象
global.window = { BMap: mockBMap }
global.document = {
  head: {
    appendChild: () => {}
  },
  querySelector: () => null,
  getElementById: (id) => {
    if (id === 'map-container') {
      return {
        innerHTML: ''
      }
    }
    return null
  }
}

// 导入修复后的地图服务
import { MapService } from './src/services/mapService.js'

async function testMapService() {
  console.log('\n=== 测试地图服务坐标解析 ===\n')
  
  const mapService = new MapService()
  
  try {
    // 测试1: 南京坐标解析
    console.log('🧪 测试1: 解析"江苏南京"')
    const nanjingResult = await mapService.geocodeAddress('江苏南京')
    console.log('✅ 南京坐标结果:', nanjingResult)
    
    // 验证南京坐标是否正确
    const nanjingExpectedLng = 118.796877
    const nanjingExpectedLat = 32.060255
    
    if (Math.abs(nanjingResult.lng - nanjingExpectedLng) < 0.1 && 
        Math.abs(nanjingResult.lat - nanjingExpectedLat) < 0.1) {
      console.log('🎉 南京坐标解析正确!')
    } else {
      console.error('❌ 南京坐标解析错误!')
      console.log(`期望: (${nanjingExpectedLng}, ${nanjingExpectedLat})`)
      console.log(`实际: (${nanjingResult.lng}, ${nanjingResult.lat})`)
    }
    
    console.log('\n🧪 测试2: 解析"南京市"')
    const nanjingCityResult = await mapService.geocodeAddress('南京市')
    console.log('✅ 南京市坐标结果:', nanjingCityResult)
    
    console.log('\n🧪 测试3: 解析"北京"')
    const beijingResult = await mapService.geocodeAddress('北京')
    console.log('✅ 北京坐标结果:', beijingResult)
    
    console.log('\n🧪 测试4: 测试备用方案 - 解析"未知地点"')
    try {
      const unknownResult = await mapService.geocodeAddress('未知地点')
      console.log('✅ 备用方案结果:', unknownResult)
    } catch (error) {
      console.log('✅ 备用方案正确处理:', error.message)
    }
    
    console.log('\n🧪 测试5: 测试城市提取功能')
    const testDestinations = [
      '江苏南京',
      '南京市鼓楼区',
      '北京朝阳区',
      '上海市浦东新区',
      '广州天河区',
      '未知地点'
    ]
    
    for (const dest of testDestinations) {
      const extracted = mapService.extractCityFromDestination(dest)
      console.log(`📍 "${dest}" -> "${extracted}"`)
    }
    
    console.log('\n🎉 所有测试完成!')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testMapService()
