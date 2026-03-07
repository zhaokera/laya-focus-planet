/**
 * 排行榜页面 - 舒尔特方格
 * 风格：深色太空主题，紫色/金色配色
 */

export class LeaderboardPanel extends Laya.Sprite {
    private readonly BASE_W: number = 375;
    private readonly BASE_H: number = 750;

    private readonly ASSET = {
        bgFull: "ui/game_design/bg_full.png",
        panel: "ui/game_design/popup_panel.png",
        btnNormal: "ui/game_design/diff_btn_normal.png",
        btnActive: "ui/game_design/diff_btn_active.png",
        closeBtn: "ui/game_design/popup_btn.png",
        cellNormal: "ui/game_design/cell_normal.png",
        cellCorrect: "ui/game_design/cell_correct.png"
    };

    // 数据存储key
    private readonly STORAGE_KEY = "schulte_leaderboard";

    private root: Laya.Sprite = null;
    private bgLayer: Laya.Sprite = null;
    private contentLayer: Laya.Sprite = null;

    private titleText: Laya.Text = null;
    private tabContainer: Laya.Sprite = null;
    private listContainer: Laya.Sprite = null;
    private scrollPanel: Laya.Panel = null;

    private currentTab: number = 4; // 3, 4, 5 对应难度
    private tabBtns: Record<number, Laya.Sprite> = {};

    private onCloseCallback: (() => void) | null = null;

    constructor() {
        super();
        this.initPanel();
    }

    private initPanel(): void {
        this.size(this.BASE_W, this.BASE_H);

        // 半透明遮罩背景
        this.bgLayer = new Laya.Sprite();
        this.bgLayer.graphics.drawRect(0, 0, this.BASE_W, this.BASE_H, "rgba(0,0,0,0.75)");
        this.bgLayer.alpha = 0;
        this.addChild(this.bgLayer);

        // 内容层
        this.contentLayer = new Laya.Sprite();
        this.addChild(this.contentLayer);

        this.createMainPanel();
        this.createTitle();
        this.createTabs();
        this.createListHeader();
        this.createScrollList();
        this.createCloseButton();

        // 入场动画
        this.playEnterAnimation();
    }

    private createMainPanel(): void {
        // 主面板背景
        const panelW = 340;
        const panelH = 580;
        const panelX = (this.BASE_W - panelW) * 0.5;
        const panelY = 60;

        // 面板阴影
        const shadow = new Laya.Sprite();
        shadow.graphics.drawRoundRect(panelX + 4, panelY + 4, panelW, panelH, 20, "rgba(0,0,0,0.5)");
        this.contentLayer.addChild(shadow);

        // 面板主体
        const panel = new Laya.Sprite();
        panel.size(panelW, panelH);
        panel.pos(panelX, panelY);
        this.loadImageWithFallback(panel, this.ASSET.panel, panelW, panelH);
        this.contentLayer.addChild(panel);

        // 装饰性边角
        this.drawPanelCorners(panel, panelW, panelH);
    }

    private drawPanelCorners(panel: Laya.Sprite, w: number, h: number): void {
        const color = "rgba(139,92,246,0.7)";
        const lineW = 2;
        const seg = 16;
        const m = 12;

        // 左上角
        const lt = new Laya.Sprite();
        lt.graphics.drawLine(0, seg, 0, 0, color, lineW);
        lt.graphics.drawLine(0, 0, seg, 0, color, lineW);
        lt.pos(m, m);
        panel.addChild(lt);

        // 右上角
        const rt = new Laya.Sprite();
        rt.graphics.drawLine(0, 0, seg, 0, color, lineW);
        rt.graphics.drawLine(seg, 0, seg, seg, color, lineW);
        rt.pos(w - m - seg, m);
        panel.addChild(rt);

        // 左下角
        const lb = new Laya.Sprite();
        lb.graphics.drawLine(0, 0, 0, seg, color, lineW);
        lb.graphics.drawLine(0, seg, seg, seg, color, lineW);
        lb.pos(m, h - m - seg);
        panel.addChild(lb);

        // 右下角
        const rb = new Laya.Sprite();
        rb.graphics.drawLine(seg, 0, seg, seg, color, lineW);
        rb.graphics.drawLine(0, seg, seg, seg, color, lineW);
        rb.pos(w - m - seg, h - m - seg);
        panel.addChild(rb);
    }

