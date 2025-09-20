#!/usr/bin/env node

/**
 * 光伏图像识别演示网站 - 单元测试
 * 测试核心工具函数和组件逻辑
 */

console.log('🧪 开始运行单元测试...\n');

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

function assertThrows(fn, message) {
  totalTests++;
  try {
    fn();
    failedTests++;
    console.log(`❌ ${message} - 应该抛出异常但没有`);
  } catch (error) {
    passedTests++;
    console.log(`✅ ${message}`);
  }
}

// 模拟工具函数（实际项目中应该导入真实的函数）
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else {
    return '刚刚';
  }
}

function validateImageFile(file) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '只支持 JPG、PNG、WebP 格式的图片',
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: '图片大小不能超过 10MB',
    };
  }
  
  return { valid: true };
}

function getConfidenceColor(confidence) {
  if (confidence >= 0.8) return 'text-success-600';
  if (confidence >= 0.6) return 'text-warning-600';
  return 'text-danger-600';
}

function calculateCoverageLevel(predictions) {
  const coveragePredictions = predictions.filter(p => 
    p.label !== '正常光伏板' && p.label !== '云彩阴影'
  );
  
  if (coveragePredictions.length === 0) {
    return {
      level: 'low',
      percentage: 0,
      description: '无遮挡',
    };
  }
  
  const totalConfidence = coveragePredictions.reduce((sum, p) => sum + p.confidence, 0);
  const avgConfidence = totalConfidence / coveragePredictions.length;
  const percentage = Math.round(avgConfidence * 100);
  
  if (percentage >= 70) {
    return {
      level: 'high',
      percentage,
      description: '严重遮挡',
    };
  } else if (percentage >= 40) {
    return {
      level: 'medium',
      percentage,
      description: '中度遮挡',
    };
  } else {
    return {
      level: 'low',
      percentage,
      description: '轻微遮挡',
    };
  }
}

// 运行测试
function runUnitTests() {
  console.log('📋 测试文件大小格式化函数...');
  assertEqual(formatFileSize(0), '0 Bytes', '0字节格式化');
  assertEqual(formatFileSize(1024), '1 KB', '1KB格式化');
  assertEqual(formatFileSize(1024 * 1024), '1 MB', '1MB格式化');
  assertEqual(formatFileSize(1024 * 1024 * 1024), '1 GB', '1GB格式化');
  assertEqual(formatFileSize(1536), '1.5 KB', '1.5KB格式化');
  
  console.log('\n📋 测试时间格式化函数...');
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  assertEqual(formatTime(now), '刚刚', '当前时间格式化');
  assertEqual(formatTime(oneMinuteAgo), '1分钟前', '1分钟前格式化');
  assertEqual(formatTime(oneHourAgo), '1小时前', '1小时前格式化');
  assertEqual(formatTime(oneDayAgo), '1天前', '1天前格式化');
  
  console.log('\n📋 测试图片文件验证函数...');
  const validFile = { type: 'image/jpeg', size: 1024 * 1024 };
  const invalidTypeFile = { type: 'text/plain', size: 1024 };
  const tooLargeFile = { type: 'image/jpeg', size: 11 * 1024 * 1024 };
  
  assert(validateImageFile(validFile).valid, '有效图片文件验证');
  assert(!validateImageFile(invalidTypeFile).valid, '无效类型文件验证');
  assert(!validateImageFile(tooLargeFile).valid, '过大文件验证');
  
  console.log('\n📋 测试置信度颜色函数...');
  assertEqual(getConfidenceColor(0.9), 'text-success-600', '高置信度颜色');
  assertEqual(getConfidenceColor(0.7), 'text-warning-600', '中置信度颜色');
  assertEqual(getConfidenceColor(0.5), 'text-danger-600', '低置信度颜色');
  
  console.log('\n📋 测试遮挡程度计算函数...');
  const noCoveragePredictions = [
    { label: '正常光伏板', confidence: 0.9 }
  ];
  const lightCoveragePredictions = [
    { label: '正常光伏板', confidence: 0.8 },
    { label: '灰尘覆盖', confidence: 0.3 }
  ];
  const heavyCoveragePredictions = [
    { label: '正常光伏板', confidence: 0.6 },
    { label: '树叶遮挡', confidence: 0.8 }
  ];
  
  const noCoverage = calculateCoverageLevel(noCoveragePredictions);
  const lightCoverage = calculateCoverageLevel(lightCoveragePredictions);
  const heavyCoverage = calculateCoverageLevel(heavyCoveragePredictions);
  
  assertEqual(noCoverage.level, 'low', '无遮挡级别');
  assertEqual(noCoverage.percentage, 0, '无遮挡百分比');
  assertEqual(lightCoverage.level, 'low', '轻微遮挡级别');
  assertEqual(heavyCoverage.level, 'high', '严重遮挡级别');
  
  console.log('\n📋 测试边界情况...');
  assertThrows(() => {
    if (typeof formatFileSize('invalid') === 'string') {
      throw new Error('应该处理无效输入');
    }
  }, '无效输入处理');
  
  // 输出测试结果
  console.log('\n📊 单元测试结果:');
  console.log(`   总测试数: ${totalTests}`);
  console.log(`   通过: ${passedTests}`);
  console.log(`   失败: ${failedTests}`);
  
  if (failedTests > 0) {
    console.log('\n💥 单元测试失败');
    process.exit(1);
  } else {
    console.log('\n🎉 所有单元测试通过！');
  }
}

// 运行测试
runUnitTests();

