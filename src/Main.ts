const { regClass, Event } = Laya;
import { GameScene } from "./GameScene";

@regClass("84f89060-d701-4411-b5dc-ae6e4a05aed0", "../src/Main.ts")
export class Main extends Laya.Scene {
    private currentDifficulty: number = 3;

    private readonly designW: number = 750;
    private readonly designH: number = 1334;

    private root: Laya.Sprite = null;
    private stageBg: Laya.Sprite = null;
    private layerBg: Laya.Sprite = null;
    private layerUI: Laya.Sprite = null;

    private uiScale: number = 1;
    private safeTop: number = 0;
    private safeBottom: number = 0;

    private startBtnWrap: Laya.Sprite = null;
    private startBtnShine: Laya.Sprite = null;
    private startBtnBaseX: number = 0;
    private startBtnBaseY: number = 0;

    private frameTick: number = 0;

    private readonly assetMap: Record<string, string[]> = {
        home_bg: this.makeCandidates("home_bg.png"),
        title: this.makeCandidates("logo/title.png"),
        btn_start: this.makeCandidates("btn/btn_start.png"),
        btn_challenge: this.makeCandidates("btn/btn_challenge.png"),
        btn_rank: this.makeCandidates("btn/btn_rank.png"),
        btn_settings: this.makeCandidates("btn/btn_settings.png"),
        icon_play: this.makeCandidates("icon/icon_play_color.png"),
        icon_trophy: this.makeCandidates("icon/icon_trophy_color.png"),
        icon_rank: this.makeCandidates("icon/icon_rank_color.png"),
        icon_settings: this.makeCandidates("icon/icon_settings_color.png")
    };

    onAwake(): void {
        Laya.stage.alignH = "center";
        Laya.stage.alignV = "middle";
        Laya.stage.scaleMode = "showall";
        Laya.stage.screenMode = "vertical";
        Laya.stage.bgColor = "#2E211B";

        const sw = Math.max(320, Number(Laya.stage.width) || 0);
        const sh = Math.max(568, Number(Laya.stage.height) || 0);
        this.size(sw, sh);

        // Full-screen adaptive background on stage layer.
        this.stageBg = new Laya.Sprite();
        this.addChild(this.stageBg);
        this.refreshStageBg();
        Laya.stage.on(Event.RESIZE, this, this.refreshStageBg);

        this.root = new Laya.Sprite();
        this.uiScale = Math.min(sw / this.designW, sh / this.designH);
        this.root.scale(this.uiScale, this.uiScale);
        this.root.pos((sw - this.designW * this.uiScale) / 2, (sh - this.designH * this.uiScale) / 2);

        this.safeTop = (sh >= 2400 ? 74 : 44) / this.uiScale;
        this.safeBottom = (sh >= 2400 ? 56 : 34) / this.uiScale;

        this.addChild(this.root);

        this.layerBg = new Laya.Sprite();
        this.layerUI = new Laya.Sprite();

        this.root.addChild(this.layerBg);
        this.root.addChild(this.layerUI);

        this.drawBackground();
        this.drawMainUI();

        this.timer.frameLoop(1, this, this.updateHomeFx);
    }

    private drawBackground(): void {
        // Background is rendered on stage layer (full-screen adaptive),
        // so this design-layer background remains empty.
    }

    private refreshStageBg(): void {
        if (!this.stageBg) {
            return;
        }
        const w = Math.max(1, Number(this.width) || Number(Laya.stage.width) || 1);
        const h = Math.max(1, Number(this.height) || Number(Laya.stage.height) || 1);
        this.stageBg.removeChildren();
        this.createAssetImage(this.stageBg, "home_bg", 0, 0, w, h);
    }

    private drawMainUI(): void {
        this.drawLogoAndRibbon();
        this.drawButtons();
    }

    private drawLogoAndRibbon(): void {
        const titleAspect = 500 / 333;
        const buttonTop = 500 + this.safeTop * 0.30;
        const topY = 56 + this.safeTop * 0.45;
        const minGapToButtons = 26;
        const maxTitleBottom = buttonTop - minGapToButtons;

        let titleW = this.designW * 0.72;
        let titleH = titleW / titleAspect;
        const maxHBySpace = Math.max(180, maxTitleBottom - topY);
        if (titleH > maxHBySpace) {
            titleH = maxHBySpace;
            titleW = titleH * titleAspect;
        }

        const titleX = (this.designW - titleW) * 0.5;
        const titleY = topY + (maxHBySpace - titleH) * 0.45;

        this.createAssetImage(this.layerUI, "title", titleX, titleY, titleW, titleH);
    }

