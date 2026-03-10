/**
 * 记忆闪现格子组件
 * 支持隐藏、显示、正确、错误等状态
 */
export class MemoryCell extends Laya.Sprite {
    private _number: number = 0;
    private _position: number = 0;
    private _cellSize: number = 56;
    private _state: "hidden" | "displaying" | "input" | "correct" | "error" = "hidden";
    private _isClickable: boolean = false;

    private readonly ASSET = {
        idle: "ui/game_design/cell_normal.png",
        active: "ui/game_design/cell_active.png",
        correct: "ui/game_design/cell_correct.png",
        error: "ui/game_design/cell_wrong.png",
        glowPurple: "ui/game_design/glow_purple.png",
        glowGold: "ui/game_design/glow_gold.png",
        glowRed: "ui/game_design/glow_red.png"
    };

    private bgImage: Laya.Sprite = new Laya.Sprite();
    private glowImage: Laya.Sprite = new Laya.Sprite();
    private numberLabel: Laya.Text = new Laya.Text();

    private pulseHandler: (() => void) | null = null;

    constructor(position: number) {
        super();
        this._position = position;
        this.initCell();
    }

    private initCell(): void {
        this.mouseEnabled = true;

        this.loadSkin(this.glowImage, this.ASSET.glowPurple, 128, 128);
        this.glowImage.alpha = 0.0;
        this.addChild(this.glowImage);

        this.loadSkin(this.bgImage, this.ASSET.idle, this._cellSize, this._cellSize);
        this.addChild(this.bgImage);

        this.numberLabel.align = "center";
        this.numberLabel.valign = "middle";
        this.numberLabel.bold = true;
        this.numberLabel.font = "Microsoft YaHei";
        this.addChild(this.numberLabel);

        this.refreshVisual();
    }

    public setCellSize(size: number): void {
        this._cellSize = Math.max(40, Math.floor(size));
        this.size(this._cellSize, this._cellSize);

        this.bgImage.size(this._cellSize, this._cellSize);
        this.loadSkin(this.bgImage, this.ASSET.idle, this._cellSize, this._cellSize);

        const glowSize = Math.floor(this._cellSize * 1.45);
        this.glowImage.size(glowSize, glowSize);
        this.glowImage.pos((this._cellSize - glowSize) * 0.5, (this._cellSize - glowSize) * 0.5);

        this.refreshVisual();
    }

    /**
     * 显示数字（序列展示阶段）
     */
    public showNumber(num: number, duration: number = 1000): Promise<void> {
        return new Promise<void>((resolve) => {
            this._number = num;
            this._state = "displaying";
            this.refreshVisual();

            // 缩放动画
            this.scale(1, 1);
            Laya.Tween.to(this, { scaleX: 1.15, scaleY: 1.15 }, 150, Laya.Ease.easeOut, Laya.Handler.create(this, () => {
                Laya.Tween.to(this, { scaleX: 1, scaleY: 1 }, 150, Laya.Ease.easeIn);
            }));

            // 持续显示后自动隐藏
            Laya.timer.once(duration, this, () => {
                if (this._state === "displaying") {
                    this.hide();
                }
                resolve();
            });
        });
    }

    /**
     * 隐藏数字（进入输入阶段）
     */
    public hide(): void {
        if (this._state === "correct" || this._state === "error") return;
        this._state = "hidden";
        this._isClickable = true;
        this.refreshVisual();
    }

    /**
     * 设置为输入状态
     */
    public setInputState(clickable: boolean): void {
        this._state = "input";
        this._isClickable = clickable;
        this.refreshVisual();
    }

    /**
     * 玩家点击显示数字
     */
    public revealNumber(num: number): void {
        this._number = num;
        this._state = "displaying";
        this.refreshVisual();
    }

    /**
     * 标记正确
     */
    public markCorrect(): void {
        this._state = "correct";
        this._isClickable = false;
        this.stopPulseAnimation();
        this.refreshVisual();

        // 缩放动画
        this.scale(1, 1);
        Laya.Tween.to(this, { scaleX: 1.1, scaleY: 1.1 }, 100, Laya.Ease.easeOut, Laya.Handler.create(this, () => {
            Laya.Tween.to(this, { scaleX: 1, scaleY: 1 }, 100);
        }));
    }

    /**
     * 显示错误
     */
    public showError(): Promise<void> {
        return new Promise<void>((resolve) => {
            this._state = "error";
            this.refreshVisual();

            // 抖动动画
            const originalX = this.x;
            Laya.Tween.to(this, { x: originalX - 5 }, 50, Laya.Ease.easeOut, Laya.Handler.create(this, () => {
                Laya.Tween.to(this, { x: originalX + 5 }, 50, Laya.Ease.easeOut, Laya.Handler.create(this, () => {
                    Laya.Tween.to(this, { x: originalX }, 50, Laya.Ease.easeOut, Laya.Handler.create(this, () => {
                        Laya.timer.once(300, this, () => {
                            if (this._state === "error") {
                                this._state = "hidden";
                                this._isClickable = true;
                                this.refreshVisual();
                            }
                            resolve();
                        });
                    }));
                }));
            }));
        });
    }

