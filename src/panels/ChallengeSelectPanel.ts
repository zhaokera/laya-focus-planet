/**
 * 挑战模式选择面板 - Focus Planet
 * 提供3种挑战类型选择：闪电战、无尽攀登、零失误
 */

const { Event } = Laya;

export type ChallengeType = "blitz" | "endless" | "precision";

interface ChallengeConfig {
    type: ChallengeType;
    name: string;
    icon: string;
    description: string;
    color: string;
}

export class ChallengeSelectPanel extends Laya.Scene {
    private readonly BASE_W: number = 375;
    private readonly BASE_H: number = 750;

    private readonly CHALLENGES: ChallengeConfig[] = [
        {
            type: "blitz",
            name: "闪电战",
            icon: "⚡",
            description: "限时60秒，尽可能完成更多方格",
            color: "#FFD700"
        },
        {
            type: "endless",
            name: "无尽攀登",
            icon: "🏔️",
            description: "从3x3开始，通关后难度递增",
            color: "#4FC3F7"
        },
        {
            type: "precision",
            name: "零失误",
            icon: "🎯",
            description: "3条命，点错3次结束",
            color: "#FF6B6B"
        }
    ];

    private root: Laya.Sprite = null;
    private stageBg: Laya.Sprite = null;
    private bgLayer: Laya.Sprite = null;
    private panelContainer: Laya.Sprite = null;
    private contentLayer: Laya.Sprite = null;

    private onSelectCallback: ((type: ChallengeType) => void) | null = null;

    constructor() {
        super();
    }

    /**
     * 设置选择回调
     */
    public setOnSelect(callback: (type: ChallengeType) => void): void {
        this.onSelectCallback = callback;
    }

    onAwake(): void {
        Laya.stage.alignH = "center";
        Laya.stage.alignV = "middle";
        Laya.stage.scaleMode = "showall";
        Laya.stage.screenMode = "vertical";
        Laya.stage.bgColor = "#1A1A2E";

        this.initRoot();
        this.initPanel();

        Laya.stage.on(Event.RESIZE, this, this.onResize);
    }

    private initRoot(): void {
        this.size(Math.max(320, Laya.stage.width), Math.max(568, Laya.stage.height));

        // 全屏背景
        this.stageBg = new Laya.Sprite();
        this.addChild(this.stageBg);
        this.refreshStageBg();

        // 缩放容器
        this.root = new Laya.Sprite();
        this.addChild(this.root);
        this.applyLayoutScale();
    }

    private applyLayoutScale(): void {
        const sw = Math.max(1, Laya.stage.width);
        const sh = Math.max(1, Laya.stage.height);
        const scale = Math.min(sw / this.BASE_W, sh / this.BASE_H);

        this.root.scale(scale, scale);
        this.root.pos((sw - this.BASE_W * scale) * 0.5, (sh - this.BASE_H * scale) * 0.5);
        this.root.size(this.BASE_W, this.BASE_H);
    }

    private refreshStageBg(): void {
        if (!this.stageBg) return;
        const sw = Math.max(1, Laya.stage.width);
        const sh = Math.max(1, Laya.stage.height);

        this.stageBg.graphics.clear();
        // 深空渐变背景
        const steps = 10;
        for (let i = 0; i < steps; i++) {
            const ratio = i / steps;
            const nextRatio = (i + 1) / steps;
            const y1 = sh * ratio;
            const y2 = sh * nextRatio;
            const h = y2 - y1;

            const r = Math.floor(15 + ratio * 10);
            const g = Math.floor(15 + ratio * 10);
            const b = Math.floor(26 + ratio * 20);
            const color = `rgb(${r},${g},${b})`;

            this.stageBg.graphics.drawRect(0, y1, sw, h + 1, color);
        }
    }

    private onResize(): void {
        const sw = Math.max(320, Laya.stage.width);
        const sh = Math.max(568, Laya.stage.height);
        this.size(sw, sh);

        this.applyLayoutScale();
        this.refreshStageBg();
    }

    private initPanel(): void {
        // 面板参数
        const panelW = 340;
        const panelH = 480;
        const panelX = (this.BASE_W - panelW) * 0.5;
        const panelY = 100;

        // 半透明遮罩背景
        this.bgLayer = new Laya.Sprite();
        this.bgLayer.graphics.drawRect(0, 0, this.BASE_W, this.BASE_H, "rgba(0,0,0,0.5)");
        this.bgLayer.alpha = 0;
        this.root.addChild(this.bgLayer);

        // 主面板容器
        this.panelContainer = new Laya.Sprite();
        this.panelContainer.pos(panelX, panelY);
        this.panelContainer.size(panelW, panelH);
        this.root.addChild(this.panelContainer);

        // 面板背景
        this.createPanelBackground(panelW, panelH);

        // 内容层
        this.contentLayer = new Laya.Sprite();
        this.panelContainer.addChild(this.contentLayer);

        this.createTitle();
        this.createChallengeCards();
        this.createBackButton();

        // 入场动画
        this.playEnterAnimation();
    }

