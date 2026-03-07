const { regClass, Event } = Laya;

import { GridCell } from "./GridCell";

/**
 * 舒尔特方格游戏主场景
 * 星空紫蓝主题 - 100%还原设计稿
 */
@regClass("game_scene", "../src/GameScene.ts")
export class GameScene extends Laya.Scene {
    public currentDifficulty: number = 4;  // 接收Main传递的难度

    // 网格尺寸配置
    private GRID_SIZES: { [key: number]: { rows: number; cols: number } } = {
        3: { rows: 3, cols: 3 },
        4: { rows: 4, cols: 4 },
        5: { rows: 5, cols: 5 }
    };

    // 设计稿尺寸
    private static CELL_SPACING: number = 6;  // 设计稿是6px
    private static PANEL_SIZE: number = 320;  // 设计稿是320x320

    // 游戏状态
    private _currentSize: number = 4;  // 默认4x4
    private _currentNumber: number = 1;
    private _totalNumbers: number = 16;
    private _startTime: number = 0;
    private _errors: number = 0;
    private _isPlaying: boolean = false;
    private _showHints: boolean = false;

    // 容器
    private bgLayer: Laya.Sprite = null;
    private gridContainer: Laya.Sprite = null;
    private uiContainer: Laya.Sprite = null;
    private fxContainer: Laya.Sprite = null;

    // HUD元素
    private hudPanel: Laya.Sprite = null;
    private targetText: Laya.Text = null;
    private timerText: Laya.Text = null;
    private errorText: Laya.Text = null;

    // 按钮
    private difficultyBtns: { [key: number]: Laya.Sprite } = {};
    private startBtn: Laya.Sprite = null;
    private hintBtn: Laya.Sprite = null;

    // 装饰
    private titleText: Laya.Text = null;
    private cells: GridCell[] = [];
    private _timerRunning: boolean = false;

    onAwake(): void {
        // 使用Main传递的难度
        if (this.currentDifficulty >= 3 && this.currentDifficulty <= 5) {
            this._currentSize = this.currentDifficulty;
            this._totalNumbers = this._currentSize * this._currentSize;
        }

        // 设置场景大小
        this.size(Laya.stage.width, Laya.stage.height);

        // Scene 本身就是容器
        this.gridContainer = this;

        this.bgLayer = new Laya.Sprite();
        this.gridContainer.addChild(this.bgLayer);

        this.uiContainer = new Laya.Sprite();
        this.gridContainer.addChild(this.uiContainer);

        this.fxContainer = new Laya.Sprite();
        this.gridContainer.addChild(this.fxContainer);

        this.createBackground();
        this.createTitle();
        this.createHudPanel();
        this.createDifficultyButtons();
        this.createActionButtons();
        this.createLegend();
        this.layoutUI();

        Laya.timer.frameLoop(1, this, this.updateTimer);
    }

    private createBackground(): void {
        const w = Laya.stage.width;
        const h = Laya.stage.height;

        // 设计稿背景：深色渐变
        this.bgLayer.graphics.drawRect(0, 0, w, h, "#0D0B1E");

        // 顶部紫光
        const topGlow = new Laya.Sprite();
        topGlow.graphics.drawCircle(w/2, -100, 400, "rgba(139, 92, 246, 0.25)");
        this.bgLayer.addChild(topGlow);

        // 底部蓝光
        const bottomGlow = new Laya.Sprite();
        bottomGlow.graphics.drawCircle(w/2, h + 100, 350, "rgba(59, 130, 246, 0.2)");
        this.bgLayer.addChild(bottomGlow);

        // 叠加渐变层
        const overlay = new Laya.Sprite();
        overlay.graphics.drawRect(0, 0, w, h, "rgba(88, 28, 135, 0.15)");
        this.bgLayer.addChild(overlay);

        // 添加星星
        this.createStars();
    }