    /**
     * 高亮闪烁（序列展示时）
     */
    public flashHighlight(duration: number = 500): Promise<void> {
        return new Promise<void>((resolve) => {
            this._state = "displaying";
            this.refreshVisual();

            // 开始脉冲动画
            this.startPulseAnimation();

            // 持续后恢复
            Laya.timer.once(duration, this, () => {
                this.stopPulseAnimation();
                resolve();
            });
        });
    }

    private startPulseAnimation(): void {
        if (this.pulseHandler) return;

        this.pulseHandler = () => {
            if (this._state !== "displaying") {
                this.stopPulseAnimation();
                return;
            }
            const t = Laya.timer.currTimer;
            const s = 1 + Math.sin(t * 0.008) * 0.05;
            this.scale(s, s);
        };

        Laya.timer.frameLoop(1, this, this.pulseHandler);
    }

    private stopPulseAnimation(): void {
        if (this.pulseHandler) {
            Laya.timer.clear(this, this.pulseHandler);
            this.pulseHandler = null;
        }
        this.scale(1, 1);
    }

    private refreshVisual(): void {
        if (this._state === "correct") {
            this.loadSkin(this.bgImage, this.ASSET.correct, this._cellSize, this._cellSize);
            this.loadSkin(this.glowImage, this.ASSET.glowGold, this.glowImage.width, this.glowImage.height);
            this.glowImage.alpha = 0.82;
            this.setLabelStyle("#FEF08A", true);
            this.numberLabel.text = String(this._number);
        } else if (this._state === "error") {
            this.loadSkin(this.bgImage, this.ASSET.error, this._cellSize, this._cellSize);
            this.loadSkin(this.glowImage, this.ASSET.glowRed, this.glowImage.width, this.glowImage.height);
            this.glowImage.alpha = 0.82;
            this.setLabelStyle("#FECACA", true);
            this.numberLabel.text = String(this._number);
        } else if (this._state === "displaying") {
            this.loadSkin(this.bgImage, this.ASSET.active, this._cellSize, this._cellSize);
            this.loadSkin(this.glowImage, this.ASSET.glowPurple, this.glowImage.width, this.glowImage.height);
            this.glowImage.alpha = 0.66;
            this.setLabelStyle("#E0E7FF", true);
            this.numberLabel.text = String(this._number);
        } else {
            // hidden 或 input 状态 - 显示问号或不显示数字
            this.loadSkin(this.bgImage, this.ASSET.idle, this._cellSize, this._cellSize);
            this.loadSkin(this.glowImage, this.ASSET.glowPurple, this.glowImage.width, this.glowImage.height);
            this.glowImage.alpha = 0.18;
            this.setLabelStyle("#E0E7FF", false);
            this.numberLabel.text = "?";
        }

        this.numberLabel.fontSize = Math.max(16, Math.floor(this._cellSize * 0.4));
        this.numberLabel.width = this._cellSize;
        this.numberLabel.height = this._cellSize;
        this.numberLabel.pos(0, 0);
    }

    private setLabelStyle(color: string, emphasized: boolean): void {
        this.numberLabel.color = color;
        this.numberLabel.stroke = emphasized ? 3 : 2;
        this.numberLabel.strokeColor = emphasized ? "rgba(0,0,0,0.30)" : "rgba(0,0,0,0.26)";
    }

    public getNumber(): number {
        return this._number;
    }

    public getPosition(): number {
        return this._position;
    }

    public isClickable(): boolean {
        return this._isClickable && this._state !== "correct" && this._state !== "error";
    }

    public getState(): string {
        return this._state;
    }

    public reset(): void {
        this._number = 0;
        this._state = "hidden";
        this._isClickable = false;
        this.stopPulseAnimation();
        this.refreshVisual();
    }

    private loadSkin(sp: Laya.Sprite, relPath: string, w: number, h: number): void {
        const candidates = this.makeCandidates(relPath);
        this.tryLoad(sp, candidates, 0, w, h);
    }

    private tryLoad(sp: Laya.Sprite, candidates: string[], index: number, w: number, h: number): void {
        if (index >= candidates.length) {
            return;
        }
        const path = candidates[index];
        sp.loadImage(path);
    }

    private makeCandidates(rel: string): string[] {
        return [
            rel,
            `assets/${rel}`,
            `assets/resources/${rel}`,
            `resources/${rel}`
        ];
    }

    public destroy(): void {
        this.stopPulseAnimation();
        super.destroy();
    }
}