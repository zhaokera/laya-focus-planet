const { regClass, Event } = Laya;

import { GridCell } from "./GridCell";
import { SoundManager } from "./SoundManager";
import { VibrationManager } from "../managers/VibrationManager";
import { AchievementManager } from "../managers/AchievementManager";
import { FocusRadarManager } from "../managers/FocusRadarManager";
import { LeaderboardPanel } from "./LeaderboardPanel";

@regClass("game_scene", "../src/GameScene.ts")
export class GameScene extends Laya.Scene {
    public currentDifficulty: number = 4;
    private readonly SAFE_RENDER: boolean = true;

    private readonly BASE_W: number = 375;
    private readonly BASE_H: number = 750;

    private readonly GRID_SIZES: Record<number, { rows: number; cols: number }> = {
        3: { rows: 3, cols: 3 },
        4: { rows: 4, cols: 4 },
        5: { rows: 5, cols: 5 }
    };

    private readonly ASSET = {
        bgFull: "ui/game_design/bg_full.png",
        hudPanel: "ui/game_design/hud_panel.png",
        diffBtnActive: "ui/game_design/diff_btn_active.png",
        diffBtnNormal: "ui/game_design/diff_btn_normal.png",
        gamePanel: "ui/game_design/game_panel.png",
        startBtn: "ui/game_design/start_btn.png",
        popupPanel: "ui/game_design/popup_panel.png",
        popupBtn: "ui/game_design/popup_btn.png"
    };

    private root: Laya.Sprite = null;
    private stageBg: Laya.Sprite = null;
    private bgLayer: Laya.Sprite = null;
    private gameLayer: Laya.Sprite = null;
    private uiLayer: Laya.Sprite = null;
    private fxLayer: Laya.Sprite = null;

    private titleText: Laya.Text = null;
    private hudPanel: Laya.Sprite = null;
    private targetText: Laya.Text = null;
    private timerText: Laya.Text = null;
    private errorText: Laya.Text = null;

    private difficultyBtns: Record<number, Laya.Sprite> = {};
    private startBtn: Laya.Sprite = null;

    private cells: GridCell[] = [];
    private panelShadow: Laya.Sprite = null;
    private panelSprite: Laya.Sprite = null;
    private gridLayer: Laya.Sprite = null;

    private popupOverlay: Laya.Sprite = null;
    private popupPanel: Laya.Sprite = null;

    private _currentSize: number = 4;
    private _currentNumber: number = 1;
    private _totalNumbers: number = 16;
    private _errors: number = 0;
    private _isPlaying: boolean = false;
    private _startTime: number = 0;
    private _combo: number = 0; // 连击计数
    private _comboText: Laya.Text = null; // 连击提示文字
    private _isPaused: boolean = false; // 暂停状态
    private _pausedTime: number = 0; // 暂停时已用时间
    private pauseOverlay: Laya.Sprite = null; // 暂停弹窗

    onAwake(): void {
        Laya.stage.alignH = "center";
        Laya.stage.alignV = "middle";
        Laya.stage.scaleMode = "showall";
        Laya.stage.screenMode = "vertical";

        this.applyDifficultyFromEntry();
        this.initRoot();
        this.createLayers();

        this.createBackground();
        this.createTitle();
        this.createBackButton();
        this.createHudPanel();
        this.createDifficultyButtons();
        this.createGamePanelAndGrid();
        this.createStartButton();
        this.createLegend();
        this.createPopup();

        Laya.timer.frameLoop(1, this, this.updateTimer);
        Laya.stage.on(Event.RESIZE, this, this.onResize);
    }

    private applyDifficultyFromEntry(): void {
        const level = Number(this.currentDifficulty) || 4;
        this._currentSize = level === 3 || level === 4 || level === 5 ? level : 4;
        this._totalNumbers = this._currentSize * this._currentSize;
    }

    private initRoot(): void {
        this.size(Math.max(320, Laya.stage.width), Math.max(568, Laya.stage.height));
        Laya.stage.bgColor = "#0D0B1E";

        this.stageBg = new Laya.Sprite();
        this.addChild(this.stageBg);

        this.root = new Laya.Sprite();
        this.addChild(this.root);
        this.applyLayoutScale();
        this.refreshStageBackground();
    }