    private createTitle(): void {
        this.titleText = new Laya.Text();
        this.titleText.text = "🏆 排行榜";
        this.titleText.font = "Microsoft YaHei";
        this.titleText.fontSize = 28;
        this.titleText.bold = true;
        this.titleText.color = "#FFD700";
        this.titleText.stroke = 2;
        this.titleText.strokeColor = "rgba(0,0,0,0.5)";
        this.titleText.width = this.BASE_W;
        this.titleText.align = "center";
        this.titleText.pos(0, 80);
        this.contentLayer.addChild(this.titleText);
    }

    private createTabs(): void {
        const sizes = [3, 4, 5];
        const btnW = 70;
        const btnH = 36;
        const gap = 20;
        const total = sizes.length * btnW + (sizes.length - 1) * gap;
        let x = (this.BASE_W - total) * 0.5;

        this.tabContainer = new Laya.Sprite();
        this.tabContainer.pos(0, 125);
        this.contentLayer.addChild(this.tabContainer);

        sizes.forEach((size) => {
            const btn = new Laya.Sprite();
            btn.size(btnW, btnH);
            btn.pos(x, 0);
            btn.mouseEnabled = true;

            // 按钮背景
            const bg = new Laya.Sprite();
            bg.name = "bg";
            bg.size(btnW, btnH);
            this.loadImageWithFallback(bg, size === this.currentTab ? this.ASSET.btnActive : this.ASSET.btnNormal, btnW, btnH);
            btn.addChild(bg);

            // 按钮文字
            const text = new Laya.Text();
            text.text = `${size}×${size}`;
            text.font = "Microsoft YaHei";
            text.fontSize = 14;
            text.bold = true;
            text.color = size === this.currentTab ? "#FFD700" : "#FFFFFF";
            text.width = btnW;
            text.height = btnH;
            text.align = "center";
            text.valign = "middle";
            btn.addChild(text);

            btn.on(Laya.Event.CLICK, this, () => this.onTabClick(size));

            this.tabBtns[size] = btn;
            this.tabContainer.addChild(btn);
            x += btnW + gap;
        });
    }

    private createListHeader(): void {
        const headerY = 175;
        const headerH = 32;
        const panelX = (this.BASE_W - 340) * 0.5;

        // 表头背景
        const headerBg = new Laya.Sprite();
        headerBg.graphics.drawRoundRect(panelX, headerY, 340, headerH, 0, "rgba(99,102,241,0.25)");
        this.contentLayer.addChild(headerBg);

        // 表头文字
        const columns = [
            { text: "排名", x: panelX + 30, w: 50 },
            { text: "用时", x: panelX + 100, w: 80 },
            { text: "错误", x: panelX + 190, w: 60 },
            { text: "日期", x: panelX + 260, w: 70 }
        ];

        columns.forEach((col) => {
            const text = new Laya.Text();
            text.text = col.text;
            text.font = "Microsoft YaHei";
            text.fontSize = 13;
            text.bold = true;
            text.color = "#A5B4FC";
            text.width = col.w;
            text.align = "center";
            text.pos(col.x, headerY + 8);
            this.contentLayer.addChild(text);
        });
    }

    private createScrollList(): void {
        const panelX = (this.BASE_W - 340) * 0.5;
        const listY = 210;
        const listW = 340;
        const listH = 360;

        // 滚动面板
        this.scrollPanel = new Laya.Panel();
        this.scrollPanel.size(listW, listH);
        this.scrollPanel.pos(panelX, listY);
        this.scrollPanel.vScrollBarSkin = "";
        this.scrollPanel.elasticEnabled = true;
        this.contentLayer.addChild(this.scrollPanel);

        this.listContainer = new Laya.Sprite();
        this.listContainer.size(listW, listH);
        this.scrollPanel.addChild(this.listContainer);

        this.refreshList();
    }

    private refreshList(): void {
        this.listContainer.removeChildren();

        const records = this.getRecords(this.currentTab);
        const itemH = 56;
        const listW = 340;

        if (records.length === 0) {
            this.showEmptyState();
            return;
        }

        records.forEach((record, index) => {
            const item = this.createListItem(record, index, listW, itemH);
            item.pos(0, index * itemH);
            this.listContainer.addChild(item);
        });

        this.listContainer.height = Math.max(records.length * itemH, 360);
    }

