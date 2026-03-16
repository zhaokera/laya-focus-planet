/**
 * 排行榜页面 - Focus Planet
 * 风格：深空主题，金银铜前三名高亮
 * 支持多游戏类型排行榜
 */

const { Event } = Laya;

import { Main } from "./Main";
import { RankItemPool, RankItemData } from "../utils/RankItemPool";

// 游戏类型定义
export type LeaderboardGameType = "schulte" | "memory";

// 舒尔特方格记录
interface SchulteRecord {
    timeMs: number;
    errors: number;
    name: string;
    date: number;
}

// 记忆闪现记录
interface MemoryRecord {
    score: number;
    level: number;
    name: string;
    date: number;
}

// 显示用统一记录格式
interface RankRecord {
    rank: number;
    name: string;
    time: string;
    score: number;
    timeMs: number;
    errors: number;
    level: number;
    date: number;
}

// 游戏类型配置
interface GameTypeConfig {
    type: LeaderboardGameType;
    label: string;
    icon?: string;
}

export class LeaderboardPanel extends Laya.Scene {
    private readonly BASE_W: number = 375;
    private readonly BASE_H: number = 750;

    private readonly COLORS = {
        bg: "#0F0F1A",
        bgGradientStart: "#0F0F1A",
        bgGradientEnd: "#1A1A2E",
        panelBg: "rgba(255,255,255,0.05)",
        title: "#FFD700",
        gold: "#FFD700",
        silver: "#C0C0C0",
        bronze: "#CD7F32",
        normal: "#FFFFFF",
        textMuted: "#8b9dc3",
        accent: "#3498DB",
        btnPrimary: "#27AE60",
        btnSecondary: "rgba(255,255,255,0.1)"
    };

    // 游戏类型配置
    private readonly GAME_TYPES: GameTypeConfig[] = [
        { type: "schulte", label: "舒尔特方格" },
        { type: "memory", label: "记忆闪现" }
    ];

    private root: Laya.Sprite = null;
    private stageBg: Laya.Sprite = null;
    private starsContainer: Laya.Sprite = null;
    private bgLayer: Laya.Sprite = null;
    private panelContainer: Laya.Sprite = null;
    private contentLayer: Laya.Sprite = null;
    private gameTypeContainer: Laya.Sprite = null;
    private tabContainer: Laya.Sprite = null;
    private listContainer: Laya.Sprite = null;
    private listMask: Laya.Sprite = null;
    private stars: Laya.Sprite[] = [];

    private currentGameType: LeaderboardGameType = "schulte";
    private currentTab: number = 0; // 0:总榜, 1:周榜, 2:月榜
    private gameTypeBtns: Laya.Sprite[] = [];
    private tabBtns: Laya.Sprite[] = [];

    // 列表项对象池
    private rankItemPool: RankItemPool;

    constructor() {
        super();
        // 初始化列表项对象池
        this.rankItemPool = new RankItemPool(10, 30);
    }

    onAwake(): void {
        Laya.stage.alignH = "center";
        Laya.stage.alignV = "middle";
        Laya.stage.scaleMode = "showall";
        Laya.stage.screenMode = "vertical";
        Laya.stage.bgColor = "#1A1A2E";

        this.initRoot();
        this.initPanel();

        Laya.stage.on(Event.RESIZE, this, this.onResize);
    }

    private initRoot(): void {
        this.size(Math.max(320, Laya.stage.width), Math.max(568, Laya.stage.height));

        // 全屏自适应背景
        this.stageBg = new Laya.Sprite();
        this.addChild(this.stageBg);
        this.refreshStageBg();

        // 星星背景层
        this.starsContainer = new Laya.Sprite();
        this.addChild(this.starsContainer);
        this.createStars();

        // 缩放容器
        this.root = new Laya.Sprite();
        this.addChild(this.root);
        this.applyLayoutScale();
    }

    private applyLayoutScale(): void {
        const sw = Math.max(1, Laya.stage.width);
        const sh = Math.max(1, Laya.stage.height);
        const scale = Math.min(sw / this.BASE_W, sh / this.BASE_H);

        this.root.scale(scale, scale);
        this.root.pos((sw - this.BASE_W * scale) * 0.5, (sh - this.BASE_H * scale) * 0.5);
        this.root.size(this.BASE_W, this.BASE_H);
    }

