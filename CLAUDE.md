# OPENLAND Gallery 项目

## 项目背景

OPENLAND 是一个艺术藏品展示网站，用于展示创始人近30年从亚洲、非洲收集的5000+件藏品。当前实现为 Web 网站，未来规划扩展到微信小程序。

## 技术栈和工具

### 当前 Web 项目
- **前端**：React + TypeScript + Vite
- **路由**：React Router DOM
- **后端**：Express + JSON（开发模式）
- **数据库**：Supabase（生产模式）
- **部署**：Docker + Caddy
- **包管理**：npm

### 未来扩展
- **微信小程序**：Taro / UniApp（待定）

## 项目结构

```
openland-gallery/          # Git 根目录
├── gallery-frontend/      # Web 前端 (发布)
├── data/                  # 藏品数据 (发布)
│   ├── images/            # 藏品图片 (199张)
│   └── 工作簿2.xlsx       # Excel 数据源
└── docs/                  # 设计管理文档 (不发布)
    ├── PROJECT.md
    ├── REQUIREMENTS.md
    ├── ROADMAP.md
    └── STATE.md
```

## Git 追踪范围

- `gallery-frontend/` - 源码
- `data/` - 图片 + 数据
- `.gitignore` - 忽略 `docs/*.md` 和系统文件

## 服务地址 (开发)

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:5173 |
| API | http://localhost:3000 |

## 项目约定

1. **代码风格**：React + TypeScript，使用 functional components + hooks
2. **命名规范**：
   - 组件：`PascalCase`
   - 函数/变量：`camelCase`
   - 常量：`UPPER_SNAKE_CASE`
3. **Git 提交**：简洁的 feat/fix/docs 前缀
4. **分支命名**：`feature/xxx`、`fix/xxx`

## 沟通偏好

- 使用中文沟通
- 代码注释使用中文或英文
- 决策前先确认方案再执行

## 禁止事项

- 禁止在代码中硬编码敏感信息（密码、API Key 等）
- 禁止将 `.env.production`、数据库密码提交到 Git
- 禁止直接修改生产服务器数据
- 禁止删除用户数据或藏品图片

## 当前功能

1. **藏品展示** - 202件藏品
2. **筛选** - 状态(在库/已售/暂时保留) + 地域(东南亚/东亚/非洲)
3. **收藏** - localStorage 持久化
4. **多语言** - 中英文切换

## 数据结构

```typescript
type Artwork = {
  id: string              // inventory_number
  inventory_number: string
  title: string
  title_zh: string | null
  origin: string
  material: string
  technique: string | null
  dimensions: string
  price: string
  inventory_status: 'available' | 'reserved' | 'sold'
  image_url: string | null
  region: '东南亚' | '东亚' | '非洲' | '其他'
  sort_order: number
}
```

## 启动命令

```bash
# API 服务
cd gallery-frontend/server && npm install && node server.js

# 前端
cd gallery-frontend && npm install && npm run dev
```

## API 接口

### 开发模式 API
```bash
# 获取所有已发布藏品
curl "http://localhost:3000/rest/v1/artworks?is_published=eq.true"

# 按地域筛选
curl "http://localhost:3000/rest/v1/artworks?is_published=eq.true&region=eq.东南亚"

# 按状态筛选
curl "http://localhost:3000/rest/v1/artworks?is_published=eq.true&inventory_status=eq.available"
```

### 浏览器访问
```
http://localhost:3000/rest/v1/artworks?is_published=eq.true
```

## 待办

- [ ] 连接真实 Supabase（生产环境）
- [ ] 添加更多筛选（年代、材质）
- [ ] 搜索功能
- [ ] 微信小程序开发
