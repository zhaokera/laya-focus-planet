var GameScene_1;
const { regClass, Event } = Laya;
import { GridCell } from "./GridCell";
import { ResultPanel } from "./ResultPanel";
/**
 * 游戏场景 - 舒尔特方格游戏界面
 */
let GameScene = GameScene_1 = class GameScene extends Laya.Scene {
    constructor() {
        super(...arguments);
        this.currentDifficulty = 3;
        this.gridContainer = null;
        this.uiContainer = null;
        this.resultPanel = null;
        this.cells = [];
        // 游戏状态
        this._currentNumber = 1;
        this._totalNumbers = 9;
        this._startTime = 0;
        this._errors = 0;
        this._isPlaying = false;
        // UI 元素
        this.titleSprite = null;
        this.targetSprite = null;
        this.timeSprite = null;
        this.errorSprite = null;
        this.backBtn = null;
    }
    onAwake() {
        this.initStage();
    }
    onEnable() {
        // 从上一个场景获取难度设置
        this.currentDifficulty = Laya.stage.getChildByName("GameScene").currentDifficulty || 3;
        this.createUI();
    }
    // 初始化舞台
    initStage() {
        Laya.stage.alignH = "center";
        Laya.stage.alignV = "middle";
        Laya.stage.scaleMode = "showall";
        Laya.stage.bgColor = "#1a2a3a";
    }
    // 创建UI
    createUI() {
        this.size(Laya.stage.width, Laya.stage.height);
        this.mouseEnabled = true;
        // 初始化游戏状态
        this._currentNumber = 1;
        this._totalNumbers = this.currentDifficulty * this.currentDifficulty;
        this._errors = 0;
        this._isPlaying = false;
        // 创建UI容器
        this.uiContainer = new Laya.Sprite();
        this.addChild(this.uiContainer);
        // 创建标题
        this.createTitle();
        // 创建游戏信息显示
        this.createGameInfo();
        // 创建网格
        this.createGrid();
        // 创建返回按钮
        this.createBackButton();
    }
    // 创建标题
    createTitle() {
        this.titleSprite = new Laya.Sprite();
        this.titleSprite.x = (this.width - 300) / 2;
        this.titleSprite.y = 30;
        this.titleSprite.graphics.clear();
        this.titleSprite.graphics.fillText("舒尔特方格 - 游戏中", 0, 48, "48px SimHei-bold", "#FFD700");
        this.uiContainer.addChild(this.titleSprite);
    }
    // 创建游戏信息
    createGameInfo() {
        // 目标数字
        this.targetSprite = new Laya.Sprite();
        this.targetSprite.x = 50;
        this.targetSprite.y = 100;
        this.targetSprite.graphics.clear();
        this.targetSprite.graphics.fillText(`目标: 1 / ${this._totalNumbers}`, 0, 32, "32px SimHei", "#FFFFFF");
        this.uiContainer.addChild(this.targetSprite);
        // 用时
        this.timeSprite = new Laya.Sprite();
        this.timeSprite.x = this.width - 300;
        this.timeSprite.y = 100;
        this.timeSprite.graphics.clear();
        this.timeSprite.graphics.fillText("用时: 00:00.000", 0, 32, "32px SimHei", "#FFD700");
        this.uiContainer.addChild(this.timeSprite);
        // 错误次数
        this.errorSprite = new Laya.Sprite();
        this.errorSprite.x = (this.width - 200) / 2;
        this.errorSprite.y = 100;
        this.errorSprite.graphics.clear();
        this.errorSprite.graphics.fillText(`错误: 0次`, 0, 32, "32px SimHei", "#E74C3C");
        this.uiContainer.addChild(this.errorSprite);
    }
    // 创建网格
    createGrid() {
        this.cells.forEach(cell => { cell.off(Event.TOUCH_START, this, null); cell.destroy(); });
        this.cells = [];
        const { rows, cols } = this.getGridSize(this.currentDifficulty);
        const spacing = GameScene_1.CELL_SPACING;
        const cellSize = GameScene_1.CELL_SIZE;
        const totalWidth = cols * cellSize + (cols - 1) * spacing;
        const totalHeight = rows * cellSize + (rows - 1) * spacing;
        const startX = (this.width - totalWidth) / 2;
        const startY = (this.height - totalHeight) / 2 + 50;
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
                this.addChild(cell);
                this.cells.push(cell);
            }
        }
        // 启动游戏
        this._isPlaying = true;
        this._startTime = Laya.timer.now();
        this.updateTimeDisplay();
        this.timer.frameOnce(1, this, this.updateTimeLoop);
    }
    // 获取网格尺寸
    getGridSize(size) {
        if (size === 3)
            return { rows: 3, cols: 3 };
        if (size === 4)
            return { rows: 4, cols: 4 };
        return { rows: 5, cols: 5 };
    }
    // 生成数字序列
    generateNumbers(count) {
        const numbers = [];
        for (let i = 1; i <= count; i++) {
            numbers.push(i);
        }
        return numbers;
    }
    // Fisher-Yates 洗牌算法
    fisherYatesShuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    // 格子点击处理
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
    // 正确点击
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
    // 错误点击
    onErrorClick(cell) {
        this._errors++;
        this.updateErrorDisplay();
        cell.showError();
        this.showCenterText("错误！请按顺序点击", "#E74C3C", 800);
    }
    // 更新目标显示
    updateTargetDisplay() {
        if (this.targetSprite) {
            this.targetSprite.graphics.clear();
            this.targetSprite.graphics.fillText(`目标: ${this._currentNumber} / ${this._totalNumbers}`, 0, 32, "32px SimHei", "#FFFFFF");
        }
    }
    // 更新错误显示
    updateErrorDisplay() {
        if (this.errorSprite) {
            this.errorSprite.graphics.clear();
            this.errorSprite.graphics.fillText(`错误: ${this._errors}次`, 0, 32, "32px SimHei", "#E74C3C");
        }
    }
    // 更新时间显示
    updateTimeDisplay() {
        if (this.timeSprite && this._startTime > 0) {
            const elapsed = Laya.timer.now() - this._startTime;
            const timeStr = this.formatTime(elapsed);
            this.timeSprite.graphics.clear();
            this.timeSprite.graphics.fillText(`用时: ${timeStr}`, 0, 32, "32px SimHei", "#FFD700");
        }
    }
    // 时间格式化
    formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const mills = Math.floor(ms % 1000);
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${mills.toString().padStart(3, "0")}`;
    }
    // 时间更新循环
    updateTimeLoop() {
        if (this._isPlaying) {
            this.updateTimeDisplay();
            this.timer.frameOnce(10, this, this.updateTimeLoop); // 约100fps更新
        }
    }
    // 显示居中提示
    showCenterText(text, color, duration) {
        const sprite = new Laya.Sprite();
        const textWidth = 24 * text.length * 0.6;
        sprite.x = (this.width - textWidth) / 2;
        sprite.y = this.height / 2 - 50;
        sprite.graphics.clear();
        sprite.graphics.fillText(text, 0, 24, "24px SimHei", color);
        this.addChild(sprite);
        this.timer.frameOnce(60, this, () => { sprite.destroy(); });
    }
    // 游戏完成
    onGameCompleted() {
        this._isPlaying = false;
        this.timer.clear(this, this.updateTimeLoop);
        const elapsed = Laya.timer.now() - this._startTime;
        this.showResultPanel(elapsed, this._errors);
    }
    // 显示结果面板
    showResultPanel(timeMs, errors) {
        if (this.resultPanel) {
            this.resultPanel.destroy();
        }
        this.resultPanel = new ResultPanel();
        this.resultPanel.x = (this.width - 400) / 2;
        this.resultPanel.y = (this.height - 300) / 2;
        this.addChild(this.resultPanel);
        this.resultPanel.showResults(timeMs, errors);
        this.resultPanel.on("restart", this, this.onRestart);
        this.resultPanel.on("close", this, this.onBack);
    }
    // 重新开始
    onRestart() {
        if (this.resultPanel) {
            this.resultPanel.destroy();
            this.resultPanel = null;
        }
        this._currentNumber = 1;
        this._errors = 0;
        this._isPlaying = false;
        this.timer.clear(this, this.updateTimeLoop);
        this.createGrid();
    }
    // 返回上一页
    onBack() {
        if (this.resultPanel) {
            this.resultPanel.destroy();
            this.resultPanel = null;
        }
        Laya.Scene.destroy("scenes/GameScene.scene");
        Laya.Scene.load("scenes/Main.scene", this, (scene) => {
            Laya.stage.addChild(scene);
        });
    }
    // 创建返回按钮
    createBackButton() {
        this.backBtn = new Laya.Sprite();
        this.backBtn.x = 30;
        this.backBtn.y = this.height - 70;
        this.backBtn.size(120, 50);
        this.backBtn.mouseEnabled = true;
        this.backBtn.graphics.clear();
        this.backBtn.graphics.drawRoundRect(0, 0, 120, 50, 8, "#e74c3c", null, 0);
        this.backBtn.graphics.fillText("返回菜单", 25, 30, "22px SimHei-bold", "#FFFFFF");
        this.backBtn.on(Event.TOUCH_START, this, () => {
            this.onBack();
        });
        this.addChild(this.backBtn);
    }
    onDestroy() {
        this.timer.clear(this, this.updateTimeLoop);
        this.cells.forEach(cell => cell.destroy());
        this.cells = [];
        if (this.resultPanel) {
            this.resultPanel.destroy();
            this.resultPanel = null;
        }
    }
};
// 网格配置
GameScene.CELL_SPACING = 10;
GameScene.CELL_SIZE = 70;
GameScene = GameScene_1 = __decorate([
    regClass()
], GameScene);
export { GameScene };
