import React, { useState, useEffect } from 'react';
import weatherService from '../services/weatherService';
import { ErrorAlert } from './ErrorDisplay';

/**
 * 天气组件 - 显示旅行地点的实时天气信息
 * 功能块五：实时天气集成
 */
const WeatherWidget = ({ location, className = '' }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location) {
      fetchWeather();
    }
  }, [location]);

  const fetchWeather = async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      let weatherData;
      
      if (location.longitude && location.latitude) {
        weatherData = await weatherService.getWeatherByLocation(
          location.longitude,
          location.latitude
        );
      } else if (location.city) {
        weatherData = await weatherService.getWeatherByCity(location.city);
      } else {
        throw new Error('缺少位置信息');
      }

      const formattedWeather = weatherService.formatWeather(weatherData);
      setWeather(formattedWeather);
    } catch (err) {
      console.error('获取天气信息失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshWeather = () => {
    fetchWeather();
  };

  if (!location) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <p className="text-blue-600 text-sm">请选择地点查看天气</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 text-sm">获取天气中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorAlert 
        error={error} 
        onRetry={refreshWeather}
        className={className}
      />
    );
  }

  if (!weather) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <p className="text-yellow-600 text-sm">暂无天气信息</p>
      </div>
    );
  }

  const weatherIcon = weatherService.getWeatherIcon(weather.weather);

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{weather.city}</h3>
        <span className="text-2xl">{weatherIcon}</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">天气</span>
          <span className="text-gray-800 font-medium">{weather.weather}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">温度</span>
          <span className="text-gray-800 font-medium text-lg">{weather.temperature}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">湿度</span>
          <span className="text-gray-800 font-medium">{weather.humidity}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">风力</span>
          <span className="text-gray-800 font-medium text-sm">{weather.wind}</span>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-blue-200">
        <p className="text-gray-500 text-xs">更新时间: {weather.reportTime}</p>
      </div>
      
      <button
        onClick={refreshWeather}
        className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded transition-colors"
      >
        刷新天气
      </button>
    </div>
  );
};

export default WeatherWidget;
