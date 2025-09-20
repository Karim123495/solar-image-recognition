import type { RecognitionResult, Prediction } from './supabase';

// AI API配置
const ALIYUN_ACCESS_KEY_ID = import.meta.env.ALIYUN_ACCESS_KEY_ID;
const ALIYUN_ACCESS_KEY_SECRET = import.meta.env.ALIYUN_ACCESS_KEY_SECRET;
const BAIDU_API_KEY = import.meta.env.BAIDU_API_KEY;
const BAIDU_SECRET_KEY = import.meta.env.BAIDU_SECRET_KEY;

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
export class AliyunVisionAPI {
  private static readonly ENDPOINT = 'https://imagerecog.cn-shanghai.aliyuncs.com';
  private static readonly API_VERSION = '2019-09-30';

  // 获取访问令牌
  private static async getAccessToken(): Promise<string> {
    if (!ALIYUN_ACCESS_KEY_ID || !ALIYUN_ACCESS_KEY_SECRET) {
      throw new Error('阿里云API密钥未配置');
    }

    const url = 'https://nls-meta.cn-shanghai.aliyuncs.com/pop/2018-05-18/tokens';
    const params = new URLSearchParams({
      AccessKeyId: ALIYUN_ACCESS_KEY_ID,
      AccessKeySecret: ALIYUN_ACCESS_KEY_SECRET,
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

  // 图像标签识别
  static async recognizeImage(imageUrl: string): Promise<RecognitionResult> {
    const startTime = Date.now();
    
    try {
      const token = await this.getAccessToken();
      
      const url = `${this.ENDPOINT}/?Action=TaggingImage&Version=${this.API_VERSION}`;
      
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
      const predictions: Prediction[] = [];
      
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
        error_message: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  // 映射标签到光伏相关标签
  private static mapToSolarLabel(tag: string): string | null {
    const lowerTag = tag.toLowerCase();
    
    // 直接匹配
    if (SOLAR_LABELS[lowerTag as keyof typeof SOLAR_LABELS]) {
      return SOLAR_LABELS[lowerTag as keyof typeof SOLAR_LABELS];
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
export class BaiduVisionAPI {
  private static readonly ENDPOINT = 'https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general';

  // 获取访问令牌
  private static async getAccessToken(): Promise<string> {
    if (!BAIDU_API_KEY || !BAIDU_SECRET_KEY) {
      throw new Error('百度API密钥未配置');
    }

    const url = 'https://aip.baidubce.com/oauth/2.0/token';
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: BAIDU_API_KEY,
      client_secret: BAIDU_SECRET_KEY,
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

  // 图像识别
  static async recognizeImage(imageUrl: string): Promise<RecognitionResult> {
    const startTime = Date.now();
    
    try {
      const token = await this.getAccessToken();
      
      const url = `${this.ENDPOINT}?access_token=${token}`;
      
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
      const predictions: Prediction[] = [];
      
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
        error_message: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  // 映射标签到光伏相关标签
  private static mapToSolarLabel(keyword: string): string | null {
    const lowerKeyword = keyword.toLowerCase();
    
    // 直接匹配
    if (SOLAR_LABELS[lowerKeyword as keyof typeof SOLAR_LABELS]) {
      return SOLAR_LABELS[lowerKeyword as keyof typeof SOLAR_LABELS];
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
export class AIRecognitionService {
  // 主要识别方法 - 优先使用阿里云，备用百度
  static async recognizeSolarImage(imageUrl: string): Promise<RecognitionResult> {
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
        error_message: error instanceof Error ? error.message : '识别服务异常',
      };
    }
  }

  // 获取识别建议
  static getRecognitionAdvice(predictions: Prediction[]): string {
    if (predictions.length === 0) {
      return '未检测到光伏相关特征，请上传清晰的光伏板图片。';
    }

    const normalPanels = predictions.filter(p => p.label === '正常光伏板');
    const leafCoverage = predictions.filter(p => p.label === '树叶遮挡');
    const dustCoverage = predictions.filter(p => p.label === '灰尘覆盖');
    const cloudShadow = predictions.filter(p => p.label === '云彩阴影');
    const otherObstacles = predictions.filter(p => p.label === '其他异物');

    let advice = '';

    if (normalPanels.length > 0) {
      advice += '✅ 检测到正常工作的光伏板。';
    }

    if (leafCoverage.length > 0) {
      advice += ' 🍃 发现树叶遮挡，建议及时清理以保持发电效率。';
    }

    if (dustCoverage.length > 0) {
      advice += ' 🧹 检测到灰尘覆盖，建议定期清洁光伏板表面。';
    }

    if (cloudShadow.length > 0) {
      advice += ' ☁️ 云彩阴影影响发电，这是正常现象。';
    }

    if (otherObstacles.length > 0) {
      advice += ' ⚠️ 发现其他异物，建议检查并清理。';
    }

    return advice || '识别完成，请查看详细结果。';
  }
}