    /**
     * 创建星星闪烁背景
     */
    private createStars(): void {
        // 根据屏幕大小生成星星数量
        const sw = Math.max(1, Laya.stage.width);
        const sh = Math.max(1, Laya.stage.height);
        const starCount = Math.floor((sw * sh) / 8000); // 约 60-80 颗星星

        for (let i = 0; i < starCount; i++) {
            const star = new Laya.Sprite();
            const x = Math.random() * sw;
            const y = Math.random() * sh;
            const size = 1 + Math.random() * 2; // 1-3px
            const alpha = 0.3 + Math.random() * 0.7;

            // 绘制星星
            star.graphics.drawCircle(0, 0, size, `rgba(255,255,255,${alpha})`);
            star.pos(x, y);
            star.alpha = 0.3 + Math.random() * 0.4;

            this.starsContainer.addChild(star);
            this.stars.push(star);

            // 闪烁动画 - 随机延迟启动
            const delay = Math.random() * 3000;
            const duration = 2000 + Math.random() * 1000;
            this.startStarTwinkle(star, delay, duration);
        }
    }

    /**
     * 启动星星闪烁动画
     */
    private startStarTwinkle(star: Laya.Sprite, delay: number, duration: number): void {
        Laya.timer.once(delay, this, () => {
            if (star.destroyed) return;
            this.twinkleStar(star, duration);
        });
    }

    /**
     * 星星闪烁动画循环
     */
    private twinkleStar(star: Laya.Sprite, duration: number): void {
        if (star.destroyed) return;

        const targetAlpha = star.alpha > 0.5 ? 0.2 + Math.random() * 0.3 : 0.6 + Math.random() * 0.4;
        Laya.Tween.to(star, { alpha: targetAlpha }, duration, null, Laya.Handler.create(this, () => {
            if (!star.destroyed) {
                this.twinkleStar(star, duration);
            }
        }));
    }

    private refreshStageBg(): void {
        if (!this.stageBg) return;
        const sw = Math.max(1, Laya.stage.width);
        const sh = Math.max(1, Laya.stage.height);

        this.stageBg.graphics.clear();
        // 绘制深空渐变背景
        const gradient = this.stageBg.graphics;
        // 使用多段矩形模拟渐变效果（LayaAir 不直接支持渐变填充）
        const steps = 10;
        for (let i = 0; i < steps; i++) {
            const ratio = i / steps;
            const nextRatio = (i + 1) / steps;
            const y1 = sh * ratio;
            const y2 = sh * nextRatio;
            const h = y2 - y1;

            // 从深到浅的深紫色渐变
            const r = Math.floor(15 + ratio * 10);
            const g = Math.floor(15 + ratio * 10);
            const b = Math.floor(26 + ratio * 20);
            const color = `rgb(${r},${g},${b})`;

            gradient.drawRect(0, y1, sw, h + 1, color);
        }
    }

    private onResize(): void {
        const sw = Math.max(320, Laya.stage.width);
        const sh = Math.max(568, Laya.stage.height);
        this.size(sw, sh);

        this.applyLayoutScale();
        this.refreshStageBg();
    }

    private initPanel(): void {
        // 面板参数 - 调整为更紧凑的布局
        const panelW = 340;
        const panelH = 600; // 增加高度以容纳游戏类型选择
        const panelX = (this.BASE_W - panelW) * 0.5;
        const panelY = 40;

        // 半透明遮罩背景
        this.bgLayer = new Laya.Sprite();
        this.bgLayer.graphics.drawRect(0, 0, this.BASE_W, this.BASE_H, "rgba(0,0,0,0.3)");
        this.bgLayer.alpha = 0;
        this.root.addChild(this.bgLayer);

        // 主面板容器 - 包含所有面板元素
        this.panelContainer = new Laya.Sprite();
        this.panelContainer.pos(panelX, panelY);
        this.panelContainer.size(panelW, panelH);
        this.root.addChild(this.panelContainer);

        // 面板背景（阴影 + 主体）
        this.createPanelBackground(panelW, panelH);

        // 面板内容层 - 所有内容元素放在这里
        this.contentLayer = new Laya.Sprite();
        this.panelContainer.addChild(this.contentLayer);

        this.createTitle();
        this.createGameTypeTabs();
        this.createTabs();
        this.createScrollList();
        this.createButtons();

        // 入场动画
        this.playEnterAnimation();
    }

