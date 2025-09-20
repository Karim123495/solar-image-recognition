#!/usr/bin/env node

/**
 * 光伏图像识别演示网站 - 测试运行器
 * 运行所有测试套件
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 开始运行光伏图像识别演示网站测试套件...\n');

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 运行单个测试文件
function runTestFile(testFile) {
  try {
    console.log(`📋 运行测试: ${testFile}`);
    const testFilePath = path.join(__dirname, testFile);
    const result = execSync(`node "${testFilePath}"`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log(`✅ ${testFile} - 通过`);
    testResults.passed++;
    
  } catch (error) {
    console.log(`❌ ${testFile} - 失败`);
    console.log(`   错误: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({
      file: testFile,
      error: error.message
    });
  }
  
  testResults.total++;
  console.log('');
}

// 检查测试文件是否存在
function testFileExists(testFile) {
  return fs.existsSync(path.join(__dirname, testFile));
}

// 主测试流程
function runAllTests() {
  const testFiles = [
    'unit-tests.js',
    'integration-tests.js'
  ];
  
  // 运行所有测试文件
  testFiles.forEach(testFile => {
    if (testFileExists(testFile)) {
      runTestFile(testFile);
    } else {
      console.log(`⚠️  测试文件不存在: ${testFile}`);
    }
  });
  
  // 输出测试结果
  console.log('📊 测试结果汇总:');
  console.log(`   总测试数: ${testResults.total}`);
  console.log(`   通过: ${testResults.passed}`);
  console.log(`   失败: ${testResults.failed}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.errors.forEach(error => {
      console.log(`   ${error.file}: ${error.error}`);
    });
  }
  
  // 设置退出码
  if (testResults.failed > 0) {
    console.log('\n💥 测试失败，请检查错误信息');
    process.exit(1);
  } else {
    console.log('\n🎉 所有测试通过！');
    process.exit(0);
  }
}

// 运行测试
runAllTests();
