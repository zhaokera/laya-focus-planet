/**
 * 舒尔特方格格子组件
 */
export class GridCell extends Laya.Sprite {
    constructor(number, expected) {
        super();
        this._number = 0;
        this._expected = 0;
        this._isLocked = false;
        this._cellSize = 86;
        this._state = "idle";
        this.numberLabel = new Laya.Text();
        this._number = number;
        this._expected = expected;
        this.initCell();
    }
    initCell() {
        this.mouseEnabled = true;
        this.addChild(this.numberLabel);
        this.numberLabel.align = "center";
        this.numberLabel.valign = "middle";
        this.numberLabel.bold = true;
        this.numberLabel.font = "Microsoft YaHei";
        this.refreshVisual();
    }
    setCellSize(size) {
        this._cellSize = Math.max(56, Math.floor(size));
        this.size(this._cellSize, this._cellSize);
        this.refreshVisual();
    }
    playPressFeedback() {
        if (this._isLocked) {
            return;
        }
        this.scale(1, 1);
        this.scale(0.96, 0.96);
        Laya.timer.once(90, this, () => {
            if (!this.destroyed) {
                this.scale(1, 1);
            }
        });
    }
    markCompleted() {
        this._isLocked = true;
        this._state = "correct";
        this.refreshVisual();
    }
    showError() {
        return new Promise((resolve) => {
            if (this._isLocked) {
                resolve();
                return;
            }
            this._state = "error";
            this.refreshVisual();
            this.scale(1, 1);
            this.scale(1.02, 1.02);
            Laya.timer.once(100, this, () => {
                if (!this.destroyed) {
                    this.scale(1, 1);
                    this._state = "idle";
                    this.refreshVisual();
                    resolve();
                }
                else {
                    resolve();
                }
            });
        });
    }
    reset(number, expected) {
        this._number = number;
        this._expected = expected;
        this._isLocked = false;
        this._state = "idle";
        this.refreshVisual();
    }
    refreshVisual() {
        const size = this._cellSize;
        this.graphics.clear();
        if (this._state === "correct") {
            this.graphics.drawRoundRect(0, 0, size, size, 12, "#153A33", "#45F4AE", 3);
            this.graphics.drawRoundRect(5, 5, size - 10, size - 10, 10, "#1F5448", null, 0);
            this.setLabelStyle("#A6FFE0");
        }
        else if (this._state === "error") {
            this.graphics.drawRoundRect(0, 0, size, size, 12, "#421527", "#FF6C97", 3);
            this.graphics.drawRoundRect(5, 5, size - 10, size - 10, 10, "#5B1B34", null, 0);
            this.setLabelStyle("#FFD0DC");
        }
        else {
            this.graphics.drawRoundRect(0, 0, size, size, 12, "#122344", "#54D5FF", 2);
            this.graphics.drawRoundRect(5, 5, size - 10, size - 10, 10, "#1A2F57", null, 0);
            this.setLabelStyle("#A5EFFF");
        }
        this.numberLabel.text = this._number.toString();
        this.numberLabel.fontSize = Math.max(24, Math.floor(size * 0.36));
        this.numberLabel.width = size;
        this.numberLabel.height = size;
        this.numberLabel.x = 0;
        this.numberLabel.y = 0;
    }
    setLabelStyle(color) {
        this.numberLabel.color = color;
    }
    getNumber() { return this._number; }
    isLocked() { return this._isLocked; }
    getExpectedNumber() { return this._expected; }
}