    private createPanelBackground(panelW: number, panelH: number): void {
        // 面板阴影 - 更大更明显，向下偏移
        const shadow = new Laya.Sprite();
        shadow.graphics.drawRoundRect(6, 12, panelW, panelH, 24, "rgba(0,0,0,0.5)");
        this.panelContainer.addChild(shadow);

        // 面板主体 - 带边框的圆角矩形
        const panelBg = new Laya.Sprite();
        panelBg.size(panelW, panelH);
        const g = panelBg.graphics;
        // 使用原生 drawRoundRect: (x, y, width, height, radius, fillColor, lineColor, lineWidth)
        g.drawRoundRect(0, 0, panelW, panelH, 24,
            "rgba(255,255,255,0.08)",   // 填充色 - 稍微提高可见度
            "rgba(255,255,255,0.15)",   // 边框色
            1                            // 边框宽度
        );
        this.panelContainer.addChild(panelBg);

        // 装饰性边角
        this.drawPanelCorners(panelBg, panelW, panelH);
    }

    private drawPanelCorners(panel: Laya.Sprite, w: number, h: number): void {
        const color = "rgba(139,92,246,0.7)";
        const lineW = 2;
        const seg = 16;
        const m = 12;

        const corners = [
            { lines: [[0, seg, 0, 0], [0, 0, seg, 0]], pos: [m, m] },
            { lines: [[0, 0, seg, 0], [seg, 0, seg, seg]], pos: [w - m - seg, m] },
            { lines: [[0, 0, 0, seg], [0, seg, seg, seg]], pos: [m, h - m - seg] },
            { lines: [[seg, 0, seg, seg], [0, seg, seg, seg]], pos: [w - m - seg, h - m - seg] }
        ];

        corners.forEach((corner) => {
            const sprite = new Laya.Sprite();
            corner.lines.forEach((line) => {
                sprite.graphics.drawLine(line[0], line[1], line[2], line[3], color, lineW);
            });
            sprite.pos(corner.pos[0], corner.pos[1]);
            panel.addChild(sprite);
        });
    }

    private createTitle(): void {
        const panelW = 340;

        // Logo文字
        const logoText = new Laya.Text();
        logoText.text = "FOCUS PLANET";
        logoText.font = "Microsoft YaHei";
        logoText.fontSize = 12;
        logoText.color = this.COLORS.textMuted;
        logoText.width = panelW;
        logoText.align = "center";
        logoText.pos(0, 12);
        this.contentLayer.addChild(logoText);

        // 主标题
        const titleText = new Laya.Text();
        titleText.text = "排 行 榜";
        titleText.font = "Microsoft YaHei";
        titleText.fontSize = 24;
        titleText.bold = true;
        titleText.color = this.COLORS.title;
        titleText.stroke = 2;
        titleText.strokeColor = "rgba(255,165,0,0.3)";
        titleText.width = panelW;
        titleText.align = "center";
        titleText.pos(0, 28);
        this.contentLayer.addChild(titleText);
    }

    /**
     * 创建游戏类型选择 Tab
     */
    private createGameTypeTabs(): void {
        const tabWidth = 100;
        const tabHeight = 32;
        const gap = 16;
        const panelW = 340;
        const startX = (panelW - (this.GAME_TYPES.length * tabWidth + (this.GAME_TYPES.length - 1) * gap)) / 2;
        const tabY = 60;

        this.gameTypeContainer = new Laya.Sprite();
        this.gameTypeContainer.pos(0, 0);
        this.contentLayer.addChild(this.gameTypeContainer);

        this.GAME_TYPES.forEach((gameConfig, index) => {
            const tab = new Laya.Sprite();
            tab.size(tabWidth, tabHeight);
            tab.pos(startX + index * (tabWidth + gap), tabY);
            tab.mouseEnabled = true;

            this.updateGameTypeTabStyle(tab, gameConfig.type === this.currentGameType);

            const text = new Laya.Text();
            text.name = "label";
            text.text = gameConfig.label;
            text.font = "Microsoft YaHei";
            text.fontSize = 13;
            text.bold = gameConfig.type === this.currentGameType;
            text.color = gameConfig.type === this.currentGameType ? this.COLORS.title : this.COLORS.textMuted;
            text.width = tabWidth;
            text.height = tabHeight;
            text.align = "center";
            text.valign = "middle";
            tab.addChild(text);

            tab.on(Event.CLICK, this, () => this.onGameTypeClick(gameConfig.type));

            this.gameTypeBtns.push(tab);
            this.gameTypeContainer.addChild(tab);
        });
    }

