# 知识图谱前端设置指南

## 1. 安装依赖

在 `PandaWiki/web/admin` 目录下运行：

```bash
pnpm add sigma@3.0.2 graphology@0.26.0 @sigma/edge-curve@3.1.0
pnpm add graphology-layout-forceatlas2@0.10.1 graphology-layout-noverlap@0.4.2
pnpm add graphology-indices@0.17.0 graphology-utils@2.3.0
```

## 2. 已创建的文件

### 类型定义

- `src/types/graph.ts` - 图谱相关 TypeScript 类型

### API 服务

- `src/request/Graph.ts` - 图谱 API 请求封装

### 常量配置

- `src/constant/graph.ts` - 节点/边颜色、大小配置

## 3. 下一步

安装依赖后，需要：

1. 从 GitNexus 复制核心组件
2. 创建图谱可视化组件
3. 创建图谱管理页面
4. 添加路由配置

## 4. GitNexus 组件迁移清单

需要从 GitNexus 项目复制以下文件：

- `components/GraphCanvas.tsx` - 图谱画布组件
- `hooks/useSigma.ts` - Sigma.js Hook
- `lib/graph-adapter.ts` - 数据适配器

这些文件需要修改以适配 PandaWiki 的数据结构（Neo4j 而非 KuzuDB）。
