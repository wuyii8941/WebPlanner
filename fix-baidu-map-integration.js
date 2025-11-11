// 百度地图集成修复脚本
// 这个脚本将修复当前项目中的百度地图集成问题

console.log('🚀 开始修复百度地图集成问题...');

// 问题分析：
// 1. 当前项目使用类封装的地图服务，但可能存在API加载时机问题
// 2. 用户提供的代码是直接脚本方式，更简单直接
// 3. 需要确保API Key正确配置和加载

// 修复步骤：
// 1. 检查API Key配置
// 2. 修复地图服务中的API加载逻辑
// 3. 添加更好的错误处理
// 4. 创建兼容性修复

// 检查localStorage中的API Key配置
function checkApiKeyConfiguration() {
  console.group('🔑 检查API Key配置');
  
  const savedKeys = localStorage.getItem('webplanner_api_keys');
  if (!savedKeys) {
    console.error('❌ 未找到保存的API Key配置');
    console.groupEnd();
    return null;
  }
  
  try {
    const parsedKeys = JSON.parse(savedKeys);
    console.log('✅ 找到保存的API Key配置:', parsedKeys);
    
    if (!parsedKeys.baiduApiKey) {
      console.error('❌ 未配置百度地图API Key');
      console.groupEnd();
      return null;
    }
    
    console.log('✅ 百度地图API Key已配置');
    console.groupEnd();
    return parsedKeys.baiduApiKey;
  } catch (error) {
    console.error('❌ 解析API Key配置失败:', error);
    console.groupEnd();
    return null;
  }
}

// 修复地图服务中的API加载问题
function fixMapServiceLoading() {
  console.group('🗺️ 修复地图服务加载问题');
  
  // 检查全局BMap对象是否存在
  if (typeof window.BMap !== 'undefined') {
    console.log('✅ 百度地图API已加载');
    console.groupEnd();
    return true;
  }
  
  const apiKey = checkApiKeyConfiguration();
  if (!apiKey) {
    console.error('❌ 无法修复：缺少API Key');
    console.groupEnd();
    return false;
  }
  
  console.log('🔄 尝试加载百度地图API...');
  
  return new Promise((resolve, reject) => {
    // 创建全局回调函数
    window.baiduMapFixCallback = () => {
      console.log('✅ 百度地图API加载成功（修复版）');
      delete window.baiduMapFixCallback;
      console.groupEnd();
      resolve(true);
    };
    
    const script = document.createElement('script');
    script.src = `https://api.map.baidu.com/api?v=3.0&ak=${apiKey}&callback=baiduMapFixCallback`;
    script.async = true;
    
    script.onerror = () => {
      console.error('❌ 百度地图API加载失败（修复版）');
      delete window.baiduMapFixCallback;
      console.groupEnd();
      reject(new Error('百度地图API加载失败'));
    };
    
    document.head.appendChild(script);
  });
}

