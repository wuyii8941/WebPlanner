// DeepSeek API 连接测试脚本
// 使用方法: node test-deepseek-connection.js

import https from 'https';
import dns from 'dns';

class DeepSeekConnectionTester {
  constructor() {
    this.baseURL = 'api.deepseek.com';
    this.timeout = 10000; // 10秒超时
  }

  // 测试网络连接
  async testConnection() {
    console.log('🔍 开始测试DeepSeek API连接...');
    console.log('🌐 目标地址:', this.baseURL);
    
    try {
      // 测试1: 基础网络连接
      await this.testBasicConnection();
      
      // 测试2: DNS解析
      await this.testDNSResolution();
      
      // 测试3: SSL证书验证
      await this.testSSLConnection();
      
      console.log('✅ 所有网络连接测试通过');
      return true;
    } catch (error) {
      console.error('❌ 网络连接测试失败:', error.message);
      return false;
    }
  }

  // 测试基础网络连接
  testBasicConnection() {
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: this.baseURL,
        port: 443,
        path: '/',
        method: 'HEAD',
        timeout: this.timeout
      }, (res) => {
        console.log('✅ 基础网络连接成功 - 状态码:', res.statusCode);
        resolve();
      });

      req.on('error', (error) => {
        console.error('❌ 基础网络连接失败:', error.message);
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('连接超时'));
      });

      req.end();
    });
  }

  // 测试DNS解析
  async testDNSResolution() {
    return new Promise((resolve, reject) => {
      dns.lookup(this.baseURL, (err, address, family) => {
        if (err) {
          console.error('❌ DNS解析失败:', err.message);
          reject(err);
        } else {
          console.log('✅ DNS解析成功 - IP地址:', address, '协议族:', family);
          resolve();
        }
      });
    });
  }

  // 测试SSL连接
  testSSLConnection() {
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: this.baseURL,
        port: 443,
        path: '/v1/models',
        method: 'GET',
        timeout: this.timeout,
        headers: {
          'User-Agent': 'WebPlanner-Connection-Test/1.0'
        }
      }, (res) => {
        console.log('✅ SSL连接成功 - 状态码:', res.statusCode);
        console.log('🔒 SSL证书信息:');
        console.log('   - 协议:', res.socket.getProtocol());
        console.log('   - 加密套件:', res.socket.getCipher());
        resolve();
      });

      req.on('error', (error) => {
        console.error('❌ SSL连接失败:', error.message);
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('SSL连接超时'));
      });

      req.end();
    });
  }

  // 测试API端点
  async testAPIEndpoint(apiKey) {
    if (!apiKey) {
      console.log('⚠️ 未提供API Key，跳过API端点测试');
      return false;
    }

    console.log('🚀 开始测试API端点...');
    
    try {
      const response = await this.makeAPIRequest(apiKey);
      console.log('✅ API端点测试成功');
      console.log('📊 响应状态:', response.status);
      console.log('📋 可用模型数量:', response.data?.length || 0);
      return true;
    } catch (error) {
      console.error('❌ API端点测试失败:', error.message);
      return false;
    }
  }

  // 发送API请求
  makeAPIRequest(apiKey) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseURL,
        port: 443,
        path: '/v1/models',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            resolve({
              status: res.statusCode,
              data: parsedData
            });
          } catch (error) {
            reject(new Error(`响应解析失败: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`请求失败: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('API请求超时'));
      });

      req.end();
    });
  }

  // 运行完整测试
  async runFullTest(apiKey = null) {
    console.log('='.repeat(50));
    console.log('🔧 DeepSeek API 连接诊断工具');
    console.log('='.repeat(50));
    
    const connectionResult = await this.testConnection();
    
    if (connectionResult) {
      console.log('\n📡 网络连接状态: ✅ 正常');
    } else {
      console.log('\n📡 网络连接状态: ❌ 异常');
      console.log('💡 建议检查:');
      console.log('   - 网络连接是否稳定');
      console.log('   - 防火墙设置');
      console.log('   - DNS解析配置');
      return;
    }

    if (apiKey) {
      console.log('\n🔑 开始API端点测试...');
      const apiResult = await this.testAPIEndpoint(apiKey);
      
      if (apiResult) {
        console.log('\n🎉 API端点状态: ✅ 正常');
      } else {
        console.log('\n⚠️ API端点状态: ❌ 异常');
        console.log('💡 建议检查:');
        console.log('   - API Key是否正确');
        console.log('   - API Key是否过期');
        console.log('   - 账户余额是否充足');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📋 测试完成');
    console.log('='.repeat(50));
  }
}

// 主函数
async function main() {
  const tester = new DeepSeekConnectionTester();
  
  // 从命令行参数获取API Key
  const apiKey = process.argv[2] || null;
  
  if (apiKey) {
    console.log('🔑 使用提供的API Key进行测试');
  } else {
    console.log('⚠️ 未提供API Key，仅测试网络连接');
  }
  
  await tester.runFullTest(apiKey);
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default DeepSeekConnectionTester;
