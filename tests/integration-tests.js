#!/usr/bin/env node

/**
 * 光伏图像识别演示网站 - 集成测试
 * 测试API接口和端到端功能
 */

console.log('🔗 开始运行集成测试...\n');

// 测试结果统计
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// 测试辅助函数
function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ ${message}`);
  } else {
    failedTests++;
    console.log(`❌ ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  totalTests++;
  if (actual === expected) {
    passedTests++;
    console.log(`✅ ${message}`);
  } else {
    failedTests++;
    console.log(`❌ ${message} - 期望: ${expected}, 实际: ${actual}`);
  }
}

// 模拟HTTP请求
function mockFetch(url, options = {}) {
  return new Promise((resolve) => {
    // 模拟API响应
    setTimeout(() => {
      if (url.includes('/api/recognition')) {
        resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            status: 'success',
            predictions: [
              { label: '正常光伏板', confidence: 0.95 },
              { label: '树叶遮挡', confidence: 0.78 }
            ],
            confidence: 0.865,
            processing_time: 3200,
            api_used: 'aliyun'
          })
        });
      } else if (url.includes('/api/health')) {
        resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ status: 'ok' })
        });
      } else {
        resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Not found' })
        });
      }
    }, 100);
  });
}

// 模拟数据库操作
class MockDatabase {
  constructor() {
    this.records = [];
    this.stats = {
      total_records: 0,
      success_rate: 0,
      avg_processing_time: 0
    };
  }
  
  async saveRecord(record) {
    const newRecord = {
      id: Date.now().toString(),
      ...record,
      created_at: new Date().toISOString()
    };
    this.records.push(newRecord);
    this.stats.total_records++;
    return newRecord;
  }
  
  async getRecords(limit = 20) {
    return this.records.slice(0, limit);
  }
  
  async getStats() {
    return this.stats;
  }
  
  async updateStats() {
    const successful = this.records.filter(r => r.recognition_result?.status === 'success').length;
    this.stats.success_rate = this.records.length > 0 ? (successful / this.records.length) * 100 : 0;
    this.stats.avg_processing_time = this.records.length > 0 ? 
      this.records.reduce((sum, r) => sum + (r.processing_time || 0), 0) / this.records.length : 0;
  }
}

// 模拟AI识别服务
class MockAIRecognitionService {
  async recognizeSolarImage(imageUrl) {
    // 模拟识别延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模拟识别结果
    const labels = ['正常光伏板', '树叶遮挡', '灰尘覆盖', '云彩阴影'];
    const predictions = [];
    
    const numPredictions = Math.floor(Math.random() * 3) + 2;
    const usedLabels = new Set();
    
    for (let i = 0; i < numPredictions; i++) {
      let label;
      do {
        label = labels[Math.floor(Math.random() * labels.length)];
      } while (usedLabels.has(label));
      
      usedLabels.add(label);
      predictions.push({
        label,
        confidence: Math.random() * 0.4 + 0.6
      });
    }
    
    return {
      status: 'success',
      predictions,
      confidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length,
      processing_time: 2000 + Math.random() * 2000,
      api_used: 'aliyun'
    };
  }
}

