const { regClass, Event } = Laya;
import { GameScene } from "./GameScene";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { ChallengeSelectPanel } from "./ChallengeSelectPanel";
import { GameSelectPanel } from "./GameSelectPanel";
import { SettingsPanel } from "./SettingsPanel";
import { SoundManager } from "../managers/SoundManager";
import { GuideOverlay, BeginnerGuide } from "../components/GuideOverlay";
import { FocusRadarManager } from "../managers/FocusRadarManager";
import { AchievementManager } from "../managers/AchievementManager";
import { StreakManager } from "../managers/StreakManager";
import { SAFE_AREA_CONFIG, HOME_CONFIG } from "../config/UIConfig";

@regClass("84f89060-d701-4411-b5dc-ae6e4a05aed0", "../src/Main.ts")
export class Main extends Laya.Scene {
    private _isStarting: boolean = false;

    private readonly designW: number = 750;
    private readonly designH: number = 1334;

    private root: Laya.Sprite = null;
    private stageBg: Laya.Sprite = null;
    private layerBg: Laya.Sprite = null;
    private layerUI: Laya.Sprite = null;

    private readonly uiScale: number = 1;
    private safeTop: number = 0;
    private safeBottom: number = 0;

    private startBtnWrap: Laya.Sprite = null;
    private startBtnBaseX: number = 0;
    private startBtnBaseY: number = 0;

    // 使用配置文件中的常量
    private readonly BUTTON_START_Y = HOME_CONFIG.BUTTONS.START_Y;

    private readonly assetMap: Record<string, string[]> = {
        home_bg: this.makeCandidates("home_bg.png"),
        title: this.makeCandidates("logo/logo_focus_planet.png"),
        btn_start: this.makeCandidates("btn/btn_base_green.png"),
        btn_challenge: this.makeCandidates("btn/btn_base_orange.png"),
        btn_rank: this.makeCandidates("btn/btn_base_purple.png"),
        btn_settings: this.makeCandidates("btn/btn_base_blue.png"),
        btn_achievement: this.makeCandidates("btn/btn_base_blue.png"),
        icon_play: this.makeCandidates("icon/icon_play.png"),
        icon_trophy: this.makeCandidates("icon/icon_trophy.png"),
        icon_rank: this.makeCandidates("icon/icon_rank.png"),
        icon_settings: this.makeCandidates("icon/icon_settings.png")
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

        // 使用配置文件中的安全区常量
        this.safeTop = (sh >= SAFE_AREA_CONFIG.HEIGHT_THRESHOLD
            ? SAFE_AREA_CONFIG.IPHONE_X.SAFE_TOP
            : SAFE_AREA_CONFIG.NORMAL.SAFE_TOP) / this.uiScale;
        this.safeBottom = (sh >= SAFE_AREA_CONFIG.HEIGHT_THRESHOLD
            ? SAFE_AREA_CONFIG.IPHONE_X.SAFE_BOTTOM
            : SAFE_AREA_CONFIG.NORMAL.SAFE_BOTTOM) / this.uiScale;

        this.addChild(this.root);

        this.layerBg = new Laya.Sprite();
        this.layerUI = new Laya.Sprite();

        this.root.addChild(this.layerBg);
        this.root.addChild(this.layerUI);

        this.drawBackground();
        this.drawMainUI();

        // 首次进入显示新手引导
        this.showGuideIfFirstTime();
    }

    private showGuideIfFirstTime(): void {
        if (!BeginnerGuide.hasShownGuide()) {
            // 延迟显示，等待UI渲染完成
            Laya.timer.once(500, this, () => {
                const guide = new GuideOverlay(() => {
                    console.log("[Main] Guide completed");
                });
                guide.name = "GuideOverlay";
                this.root.addChild(guide);
            });
        }
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
        this.drawPlayerStatusCard();
        this.drawButtons();
    }

