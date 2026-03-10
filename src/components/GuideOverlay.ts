/**
 * 新手引导组件 - Focus Planet
 * 首次进入游戏时显示引导遮罩
 */

const { Event } = Laya;

interface GuideStep {
    target: string;      // 目标元素名称
    text: string;        // 引导文字
    position: "top" | "bottom" | "center";
}

const GUIDE_STEPS: GuideStep[] = [
    {
        target: "startBtn",
        text: "点击「开始游戏」\n选择你喜欢的游戏模式",
        position: "top"
    },
    {
        target: "challengeBtn",
        text: "「挑战模式」提供闪电战、\n无尽攀登等特殊玩法",
        position: "top"
    },
    {
        target: "achievementBtn",
        text: "在「成就中心」查看\n你的成就和每日任务",
        position: "top"
    }
];

export class BeginnerGuide {
    private static readonly GUIDE_KEY = "focus_planet_guide_shown";

    /**
     * 检查是否已显示过引导
     */
    public static hasShownGuide(): boolean {
        const shown = Laya.LocalStorage.getItem(this.GUIDE_KEY);
        return shown === "true";
    }

    /**
     * 标记引导已显示
     */
    public static markGuideShown(): void {
        Laya.LocalStorage.setItem(this.GUIDE_KEY, "true");
    }

    /**
     * 重置引导状态（用于测试）
     */
    public static resetGuide(): void {
        Laya.LocalStorage.removeItem(this.GUIDE_KEY);
    }
}

export class GuideOverlay extends Laya.Sprite {
    private readonly BASE_W: number = 750;
    private readonly BASE_H: number = 1334;

    private overlay: Laya.Sprite = null;
    private guideContainer: Laya.Sprite = null;
    private currentStep: number = 0;
    private onComplete: () => void;

    constructor(onComplete: () => void) {
        super();
        this.onComplete = onComplete;
        this.createOverlay();
    }

    private createOverlay(): void {
        // 全屏遮罩
        this.overlay = new Laya.Sprite();
        this.overlay.size(this.BASE_W, this.BASE_H);
        this.overlay.graphics.drawRect(0, 0, this.BASE_W, this.BASE_H, "rgba(0,0,0,0.8)");
        this.overlay.mouseEnabled = true;
        this.addChild(this.overlay);

        // 引导容器
        this.guideContainer = new Laya.Sprite();
        this.addChild(this.guideContainer);

        // 显示第一步
        this.showStep(0);

        // 点击任意位置跳过
        this.overlay.on(Event.CLICK, this, this.nextStep);
    }

    private showStep(index: number): void {
        if (index >= GUIDE_STEPS.length) {
            this.complete();
            return;
        }

        this.currentStep = index;
        const step = GUIDE_STEPS[index];
        this.guideContainer.removeChildren();

        // 引导文字
        const textBg = new Laya.Sprite();
        const textW = 320;
        const textH = 80;
        const textX = (this.BASE_W - textW) * 0.5;
        let textY = 0;

        // 根据位置设置Y坐标
        if (step.position === "top") {
            textY = 300;
        } else if (step.position === "bottom") {
            textY = this.BASE_H - 200;
        } else {
            textY = (this.BASE_H - textH) * 0.5;
        }

        textBg.pos(textX, textY);
        textBg.graphics.drawRoundRect(0, 0, textW, textH, 16, "rgba(79,195,247,0.9)");
        this.guideContainer.addChild(textBg);

        const text = new Laya.Text();
        text.text = step.text;
        text.font = "Microsoft YaHei";
        text.fontSize = 18;
        text.color = "#FFFFFF";
        text.leading = 6;
        text.width = textW - 40;
        text.align = "center";
        text.pos(20, 20);
        textBg.addChild(text);

        // 箭头指示器（简单的动画箭头）
        const arrow = new Laya.Sprite();
        arrow.name = "guideArrow";
        arrow.graphics.drawPoly(0, 0, [0, 0, 12, 20, -12, 20], "#FFD700");
        arrow.pos(this.BASE_W * 0.5, textY + textH + 10);
        this.guideContainer.addChild(arrow);

        // 箭头动画
        this.animateArrow(arrow);

        // 提示文字
        const hint = new Laya.Text();
        hint.text = `点击任意位置继续 (${index + 1}/${GUIDE_STEPS.length})`;
        hint.font = "Microsoft YaHei";
        hint.fontSize = 14;
        hint.color = "rgba(255,255,255,0.5)";
        hint.width = this.BASE_W;
        hint.align = "center";
        hint.pos(0, this.BASE_H - 80);
        this.guideContainer.addChild(hint);

        // 跳过按钮
        const skipBtn = new Laya.Sprite();
        skipBtn.size(80, 36);
        skipBtn.pos(this.BASE_W - 100, 60);
        skipBtn.mouseEnabled = true;
        skipBtn.graphics.drawRoundRect(0, 0, 80, 36, 8, "rgba(255,255,255,0.1)", "rgba(255,255,255,0.3)", 1);
        skipBtn.on(Event.CLICK, this, this.complete);
        this.guideContainer.addChild(skipBtn);

        const skipText = new Laya.Text();
        skipText.text = "跳过";
        skipText.font = "Microsoft YaHei";
        skipText.fontSize = 14;
        skipText.color = "#FFFFFF";
        skipText.width = 80;
        skipText.height = 36;
        skipText.align = "center";
        skipText.valign = "middle";
        skipBtn.addChild(skipText);
    }

    private animateArrow(arrow: Laya.Sprite): void {
        const bounce = () => {
            if (!arrow || arrow.destroyed) return;
            Laya.Tween.to(arrow, { y: arrow.y + 10 }, 300, null, Laya.Handler.create(this, () => {
                if (!arrow || arrow.destroyed) return;
                Laya.Tween.to(arrow, { y: arrow.y - 10 }, 300, null, Laya.Handler.create(this, () => {
                    Laya.timer.once(200, this, bounce);
                }));
            }));
        };
        bounce();
    }

    private nextStep(): void {
        this.showStep(this.currentStep + 1);
    }

    private complete(): void {
        BeginnerGuide.markGuideShown();
        Laya.Tween.to(this, { alpha: 0 }, 300, null, Laya.Handler.create(this, () => {
            if (this.onComplete) {
                this.onComplete();
            }
            this.destroy();
        }));
    }

    public destroy(): void {
        Laya.Tween.clearAll(this);
        Laya.timer.clearAll(this);
        super.destroy();
    }
}