    private applyLayoutScale(): void {
        const sw = Math.max(1, Laya.stage.width);
        const sh = Math.max(1, Laya.stage.height);
        const scale = Math.min(sw / this.BASE_W, sh / this.BASE_H);

        this.root.scale(scale, scale);
        this.root.pos((sw - this.BASE_W * scale) * 0.5, (sh - this.BASE_H * scale) * 0.5);
        this.root.size(this.BASE_W, this.BASE_H);
    }

    private refreshStageBackground(): void {
        if (!this.stageBg) return;
        const sw = Math.max(1, Laya.stage.width);
        const sh = Math.max(1, Laya.stage.height);
        const scale = Math.max(sw / this.BASE_W, sh / this.BASE_H);
        const w = Math.ceil(this.BASE_W * scale);
        const h = Math.ceil(this.BASE_H * scale);
        const x = Math.floor((sw - w) * 0.5);
        const y = Math.floor((sh - h) * 0.5);
        this.stageBg.graphics.clear();
        this.loadSpriteSkin(this.stageBg, this.ASSET.bgFull, w, h, x, y);
    }

    private createLayers(): void {
        this.bgLayer = new Laya.Sprite();
        this.gameLayer = new Laya.Sprite();
        this.uiLayer = new Laya.Sprite();
        this.fxLayer = new Laya.Sprite();

        this.root.addChild(this.bgLayer);
        this.root.addChild(this.gameLayer);
        this.root.addChild(this.uiLayer);
        this.root.addChild(this.fxLayer);
    }

    private createBackground(): void {
        // Stage-level full-screen background handles main fill.
        if (this.SAFE_RENDER) return;
        this.bgLayer.graphics.drawRect(0, 0, this.BASE_W, this.BASE_H, "rgba(13,11,30,0.05)");

        const stars = [
            { x: 0.08, y: 0.15, r: 2, d: 0 },
            { x: 0.25, y: 0.08, r: 1.5, d: 0.5 },
            { x: 0.70, y: 0.20, r: 2, d: 1.0 },
            { x: 0.85, y: 0.12, r: 1.5, d: 1.5 },
            { x: 0.15, y: 0.25, r: 1.5, d: 0.3 },
            { x: 0.55, y: 0.18, r: 2, d: 0.8 },
            { x: 0.90, y: 0.30, r: 1.5, d: 1.2 },
            { x: 0.05, y: 0.35, r: 1.5, d: 0.2 },
            { x: 0.45, y: 0.05, r: 1.5, d: 1.8 },
            { x: 0.35, y: 0.22, r: 1, d: 0.7 }
        ];

        stars.forEach((cfg) => {
            const star = new Laya.Sprite();
            star.graphics.drawCircle(0, 0, cfg.r, "#FFFFFF");
            star.alpha = 0.3;
            star.pos(this.BASE_W * cfg.x, this.BASE_H * cfg.y);
            this.bgLayer.addChild(star);
            this.twinkleStar(star, cfg.d * 1000);
        });
    }

    private twinkleStar(star: Laya.Sprite, delayMs: number): void {
        Laya.timer.once(delayMs, this, () => {
            if (!star || star.destroyed) return;
            const ticker = () => {
                if (!star || star.destroyed) {
                    Laya.timer.clear(this, ticker);
                    return;
                }
                star.alpha = 0.3 + (Math.sin(Laya.timer.currTimer * 0.003) + 1) * 0.35;
            };
            Laya.timer.frameLoop(1, this, ticker);
        });
    }

    private createTitle(): void {
        this.titleText = new Laya.Text();
        this.titleText.text = "舒尔特方格";
        this.titleText.font = "Microsoft YaHei";
        this.titleText.fontSize = 24;
        this.titleText.bold = true;
        this.titleText.color = "#F8F3CF";
        this.titleText.stroke = 2;
        this.titleText.strokeColor = "rgba(0,0,0,0.5)";
        this.titleText.letterSpacing = 4;
        this.titleText.width = this.BASE_W;
        this.titleText.align = "center";
        this.titleText.pos(0, 30);
        this.uiLayer.addChild(this.titleText);
    }

    private createBackButton(): void {
        const btn = new Laya.Sprite();
        btn.size(60, 32);
        btn.pos(16, 28);
        btn.mouseEnabled = true;

        // 背景
        btn.graphics.drawRoundRect(0, 0, 60, 32, 8, "rgba(255,255,255,0.1)", "rgba(255,255,255,0.2)", 1);

        // 文字
        const text = new Laya.Text();
        text.text = "← 返回";
        text.font = "Microsoft YaHei";
        text.fontSize = 14;
        text.color = "#FFFFFF";
        text.width = 60;
        text.height = 32;
        text.align = "center";
        text.valign = "middle";
        btn.addChild(text);

        btn.on(Event.CLICK, this, this.goBackToMain);
        this.uiLayer.addChild(btn);
    }