    private updateGameTypeTabStyle(tab: Laya.Sprite, active: boolean): void {
        const g = tab.graphics;
        g.clear();

        if (active) {
            // 激活状态 - 紫色渐变背景
            const steps = 6;
            for (let i = 0; i < steps; i++) {
                const ratio = i / steps;
                const nextRatio = (i + 1) / steps;
                const x1 = tab.width * ratio;
                const x2 = tab.width * nextRatio;
                const w = x2 - x1;

                const alpha = 0.12 + ratio * 0.12;
                const color = `rgba(139,92,246,${alpha})`;
                g.drawRect(x1, 0, w + 1, tab.height, color);
            }
            // 边框
            g.drawRoundRect(0, 0, tab.width, tab.height, 16, null, "rgba(139,92,246,0.6)", 1.5);
        } else {
            // 非激活状态 - 半透明背景 + 边框
            g.drawRoundRect(0, 0, tab.width, tab.height, 16,
                "rgba(255,255,255,0.03)",
                "rgba(255,255,255,0.1)",
                1
            );
        }
    }

    private onGameTypeClick(gameType: LeaderboardGameType): void {
        if (this.currentGameType === gameType) return;

        this.currentGameType = gameType;

        // 更新游戏类型Tab样式
        this.gameTypeBtns.forEach((tab, i) => {
            const isActive = this.GAME_TYPES[i].type === gameType;
            this.updateGameTypeTabStyle(tab, isActive);
            const text = tab.getChildByName("label") as Laya.Text;
            if (text) {
                text.color = isActive ? this.COLORS.title : this.COLORS.textMuted;
                text.bold = isActive;
            }
        });

        // 重置时间Tab到总榜
        this.currentTab = 0;
        this.updateTimeTabs();

        // 重新渲染列表
        this.refreshList();
    }

    private updateTimeTabs(): void {
        this.tabBtns.forEach((tab, i) => {
            this.updateTabStyle(tab, i === this.currentTab);
            const text = tab.getChildByName("label") as Laya.Text;
            if (text) {
                text.color = i === this.currentTab ? this.COLORS.title : this.COLORS.textMuted;
                text.bold = i === this.currentTab;
            }
        });
    }

    private createTabs(): void {
        const tabs = ["总榜", "周榜", "月榜"];
        const tabWidth = 72;
        const tabHeight = 32;
        const gap = 12;
        const panelW = 340;
        const startX = (panelW - (tabs.length * tabWidth + (tabs.length - 1) * gap)) / 2;
        const tabY = 100; // 调整位置，为游戏类型Tab留出空间

        this.tabContainer = new Laya.Sprite();
        this.tabContainer.pos(0, 0);
        this.contentLayer.addChild(this.tabContainer);

        tabs.forEach((label, index) => {
            const tab = new Laya.Sprite();
            tab.size(tabWidth, tabHeight);
            tab.pos(startX + index * (tabWidth + gap), tabY);
            tab.mouseEnabled = true;

            this.updateTabStyle(tab, index === this.currentTab);

            const text = new Laya.Text();
            text.name = "label";
            text.text = label;
            text.font = "Microsoft YaHei";
            text.fontSize = 14;
            text.bold = index === this.currentTab;
            text.color = index === this.currentTab ? this.COLORS.title : this.COLORS.textMuted;
            text.width = tabWidth;
            text.height = tabHeight;
            text.align = "center";
            text.valign = "middle";
            tab.addChild(text);

            tab.on(Event.CLICK, this, () => this.onTabClick(index));

            this.tabBtns.push(tab);
            this.tabContainer.addChild(tab);
        });
    }

    private updateTabStyle(tab: Laya.Sprite, active: boolean): void {
        const g = tab.graphics;
        g.clear();

        if (active) {
            // 激活状态 - 金色渐变背景（用多段矩形模拟）
            const steps = 8;
            for (let i = 0; i < steps; i++) {
                const ratio = i / steps;
                const nextRatio = (i + 1) / steps;
                const x1 = tab.width * ratio;
                const x2 = tab.width * nextRatio;
                const w = x2 - x1;

                // 金色渐变：从深金色到亮金色
                const alpha = 0.15 + ratio * 0.15;
                const color = `rgba(255,${Math.floor(200 + ratio * 15)},0,${alpha})`;
                g.drawRect(x1, 0, w + 1, tab.height, color);
            }
            // 边框
            g.drawRoundRect(0, 0, tab.width, tab.height, 18, null, "rgba(255,215,0,0.6)", 1.5);
        } else {
            // 非激活状态 - 半透明背景 + 边框
            g.drawRoundRect(0, 0, tab.width, tab.height, 18,
                "rgba(255,255,255,0.05)",
                "rgba(255,255,255,0.12)",
                1
            );
        }
    }

