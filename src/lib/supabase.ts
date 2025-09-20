import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// 数据库类型定义 - 适配现有表结构
export interface User {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
  role?: string;
  points?: number;
}

export interface RecognitionRecord {
  id: string;
  user_id?: string;
  image_url: string;
  image_name: string;
  recognition_result: RecognitionResult;
  processing_time: number;
  created_at: string;
}

export interface RecognitionResult {
  status: 'success' | 'error';
  predictions: Prediction[];
  confidence: number;
  processing_time: number;
  api_used: string;
  error_message?: string;
}

export interface Prediction {
  label: string;
  confidence: number;
  bounding_box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface RecognitionStats {
  id: string;
  total_records: number;
  success_rate: number;
  avg_processing_time: number;
  updated_at: string;
}

// 数据库操作函数 - 使用现有表结构
export class DatabaseService {
  // 保存识别记录 - 使用analysis_reports表
  static async saveRecognitionRecord(record: Omit<RecognitionRecord, 'id' | 'created_at'>) {
    try {
      const recordData = {
        content: JSON.stringify({
          image_url: record.image_url,
          image_name: record.image_name,
          recognition_result: record.recognition_result,
          processing_time: record.processing_time,
          user_id: record.user_id
        })
      };

      const { data, error } = await supabase
        .from('analysis_reports')
        .insert([recordData])
        .select()
        .single();

      if (error) {
        console.error('Error saving recognition record:', error);
        throw error;
      }

      return {
        id: data.id,
        ...record,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  // 获取用户识别历史
  static async getUserRecognitionHistory(userId?: string, limit = 20) {
    try {
      let query = supabase
        .from('analysis_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching recognition history:', error);
        throw error;
      }

      // 解析content字段并过滤
      const records = (data || [])
        .map(item => {
          try {
            const content = JSON.parse(item.content);
            return {
              id: item.id,
              user_id: content.user_id,
              image_url: content.image_url,
              image_name: content.image_name,
              recognition_result: content.recognition_result,
              processing_time: content.processing_time,
              created_at: item.created_at
            };
          } catch (e) {
            return null;
          }
        })
        .filter(item => item !== null);

      // 如果指定了userId，进行过滤
      if (userId) {
        return records.filter(record => record.user_id === userId);
      }

      return records;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  // 获取识别统计
  static async getRecognitionStats() {
    try {
      const { data, error } = await supabase
        .from('analysis_reports')
        .select('content');

      if (error) {
        console.error('Error fetching recognition stats:', error);
        return {
          total_records: 0,
          success_rate: 0,
          avg_processing_time: 0,
        };
      }

      const records = (data || [])
        .map(item => {
          try {
            const content = JSON.parse(item.content);
            return {
              recognition_result: content.recognition_result,
              processing_time: content.processing_time
            };
          } catch (e) {
            return null;
          }
        })
        .filter(item => item !== null);

      const totalRecords = records.length;
      const successCount = records.filter(r => r.recognition_result?.status === 'success').length;
      const successRate = totalRecords > 0 ? (successCount / totalRecords) * 100 : 0;
      const avgProcessingTime = totalRecords > 0 ? 
        records.reduce((sum, r) => sum + (r.processing_time || 0), 0) / totalRecords : 0;

      return {
        total_records: totalRecords,
        success_rate: successRate,
        avg_processing_time: avgProcessingTime,
      };
    } catch (error) {
      console.error('Database error:', error);
      return {
        total_records: 0,
        success_rate: 0,
        avg_processing_time: 0,
      };
    }
  }

  // 更新识别统计 - 使用现有表结构，统计信息实时计算
  static async updateRecognitionStats() {
    // 由于使用现有表结构，统计信息在getRecognitionStats中实时计算
    console.log('Recognition stats updated (calculated in real-time)');
  }

  // 删除识别记录
  static async deleteRecognitionRecord(recordId: string) {
    try {
      const { error } = await supabase
        .from('analysis_reports')
        .delete()
        .eq('id', recordId);

      if (error) {
        console.error('Error deleting recognition record:', error);
        throw error;
      }
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }
}

// 图片上传到Supabase Storage - 使用现有存储桶
export class StorageService {
  // 上传图片
  static async uploadImage(file: File, userId?: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `solar-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = userId ? `solar/users/${userId}/${fileName}` : `solar/public/${fileName}`;

      // 尝试使用现有的存储桶，如果不存在则使用默认存储桶
      let bucketName = 'uploads'; // 使用现有的uploads存储桶
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading image:', error);
        throw error;
      }

      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Storage error:', error);
      throw error;
    }
  }

  // 删除图片
  static async deleteImage(filePath: string) {
    try {
      const bucketName = 'uploads';
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image:', error);
        throw error;
      }
    } catch (error) {
      console.error('Storage error:', error);
      throw error;
    }
  }
}
