-- 光伏图像识别演示网站 - 初始数据库架构
-- 创建时间: 2024-12-19

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(100),
  avatar_url TEXT,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建识别记录表
CREATE TABLE IF NOT EXISTS recognition_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  image_name VARCHAR(255) NOT NULL,
  recognition_result JSONB NOT NULL,
  processing_time INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建识别统计表
CREATE TABLE IF NOT EXISTS recognition_stats (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
  total_records INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  avg_processing_time DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public) 
VALUES ('solar-images', 'solar-images', true)
ON CONFLICT (id) DO NOTHING;

-- 设置存储策略
DO $$
BEGIN
  -- 删除现有策略（如果存在）
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
  
  -- 创建新的存储策略
  CREATE POLICY "Public Access" ON storage.objects 
    FOR SELECT USING (bucket_id = 'solar-images');
    
  CREATE POLICY "Authenticated Upload" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'solar-images');
    
  CREATE POLICY "Authenticated Update" ON storage.objects 
    FOR UPDATE USING (bucket_id = 'solar-images');
    
  CREATE POLICY "Authenticated Delete" ON storage.objects 
    FOR DELETE USING (bucket_id = 'solar-images');
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_recognition_records_user_id ON recognition_records(user_id);
CREATE INDEX IF NOT EXISTS idx_recognition_records_created_at ON recognition_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为users表创建更新时间触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为recognition_stats表创建更新时间触发器
DROP TRIGGER IF EXISTS update_recognition_stats_updated_at ON recognition_stats;
CREATE TRIGGER update_recognition_stats_updated_at
  BEFORE UPDATE ON recognition_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 插入初始统计数据
INSERT INTO recognition_stats (id, total_records, success_rate, avg_processing_time)
VALUES ('main', 0, 0.00, 0.00)
ON CONFLICT (id) DO NOTHING;

-- 创建示例用户（可选）
INSERT INTO users (email, username, full_name, role)
VALUES ('demo@solarimagecs.com', 'demo_user', '演示用户', 'user')
ON CONFLICT (email) DO NOTHING;

-- 创建识别记录统计函数
CREATE OR REPLACE FUNCTION update_recognition_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新统计信息
  UPDATE recognition_stats 
  SET 
    total_records = (SELECT COUNT(*) FROM recognition_records),
    success_rate = (
      SELECT 
        CASE 
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND((COUNT(CASE WHEN recognition_result->>'status' = 'success' THEN 1 END) * 100.0) / COUNT(*), 2)
        END
      FROM recognition_records
    ),
    avg_processing_time = (
      SELECT 
        CASE 
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(AVG(processing_time), 2)
        END
      FROM recognition_records
    ),
    updated_at = NOW()
  WHERE id = 'main';
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器来自动更新统计信息
DROP TRIGGER IF EXISTS update_stats_on_record_insert ON recognition_records;
CREATE TRIGGER update_stats_on_record_insert
  AFTER INSERT ON recognition_records
  FOR EACH ROW
  EXECUTE FUNCTION update_recognition_stats();

DROP TRIGGER IF EXISTS update_stats_on_record_delete ON recognition_records;
CREATE TRIGGER update_stats_on_record_delete
  AFTER DELETE ON recognition_records
  FOR EACH ROW
  EXECUTE FUNCTION update_recognition_stats();

-- 创建获取用户识别历史的函数
CREATE OR REPLACE FUNCTION get_user_recognition_history(
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  image_url TEXT,
  image_name VARCHAR,
  recognition_result JSONB,
  processing_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.user_id,
    r.image_url,
    r.image_name,
    r.recognition_result,
    r.processing_time,
    r.created_at
  FROM recognition_records r
  WHERE (p_user_id IS NULL OR r.user_id = p_user_id)
  ORDER BY r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ language 'plpgsql';

-- 创建获取识别统计的函数
CREATE OR REPLACE FUNCTION get_recognition_stats()
RETURNS TABLE (
  total_records INTEGER,
  success_rate DECIMAL,
  avg_processing_time DECIMAL,
  today_records INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.total_records,
    s.success_rate,
    s.avg_processing_time,
    (SELECT COUNT(*) FROM recognition_records WHERE DATE(created_at) = CURRENT_DATE)::INTEGER as today_records
  FROM recognition_stats s
  WHERE s.id = 'main';
END;
$$ language 'plpgsql';

-- 注释说明
COMMENT ON TABLE users IS '用户信息表';
COMMENT ON TABLE recognition_records IS '识别记录表';
COMMENT ON TABLE recognition_stats IS '识别统计表';

COMMENT ON COLUMN users.id IS '用户唯一标识';
COMMENT ON COLUMN users.email IS '用户邮箱';
COMMENT ON COLUMN users.username IS '用户名';
COMMENT ON COLUMN users.role IS '用户角色：user, admin';
COMMENT ON COLUMN users.points IS '用户积分';

COMMENT ON COLUMN recognition_records.id IS '记录唯一标识';
COMMENT ON COLUMN recognition_records.user_id IS '用户ID';
COMMENT ON COLUMN recognition_records.image_url IS '图片URL';
COMMENT ON COLUMN recognition_records.image_name IS '图片名称';
COMMENT ON COLUMN recognition_records.recognition_result IS '识别结果JSON';
COMMENT ON COLUMN recognition_records.processing_time IS '处理时间(毫秒)';

COMMENT ON COLUMN recognition_stats.id IS '统计ID';
COMMENT ON COLUMN recognition_stats.total_records IS '总记录数';
COMMENT ON COLUMN recognition_stats.success_rate IS '成功率(%)';
COMMENT ON COLUMN recognition_stats.avg_processing_time IS '平均处理时间(毫秒)';
