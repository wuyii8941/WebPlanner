/**
 * 天气服务 - 获取旅行目的地的实时天气信息
 * 功能块五：实时天气集成
 */

class WeatherService {
  constructor() {
    this.baseUrl = 'https://restapi.amap.com/v3/weather/weatherInfo';
  }

  /**
   * 获取天气API密钥
   * @returns {string} API密钥
   */
  getApiKey() {
    try {
      const savedKeys = localStorage.getItem('webplanner_api_keys');
      if (savedKeys) {
        const parsedKeys = JSON.parse(savedKeys);
        return parsedKeys.weatherApiKey || parsedKeys.amapApiKey || '';
      }
    } catch (error) {
      console.error('获取天气API密钥失败:', error);
    }
    return '';
  }

  /**
   * 清理城市名称
   * @param {string} city - 原始城市名称
   * @returns {string} 清理后的城市名称
   */
  cleanCityName(city) {
    if (!city) return '';
    
    // 移除末尾的标点符号
    let cleaned = city.replace(/[。，、！？；：,.!?;:]+$/, '');
    
    // 移除多余的空格
    cleaned = cleaned.trim();
    
    // 常见城市名称映射
    const cityMap = {
      '江苏南京': '南京',
      '江苏苏州': '苏州',
      '江苏无锡': '无锡',
      '江苏常州': '常州',
      '江苏镇江': '镇江',
      '江苏扬州': '扬州',
      '江苏南通': '南通',
      '江苏泰州': '泰州',
      '江苏盐城': '盐城',
      '江苏淮安': '淮安',
      '江苏连云港': '连云港',
      '江苏宿迁': '宿迁',
      '江苏徐州': '徐州',
      '北京': '北京市',
      '上海': '上海市',
      '天津': '天津市',
      '重庆': '重庆市'
    };
    
    return cityMap[cleaned] || cleaned;
  }

  /**
   * 获取城市天气信息
   * @param {string} city - 城市名称
   * @param {string} extensions - 返回结果类型：base-实况天气，all-预报天气
   * @returns {Promise<Object>} 天气数据
   */
  async getWeatherByCity(city, extensions = 'base') {
    console.group('🌤️ 天气服务 - 城市天气查询')
    console.log('🔑 API Key状态:', this.getApiKey() ? '已配置' : '未配置')
    
    // 清理城市名称
    const cleanedCity = this.cleanCityName(city);
    console.log('🏙️ 原始城市:', city)
    console.log('🏙️ 清理后城市:', cleanedCity)
    console.log('📊 查询类型:', extensions)
    
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.error('❌ API Key未配置')
      console.groupEnd()
      throw new Error('请先配置天气API密钥');
    }

    try {
      const params = new URLSearchParams({
        key: apiKey,
        city: cleanedCity,
        extensions,
        output: 'JSON'
      });

      const url = `${this.baseUrl}?${params}`
      console.log('🚀 开始调用天气API...')
      console.log('🌐 API端点:', url)

      const response = await fetch(url);
      
      console.log('📡 API响应状态:', response.status, response.statusText)
      
      if (!response.ok) {
        console.error('❌ API请求失败:', {
          status: response.status,
          statusText: response.statusText
        })
        console.groupEnd()
        throw new Error(`天气API请求失败: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API响应数据:', data)
      
      if (data.status !== '1') {
        console.error('❌ API返回错误:', {
          status: data.status,
          info: data.info
        })
        console.groupEnd()
        throw new Error(`天气API错误: ${data.info}`);
      }

      console.log('🎉 天气查询成功!')
      console.log('📊 天气数据:', data.lives || data.forecasts)
      console.groupEnd()
      
      return data;
    } catch (error) {
      console.error('❌ 获取天气信息失败:', error)
      console.log('💡 错误详情:', {
        message: error.message,
        stack: error.stack
      })
      console.groupEnd()
      throw error;
    }
  }

  /**
   * 根据经纬度获取天气信息
   * @param {number} longitude - 经度
   * @param {number} latitude - 纬度
   * @param {string} extensions - 返回结果类型
   * @returns {Promise<Object>} 天气数据
   */
  async getWeatherByLocation(longitude, latitude, extensions = 'base') {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('请先配置天气API密钥');
    }

    try {
      const params = new URLSearchParams({
        key: apiKey,
        location: `${longitude},${latitude}`,
        extensions,
        output: 'JSON'
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`天气API请求失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== '1') {
        throw new Error(`天气API错误: ${data.info}`);
      }

      return data;
    } catch (error) {
      console.error('获取天气信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取旅行行程的天气信息
   * @param {Array} locations - 地点数组，包含经纬度或城市名称
   * @returns {Promise<Array>} 各地点天气信息数组
   */
  async getTripWeather(locations) {
    const weatherPromises = locations.map(async (location) => {
      try {
        let weatherData;
        
        if (location.longitude && location.latitude) {
          weatherData = await this.getWeatherByLocation(
            location.longitude,
            location.latitude
          );
        } else if (location.city) {
          weatherData = await this.getWeatherByCity(location.city);
        } else {
          return {
            location: location.name || '未知地点',
            error: '缺少位置信息'
          };
        }

        return {
          location: location.name || location.city,
          weather: weatherData.lives ? weatherData.lives[0] : null,
          forecasts: weatherData.forecasts ? weatherData.forecasts[0] : null
        };
      } catch (error) {
        return {
          location: location.name || location.city || '未知地点',
          error: error.message
        };
      }
    });

    return Promise.all(weatherPromises);
  }

  /**
   * 格式化天气信息用于显示
   * @param {Object} weatherData - 天气数据
   * @returns {Object} 格式化后的天气信息
   */
  formatWeather(weatherData) {
    if (!weatherData || !weatherData.lives || weatherData.lives.length === 0) {
      console.warn('⚠️ 天气数据为空或格式不正确:', weatherData);
      return null;
    }

    const weather = weatherData.lives[0];
    if (!weather) {
      console.warn('⚠️ 天气信息为空');
      return null;
    }

    return {
      city: weather.city || '未知城市',
      weather: weather.weather || '未知',
      temperature: `${weather.temperature || '--'}°C`,
      wind: `${weather.winddirection || '未知'}风 ${weather.windpower || '未知'}级`,
      humidity: `${weather.humidity || '--'}%`,
      reportTime: weather.reporttime || '未知时间'
    };
  }

  /**
   * 获取天气图标
   * @param {string} weather - 天气状况
   * @returns {string} 图标类名
   */
  getWeatherIcon(weather) {
    const iconMap = {
      '晴': '☀️',
      '多云': '⛅',
      '阴': '☁️',
      '雨': '🌧️',
      '小雨': '🌦️',
      '中雨': '🌧️',
      '大雨': '⛈️',
      '雪': '❄️',
      '雾': '🌫️',
      '雷阵雨': '⛈️',
      '阵雨': '🌦️'
    };

    return iconMap[weather] || '🌤️';
  }
}

// 创建单例实例
const weatherService = new WeatherService();

export default weatherService;
