/**
 * 记忆闪现主游戏场景
 * 核心玩法：显示序列 → 玩家回忆点击 → 验证 → 关卡递进
 */
const { regClass, Event } = Laya;

import { MemoryCell } from "./MemoryCell";
import { SoundManager } from "./SoundManager";

// 关卡配置接口
interface LevelConfig {
    gridSize: number;       // 网格大小 (2=2x2, 3=3x3, 4=4x4, 5=5x5)
    sequenceLength: number; // 序列长度
    displayTime: number;    // 每个数字显示时间(ms)
    lives: number;          // 生命值
}

@regClass("memory_scene", "../src/MemoryScene.ts")
export class MemoryScene extends Laya.Scene {
    private readonly BASE_W: number = 375;
    private readonly BASE_H: number = 750;
    private readonly SAFE_RENDER: boolean = true;

    // 关卡配置表
    private readonly LEVEL_CONFIG: LevelConfig[] = [
        { gridSize: 2, sequenceLength: 3, displayTime: 1500, lives: 5 },   // 第1关
        { gridSize: 2, sequenceLength: 4, displayTime: 1200, lives: 5 },   // 第2关
        { gridSize: 3, sequenceLength: 4, displayTime: 1000, lives: 4 },   // 第3关
        { gridSize: 3, sequenceLength: 5, displayTime: 800, lives: 4 },    // 第4关
        { gridSize: 3, sequenceLength: 6, displayTime: 600, lives: 3 },    // 第5关
        { gridSize: 4, sequenceLength: 6, displayTime: 500, lives: 3 },    // 第6关
        { gridSize: 4, sequenceLength: 7, displayTime: 450, lives: 3 },    // 第7关
        { gridSize: 5, sequenceLength: 7, displayTime: 400, lives: 3 },    // 第8关
        { gridSize: 5, sequenceLength: 8, displayTime: 350, lives: 3 },    // 第9关+
    ];

    private readonly ASSET = {
        bgFull: "ui/game_design/bg_full.png",
        hudPanel: "ui/game_design/hud_panel.png",
        gamePanel: "ui/game_design/game_panel.png",
        popupPanel: "ui/game_design/popup_panel.png",
        popupBtn: "ui/game_design/popup_btn.png"
    };

    // 层级
    private root: Laya.Sprite = null;
    private stageBg: Laya.Sprite = null;
    private bgLayer: Laya.Sprite = null;
    private gameLayer: Laya.Sprite = null;
    private uiLayer: Laya.Sprite = null;
    private fxLayer: Laya.Sprite = null;

    // UI 元素
    private titleText: Laya.Text = null;
    private hudPanel: Laya.Sprite = null;
    private levelText: Laya.Text = null;
    private livesText: Laya.Text = null;
    private scoreText: Laya.Text = null;
    private phaseText: Laya.Text = null;

    // 游戏面板
    private panelShadow: Laya.Sprite = null;
    private panelSprite: Laya.Sprite = null;
    private gridLayer: Laya.Sprite = null;
    private cells: MemoryCell[] = [];

    // 弹窗
    private popupOverlay: Laya.Sprite = null;
    private popupPanel: Laya.Sprite = null;

    // 游戏状态
    private _currentLevel: number = 1;
    private _sequence: number[] = [];        // 显示的数字序列
    private _positions: number[] = [];       // 对应的格子位置
    private _playerInput: number[] = [];     // 玩家输入的位置序列
    private _inputIndex: number = 0;         // 当前输入索引
    private _phase: "ready" | "displaying" | "input" | "result" = "ready";
    private _lives: number = 5;
    private _score: number = 0;
    private _startTime: number = 0;

    onAwake(): void {
        Laya.stage.alignH = "center";
        Laya.stage.alignV = "middle";
        Laya.stage.scaleMode = "showall";
        Laya.stage.screenMode = "vertical";

        this.initRoot();
        this.createLayers();
        this.createBackground();
        this.createTitle();
        this.createBackButton();
        this.createHudPanel();
        this.createGamePanel();
        this.createPhaseText();
        this.createPopup();

        Laya.stage.on(Event.RESIZE, this, this.onResize);
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
        // 背景由 stageBg 处理
    }

    private createTitle(): void {
        this.titleText = new Laya.Text();
        this.titleText.text = "记忆闪现";
        this.titleText.font = "Microsoft YaHei";
        this.titleText.fontSize = 24;
        this.titleText.bold = true;
        this.titleText.color = "#4FC3F7";
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

        btn.graphics.drawRoundRect(0, 0, 60, 32, 8, "rgba(255,255,255,0.1)", "rgba(255,255,255,0.2)", 1);

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
        this.hudPanel = this.createImage(this.uiLayer, this.ASSET.hudPanel, (this.BASE_W - 340) * 0.5, 75, 340, 90, "16,16,16,16");
        this.hudPanel.alpha = 1;

        this.levelText = this.createHudItem("关卡", "1", "#4FC3F7", 0);
        this.livesText = this.createHudItem("生命", "5", "#FF6B6B", 1);
        this.scoreText = this.createHudItem("分数", "0", "#FFD700", 2);
    }