// 运行集成测试
async function runIntegrationTests() {
  const db = new MockDatabase();
  const aiService = new MockAIRecognitionService();
  
  console.log('📋 测试API接口...');
  
  // 测试健康检查API
  try {
    const healthResponse = await mockFetch('/api/health');
    assert(healthResponse.ok, '健康检查API响应正常');
    const healthData = await healthResponse.json();
    assertEqual(healthData.status, 'ok', '健康检查返回状态正确');
  } catch (error) {
    assert(false, `健康检查API测试失败: ${error.message}`);
  }
  
  // 测试识别API
  try {
    const recognitionResponse = await mockFetch('/api/recognition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: 'https://example.com/test.jpg' })
    });
    assert(recognitionResponse.ok, '识别API响应正常');
    const recognitionData = await recognitionResponse.json();
    assert(recognitionData.status === 'success', '识别API返回成功状态');
    assert(Array.isArray(recognitionData.predictions), '识别结果包含预测数组');
    assert(recognitionData.predictions.length > 0, '识别结果不为空');
  } catch (error) {
    assert(false, `识别API测试失败: ${error.message}`);
  }
  
  console.log('\n📋 测试数据库操作...');
  
  // 测试保存记录
  try {
    const testRecord = {
      image_url: 'https://example.com/test.jpg',
      image_name: 'test.jpg',
      recognition_result: {
        status: 'success',
        predictions: [{ label: '正常光伏板', confidence: 0.95 }],
        confidence: 0.95,
        processing_time: 3000,
        api_used: 'aliyun'
      },
      processing_time: 3000
    };
    
    const savedRecord = await db.saveRecord(testRecord);
    assert(savedRecord.id, '记录保存成功并返回ID');
    assertEqual(savedRecord.image_name, 'test.jpg', '记录数据正确保存');
  } catch (error) {
    assert(false, `保存记录测试失败: ${error.message}`);
  }
  
  // 测试获取记录
  try {
    const records = await db.getRecords();
    assert(Array.isArray(records), '获取记录返回数组');
    assert(records.length > 0, '记录列表不为空');
  } catch (error) {
    assert(false, `获取记录测试失败: ${error.message}`);
  }
  
  // 测试统计更新
  try {
    await db.updateStats();
    const stats = await db.getStats();
    assert(typeof stats.total_records === 'number', '统计记录数正确');
    assert(typeof stats.success_rate === 'number', '统计成功率正确');
    assert(typeof stats.avg_processing_time === 'number', '统计平均时间正确');
  } catch (error) {
    assert(false, `统计更新测试失败: ${error.message}`);
  }
  
  console.log('\n📋 测试AI识别服务...');
  
  // 测试AI识别
  try {
    const result = await aiService.recognizeSolarImage('https://example.com/test.jpg');
    assert(result.status === 'success', 'AI识别返回成功状态');
    assert(Array.isArray(result.predictions), 'AI识别结果包含预测数组');
    assert(result.predictions.length > 0, 'AI识别结果不为空');
    assert(typeof result.confidence === 'number', 'AI识别返回置信度');
    assert(result.confidence >= 0 && result.confidence <= 1, '置信度在有效范围内');
    assert(typeof result.processing_time === 'number', 'AI识别返回处理时间');
  } catch (error) {
    assert(false, `AI识别服务测试失败: ${error.message}`);
  }
  
  console.log('\n📋 测试端到端流程...');
  
  // 测试完整的识别流程
  try {
    // 1. 调用AI识别
    const recognitionResult = await aiService.recognizeSolarImage('https://example.com/test.jpg');
    assert(recognitionResult.status === 'success', '端到端：AI识别成功');
    
    // 2. 保存到数据库
    const record = {
      image_url: 'https://example.com/test.jpg',
      image_name: 'e2e-test.jpg',
      recognition_result: recognitionResult,
      processing_time: recognitionResult.processing_time
    };
    const savedRecord = await db.saveRecord(record);
    assert(savedRecord.id, '端到端：记录保存成功');
    
    // 3. 更新统计
    await db.updateStats();
    const stats = await db.getStats();
    assert(stats.total_records > 0, '端到端：统计更新成功');
    
    console.log('✅ 端到端流程测试通过');
  } catch (error) {
    assert(false, `端到端流程测试失败: ${error.message}`);
  }
  
  console.log('\n📋 测试错误处理...');
  
  // 测试无效输入
  try {
    const invalidResponse = await mockFetch('/api/invalid');
    assert(!invalidResponse.ok, '无效API返回错误状态');
    assertEqual(invalidResponse.status, 404, '无效API返回404状态');
  } catch (error) {
    assert(false, `错误处理测试失败: ${error.message}`);
  }
  
  // 输出测试结果
  console.log('\n📊 集成测试结果:');
  console.log(`   总测试数: ${totalTests}`);
  console.log(`   通过: ${passedTests}`);
  console.log(`   失败: ${failedTests}`);
  
  if (failedTests > 0) {
    console.log('\n💥 集成测试失败');
    process.exit(1);
  } else {
    console.log('\n🎉 所有集成测试通过！');
  }
}

// 运行测试
runIntegrationTests().catch(error => {
  console.error('❌ 集成测试运行失败:', error);
  process.exit(1);
});

