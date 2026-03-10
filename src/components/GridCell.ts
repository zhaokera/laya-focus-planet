/**
 * 舒尔特方格格子组件（贴图驱动）
 */
export class GridCell extends Laya.Sprite {
    private _number: number = 0;
    private _expected: number = 0;
    private _isLocked: boolean = false;
    private _cellSize: number = 56;
    private _state: "idle" | "correct" | "error" | "active" = "idle";

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

    constructor(number: number, expected: number) {
        super();
        this._number = number;
        this._expected = expected;
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
        this.loadSkin(this.bgImage, this.getBgSkinByState(), this._cellSize, this._cellSize);

        const glowSize = Math.floor(this._cellSize * 1.45);
        this.glowImage.size(glowSize, glowSize);
        this.glowImage.pos((this._cellSize - glowSize) * 0.5, (this._cellSize - glowSize) * 0.5);

        this.refreshVisual();
    }

    public playPressFeedback(): void {
        if (this._isLocked) return;

        this.scale(1, 1);
        this.scale(0.95, 0.95);
        Laya.timer.once(80, this, () => {
            if (!this.destroyed) {
                this.scale(1, 1);
            }
        });
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

            this.scale(1, 1);
            this.scale(1.05, 1.05);
            Laya.timer.once(90, this, () => {
                if (!this.destroyed) {
                    this.scale(1, 1);
                    this._state = "idle";
                    this.refreshVisual();
                    resolve();
                } else {
                    resolve();
                }
            });
        });
    }

    public setHighlight(highlight: boolean): void {
        if (this._isLocked) return;

        if (highlight && this._state !== "active") {
            this._state = "active";
            this.startPulseAnimation();
            this.refreshVisual();
        } else if (!highlight && this._state === "active") {
            this._state = "idle";
            this.stopPulseAnimation();
            this.refreshVisual();
        }
    }

    private startPulseAnimation(): void {
        if (this.pulseHandler) return;

        this.pulseHandler = () => {
            if (this._state !== "active") {
                this.stopPulseAnimation();
                return;
            }
            const t = Laya.timer.currTimer;
            const s = 1 + Math.sin(t * 0.006) * 0.03;
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
        } else if (this._state === "error") {
            this.loadSkin(this.bgImage, this.ASSET.error, this._cellSize, this._cellSize);
            this.loadSkin(this.glowImage, this.ASSET.glowRed, this.glowImage.width, this.glowImage.height);
            this.glowImage.alpha = 0.82;
            this.setLabelStyle("#FECACA", true);
        } else if (this._state === "active") {
            this.loadSkin(this.bgImage, this.ASSET.active, this._cellSize, this._cellSize);
            this.loadSkin(this.glowImage, this.ASSET.glowPurple, this.glowImage.width, this.glowImage.height);
            this.glowImage.alpha = 0.66;
            this.setLabelStyle("#E0E7FF", true);
        } else {
            this.loadSkin(this.bgImage, this.ASSET.idle, this._cellSize, this._cellSize);
            this.loadSkin(this.glowImage, this.ASSET.glowPurple, this.glowImage.width, this.glowImage.height);
            this.glowImage.alpha = 0.18;
            this.setLabelStyle("#E0E7FF", false);
        }

        this.numberLabel.text = String(this._number);
        this.numberLabel.fontSize = Math.max(16, Math.floor(this._cellSize * 0.35));
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

    public isLocked(): boolean {
        return this._isLocked;
    }

    public getExpectedNumber(): number {
        return this._expected;
    }

    public reset(number: number, expected: number): void {
        this._number = number;
        this._expected = expected;
        this._isLocked = false;
        this._state = "idle";
        this.stopPulseAnimation();
        this.refreshVisual();
    }

    private getBgSkinByState(): string {
        if (this._state === "correct") return this.ASSET.correct;
        if (this._state === "error") return this.ASSET.error;
        if (this._state === "active") return this.ASSET.active;
        return this.ASSET.idle;
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
}