    private createHudItem(label: string, value: string, color: string, index: number): Laya.Text {
        const itemW = 340 / 3;
        const originX = index * itemW;

        const labelText = new Laya.Text();
        labelText.text = label;
        labelText.font = "Microsoft YaHei";
        labelText.fontSize = 12;
        labelText.color = "rgba(255,255,255,0.6)";
        labelText.width = itemW;
        labelText.align = "center";
        labelText.pos(originX, 17);
        this.hudPanel.addChild(labelText);

        const valueText = new Laya.Text();
        valueText.text = value;
        valueText.font = "Microsoft YaHei";
        valueText.fontSize = 26;
        valueText.bold = true;
        valueText.color = color;
        valueText.width = itemW;
        valueText.align = "center";
        valueText.pos(originX, 37);
        this.hudPanel.addChild(valueText);

        return valueText;
    }

    private createGamePanel(): void {
        const panelX = (this.BASE_W - 320) * 0.5;
        const panelY = 200;

        // 阴影
        if (!this.SAFE_RENDER) {
            this.panelShadow = new Laya.Sprite();
            this.panelShadow.graphics.drawRoundRect(panelX + 6, panelY + 6, 320, 320, 24, "rgba(0,0,0,0.4)");
            this.gameLayer.addChild(this.panelShadow);
        }

        this.panelSprite = new Laya.Sprite();
        this.panelSprite.size(320, 320);
        this.panelSprite.pos(panelX, panelY);
        this.gameLayer.addChild(this.panelSprite);

        this.createImage(this.panelSprite, this.ASSET.gamePanel, 0, 0, 320, 320, "24,24,24,24");

        this.gridLayer = new Laya.Sprite();
        this.panelSprite.addChild(this.gridLayer);

        // 创建开始按钮
        this.createStartButton();
    }

    private createStartButton(): void {
        const btn = new Laya.Sprite();
        btn.name = "startBtn";
        btn.size(200, 54);
        btn.pos((this.BASE_W - 200) * 0.5, this.BASE_H - 80 - 54);
        btn.mouseEnabled = true;

        this.createImage(btn, "ui/game_design/start_btn.png", 0, 0, 200, 54, "27,27,27,27");

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
        btn.addChild(text);

        btn.on(Event.CLICK, this, this.startGame);
        this.uiLayer.addChild(btn);
    }

    private createPhaseText(): void {
        this.phaseText = new Laya.Text();
        this.phaseText.text = "点击开始游戏";
        this.phaseText.font = "Microsoft YaHei";
        this.phaseText.fontSize = 16;
        this.phaseText.color = "rgba(255,255,255,0.7)";
        this.phaseText.width = this.BASE_W;
        this.phaseText.align = "center";
        this.phaseText.pos(0, 540);
        this.uiLayer.addChild(this.phaseText);
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
        this.popupOverlay.on(Event.CLICK, this, () => { /* 消费点击 */ });

        this.popupPanel = new Laya.Sprite();
        this.popupPanel.size(280, 300);
        this.popupPanel.pos((this.BASE_W - 280) * 0.5, (this.BASE_H - 300) * 0.5);
        this.popupPanel.scale(0.8, 0.8);
        this.popupOverlay.addChild(this.popupPanel);

        this.createImage(this.popupPanel, this.ASSET.popupPanel, 0, 0, 280, 300, "20,20,20,20");

        const title = new Laya.Text();
        title.name = "popup_title";
        title.text = "游戏结束!";
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
        result.text = "最高关卡: 1\n最终分数: 0";
        result.font = "Microsoft YaHei";
        result.fontSize = 16;
        result.color = "#E0E7FF";
        result.leading = 8;
        result.width = 280;
        result.align = "center";
        result.pos(0, 80);
        this.popupPanel.addChild(result);

        // 重玩按钮
        const replayBtn = new Laya.Sprite();
        replayBtn.size(120, 44);
        replayBtn.pos(20, 220);
        replayBtn.mouseEnabled = true;
        replayBtn.on(Event.CLICK, this, this.onReplay);
        this.popupPanel.addChild(replayBtn);
        this.createImage(replayBtn, this.ASSET.popupBtn, 0, 0, 120, 44, "22,22,22,22");
        const replayText = new Laya.Text();
        replayText.text = "再玩一次";
        replayText.font = "Microsoft YaHei";
        replayText.fontSize = 14;
        replayText.bold = true;
        replayText.color = "#FFFFFF";
        replayText.width = 120;
        replayText.height = 44;
        replayText.align = "center";
        replayText.valign = "middle";
        replayBtn.addChild(replayText);

        // 返回按钮
        const backBtn = new Laya.Sprite();
        backBtn.size(120, 44);
        backBtn.pos(140, 220);
        backBtn.mouseEnabled = true;
        backBtn.on(Event.CLICK, this, this.goBackToMain);
        this.popupPanel.addChild(backBtn);
        this.createImage(backBtn, this.ASSET.popupBtn, 0, 0, 120, 44, "22,22,22,22");
        const backText = new Laya.Text();
        backText.text = "返回首页";
        backText.font = "Microsoft YaHei";
        backText.fontSize = 14;
        backText.bold = true;
        backText.color = "#FFFFFF";
        backText.width = 120;
        backText.height = 44;
        backText.align = "center";
        backText.valign = "middle";
        backBtn.addChild(backText);

        this.fxLayer.addChild(this.popupOverlay);
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
        if (index >= candidates.length) return;
        const path = candidates[index];
        sp.loadImage(path);
    }