    private drawLogoAndRibbon(): void {
        const titleAspect = HOME_CONFIG.LOGO.ASPECT_RATIO;
        const buttonTop = this.BUTTON_START_Y;
        const topY = HOME_CONFIG.LOGO.POSITION_Y_OFFSET + this.safeTop * 0.45;
        const minGapToButtons = HOME_CONFIG.LOGO.GAP_TO_BUTTONS;
        const maxTitleBottom = buttonTop - minGapToButtons;

        let titleW = this.designW * HOME_CONFIG.LOGO.WIDTH_RATIO;
        let titleH = titleW / titleAspect;
        const maxHBySpace = Math.max(HOME_CONFIG.LOGO.MIN_HEIGHT, maxTitleBottom - topY);
        if (titleH > maxHBySpace) {
            titleH = maxHBySpace;
            titleW = titleH * titleAspect;
        }

        const titleX = (this.designW - titleW) * 0.5;
        const titleY = topY + (maxHBySpace - titleH) * 0.45;

        this.createAssetImage(this.layerUI, "title", titleX, titleY, titleW, titleH);
    }

    private drawPlayerStatusCard(): void {
        // 获取玩家数据
        const levelInfo = FocusRadarManager.getFocusLevelInfo();
        const summary = FocusRadarManager.getSummary();
        const stats = AchievementManager.getStats();
        const dailyTasks = AchievementManager.getDailyTasks();

        // 计算今日完成情况
        const completedTasks = dailyTasks.filter(t => t.completed).length;
        const totalTasks = dailyTasks.length;

        // 计算连续打卡天数
        const streakDays = this.getStreakDays();

        // 使用配置文件中的常量
        const cardY = HOME_CONFIG.PLAYER_CARD.Y_POSITION;
        const cardW = this.designW * HOME_CONFIG.PLAYER_CARD.WIDTH_RATIO;
        const cardH = HOME_CONFIG.PLAYER_CARD.HEIGHT;
        const cardX = (this.designW - cardW) * 0.5;

        // 卡片容器
        const card = new Laya.Sprite();
        card.pos(cardX, cardY);
        card.size(cardW, cardH);

        // 卡片背景 - 圆角矩形带渐变效果
        card.graphics.drawPath(0, 0, [
            ["moveTo", 16, 0],
            ["lineTo", cardW - 16, 0],
            ["arcTo", cardW, 0, cardW, 16, 16],
            ["lineTo", cardW, cardH - 16],
            ["arcTo", cardW, cardH, cardW - 16, cardH, 16],
            ["lineTo", 16, cardH],
            ["arcTo", 0, cardH, 0, cardH - 16, 16],
            ["lineTo", 0, 16],
            ["arcTo", 0, 0, 16, 0, 16],
            ["closePath"]
        ], { fillStyle: "rgba(40,35,60,0.85)" });

        // 边框发光效果
        card.graphics.drawPath(0, 0, [
            ["moveTo", 16, 0],
            ["lineTo", cardW - 16, 0],
            ["arcTo", cardW, 0, cardW, 16, 16],
            ["lineTo", cardW, cardH - 16],
            ["arcTo", cardW, cardH, cardW - 16, cardH, 16],
            ["lineTo", 16, cardH],
            ["arcTo", 0, cardH, 0, cardH - 16, 16],
            ["lineTo", 0, 16],
            ["arcTo", 0, 0, 16, 0, 16],
            ["closePath"]
        ], { strokeStyle: "rgba(99,102,241,0.4)", lineWidth: 2 });

        this.layerUI.addChild(card);

        // === 左侧：等级徽章 ===
        const badgeX = 20;
        const badgeY = 20;
        const badgeSize = 60;

        // 徽章背景圆
        card.graphics.drawCircle(badgeX + badgeSize/2, badgeY + badgeSize/2, badgeSize/2, levelInfo.color);
        card.graphics.drawCircle(badgeX + badgeSize/2, badgeY + badgeSize/2, badgeSize/2, null, "rgba(255,255,255,0.3)", 2);

        // 等级文字
        const levelText = new Laya.Text();
        levelText.text = levelInfo.level;
        levelText.font = "Microsoft YaHei";
        levelText.fontSize = 24;
        levelText.bold = true;
        levelText.color = "#FFFFFF";
        levelText.width = badgeSize;
        levelText.height = badgeSize;
        levelText.align = "center";
        levelText.valign = "middle";
        levelText.pos(badgeX, badgeY);
        card.addChild(levelText);

        // 称号
        const titleText = new Laya.Text();
        titleText.text = levelInfo.title;
        titleText.font = "Microsoft YaHei";
        titleText.fontSize = 14;
        titleText.bold = true;
        titleText.color = levelInfo.color;
        titleText.width = badgeSize;
        titleText.align = "center";
        titleText.pos(badgeX, badgeY + badgeSize + 2);
        card.addChild(titleText);

        // === 中间：统计数据 ===
        const statsX = 100;
        const statsY = 15;

        // 统计项
        const statItems = [
            { icon: "📊", label: "累计训练", value: `${summary.totalGames}局`, x: 0 },
            { icon: "🔥", label: "连续打卡", value: `${streakDays}天`, x: 130 },
            { icon: "✅", label: "今日任务", value: `${completedTasks}/${totalTasks}`, x: 260 }
        ];

        statItems.forEach(item => {
            const itemY = statsY;

            // 标签
            const label = new Laya.Text();
            label.text = `${item.icon} ${item.label}`;
            label.font = "Microsoft YaHei";
            label.fontSize = 12;
            label.color = "rgba(255,255,255,0.6)";
            label.pos(statsX + item.x, itemY);
            card.addChild(label);

            // 数值
            const value = new Laya.Text();
            value.text = item.value;
            value.font = "Microsoft YaHei";
            value.fontSize = 20;
            value.bold = true;
            value.color = "#FFFFFF";
            value.pos(statsX + item.x, itemY + 20);
            card.addChild(value);
        });

        // === 右侧：今日状态提示 ===
        const tipX = cardW - 90;
        const tipY = 25;

        // 判断今日是否已训练
        const todayPlayed = summary.weeklyGameCount > 0 && this.isTodayPlayed();
        let tipIcon: string, tipText: string, tipColor: string;

        if (todayPlayed) {
            tipIcon = "✨";
            tipText = "今日已训练";
            tipColor = "#4CAF50";
        } else {
            tipIcon = "💪";
            tipText = "开始训练";
            tipColor = "#FFD700";
        }

        const tipIconText = new Laya.Text();
        tipIconText.text = tipIcon;
        tipIconText.fontSize = 28;
        tipIconText.pos(tipX, tipY);
        card.addChild(tipIconText);

        const tipLabel = new Laya.Text();
        tipLabel.text = tipText;
        tipLabel.font = "Microsoft YaHei";
        tipLabel.fontSize = 14;
        tipLabel.bold = true;
        tipLabel.color = tipColor;
        tipLabel.width = 80;
        tipLabel.align = "center";
        tipLabel.pos(tipX - 15, tipY + 35);
        card.addChild(tipLabel);

        // 点击卡片跳转到专注力分析
        card.mouseEnabled = true;
        card.on(Event.CLICK, this, () => {
            SoundManager.playClick();
            this.showFocusRadar();
        });
    }

