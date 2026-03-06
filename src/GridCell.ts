/**
 * 舒尔特方格格子组件
 */
export class GridCell extends Laya.Sprite {
    private _number: number = 0;
    private _expected: number = 0;
    private _isLocked: boolean = false;
    private _cellSize: number = 86;
    private _state: "idle" | "correct" | "error" = "idle";

    private readonly numberLabel: Laya.Text = new Laya.Text();

    constructor(number: number, expected: number) {
        super();
        this._number = number;
        this._expected = expected;
        this.initCell();
    }

    private initCell(): void {
        this.mouseEnabled = true;
        this.addChild(this.numberLabel);
        this.numberLabel.align = "center";
        this.numberLabel.valign = "middle";
        this.numberLabel.bold = true;
        this.numberLabel.font = "Microsoft YaHei";
        this.refreshVisual();
    }

    public setCellSize(size: number): void {
        this._cellSize = Math.max(56, Math.floor(size));
        this.size(this._cellSize, this._cellSize);
        this.refreshVisual();
    }

    public playPressFeedback(): void {
        if (this._isLocked) {
            return;
        }
        Laya.Tween.clearAll(this);
        this.scale(1, 1);
        Laya.Tween.to(this, { scaleX: 0.96, scaleY: 0.96 }, 70, null, Laya.Handler.create(this, () => {
            Laya.Tween.to(this, { scaleX: 1, scaleY: 1 }, 90);
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
            Laya.Tween.to(this, { scaleX: 1.02, scaleY: 1.02 }, 80, null, Laya.Handler.create(this, () => {
                Laya.Tween.to(this, { scaleX: 1, scaleY: 1 }, 100, null, Laya.Handler.create(this, () => {
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

        if (this._state === "correct") {
            this.graphics.drawRoundRect(0, 0, size, size, 12, "#153A33", "#45F4AE", 3);
            this.graphics.drawRoundRect(5, 5, size - 10, size - 10, 10, "#1F5448", null, 0);
            this.setLabelStyle("#A6FFE0");
        } else if (this._state === "error") {
            this.graphics.drawRoundRect(0, 0, size, size, 12, "#421527", "#FF6C97", 3);
            this.graphics.drawRoundRect(5, 5, size - 10, size - 10, 10, "#5B1B34", null, 0);
            this.setLabelStyle("#FFD0DC");
        } else {
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

    private setLabelStyle(color: string): void {
        this.numberLabel.color = color;
    }

    public getNumber(): number { return this._number; }
    public isLocked(): boolean { return this._isLocked; }
    public getExpectedNumber(): number { return this._expected; }
}