    private onTabClick(index: number): void {
        if (this.currentTab === index) return;

        this.currentTab = index;

        // 更新Tab样式
        this.updateTimeTabs();

        // 重新渲染列表
        this.refreshList();
    }

    private createScrollList(): void {
        const listW = 320;
        const listH = 340; // 调整列表高度
        const panelW = 340;
        const listX = (panelW - listW) * 0.5;
        const listY = 145; // 调整位置

        // 使用普通 Sprite 替代 Panel
        this.listMask = new Laya.Sprite();
        this.listMask.size(listW, listH);
        this.listMask.pos(listX, listY);
        // 设置滚动区域
        this.listMask.scrollRect = new Laya.Rectangle(0, 0, listW, listH);
        this.contentLayer.addChild(this.listMask);

        this.listContainer = new Laya.Sprite();
        this.listContainer.size(listW, listH);
        this.listMask.addChild(this.listContainer);

        // 添加触摸滚动支持
        this.setupScrolling();

        this.refreshList();
    }

    private scrollStartY: number = 0;
    private scrollOffset: number = 0;
    private maxScroll: number = 0;

    private setupScrolling(): void {
        this.listMask.on(Event.MOUSE_DOWN, this, this.onScrollStart);
        this.listMask.on(Event.MOUSE_MOVE, this, this.onScrollMove);
        this.listMask.on(Event.MOUSE_UP, this, this.onScrollEnd);
        this.listMask.on(Event.MOUSE_OUT, this, this.onScrollEnd);
    }

    private onScrollStart(e: Laya.Event): void {
        this.scrollStartY = e.stageY;
    }

    private onScrollMove(e: Laya.Event): void {
        if (this.scrollStartY === 0) return;
        const deltaY = e.stageY - this.scrollStartY;
        this.scrollStartY = e.stageY;

        const newOffset = this.scrollOffset + deltaY;
        this.scrollOffset = Math.max(0, Math.min(this.maxScroll, newOffset));
        this.listContainer.y = -this.scrollOffset;
    }

    private onScrollEnd(): void {
        this.scrollStartY = 0;
    }

    private refreshList(): void {
        // 先释放之前的项回池
        const oldItems = (this.listContainer as any).__rankItems as Laya.Sprite[];
        if (oldItems && oldItems.length > 0) {
            this.rankItemPool.releaseAll(oldItems);
            (this.listContainer as any).__rankItems = null;
        }

        this.listContainer.removeChildren();
        this.scrollOffset = 0;
        this.listContainer.y = 0;

        const records = this.getRankData();
        const itemH = 52; // 更紧凑的项高度
        const listW = 320;
        const listH = 360;

        if (records.length === 0) {
            this.showEmptyState();
            this.maxScroll = 0;
            return;
        }

        // 用于追踪已创建的项，便于后续释放
        const items: Laya.Sprite[] = [];

        records.forEach((record, index) => {
            const item = this.createRankItem(record, index, listW, itemH);
            item.pos(0, index * itemH);
            item.alpha = 0;
            // 初始位置向下偏移，用于上滑动画
            item.y = index * itemH + 20;
            this.listContainer.addChild(item);
            items.push(item);

            // 依次淡入 + 上滑动画
            Laya.Tween.to(item, { alpha: 1, y: index * itemH }, 400, Laya.Ease.easeOut, null, index * 50);
        });

        const totalHeight = records.length * itemH;
        this.maxScroll = Math.max(0, totalHeight - listH);
        this.listContainer.height = totalHeight;

        // 存储-items到容器，便于销毁时释放回池
        (this.listContainer as any).__rankItems = items;
    }

    private createRankItem(data: RankRecord, index: number, w: number, h: number): Laya.Sprite {
        const itemData: RankItemData = {
            data: data,
            index: index,
            width: w,
            height: h
        };

        return this.rankItemPool.acquire(itemData);
    }

