/**
 * 挑战模式游戏场景 - Focus Planet
 * 支持三种挑战类型：闪电战、无尽攀登、零失误
 */

const { regClass, Event } = Laya;

import { GridCell } from "./GridCell";
import { SoundManager } from "./SoundManager";
import { VibrationManager } from "../managers/VibrationManager";
import { FocusRadarManager } from "../managers/FocusRadarManager";
import type { ChallengeType } from "./ChallengeSelectPanel";

interface ChallengeState {
    // 通用状态
    roundsCompleted: number;
    totalErrors: number;
    startTime: number;

    // 闪电战
    timeLimit: number;
    timeRemaining: number;

    // 无尽攀登
    currentLevel: number;
    currentGridSize: number;

    // 零失误
    lives: number;
    maxLives: number;
}

@regClass("challenge_scene", "../src/ChallengeScene.ts")
export class ChallengeScene extends Laya.Scene {
    public challengeType: ChallengeType = "blitz";

    private readonly BASE_W: number = 375;
    private readonly BASE_H: number = 750;
    private readonly SAFE_RENDER: boolean = true;

    private readonly GRID_SIZES: Record<number, { rows: number; cols: number }> = {
        3: { rows: 3, cols: 3 },
        4: { rows: 4, cols: 4 },
        5: { rows: 5, cols: 5 }
    };