    private createStars(): void {
        const starPositions = [
            { x: 0.08, y: 0.15 }, { x: 0.25, y: 0.08 }, { x: 0.70, y: 0.20 },
            { x: 0.85, y: 0.12 }, { x: 0.15, y: 0.25 }, { x: 0.55, y: 0.18 },
            { x: 0.90, y: 0.30 }, { x: 0.05, y: 0.35 }, { x: 0.45, y: 0.05 },
            { x: 0.35, y: 0.22 }
        ];

        starPositions.forEach((pos, i) => {
            const star = new Laya.Sprite();
            const size = i % 2 === 0 ? 2 : 1.5;
            star.graphics.drawCircle(0, 0, size, "rgba(255, 255, 255, 0.7)");
            star.pos(pos.x * Laya.stage.width, pos.y * Laya.stage.height);
            this.bgLayer.addChild(star);
            this.animateStar(star, 0.7, i * 0.2);
        });
    }

    private animateStar(star: Laya.Sprite, baseAlpha: number, delay: number): void {
        Laya.timer.once(delay * 1000, this, () => {
            const loop = () => {
                const duration = 1500 + Math.random() * 1500;
                Laya.Tween.to(star, { alpha: baseAlpha * 0.3 }, duration, Laya.Ease.sineInOut,
                    Laya.Handler.create(this, () => {
                        Laya.Tween.to(star, { alpha: baseAlpha }, duration, Laya.Ease.sineInOut,
                            Laya.Handler.create(this, loop)));
                    }));
            };
            loop();
        });
    }

    private createTitle(): void {
        this.titleText = new Laya.Text();
        this.titleText.text = "舒尔特方格";
        this.titleText.fontSize = 24;
        this.titleText.font = "Microsoft YaHei";
        this.titleText.bold = true;
        this.titleText.color = "#F8F3CF";
        this.titleText.stroke = 3;
        this.titleText.strokeColor = "rgba(0, 0, 0, 0.5)";
        this.titleText.align = "center";
        this.uiContainer.addChild(this.titleText);
    }

    private createHudPanel(): void {
        const w = Laya.stage.width;
        const panelW = 340;  // 设计稿尺寸
        const panelH = 90;   // 设计稿尺寸
        const panelY = 75;   // 设计稿位置

        this.hudPanel = new Laya.Sprite();
        this.hudPanel.pos((w - panelW) / 2, panelY);
        this.hudPanel.size(panelW, panelH);

        // 设计稿：玻璃拟态背景
        this.hudPanel.graphics.drawRoundRect(0, 0, panelW, panelH, 16, "rgba(255, 255, 255, 0.06)", "rgba(255, 255, 255, 0.12)", 2);
        // 内发光
        this.hudPanel.graphics.drawRoundRect(4, 4, panelW - 8, panelH - 8, 14, null, "rgba(139, 92, 246, 0.15)", 1);

        this.uiContainer.addChild(this.hudPanel);

        // 目标/用时/错误
        this.createHudItem("目标", "1", "#FFD700", 0);
        this.createHudItem("用时", "00:00", "#4FC3F7", 1);
        this.createHudItem("错误", "0", "#FF6B6B", 2);
    }

    private createHudItem(label: string, value: string, color: string, index: number): void {
        const panelW = this.hudPanel.width;
        const itemW = panelW / 3;
        const x = index * itemW;

        // 标签
        const labelText = new Laya.Text();
        labelText.text = label;
        labelText.fontSize = 12;
        labelText.color = "rgba(255, 255, 255, 0.6)";
        labelText.font = "Microsoft YaHei";
        labelText.pos(x + itemW / 2, 14);
        labelText.align = "center";
        this.hudPanel.addChild(labelText);

        // 数值
        const valueText = new Laya.Text();
        valueText.text = value;
        valueText.fontSize = 26;
        valueText.font = "Microsoft YaHei";
        valueText.bold = true;
        valueText.color = color;
        valueText.stroke = 2;
        valueText.strokeColor = "rgba(0, 0, 0, 0.3)";
        valueText.pos(x + itemW / 2, 34);
        valueText.align = "center";
        this.hudPanel.addChild(valueText);

        if (label === "目标") this.targetText = valueText;
        else if (label === "用时") this.timerText = valueText;
        else if (label === "错误") this.errorText = valueText;
    }

    private createDifficultyButtons(): void {
        const w = Laya.stage.width;
        const btns = [3, 4, 5];
        const btnW = 65;   // 设计稿尺寸
        const btnH = 38;   // 设计稿尺寸
        const spacing = 16;
        const totalW = btns.length * btnW + (btns.length - 1) * spacing;
        let xOffset = (w - totalW) / 2;

        btns.forEach(size => {
            const btn = this.createStyledButton(size + "×" + size, btnW, btnH, size === this._currentSize);
            btn.pos(xOffset, 185);  // 设计稿位置
            btn.name = "diff_" + size;
            (btn as any).userData = { gridSize: size };
            btn.on(Event.TOUCH_START, this, () => { this.selectDifficulty(size); });
            this.difficultyBtns[size] = btn;
            this.uiContainer.addChild(btn);
            xOffset += btnW + spacing;
        });
    }

    private createStyledButton(text: string, w: number, h: number, selected: boolean): Laya.Sprite {
        const btn = new Laya.Sprite();
        btn.size(w, h);

        // 设计稿按钮样式
        if (selected) {
            // 选中：渐变紫色
            btn.graphics.drawRoundRect(0, 0, w, h, 8, "#8B5CF6", "#6D28D9", 2);
        } else {
            // 未选中：半透明
            btn.graphics.drawRoundRect(0, 0, w, h, 8, "rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.2)", 2);
        }

        const textNode = new Laya.Text();
        textNode.text = text;
        textNode.fontSize = 14;
        textNode.font = "Microsoft YaHei";
        textNode.bold = true;
        textNode.color = "#FFFFFF";
        textNode.align = "center";
        textNode.valign = "middle";
        textNode.width = w;
        textNode.height = h;
        btn.addChild(textNode);

        btn.mouseEnabled = true;
        return btn;
    }

    private selectDifficulty(size: number): void {
        Object.keys(this.difficultyBtns).forEach(key => {
            const btn = this.difficultyBtns[parseInt(key)];
            const isSelected = parseInt(key) === size;
            const w = btn.width;
            const h = btn.height;
            btn.graphics.clear();

            if (isSelected) {
                btn.graphics.drawRoundRect(0, 0, w, h, 8, "#8B5CF6", "#6D28D9", 2);
            } else {
                btn.graphics.drawRoundRect(0, 0, w, h, 8, "rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.2)", 2);
            }
        });

        this._currentSize = size;
        this._totalNumbers = size * size;
    }

    private createActionButtons(): void {
        const w = Laya.stage.width;

        // 设计稿按钮：200x54, bottom: 80px
        this.startBtn = this.createMainButton("开始游戏", 200, 54);
        this.startBtn.pos((w - 200) / 2, Laya.stage.height - 134);
        this.startBtn.on(Event.TOUCH_START, this, this.onStartGame);
        this.uiContainer.addChild(this.startBtn);

        // 提示按钮 - 设计稿位置 right:20px, top:185px
        this.hintBtn = this.createSmallButton("提示: 关", 80, 34);
        this.hintBtn.pos(w - 100, 185);
        this.hintBtn.on(Event.TOUCH_START, this, this.onToggleHint);
        this.uiContainer.addChild(this.hintBtn);
    }

    private createLegend(): void {
        const w = Laya.stage.width;
        const legendItems = [
            { label: "待点", color: "#6366F1" },
            { label: "正确", color: "#FFD700" },
            { label: "错误", color: "#EF4444" }
        ];

        const dotSize = 10;
        const gap = 16;
        const fontSize = 11;

        // 计算整体宽度
        let totalWidth = 0;
        legendItems.forEach((item, i) => {
            // 每个项目：dot + 间距 + 文字
            const textWidth = item.label.length * fontSize * 0.6;  // 估算文字宽度
            totalWidth += dotSize + 6 + textWidth;
            if (i < legendItems.length - 1) totalWidth += gap;
        });

        let xOffset = (w - totalWidth) / 2;
        const y = Laya.stage.height - 20 - fontSize;  // bottom: 20px

        legendItems.forEach((item) => {
            // 小圆点
            const dot = new Laya.Sprite();
            dot.graphics.drawRoundRect(0, 0, dotSize, dotSize, 3, item.color);
            dot.pos(xOffset, y + fontSize / 2 - dotSize / 2);
            this.uiContainer.addChild(dot);

            xOffset += dotSize + 6;

            // 文字
            const text = new Laya.Text();
            text.text = item.label;
            text.fontSize = fontSize;
            text.font = "Microsoft YaHei";
            text.color = "rgba(255, 255, 255, 0.5)";
            text.pos(xOffset, y);
            this.uiContainer.addChild(text);

            xOffset += item.label.length * fontSize * 0.6 + gap;
        });
    }

    private createMainButton(text: string, w: number, h: number): Laya.Sprite {
        const btn = new Laya.Sprite();
        btn.size(w, h);
        btn.mouseEnabled = true;

        // 设计稿：渐变紫色，圆角27px
        btn.graphics.drawRoundRect(0, 0, w, h, h/2, "#8B5CF6", "#6D28D9", 2);
        // 高光
        btn.graphics.drawRoundRect(4, 4, w - 8, h/2 - 4, h/4, "rgba(255, 255, 255, 0.15)", null, 0);

        const textNode = new Laya.Text();
        textNode.text = text;
        textNode.fontSize = 20;
        textNode.font = "Microsoft YaHei";
        textNode.bold = true;
        textNode.color = "#FFFFFF";
        textNode.stroke = 2;
        textNode.strokeColor = "rgba(0, 0, 0, 0.2)";
        textNode.align = "center";
        textNode.valign = "middle";
        textNode.width = w;
        textNode.height = h;
        btn.addChild(textNode);

        return btn;
    }

    private createSmallButton(text: string, w: number, h: number): Laya.Sprite {
        const btn = new Laya.Sprite();
        btn.size(w, h);
        btn.mouseEnabled = true;

        btn.graphics.drawRoundRect(0, 0, w, h, h/2, "rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.2)", 1);

        const textNode = new Laya.Text();
        textNode.text = text;
        textNode.fontSize = 12;
        textNode.font = "Microsoft YaHei";
        textNode.color = "#FFFFFF";
        textNode.align = "center";
        textNode.valign = "middle";
        textNode.width = w;
        textNode.height = h;
        btn.addChild(textNode);

        return btn;
    }

    private layoutUI(): void {
        const w = Laya.stage.width;
        if (this.titleText) {
            this.titleText.pos(w / 2, 30);
        }
    }

    private onStartGame(): void {
        if (this._isPlaying) return;

        this._currentNumber = 1;
        this._totalNumbers = this._currentSize * this._currentSize;
        this._errors = 0;
        this._startTime = Laya.timer.currTimer;
        this._isPlaying = true;
        this._timerRunning = true;

        this.updateTargetDisplay();
        this.updateErrorDisplay();

        // 隐藏元素
        Object.values(this.difficultyBtns).forEach(btn => { btn.visible = false; });
        if (this.startBtn) this.startBtn.visible = false;
        if (this.hintBtn) this.hintBtn.visible = false;
        if (this.titleText) this.titleText.visible = false;

        this.createGrid();
    }

    private createGrid(): void {
        this.cells.forEach(cell => { cell.off(Event.TOUCH_START, this, null); cell.destroy(); });
        this.cells = [];

        const gameLayer = this.gridContainer.getChildByName("gameLayer") as Laya.Sprite;
        if (gameLayer) gameLayer.destroy();

        const gameLayerNew = new Laya.Sprite();
        gameLayerNew.name = "gameLayer";
        this.gridContainer.addChild(gameLayerNew);

        // 设计稿：320x320面板, top: 245px
        const panelSize = 320;
        const panelX = (Laya.stage.width - panelSize) / 2;
        const panelY = 245;

        // 面板阴影
        const shadow = new Laya.Sprite();
        shadow.graphics.drawRoundRect(panelX + 6, panelY + 6, panelSize, panelSize, 24, "rgba(0, 0, 0, 0.4)");
        gameLayerNew.addChild(shadow);

        // 面板背景 - 设计稿颜色
        const panel = new Laya.Sprite();
        panel.graphics.drawRoundRect(panelX, panelY, panelSize, panelSize, 24, "#1E1B4B", "#312E81", 3);
        gameLayerNew.addChild(panel);

        // 面板内发光
        const innerGlow = new Laya.Sprite();
        innerGlow.graphics.drawRoundRect(panelX + 6, panelY + 6, panelSize - 12, panelSize - 12, 20, null, "rgba(139, 92, 246, 0.25)", 1);
        gameLayerNew.addChild(innerGlow);

        // 装饰角标
        this.createPanelDecorations(panelX, panelY, panelSize);

        const { rows, cols } = this.GRID_SIZES[this._currentSize];
        const spacing = GameScene.CELL_SPACING;  // 6px
        const padding = 16;
        const cellSize = Math.floor((panelSize - padding * 2 - spacing * (cols - 1)) / cols);

        const gridW = cols * cellSize + (cols - 1) * spacing;
        const gridH = rows * cellSize + (rows - 1) * spacing;
        const startX = panelX + padding + (panelSize - padding * 2 - gridW) / 2;
        const startY = panelY + padding + (panelSize - padding * 2 - gridH) / 2;

        const numbers = this.generateNumbers(this._totalNumbers);
        const shuffled = this.fisherYatesShuffle(numbers);

        let index = 0;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const number = shuffled[index++];
                const cell = new GridCell(number, this._currentNumber);
                cell.setCellSize(cellSize);
                cell.x = startX + col * (cellSize + spacing);
                cell.y = startY + row * (cellSize + spacing);
                cell.on(Event.TOUCH_START, this, (e: Event) => { this.onCellClick(cell); });
                gameLayerNew.addChild(cell);
                this.cells.push(cell);
            }
        }

        // 设置当前目标高亮
        this.updateActiveCell();
    }

    private createPanelDecorations(x: number, y: number, size: number): void {
        const gameLayer = this.gridContainer.getChildByName("gameLayer") as Laya.Sprite;
        if (!gameLayer) return;

        const cornerSize = 24;
        const cornerColor = "rgba(139, 92, 246, 0.6)";

        // 左上
        const tl = new Laya.Sprite();
        tl.graphics.drawPath(0, 0, [["moveTo", 0, cornerSize], ["lineTo", 0, 0], ["lineTo", cornerSize, 0]], null, cornerColor);
        tl.pos(x + 8, y + 8);
        gameLayer.addChild(tl);

        // 右上
        const tr = new Laya.Sprite();
        tr.graphics.drawPath(0, 0, [["moveTo", 0, 0], ["lineTo", cornerSize, 0], ["lineTo", cornerSize, cornerSize]], null, cornerColor);
        tr.pos(x + size - 8 - cornerSize, y + 8);
        gameLayer.addChild(tr);

        // 左下
        const bl = new Laya.Sprite();
        bl.graphics.drawPath(0, 0, [["moveTo", 0, 0], ["lineTo", 0, cornerSize], ["lineTo", cornerSize, cornerSize]], null, cornerColor);
        bl.pos(x + 8, y + size - 8 - cornerSize);
        gameLayer.addChild(bl);

        // 右下
        const br = new Laya.Sprite();
        br.graphics.drawPath(0, 0, [["moveTo", cornerSize, 0], ["lineTo", cornerSize, cornerSize], ["lineTo", 0, cornerSize]], null, cornerColor);
        br.pos(x + size - 8 - cornerSize, y + size - 8 - cornerSize);
        gameLayer.addChild(br);
    }

    private generateNumbers(count: number): number[] {
        const numbers: number[] = [];
        for (let i = 1; i <= count; i++) { numbers.push(i); }
        return numbers;
    }

    private fisherYatesShuffle(array: number[]): number[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    private updateActiveCell(): void {
        // 清除之前的active状态
        this.cells.forEach(cell => cell.setHighlight(false));

        // 设置当前目标高亮
        const activeCell = this.cells.find(c => c.getNumber() === this._currentNumber);
        if (activeCell) {
            activeCell.setHighlight(true);
        }
    }

    private onCellClick(cell: GridCell): void {
        if (!this._isPlaying) return;

        const number = cell.getNumber();
        if (number === this._currentNumber) {
            this.onCorrectClick(cell);
        } else {
            this.onErrorClick(cell);
        }
    }

    private onCorrectClick(cell: GridCell): void {
        cell.markCompleted();
        this.playCorrectEffect(cell);
        this._currentNumber++;

        if (this._currentNumber > this._totalNumbers) {
            this.onGameCompleted();
        } else {
            this.updateTargetDisplay();
            this.updateActiveCell();
        }
    }

    private onErrorClick(cell: GridCell): void {
        this._errors++;
        this.updateErrorDisplay();
        cell.showError();
        this.playErrorEffect();
        this.showCenterText("错误!", "#FF6B6B", 600);
    }

    private playCorrectEffect(cell: GridCell): void {
        const glow = new Laya.Sprite();
        const size = cell.width + 30;
        glow.graphics.drawCircle(size/2, size/2, size/2, "rgba(139, 92, 246, 0.4)");
        glow.size(size, size);
        glow.pivot(size/2, size/2);
        glow.pos(cell.x + cell.width/2, cell.y + cell.height/2);
        const gameLayer = this.gridContainer.getChildByName("gameLayer") as Laya.Sprite;
        if (gameLayer) {
            gameLayer.addChild(glow);
            Laya.Tween.to(glow, { scaleX: 1.5, scaleY: 1.5, alpha: 0 }, 400, null,
                Laya.Handler.create(this, () => glow.destroy()));
        }
    }

    private playErrorEffect(): void {
        if (this.gridContainer) {
            const originalX = this.gridContainer.x;
            Laya.Tween.to(this.gridContainer, { x: originalX - 8 }, 50, null,
                Laya.Handler.create(this, () => {
                    Laya.Tween.to(this.gridContainer, { x: originalX + 8 }, 50, null,
                        Laya.Handler.create(this, () => {
                            Laya.Tween.to(this.gridContainer, { x: originalX - 4 }, 50, null,
                                Laya.Handler.create(this, () => {
                                    Laya.Tween.to(this.gridContainer, { x: originalX }, 50, null);
                                }));
                        }));
                }));
        }
    }

    private updateTargetDisplay(): void {
        if (this.targetText) {
            this.targetText.text = this._currentNumber + "";
        }
    }

    private updateErrorDisplay(): void {
        if (this.errorText) {
            this.errorText.text = this._errors.toString();
        }
    }

    private updateTimer(): void {
        if (!this._isPlaying || !this._timerRunning) return;
        const elapsed = Laya.timer.currTimer - this._startTime;
        const timeStr = this.formatTime(elapsed);
        if (this.timerText) this.timerText.text = timeStr;
    }

    private formatTime(ms: number): string {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0");
    }

    private onGameCompleted(): void {
        this._isPlaying = false;
        this._timerRunning = false;
        const elapsed = Laya.timer.currTimer - this._startTime;
        this.playCompletionEffect();
        this.showCompletePopup(elapsed);
    }

    private playCompletionEffect(): void {
        const colors = ["#FFD700", "#FF6B6B", "#4FC3F7", "#A78BFA", "#4ADE80"];
        for (let i = 0; i < 15; i++) {
            const particle = new Laya.Sprite();
            const size = 8 + Math.random() * 8;
            particle.graphics.drawCircle(size/2, size/2, size/2, colors[i % colors.length]);
            particle.size(size, size);
            particle.pos(Math.random() * Laya.stage.width, Laya.stage.height * 0.3 + Math.random() * 100);
            this.fxContainer.addChild(particle);

            Laya.Tween.to(particle, {
                y: particle.y + 150 + Math.random() * 100,
                x: particle.x + (Math.random() - 0.5) * 100,
                alpha: 0,
                rotation: Math.random() * 360
            }, 800 + Math.random() * 400, null, Laya.Handler.create(this, () => particle.destroy()));
        }
    }

    private showCompletePopup(timeMs: number): void {
        const w = Laya.stage.width;
        const popupW = 280;
        const popupH = 200;
        const popupX = (w - popupW) / 2;
        const popupY = (Laya.stage.height - popupH) / 2;

        const overlay = new Laya.Sprite();
        overlay.graphics.drawRect(0, 0, Laya.stage.width, Laya.stage.height, "rgba(0, 0, 0, 0.65)");
        overlay.on(Event.TOUCH_START, this, () => {});
        this.fxContainer.addChild(overlay);

        const panel = new Laya.Sprite();
        panel.pos(popupX, popupY);
        panel.graphics.drawRoundRect(0, 0, popupW, popupH, 20, "#1E1B4B", "#4C1D95", 3);
        this.fxContainer.addChild(panel);

        const title = new Laya.Text();
        title.text = "挑战完成!";
        title.fontSize = 28;
        title.font = "Microsoft YaHei";
        title.bold = true;
        title.color = "#FFD700";
        title.stroke = 2;
        title.strokeColor = "rgba(0, 0, 0, 0.3)";
        title.align = "center";
        title.pos(popupW / 2, 24);
        panel.addChild(title);

        const elapsedSec = Math.floor(timeMs / 1000);
        const resultText = new Laya.Text();
        resultText.text = `用时: ${elapsedSec}秒\n错误: ${this._errors}次`;
        resultText.fontSize = 16;
        resultText.font = "Microsoft YaHei";
        resultText.color = "#E0E7FF";
        resultText.align = "center";
        resultText.leading = 8;
        resultText.pos(popupW / 2, 75);
        panel.addChild(resultText);

        const btnW = 140;
        const btnH = 44;
        const btn = new Laya.Sprite();
        btn.pos((popupW - btnW) / 2, 140);
        btn.graphics.drawRoundRect(0, 0, btnW, btnH, 22, "#8B5CF6", "#6D28D9", 2);
        btn.mouseEnabled = true;
        panel.addChild(btn);

        const btnText = new Laya.Text();
        btnText.text = "再来一局";
        btnText.fontSize = 16;
        btnText.font = "Microsoft YaHei";
        btnText.bold = true;
        btnText.color = "#FFFFFF";
        btnText.align = "center";
        btnText.valign = "middle";
        btnText.width = btnW;
        btnText.height = btnH;
        btn.addChild(btnText);

        btn.on(Event.TOUCH_START, this, this.onRestartFromResult);
    }

    private onRestartFromResult(): void {
        this.clearPopup();
        Object.values(this.difficultyBtns).forEach(btn => { btn.visible = true; });
        if (this.startBtn) this.startBtn.visible = true;
        if (this.hintBtn) this.hintBtn.visible = true;
        if (this.titleText) this.titleText.visible = true;
        this.onResetGame();
    }

    private clearPopup(): void {
        this.fxContainer.removeChildren();
    }

    private onResetGame(): void {
        this._isPlaying = false;
        this._timerRunning = false;
        this._currentNumber = 1;
        this._errors = 0;
        this._startTime = 0;

        const gameLayer = this.gridContainer.getChildByName("gameLayer") as Laya.Sprite;
        if (gameLayer) gameLayer.destroy();
        this.cells = [];

        if (this.targetText) this.targetText.text = "1";
        if (this.timerText) this.timerText.text = "00:00";
        if (this.errorText) this.errorText.text = "0";
    }

    private onToggleHint(): void {
        this._showHints = !this._showHints;
        if (this.hintBtn) {
            const text = this._showHints ? "提示: 开" : "提示: 关";
            (this.hintBtn.getChildAt(0) as Laya.Text).text = text;
        }
    }

    private showCenterText(text: string, color: string, duration: number): void {
        const w = Laya.stage.width;
        const textNode = new Laya.Text();
        textNode.text = text;
        textNode.fontSize = 28;
        textNode.font = "Microsoft YaHei";
        textNode.bold = true;
        textNode.color = color;
        textNode.stroke = 3;
        textNode.strokeColor = "rgba(0, 0, 0, 0.5)";
        textNode.align = "center";
        textNode.pos(w / 2, Laya.stage.height / 2);
        this.fxContainer.addChild(textNode);
        Laya.timer.once(duration, this, () => { textNode.destroy(); });
    }

    onDestroy(): void {
        Laya.timer.clear(this, this.updateTimer);
        this.cells.forEach(cell => cell.destroy());
        this.cells = [];
    }
}