// 创建简化的地图处理函数（基于用户提供的代码）
function createSimpleMapHandler() {
  console.group('🔄 创建简化地图处理器');
  
  // 将用户提供的代码转换为可用的函数
  const simpleMapHandler = {
    map: null,
    markers: [],
    polyline: null,
    isInitialized: false,
    
    // 初始化地图
    async init(containerId = 'map-container') {
      try {
        console.log('🗺️ 初始化简化版地图...');
        
        // 检查容器
        const container = document.getElementById(containerId);
        if (!container) {
          throw new Error(`未找到地图容器: #${containerId}`);
        }
        
        // 确保API已加载
        await fixMapServiceLoading();
        
        // 创建地图实例
        this.map = new BMap.Map(containerId);
        
        // 设置默认中心点（北京）
        const point = new BMap.Point(116.404, 39.915);
        this.map.centerAndZoom(point, 12);
        
        // 启用控件
        this.map.enableScrollWheelZoom(true);
        this.map.addControl(new BMap.NavigationControl());
        this.map.addControl(new BMap.ScaleControl());
        this.map.addControl(new BMap.OverviewMapControl());
        
        this.isInitialized = true;
        console.log('✅ 简化版地图初始化成功');
        return true;
      } catch (error) {
        console.error('❌ 简化版地图初始化失败:', error);
        return false;
      }
    },
    
    // 显示目的地
    async showDestination(destination) {
      if (!this.isInitialized || !this.map) {
        console.log('地图未初始化，尝试初始化...');
        if (!await this.init()) {
          return false;
        }
      }
      
      console.log('在地图上显示目的地:', destination);
      
      return new Promise((resolve) => {
        const geocoder = new BMap.Geocoder();
        
        geocoder.getPoint(destination, (point) => {
          if (point) {
            console.log('✅ 找到目的地坐标:', point);
            
            // 清除旧标记
            this.clearMarkers();
            
            // 设置地图中心
            this.map.centerAndZoom(point, 14);
            
            // 添加标记
            const marker = new BMap.Marker(point);
            this.map.addOverlay(marker);
            this.markers.push(marker);
            
            // 添加信息窗口
            const infoWindow = new BMap.InfoWindow(
              `<div style="padding:10px;">
                <strong>${destination}</strong>
              </div>`,
              {
                width: 200,
                height: 50,
                title: '目的地'
              }
            );
            
            marker.addEventListener('click', () => {
              this.map.openInfoWindow(infoWindow, point);
            });
            
            // 自动打开信息窗口
            this.map.openInfoWindow(infoWindow, point);
            
            resolve(true);
          } else {
            console.error('❌ 未找到该地点:', destination);
            resolve(false);
          }
        });
      });
    },
    
    // 清除标记
    clearMarkers() {
      this.markers.forEach(marker => {
        this.map.removeOverlay(marker);
      });
      this.markers = [];
      console.log('✅ 已清除所有标记');
    },
    
    // 销毁地图
    destroy() {
      if (this.map) {
        this.clearMarkers();
        if (this.polyline) {
          this.map.removeOverlay(this.polyline);
          this.polyline = null;
        }
        // 百度地图没有destroy方法，清理容器即可
        try {
          const container = this.map.getContainer();
          if (container) {
            container.innerHTML = '';
          }
        } catch (error) {
          console.warn('清理地图容器时出错:', error);
        }
        this.map = null;
        this.isInitialized = false;
        console.log('✅ 简化版地图已销毁');
      }
    }
  };
  
  console.log('✅ 简化地图处理器创建完成');
  console.groupEnd();
  
  return simpleMapHandler;
}

// 主修复函数
async function mainFix() {
  console.log('🚀 开始执行百度地图集成修复...');
  
  try {
    // 1. 检查API Key配置
    const apiKey = checkApiKeyConfiguration();
    if (!apiKey) {
      console.error('❌ 修复失败：请先在设置中配置百度地图API Key');
      return false;
    }
    
    // 2. 测试API加载
    const apiLoaded = await fixMapServiceLoading();
    if (!apiLoaded) {
      console.error('❌ 修复失败：百度地图API加载失败');
      return false;
    }
    
    // 3. 创建简化地图处理器
    const simpleMapHandler = createSimpleMapHandler();
    
    // 4. 将简化处理器暴露到全局，供调试使用
    window.simpleMapHandler = simpleMapHandler;
    
    console.log('✅ 百度地图集成修复完成！');
    console.log('💡 使用方法:');
    console.log('   - window.simpleMapHandler.init() - 初始化地图');
    console.log('   - window.simpleMapHandler.showDestination("北京天安门") - 显示目的地');
    console.log('   - window.simpleMapHandler.destroy() - 销毁地图');
    
    return true;
  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
    return false;
  }
}

// 自动执行修复（如果是在浏览器环境中）
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  console.log('🌐 检测到浏览器环境，自动执行修复...');
  mainFix().then(success => {
    if (success) {
      console.log('🎉 百度地图修复完成！现在可以正常使用地图功能了。');
    } else {
      console.log('⚠️ 百度地图修复失败，请检查控制台错误信息。');
    }
  });
}

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkApiKeyConfiguration,
    fixMapServiceLoading,
    createSimpleMapHandler,
    mainFix
  };
}

console.log('📝 百度地图集成修复脚本加载完成');
