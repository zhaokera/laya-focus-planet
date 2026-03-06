/**
 * 舒尔特方格格子组件
 * 星空紫蓝主题样式 - 完全匹配设计稿
 */
export class GridCell extends Laya.Sprite {
    private _number: number = 0;
    private _expected: number = 0;
    private _isLocked: boolean = false;
    private _cellSize: number = 56;
    private _state: "idle" | "correct" | "error" | "active" = "idle";

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
        this._cellSize = Math.max(40, Math.floor(size));
        this.size(this._cellSize, this._cellSize);
        this.refreshVisual();
    }

    public setActive(isActive: boolean): void {
        if (isActive && this._state === "idle") {
            this._state = "active";
            this.refreshVisual();
            this.startPulseAnimation();
        } else if (!isActive && this._state === "active") {
            this._state = "idle";
            this.stopPulseAnimation();
            this.refreshVisual();
        }
    }

    private pulseTween: any = null;
    private _lastScale: number = 1;

    private startPulseAnimation(): void {
        if (this.pulseTween) return;
        this._lastScale = 1;
        this.pulseTween = Laya.timer.frameLoop(1, this, () => {
            if (this._state !== "active") {
                this.stopPulseAnimation();
                return;
            }
            const time = Laya.timer.currTimer;
            const scale = 1 + Math.sin(time * 0.006) * 0.03;
            if (Math.abs(scale - this._lastScale) > 0.001) {
                this.scale(scale, scale);
                this._lastScale = scale;
            }
        });
    }

    private stopPulseAnimation(): void {
        if (this.pulseTween) {
            Laya.timer.clear(this, this.pulseTween);
            this.pulseTween = null;
        }
        this.scale(1, 1);
    }

    public playPressFeedback(): void {
        if (this._isLocked) {
            return;
        }
        Laya.Tween.clearAll(this);
        this.scale(1, 1);
        Laya.Tween.to(this, { scaleX: 0.95, scaleY: 0.95 }, 60, null, Laya.Handler.create(this, () => {
            Laya.Tween.to(this, { scaleX: 1, scaleY: 1 }, 80);
        }));
    }

    public markCompleted(): void {
        this._isLocked = true;
        this._state = "correct";
        this.stopPulseAnimation();
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
        this.stopPulseAnimation();
        this.refreshVisual();
    }

    private refreshVisual(): void {
        const size = this._cellSize;
        this.graphics.clear();
        this.glowSprite.graphics.clear();

        // 设计稿配色
        if (this._state === "correct") {
            // 正确态 - 金色
            this.graphics.drawRoundRect(0, 0, size, size, 10, "#854D0E", "#CA8A04", 2);
            this.graphics.drawRoundRect(3, 3, size - 6, size - 6, 8, "#1E3A5F", null, 0);
            // 发光
            this.glowSprite.graphics.drawCircle(size/2, size/2, size * 0.65, "rgba(251, 191, 36, 0.35)");
            this.setLabelStyle("#FEF08A", true);
        } else if (this._state === "error") {
            // 错误态 - 红色
            this.graphics.drawRoundRect(0, 0, size, size, 10, "#991B1B", "#EF4444", 2);
            this.graphics.drawRoundRect(3, 3, size - 6, size - 6, 8, "#450A0A", null, 0);
            // 发光
            this.glowSprite.graphics.drawCircle(size/2, size/2, size * 0.65, "rgba(248, 113, 113, 0.35)");
            this.setLabelStyle("#FECACA", true);
        } else if (this._state === "active") {
            // 当前目标态 - 紫色高亮边框
            this.graphics.drawRoundRect(0, 0, size, size, 10, "#4338CA", "#A78BFA", 3);
            this.graphics.drawRoundRect(3, 3, size - 6, size - 6, 8, "#1E1B4B", null, 0);
            // 发光
            this.glowSprite.graphics.drawCircle(size/2, size/2, size * 0.55, "rgba(167, 139, 250, 0.4)");
            this.setLabelStyle("#E0E7FF", true);
        } else {
            // 普通态 - 紫色
            this.graphics.drawRoundRect(0, 0, size, size, 10, "#3730A3", "#6366F1", 2);
            this.graphics.drawRoundRect(3, 3, size - 6, size - 6, 8, "#1E1B4B", null, 0);
            // 微弱发光
            this.glowSprite.graphics.drawCircle(size/2, size/2, size * 0.4, "rgba(165, 180, 252, 0.1)");
            this.setLabelStyle("#E0E7FF", false);
        }

        // 更新数字
        this.numberLabel.text = this._number.toString();
        this.numberLabel.fontSize = Math.max(16, Math.floor(size * 0.38));
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

    public setHighlight(highlight: boolean): void {
        if (highlight && !this._isLocked && this._state !== "active") {
            this._state = "active";
            this.startPulseAnimation();
            this.refreshVisual();
        } else if (!highlight && this._state === "active") {
            this._state = "idle";
            this.stopPulseAnimation();
            this.refreshVisual();
        }
    }
}