    private createPanelBackground(panelW: number, panelH: number): void {
        // 阴影
        const shadow = new Laya.Sprite();
        shadow.graphics.drawRoundRect(6, 12, panelW, panelH, 24, "rgba(0,0,0,0.5)");
        this.panelContainer.addChild(shadow);

        // 面板主体
        const panelBg = new Laya.Sprite();
        panelBg.size(panelW, panelH);
        const g = panelBg.graphics;
        g.drawRoundRect(0, 0, panelW, panelH, 24,
            "rgba(255,255,255,0.08)",
            "rgba(255,255,255,0.15)",
            1
        );
        this.panelContainer.addChild(panelBg);

        // 装饰边角
        this.drawPanelCorners(panelBg, panelW, panelH);
    }

    private drawPanelCorners(panel: Laya.Sprite, w: number, h: number): void {
        const color = "rgba(139,92,246,0.7)";
        const lineW = 2;
        const seg = 16;
        const m = 12;

        const corners = [
            { lines: [[0, seg, 0, 0], [0, 0, seg, 0]], pos: [m, m] },
            { lines: [[0, 0, seg, 0], [seg, 0, seg, seg]], pos: [w - m - seg, m] },
            { lines: [[0, 0, 0, seg], [0, seg, seg, seg]], pos: [m, h - m - seg] },
            { lines: [[seg, 0, seg, seg], [0, seg, seg, seg]], pos: [w - m - seg, h - m - seg] }
        ];

        corners.forEach((corner) => {
            const sprite = new Laya.Sprite();
            corner.lines.forEach((line) => {
                sprite.graphics.drawLine(line[0], line[1], line[2], line[3], color, lineW);
            });
            sprite.pos(corner.pos[0], corner.pos[1]);
            panel.addChild(sprite);
        });
    }

    private createTitle(): void {
        const panelW = 340;

        // 主标题
        const titleText = new Laya.Text();
        titleText.text = "选择挑战类型";
        titleText.font = "Microsoft YaHei";
        titleText.fontSize = 24;
        titleText.bold = true;
        titleText.color = "#FFD700";
        titleText.stroke = 2;
        titleText.strokeColor = "rgba(255,165,0,0.3)";
        titleText.width = panelW;
        titleText.align = "center";
        titleText.pos(0, 24);
        this.contentLayer.addChild(titleText);

        // 副标题
        const subtitleText = new Laya.Text();
        subtitleText.text = "选择一种挑战模式开始游戏";
        subtitleText.font = "Microsoft YaHei";
        subtitleText.fontSize = 12;
        subtitleText.color = "rgba(255,255,255,0.5)";
        subtitleText.width = panelW;
        subtitleText.align = "center";
        subtitleText.pos(0, 56);
        this.contentLayer.addChild(subtitleText);
    }

    private createChallengeCards(): void {
        const panelW = 340;
        const cardW = 300;
        const cardH = 80;
        const gap = 12;
        const startX = (panelW - cardW) * 0.5;
        const startY = 90;

        this.CHALLENGES.forEach((challenge, index) => {
            const card = this.createChallengeCard(challenge, cardW, cardH);
            card.pos(startX, startY + index * (cardH + gap));
            card.alpha = 0;
            card.y = startY + index * (cardH + gap) + 20;

            this.contentLayer.addChild(card);

            // 入场动画
            Laya.Tween.to(card, {
                alpha: 1,
                y: startY + index * (cardH + gap)
            }, 400, Laya.Ease.easeOut, null, index * 100);

            // 点击事件
            card.on(Event.CLICK, this, () => this.onChallengeSelect(challenge.type));
        });
    }

