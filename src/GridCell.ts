const { Event } = Laya;

/**
 * 舒尔特方格格子组件
 * 显示单个数字，处理点击事件和状态显示
 */
export class GridCell extends Laya.Sprite {
    private static CELL_SIZE: number = 70;
    private static FONT_SIZE: number = 32;

    private _number: number = 0;
    private _expected: number = 0;
    private _isLocked: boolean = false;
    private _highlightTimer: number = 0;

    constructor(number: number, expected: number) {
        super();
        this._number = number;
        this._expected = expected;
        this.initCell();
    }

    // 初始化格子
    private initCell(): void {
        this.drawNormalState();

        // 绑定点击事件
        this.on(Event.TOUCH_START, this, this.onTouchStart);
        this.on(Event.MOUSE_DOWN, this, this.onMouseDown);
    }

    // 绘制正常状态（待点击）
    private drawNormalState(): void {
        this.graphics.clear();

        // 绘制边框
        this.graphics.drawRect(0, 0, GridCell.CELL_SIZE, GridCell.CELL_SIZE, "#FFFFFF");

        // 绘制数字（居中）
        this.drawNumber(this._number);
    }

    // 绘制已完成状态（置灰）
    public markCompleted(): void {
        this._isLocked = true;
        this.graphics.clear();

        // 绘制灰色边框
        this.graphics.drawRect(0, 0, GridCell.CELL_SIZE, GridCell.CELL_SIZE, "#555555");

        // 绘制灰色数字
        this.drawNumber(this._number, "#AAAAAA");
    }

    // 绘制错误闪烁状态
    public showError(): Promise<void> {
        return new Promise<void>(resolve => {
            if (this._isLocked) {
                resolve();
                return;
            }

            let flashCount = 0;
            const maxFlashes = 6; // 3次闪红（亮->暗->亮->暗->亮->暗）

            const flash = () => {
                const isWhite = flashCount % 2 === 0;
                this.graphics.clear();

                // 错误时红色，平时灰色
                this.graphics.drawRect(0, 0, GridCell.CELL_SIZE, GridCell.CELL_SIZE,
                    isWhite ? "#E74C3C" : "#555555");
                this.drawNumber(this._number, isWhite ? "#FFFFFF" : "#AAAAAA");

                flashCount++;
                if (flashCount >= maxFlashes) {
                    // 恢复到已锁定状态
                    this.graphics.clear();
                    this.graphics.drawRect(0, 0, GridCell.CELL_SIZE, GridCell.CELL_SIZE, "#555555");
                    this.drawNumber(this._number, "#AAAAAA");
                    this._isLocked = true;
                    resolve();
                } else {
                    // 继续闪烁
                    Laya.timer.once(100, this, flash);
                }
            };

            flash();
        });
    }

    // 绘制数字（居中）
    private drawNumber(num: number, color: string = "#FFFFFF"): void {
        const text = num.toString();
        const fontSize = 32;
        // 简单估算居中位置
        const textWidth = text.length * fontSize * 0.6;
        const x = (GridCell.CELL_SIZE - textWidth) / 2;
        const y = fontSize + 8;

        this.graphics.fillText(text, x, y, fontSize + "px SimHei-bold", color);
    }

    // 重置格子
    public reset(number: number, expected: number): void {
        this._number = number;
        this._expected = expected;
        this._isLocked = false;
        this.drawNormalState();
    }

    // 点击事件处理
    private onTouchStart(): void {
        this.onTriggerClick();
    }

    private onMouseDown(): void {
        this.onTriggerClick();
    }

    private onTriggerClick(): void {
        if (this._isLocked) return;

        // 派发事件给父容器处理
        this.owner && this.owner.dispatchEvent(new Event("cellClick", true));
        (this.owner as any).currentCell = this;
    }

    // 获取格子信息
    public getNumber(): number { return this._number; }
    public isLocked(): boolean { return this._isLocked; }
    public getExpectedNumber(): number { return this._expected; }
}