    private createListItem(record: LeaderboardRecord, index: number, w: number, h: number): Laya.Sprite {
        const item = new Laya.Sprite();
        item.size(w, h);

        // 背景色交替
        if (index % 2 === 0) {
            item.graphics.drawRect(0, 0, w, h, "rgba(255,255,255,0.03)");
        }

        // 分隔线
        const line = new Laya.Sprite();
        line.graphics.drawLine(20, h - 1, w - 20, h - 1, "rgba(255,255,255,0.08)", 1);
        item.addChild(line);

        // 排名
        const rankText = new Laya.Text();
        rankText.text = this.getRankDisplay(index);
        rankText.font = "Microsoft YaHei";
        rankText.fontSize = index < 3 ? 18 : 14;
        rankText.bold = index < 3;
        rankText.color = this.getRankColor(index);
        rankText.width = 50;
        rankText.height = h;
        rankText.align = "center";
        rankText.valign = "middle";
        rankText.pos(10, 0);
        item.addChild(rankText);

        // 用时
        const timeText = new Laya.Text();
        timeText.text = this.formatTime(record.time);
        timeText.font = "Microsoft YaHei";
        timeText.fontSize = 16;
        timeText.bold = true;
        timeText.color = "#4FC3F7";
        timeText.width = 80;
        timeText.height = h;
        timeText.align = "center";
        timeText.valign = "middle";
        timeText.pos(70, 0);
        item.addChild(timeText);

        // 错误次数
        const errorText = new Laya.Text();
        errorText.text = `${record.errors}次`;
        errorText.font = "Microsoft YaHei";
        errorText.fontSize = 14;
        errorText.color = record.errors === 0 ? "#4ADE80" : (record.errors <= 2 ? "#FBBF24" : "#F87171");
        errorText.width = 60;
        errorText.height = h;
        errorText.align = "center";
        errorText.valign = "middle";
        errorText.pos(160, 0);
        item.addChild(errorText);

        // 日期
        const dateText = new Laya.Text();
        dateText.text = this.formatDate(record.date);
        dateText.font = "Microsoft YaHei";
        dateText.fontSize = 12;
        dateText.color = "rgba(255,255,255,0.5)";
        dateText.width = 70;
        dateText.height = h;
        dateText.align = "center";
        dateText.valign = "middle";
        dateText.pos(235, 0);
        item.addChild(dateText);

        return item;
    }

    private showEmptyState(): void {
        const emptyText = new Laya.Text();
        emptyText.text = "暂无记录\n快去挑战吧！";
        emptyText.font = "Microsoft YaHei";
        emptyText.fontSize = 16;
        emptyText.color = "rgba(255,255,255,0.4)";
        emptyText.leading = 10;
        emptyText.width = 340;
        emptyText.align = "center";
        emptyText.height = 360;
        emptyText.valign = "middle";
        this.listContainer.addChild(emptyText);
    }

    private createCloseButton(): void {
        const btnW = 140;
        const btnH = 44;
        const btnX = (this.BASE_W - btnW) * 0.5;
        const btnY = 580;

        const btn = new Laya.Sprite();
        btn.size(btnW, btnH);
        btn.pos(btnX, btnY);
        btn.mouseEnabled = true;

        // 按钮背景
        this.loadImageWithFallback(btn, this.ASSET.closeBtn, btnW, btnH);
        this.contentLayer.addChild(btn);

        // 按钮文字
        const text = new Laya.Text();
        text.text = "关闭";
        text.font = "Microsoft YaHei";
        text.fontSize = 16;
        text.bold = true;
        text.color = "#FFFFFF";
        text.width = btnW;
        text.height = btnH;
        text.align = "center";
        text.valign = "middle";
        btn.addChild(text);

        btn.on(Laya.Event.CLICK, this, this.close);
    }

    // ==================== 交互逻辑 ====================

