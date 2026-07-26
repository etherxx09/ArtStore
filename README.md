# Deploy Package - 独立可运行版本

这是从 `/tmp/openland-ready` 完整复制的可运行代码仓库。

## 启动方法

### Web 端（端口 5173）
```bash
cd gallery-frontend
npm install
npm run dev
```

### API 服务（端口 3000）
```bash
cd gallery-frontend/server
npm install
node server.js
```

## 目录结构
```
deploy/
├── .gitignore
├── CLAUDE.md
├── data/                       # 200 张文物图 (267MB)
├── gallery-frontend/           # Web 端
│   ├── src/                    # React 源码
│   ├── server/                 # Express API
│   ├── supabase/               # Supabase 配置
│   └── 配置文件
└── gallery-mini/               # 移动端
    └── src/
```

## 系统要求
- Node.js 18+
- npm 9+