    /**
     * 获取连续打卡天数（委托给 StreakManager）
     */
    private getStreakDays(): number {
        return StreakManager.getDays();
    }

    /**
     * 检查今天是否已训练（委托给 StreakManager）
     */
    private isTodayPlayed(): boolean {
        return StreakManager.isTodayPlayed();
    }

    private drawButtons(): void {
        const defs = [
            { label: "开始游戏", btn: "btn_start", icon: "icon_play", action: "start" },
            { label: "挑战模式", btn: "btn_challenge", icon: "icon_trophy", action: "challenge" },
            { label: "专注力分析", btn: "btn_achievement", icon: "icon_trophy", action: "focusRadar" },
            { label: "排行榜", btn: "btn_rank", icon: "icon_rank", action: "rank" },
            { label: "设置", btn: "btn_settings", icon: "icon_settings", action: "settings" }
        ];

        // 使用配置文件中的常量
        const bw = this.designW * HOME_CONFIG.BUTTONS.WIDTH_RATIO;
        const bh = bw * HOME_CONFIG.BUTTONS.HEIGHT_RATIO;
        const gap = HOME_CONFIG.BUTTONS.GAP;
        const x = (this.designW - bw) * 0.5;
        const y0 = this.BUTTON_START_Y;
        const iconSize = HOME_CONFIG.BUTTONS.ICON_SIZE;
        const iconX = HOME_CONFIG.BUTTONS.ICON_X;
        const fontSize = Math.max(22, Math.floor(bh * HOME_CONFIG.BUTTONS.FONT_SIZE_RATIO));

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
            }

