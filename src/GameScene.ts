const { regClass, Event } = Laya;

import { Main } from "./Main";

interface CellNode extends Laya.Sprite {
    value: number;
    state: "normal" | "active" | "correct" | "wrong";
    locked: boolean;
    label: Laya.Text;
}

@regClass('a8c2f4d2-72a0-4b60-afaf-ee2dc3500e51', '../src/GameScene.ts')
export class GameScene extends Laya.Scene {
    public currentDifficulty: number = 5;

    private readonly ASSET = {
        bg: "assets/ui/game/bg/bg_game_main_1536x2732.png",
        hud: "assets/ui/game/hud/hud_top_panel.png",
        iconBack: "assets/ui/game/icons/icon_back.png",
        iconPause: "assets/ui/game/icons/icon_pause.png",
        iconTimer: "assets/ui/game/icons/icon_timer.png",
        iconTarget: "assets/ui/game/icons/icon_target.png",
        panel: "assets/ui/game/grid/grid_panel_paper.png",
        cellNormal: "assets/ui/game/grid/cell_normal.png",
        cellActive: "assets/ui/game/grid/cell_active.png",
        cellCorrect: "assets/ui/game/grid/cell_correct.png",
        cellWrong: "assets/ui/game/grid/cell_wrong.png",
        ripple: "assets/ui/game/fx/fx_ripple.png",
        confetti: "assets/ui/game/fx/fx_confetti.png"
    };

    private bgSprite: Laya.Sprite = null;
    private overlaySprite: Laya.Sprite = null;

    private hudSprite: Laya.Sprite = null;
    private topY: number = 24;
    private hudBottom: number = 160;

    private timerText: Laya.Text = null;
    private targetText: Laya.Text = null;

    private gridPanel: Laya.Sprite = null;
    private gridLayer: Laya.Sprite = null;
    private cells: CellNode[] = [];
    private activeCell: CellNode = null;

    private completeOverlay: Laya.Sprite = null;

    private _currentNumber: number = 1;
    private _totalNumbers: number = 25;
    private _startTime: number = 0;
    private _errors: number = 0;
    private _isPlaying: boolean = false;
    private _isPaused: boolean = false;
    private _safeBottom: number = 20;

    onAwake(): void {
        this.initStage();
    }

    onEnable(): void {
        this.currentDifficulty = this.normalizeDifficulty((this as any).currentDifficulty ?? this.currentDifficulty);
        this.buildScene();
    }

    public setDifficulty(level: number): void {
        this.currentDifficulty = this.normalizeDifficulty(level);
    }

    private normalizeDifficulty(level: number): number {
        if (level === 3 || level === 4 || level === 5) {
            return level;
        }
        return 5;
    }

    private initStage(): void {
        Laya.stage.alignH = "center";
        Laya.stage.alignV = "middle";
        Laya.stage.scaleMode = "showall";
        Laya.stage.screenMode = "vertical";
        Laya.stage.bgColor = "#070B1A";
    }

    private buildScene(): void {
        this.size(Math.max(320, Laya.stage.width), Math.max(568, Laya.stage.height));
        this.removeChildren();
        this.graphics.clear();

        this._safeBottom = this.height >= 2400 ? 42 : 20;
        this.topY = this.height >= 2400 ? 66 : 28;

        this._currentNumber = 1;
        this._errors = 0;
        this._isPaused = false;
        this._isPlaying = false;
        this._totalNumbers = this.currentDifficulty * this.currentDifficulty;

        this.createBackground();
        this.createHUD();
        this.createGridPanelAndCells();

        this._isPlaying = true;
        this._startTime = Laya.timer.currTimer;
        this.updateTargetText();
        this.updateTimerText();
        this.timer.frameOnce(6, this, this.tickTimer);
    }

