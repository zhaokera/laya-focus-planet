const { Event } = Laya;
import { GridCell } from "./GridCell";
import { ResultPanel } from "./ResultPanel";
/**
 * 舒尔特方格专注力训练游戏主控制脚本
 */
export class SchulteGridGame extends Laya.Script {
    constructor() {
        super(...arguments);
        // 网格尺寸配置
        this.GRID_SIZES = {
            3: { rows: 3, cols: 3 },
            4: { rows: 4, cols: 4 },
            5: { rows: 5, cols: 5 }
        };
        // 游戏状态
        this._currentSize = 3;
        this._currentNumber = 1;
        this._totalNumbers = 9;
        this._startTime = 0;
        this._errors = 0;
        this._isPlaying = false;
        this._showHints = false;
        // 容器
        this.gridContainer = null;
        this.uiContainer = null;
        this.resultPanel = null;
        this.cells = [];
        // UI 元素
        this.titleSprite = null;
        this.targetSprite = null;
        this.timeSprite = null;
        this.errorSprite = null;
        this.hintBtn = null;
        this.startBtn = null;
        this.resetBtn = null;
        // 难度选择按钮组
        this.difficultyBtns = {};
    }
    onStart() {
        this.gridContainer = this.owner;
        this.uiContainer = new Laya.Sprite();
        this.gridContainer.addChild(this.uiContainer);
        this.createUI();
        this.layoutUI();
    }
    createUI() {
        this.titleSprite = this.createTitle("舒尔特方格专注力训练", 50, 30, "#FFD700", 40);
        this.createDifficultyButtons();
        this.targetSprite = this.createLabel("目标: 1", 30, 120, "#FFFFFF", 28);
        this.timeSprite = this.createLabel("用时: 00:00.000", 30, 160, "#FFD700", 28);
        this.errorSprite = this.createLabel("错误: 0次", 30, 200, "#E74C3C", 28);
        this.hintBtn = this.createButton("提示: 关", 30, 260, "#E74C3C", "#FFFFFF", 24);
        this.hintBtn.on(Event.TOUCH_START, this, this.onToggleHint);
        this.startBtn = this.createButton("开始游戏", 150, 60, "#27AE60", "#FFFFFF", 28);
        this.startBtn.x = (Laya.stage.width - 300) / 2;
        this.startBtn.y = 300;
        this.startBtn.on(Event.TOUCH_START, this, this.onStartGame);
        this.resetBtn = this.createButton("重置", 150, 60, "#95A5A6", "#FFFFFF", 28);
        this.resetBtn.x = (Laya.stage.width - 300) / 2 + 160;
        this.resetBtn.y = 300;
        this.resetBtn.visible = false;
        this.resetBtn.on(Event.TOUCH_START, this, this.onResetGame);
    }
    createDifficultyButtons() {
        const btns = [3, 4, 5];
        let xOffset = 50;
        btns.forEach(size => {
            const btn = this.createButton(size + "x" + size, 100, 50, "#34495E", "#FFFFFF", 24);
            btn.x = xOffset;
            btn.y = 80;
            btn.name = "diff_" + size;
            btn.userData = { gridSize: size };
            btn.on(Event.TOUCH_START, this, () => { this.selectDifficulty(size); });
            this.difficultyBtns[size] = btn;
            xOffset += 130;
        });
        this.selectDifficulty(3);
    }
    selectDifficulty(size) {
        Object.keys(this.difficultyBtns).forEach(key => {
            const btn = this.difficultyBtns[parseInt(key)];
            const isSelected = parseInt(key) === size;
            btn.graphics.clear();
            btn.graphics.drawRect(0, 0, 100, 50, isSelected ? "#27AE60" : "#34495E");
            btn.graphics.fillText(size + "x" + size, 15, 35, "24px SimHei", "#FFFFFF");
        });
        this._currentSize = size;
    }
    createTitle(text, x, y, color, fontSize) {
        const sprite = new Laya.Sprite();
        sprite.x = x;
        sprite.y = y;
        sprite.graphics.clear();
        sprite.graphics.fillText(text, 0, fontSize, fontSize + "px SimHei", color);
        this.uiContainer.addChild(sprite);
        return sprite;
    }
    createLabel(text, x, y, color, fontSize) {
        const sprite = new Laya.Sprite();
        sprite.x = x;
        sprite.y = y;
        sprite.graphics.clear();
        sprite.graphics.fillText(text, 0, fontSize, fontSize + "px SimHei", color);
        this.uiContainer.addChild(sprite);
        return sprite;
    }
    createButton(text, width, height, color, textColor, fontSize) {
        const sprite = new Laya.Sprite();
        sprite.graphics.clear();
        sprite.graphics.drawRect(0, 0, width, height, color);
        sprite.graphics.fillText(text, 20, height / 2 + fontSize / 3, fontSize + "px SimHei", textColor);
        this.uiContainer.addChild(sprite);
        return sprite;
    }
    layoutUI() {
        const stageWidth = Laya.stage.width;
        if (this.titleSprite) {
            const titleWidth = 40 * "舒尔特方格专注力训练".length * 0.6;
            this.titleSprite.x = (stageWidth - titleWidth) / 2;
        }
        const diffBtns = [3, 4, 5];
        const totalDiffWidth = diffBtns.length * 130;
        const startX = (stageWidth - totalDiffWidth) / 2 + 50;
        diffBtns.forEach((size, index) => {
            if (this.difficultyBtns[size]) {
                this.difficultyBtns[size].x = startX + index * 130;
            }
        });
        if (this.hintBtn)
            this.hintBtn.x = 30;
        if (this.startBtn)
            this.startBtn.x = (stageWidth - 300) / 2;
        if (this.resetBtn)
            this.resetBtn.x = (stageWidth - 300) / 2 + 160;
    }
    onStartGame() {
        if (this._isPlaying)
            return;
        this._currentNumber = 1;
        this._totalNumbers = this._currentSize * this._currentSize;
        this._errors = 0;
        this._startTime = Laya.timer.currTimer;
        this._isPlaying = true;
        this.updateTargetDisplay();
        this.updateErrorDisplay();
        this.updateTimeDisplay();
        this.createGrid();
        Object.values(this.difficultyBtns).forEach(btn => { btn.visible = false; });
        if (this.startBtn)
            this.startBtn.visible = false;
        if (this.resetBtn)
            this.resetBtn.visible = true;
    }
    createGrid() {
        this.cells.forEach(cell => { cell.off(Event.TOUCH_START, this, null); cell.destroy(); });
        this.cells = [];
        if (this.gridContainer) {
            this.gridContainer.removeChildren();
        }
        const { rows, cols } = this.GRID_SIZES[this._currentSize];
        const spacing = SchulteGridGame.CELL_SPACING;
        const cellSize = SchulteGridGame.CELL_SIZE;
        const totalWidth = cols * cellSize + (cols - 1) * spacing;
        const totalHeight = rows * cellSize + (rows - 1) * spacing;
        const startX = (Laya.stage.width - totalWidth) / 2;
        const startY = (Laya.stage.height - totalHeight) / 2 + 80;
        const numbers = this.generateNumbers(this._totalNumbers);
        const shuffled = this.fisherYatesShuffle(numbers);
        let index = 0;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const number = shuffled[index++];
                const cell = new GridCell(number, this._currentNumber);
                cell.x = startX + col * (cellSize + spacing);
                cell.y = startY + row * (cellSize + spacing);
                cell.width = cellSize;
                cell.height = cellSize;
                cell.on(Event.TOUCH_START, this, (e) => { this.onCellClick(cell); });
                cell.on(Event.MOUSE_DOWN, this, (e) => { this.onCellClick(cell); });
                this.gridContainer.addChild(cell);
                this.cells.push(cell);
            }
        }
    }
    generateNumbers(count) {
        const numbers = [];
        for (let i = 1; i <= count; i++) {
            numbers.push(i);
        }
        return numbers;
    }
    fisherYatesShuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    onCellClick(cell) {
        if (!this._isPlaying)
            return;
        const number = cell.getNumber();
        if (number === this._currentNumber) {
            this.onCorrectClick(cell);
        }
        else {
            this.onErrorClick(cell);
        }
    }
    onCorrectClick(cell) {
        cell.markCompleted();
        this._currentNumber++;
        if (this._currentNumber > this._totalNumbers) {
            this.onGameCompleted();
        }
        else {
            this.updateTargetDisplay();
        }
    }
    onErrorClick(cell) {
        this._errors++;
        this.updateErrorDisplay();
        cell.showError();
        this.showCenterText("错误！请按顺序点击", "#E74C3C", 800);
    }
    updateTargetDisplay() {
        if (this.targetSprite) {
            this.targetSprite.graphics.clear();
            this.targetSprite.graphics.fillText("目标: " + this._currentNumber + " / " + this._totalNumbers, 0, 28, "28px SimHei", "#FFFFFF");
        }
    }
    updateErrorDisplay() {
        if (this.errorSprite) {
            this.errorSprite.graphics.clear();
            this.errorSprite.graphics.fillText("错误: " + this._errors + "次", 0, 28, "28px SimHei", "#E74C3C");
        }
    }
    updateTimeDisplay() {
        if (this.timeSprite) {
            const elapsed = Laya.timer.currTimer - this._startTime;
            const timeStr = this.formatTime(elapsed);
            this.timeSprite.graphics.clear();
            this.timeSprite.graphics.fillText("用时: " + timeStr, 0, 28, "28px SimHei", "#FFD700");
        }
    }
    formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const mills = Math.floor(ms % 1000);
        return minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0") + "." + mills.toString().padStart(3, "0");
    }
    onGameCompleted() {
        this._isPlaying = false;
        const elapsed = Laya.timer.currTimer - this._startTime;
        this.showResultPanel(elapsed, this._errors);
    }
    showResultPanel(timeMs, errors) {
        if (this.resultPanel) {
            this.resultPanel.destroy();
        }
        this.resultPanel = new ResultPanel();
        this.resultPanel.x = (Laya.stage.width - 400) / 2;
        this.resultPanel.y = (Laya.stage.height - 300) / 2;
        this.gridContainer.addChild(this.resultPanel);
        this.resultPanel.showResults(timeMs, errors);
        this.resultPanel.on("restart", this, this.onRestartFromResult);
        this.resultPanel.on("close", this, this.onCloseFromResult);
    }
    onRestartFromResult() {
        if (this.resultPanel) {
            this.resultPanel.destroy();
            this.resultPanel = null;
        }
        Object.values(this.difficultyBtns).forEach(btn => { btn.visible = true; });
        if (this.startBtn)
            this.startBtn.visible = true;
        if (this.resetBtn)
            this.resetBtn.visible = false;
        this.onResetGame();
    }
    onCloseFromResult() {
        if (this.resultPanel) {
            this.resultPanel.destroy();
            this.resultPanel = null;
        }
        Object.values(this.difficultyBtns).forEach(btn => { btn.visible = true; });
        if (this.startBtn)
            this.startBtn.visible = true;
        if (this.resetBtn)
            this.resetBtn.visible = false;
        this.onResetGame();
    }
    onResetGame() {
        this._isPlaying = false;
        this._currentNumber = 1;
        this._errors = 0;
        this.cells.forEach(cell => { cell.off(Event.TOUCH_START, this, null); cell.destroy(); });
        this.cells = [];
        if (this.gridContainer) {
            this.gridContainer.removeChildren();
        }
        this.updateTargetDisplay();
        this.updateErrorDisplay();
        this.updateTimeDisplay();
        if (this.resultPanel) {
            this.resultPanel.destroy();
            this.resultPanel = null;
        }
    }
    onToggleHint() {
        this._showHints = !this._showHints;
        if (this.hintBtn) {
            this.hintBtn.graphics.clear();
            const color = this._showHints ? "#27AE60" : "#E74C3C";
            const text = this._showHints ? "提示: 开" : "提示: 关";
            this.hintBtn.graphics.drawRect(0, 0, 100, 40, color);
            this.hintBtn.graphics.fillText(text, 15, 28, "24px SimHei", "#FFFFFF");
        }
    }
    showCenterText(text, color, duration) {
        const sprite = new Laya.Sprite();
        const textWidth = 24 * text.length * 0.6;
        sprite.x = (Laya.stage.width - textWidth) / 2;
        sprite.y = Laya.stage.height / 2 - 50;
        sprite.graphics.clear();
        sprite.graphics.fillText(text, 0, 24, "24px SimHei", color);
        this.gridContainer.addChild(sprite);
        Laya.timer.once(duration, this, () => { sprite.destroy(); });
    }
    onDestroy() {
        Laya.timer.clear(this, this);
        this.cells.forEach(cell => cell.destroy());
        this.cells = [];
        if (this.resultPanel) {
            this.resultPanel.destroy();
            this.resultPanel = null;
        }
    }
}
SchulteGridGame.CELL_SPACING = 10;
SchulteGridGame.CELL_SIZE = 70;