            const onRelease = () => {
                wrap.scale(1, 1);
                wrap.alpha = 1;
            };

            const onTap = () => {
                console.log("[Home] click:", d.label);
                SoundManager.playClick(); // 播放点击音
                wrap.scale(0.97, 0.97);
                wrap.alpha = 0.92;
                onRelease();

                if (d.action === "start") {
                    if (this._isStarting) return;
                    this._isStarting = true;
                    this.showGameSelect();
                } else if (d.action === "challenge") {
                    this.showChallengeSelect();
                } else if (d.action === "focusRadar") {
                    this.showFocusRadar();
                } else if (d.action === "achievement") {
                    this.showAchievement();
                } else if (d.action === "rank") {
                    this.showLeaderboard();
                } else if (d.action === "settings") {
                    this.showSettings();
                }
            };

            wrap.on(Event.CLICK, this, onTap);
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
        // Use compatibility-safe loadImage signature for this runtime.
        sp.loadImage(path);
    }

    private makeCandidates(rel: string): string[] {
        return [
            `ui/home/${rel}`,
            `assets/ui/home/${rel}`,
            `assets/resources/ui/home/${rel}`,
            `resources/ui/home/${rel}`
        ];
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

    private showLeaderboard(): void {
        // 使用场景跳转方式打开排行榜
        const panel = new LeaderboardPanel();
        panel.name = "LeaderboardPanel";
        Laya.stage.addChild(panel);
        this.destroy();
    }

    private showChallengeSelect(): void {
        // 打开挑战模式选择面板
        const panel = new ChallengeSelectPanel();
        panel.name = "ChallengeSelectPanel";
        Laya.stage.addChild(panel);
        this.destroy();
    }

    private showGameSelect(): void {
        // 打开游戏选择面板
        const panel = new GameSelectPanel();
        panel.name = "GameSelectPanel";
        Laya.stage.addChild(panel);
        this.destroy();
    }

    private showSettings(): void {
        // 打开设置页面
        const panel = new SettingsPanel();
        panel.name = "SettingsPanel";
        Laya.stage.addChild(panel);
        this.destroy();
    }

    private showFocusRadar(): void {
        // 打开专注力分析面板
        import("../panels/FocusRadarPanel").then((module) => {
            const panel = new module.FocusRadarPanel();
            panel.name = "FocusRadarPanel";
            Laya.stage.addChild(panel);
            this.destroy();
        });
    }

    private showAchievement(): void {
        // 打开成就中心
        import("../panels/AchievementPanel").then((module) => {
            const panel = new module.AchievementPanel();
            panel.name = "AchievementPanel";
            Laya.stage.addChild(panel);
            this.destroy();
        });
    }

    onDestroy(): void {
        Laya.stage.off(Event.RESIZE, this, this.refreshStageBg);
    }
}
