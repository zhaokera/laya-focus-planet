const { Event } = Laya;
/**
 * 游戏结果面板
 * 显示游戏完成后的统计数据
 */
export class ResultPanel extends Laya.Sprite {
    constructor() {
        super();
        this.panelWidth = 400;
        this.panelHeight = 300;
        this.initPanel();
    }
    // 初始化面板布局
    initPanel() {
        const centerX = (Laya.stage.width - this.panelWidth) / 2;
        const centerY = (Laya.stage.height - this.panelHeight) / 2;
        this.x = centerX;
        this.y = centerY;
        // 绘制面板背景
        this.graphics.clear();
        this.graphics.drawRect(0, 0, this.panelWidth, this.panelHeight, "#34495E");
        this.graphics.drawRect(5, 5, this.panelWidth - 10, this.panelHeight - 10, "#FFFFFF");
        // 标题
        const titleLabel = new Laya.Sprite();
        titleLabel.x = 20;
        titleLabel.y = 30;
        titleLabel.graphics.clear();
        titleLabel.graphics.fillText("完成！", 0, 40, "40px SimHei", "#FFD700");
        this.addChild(titleLabel);
        // 用时显示标签
        const timeLabelSprite = new Laya.Sprite();
        timeLabelSprite.x = 20;
        timeLabelSprite.y = 100;
        timeLabelSprite.graphics.clear();
        timeLabelSprite.graphics.fillText("用时:", 0, 30, "30px SimHei", "#FFFFFF");
        this.addChild(timeLabelSprite);
        // 错误次数显示标签
        const errorLabelSprite = new Laya.Sprite();
        errorLabelSprite.x = 20;
        errorLabelSprite.y = 150;
        errorLabelSprite.graphics.clear();
        errorLabelSprite.graphics.fillText("错误:", 0, 30, "30px SimHei", "#E74C3C");
        this.addChild(errorLabelSprite);
        // 平均耗时显示标签
        const avgLabelSprite = new Laya.Sprite();
        avgLabelSprite.x = 20;
        avgLabelSprite.y = 200;
        avgLabelSprite.graphics.clear();
        avgLabelSprite.graphics.fillText("平均:", 0, 30, "30px SimHei", "#3498DB");
        this.addChild(avgLabelSprite);
        // 重置按钮
        const restartBtn = this.createButton("重新开始", 100, 40, "#27AE60", "#FFFFFF", 24);
        restartBtn.y = 220;
        this.addChild(restartBtn);
        restartBtn.on(Event.TOUCH_START, this, this.onRestart);
        restartBtn.on(Event.MOUSE_DOWN, this, this.onRestart);
        // 返回按钮
        const backBtn = this.createButton("返回", 200, 40, "#95A5A6", "#FFFFFF", 24);
        backBtn.y = 220;
        this.addChild(backBtn);
        backBtn.on(Event.TOUCH_START, this, this.onBack);
        backBtn.on(Event.MOUSE_DOWN, this, this.onBack);
    }
    // 创建按钮
    createButton(text, width, height, color, textColor, fontSize) {
        const button = new Laya.Sprite();
        const x = (this.panelWidth - width) / 2;
        button.x = x;
        button.graphics.clear();
        button.graphics.drawRect(0, 0, width, height, color);
        button.graphics.fillText(text, (width - fontSize * 0.6 * text.length) / 2, height / 2 + fontSize / 3, fontSize + "px SimHei", textColor);
        return button;
    }
    // 显示结果数据
    showResults(timeMs, errors) {
        // 清除旧的结果显示（通过移除并重新添加）
        this.removeChildren(3, this.numChildren - 3);
        const timeStr = this.formatTime(timeMs);
        const avgMs = timeMs / (errors > 0 ? (timeMs / 1000) : 1);
        const avgStr = this.formatTime(Math.floor(avgMs));
        // 用时显示
        const timeValue = new Laya.Sprite();
        timeValue.x = 120;
        timeValue.y = 100;
        timeValue.graphics.clear();
        timeValue.graphics.fillText(timeStr, 0, 30, "30px SimHei", "#FFD700");
        this.addChild(timeValue);
        // 错误次数显示
        const errorValue = new Laya.Sprite();
        errorValue.x = 120;
        errorValue.y = 150;
        errorValue.graphics.clear();
        errorValue.graphics.fillText(errors + "次", 0, 30, "30px SimHei", "#FFFFFF");
        this.addChild(errorValue);
        // 平均耗时显示
        const avgValue = new Laya.Sprite();
        avgValue.x = 120;
        avgValue.y = 200;
        avgValue.graphics.clear();
        avgValue.graphics.fillText(avgStr, 0, 30, "30px SimHei", "#3498DB");
        this.addChild(avgValue);
    }
    // 时间格式化（毫秒转 mm:ss.SSS）
    formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const mills = Math.floor(ms % 1000);
        const minStr = minutes.toString().padStart(2, "0");
        const secStr = seconds.toString().padStart(2, "0");
        const millStr = mills.toString().padStart(3, "0");
        return `${minStr}:${secStr}.${millStr}`;
    }
    // 重置按钮事件
    onRestart() {
        this.dispatchEvent(new Event("restart", true));
    }
    // 返回按钮事件
    onBack() {
        this.dispatchEvent(new Event("close", true));
    }
    // 释放资源
    destroy() {
        // 移除事件监听
        for (let i = 0; i < this.numChildren; i++) {
            const child = this.getChildAt(i);
            if (child) {
                child.off(Event.TOUCH_START, this, null);
            }
        }
        super.destroy();
    }
}