    private goBackToMain(): void {
        import("./Main").then((module) => {
            const mainScene = new module.Main();
            mainScene.name = "Main";
            Laya.stage.addChild(mainScene);
            this.destroy();
        });
    }

    private createHudPanel(): void {
        if (!this.SAFE_RENDER) {
            const shadow = new Laya.Sprite();
            shadow.graphics.drawRoundRect((this.BASE_W - 340) * 0.5, 77, 340, 90, 16, "rgba(0,0,0,0.18)");
            this.uiLayer.addChild(shadow);
        }
        this.hudPanel = this.createImage(this.uiLayer, this.ASSET.hudPanel, (this.BASE_W - 340) * 0.5, 75, 340, 90, "16,16,16,16");
        this.hudPanel.alpha = 1;

        // 调整布局：目标、用时、错误、暂停按钮
        const itemW = 80;
        const startX = 10;

        this.targetText = this.createHudItem("目标", "1", "#FFD700", 0, startX, itemW);
        this.timerText = this.createHudItem("用时", "00:00", "#4FC3F7", 1, startX + itemW, itemW);
        this.errorText = this.createHudItem("错误", "0", "#FF6B6B", 2, startX + itemW * 2, itemW);

        // 暂停按钮
        this.createPauseButton();
    }

    private createHudItem(label: string, value: string, color: string, index: number, originX: number, width: number): Laya.Text {
        const labelText = new Laya.Text();
        labelText.text = label;
        labelText.font = "Microsoft YaHei";
        labelText.fontSize = 12;
        labelText.color = "rgba(255,255,255,0.6)";
        labelText.width = width;
        labelText.align = "center";
        labelText.pos(originX, 17);
        this.hudPanel.addChild(labelText);

        const valueText = new Laya.Text();
        valueText.text = value;
        valueText.font = "Microsoft YaHei";
        valueText.fontSize = 26;
        valueText.bold = true;
        valueText.color = color;
        valueText.width = width;
        valueText.align = "center";
        valueText.pos(originX, 37);
        this.hudPanel.addChild(valueText);

        return valueText;
    }

    private createPauseButton(): void {
        const btnSize = 36;
        const btnX = 340 - btnSize - 12;
        const btnY = (90 - btnSize) * 0.5;

        const pauseBtn = new Laya.Sprite();
        pauseBtn.size(btnSize, btnSize);
        pauseBtn.pos(btnX, btnY);
        pauseBtn.mouseEnabled = true;

        // 按钮背景
        pauseBtn.graphics.drawRoundRect(0, 0, btnSize, btnSize, 8, "rgba(255,255,255,0.15)", "rgba(255,255,255,0.3)", 1);

        // 暂停图标 (两条竖线)
        const icon = new Laya.Sprite();
        icon.graphics.drawRect(10, 10, 5, 16, "#FFFFFF");
        icon.graphics.drawRect(20, 10, 5, 16, "#FFFFFF");
        pauseBtn.addChild(icon);

        pauseBtn.on(Event.CLICK, this, this.showPausePopup);
        this.hudPanel.addChild(pauseBtn);
    }

    private createDifficultyButtons(): void {
        const sizes = [3, 4, 5];
        const btnW = 65;
        const btnH = 38;
        const gap = 16;
        const total = sizes.length * btnW + (sizes.length - 1) * gap;

        let x = (this.BASE_W - total) * 0.5 - 3;
        sizes.forEach((size) => {
            const btn = new Laya.Sprite();
            btn.size(btnW, btnH);
            btn.pos(x, 185);
            btn.mouseEnabled = true;

            const bg = this.createImage(btn, this.ASSET.diffBtnNormal, 0, 0, btnW, btnH, "8,8,8,8");
            bg.name = "bg";

            const text = new Laya.Text();
            text.text = `${size}×${size}`;
            text.font = "Microsoft YaHei";
            text.fontSize = 14;
            text.bold = true;
            text.color = "#FFFFFF";
            text.width = btnW;
            text.height = btnH;
            text.align = "center";
            text.valign = "middle";
            btn.addChild(text);

            this.paintDifficultyBtn(btn, size === this._currentSize);
            btn.on(Event.CLICK, this, () => this.onSelectDifficulty(size));

            this.difficultyBtns[size] = btn;
            this.uiLayer.addChild(btn);
            x += btnW + gap;
        });
    }