    private createChallengeCard(challenge: ChallengeConfig, w: number, h: number): Laya.Sprite {
        const card = new Laya.Sprite();
        card.size(w, h);
        card.mouseEnabled = true;

        const g = card.graphics;

        // 背景 - 渐变效果（用多段矩形模拟）
        const steps = 8;
        for (let i = 0; i < steps; i++) {
            const ratio = i / steps;
            const nextRatio = (i + 1) / steps;
            const x1 = w * ratio;
            const x2 = w * nextRatio;
            const stepW = x2 - x1;

            const alpha = 0.05 + ratio * 0.08;
            const color = `rgba(${this.hexToRgb(challenge.color)},${alpha})`;
            g.drawRect(x1, 0, stepW + 1, h, color);
        }

        // 边框
        g.drawRoundRect(0, 0, w, h, 12, null, `${challenge.color}40`, 1.5);

        // 图标背景圆
        const iconBgX = 20;
        const iconBgY = (h - 48) * 0.5;
        g.drawCircle(iconBgX + 24, iconBgY + 24, 24, `${challenge.color}30`);

        // 图标文字
        const iconText = new Laya.Text();
        iconText.text = challenge.icon;
        iconText.fontSize = 28;
        iconText.width = 48;
        iconText.height = 48;
        iconText.align = "center";
        iconText.valign = "middle";
        iconText.pos(iconBgX, iconBgY);
        card.addChild(iconText);

        // 挑战名称
        const nameText = new Laya.Text();
        nameText.text = challenge.name;
        nameText.font = "Microsoft YaHei";
        nameText.fontSize = 18;
        nameText.bold = true;
        nameText.color = challenge.color;
        nameText.pos(80, 16);
        card.addChild(nameText);

        // 描述
        const descText = new Laya.Text();
        descText.text = challenge.description;
        descText.font = "Microsoft YaHei";
        descText.fontSize = 12;
        descText.color = "rgba(255,255,255,0.6)";
        descText.pos(80, 42);
        card.addChild(descText);

        // 箭头
        const arrowText = new Laya.Text();
        arrowText.text = "›";
        arrowText.font = "Microsoft YaHei";
        arrowText.fontSize = 24;
        arrowText.color = "rgba(255,255,255,0.3)";
        arrowText.pos(w - 36, (h - 24) * 0.5);
        card.addChild(arrowText);

        return card;
    }

    private hexToRgb(hex: string): string {
        // 简单的 hex 转 rgb
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
        }
        return "255,255,255";
    }

    private createBackButton(): void {
        const panelW = 340;
        const btnW = 120;
        const btnH = 40;
        const btnX = (panelW - btnW) * 0.5;
        const btnY = 400;

        const btn = new Laya.Sprite();
        btn.size(btnW, btnH);
        btn.pos(btnX, btnY);
        btn.mouseEnabled = true;

        const g = btn.graphics;
        g.drawRoundRect(0, 0, btnW, btnH, 12, "rgba(255,255,255,0.1)", "rgba(255,255,255,0.3)", 1);

        const btnText = new Laya.Text();
        btnText.text = "返回";
        btnText.font = "Microsoft YaHei";
        btnText.fontSize = 14;
        btnText.bold = true;
        btnText.color = "#FFFFFF";
        btnText.width = btnW;
        btnText.height = btnH;
        btnText.align = "center";
        btnText.valign = "middle";
        btn.addChild(btnText);

        btn.on(Event.CLICK, this, this.goBack);

        this.contentLayer.addChild(btn);
    }

    private onChallengeSelect(type: ChallengeType): void {
        console.log("[ChallengeSelect] selected:", type);

        if (this.onSelectCallback) {
            this.onSelectCallback(type);
        }

        // 跳转到挑战场景
        this.startChallengeScene(type);
    }

    private startChallengeScene(type: ChallengeType): void {
        // 动态导入避免循环依赖
        import("./ChallengeScene").then((module) => {
            const scene = new module.ChallengeScene();
            scene.challengeType = type;
            scene.name = "ChallengeScene";
            Laya.stage.addChild(scene);
            this.destroy();
        });
    }

    private goBack(): void {
        // 返回首页
        import("./Main").then((module) => {
            const mainScene = new module.Main();
            mainScene.name = "Main";
            Laya.stage.addChild(mainScene);
            this.destroy();
        });
    }

    private playEnterAnimation(): void {
        this.bgLayer.alpha = 0;
        this.panelContainer.scale(0.9, 0.9);
        this.panelContainer.alpha = 0;

        Laya.Tween.to(this.bgLayer, { alpha: 1 }, 200);
        Laya.Tween.to(this.panelContainer, { scaleX: 1, scaleY: 1, alpha: 1 }, 250, Laya.Ease.backOut);
    }

    public destroy(): void {
        Laya.stage.off(Event.RESIZE, this, this.onResize);
        Laya.Tween.clearAll(this.bgLayer);
        Laya.Tween.clearAll(this.panelContainer);
        super.destroy();
    }
}