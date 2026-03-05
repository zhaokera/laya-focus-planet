# laya-focus-planet

一个基于 **LayaAir** 的微信小游戏项目，主题为「专注力星球 / Schulte Grid」。

项目当前包含：
- 竖屏手游风格首页（LOGO、四大功能按钮、粒子光效、漂浮数字、道具装饰、5x5 预览）
- 舒尔特方格核心玩法（3x3 / 4x4 / 5x5）
- 基础结果展示与场景切换逻辑

## 项目简介

`laya-focus-planet` 是一个专注力训练小游戏，核心玩法是按顺序点击数字。  
首页采用明亮、立体、偏宣传页风格的 UI，面向移动端（iPhone 竖屏）适配。

## 功能特性

- 竖屏首页 UI（750x1334 设计基准 + 自适应缩放）
- 四个主按钮：开始游戏 / 挑战模式 / 排行榜 / 设置
- 动效：
  - 背景粒子闪烁
  - 数字方块漂浮 + 轻旋转
  - 开始按钮呼吸 + 高光扫过
- 游戏流程：
  - 首页进入游戏场景
  - 网格点击判定
  - 结果面板展示

## 技术栈

- LayaAir
- TypeScript / JavaScript
- 微信小游戏构建链路（本地预览）

## 本地运行

1. 使用 LayaAir IDE 打开项目根目录。
2. 确认启动场景配置正常（`settings/BuildSettings.json`）。
3. 在 IDE 内编译并预览（微信小游戏或本地预览）。

## 目录结构（核心）

```text
assets/                场景与资源
assets/ui/home/        首页相关素材
src/Main.ts            首页逻辑（UI 与动效）
src/GameScene.ts       游戏场景逻辑
src/GridCell.ts        单元格逻辑
src/ResultPanel.ts     结果面板
settings/              项目与构建配置
```

## 当前状态

- 首页已完成手游宣传风格改版并适配竖屏。
- 已修复启动场景与缓存相关问题，当前版本可稳定运行。