    private paintDifficultyBtn(btn: Laya.Sprite, selected: boolean): void {
        const bg = btn.getChildByName("bg") as Laya.Sprite;
        if (!bg) return;
        this.loadSpriteSkin(bg, selected ? this.ASSET.diffBtnActive : this.ASSET.diffBtnNormal, bg.width, bg.height);
    }

    private createGamePanelAndGrid(): void {
        this.cells.forEach((cell) => cell.destroy());
        this.cells = [];

        const panelX = (this.BASE_W - 320) * 0.5;
        const panelY = 245;

        if (!this.panelShadow) {
            this.panelShadow = new Laya.Sprite();
            this.gameLayer.addChild(this.panelShadow);
            if (!this.SAFE_RENDER) {
                this.panelShadow.graphics.drawRoundRect(panelX + 6, panelY + 6, 320, 320, 24, "rgba(0,0,0,0.4)");
            }
        }

        if (!this.panelSprite) {
            this.panelSprite = new Laya.Sprite();
            this.panelSprite.size(320, 320);
            this.gameLayer.addChild(this.panelSprite);
            this.createImage(this.panelSprite, this.ASSET.gamePanel, 0, 0, 320, 320, "24,24,24,24");
            this.drawPanelCorners();
            this.gridLayer = new Laya.Sprite();
            this.panelSprite.addChild(this.gridLayer);
        }
        this.panelSprite.pos(panelX, panelY);

        if (this.gridLayer) {
            this.gridLayer.removeChildren();
        }
        this.createGridCells();
    }

    private drawPanelCorners(): void {
        if (this.SAFE_RENDER) return;
        const color = "rgba(139,92,246,0.6)";
        const lineW = 3;
        const seg = 24;
        const m = 8;

        const lt = new Laya.Sprite();
        lt.graphics.drawLine(0, seg, 0, 0, color, lineW);
        lt.graphics.drawLine(0, 0, seg, 0, color, lineW);
        lt.pos(m, m);
        this.panelSprite.addChild(lt);

        const rt = new Laya.Sprite();
        rt.graphics.drawLine(0, 0, seg, 0, color, lineW);
        rt.graphics.drawLine(seg, 0, seg, seg, color, lineW);
        rt.pos(320 - m - seg, m);
        this.panelSprite.addChild(rt);

        const lb = new Laya.Sprite();
        lb.graphics.drawLine(0, 0, 0, seg, color, lineW);
        lb.graphics.drawLine(0, seg, seg, seg, color, lineW);
        lb.pos(m, 320 - m - seg);
        this.panelSprite.addChild(lb);

        const rb = new Laya.Sprite();
        rb.graphics.drawLine(seg, 0, seg, seg, color, lineW);
        rb.graphics.drawLine(0, seg, seg, seg, color, lineW);
        rb.pos(320 - m - seg, 320 - m - seg);
        this.panelSprite.addChild(rb);
    }

