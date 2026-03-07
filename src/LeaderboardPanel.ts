/**
 * 排行榜页面 - Focus Planet
 * 风格：深空主题，金银铜前三名高亮
 */

const { Event } = Laya;

import { Main } from "./Main";

interface RankRecord {
    rank: number;
    name: string;
    time: string;
    score: number;
    timeMs: number;
    errors: number;
    date: number;
}

export class LeaderboardPanel extends Laya.Scene {
    private readonly BASE_W: number = 375;
    private readonly BASE_H: number = 750;

    private readonly COLORS = {
        bg: "rgba(26,26,46,0.95)",
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

    private readonly STORAGE_KEY = "focus_planet_leaderboard";

    private root: Laya.Sprite = null;
    private stageBg: Laya.Sprite = null;
    private bgLayer: Laya.Sprite = null;
    private panelContainer: Laya.Sprite = null;
    private contentLayer: Laya.Sprite = null;
    private tabContainer: Laya.Sprite = null;
    private listContainer: Laya.Sprite = null;
    private listMask: Laya.Sprite = null;

    private currentTab: number = 0; // 0:总榜, 1:周榜, 2:月榜
    private tabBtns: Laya.Sprite[] = [];

    constructor() {
        super();
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

    private refreshStageBg(): void {
        if (!this.stageBg) return;
        const sw = Math.max(1, Laya.stage.width);
        const sh = Math.max(1, Laya.stage.height);

        this.stageBg.graphics.clear();
        this.stageBg.graphics.drawRect(0, 0, sw, sh, "#1A1A2E");
    }

    private onResize(): void {
        const sw = Math.max(320, Laya.stage.width);
        const sh = Math.max(568, Laya.stage.height);
        this.size(sw, sh);

        this.applyLayoutScale();
        this.refreshStageBg();
    }

    private initPanel(): void {
        // 面板参数
        const panelW = 340;
        const panelH = 580;
        const panelX = (this.BASE_W - panelW) * 0.5;
        const panelY = 50;

        // 半透明遮罩背景
        this.bgLayer = new Laya.Sprite();
        this.bgLayer.graphics.drawRect(0, 0, this.BASE_W, this.BASE_H, "rgba(0,0,0,0.6)");
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
        this.createTabs();
        this.createScrollList();
        this.createButtons();

        // 入场动画
        this.playEnterAnimation();
    }

    private createPanelBackground(panelW: number, panelH: number): void {
        // 面板阴影 - 在面板下方
        const shadow = new Laya.Sprite();
        shadow.graphics.drawRoundRect(6, 6, panelW, panelH, 24, "rgba(0,0,0,0.4)");
        this.panelContainer.addChild(shadow);

        // 面板主体 - 圆角矩形背景
        const panelBg = new Laya.Sprite();
        panelBg.size(panelW, panelH);
        const g = panelBg.graphics;
        this.drawRoundRect(g, 0, 0, panelW, panelH, 24, this.COLORS.panelBg);
        this.panelContainer.addChild(panelBg);

        // 装饰性边角
        this.drawPanelCorners(panelBg, panelW, panelH);
    }

    private drawRoundRect(g: Laya.Graphics, x: number, y: number, w: number, h: number, r: number, color: string): void {
        // 简化的圆角矩形
        g.drawRect(x + r, y, w - 2 * r, h, color);
        g.drawRect(x, y + r, w, h - 2 * r, color);
        g.drawCircle(x + r, y + r, r, color);
        g.drawCircle(x + w - r, y + r, r, color);
        g.drawCircle(x + r, y + h - r, r, color);
        g.drawCircle(x + w - r, y + h - r, r, color);
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
        logoText.pos(0, 16);
        this.contentLayer.addChild(logoText);

        // 主标题
        const titleText = new Laya.Text();
        titleText.text = "排 行 榜";
        titleText.font = "Microsoft YaHei";
        titleText.fontSize = 26;
        titleText.bold = true;
        titleText.color = this.COLORS.title;
        titleText.stroke = 2;
        titleText.strokeColor = "rgba(255,165,0,0.3)";
        titleText.width = panelW;
        titleText.align = "center";
        titleText.pos(0, 34);
        this.contentLayer.addChild(titleText);
    }

    private createTabs(): void {
        const tabs = ["总榜", "周榜", "月榜"];
        const tabWidth = 70;
        const tabHeight = 32;
        const gap = 12;
        const panelW = 340;
        const startX = (panelW - (tabs.length * tabWidth + (tabs.length - 1) * gap)) / 2;
        const tabY = 80;

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
            // 激活状态 - 金色渐变背景
            g.drawRoundRect(0, 0, tab.width, tab.height, 16, "rgba(255,215,0,0.15)");
            // 边框
            g.drawLine(0, tab.height - 1, tab.width, tab.height - 1, "rgba(255,215,0,0.4)", 2);
        } else {
            g.drawRoundRect(0, 0, tab.width, tab.height, 16, "rgba(255,255,255,0.05)");
        }
    }

    private onTabClick(index: number): void {
        if (this.currentTab === index) return;

        this.currentTab = index;

        // 更新Tab样式
        this.tabBtns.forEach((tab, i) => {
            this.updateTabStyle(tab, i === index);
            const text = tab.getChildByName("label") as Laya.Text;
            if (text) {
                text.color = i === index ? this.COLORS.title : this.COLORS.textMuted;
                text.bold = i === index;
            }
        });

        // 重新渲染列表
        this.refreshList();
    }

    private createScrollList(): void {
        const listW = 320;
        const listH = 370;
        const panelW = 340;
        const listX = (panelW - listW) * 0.5;
        const listY = 125;

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
        this.listContainer.removeChildren();
        this.scrollOffset = 0;
        this.listContainer.y = 0;

        const records = this.getRankData();
        const itemH = 58;
        const listW = 320;
        const listH = 370;

        if (records.length === 0) {
            this.showEmptyState();
            this.maxScroll = 0;
            return;
        }

        records.forEach((record, index) => {
            const item = this.createRankItem(record, index, listW, itemH);
            item.pos(0, index * itemH);
            item.alpha = 0;
            this.listContainer.addChild(item);

            // 依次淡入动画
            Laya.Tween.to(item, { alpha: 1 }, 300, null, null, index * 80);
        });

        const totalHeight = records.length * itemH;
        this.maxScroll = Math.max(0, totalHeight - listH);
        this.listContainer.height = totalHeight;
    }

    private createRankItem(data: RankRecord, index: number, w: number, h: number): Laya.Sprite {
        const item = new Laya.Sprite();
        item.size(w, h);

        const isTop3 = data.rank <= 3;
        const rankType = data.rank === 1 ? "gold" : data.rank === 2 ? "silver" : data.rank === 3 ? "bronze" : "normal";

        // 绘制背景
        const g = item.graphics;
        g.clear();

        if (isTop3) {
            const bgColor = rankType === "gold"
                ? "rgba(255,215,0,0.12)"
                : rankType === "silver"
                    ? "rgba(192,192,192,0.12)"
                    : "rgba(205,127,50,0.12)";
            this.drawRoundRect(g, 0, 0, w, h, 12, bgColor);

            // 发光边框效果
            const borderColor = rankType === "gold"
                ? "rgba(255,215,0,0.3)"
                : rankType === "silver"
                    ? "rgba(192,192,192,0.3)"
                    : "rgba(205,127,50,0.3)";
            g.drawLine(0, 0, w, 0, borderColor, 1);
            g.drawLine(0, h - 1, w, h - 1, borderColor, 1);
        } else {
            this.drawRoundRect(g, 0, 0, w, h, 12, "rgba(255,255,255,0.03)");
        }

        // 排名徽章
        const badgeSize = isTop3 ? 32 : 26;
        const badgeX = 12;
        const badgeY = (h - badgeSize) / 2;

        if (isTop3) {
            const badgeColor = rankType === "gold"
                ? this.COLORS.gold
                : rankType === "silver"
                    ? this.COLORS.silver
                    : this.COLORS.bronze;

            // 徽章背景 - 圆形
            g.drawCircle(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, badgeColor);

            // 排名数字
            const rankNum = new Laya.Text();
            rankNum.text = String(data.rank);
            rankNum.font = "Microsoft YaHei";
            rankNum.fontSize = 14;
            rankNum.bold = true;
            rankNum.color = "#FFFFFF";
            rankNum.width = badgeSize;
            rankNum.height = badgeSize;
            rankNum.align = "center";
            rankNum.valign = "middle";
            rankNum.pos(badgeX, badgeY);
            item.addChild(rankNum);
        } else {
            // 普通排名 - 圆形灰底
            g.drawCircle(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, "rgba(255,255,255,0.1)");

            const rankNum = new Laya.Text();
            rankNum.text = String(data.rank);
            rankNum.font = "Microsoft YaHei";
            rankNum.fontSize = 12;
            rankNum.color = this.COLORS.textMuted;
            rankNum.width = badgeSize;
            rankNum.height = badgeSize;
            rankNum.align = "center";
            rankNum.valign = "middle";
            rankNum.pos(badgeX, badgeY);
            item.addChild(rankNum);
        }

        // 玩家名称
        const nameText = new Laya.Text();
        nameText.text = data.name;
        nameText.font = "Microsoft YaHei";
        nameText.fontSize = isTop3 ? 15 : 13;
        nameText.bold = isTop3;
        nameText.color = isTop3 ? this.COLORS[rankType as keyof typeof this.COLORS] || this.COLORS.normal : this.COLORS.normal;
        nameText.pos(54, isTop3 ? 10 : 8);
        item.addChild(nameText);

        // 时间和分数
        const statsY = isTop3 ? 28 : 26;

        const timeText = new Laya.Text();
        timeText.text = "⏱ " + data.time;
        timeText.font = "Microsoft YaHei";
        timeText.fontSize = 11;
        timeText.color = this.COLORS.accent;
        timeText.pos(54, statsY);
        item.addChild(timeText);

        const scoreText = new Laya.Text();
        scoreText.text = "⭐ " + data.score + "分";
        scoreText.font = "Microsoft YaHei";
        scoreText.fontSize = 11;
        scoreText.color = this.COLORS.textMuted;
        scoreText.pos(150, statsY);
        item.addChild(scoreText);

        return item;
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
        emptyText.height = 370;
        emptyText.valign = "middle";
        this.listContainer.addChild(emptyText);
    }

    private createButtons(): void {
        const btnW = 130;
        const btnH = 44;
        const gap = 20;
        const panelW = 340;
        const startX = (panelW - (btnW * 2 + gap)) / 2;
        const btnY = 520;

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
            // 绿色按钮
            this.drawRoundRect(g, 0, 0, width, height, 12, this.COLORS.btnPrimary);
        } else {
            // 灰色边框按钮
            this.drawRoundRect(g, 0, 0, width, height, 12, this.COLORS.btnSecondary);
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

    private getRankData(): RankRecord[] {
        // 从本地存储获取数据
        const storageKey = `${this.STORAGE_KEY}_${this.currentTab}`;
        let records: RankRecord[] = [];

        try {
            const data = Laya.LocalStorage.getItem(storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                records = parsed.map((r: any, i: number) => ({
                    rank: i + 1,
                    name: r.name || "匿名玩家",
                    time: this.formatTime(r.timeMs || r.time),
                    score: this.calculateScore(r.timeMs || r.time, r.errors),
                    timeMs: r.timeMs || r.time,
                    errors: r.errors,
                    date: r.date
                }));
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
        const mockData = [
            { rank: 1, name: "星际探险家", time: "00:45.320", score: 98 },
            { rank: 2, name: "宇宙旅行者", time: "01:02.150", score: 92 },
            { rank: 3, name: "银河漫游", time: "01:15.890", score: 88 },
            { rank: 4, name: "玩家小明", time: "01:23.400", score: 85 },
            { rank: 5, name: "快乐玩家", time: "01:30.200", score: 82 },
            { rank: 6, name: "游戏达人", time: "01:45.600", score: 78 },
            { rank: 7, name: "新手玩家", time: "02:10.300", score: 72 }
        ];

        return mockData;
    }

    /**
     * 添加一条排行榜记录
     */
    public static addRecord(timeMs: number, errors: number, name: string = "匿名玩家"): void {
        const STORAGE_KEY = "focus_planet_leaderboard";

        // 总榜
        const totalRecords = LeaderboardPanel.loadRecords(STORAGE_KEY, 0);
        totalRecords.push({ timeMs, errors, name, date: Date.now() });
        totalRecords.sort((a, b) => {
            if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
            return a.errors - b.errors;
        });
        LeaderboardPanel.saveRecords(STORAGE_KEY, 0, totalRecords.slice(0, 50));

        // 周榜 - 只保留最近7天
        const weekRecords = LeaderboardPanel.loadRecords(STORAGE_KEY, 1);
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const filteredWeek = weekRecords.filter(r => r.date > weekAgo);
        filteredWeek.push({ timeMs, errors, name, date: Date.now() });
        filteredWeek.sort((a, b) => {
            if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
            return a.errors - b.errors;
        });
        LeaderboardPanel.saveRecords(STORAGE_KEY, 1, filteredWeek.slice(0, 50));

        // 月榜 - 只保留最近30天
        const monthRecords = LeaderboardPanel.loadRecords(STORAGE_KEY, 2);
        const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const filteredMonth = monthRecords.filter(r => r.date > monthAgo);
        filteredMonth.push({ timeMs, errors, name, date: Date.now() });
        filteredMonth.sort((a, b) => {
            if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
            return a.errors - b.errors;
        });
        LeaderboardPanel.saveRecords(STORAGE_KEY, 2, filteredMonth.slice(0, 50));
    }

    private static loadRecords(storageKey: string, tab: number): any[] {
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

    private static saveRecords(storageKey: string, tab: number, records: any[]): void {
        try {
            Laya.LocalStorage.setItem(`${storageKey}_${tab}`, JSON.stringify(records));
        } catch (e) {
            console.warn("保存排行榜数据失败", e);
        }
    }

    private calculateScore(timeMs: number, errors: number): number {
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

        super.destroy();
    }
}