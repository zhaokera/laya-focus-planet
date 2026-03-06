const { Event } = Laya;

import { GridCell } from "./GridCell";

/**
 * 舒尔特方格专注力训练游戏主控制脚本
 * 星空紫蓝主题游戏界面
 */
export class SchulteGridGame extends Laya.Script {
    // 网格尺寸配置
    private GRID_SIZES: { [key: number]: { rows: number; cols: number } } = {
        3: { rows: 3, cols: 3 },
        4: { rows: 4, cols: 4 },
        5: { rows: 5, cols: 5 }
    };

    private static CELL_SPACING: number = 12;
    private static CELL_SIZE: number = 72;

    // 游戏状态
    private _currentSize: number = 3;
    private _currentNumber: number = 1;
    private _totalNumbers: number = 9;
    private _startTime: number = 0;
    private _errors: number = 0;
    private _isPlaying: boolean = false;
    private _showHints: boolean = false;
    private _lastFrameTime: number = 0;

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
    private resetBtn: Laya.Sprite = null;
    private hintBtn: Laya.Sprite = null;

    // 装饰
    private titleText: Laya.Text = null;
    private gridPanel: Laya.Sprite = null;

    // 格子
    private cells: GridCell[] = [];

    // 动画状态
    private _timerRunning: boolean = false;

    onStart(): void {
        this.gridContainer = this.owner as Laya.Sprite;

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
        this.layoutUI();

        Laya.timer.frameLoop(1, this, this.updateTimer);
    }

    private createBackground(): void {
        const w = Laya.stage.width;
        const h = Laya.stage.height;

        // 渐变背景 - 星空紫蓝
        this.bgLayer.graphics.drawRect(0, 0, w, h, "#0D0B1E");
        this.drawGradientBg();

        // 添加星星粒子效果
        this.createStars();
    }

    private drawGradientBg(): void {
        const w = Laya.stage.width;
        const h = Laya.stage.height;

        // 创建星空渐变背景
        const gradient = new Laya.Graphics();
        gradient.drawRect(0, 0, w, h, "#0D0B1E");
        this.bgLayer.addChild(gradient);

        // 叠加渐变层
        const overlay = new Laya.Sprite();
        overlay.graphics.drawRect(0, 0, w, h, "rgba(88, 28, 135, 0.15)");
        this.bgLayer.addChild(overlay);

        // 顶部紫光
        const topGlow = new Laya.Sprite();
        topGlow.graphics.drawCircle(w/2, -100, 400, "rgba(139, 92, 246, 0.2)");
        this.bgLayer.addChild(topGlow);

        // 底部蓝光
        const bottomGlow = new Laya.Sprite();
        bottomGlow.graphics.drawCircle(w/2, h + 100, 350, "rgba(59, 130, 246, 0.15)");
        this.bgLayer.addChild(bottomGlow);
    }

    private createStars(): void {
        const starCount = 30;
        for (let i = 0; i < starCount; i++) {
            const star = new Laya.Sprite();
            const size = 1 + Math.random() * 2;
            const x = Math.random() * Laya.stage.width;
            const y = Math.random() * Laya.stage.height;
            const alpha = 0.3 + Math.random() * 0.7;

            star.graphics.drawCircle(0, 0, size, `rgba(255, 255, 255, ${alpha})`);
            star.pos(x, y);
            this.bgLayer.addChild(star);

            // 闪烁动画
            this.animateStar(star, alpha);
        }
    }

    private animateStar(star: Laya.Sprite, baseAlpha: number): void {
        const duration = 1000 + Math.random() * 2000;
        Laya.Tween.to(star, { alpha: baseAlpha * 0.3 }, duration, Laya.Ease.sineInOut,
            Laya.Handler.create(this, () => {
                Laya.Tween.to(star, { alpha: baseAlpha }, duration, Laya.Ease.sineInOut,
                    Laya.Handler.create(this, () => this.animateStar(star, baseAlpha)));
            }));
    }

    private createTitle(): void {
        this.titleText = new Laya.Text();
        this.titleText.text = "舒尔特方格";
        this.titleText.fontSize = 36;
        this.titleText.font = "Microsoft YaHei";
        this.titleText.bold = true;
        this.titleText.color = "#F8F3CF";
        this.titleText.stroke = 3;
        this.titleText.strokeColor = "#4A351A";
        this.titleText.align = "center";
        this.uiContainer.addChild(this.titleText);
    }