    private makeCandidates(rel: string): string[] {
        return [rel, `assets/${rel}`, `assets/resources/${rel}`, `resources/${rel}`];
    }

    // ==================== 游戏逻辑 ====================

    private startGame(): void {
        // 隐藏开始按钮
        const startBtn = this.uiLayer.getChildByName("startBtn") as Laya.Sprite;
        if (startBtn) startBtn.visible = false;

        // 初始化游戏状态
        this._currentLevel = 1;
        this._lives = 5;
        this._score = 0;
        this.updateHudDisplay();

        // 开始第一关
        this.startRound();
    }

    private startRound(): void {
        const config = this.getLevelConfig(this._currentLevel);

        // 更新生命值
        this._lives = config.lives;
        this.updateHudDisplay();

        // 清空网格
        this.clearGrid();

        // 创建网格
        this.createGrid(config.gridSize);

        // 生成序列
        this.generateSequence(config.gridSize, config.sequenceLength);

        // 更新状态
        this._phase = "displaying";
        this._playerInput = [];
        this._inputIndex = 0;
        this._startTime = Laya.timer.currTimer;

        this.phaseText.text = "记住闪烁的数字顺序...";

        // 延迟后开始显示序列
        Laya.timer.once(800, this, () => {
            this.displaySequence(config.displayTime);
        });
    }

    private getLevelConfig(level: number): LevelConfig {
        const index = Math.min(level - 1, this.LEVEL_CONFIG.length - 1);
        return this.LEVEL_CONFIG[index];
    }

    private clearGrid(): void {
        this.cells.forEach(cell => cell.destroy());
        this.cells = [];
        if (this.gridLayer) {
            this.gridLayer.removeChildren();
        }
    }

