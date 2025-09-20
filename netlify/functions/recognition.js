// 光伏图像识别API
const fetch = require('node-fetch');

// 光伏识别标签映射
const SOLAR_LABELS = {
  // 正常光伏板
  'solar_panel': '正常光伏板',
  'photovoltaic_panel': '正常光伏板',
  'solar_module': '正常光伏板',
  'panel': '正常光伏板',
  
  // 树叶遮挡
  'leaf': '树叶遮挡',
  'leaves': '树叶遮挡',
  'tree': '树叶遮挡',
  'branch': '树叶遮挡',
  'foliage': '树叶遮挡',
  
  // 灰尘覆盖
  'dust': '灰尘覆盖',
  'dirt': '灰尘覆盖',
  'soil': '灰尘覆盖',
  'sand': '灰尘覆盖',
  
  // 云彩阴影
  'cloud': '云彩阴影',
  'shadow': '云彩阴影',
  'overcast': '云彩阴影',
  
  // 其他异物
  'bird': '其他异物',
  'bird_dropping': '其他异物',
  'snow': '其他异物',
  'ice': '其他异物',
  'debris': '其他异物',
  'trash': '其他异物',
};

// 阿里云视觉智能API
class AliyunVisionAPI {
  static async getAccessToken() {
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
    
    if (!accessKeyId || !accessKeySecret) {
      throw new Error('阿里云API密钥未配置');
    }

    const url = 'https://nls-meta.cn-shanghai.aliyuncs.com/pop/2018-05-18/tokens';
    const params = new URLSearchParams({
      AccessKeyId: accessKeyId,
      AccessKeySecret: accessKeySecret,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        throw new Error(`获取访问令牌失败: ${response.status}`);
      }

      const data = await response.json();
      return data.Token.Id;
    } catch (error) {
      console.error('阿里云获取访问令牌错误:', error);
      throw error;
    }
  }

  static async recognizeImage(imageUrl) {
    const startTime = Date.now();
    
    try {
      const token = await this.getAccessToken();
      
      const url = `https://imagerecog.cn-shanghai.aliyuncs.com/?Action=TaggingImage&Version=2019-09-30`;
      
      const requestBody = {
        ImageURL: imageUrl,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`阿里云API调用失败: ${response.status}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      // 处理识别结果
      const predictions = [];
      
      if (data.Data && data.Data.Tags) {
        for (const tag of data.Data.Tags) {
          const label = this.mapToSolarLabel(tag.Tag);
          if (label) {
            predictions.push({
              label,
              confidence: tag.Confidence / 100, // 转换为0-1范围
            });
          }
        }
      }

      // 计算整体置信度
      const confidence = predictions.length > 0 
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
        : 0;

      return {
        status: 'success',
        predictions,
        confidence,
        processing_time: processingTime,
        api_used: 'aliyun',
      };
    } catch (error) {
      console.error('阿里云识别错误:', error);
      return {
        status: 'error',
        predictions: [],
        confidence: 0,
        processing_time: Date.now() - startTime,
        api_used: 'aliyun',
        error_message: error.message,
      };
    }
  }

  static mapToSolarLabel(tag) {
    const lowerTag = tag.toLowerCase();
    
    // 直接匹配
    if (SOLAR_LABELS[lowerTag]) {
      return SOLAR_LABELS[lowerTag];
    }
    
    // 模糊匹配
    for (const [key, value] of Object.entries(SOLAR_LABELS)) {
      if (lowerTag.includes(key) || key.includes(lowerTag)) {
        return value;
      }
    }
    
    return null;
  }
}

// 百度AI开放平台API
class BaiduVisionAPI {
  static async getAccessToken() {
    const apiKey = process.env.BAIDU_API_KEY;
    const secretKey = process.env.BAIDU_SECRET_KEY;
    
    if (!apiKey || !secretKey) {
      throw new Error('百度API密钥未配置');
    }

    const url = 'https://aip.baidubce.com/oauth/2.0/token';
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: apiKey,
      client_secret: secretKey,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        throw new Error(`获取访问令牌失败: ${response.status}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('百度获取访问令牌错误:', error);
      throw error;
    }
  }

  static async recognizeImage(imageUrl) {
    const startTime = Date.now();
    
    try {
      const token = await this.getAccessToken();
      
      const url = `https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general?access_token=${token}`;
      
      const requestBody = new URLSearchParams({
        url: imageUrl,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody,
      });

      if (!response.ok) {
        throw new Error(`百度API调用失败: ${response.status}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      // 处理识别结果
      const predictions = [];
      
      if (data.result) {
        for (const item of data.result) {
          const label = this.mapToSolarLabel(item.keyword);
          if (label) {
            predictions.push({
              label,
              confidence: item.score,
            });
          }
        }
      }

      // 计算整体置信度
      const confidence = predictions.length > 0 
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
        : 0;

      return {
        status: 'success',
        predictions,
        confidence,
        processing_time: processingTime,
        api_used: 'baidu',
      };
    } catch (error) {
      console.error('百度识别错误:', error);
      return {
        status: 'error',
        predictions: [],
        confidence: 0,
        processing_time: Date.now() - startTime,
        api_used: 'baidu',
        error_message: error.message,
      };
    }
  }

  static mapToSolarLabel(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    
    // 直接匹配
    if (SOLAR_LABELS[lowerKeyword]) {
      return SOLAR_LABELS[lowerKeyword];
    }
    
    // 模糊匹配
    for (const [key, value] of Object.entries(SOLAR_LABELS)) {
      if (lowerKeyword.includes(key) || key.includes(lowerKeyword)) {
        return value;
      }
    }
    
    return null;
  }
}

// 统一的AI识别服务
class AIRecognitionService {
  static async recognizeSolarImage(imageUrl) {
    console.log('开始光伏图像识别...');
    
    try {
      // 优先使用阿里云API
      console.log('尝试使用阿里云API识别...');
      const aliyunResult = await AliyunVisionAPI.recognizeImage(imageUrl);
      
      if (aliyunResult.status === 'success' && aliyunResult.predictions.length > 0) {
        console.log('阿里云识别成功:', aliyunResult);
        return aliyunResult;
      }
      
      // 如果阿里云失败，尝试百度API
      console.log('阿里云识别失败，尝试百度API...');
      const baiduResult = await BaiduVisionAPI.recognizeImage(imageUrl);
      
      if (baiduResult.status === 'success' && baiduResult.predictions.length > 0) {
        console.log('百度识别成功:', baiduResult);
        return baiduResult;
      }
      
      // 如果都失败，返回错误
      console.log('所有API识别失败');
      return {
        status: 'error',
        predictions: [],
        confidence: 0,
        processing_time: Math.max(aliyunResult.processing_time, baiduResult.processing_time),
        api_used: 'both_failed',
        error_message: '所有AI服务识别失败，请检查图片质量或稍后重试',
      };
    } catch (error) {
      console.error('AI识别服务错误:', error);
      return {
        status: 'error',
        predictions: [],
        confidence: 0,
        processing_time: 0,
        api_used: 'error',
        error_message: error.message,
      };
    }
  }
}

exports.handler = async (event, context) => {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { imageUrl } = JSON.parse(event.body);

    if (!imageUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Image URL is required' }),
      };
    }

    // 使用真实的AI识别服务
    const result = await AIRecognitionService.recognizeSolarImage(imageUrl);
    
    // 添加时间戳
    result.timestamp = new Date().toISOString();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };

  } catch (error) {
    console.error('Recognition error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
    };
  }
};