    private onTabClick(size: number): void {
        if (size === this.currentTab) return;

        this.currentTab = size;

        // 更新tab样式
        Object.keys(this.tabBtns).forEach((k) => {
            const key = Number(k);
            const btn = this.tabBtns[key];
            const bg = btn.getChildByName("bg") as Laya.Sprite;
            if (bg) {
                this.loadImageWithFallback(bg, key === size ? this.ASSET.btnActive : this.ASSET.btnNormal, bg.width, bg.height);
            }
            // 更新文字颜色
            btn.children.forEach((child) => {
                if (child instanceof Laya.Text) {
                    child.color = key === size ? "#FFD700" : "#FFFFFF";
                }
            });
        });

        this.refreshList();
    }

    public setOnClose(callback: () => void): void {
        this.onCloseCallback = callback;
    }

    public close(): void {
        this.playExitAnimation(() => {
            if (this.onCloseCallback) {
                this.onCloseCallback();
            }
            this.destroy();
        });
    }

    // ==================== 动画 ====================

    private playEnterAnimation(): void {
        this.bgLayer.alpha = 0;
        this.contentLayer.scale(0.8, 0.8);
        this.contentLayer.alpha = 0;

        Laya.Tween.to(this.bgLayer, { alpha: 1 }, 200);
        Laya.Tween.to(this.contentLayer, { scaleX: 1, scaleY: 1, alpha: 1 }, 250, Laya.Ease.backOut);
    }

    private playExitAnimation(callback: () => void): void {
        Laya.Tween.to(this.bgLayer, { alpha: 0 }, 150);
        Laya.Tween.to(this.contentLayer, { scaleX: 0.8, scaleY: 0.8, alpha: 0 }, 150, Laya.Ease.backIn, Laya.Handler.create(null, callback));
    }

    // ==================== 数据存储 ====================

    public addRecord(size: number, time: number, errors: number): void {
        const records = this.getRecords(size);
        records.push({
            time,
            errors,
            date: Date.now()
        });

        // 按用时排序，用时相同按错误次数排序
        records.sort((a, b) => {
            if (a.time !== b.time) return a.time - b.time;
            return a.errors - b.errors;
        });

        // 只保留前50条
        const topRecords = records.slice(0, 50);

        this.saveRecords(size, topRecords);
    }

    private getRecords(size: number): LeaderboardRecord[] {
        try {
            const data = Laya.LocalStorage.getItem(`${this.STORAGE_KEY}_${size}`);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn("读取排行榜数据失败", e);
        }
        return [];
    }

    private saveRecords(size: number, records: LeaderboardRecord[]): void {
        try {
            Laya.LocalStorage.setItem(`${this.STORAGE_KEY}_${size}`, JSON.stringify(records));
        } catch (e) {
            console.warn("保存排行榜数据失败", e);
        }
    }

    // ==================== 工具方法 ====================

    private getRankDisplay(index: number): string {
        if (index === 0) return "🥇";
        if (index === 1) return "🥈";
        if (index === 2) return "🥉";
        return `${index + 1}`;
    }

    private getRankColor(index: number): string {
        if (index === 0) return "#FFD700";
        if (index === 1) return "#C0C0C0";
        if (index === 2) return "#CD7F32";
        return "#E0E7FF";
    }

    private formatTime(ms: number): string {
        const totalSec = Math.floor(ms / 1000);
        const mm = Math.floor(totalSec / 60);
        const ss = totalSec % 60;
        const msPart = Math.floor((ms % 1000) / 10);
        if (mm > 0) {
            return `${mm}:${ss.toString().padStart(2, "0")}.${msPart.toString().padStart(2, "0")}`;
        }
        return `${ss}.${msPart.toString().padStart(2, "0")}秒`;
    }

    private formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${month}/${day}`;
    }

    private loadImageWithFallback(sp: Laya.Sprite, relPath: string, w: number, h: number): void {
        const candidates = [
            relPath,
            `assets/${relPath}`,
            `assets/resources/${relPath}`,
            `resources/${relPath}`
        ];
        for (const path of candidates) {
            sp.loadImage(path);
            break;
        }
    }

    public destroy(): void {
        Laya.Tween.clearAll(this.bgLayer);
        Laya.Tween.clearAll(this.contentLayer);
        super.destroy();
    }
}

// 数据结构定义
interface LeaderboardRecord {
    time: number;      // 用时（毫秒）
    errors: number;    // 错误次数
    date: number;      // 时间戳
}