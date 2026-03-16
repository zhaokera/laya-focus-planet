/**
 * 单元格基类 - Focus Planet
 * 抽取 GridCell 和 MemoryCell 的共同逻辑
 */

export type CellStatus = "idle" | "active" | "correct" | "error" | "hidden" | "displaying" | "input";

export abstract class CellBase extends Laya.Sprite {
    // ==================== 共同属性 ====================
    protected _number: number = 0;
    protected _cellSize: number = 56;
    protected _state: CellStatus = "idle";

    // 贴图路径配置（子类实现）
    protected abstract readonly ASSET: Record<string, string>;

    // 引用组件
    protected bgImage: Laya.Sprite;
    protected glowImage: Laya.Sprite;
    protected numberLabel: Laya.Text;

    // 动画处理器
    protected pulseHandler: (() => void) | null = null;

    // ==================== 构造与初始化 ====================

    constructor(number: number, cellSize: number = 56) {
        super();
        this._number = number;
        this._cellSize = cellSize;

        // 创建公共组件
        this.bgImage = new Laya.Sprite();
        this.glowImage = new Laya.Sprite();
        this.numberLabel = new Laya.Text();

        this.initCell();
    }

    protected initCell(): void {
        this.mouseEnabled = true;
        this.size(this._cellSize, this._cellSize);

        // 初始化背景和光效
        this.loadSkin(this.glowImage, this.getAssetPath("glowPurple"), 128, 128);
        this.glowImage.alpha = 0.0;
        this.addChild(this.glowImage);

        this.loadSkin(this.bgImage, this.getAssetPath("idle"), this._cellSize, this._cellSize);
        this.addChild(this.bgImage);

        // 初始化数字标签
        this.numberLabel.align = "center";
        this.numberLabel.valign = "middle";
        this.numberLabel.bold = true;
        this.numberLabel.font = "Microsoft YaHei";
        this.addChild(this.numberLabel);

        this.refreshVisual();
    }

    // ==================== 公共方法 ====================

    /**
     * 设置格子尺寸
     */
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

    /**
     * 获取格子数字
     */
    public getNumber(): number {
        return this._number;
    }

    /**
     * 获取格子状态
     */
    public getState(): string {
        return this._state;
    }

    /**
     * 重置格子
     */
    public reset(number: number): void {
        this._number = number;
        this._state = "idle";
        this.stopPulseAnimation();
        this.refreshVisual();
    }

    /**
     * 确认格子是否被锁定（不可点击）
     */
    public isLocked(): boolean {
        return this._state === "correct" || this._state === "error";
    }

    // ==================== 抽象方法（子类实现） ====================

    /**
     * 根据状态获取背景贴图路径
     */
    protected abstract getBgSkinByState(): string;

    /**
     * 根据贴图key获取完整路径（支持不同的状态映射）
     */
    protected abstract getAssetPath(key: string): string;

    /**
     * 玩家点击时的处理
     */
    protected abstract onTrigger(): void;

    /**
     * 标记为正确状态
     */
    public abstract markCorrect(): void;

    /**
     * 显示错误状态
     */
    public abstract showError(): Promise<void>;

    // ==================== 私有方法 ====================

    private refreshVisual(): void {
        // 设置光效
        this.loadSkin(this.glowImage, this.getAssetPath("glowPurple"), this.glowImage.width, this.glowImage.height);
        this.glowImage.alpha = this.getGlowAlpha();

        // 设置标签样式
        this.setLabelStyle(this.getTextColor(), this.isTextEmphasized());

        // 设置数字
        this.numberLabel.text = this.getDisplayText();
        this.numberLabel.fontSize = Math.max(16, Math.floor(this._cellSize * 0.35));
        this.numberLabel.width = this._cellSize;
        this.numberLabel.height = this._cellSize;
        this.numberLabel.pos(0, 0);

        // 设置背景
        this.loadSkin(this.bgImage, this.getBgSkinByState(), this._cellSize, this._cellSize);
    }

    /**
     * 获取光效透明度
     */
    protected abstract getGlowAlpha(): number;

    /**
     * 获取文字颜色
     */
    protected abstract getTextColor(): string;

    /**
     * 是否强调文字
     */
    protected abstract isTextEmphasized(): boolean;

    /**
     * 获取显示的文本
     */
    protected abstract getDisplayText(): string;

    /**
     * 设置标签样式
     */
    private setLabelStyle(color: string, emphasized: boolean): void {
        this.numberLabel.color = color;
        this.numberLabel.stroke = emphasized ? 3 : 2;
        this.numberLabel.strokeColor = emphasized ? "rgba(0,0,0,0.30)" : "rgba(0,0,0,0.26)";
    }

    // ==================== 脉冲动画 ====================

    protected startPulseAnimation(): void {
        if (this.pulseHandler) return;

        this.pulseHandler = () => {
            if (this._state !== "active" && this._state !== "displaying") {
                this.stopPulseAnimation();
                return;
            }
            const t = Laya.timer.currTimer;
            const s = 1 + Math.sin(t * 0.006) * 0.03;
            this.scale(s, s);
        };

        Laya.timer.frameLoop(1, this, this.pulseHandler);
    }

    protected stopPulseAnimation(): void {
        if (this.pulseHandler) {
            Laya.timer.clear(this, this.pulseHandler);
            this.pulseHandler = null;
        }
        this.scale(1, 1);
    }

    // ==================== 资源加载 ====================

    private loadSkin(sp: Laya.Sprite, relPath: string, w: number, h: number): void {
        const candidates = this.makeCandidates(relPath);
        this.tryLoad(sp, candidates, 0, w, h);
    }

    private tryLoad(sp: Laya.Sprite, candidates: string[], index: number, w: number, h: number): void {
        if (index >= candidates.length) return;

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

    // ==================== 销毁 ====================

    public override destroy(): void {
        this.stopPulseAnimation();
        super.destroy();
    }
}