    private createHudPanel(): void {
        const w = Laya.stage.width;
        const panelW = Math.min(w * 0.92, 400);
        const panelH = 100;

        this.hudPanel = new Laya.Sprite();
        this.hudPanel.pos((w - panelW) / 2, 90);
        this.hudPanel.size(panelW, panelH);

        // 玻璃拟态背景
        this.hudPanel.graphics.drawRoundRect(0, 0, panelW, panelH, 16, "rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.12)", 2);

        // 内发光
        this.hudPanel.graphics.drawRoundRect(4, 4, panelW - 8, panelH - 8, 14, null, "rgba(139, 92, 246, 0.15)", 1);

        this.uiContainer.addChild(this.hudPanel);

        // 信息项
        const itemW = panelW / 3;

        // 目标数字
        this.createHudItem("目标", "1", "#FFD700", 0);
        // 计时器
        this.createHudItem("用时", "00:00", "#4FC3F7", 1);
        // 错误次数
        this.createHudItem("错误", "0", "#FF6B6B", 2);
    }

    private createHudItem(label: string, value: string, color: string, index: number): void {
        const panelW = this.hudPanel.width;
        const itemW = panelW / 3;
        const x = index * itemW;

        // 图标背景
        const iconBg = new Laya.Sprite();
        iconBg.graphics.drawCircle(30, 30, 20, `rgba(255, 255, 255, 0.1)`);
        iconBg.pos(x + 10, 15);
        this.hudPanel.addChild(iconBg);

        // 标签文字
        const labelText = new Laya.Text();
        labelText.text = label;
        labelText.fontSize = 14;
        labelText.color = "rgba(255, 255, 255, 0.6)";
        labelText.font = "Microsoft YaHei";
        labelText.pos(x + itemW / 2, 12);
        labelText.align = "center";
        this.hudPanel.addChild(labelText);

        // 数值文字
        const valueText = new Laya.Text();
        valueText.text = value;
        valueText.fontSize = 28;
        valueText.font = "Microsoft YaHei";
        valueText.bold = true;
        valueText.color = color;
        valueText.stroke = 2;
        valueText.strokeColor = "rgba(0, 0, 0, 0.3)";
        valueText.pos(x + itemW / 2, 32);
        valueText.align = "center";
        this.hudPanel.addChild(valueText);

        // 根据索引保存引用
        if (label === "目标") this.targetText = valueText;
        else if (label === "用时") this.timerText = valueText;
        else if (label === "错误") this.errorText = valueText;
    }

