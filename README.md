# BugBoard Agent 目标项目

这是 TraceFix 使用的独立目标项目，不是控制台。首次运行需要安装依赖：

```powershell
npm ci
npm run dev
```

开发服务默认使用 `http://127.0.0.1:5174`，API 使用 `http://127.0.0.1:3001`，
避免和控制台的 `5173/3000` 冲突。可以通过 `VITE_PORT` 和 `PORT` 覆盖端口：

```powershell
$env:PORT="3011"
$env:VITE_PORT="5181"
npm run dev
```
