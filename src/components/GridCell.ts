/**
 * 舒尔特方格格子组件（贴图驱动）
 * 继承自 CellBase，实现舒尔特方格 specific 逻辑
 */

import { CellBase, CellStatus } from "./CellBase";

export class GridCell extends CellBase {
    private _expected: number = 0;
    private _isLocked: boolean = false;

    // 贴图路径配置
    private static readonly ASSET_MAP = {
        idle: "ui/game_design/cell_normal.png",
        active: "ui/game_design/cell_active.png",
        correct: "ui/game_design/cell_correct.png",
        error: "ui/game_design/cell_wrong.png",
        glowPurple: "ui/game_design/glow_purple.png",
        glowGold: "ui/game_design/glow_gold.png",
        glowRed: "ui/game_design/glow_red.png"
    };

    constructor(number: number, expected: number, cellSize: number = 56) {
        super(number, cellSize);
        this._expected = expected;
        this._state = "idle";
    }

    // ==================== CellBase 实现 ====================

    protected get ASSET(): Record<string, string> {
        return GridCell.ASSET_MAP;
    }

    protected getBgSkinByState(): string {
        if (this._state === "correct") return this.ASSET.correct;
        if (this._state === "error") return this.ASSET.error;
        if (this._state === "active") return this.ASSET.active;
        return this.ASSET.idle;
    }

    protected getAssetPath(key: string): string {
        return this.ASSET[key] || this.ASSET.idle;
    }

    protected onTrigger(): void {
        // 舒尔特方格点击反馈
        if (this._isLocked) return;
        this.scale(1, 1);
        this.scale(0.95, 0.95);
        Laya.timer.once(80, this, () => {
            if (!this.destroyed) {
                this.scale(1, 1);
            }
        });
    }

    public markCorrect(): void {
        this._isLocked = true;
        this._state = "correct";
        this.stopPulseAnimation();
        this.refreshVisual();
    }

    public async showError(): Promise<void> {
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

    // ==================== 舒尔特特定方法 ====================

    public getExpectedNumber(): number {
        return this._expected;
    }

    public isLocked(): boolean {
        return this._isLocked;
    }

    public reset(number: number, expected: number): void {
        this._number = number;
        this._expected = expected;
        this._isLocked = false;
        this._state = "idle";
        this.stopPulseAnimation();
        this.refreshVisual();
    }

    // ==================== CellBase 抽象方法实现 ====================

    protected getGlowAlpha(): number {
        if (this._state === "correct") return 0.82;
        if (this._state === "error") return 0.82;
        if (this._state === "active") return 0.66;
        return 0.18;
    }

    protected getTextColor(): string {
        if (this._state === "correct") return "#FEF08A";
        if (this._state === "error") return "#FECACA";
        if (this._state === "active") return "#E0E7FF";
        return "#E0E7FF";
    }

    protected isTextEmphasized(): boolean {
        return this._state === "correct" || this._state === "error" || this._state === "active";
    }

    protected getDisplayText(): string {
        return String(this._number);
    }
}