    private showEmptyState(): void {
        const emptyText = new Laya.Text();
        emptyText.text = "暂无记录\n快去挑战吧！";
        emptyText.font = "Microsoft YaHei";
        emptyText.fontSize = 16;
        emptyText.color = "rgba(255,255,255,0.4)";
        emptyText.leading = 10;
        emptyText.width = 320;
        emptyText.align = "center";
        emptyText.height = 360;
        emptyText.valign = "middle";
        this.listContainer.addChild(emptyText);
    }

    private createButtons(): void {
        const btnW = 130;
        const btnH = 44;
        const gap = 20;
        const panelW = 340;
        const startX = (panelW - (btnW * 2 + gap)) / 2;
        const btnY = 530; // 调整按钮位置

        // 再来一局按钮
        const primaryBtn = this.createButton("再来一局", btnW, btnH, true);
        primaryBtn.pos(startX, btnY);
        this.contentLayer.addChild(primaryBtn);
        primaryBtn.on(Event.CLICK, this, this.onRestart);

        // 返回主页按钮
        const secondaryBtn = this.createButton("返回主页", btnW, btnH, false);
        secondaryBtn.pos(startX + btnW + gap, btnY);
        this.contentLayer.addChild(secondaryBtn);
        secondaryBtn.on(Event.CLICK, this, this.goBackToMain);
    }

    private createButton(text: string, width: number, height: number, isPrimary: boolean): Laya.Sprite {
        const btn = new Laya.Sprite();
        btn.size(width, height);
        btn.mouseEnabled = true;

        const g = btn.graphics;
        g.clear();

        if (isPrimary) {
            // 主按钮 - 绿色背景 + 轻微阴影效果
            // 先画阴影
            g.drawRoundRect(2, 4, width, height, 12, "rgba(0,0,0,0.3)");
            // 再画按钮主体
            g.drawRoundRect(0, 0, width, height, 12, this.COLORS.btnPrimary, "rgba(255,255,255,0.2)", 1);
        } else {
            // 次要按钮 - 透明背景 + 明显边框
            g.drawRoundRect(0, 0, width, height, 12, "rgba(255,255,255,0.1)", "rgba(255,255,255,0.3)", 1);
        }

        const btnText = new Laya.Text();
        btnText.text = text;
        btnText.font = "Microsoft YaHei";
        btnText.fontSize = 14;
        btnText.bold = true;
        btnText.color = "#FFFFFF";
        btnText.width = width;
        btnText.height = height;
        btnText.align = "center";
        btnText.valign = "middle";
        btn.addChild(btnText);

        return btn;
    }

    // ==================== 交互逻辑 ====================

    private onRestart(): void {
        // 跳转到游戏场景
        this.goBackToMain();
    }

    private goBackToMain(): void {
        // 跳转回主页场景
        const mainScene = new Main();
        mainScene.name = "Main";
        Laya.stage.addChild(mainScene);
        this.destroy();
    }

    // ==================== 动画 ====================

    private playEnterAnimation(): void {
        this.bgLayer.alpha = 0;
        this.panelContainer.scale(0.9, 0.9);
        this.panelContainer.alpha = 0;

        Laya.Tween.to(this.bgLayer, { alpha: 1 }, 200);
        Laya.Tween.to(this.panelContainer, { scaleX: 1, scaleY: 1, alpha: 1 }, 250, Laya.Ease.backOut);
    }

    private playExitAnimation(callback: () => void): void {
        Laya.Tween.to(this.bgLayer, { alpha: 0 }, 150);
        Laya.Tween.to(this.panelContainer, { scaleX: 0.9, scaleY: 0.9, alpha: 0 }, 150, Laya.Ease.backIn, Laya.Handler.create(null, callback));
    }

    // ==================== 数据管理 ====================

    /**
     * 获取存储 Key
     */
    private getStorageKey(): string {
        return `focus_planet_${this.currentGameType}_leaderboard`;
    }

    private getRankData(): RankRecord[] {
        // 从本地存储获取数据
        const storageKey = `${this.getStorageKey()}_${this.currentTab}`;
        let records: RankRecord[] = [];

        try {
            const data = Laya.LocalStorage.getItem(storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                records = parsed.map((r: any, i: number) => {
                    if (this.currentGameType === "schulte") {
                        return {
                            rank: i + 1,
                            name: r.name || "匿名玩家",
                            time: this.formatTime(r.timeMs || r.time),
                            score: this.calculateSchulteScore(r.timeMs || r.time, r.errors),
                            timeMs: r.timeMs || r.time,
                            errors: r.errors,
                            level: 0,
                            date: r.date
                        };
                    } else {
                        // 记忆闪现
                        return {
                            rank: i + 1,
                            name: r.name || "匿名玩家",
                            time: `关卡 ${r.level || 1}`,
                            score: r.score || 0,
                            timeMs: 0,
                            errors: 0,
                            level: r.level || 1,
                            date: r.date
                        };
                    }
                });
            }
        } catch (e) {
            console.warn("读取排行榜数据失败", e);
        }

        // 如果没有数据，显示模拟数据
        if (records.length === 0) {
            return this.getMockData();
        }

        return records;
    }

