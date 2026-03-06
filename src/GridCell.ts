/**
 * 舒尔特方格格子组件
 * 星空紫蓝主题样式
 */
export class GridCell extends Laya.Sprite {
    private _number: number = 0;
    private _expected: number = 0;
    private _isLocked: boolean = false;
    private _cellSize: number = 80;
    private _state: "idle" | "correct" | "error" = "idle";

    private readonly numberLabel: Laya.Text = new Laya.Text();
    private glowSprite: Laya.Sprite = null;

    constructor(number: number, expected: number) {
        super();
        this._number = number;
        this._expected = expected;
        this.initCell();
    }

    private initCell(): void {
        this.mouseEnabled = true;

        // 创建发光层
        this.glowSprite = new Laya.Sprite();
        this.addChild(this.glowSprite);

        this.addChild(this.numberLabel);
        this.numberLabel.align = "center";
        this.numberLabel.valign = "middle";
        this.numberLabel.bold = true;
        this.numberLabel.font = "Microsoft YaHei";
        this.refreshVisual();
    }

    public setCellSize(size: number): void {
        this._cellSize = Math.max(50, Math.floor(size));
        this.size(this._cellSize, this._cellSize);
        this.refreshVisual();
    }

    public playPressFeedback(): void {
        if (this._isLocked) {
            return;
        }
        Laya.Tween.clearAll(this);
        this.scale(1, 1);
        Laya.Tween.to(this, { scaleX: 0.92, scaleY: 0.92 }, 60, null, Laya.Handler.create(this, () => {
            Laya.Tween.to(this, { scaleX: 1, scaleY: 1 }, 80);
        }));
    }

    public markCompleted(): void {
        this._isLocked = true;
        this._state = "correct";
        this.refreshVisual();
    }

    public showError(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (this._isLocked) {
                resolve();
                return;
            }
            this._state = "error";
            this.refreshVisual();
            Laya.Tween.clearAll(this);
            this.scale(1, 1);
            Laya.Tween.to(this, { scaleX: 1.06, scaleY: 1.06 }, 70, null, Laya.Handler.create(this, () => {
                Laya.Tween.to(this, { scaleX: 1, scaleY: 1 }, 90, null, Laya.Handler.create(this, () => {
                    this._state = "idle";
                    this.refreshVisual();
                    resolve();
                }));
            }));
        });
    }

    public reset(number: number, expected: number): void {
        this._number = number;
        this._expected = expected;
        this._isLocked = false;
        this._state = "idle";
        this.refreshVisual();
    }

    private refreshVisual(): void {
        const size = this._cellSize;
        this.graphics.clear();
        this.glowSprite.graphics.clear();

        if (this._state === "correct") {
            // 完成状态 - 金色渐变
            this.graphics.drawRoundRect(0, 0, size, size, 14, "#854D0E", "#CA8A04", 2);
            this.graphics.drawRoundRect(4, 4, size - 8, size - 8, 12, "#1E3A5F", null, 0);
            // 发光效果
            this.glowSprite.graphics.drawCircle(size/2, size/2, size * 0.7, "rgba(251, 191, 36, 0.2)");
            this.setLabelStyle("#FEF08A", true);
        } else if (this._state === "error") {
            // 错误状态 - 红色渐变
            this.graphics.drawRoundRect(0, 0, size, size, 14, "#991B1B", "#EF4444", 2);
            this.graphics.drawRoundRect(4, 4, size - 8, size - 8, 12, "#450A0A", null, 0);
            // 发光效果
            this.glowSprite.graphics.drawCircle(size/2, size/2, size * 0.7, "rgba(248, 113, 113, 0.25)");
            this.setLabelStyle("#FECACA", true);
        } else {
            // 普通状态 - 紫色渐变
            this.graphics.drawRoundRect(0, 0, size, size, 14, "#3730A3", "#6366F1", 2);
            this.graphics.drawRoundRect(4, 4, size - 8, size - 8, 12, "#1E1B4B", null, 0);
            // 微妙发光
            this.glowSprite.graphics.drawCircle(size/2, size/2, size * 0.6, "rgba(165, 180, 252, 0.12)");
            this.setLabelStyle("#E0E7FF", false);
        }

        // 更新数字
        this.numberLabel.text = this._number.toString();
        this.numberLabel.fontSize = Math.max(20, Math.floor(size * 0.38));
        this.numberLabel.width = size;
        this.numberLabel.height = size;
        this.numberLabel.x = 0;
        this.numberLabel.y = 0;
    }

    private setLabelStyle(color: string, glow: boolean): void {
        this.numberLabel.color = color;
        if (glow) {
            this.numberLabel.stroke = 3;
            this.numberLabel.strokeColor = "rgba(0, 0, 0, 0.4)";
        } else {
            this.numberLabel.stroke = 2;
            this.numberLabel.strokeColor = "rgba(0, 0, 0, 0.3)";
        }
    }

    public getNumber(): number { return this._number; }
    public isLocked(): boolean { return this._isLocked; }
    public getExpectedNumber(): number { return this._expected; }
}