    private createDifficultyButtons(): void {
        const w = Laya.stage.width;
        const btns = [3, 4, 5];
        const btnW = 70;
        const btnH = 40;
        const spacing = 20;
        const totalW = btns.length * btnW + (btns.length - 1) * spacing;
        let xOffset = (w - totalW) / 2;

        btns.forEach(size => {
            const btn = this.createStyledButton(size + "x" + size, btnW, btnH, size === this._currentSize);
            btn.pos(xOffset, 210);
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

        // 按钮背景
        const bgColor = selected ? "#8B5CF6" : "rgba(255, 255, 255, 0.08)";
        const borderColor = selected ? "#A78BFA" : "rgba(255, 255, 255, 0.2)";

        btn.graphics.drawRoundRect(0, 0, w, h, 8, bgColor, borderColor, 2);

        // 文字
        const textNode = new Laya.Text();
        textNode.text = text;
        textNode.fontSize = 16;
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
        // 更新按钮状态
        Object.keys(this.difficultyBtns).forEach(key => {
            const btn = this.difficultyBtns[parseInt(key)];
            const isSelected = parseInt(key) === size;
            const w = btn.width;
            const h = btn.height;
            const bgColor = isSelected ? "#8B5CF6" : "rgba(255, 255, 255, 0.08)";
            const borderColor = isSelected ? "#A78BFA" : "rgba(255, 255, 255, 0.2)";

            btn.graphics.clear();
            btn.graphics.drawRoundRect(0, 0, w, h, 8, bgColor, borderColor, 2);
        });

        this._currentSize = size;
        this._totalNumbers = size * size;
    }

    private createActionButtons(): void {
        const w = Laya.stage.width;

        // 开始按钮
        this.startBtn = this.createMainButton("开始游戏", 180, 56);
        this.startBtn.pos((w - 180) / 2, 280);
        this.startBtn.on(Event.TOUCH_START, this, this.onStartGame);
        this.uiContainer.addChild(this.startBtn);

        // 重置按钮
        this.resetBtn = this.createMainButton("重置", 100, 48);
        this.resetBtn.pos((w - 100) / 2 + 50, 285);
        this.resetBtn.visible = false;
        this.resetBtn.on(Event.TOUCH_START, this, this.onResetGame);
        this.uiContainer.addChild(this.resetBtn);

        // 提示按钮
        this.hintBtn = this.createSmallButton("提示: 关", 90, 36);
        this.hintBtn.pos(w - 110, 210);
        this.hintBtn.on(Event.TOUCH_START, this, this.onToggleHint);
        this.uiContainer.addChild(this.hintBtn);
    }

    private createMainButton(text: string, w: number, h: number): Laya.Sprite {
        const btn = new Laya.Sprite();
        btn.size(w, h);
        btn.mouseEnabled = true;

        // 渐变背景
        btn.graphics.drawRoundRect(0, 0, w, h, h/2, "#8B5CF6", "#6D28D9", 2);

        // 高光效果
        btn.graphics.drawRoundRect(4, 4, w - 8, h/2 - 4, h/4, "rgba(255, 255, 255, 0.15)", null, 0);

        // 文字
        const textNode = new Laya.Text();
        textNode.text = text;
        textNode.fontSize = 22;
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

        // 阴影
        btn.graphics.drawRect(0, h - 4, w, 4, "rgba(0, 0, 0, 0.3)");

        return btn;
    }

    private createSmallButton(text: string, w: number, h: number): Laya.Sprite {
        const btn = new Laya.Sprite();
        btn.size(w, h);
        btn.mouseEnabled = true;

        btn.graphics.drawRoundRect(0, 0, w, h, h/2, "rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.2)", 1);

        const textNode = new Laya.Text();
        textNode.text = text;
        textNode.fontSize = 14;
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
            this.titleText.pos(w / 2, 35);
        }

        // 居中困难选择按钮
        const btns = [3, 4, 5];
        const btnW = 70;
        const spacing = 20;
        const totalW = btns.length * btnW + (btns.length - 1) * spacing;
        let xOffset = (w - totalW) / 2;
        btns.forEach(size => {
            if (this.difficultyBtns[size]) {
                this.difficultyBtns[size].x = xOffset;
                xOffset += btnW + spacing;
            }
        });
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

        // 隐藏难度按钮，显示重置按钮
        Object.values(this.difficultyBtns).forEach(btn => { btn.visible = false; });
        if (this.startBtn) this.startBtn.visible = false;
        if (this.resetBtn) this.resetBtn.visible = true;
        if (this.hintBtn) this.hintBtn.visible = false;
        if (this.titleText) this.titleText.visible = false;

        this.createGrid();
    }

    private createGrid(): void {
        // 清理旧格子
        this.cells.forEach(cell => { cell.off(Event.TOUCH_START, this, null); cell.destroy(); });
        this.cells = [];
        if (this.gridContainer) {
            // 保留背景层，清理游戏层
            const gameLayer = this.gridContainer.getChildByName("gameLayer") as Laya.Sprite;
            if (gameLayer) gameLayer.destroy();
        }

        // 创建游戏层
        const gameLayer = new Laya.Sprite();
        gameLayer.name = "gameLayer";
        this.gridContainer.addChild(gameLayer);

        // 创建面板背景
        const panelSize = Math.min(Laya.stage.width * 0.85, 400);
        const panelX = (Laya.stage.width - panelSize) / 2;
        const panelY = 270;

        // 面板阴影
        const shadow = new Laya.Sprite();
        shadow.graphics.drawRoundRect(panelX + 6, panelY + 6, panelSize, panelSize, 24, "rgba(0, 0, 0, 0.4)");
        gameLayer.addChild(shadow);

        // 面板背景
        const panel = new Laya.Sprite();
        panel.graphics.drawRoundRect(panelX, panelY, panelSize, panelSize, 24, "#1E1B4B", "#312E81", 3);
        gameLayer.addChild(panel);

        // 面板内发光边框
        const innerGlow = new Laya.Sprite();
        innerGlow.graphics.drawRoundRect(panelX + 6, panelY + 6, panelSize - 12, panelSize - 12, 20, null, "rgba(139, 92, 246, 0.25)", 1);
        gameLayer.addChild(innerGlow);

        // 装饰角标
        this.createPanelDecorations(panelX, panelY, panelSize);

        const { rows, cols } = this.GRID_SIZES[this._currentSize];
        const spacing = SchulteGridGame.CELL_SPACING;
        const cellSize = Math.floor((panelSize - 48 - spacing * (cols - 1)) / cols);

        const gridW = cols * cellSize + (cols - 1) * spacing;
        const gridH = rows * cellSize + (rows - 1) * spacing;
        const startX = panelX + (panelSize - gridW) / 2;
        const startY = panelY + (panelSize - gridH) / 2;

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
                gameLayer.addChild(cell);
                this.cells.push(cell);
            }
        }
    }

    private createPanelDecorations(x: number, y: number, size: number): void {
        const gameLayer = this.gridContainer.getChildByName("gameLayer") as Laya.Sprite;
        if (!gameLayer) return;

        const cornerSize = 30;
        const cornerColor = "rgba(139, 92, 246, 0.6)";

        // 左上角
        const tl = new Laya.Sprite();
        tl.graphics.drawPath(0, 0, [
            ["moveTo", 0, cornerSize],
            ["lineTo", 0, 0],
            ["lineTo", cornerSize, 0]
        ], null, cornerColor);
        tl.pos(x + 8, y + 8);
        gameLayer.addChild(tl);

        // 右上角
        const tr = new Laya.Sprite();
        tr.graphics.drawPath(0, 0, [
            ["moveTo", 0, 0],
            ["lineTo", cornerSize, 0],
            ["lineTo", cornerSize, cornerSize]
        ], null, cornerColor);
        tr.pos(x + size - 8 - cornerSize, y + 8);
        gameLayer.addChild(tr);

        // 左下角
        const bl = new Laya.Sprite();
        bl.graphics.drawPath(0, 0, [
            ["moveTo", 0, 0],
            ["lineTo", 0, cornerSize],
            ["lineTo", cornerSize, cornerSize]
        ], null, cornerColor);
        bl.pos(x + 8, y + size - 8 - cornerSize);
        gameLayer.addChild(bl);

        // 右下角
        const br = new Laya.Sprite();
        br.graphics.drawPath(0, 0, [
            ["moveTo", cornerSize, 0],
            ["lineTo", cornerSize, cornerSize],
            ["lineTo", 0, cornerSize]
        ], null, cornerColor);
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
        // 创建光晕效果
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
        // 震动效果
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
            this.targetText.text = this._currentNumber + " / " + this._totalNumbers;
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
        if (this.timerText) {
            this.timerText.text = timeStr;
        }
    }

    private formatTime(ms: number): string {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const secs = seconds.toString().padStart(2, "0");
        return minutes + ":" + secs;
    }

    private onGameCompleted(): void {
        this._isPlaying = false;
        this._timerRunning = false;
        const elapsed = Laya.timer.currTimer - this._startTime;
        this.playCompletionEffect();
        this.showCompletePopup(elapsed);
    }

    private playCompletionEffect(): void {
        // 烟花效果
        for (let i = 0; i < 15; i++) {
            const particle = new Laya.Sprite();
            const size = 8 + Math.random() * 8;
            const colors = ["#FFD700", "#FF6B6B", "#4FC3F7", "#A78BFA", "#4ADE80"];
            const color = colors[Math.floor(Math.random() * colors.length)];
            particle.graphics.drawCircle(size/2, size/2, size/2, color);
            particle.size(size, size);
            particle.pos(
                Math.random() * Laya.stage.width,
                Laya.stage.height * 0.3 + Math.random() * 100
            );
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
        const popupW = Math.min(w * 0.78, 320);
        const popupH = 220;
        const popupX = (w - popupW) / 2;
        const popupY = (Laya.stage.height - popupH) / 2;

        // 遮罩
        const overlay = new Laya.Sprite();
        overlay.graphics.drawRect(0, 0, Laya.stage.width, Laya.stage.height, "rgba(0, 0, 0, 0.6)");
        overlay.on(Event.TOUCH_START, this, () => {});
        this.fxContainer.addChild(overlay);

        // 面板
        const panel = new Laya.Sprite();
        panel.pos(popupX, popupY);
        panel.graphics.drawRoundRect(0, 0, popupW, popupH, 20, "#1E1B4B", "#4C1D95", 3);
        this.fxContainer.addChild(panel);

        // 标题
        const title = new Laya.Text();
        title.text = "🎉 挑战完成!";
        title.fontSize = 32;
        title.font = "Microsoft YaHei";
        title.bold = true;
        title.color = "#FFD700";
        title.stroke = 2;
        title.strokeColor = "rgba(0, 0, 0, 0.3)";
        title.align = "center";
        title.pos(popupW / 2, 30);
        panel.addChild(title);

        // 结果
        const elapsedSec = Math.floor(timeMs / 1000);
        const resultText = new Laya.Text();
        resultText.text = `用时: ${elapsedSec}秒\n错误: ${this._errors}次`;
        resultText.fontSize = 20;
        resultText.font = "Microsoft YaHei";
        resultText.color = "#E0E7FF";
        resultText.align = "center";
        resultText.leading = 10;
        resultText.pos(popupW / 2, 90);
        panel.addChild(resultText);

        // 按钮
        const btnW = 140;
        const btnH = 48;
        const btn = new Laya.Sprite();
        btn.pos((popupW - btnW) / 2, 155);
        btn.graphics.drawRoundRect(0, 0, btnW, btnH, 24, "#8B5CF6", "#6D28D9", 2);
        btn.mouseEnabled = true;
        panel.addChild(btn);

        const btnText = new Laya.Text();
        btnText.text = "再来一局";
        btnText.fontSize = 18;
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
        if (this.resetBtn) this.resetBtn.visible = false;
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

        // 清理游戏层
        const gameLayer = this.gridContainer.getChildByName("gameLayer") as Laya.Sprite;
        if (gameLayer) gameLayer.destroy();

        this.cells = [];

        if (this.targetText) this.targetText.text = "1 / " + this._totalNumbers;
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