    private getMockData(): RankRecord[] {
        if (this.currentGameType === "schulte") {
            const mockData = [
                { rank: 1, name: "星际探险家", time: "00:45.320", score: 98, timeMs: 45320, errors: 0, level: 0, date: Date.now() },
                { rank: 2, name: "宇宙旅行者", time: "01:02.150", score: 92, timeMs: 62150, errors: 1, level: 0, date: Date.now() },
                { rank: 3, name: "银河漫游", time: "01:15.890", score: 88, timeMs: 75890, errors: 2, level: 0, date: Date.now() },
                { rank: 4, name: "玩家小明", time: "01:23.400", score: 85, timeMs: 83400, errors: 1, level: 0, date: Date.now() },
                { rank: 5, name: "快乐玩家", time: "01:30.200", score: 82, timeMs: 90200, errors: 3, level: 0, date: Date.now() }
            ];
            return mockData;
        } else {
            // 记忆闪现模拟数据
            const mockData = [
                { rank: 1, name: "记忆大师", time: "关卡 8", score: 2580, timeMs: 0, errors: 0, level: 8, date: Date.now() },
                { rank: 2, name: "闪现高手", time: "关卡 6", score: 1890, timeMs: 0, errors: 0, level: 6, date: Date.now() },
                { rank: 3, name: "脑力达人", time: "关卡 5", score: 1520, timeMs: 0, errors: 0, level: 5, date: Date.now() },
                { rank: 4, name: "新手玩家", time: "关卡 3", score: 890, timeMs: 0, errors: 0, level: 3, date: Date.now() },
                { rank: 5, name: "挑战者", time: "关卡 2", score: 450, timeMs: 0, errors: 0, level: 2, date: Date.now() }
            ];
            return mockData;
        }
    }

    /**
     * 添加一条舒尔特方格排行榜记录
     */
    public static addSchulteRecord(timeMs: number, errors: number, name: string = "匿名玩家"): void {
        const STORAGE_KEY = "focus_planet_schulte_leaderboard";
        const record = { timeMs, errors, name, date: Date.now() };

        // 总榜
        const totalRecords = LeaderboardPanel.loadRecords(STORAGE_KEY, 0);
        totalRecords.push(record);
        totalRecords.sort((a, b) => {
            if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
            return a.errors - b.errors;
        });
        LeaderboardPanel.saveRecords(STORAGE_KEY, 0, totalRecords.slice(0, 50));

        // 周榜 - 只保留最近7天
        const weekRecords = LeaderboardPanel.loadRecords(STORAGE_KEY, 1);
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const filteredWeek = weekRecords.filter(r => r.date > weekAgo);
        filteredWeek.push(record);
        filteredWeek.sort((a, b) => {
            if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
            return a.errors - b.errors;
        });
        LeaderboardPanel.saveRecords(STORAGE_KEY, 1, filteredWeek.slice(0, 50));

        // 月榜 - 只保留最近30天
        const monthRecords = LeaderboardPanel.loadRecords(STORAGE_KEY, 2);
        const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const filteredMonth = monthRecords.filter(r => r.date > monthAgo);
        filteredMonth.push(record);
        filteredMonth.sort((a, b) => {
            if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
            return a.errors - b.errors;
        });
        LeaderboardPanel.saveRecords(STORAGE_KEY, 2, filteredMonth.slice(0, 50));
    }