    private createGridCells(): void {
        const sizeCfg = this.GRID_SIZES[this._currentSize];
        const rows = sizeCfg.rows;
        const cols = sizeCfg.cols;
        const spacing = 6;
        const padding = 16;

        const cellSize = Math.floor((320 - padding * 2 - spacing * (cols - 1)) / cols);
        const gridW = cols * cellSize + (cols - 1) * spacing;
        const gridH = rows * cellSize + (rows - 1) * spacing;
        const startX = padding + (320 - padding * 2 - gridW) * 0.5;
        const startY = padding + (320 - padding * 2 - gridH) * 0.5;

        const numbers = this.shuffle(this.range(1, this._totalNumbers));
        let idx = 0;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const value = numbers[idx++];
                const cell = new GridCell(value, this._currentNumber);
                cell.setCellSize(cellSize);
                cell.pos(startX + c * (cellSize + spacing), startY + r * (cellSize + spacing));
                cell.on(Event.CLICK, this, () => this.onClickCell(cell));
                this.gridLayer.addChild(cell);
                this.cells.push(cell);
            }
        }

        this.updateActiveCell();
    }

    private createStartButton(): void {
        this.startBtn = new Laya.Sprite();
        this.startBtn.size(200, 54);
        this.startBtn.pos((this.BASE_W - 200) * 0.5, this.BASE_H - 80 - 54);
        this.startBtn.mouseEnabled = true;

        if (!this.SAFE_RENDER) {
            const shadow = new Laya.Sprite();
            shadow.graphics.drawRoundRect(this.startBtn.x, this.startBtn.y + 2, 200, 54, 27, "rgba(139,92,246,0.34)");
            this.uiLayer.addChild(shadow);
        }

        this.createImage(this.startBtn, this.ASSET.startBtn, 0, 0, 200, 54, "27,27,27,27");

        const text = new Laya.Text();
        text.text = "开始游戏";
        text.font = "Microsoft YaHei";
        text.fontSize = 20;
        text.bold = true;
        text.color = "#FFFFFF";
        text.stroke = 1;
        text.strokeColor = "rgba(0,0,0,0.18)";
        text.width = 200;
        text.height = 54;
        text.align = "center";
        text.valign = "middle";
        this.startBtn.addChild(text);

        this.startBtn.on(Event.CLICK, this, this.onStartGame);
        this.uiLayer.addChild(this.startBtn);
    }

    private createLegend(): void {
        const items = [
            { label: "待点", color: "#6366F1" },
            { label: "正确", color: "#FFD700" },
            { label: "错误", color: "#EF4444" }
        ];

        const fontSize = 11;
        const dot = 10;
        const dotTextGap = 8;
        const labelW = 28;
        const itemGap = 20;
        const itemW = dot + dotTextGap + labelW;
        const totalW = items.length * itemW + (items.length - 1) * itemGap;

        const legend = new Laya.Sprite();
        legend.size(totalW, 16);
        legend.pos((this.BASE_W - totalW) * 0.5, this.BASE_H - 34);
        this.uiLayer.addChild(legend);

        items.forEach((it, i) => {
            const item = new Laya.Sprite();
            item.pos(i * (itemW + itemGap), 0);
            legend.addChild(item);

            if (!this.SAFE_RENDER) {
                const d = new Laya.Sprite();
                d.graphics.drawRoundRect(0, 0, dot, dot, 3, it.color);
                d.alpha = 0.96;
                d.pos(0, 3);
                item.addChild(d);
            }

            const t = new Laya.Text();
            t.text = it.label;
            t.font = "Microsoft YaHei";
            t.fontSize = fontSize;
            t.color = "rgba(255,255,255,0.58)";
            t.width = labelW;
            t.height = 16;
            t.valign = "middle";
            t.pos(dot + dotTextGap, 0);
            item.addChild(t);
        });
    }

    private createPopup(): void {
        this.popupOverlay = new Laya.Sprite();
        this.popupOverlay.size(this.BASE_W, this.BASE_H);
        if (!this.SAFE_RENDER) {
            this.popupOverlay.graphics.drawRect(0, 0, this.BASE_W, this.BASE_H, "rgba(0,0,0,0.65)");
        }
        this.popupOverlay.alpha = 0;
        this.popupOverlay.visible = false;
        this.popupOverlay.mouseEnabled = true;
        this.popupOverlay.on(Event.CLICK, this, () => { /* consume */ });

        this.popupPanel = new Laya.Sprite();
        this.popupPanel.size(280, 260);
        this.popupPanel.pos((this.BASE_W - 280) * 0.5, (this.BASE_H - 260) * 0.5);
        this.popupPanel.scale(0.8, 0.8);
        this.popupOverlay.addChild(this.popupPanel);

        this.createImage(this.popupPanel, this.ASSET.popupPanel, 0, 0, 280, 260, "20,20,20,20");

        const title = new Laya.Text();
        title.name = "popup_title";
        title.text = "挑战完成!";
        title.font = "Microsoft YaHei";
        title.fontSize = 28;
        title.bold = true;
        title.color = "#FFD700";
        title.width = 280;
        title.align = "center";
        title.pos(0, 24);
        this.popupPanel.addChild(title);

        const result = new Laya.Text();
        result.name = "popup_result";
        result.text = "用时: 0秒\n错误: 0次";
        result.font = "Microsoft YaHei";
        result.fontSize = 16;
        result.color = "#E0E7FF";
        result.leading = 8;
        result.width = 280;
        result.align = "center";
        result.pos(0, 82);
        this.popupPanel.addChild(result);

        const btn = new Laya.Sprite();
        btn.size(140, 44);
        btn.pos((280 - 140) * 0.5, 190);
        btn.mouseEnabled = true;
        btn.on(Event.CLICK, this, this.onClosePopupAndReset);
        this.popupPanel.addChild(btn);

        this.createImage(btn, this.ASSET.popupBtn, 0, 0, 140, 44, "22,22,22,22");

        const btnText = new Laya.Text();
        btnText.text = "再来一局";
        btnText.font = "Microsoft YaHei";
        btnText.fontSize = 16;
        btnText.bold = true;
        btnText.color = "#FFFFFF";
        btnText.width = 140;
        btnText.height = 44;
        btnText.align = "center";
        btnText.valign = "middle";
        btn.addChild(btnText);

        this.fxLayer.addChild(this.popupOverlay);
    }

    /**
     * 显示暂停弹窗
     */
    private showPausePopup(): void {
        if (!this._isPlaying) return;

        // 暂停游戏
        this._isPaused = true;
        this._pausedTime = Laya.timer.currTimer - this._startTime;

        // 创建暂停弹窗
        if (!this.pauseOverlay) {
            this.pauseOverlay = new Laya.Sprite();
            this.pauseOverlay.size(this.BASE_W, this.BASE_H);
            this.pauseOverlay.graphics.drawRect(0, 0, this.BASE_W, this.BASE_H, "rgba(0,0,0,0.7)");
            this.pauseOverlay.mouseEnabled = true;
            this.pauseOverlay.on(Event.CLICK, this, () => { /* consume */ });
            this.fxLayer.addChild(this.pauseOverlay);

            // 弹窗面板
            const pausePanel = new Laya.Sprite();
            pausePanel.name = "pausePanel";
            pausePanel.size(260, 220);
            pausePanel.pos((this.BASE_W - 260) * 0.5, (this.BASE_H - 220) * 0.5);
            pausePanel.graphics.drawRoundRect(0, 0, 260, 220, 20, "rgba(40,40,60,0.95)", "rgba(255,255,255,0.2)", 1);
            this.pauseOverlay.addChild(pausePanel);

            // 标题
            const title = new Laya.Text();
            title.text = "游戏暂停";
            title.font = "Microsoft YaHei";
            title.fontSize = 24;
            title.bold = true;
            title.color = "#FFD700";
            title.width = 260;
            title.align = "center";
            title.pos(0, 24);
            pausePanel.addChild(title);

            // 继续游戏按钮
            const resumeBtn = new Laya.Sprite();
            resumeBtn.size(180, 44);
            resumeBtn.pos((260 - 180) * 0.5, 70);
            resumeBtn.mouseEnabled = true;
            resumeBtn.graphics.drawRoundRect(0, 0, 180, 44, 12, "#4CAF50");
            resumeBtn.on(Event.CLICK, this, this.onResumeGame);
            pausePanel.addChild(resumeBtn);

            const resumeText = new Laya.Text();
            resumeText.text = "继续游戏";
            resumeText.font = "Microsoft YaHei";
            resumeText.fontSize = 16;
            resumeText.bold = true;
            resumeText.color = "#FFFFFF";
            resumeText.width = 180;
            resumeText.height = 44;
            resumeText.align = "center";
            resumeText.valign = "middle";
            resumeBtn.addChild(resumeText);

            // 重新开始按钮
            const restartBtn = new Laya.Sprite();
            restartBtn.size(180, 44);
            restartBtn.pos((260 - 180) * 0.5, 120);
            restartBtn.mouseEnabled = true;
            restartBtn.graphics.drawRoundRect(0, 0, 180, 44, 12, "rgba(255,255,255,0.15)", "rgba(255,255,255,0.3)", 1);
            restartBtn.on(Event.CLICK, this, this.onRestartGame);
            pausePanel.addChild(restartBtn);

            const restartText = new Laya.Text();
            restartText.text = "重新开始";
            restartText.font = "Microsoft YaHei";
            restartText.fontSize = 16;
            restartText.bold = true;
            restartText.color = "#FFFFFF";
            restartText.width = 180;
            restartText.height = 44;
            restartText.align = "center";
            restartText.valign = "middle";
            restartBtn.addChild(restartText);

            // 返回首页按钮
            const homeBtn = new Laya.Sprite();
            homeBtn.size(180, 44);
            homeBtn.pos((260 - 180) * 0.5, 170);
            homeBtn.mouseEnabled = true;
            homeBtn.graphics.drawRoundRect(0, 0, 180, 44, 12, "rgba(255,107,107,0.3)", "rgba(255,107,107,0.5)", 1);
            homeBtn.on(Event.CLICK, this, this.goBackToMain);
            pausePanel.addChild(homeBtn);

            const homeText = new Laya.Text();
            homeText.text = "返回首页";
            homeText.font = "Microsoft YaHei";
            homeText.fontSize = 16;
            homeText.bold = true;
            homeText.color = "#FF6B6B";
            homeText.width = 180;
            homeText.height = 44;
            homeText.align = "center";
            homeText.valign = "middle";
            homeBtn.addChild(homeText);
        }

        this.pauseOverlay.visible = true;
        this.pauseOverlay.alpha = 1;
    }

    private onResumeGame(): void {
        if (!this._isPaused) return;

        this._isPaused = false;
        // 恢复计时：从暂停时刻继续
        this._startTime = Laya.timer.currTimer - this._pausedTime;

        if (this.pauseOverlay) {
            this.pauseOverlay.visible = false;
        }
    }

    private onRestartGame(): void {
        this._isPaused = false;
        if (this.pauseOverlay) {
            this.pauseOverlay.visible = false;
        }
        this.resetRunState(true);
        this.createGamePanelAndGrid();
    }

    private createImage(parent: Laya.Sprite, skin: string, x: number, y: number, w: number, h: number, sizeGrid?: string): Laya.Sprite {
        const img = new Laya.Sprite();
        img.pos(x, y);
        img.size(w, h);
        this.loadSpriteSkin(img, skin, w, h);
        parent.addChild(img);
        return img;
    }

    private loadSpriteSkin(sp: Laya.Sprite, relPath: string, w: number, h: number, x: number = 0, y: number = 0): void {
        const candidates = this.makeCandidates(relPath);
        this.tryLoadSprite(sp, candidates, 0, w, h, x, y);
    }

    private tryLoadSprite(sp: Laya.Sprite, candidates: string[], index: number, w: number, h: number, x: number, y: number): void {
        if (index >= candidates.length) {
            return;
        }
        const path = candidates[index];
        sp.loadImage(path);
    }

    private makeCandidates(rel: string): string[] {
        return [
            rel,
            `assets/${rel}`,
            `assets/resources/${rel}`,
            `resources/${rel}`
        ];
    }

    private onSelectDifficulty(size: number): void {
        if (size !== 3 && size !== 4 && size !== 5) return;

        this._currentSize = size;
        this._totalNumbers = size * size;

        Object.keys(this.difficultyBtns).forEach((k) => {
            const key = Number(k);
            this.paintDifficultyBtn(this.difficultyBtns[key], key === size);
        });

        this.resetRunState(false);
        this.createGamePanelAndGrid();
    }

    private onStartGame(): void {
        this.resetRunState(true);
    }

    private onClickCell(cell: GridCell): void {
        if (!this._isPlaying) return;

        cell.playPressFeedback();
        const value = cell.getNumber();

        if (value === this._currentNumber) {
            this.onCorrect(cell);
        } else {
            this.onWrong(cell);
        }
    }

    private onCorrect(cell: GridCell): void {
        if (cell.isLocked()) return;

        cell.markCompleted();
        SoundManager.playCorrect(); // 播放正确音
        VibrationManager.light(); // 轻微震动

        // 连击计数
        this._combo++;
        this.showComboHint();

        this._currentNumber++;
        this.updateTargetDisplay();

        if (this._currentNumber > this._totalNumbers) {
            this._isPlaying = false;
            SoundManager.playComplete(); // 播放完成音
            VibrationManager.heavy(); // 强烈震动
            this.showPopup();
            return;
        }

        this.updateActiveCell();
    }

    private onWrong(cell: GridCell): void {
        this._errors++;
        this._combo = 0; // 重置连击
        this.updateErrorDisplay();
        cell.showError();
        SoundManager.playWrong(); // 播放错误音
        VibrationManager.medium(); // 中等震动

        const ox = this.root.x;
        this.root.x = ox - 4;
        Laya.timer.once(40, this, () => {
            if (!this.root || this.root.destroyed) return;
            this.root.x = ox + 4;
            Laya.timer.once(40, this, () => {
                if (!this.root || this.root.destroyed) return;
                this.root.x = ox;
            });
        });
    }

    private updateActiveCell(): void {
        this.cells.forEach((cell) => {
            cell.setHighlight(false);
        });
    }

    private updateTargetDisplay(): void {
        const current = Math.min(this._currentNumber, this._totalNumbers);
        this.targetText.text = String(current);
    }

    private updateErrorDisplay(): void {
        this.errorText.text = String(this._errors);
    }

    private updateTimer(): void {
        if (!this._isPlaying || this._isPaused) return;
        const elapsed = Math.max(0, Laya.timer.currTimer - this._startTime);
        this.timerText.text = this.formatTime(elapsed);
    }

    private formatTime(ms: number): string {
        const totalSec = Math.floor(ms / 1000);
        const mm = Math.floor(totalSec / 60).toString().padStart(2, "0");
        const ss = (totalSec % 60).toString().padStart(2, "0");
        return `${mm}:${ss}`;
    }

    /**
     * 显示连击提示
     */
    private showComboHint(): void {
        // 根据连击数决定显示文字
        let text = "";
        let color = "#FFFFFF";

        if (this._combo >= 15) {
            text = "Incredible!";
            color = "#FF6B6B";
        } else if (this._combo >= 10) {
            text = "Amazing!";
            color = "#FFD700";
        } else if (this._combo >= 5) {
            text = "Perfect!";
            color = "#4FC3F7";
        } else {
            return; // 不足5次不显示
        }

        // 创建或更新连击文字
        if (!this._comboText) {
            this._comboText = new Laya.Text();
            this._comboText.font = "Microsoft YaHei";
            this._comboText.fontSize = 32;
            this._comboText.bold = true;
            this._comboText.stroke = 3;
            this._comboText.strokeColor = "rgba(0,0,0,0.5)";
            this._comboText.width = this.BASE_W;
            this._comboText.align = "center";
            this._comboText.pos(0, 580);
            this.fxLayer.addChild(this._comboText);
        }

        this._comboText.text = text;
        this._comboText.color = color;
        this._comboText.alpha = 1;
        this._comboText.scale(1.2, 1.2);

        // 动画效果
        Laya.Tween.to(this._comboText, { scaleX: 1, scaleY: 1 }, 150, Laya.Ease.backOut);

        // 延迟淡出
        Laya.timer.clear(this, this.hideComboText);
        Laya.timer.once(800, this, this.hideComboText);
    }

    private hideComboText(): void {
        if (this._comboText) {
            Laya.Tween.to(this._comboText, { alpha: 0 }, 300);
        }
    }

    private showPopup(): void {
        const elapsed = Laya.timer.currTimer - this._startTime;
        const elapsedSec = Math.floor(elapsed / 1000);
        const result = this.popupPanel.getChildByName("popup_result") as Laya.Text;
        if (result) {
            result.text = `用时: ${elapsedSec}秒\n错误: ${this._errors}次`;
        }

        // 保存到排行榜
        LeaderboardPanel.addSchulteRecord(elapsed, this._errors, "玩家");

        // 记录游戏结果并检查成就
        const newAchievements = AchievementManager.recordSchulteGame(
            this._currentSize,
            elapsed,
            this._errors,
            this._combo
        );

        // 记录到专注力雷达图
        FocusRadarManager.recordSchulteGame(
            this._currentSize,
            elapsed,
            this._errors,
            this._combo
        );

        // 如果有新成就解锁，可以显示提示
        if (newAchievements.length > 0) {
            console.log("[GameScene] 新成就解锁:", newAchievements);
        }

        this.popupOverlay.visible = true;
        this.popupOverlay.alpha = 1;
        this.popupPanel.scale(1, 1);
    }

    private onClosePopupAndReset(): void {
        this.popupOverlay.alpha = 0;
        this.popupOverlay.visible = false;
        this.resetRunState(false);
        this.createGamePanelAndGrid();
    }

    private resetRunState(startImmediately: boolean): void {
        this._currentNumber = 1;
        this._errors = 0;
        this._combo = 0; // 重置连击
        if (this._comboText) {
            this._comboText.alpha = 0;
        }
        this.updateTargetDisplay();
        this.updateErrorDisplay();
        this.timerText.text = "00:00";

        this._isPlaying = startImmediately;
        this._startTime = startImmediately ? Laya.timer.currTimer : 0;
    }

    private onResize(): void {
        this.applyLayoutScale();
        this.refreshStageBackground();
    }

    private range(from: number, to: number): number[] {
        const list: number[] = [];
        for (let i = from; i <= to; i++) {
            list.push(i);
        }
        return list;
    }

    private shuffle(list: number[]): number[] {
        const a = [...list];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    onDestroy(): void {
        Laya.timer.clear(this, this.updateTimer);
        Laya.stage.off(Event.RESIZE, this, this.onResize);
        this.cells.forEach((c) => c.destroy());
        this.cells = [];
    }
}