    private readonly ASSET = {
        bgFull: "ui/game_design/bg_full.png",
        hudPanel: "ui/game_design/hud_panel.png",
        gamePanel: "ui/game_design/game_panel.png",
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
    private infoTexts: Record<string, Laya.Text> = {};

    private cells: GridCell[] = [];
    private panelShadow: Laya.Sprite = null;
    private panelSprite: Laya.Sprite = null;
    private gridLayer: Laya.Sprite = null;

    private popupOverlay: Laya.Sprite = null;
    private popupPanel: Laya.Sprite = null;

    // 游戏状态
    private _currentSize: number = 4;
    private _currentNumber: number = 1;
    private _totalNumbers: number = 16;
    private _errors: number = 0;
    private _isPlaying: boolean = false;
    private _startTime: number = 0;

    // 挑战模式状态
    private challengeState: ChallengeState = {
        roundsCompleted: 0,
        totalErrors: 0,
        startTime: 0,

        timeLimit: 60000,
        timeRemaining: 60000,

        currentLevel: 1,
        currentGridSize: 3,

        lives: 3,
        maxLives: 3
    };

    private countdownTimer: number = 0;

    onAwake(): void {
        Laya.stage.alignH = "center";
        Laya.stage.alignV = "middle";
        Laya.stage.scaleMode = "showall";
        Laya.stage.screenMode = "vertical";

        this.initChallengeState();
        this.initRoot();
        this.createLayers();
        this.createBackground();
        this.createTitle();
        this.createBackButton();
        this.createHudPanel();
        this.createGamePanelAndGrid();
        this.createPopup();

        Laya.timer.frameLoop(1, this, this.updateGame);
        Laya.stage.on(Event.RESIZE, this, this.onResize);
    }

    private initChallengeState(): void {
        switch (this.challengeType) {
            case "blitz":
                // 闪电战：60秒限时，4x4方格
                this._currentSize = 4;
                this.challengeState.timeLimit = 60000;
                this.challengeState.timeRemaining = 60000;
                break;
            case "endless":
                // 无尽攀登：从3x3开始
                this._currentSize = 3;
                this.challengeState.currentLevel = 1;
                this.challengeState.currentGridSize = 3;
                break;
            case "precision":
                // 零失误：4x4，3条命
                this._currentSize = 4;
                this.challengeState.lives = 3;
                this.challengeState.maxLives = 3;
                break;
        }
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
        if (this.SAFE_RENDER) return;
        this.bgLayer.graphics.drawRect(0, 0, this.BASE_W, this.BASE_H, "rgba(13,11,30,0.05)");
    }

    private createTitle(): void {
        const titleMap: Record<ChallengeType, string> = {
            blitz: "闪电战",
            endless: "无尽攀登",
            precision: "零失误"
        };

        this.titleText = new Laya.Text();
        this.titleText.text = titleMap[this.challengeType];
        this.titleText.font = "Microsoft YaHei";
        this.titleText.fontSize = 24;
        this.titleText.bold = true;
        this.titleText.color = this.getChallengeColor();
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

    private getChallengeColor(): string {
        const colorMap: Record<ChallengeType, string> = {
            blitz: "#FFD700",
            endless: "#4FC3F7",
            precision: "#FF6B6B"
        };
        return colorMap[this.challengeType];
    }

    private createHudPanel(): void {
        this.hudPanel = this.createImage(this.uiLayer, this.ASSET.hudPanel, (this.BASE_W - 340) * 0.5, 75, 340, 90, "16,16,16,16");

        switch (this.challengeType) {
            case "blitz":
                this.createHudItem("时间", this.formatTime(this.challengeState.timeRemaining), "#FFD700", 0);
                this.createHudItem("轮数", "0", "#4FC3F7", 1);
                this.createHudItem("错误", "0", "#FF6B6B", 2);
                break;
            case "endless":
                this.createHudItem("关卡", "1", "#4FC3F7", 0);
                this.createHudItem("用时", "00:00", "#FFFFFF", 1);
                this.createHudItem("错误", "0", "#FF6B6B", 2);
                break;
            case "precision":
                this.createHudItem("生命", "❤️❤️❤️", "#FF6B6B", 0);
                this.createHudItem("用时", "00:00", "#FFFFFF", 1);
                this.createHudItem("轮数", "0", "#4FC3F7", 2);
                break;
        }
    }

    private createHudItem(label: string, value: string, color: string, index: number): void {
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
        valueText.fontSize = 22;
        valueText.bold = true;
        valueText.color = color;
        valueText.width = itemW;
        valueText.align = "center";
        valueText.pos(originX, 40);
        this.hudPanel.addChild(valueText);

        this.infoTexts[label] = valueText;
    }

    private createGamePanelAndGrid(): void {
        this.cells.forEach((cell) => cell.destroy());
        this.cells = [];

        const panelX = (this.BASE_W - 320) * 0.5;
        const panelY = 200;

        if (!this.panelShadow) {
            this.panelShadow = new Laya.Sprite();
            this.gameLayer.addChild(this.panelShadow);
        }

        if (!this.panelSprite) {
            this.panelSprite = new Laya.Sprite();
            this.panelSprite.size(320, 320);
            this.gameLayer.addChild(this.panelSprite);
            this.createImage(this.panelSprite, this.ASSET.gamePanel, 0, 0, 320, 320, "24,24,24,24");
            this.gridLayer = new Laya.Sprite();
            this.panelSprite.addChild(this.gridLayer);
        }
        this.panelSprite.pos(panelX, panelY);

        if (this.gridLayer) {
            this.gridLayer.removeChildren();
        }
        this.createGridCells();

        // 显示开始提示
        this.showStartHint();
    }

    private showStartHint(): void {
        const hint = new Laya.Text();
        hint.name = "startHint";
        hint.text = "点击任意数字开始";
        hint.font = "Microsoft YaHei";
        hint.fontSize = 18;
        hint.color = "rgba(255,255,255,0.6)";
        hint.width = this.BASE_W;
        hint.align = "center";
        hint.pos(0, this.BASE_H - 120);
        this.uiLayer.addChild(hint);
    }

    private hideStartHint(): void {
        const hint = this.uiLayer.getChildByName("startHint") as Laya.Text;
        if (hint) {
            hint.removeSelf();
            hint.destroy();
        }
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

    private createPopup(): void {
        this.popupOverlay = new Laya.Sprite();
        this.popupOverlay.size(this.BASE_W, this.BASE_H);
        this.popupOverlay.graphics.drawRect(0, 0, this.BASE_W, this.BASE_H, "rgba(0,0,0,0.65)");
        this.popupOverlay.alpha = 0;
        this.popupOverlay.visible = false;
        this.popupOverlay.mouseEnabled = true;
        this.popupOverlay.on(Event.CLICK, this, () => { /* consume */ });

        this.popupPanel = new Laya.Sprite();
        this.popupPanel.size(280, 280);
        this.popupPanel.pos((this.BASE_W - 280) * 0.5, (this.BASE_H - 280) * 0.5);
        this.popupPanel.scale(0.8, 0.8);
        this.popupOverlay.addChild(this.popupPanel);

        this.createImage(this.popupPanel, this.ASSET.popupPanel, 0, 0, 280, 280, "20,20,20,20");

        const title = new Laya.Text();
        title.name = "popup_title";
        title.text = "挑战结束!";
        title.font = "Microsoft YaHei";
        title.fontSize = 28;
        title.bold = true;
        title.color = this.getChallengeColor();
        title.width = 280;
        title.align = "center";
        title.pos(0, 24);
        this.popupPanel.addChild(title);

        const result = new Laya.Text();
        result.name = "popup_result";
        result.text = "";
        result.font = "Microsoft YaHei";
        result.fontSize = 15;
        result.color = "#E0E7FF";
        result.leading = 10;
        result.width = 280;
        result.align = "center";
        result.pos(0, 80);
        this.popupPanel.addChild(result);

        // 再来一次按钮
        const btn1 = new Laya.Sprite();
        btn1.size(120, 44);
        btn1.pos(20, 210);
        btn1.mouseEnabled = true;
        btn1.on(Event.CLICK, this, this.onRestart);
        this.popupPanel.addChild(btn1);
        this.createImage(btn1, this.ASSET.popupBtn, 0, 0, 120, 44, "22,22,22,22");

        const btnText1 = new Laya.Text();
        btnText1.text = "再来一次";
        btnText1.font = "Microsoft YaHei";
        btnText1.fontSize = 14;
        btnText1.bold = true;
        btnText1.color = "#FFFFFF";
        btnText1.width = 120;
        btnText1.height = 44;
        btnText1.align = "center";
        btnText1.valign = "middle";
        btn1.addChild(btnText1);

        // 返回按钮
        const btn2 = new Laya.Sprite();
        btn2.size(120, 44);
        btn2.pos(140, 210);
        btn2.mouseEnabled = true;
        btn2.on(Event.CLICK, this, this.goBackToMain);
        this.popupPanel.addChild(btn2);
        this.createImage(btn2, this.ASSET.popupBtn, 0, 0, 120, 44, "22,22,22,22");

        const btnText2 = new Laya.Text();
        btnText2.text = "返回首页";
        btnText2.font = "Microsoft YaHei";
        btnText2.fontSize = 14;
        btnText2.bold = true;
        btnText2.color = "#FFFFFF";
        btnText2.width = 120;
        btnText2.height = 44;
        btnText2.align = "center";
        btnText2.valign = "middle";
        btn2.addChild(btnText2);

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

    private onClickCell(cell: GridCell): void {
        // 首次点击开始游戏
        if (!this._isPlaying) {
            this.startGame();
        }

        if (!this._isPlaying) return;

        cell.playPressFeedback();
        const value = cell.getNumber();

        if (value === this._currentNumber) {
            this.onCorrect(cell);
        } else {
            this.onWrong(cell);
        }
    }

    private startGame(): void {
        this._isPlaying = true;
        this._startTime = Laya.timer.currTimer;
        this.challengeState.startTime = this._startTime;
        this.hideStartHint();

        // 闪电战：启动倒计时
        if (this.challengeType === "blitz") {
            this.startCountdown();
        }
    }

    private startCountdown(): void {
        this.countdownTimer = Laya.timer.loop(100, this, this.updateCountdown);
    }

    private updateCountdown(): void {
        if (!this._isPlaying) return;

        const elapsed = Laya.timer.currTimer - this._startTime;
        this.challengeState.timeRemaining = Math.max(0, this.challengeState.timeLimit - elapsed);

        // 更新显示
        if (this.infoTexts["时间"]) {
            this.infoTexts["时间"].text = this.formatTime(this.challengeState.timeRemaining);
        }

        // 时间到
        if (this.challengeState.timeRemaining <= 0) {
            this.endChallenge();
        }
    }

    private onCorrect(cell: GridCell): void {
        if (cell.isLocked()) return;

        cell.markCompleted();
        SoundManager.playCorrect(); // 播放正确音
        VibrationManager.light(); // 轻微震动
        this._currentNumber++;

        if (this._currentNumber > this._totalNumbers) {
            this.onRoundComplete();
            return;
        }

        this.updateActiveCell();
    }

    private onWrong(cell: GridCell): void {
        this._errors++;
        this.challengeState.totalErrors++;
        cell.showError();
        SoundManager.playWrong(); // 播放错误音
        VibrationManager.medium(); // 中等震动

        // 更新错误显示
        if (this.infoTexts["错误"]) {
            this.infoTexts["错误"].text = String(this.challengeState.totalErrors);
        }

        // 零失误模式：扣命
        if (this.challengeType === "precision") {
            this.challengeState.lives--;
            this.updateLivesDisplay();

            if (this.challengeState.lives <= 0) {
                this.endChallenge();
                return;
            }
        }

        // 屏幕震动
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

    private updateLivesDisplay(): void {
        if (this.infoTexts["生命"]) {
            const hearts = "❤️".repeat(this.challengeState.lives) + "🖤".repeat(this.challengeState.maxLives - this.challengeState.lives);
            this.infoTexts["生命"].text = hearts;
        }
    }

    private onRoundComplete(): void {
        this.challengeState.roundsCompleted++;
        SoundManager.playCorrect(); // 播放完成一轮音效

        // 更新轮数显示
        if (this.infoTexts["轮数"]) {
            this.infoTexts["轮数"].text = String(this.challengeState.roundsCompleted);
        }

        // 无尽攀登：升级难度
        if (this.challengeType === "endless") {
            this.challengeState.currentLevel++;
            this._currentSize = this.getNextGridSize();
            this._totalNumbers = this._currentSize * this._currentSize;

            // 更新关卡显示
            if (this.infoTexts["关卡"]) {
                this.infoTexts["关卡"].text = `${this._currentSize}×${this._currentSize}`;
            }
        }

        // 继续下一轮
        this.resetForNextRound();
        this.createGridCells();
    }

    private getNextGridSize(): number {
        // 3 → 4 → 5 → 3 → 4 → 5 ...
        const sizes = [3, 4, 5];
        const currentIndex = sizes.indexOf(this._currentSize);
        return sizes[(currentIndex + 1) % sizes.length];
    }

    private resetForNextRound(): void {
        this._currentNumber = 1;
        this._errors = 0;
        this.updateActiveCell();
    }

    private updateActiveCell(): void {
        this.cells.forEach((cell) => {
            cell.setHighlight(false);
        });
    }

    private updateGame(): void {
        if (!this._isPlaying) return;

        // 更新计时器（非闪电战）
        if (this.challengeType !== "blitz") {
            const elapsed = Math.max(0, Laya.timer.currTimer - this._startTime);
            if (this.infoTexts["用时"]) {
                this.infoTexts["用时"].text = this.formatTime(elapsed);
            }
        }
    }

    private endChallenge(): void {
        this._isPlaying = false;
        Laya.timer.clear(this, this.updateCountdown);

        const elapsed = Laya.timer.currTimer - this.challengeState.startTime;

        // 记录到专注力雷达图
        FocusRadarManager.recordChallengeGame(elapsed, this.challengeState.totalErrors, 0);

        this.showResultPopup(elapsed);
    }

    private showResultPopup(elapsed: number): void {
        const resultText = this.popupPanel.getChildByName("popup_result") as Laya.Text;
        if (resultText) {
            const elapsedSec = Math.floor(elapsed / 1000);
            let text = "";

            switch (this.challengeType) {
                case "blitz":
                    text = `完成轮数: ${this.challengeState.roundsCompleted}\n总用时: ${this.formatTime(this.challengeState.timeLimit)}\n错误次数: ${this.challengeState.totalErrors}`;
                    break;
                case "endless":
                    text = `到达关卡: ${this._currentSize}×${this._currentSize}\n完成轮数: ${this.challengeState.roundsCompleted}\n总用时: ${this.formatTime(elapsed)}`;
                    break;
                case "precision":
                    text = `完成轮数: ${this.challengeState.roundsCompleted}\n总用时: ${this.formatTime(elapsed)}\n错误次数: ${this.challengeState.totalErrors}`;
                    break;
            }

            resultText.text = text;
        }

        this.popupOverlay.visible = true;
        this.popupOverlay.alpha = 1;
        this.popupPanel.scale(1, 1);
    }

    private onRestart(): void {
        this.popupOverlay.alpha = 0;
        this.popupOverlay.visible = false;

        // 重置所有状态
        this._currentNumber = 1;
        this._errors = 0;
        this._isPlaying = false;
        this._startTime = 0;

        this.challengeState = {
            roundsCompleted: 0,
            totalErrors: 0,
            startTime: 0,
            timeLimit: 60000,
            timeRemaining: 60000,
            currentLevel: 1,
            currentGridSize: 3,
            lives: 3,
            maxLives: 3
        };

        this.initChallengeState();
        this.updateHudDisplay();
        this.createGamePanelAndGrid();
    }

    private updateHudDisplay(): void {
        switch (this.challengeType) {
            case "blitz":
                if (this.infoTexts["时间"]) this.infoTexts["时间"].text = this.formatTime(this.challengeState.timeLimit);
                if (this.infoTexts["轮数"]) this.infoTexts["轮数"].text = "0";
                if (this.infoTexts["错误"]) this.infoTexts["错误"].text = "0";
                break;
            case "endless":
                if (this.infoTexts["关卡"]) this.infoTexts["关卡"].text = "3×3";
                if (this.infoTexts["用时"]) this.infoTexts["用时"].text = "00:00";
                if (this.infoTexts["错误"]) this.infoTexts["错误"].text = "0";
                break;
            case "precision":
                this.updateLivesDisplay();
                if (this.infoTexts["用时"]) this.infoTexts["用时"].text = "00:00";
                if (this.infoTexts["轮数"]) this.infoTexts["轮数"].text = "0";
                break;
        }
    }

    private goBackToMain(): void {
        import("./Main").then((module) => {
            const mainScene = new module.Main();
            mainScene.name = "Main";
            Laya.stage.addChild(mainScene);
            this.destroy();
        });
    }

    private formatTime(ms: number): string {
        const totalSec = Math.floor(ms / 1000);
        const mm = Math.floor(totalSec / 60).toString().padStart(2, "0");
        const ss = (totalSec % 60).toString().padStart(2, "0");
        return `${mm}:${ss}`;
    }

    private range(from: number, to: number): number[] {
        const list: number[] = [];
        for (let i = from; i <= to; i++) list.push(i);
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
        Laya.timer.clear(this, this.updateGame);
        Laya.timer.clear(this, this.updateCountdown);
        Laya.stage.off(Event.RESIZE, this, this.onResize);
        this.cells.forEach((c) => c.destroy());
        this.cells = [];
    }
}