    /**
     * 添加一条记忆闪现排行榜记录
     */
    public static addMemoryRecord(score: number, level: number, name: string = "匿名玩家"): void {
        const STORAGE_KEY = "focus_planet_memory_leaderboard";
        const record = { score, level, name, date: Date.now() };

        // 总榜 - 按分数降序，分数相同按关卡降序
        const totalRecords = LeaderboardPanel.loadMemoryRecords(STORAGE_KEY, 0);
        totalRecords.push(record);
        totalRecords.sort((a, b) => {
            if (a.score !== b.score) return b.score - a.score;
            return b.level - a.level;
        });
        LeaderboardPanel.saveMemoryRecords(STORAGE_KEY, 0, totalRecords.slice(0, 50));

        // 周榜
        const weekRecords = LeaderboardPanel.loadMemoryRecords(STORAGE_KEY, 1);
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const filteredWeek = weekRecords.filter(r => r.date > weekAgo);
        filteredWeek.push(record);
        filteredWeek.sort((a, b) => {
            if (a.score !== b.score) return b.score - a.score;
            return b.level - a.level;
        });
        LeaderboardPanel.saveMemoryRecords(STORAGE_KEY, 1, filteredWeek.slice(0, 50));

        // 月榜
        const monthRecords = LeaderboardPanel.loadMemoryRecords(STORAGE_KEY, 2);
        const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const filteredMonth = monthRecords.filter(r => r.date > monthAgo);
        filteredMonth.push(record);
        filteredMonth.sort((a, b) => {
            if (a.score !== b.score) return b.score - a.score;
            return b.level - a.level;
        });
        LeaderboardPanel.saveMemoryRecords(STORAGE_KEY, 2, filteredMonth.slice(0, 50));
    }

    /**
     * 通用添加记录方法（向后兼容）
     * @deprecated 请使用 addSchulteRecord 或 addMemoryRecord
     */
    public static addRecord(timeMs: number, errors: number, name: string = "匿名玩家"): void {
        LeaderboardPanel.addSchulteRecord(timeMs, errors, name);
    }

    private static loadRecords(storageKey: string, tab: number): SchulteRecord[] {
        try {
            const data = Laya.LocalStorage.getItem(`${storageKey}_${tab}`);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn("读取排行榜数据失败", e);
        }
        return [];
    }

    private static loadMemoryRecords(storageKey: string, tab: number): MemoryRecord[] {
        try {
            const data = Laya.LocalStorage.getItem(`${storageKey}_${tab}`);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn("读取排行榜数据失败", e);
        }
        return [];
    }

    private static saveRecords(storageKey: string, tab: number, records: SchulteRecord[]): void {
        try {
            Laya.LocalStorage.setItem(`${storageKey}_${tab}`, JSON.stringify(records));
        } catch (e) {
            console.warn("保存排行榜数据失败", e);
        }
    }

    private static saveMemoryRecords(storageKey: string, tab: number, records: MemoryRecord[]): void {
        try {
            Laya.LocalStorage.setItem(`${storageKey}_${tab}`, JSON.stringify(records));
        } catch (e) {
            console.warn("保存排行榜数据失败", e);
        }
    }

    private calculateSchulteScore(timeMs: number, errors: number): number {
        // 基础分100，时间越短分数越高，错误扣分
        const baseScore = 100;
        const timeDeduction = Math.floor(timeMs / 1000); // 每秒扣1分
        const errorDeduction = errors * 3; // 每次错误扣3分
        return Math.max(0, baseScore - timeDeduction - errorDeduction);
    }

    private formatTime(ms: number): string {
        const totalSec = Math.floor(ms / 1000);
        const mm = Math.floor(totalSec / 60);
        const ss = totalSec % 60;
        const msPart = Math.floor((ms % 1000) / 10);

        if (mm > 0) {
            return `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}.${msPart.toString().padStart(2, "0")}`;
        }
        return `00:${ss.toString().padStart(2, "0")}.${msPart.toString().padStart(2, "0")}`;
    }

    public destroy(): void {
        Laya.stage.off(Event.RESIZE, this, this.onResize);

        Laya.Tween.clearAll(this.bgLayer);
        Laya.Tween.clearAll(this.panelContainer);
        Laya.Tween.clearAll(this.listContainer);

        // 清除滚动事件
        if (this.listMask) {
            this.listMask.off(Event.MOUSE_DOWN, this, this.onScrollStart);
            this.listMask.off(Event.MOUSE_MOVE, this, this.onScrollMove);
            this.listMask.off(Event.MOUSE_UP, this, this.onScrollEnd);
            this.listMask.off(Event.MOUSE_OUT, this, this.onScrollEnd);
        }

        // 释放列表项回池
        const items = (this.listContainer as any).__rankItems as Laya.Sprite[];
        if (items && items.length > 0) {
            this.rankItemPool.releaseAll(items);
            (this.listContainer as any).__rankItems = null;
        }

        // 清空池
        this.rankItemPool.clear();

        super.destroy();
    }
}