    private drawButtons(): void {
        const defs = [
            { label: "开始游戏", btn: "btn_start", icon: "icon_play", action: "start" },
            { label: "挑战模式", btn: "btn_challenge", icon: "icon_trophy", action: "challenge" },
            { label: "排行榜", btn: "btn_rank", icon: "icon_rank", action: "rank" },
            { label: "设置", btn: "btn_settings", icon: "icon_settings", action: "settings" }
        ];

        const bw = this.designW * 0.68;
        const bh = bw * (256 / 1024);
        const gap = 14;
        const x = (this.designW - bw) * 0.5;
        const y0 = 540 + this.safeTop * 0.22;
        const iconSize = 56;
        const iconX = 48;
        const fontSize = Math.max(32, Math.floor(bh * 0.34));

        defs.forEach((d, i) => {
            const y = y0 + i * (bh + gap);

            const wrap = new Laya.Sprite();
            wrap.pos(x, y);
            wrap.size(bw, bh);
            wrap.mouseEnabled = true;
            this.layerUI.addChild(wrap);

            this.createAssetImage(wrap, d.btn, 0, 0, bw, bh);
            this.createAssetImage(wrap, d.icon, iconX, (bh - iconSize) * 0.5, iconSize, iconSize);
            wrap.addChild(this.makeText(d.label, 0, 0, bw, bh, fontSize, "#FFF3C6", true, "#6A3F0A", 4));

            if (d.action === "start") {
                this.startBtnWrap = wrap;
                this.startBtnBaseX = x;
                this.startBtnBaseY = y;
                this.startBtnShine = null;
            }

            const onRelease = () => {
                wrap.scale(1, 1);
                wrap.alpha = 1;
            };

            const onTap = () => {
                console.log("[Home] click:", d.label);
                wrap.scale(0.97, 0.97);
                wrap.alpha = 0.92;
                this.timer.frameOnce(3, this, onRelease);

                if (d.action === "start") {
                    this.currentDifficulty = 5;
                    this.timer.frameOnce(4, this, this.startGame);
                } else if (d.action === "challenge") {
                    this.currentDifficulty = 4;
                } else if (d.action === "rank") {
                    this.currentDifficulty = 3;
                }
            };

            wrap.on(Event.TOUCH_START, this, onTap);
            wrap.on(Event.MOUSE_DOWN, this, onTap);
        });
    }

    private createAssetImage(
        parent: Laya.Sprite,
        key: string,
        x: number,
        y: number,
        w: number,
        h: number
    ): Laya.Sprite {
        const candidates = this.assetMap[key] || [];
        const sp = new Laya.Sprite();
        sp.pos(x, y);
        sp.size(w, h);
        parent.addChild(sp);
        this.tryLoadAsset(sp, key, candidates, 0, w, h);

        return sp;
    }

    private tryLoadAsset(
        sp: Laya.Sprite,
        key: string,
        candidates: string[],
        index: number,
        w: number,
        h: number
    ): void {
        if (index >= candidates.length) {
            console.error(`[HomeAsset] all paths failed for key=${key}`);
            return;
        }
        const path = candidates[index];
        sp.graphics.clear();
        sp.off(Event.ERROR, this, null);
        sp.once(Event.ERROR, this, () => {
            console.warn(`[HomeAsset] fail ${path}, try next`);
            this.tryLoadAsset(sp, key, candidates, index + 1, w, h);
        });
        sp.loadImage(path, 0, 0, w, h, Laya.Handler.create(this, () => {
            if (!sp.texture) {
                console.warn(`[HomeAsset] empty texture ${path}, try next`);
                this.tryLoadAsset(sp, key, candidates, index + 1, w, h);
            } else if (index > 0) {
                console.warn(`[HomeAsset] fallback success key=${key} path=${path}`);
            }
        }));
    }

    private makeCandidates(rel: string): string[] {
        return [
            `ui/home/${rel}`,
            `assets/ui/home/${rel}`,
            `assets/resources/ui/home/${rel}`,
            `resources/ui/home/${rel}`
        ];
    }

    private updateHomeFx(): void {
        this.frameTick++;
    }

    private makeText(
        text: string,
        x: number,
        y: number,
        width: number,
        height: number,
        fontSize: number,
        color: string,
        bold: boolean,
        strokeColor: string,
        stroke: number
    ): Laya.Text {
        const t = new Laya.Text();
        t.text = text;
        t.x = x;
        t.y = y;
        t.width = width;
        t.height = height;
        t.align = "center";
        t.valign = "middle";
        t.fontSize = fontSize;
        t.color = color;
        t.font = "Microsoft YaHei";
        t.bold = bold;
        t.stroke = stroke;
        t.strokeColor = strokeColor;
        return t;
    }

    private startGame(): void {
        // 使用新的 GameScene 场景
        const scene = new GameScene();
        scene.name = "GameScene";
        scene.currentDifficulty = this.currentDifficulty;
        Laya.stage.addChild(scene);
        this.destroy();
    }

    onDestroy(): void {
        this.timer.clear(this, this.updateHomeFx);
        Laya.stage.off(Event.RESIZE, this, this.refreshStageBg);
    }
}
