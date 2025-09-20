# 光伏图像识别演示网站 - 部署指南

## 部署概述

本项目采用Netlify作为部署平台，支持自动构建和部署。部署过程包括环境配置、数据库设置、API配置等步骤。

## 部署步骤

### 1. 环境准备

#### 1.1 安装依赖
```bash
# 使用pnpm（推荐）
pnpm install

# 或使用npm
npm install
```

#### 1.2 环境变量配置
复制 `env.example` 文件为 `.env` 并配置相关变量：

```bash
cp env.example .env
```

### 2. Supabase数据库配置

#### 2.1 创建Supabase项目
1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 获取项目URL和匿名密钥

#### 2.2 数据库表结构
在Supabase SQL编辑器中执行以下SQL：

```sql
-- 创建用户表
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建识别记录表
CREATE TABLE recognition_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  image_url TEXT NOT NULL,
  image_name VARCHAR(255) NOT NULL,
  recognition_result JSONB NOT NULL,
  processing_time INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建识别统计表
CREATE TABLE recognition_stats (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
  total_records INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  avg_processing_time DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('solar-images', 'solar-images', true);

-- 设置存储策略
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'solar-images');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'solar-images');
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE USING (bucket_id = 'solar-images');
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE USING (bucket_id = 'solar-images');

-- 创建索引
CREATE INDEX idx_recognition_records_user_id ON recognition_records(user_id);
CREATE INDEX idx_recognition_records_created_at ON recognition_records(created_at DESC);
```

#### 2.3 配置环境变量
在 `.env` 文件中设置：
```env
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. AI API配置

#### 3.1 阿里云视觉智能API
1. 访问 [阿里云控制台](https://ecs.console.aliyun.com)
2. 开通视觉智能服务
3. 创建AccessKey
4. 配置环境变量：
```env
ALIYUN_ACCESS_KEY_ID=your_aliyun_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_aliyun_access_key_secret
```

#### 3.2 百度AI开放平台
1. 访问 [百度AI开放平台](https://ai.baidu.com)
2. 创建应用获取API Key和Secret Key
3. 配置环境变量：
```env
BAIDU_API_KEY=your_baidu_api_key
BAIDU_SECRET_KEY=your_baidu_secret_key
```

### 4. 本地开发

#### 4.1 启动开发服务器
```bash
pnpm dev
```

#### 4.2 构建项目
```bash
pnpm build
```

#### 4.3 预览构建结果
```bash
pnpm preview
```

### 5. Netlify部署

#### 5.1 通过Git部署（推荐）
1. 将代码推送到GitHub/GitLab
2. 在Netlify中连接Git仓库
3. 配置构建设置：
   - Build command: `pnpm build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

#### 5.2 环境变量配置
在Netlify控制台中设置环境变量：
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `ALIYUN_ACCESS_KEY_ID`
- `ALIYUN_ACCESS_KEY_SECRET`
- `BAIDU_API_KEY`
- `BAIDU_SECRET_KEY`

#### 5.3 手动部署
```bash
# 安装Netlify CLI
npm install -g netlify-cli

# 登录Netlify
netlify login

# 构建项目
pnpm build

# 部署到Netlify
netlify deploy --prod --dir=dist
```

### 6. 域名配置

#### 6.1 自定义域名
1. 在Netlify控制台添加自定义域名
2. 配置DNS记录指向Netlify
3. 启用HTTPS证书

#### 6.2 重定向配置
项目已配置 `netlify.toml` 文件，包含：
- API路由重定向
- 安全头部设置
- 缓存策略配置

### 7. 监控和维护

#### 7.1 性能监控
- 使用Netlify Analytics监控访问量
- 配置错误日志收集
- 监控API调用频率和成本

#### 7.2 数据备份
- 定期备份Supabase数据库
- 备份用户上传的图片
- 导出识别记录数据

#### 7.3 安全维护
- 定期更新依赖包
- 监控API密钥使用情况
- 检查安全漏洞

## 故障排除

### 常见问题

#### 1. 构建失败
- 检查Node.js版本（需要18+）
- 确认所有依赖已正确安装
- 检查环境变量配置

#### 2. API调用失败
- 验证API密钥是否正确
- 检查API配额是否充足
- 确认网络连接正常

#### 3. 图片上传失败
- 检查Supabase存储配置
- 确认存储桶权限设置
- 验证图片格式和大小限制

#### 4. 识别结果不准确
- 检查图片质量和清晰度
- 确认图片包含光伏板内容
- 尝试使用不同的API服务

### 日志查看
```bash
# 查看Netlify函数日志
netlify functions:log

# 查看构建日志
netlify logs
```

## 性能优化

### 1. 图片优化
- 使用WebP格式
- 实现图片压缩
- 配置CDN缓存

### 2. API优化
- 实现请求缓存
- 使用批量处理
- 优化错误重试机制

### 3. 数据库优化
- 创建适当的索引
- 实现分页查询
- 定期清理旧数据

## 扩展功能

### 1. 批量识别
- 支持多图片同时上传
- 实现队列处理机制
- 提供批量结果导出

### 2. 用户系统
- 实现用户注册登录
- 添加权限管理
- 支持个人数据管理

### 3. 数据分析
- 添加统计图表
- 实现趋势分析
- 提供报告生成功能

---

**注意**: 部署前请确保所有环境变量已正确配置，数据库表结构已创建，API服务已开通并测试通过。