    private createBackground(): void {
        this.bgSprite = new Laya.Sprite();
        this.addChild(this.bgSprite);
        this.loadCoverImage(this.bgSprite, this.ASSET.bg, this.width, this.height);

        this.overlaySprite = new Laya.Sprite();
        this.overlaySprite.graphics.drawRect(0, 0, this.width, this.height, "rgba(0,0,0,0.2)");
        this.addChild(this.overlaySprite);
    }

    private createHUD(): void {
        const hudW = this.width * 0.92;
        const hudH = hudW * 0.24;
        const hudX = (this.width - hudW) * 0.5;

        this.hudSprite = new Laya.Sprite();
        this.hudSprite.pos(hudX, this.topY);
        this.hudSprite.size(hudW, hudH);
        this.addChild(this.hudSprite);
        this.loadSpriteImage(this.hudSprite, this.ASSET.hud, hudW, hudH);

        const btnSize = Math.max(46, hudH * 0.32);
        const backBtn = new Laya.Sprite();
        backBtn.pos(20, (hudH - btnSize) * 0.5);
        backBtn.size(btnSize, btnSize);
        backBtn.mouseEnabled = true;
        this.hudSprite.addChild(backBtn);
        this.loadSpriteImage(backBtn, this.ASSET.iconBack, btnSize, btnSize);
        backBtn.on(Event.TOUCH_START, this, this.onBack);
        backBtn.on(Event.MOUSE_DOWN, this, this.onBack);

        const pauseBtn = new Laya.Sprite();
        pauseBtn.pos(hudW - btnSize - 20, (hudH - btnSize) * 0.5);
        pauseBtn.size(btnSize, btnSize);
        pauseBtn.mouseEnabled = true;
        this.hudSprite.addChild(pauseBtn);
        this.loadSpriteImage(pauseBtn, this.ASSET.iconPause, btnSize, btnSize);
        pauseBtn.on(Event.TOUCH_START, this, this.onTogglePause);
        pauseBtn.on(Event.MOUSE_DOWN, this, this.onTogglePause);

        const centerY = hudH * 0.5;
        const timerIcon = new Laya.Sprite();
        timerIcon.pos(hudW * 0.31, centerY - btnSize * 0.48);
        timerIcon.size(btnSize * 0.82, btnSize * 0.82);
        this.hudSprite.addChild(timerIcon);
        this.loadSpriteImage(timerIcon, this.ASSET.iconTimer, timerIcon.width, timerIcon.height);

        this.timerText = this.makeText("00:00", timerIcon.x + timerIcon.width + 8, centerY - 24, 120, 48, 30, "#F8F3CF", true, "#4A351A");
        this.hudSprite.addChild(this.timerText);

        const targetIcon = new Laya.Sprite();
        targetIcon.pos(hudW * 0.56, centerY - btnSize * 0.48);
        targetIcon.size(btnSize * 0.82, btnSize * 0.82);
        this.hudSprite.addChild(targetIcon);
        this.loadSpriteImage(targetIcon, this.ASSET.iconTarget, targetIcon.width, targetIcon.height);

        this.targetText = this.makeText("1", targetIcon.x + targetIcon.width + 8, centerY - 24, 90, 48, 30, "#F8F3CF", true, "#4A351A");
        this.hudSprite.addChild(this.targetText);

        this.hudBottom = this.topY + hudH;
    }