    private createGrid(gridSize: number): void {
        const panelSize = 320;
        const padding = 16;
        const spacing = 6;
        const cellSize = Math.floor((panelSize - padding * 2 - spacing * (gridSize - 1)) / gridSize);

        const gridW = gridSize * cellSize + (gridSize - 1) * spacing;
        const startX = padding + (panelSize - padding * 2 - gridW) * 0.5;
        const startY = padding + (panelSize - padding * 2 - gridW) * 0.5;

        let position = 0;
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = new MemoryCell(position);
                cell.setCellSize(cellSize);
                cell.pos(startX + c * (cellSize + spacing), startY + r * (cellSize + spacing));
                cell.on(Event.CLICK, this, () => this.onCellClick(cell));
                this.gridLayer.addChild(cell);
                this.cells.push(cell);
                position++;
            }
        }
    }

    private generateSequence(gridSize: number, length: number): void {
        const totalCells = gridSize * gridSize;
        const availablePositions = this.shuffle(this.range(0, totalCells - 1));

        this._positions = availablePositions.slice(0, length);
        this._sequence = this.range(1, length);
    }

    private async displaySequence(displayTime: number): Promise<void> {
        for (let i = 0; i < this._sequence.length; i++) {
            const pos = this._positions[i];
            const num = this._sequence[i];
            const cell = this.cells[pos];

            // 高亮并显示数字
            cell.showNumber(num, displayTime);

            // 播放音效
            SoundManager.playClick();

            // 等待显示完成
            await this.delay(displayTime + 200);
        }

        // 所有数字显示完毕，进入输入阶段
        this.startInputPhase();
    }

    private startInputPhase(): void {
        this._phase = "input";
        this.phaseText.text = "请按顺序点击刚才的格子";

        // 所有格子进入可点击状态
        this.cells.forEach(cell => {
            cell.hide();
        });
    }

    private onCellClick(cell: MemoryCell): void {
        if (this._phase !== "input") return;
        if (!cell.isClickable()) return;

        const clickedPosition = cell.getPosition();
        const expectedPosition = this._positions[this._inputIndex];
        const expectedNumber = this._sequence[this._inputIndex];

        // 显示玩家点击的数字
        cell.revealNumber(expectedNumber);

        if (clickedPosition === expectedPosition) {
            // 正确
            this.onCorrectClick(cell, expectedNumber);
        } else {
            // 错误
            this.onWrongClick(cell);
        }
    }

    private onCorrectClick(cell: MemoryCell, number: number): void {
        cell.markCorrect();
        SoundManager.playCorrect();

        this._playerInput.push(cell.getPosition());
        this._inputIndex++;

        // 计算分数
        const elapsed = Laya.timer.currTimer - this._startTime;
        const timeBonus = Math.max(0, 1000 - Math.floor(elapsed / 100));
        this._score += 100 + timeBonus;
        this.updateHudDisplay();

        // 检查是否完成本关
        if (this._inputIndex >= this._sequence.length) {
            this.onRoundComplete(true);
        }
    }

    private async onWrongClick(cell: MemoryCell): Promise<void> {
        await cell.showError();
        SoundManager.playWrong();

        this._lives--;
        this.updateHudDisplay();

        // 震动反馈
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

        if (this._lives <= 0) {
            // 游戏结束
            this.onGameOver();
        } else {
            // 还有生命，继续尝试
            this.phaseText.text = `错误！还剩 ${this._lives} 条命`;

            // 重置输入状态
            this._inputIndex = 0;
            this._playerInput = [];

            // 延迟后重新显示序列
            Laya.timer.once(1000, this, () => {
                if (this._phase !== "input") return;

                // 重置所有格子
                this.cells.forEach(c => c.reset());

                // 重新显示序列
                this._phase = "displaying";
                this.phaseText.text = "重新显示序列...";

                Laya.timer.once(500, this, () => {
                    const config = this.getLevelConfig(this._currentLevel);
                    this.displaySequence(config.displayTime);
                });
            });
        }
    }

    private onRoundComplete(success: boolean): void {
        if (success) {
            SoundManager.playComplete();
            this.phaseText.text = `恭喜！关卡 ${this._currentLevel} 完成！`;

            // 进入下一关
            this._currentLevel++;

            // 延迟后开始下一关
            Laya.timer.once(1500, this, () => {
                this.startRound();
            });
        }
    }

    private onGameOver(): void {
        this._phase = "result";

        // 保存最高分
        this.saveBestScore();

        // 显示结果弹窗
        this.showResultPopup();
    }

    private showResultPopup(): void {
        const title = this.popupPanel.getChildByName("popup_title") as Laya.Text;
        if (title) {
            title.text = "游戏结束!";
        }

        const result = this.popupPanel.getChildByName("popup_result") as Laya.Text;
        if (result) {
            result.text = `最高关卡: ${this._currentLevel}\n最终分数: ${this._score}`;
        }

        this.popupOverlay.visible = true;
        this.popupOverlay.alpha = 1;
        this.popupPanel.scale(1, 1);
    }

    private onReplay(): void {
        this.popupOverlay.alpha = 0;
        this.popupOverlay.visible = false;

        // 重新显示开始按钮
        const startBtn = this.uiLayer.getChildByName("startBtn") as Laya.Sprite;
        if (startBtn) startBtn.visible = true;

        this.clearGrid();
        this._phase = "ready";
        this.phaseText.text = "点击开始游戏";
    }

    private updateHudDisplay(): void {
        this.levelText.text = String(this._currentLevel);
        this.livesText.text = String(this._lives);
        this.scoreText.text = String(this._score);
    }

    private saveBestScore(): void {
        const bestKey = "focus_planet_memory_best_level";
        const scoreKey = "focus_planet_memory_best_score";

        const bestLevel = parseInt(Laya.LocalStorage.getItem(bestKey) || "0");
        const bestScore = parseInt(Laya.LocalStorage.getItem(scoreKey) || "0");

        if (this._currentLevel > bestLevel) {
            Laya.LocalStorage.setItem(bestKey, String(this._currentLevel));
        }
        if (this._score > bestScore) {
            Laya.LocalStorage.setItem(scoreKey, String(this._score));
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => {
            Laya.timer.once(ms, this, resolve);
        });
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

    private onResize(): void {
        this.applyLayoutScale();
        this.refreshStageBackground();
    }

    onDestroy(): void {
        Laya.stage.off(Event.RESIZE, this, this.onResize);
        Laya.timer.clearAll(this);
        this.clearGrid();
    }
}