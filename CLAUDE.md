# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

一个基于 **LayaAir** 的微信小游戏，主题为「专注力星球 / 舒尔特方格」—— 按顺序点击数字的专注力训练游戏。

## 开发命令

使用 LayaAir IDE 进行开发：
1. 用 LayaAir IDE 打开项目根目录
2. IDE 内编译并预览（微信小游戏或本地预览）
3. 启动场景配置在 `settings/BuildSettings.json`

## 核心架构

### 场景/页面结构

| 文件 | 职责 |
|------|------|
| `src/Main.ts` | 首页场景 - LOGO、四大功能按钮、粒子动效、场景跳转入口 |
| `src/GameScene.ts` | 游戏主场景 - 舒尔特方格核心玩法 (3x3/4x4/5x5) |
| `src/GridCell.ts` | 网格单元格组件 - 状态管理(待点/正确/错误)、视觉反馈、贴图驱动 |
| `src/LeaderboardPanel.ts` | 排行榜页面 - 总榜/周榜/月榜、本地存储、滚动列表 |

### 设计规格

- **设计基准**: 750x1334 (iPhone 竖屏)
- **游戏场景基准**: 375x750
- **自适应**: `scaleMode = "showall"`, 居中对齐

### 场景切换模式

采用「新建场景 → 添加到 stage → 销毁旧场景」的模式：

```typescript
const scene = new GameScene();
Laya.stage.addChild(scene);
this.destroy();
```

## LayaAir 开发规范

### 命名空间

必须使用 `Laya.` 前缀访问所有引擎类：
- ✅ `Laya.Sprite`, `Laya.Handler.create(...)`
- ❌ `Sprite`, `Handler`

### 资源路径

- 资源放在 `assets/resources/` 下，代码中使用 `resources/子目录/文件名.扩展名`
- 若需引用 `resources` 外的资源，需在 `settings/BuildSettings.json` 中配置 `alwaysIncluded`
- **禁止在代码中使用 UUID 引用资源**

### 资源加载策略

代码中使用候选路径数组回退机制加载资源：

```typescript
private makeCandidates(rel: string): string[] {
    return [
        rel,
        `assets/${rel}`,
        `assets/resources/${rel}`,
        `resources/${rel}`
    ];
}
```

### 场景/预制体编辑

- 场景文件 (`.ls`)、预制体文件 (`.lh`)、材质文件 (`.lmat`) **禁止直接用文件操作工具修改**
- 必须通过 LayaAir IDE MCP 工具（`Laya_EditAsset` 等）进行编辑
- 脚本文件 (`.ts`) 可直接编辑

## 关键实现细节

### GridCell 状态机

`GridCell` 组件有四种状态，由贴图驱动：
- `idle`: 待点击，紫色微光
- `active`: 高亮（当前目标），脉冲动画
- `correct`: 正确点击，金色光效
- `error`: 错误点击，红色闪烁后恢复

### 游戏流程

1. 首页选择难度 → `GameScene.currentDifficulty` 传递
2. 开始按钮触发 → `_isPlaying = true`, 计时开始
3. 点击判定 → `GridCell.markCompleted()` 或 `GridCell.showError()`
4. 完成所有数字 → 显示弹窗，可重玩

### 本地存储

排行榜使用 `Laya.LocalStorage` 存储数据，key 格式：`focus_planet_leaderboard_${tabIndex}`