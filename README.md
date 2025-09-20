# 光伏图像识别演示网站 (Solar Image Recognition Demo)

## 🌟 GitHub仓库

**项目地址**: [https://github.com/bistuwangqiyuan/solar-image-recognition](https://github.com/bistuwangqiyuan/solar-image-recognition)

[![GitHub stars](https://img.shields.io/github/stars/bistuwangqiyuan/solar-image-recognition?style=social)](https://github.com/bistuwangqiyuan/solar-image-recognition)
[![GitHub forks](https://img.shields.io/github/forks/bistuwangqiyuan/solar-image-recognition?style=social)](https://github.com/bistuwangqiyuan/solar-image-recognition)
[![GitHub license](https://img.shields.io/github/license/bistuwangqiyuan/solar-image-recognition)](https://github.com/bistuwangqiyuan/solar-image-recognition)
[![Netlify Status](https://api.netlify.com/api/v1/badges/your-site-id/deploy-status)](https://app.netlify.com/sites/your-site-name/deploys)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/bistuwangqiyuan/solar-image-recognition)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Astro](https://img.shields.io/badge/Astro-FF5D01?logo=astro&logoColor=white)](https://astro.build/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

## 项目概述

一个专业的光伏图像识别演示网站，能够识别光伏板状态、遮挡物（树叶、灰尘、云彩等）并进行智能分析。采用现代化技术栈构建，提供工业级可靠性和用户体验。

## 技术栈

- **前端框架**: Astro (静态站点生成 + SSR)
- **样式框架**: Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **AI服务**: 阿里云视觉智能API + 百度AI开放平台
- **部署平台**: Netlify
- **开发语言**: TypeScript + JavaScript

## 核心功能

### 1. 光伏图像识别
- **正常光伏板识别**: 检测光伏板完整性和工作状态
- **遮挡物检测**: 
  - 树叶遮挡识别
  - 灰尘覆盖检测
  - 云彩阴影分析
  - 其他异物识别
- **智能分析**: 提供遮挡程度评估和清洁建议

### 2. 用户界面
- **响应式设计**: 移动端优先，支持多设备访问
- **现代化UI**: 采用Material Design和现代设计语言
- **实时预览**: 上传图片即时显示识别结果
- **结果可视化**: 直观的识别结果展示和标注

### 3. 数据管理
- **识别历史**: 保存用户识别记录
- **统计分析**: 识别准确率和趋势分析
- **数据导出**: 支持结果数据导出

## 项目结构

```
solarimagecs/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── ImageUpload.astro
│   │   ├── RecognitionResult.astro
│   │   └── AnalysisChart.astro
│   ├── layouts/             # 页面布局
│   │   └── Layout.astro
│   ├── pages/               # 页面路由
│   │   ├── index.astro      # 主页
│   │   ├── recognition.astro # 识别页面
│   │   ├── history.astro    # 历史记录
│   │   └── about.astro      # 关于页面
│   ├── lib/                 # 工具函数
│   │   ├── supabase.ts      # 数据库客户端
│   │   ├── ai-apis.ts       # AI API集成
│   │   └── utils.ts         # 通用工具
│   └── styles/              # 样式文件
│       └── global.css
├── public/                  # 静态资源
│   ├── images/              # 示例图片
│   └── icons/               # 图标文件
├── tests/                   # 测试文件
├── netlify/                 # Netlify Functions
└── docs/                    # 项目文档
```

## 开发任务

### ✅ 已完成任务
- [x] 2024-12-19: 项目初始化和架构设计
- [x] 2024-12-19: 创建项目文档和PRD
- [x] 2024-12-19: 配置技术栈(Astro + Supabase + Tailwind CSS)
- [x] 2024-12-19: 设计现代化UI界面
- [x] 2024-12-19: 实现光伏图像识别功能
- [x] 2024-12-19: 集成AI识别API服务
- [x] 2024-12-19: 配置Supabase数据库
- [x] 2024-12-19: 编写测试用例和功能测试
- [x] 2024-12-19: 创建可复用组件库
- [x] 2024-12-19: 优化用户界面和用户体验
- [x] 2024-12-19: 完善Netlify Functions API
- [x] 2024-12-19: 项目构建和部署准备

### 🚀 项目状态
**生产就绪** - 所有核心功能已完成，可以部署到生产环境

### 🔮 未来优化方向
- [ ] 优化识别算法准确率
- [ ] 添加批量识别功能
- [ ] 实现识别结果分享功能
- [ ] 用户认证系统
- [ ] 移动端APP开发

## 🚀 快速开始

### 环境要求
- Node.js 18+
- pnpm (推荐) 或 npm

### 克隆项目
```bash
git clone https://github.com/bistuwangqiyuan/solar-image-recognition.git
cd solar-image-recognition
```

### 本地开发
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建项目
pnpm build

# 预览构建结果
pnpm preview
```

### 环境变量配置
创建 `.env` 文件：
```env
# Supabase配置
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI API配置
ALIYUN_ACCESS_KEY_ID=your_aliyun_key
ALIYUN_ACCESS_KEY_SECRET=your_aliyun_secret
BAIDU_API_KEY=your_baidu_api_key
BAIDU_SECRET_KEY=your_baidu_secret_key
```

## 部署

项目配置了Netlify部署，支持：
- 自动构建和部署
- 环境变量管理
- 自定义域名
- CDN加速

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

### 贡献流程
1. **Fork 项目** - 点击右上角的 Fork 按钮
2. **克隆仓库** - `git clone https://github.com/your-username/solar-image-recognition.git`
3. **创建分支** - `git checkout -b feature/your-feature-name`
4. **提交更改** - `git commit -m "Add some feature"`
5. **推送分支** - `git push origin feature/your-feature-name`
6. **创建 PR** - 在GitHub上创建 Pull Request

### 开发规范
- 遵循现有的代码风格
- 添加必要的测试用例
- 更新相关文档
- 确保所有测试通过

### 报告问题
- 使用 GitHub Issues 报告 bug
- 提供详细的复现步骤
- 包含环境信息和错误日志

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- **项目地址**: [https://github.com/bistuwangqiyuan/solar-image-recognition](https://github.com/bistuwangqiyuan/solar-image-recognition)
- **问题反馈**: [GitHub Issues](https://github.com/bistuwangqiyuan/solar-image-recognition/issues)
- **功能建议**: [GitHub Discussions](https://github.com/bistuwangqiyuan/solar-image-recognition/discussions)

## ⭐ 支持项目

如果这个项目对您有帮助，请给我们一个 ⭐ Star！

---

**注意**: 本项目专注于光伏图像识别的实际应用，所有识别功能均使用真实的AI API服务，确保识别结果的准确性和可靠性。