    private createGridPanelAndCells(): void {
        const panelW = Math.min(this.width * 0.9, 680);
        const panelH = Math.min(this.height * 0.64, 920);
        const panelX = (this.width - panelW) * 0.5;
        const panelY = this.hudBottom + 20;

        this.gridPanel = new Laya.Sprite();
        this.gridPanel.pos(panelX, panelY);
        this.gridPanel.size(panelW, panelH);
        this.addChild(this.gridPanel);
        this.loadSpriteImage(this.gridPanel, this.ASSET.panel, panelW, panelH);

        this.gridLayer = new Laya.Sprite();
        this.gridLayer.pos(36, 44);
        this.gridPanel.addChild(this.gridLayer);

        this.cells = [];
        const n = this.currentDifficulty;
        const innerW = panelW - 72;
        const innerH = panelH - 92;
        const gap = Math.max(8, Math.floor(panelW * 0.01));
        const cellSize = Math.floor(Math.min((innerW - gap * (n - 1)) / n, (innerH - gap * (n - 1)) / n));

        const gridW = cellSize * n + gap * (n - 1);
        const gridH = cellSize * n + gap * (n - 1);
        this.gridLayer.pos((panelW - gridW) * 0.5, (panelH - gridH) * 0.5 + 6);

        const numbers = this.shuffle(this.range(1, n * n));
        let idx = 0;

        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const value = numbers[idx++];
                const cell = new Laya.Sprite() as CellNode;
                cell.value = value;
                cell.state = "normal";
                cell.locked = false;
                cell.size(cellSize, cellSize);
                cell.pos(c * (cellSize + gap), r * (cellSize + gap));
                cell.mouseEnabled = true;
                this.gridLayer.addChild(cell);

                cell.label = this.makeText(String(value), 0, 0, cellSize, cellSize, Math.max(22, Math.floor(cellSize * 0.34)), "#2F2415", true, "#FFF8E4");
                cell.addChild(cell.label);

                this.applyCellState(cell, "normal");
                cell.on(Event.TOUCH_START, this, this.onTapCell, [cell]);
                cell.on(Event.MOUSE_DOWN, this, this.onTapCell, [cell]);

                this.cells.push(cell);
            }
        }

        this.updateActiveCell();
    }

    private onTapCell(cell: CellNode): void {
        if (!this._isPlaying || this._isPaused || !cell || cell.locked) {
            return;
        }

        if (cell.value === this._currentNumber) {
            this.onCorrect(cell);
        } else {
            this.onWrong(cell);
        }
    }

    private onCorrect(cell: CellNode): void {
        cell.locked = true;
        this.applyCellState(cell, "correct");
        this.playRipple(cell);

        this._currentNumber++;
        if (this._currentNumber > this._totalNumbers) {
            this.onCompleted();
            return;
        }

        this.updateTargetText();
        this.updateActiveCell();
    }

    private onWrong(cell: CellNode): void {
        this._errors++;
        this.applyCellState(cell, "wrong");
        this.playRipple(cell);

        this.timer.once(200, this, () => {
            if (!cell.destroyed && !cell.locked) {
                if (cell === this.activeCell) {
                    this.applyCellState(cell, "active");
                } else {
                    this.applyCellState(cell, "normal");
                }
            }
        });
    }

    private updateActiveCell(): void {
        if (this.activeCell && !this.activeCell.destroyed && !this.activeCell.locked) {
            Laya.Tween.clearAll(this.activeCell);
            this.activeCell.scale(1, 1);
            this.applyCellState(this.activeCell, "normal");
        }

        this.activeCell = this.cells.find((c) => c.value === this._currentNumber && !c.locked) || null;
        if (!this.activeCell) {
            return;
        }

        this.applyCellState(this.activeCell, "active");
        this.loopActiveBreath(this.activeCell);
    }

    private loopActiveBreath(cell: CellNode): void {
        if (!cell || cell.destroyed || cell.locked || cell !== this.activeCell) {
            return;
        }
        Laya.Tween.clearAll(cell);
        cell.scale(1, 1);
        Laya.Tween.to(cell, { scaleX: 1.04, scaleY: 1.04 }, 380, null, Laya.Handler.create(this, () => {
            if (!cell || cell.destroyed || cell.locked || cell !== this.activeCell) {
                return;
            }
            Laya.Tween.to(cell, { scaleX: 1.0, scaleY: 1.0 }, 380, null, Laya.Handler.create(this, () => {
                this.loopActiveBreath(cell);
            }));
        }));
    }

    private onCompleted(): void {
        this._isPlaying = false;
        this.playConfetti();
        this.showCompletePopup();
    }

    private showCompletePopup(): void {
        if (this.completeOverlay) {
            this.completeOverlay.destroy();
        }
        this.completeOverlay = new Laya.Sprite();
        this.completeOverlay.size(this.width, this.height);
        this.completeOverlay.graphics.drawRect(0, 0, this.width, this.height, "rgba(0,0,0,0.45)");
        this.addChild(this.completeOverlay);

        const panelW = Math.min(520, this.width * 0.76);
        const panelH = 300;
        const panel = new Laya.Sprite();
        panel.pos((this.width - panelW) * 0.5, (this.height - panelH) * 0.5);
        panel.size(panelW, panelH);
        panel.graphics.drawRoundRect(0, 0, panelW, panelH, 20, "#FFF2D6", "#D9B785", 4);
        this.completeOverlay.addChild(panel);

        const title = this.makeText("挑战完成", 0, 36, panelW, 56, 40, "#5D3B1A", true, "#FFFFFF");
        panel.addChild(title);

        const elapsedSec = Math.floor((Laya.timer.currTimer - this._startTime) / 1000);
        const info = this.makeText(`用时 ${elapsedSec}s   错误 ${this._errors} 次`, 0, 114, panelW, 44, 28, "#6D4D2D", false, "#FFFFFF");
        panel.addChild(info);

        const okBtn = new Laya.Sprite();
        okBtn.pos((panelW - 220) * 0.5, 206);
        okBtn.size(220, 64);
        okBtn.mouseEnabled = true;
        okBtn.graphics.drawRoundRect(0, 0, 220, 64, 16, "#FF9B49", "#C56A2A", 3);
        panel.addChild(okBtn);
        okBtn.addChild(this.makeText("返回菜单", 0, 0, 220, 64, 30, "#FFFFFF", true, "#8A3A10"));
        okBtn.on(Event.TOUCH_START, this, this.onBack);
        okBtn.on(Event.MOUSE_DOWN, this, this.onBack);
    }

    private playRipple(cell: CellNode): void {
        const ripple = new Laya.Sprite();
        const size = Math.max(48, cell.width * 0.72);
        ripple.size(size, size);
        ripple.pivot(size * 0.5, size * 0.5);
        ripple.pos(cell.x + cell.width * 0.5, cell.y + cell.height * 0.5);
        ripple.alpha = 0.85;
        this.gridLayer.addChild(ripple);

        this.loadSpriteImage(ripple, this.ASSET.ripple, size, size);
        ripple.scale(0.55, 0.55);
        Laya.Tween.to(ripple, { scaleX: 1.35, scaleY: 1.35, alpha: 0 }, 260, null, Laya.Handler.create(this, () => {
            ripple.destroy();
        }));
    }

    private playConfetti(): void {
        const emitCount = 20;
        for (let i = 0; i < emitCount; i++) {
            const c = new Laya.Sprite();
            const s = 26 + Math.random() * 24;
            c.size(s, s);
            c.pos(30 + Math.random() * (this.width - 60), this.hudBottom + Math.random() * 120);
            this.addChild(c);
            this.loadSpriteImage(c, this.ASSET.confetti, s, s);
            c.rotation = Math.random() * 180;
            Laya.Tween.to(c, {
                y: c.y + 320 + Math.random() * 220,
                x: c.x + (-90 + Math.random() * 180),
                alpha: 0,
                rotation: c.rotation + 180 + Math.random() * 180
            }, 1200 + Math.random() * 600, null, Laya.Handler.create(this, () => {
                c.destroy();
            }));
        }
    }

    private onTogglePause(): void {
        if (!this._isPlaying) {
            return;
        }
        this._isPaused = !this._isPaused;
    }

    private updateTimerText(): void {
        if (!this.timerText) {
            return;
        }
        const elapsed = Math.max(0, Laya.timer.currTimer - this._startTime);
        const sec = Math.floor(elapsed / 1000);
        const mm = Math.floor(sec / 60).toString().padStart(2, "0");
        const ss = (sec % 60).toString().padStart(2, "0");
        this.timerText.text = `${mm}:${ss}`;
    }

    private updateTargetText(): void {
        if (this.targetText) {
            this.targetText.text = `${Math.min(this._currentNumber, this._totalNumbers)}`;
        }
    }

    private tickTimer(): void {
        if (!this._isPlaying) {
            return;
        }
        if (!this._isPaused) {
            this.updateTimerText();
        }
        this.timer.frameOnce(6, this, this.tickTimer);
    }

    private onBack(): void {
        const main = new Main();
        Laya.stage.addChild(main);
        this.destroy();
    }

    private applyCellState(cell: CellNode, state: "normal" | "active" | "correct" | "wrong"): void {
        cell.state = state;
        let path = this.ASSET.cellNormal;
        if (state === "active") {
            path = this.ASSET.cellActive;
        } else if (state === "correct") {
            path = this.ASSET.cellCorrect;
        } else if (state === "wrong") {
            path = this.ASSET.cellWrong;
        }
        this.loadSpriteImage(cell, path, cell.width, cell.height);
    }

    private makeText(
        text: string,
        x: number,
        y: number,
        width: number,
        height: number,
        fontSize: number,
        color: string,
        bold: boolean,
        strokeColor: string
    ): Laya.Text {
        const t = new Laya.Text();
        t.text = text;
        t.x = x;
        t.y = y;
        t.width = width;
        t.height = height;
        t.align = "center";
        t.valign = "middle";
        t.fontSize = fontSize;
        t.color = color;
        t.font = "Microsoft YaHei";
        t.bold = bold;
        t.stroke = 3;
        t.strokeColor = strokeColor;
        return t;
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

    private loadCoverImage(sp: Laya.Sprite, assetPath: string, targetW: number, targetH: number): void {
        const candidates = this.getAssetCandidates(assetPath);
        this.tryLoad(sp, candidates, 0, () => {
            const tex = sp.texture;
            if (!tex) {
                return;
            }
            const tw = tex.sourceWidth || tex.width || targetW;
            const th = tex.sourceHeight || tex.height || targetH;
            const scale = Math.max(targetW / tw, targetH / th);
            const rw = tw * scale;
            const rh = th * scale;
            sp.size(rw, rh);
            sp.pos((targetW - rw) * 0.5, (targetH - rh) * 0.5);
        });
    }

    private loadSpriteImage(sp: Laya.Sprite, assetPath: string, w: number, h: number): void {
        const candidates = this.getAssetCandidates(assetPath);
        this.tryLoad(sp, candidates, 0, () => {
            sp.size(w, h);
        }, w, h);
    }

    private tryLoad(
        sp: Laya.Sprite,
        candidates: string[],
        index: number,
        onLoaded: () => void,
        w?: number,
        h?: number
    ): void {
        if (index >= candidates.length) {
            return;
        }

        const path = candidates[index];
        sp.graphics.clear();
        sp.off(Event.ERROR, this, null);
        sp.once(Event.ERROR, this, () => {
            this.tryLoad(sp, candidates, index + 1, onLoaded, w, h);
        });

        sp.loadImage(path, 0, 0, w || 0, h || 0, Laya.Handler.create(this, () => {
            if (!sp.texture) {
                this.tryLoad(sp, candidates, index + 1, onLoaded, w, h);
                return;
            }
            onLoaded();
        }));
    }

    private getAssetCandidates(path: string): string[] {
        return [
            path,
            path.replace(/^assets\//, ""),
            `./${path}`
        ];
    }

    onDestroy(): void {
        this.timer.clear(this, this.tickTimer);
        if (this.activeCell) {
            Laya.Tween.clearAll(this.activeCell);
        }
        this.cells.forEach((c) => {
            c.off(Event.TOUCH_START, this, this.onTapCell);
            c.off(Event.MOUSE_DOWN, this, this.onTapCell);
            c.destroy();
        });
        this.cells = [];
    }
}
