/**
 * 成就与任务面板 - Focus Planet
 * 显示玩家成就和每日任务
 */

const { Event } = Laya;

import { AchievementManager } from "../managers/AchievementManager";
import { Achievement } from "../data/achievements";
import { DailyTask } from "../data/dailyTasks";

type TabType = "achievements" | "tasks";

export class AchievementPanel extends Laya.Scene {
    private readonly BASE_W: number = 375;
    private readonly BASE_H: number = 750;

    private root: Laya.Sprite = null;
    private stageBg: Laya.Sprite = null;
    private bgLayer: Laya.Sprite = null;
    private panelContainer: Laya.Sprite = null;
    private contentLayer: Laya.Sprite = null;
    private scrollContainer: Laya.Sprite = null;

    private currentTab: TabType = "achievements";
    private tabBtns: Record<TabType, Laya.Sprite> = {} as any;
    private coinText: Laya.Text = null;

    private achievements: Achievement[] = [];
    private dailyTasks: DailyTask[] = [];

    constructor() {
        super();
    }

    onAwake(): void {
        Laya.stage.alignH = "center";
        Laya.stage.alignV = "middle";
        Laya.stage.scaleMode = "showall";
        Laya.stage.screenMode = "vertical";
        Laya.stage.bgColor = "#1A1A2E";

        // 加载数据
        AchievementManager.init();
        this.achievements = AchievementManager.getAchievements();
        this.dailyTasks = AchievementManager.getDailyTasks();

        this.initRoot();
        this.initPanel();

        Laya.stage.on(Event.RESIZE, this, this.onResize);
    }

    private initRoot(): void {
        this.size(Math.max(320, Laya.stage.width), Math.max(568, Laya.stage.height));

        this.stageBg = new Laya.Sprite();
        this.addChild(this.stageBg);
        this.refreshStageBg();

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
        const panelW = 340;
        const panelH = 520;
        const panelX = (this.BASE_W - panelW) * 0.5;
        const panelY = 80;

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
        this.createCoinDisplay();
        this.createTabs();
        this.createScrollContainer();
        this.createBackButton();

        // 默认显示成就
        this.showTab("achievements");

        // 入场动画
        this.playEnterAnimation();
    }

    private createPanelBackground(panelW: number, panelH: number): void {
        const shadow = new Laya.Sprite();
        shadow.graphics.drawRoundRect(6, 12, panelW, panelH, 24, "rgba(0,0,0,0.5)");
        this.panelContainer.addChild(shadow);

        const panelBg = new Laya.Sprite();
        panelBg.size(panelW, panelH);
        panelBg.graphics.drawRoundRect(0, 0, panelW, panelH, 24,
            "rgba(255,255,255,0.08)",
            "rgba(255,255,255,0.15)",
            1
        );
        this.panelContainer.addChild(panelBg);
    }

    private createTitle(): void {
        const titleText = new Laya.Text();
        titleText.text = "成就中心";
        titleText.font = "Microsoft YaHei";
        titleText.fontSize = 22;
        titleText.bold = true;
        titleText.color = "#FFD700";
        titleText.stroke = 2;
        titleText.strokeColor = "rgba(255,165,0,0.3)";
        titleText.width = 340;
        titleText.align = "center";
        titleText.pos(0, 20);
        this.contentLayer.addChild(titleText);
    }

    private createCoinDisplay(): void {
        const coinBg = new Laya.Sprite();
        coinBg.size(100, 28);
        coinBg.pos(220, 18);
        coinBg.graphics.drawRoundRect(0, 0, 100, 28, 14, "rgba(255,215,0,0.2)", "rgba(255,215,0,0.4)", 1);
        this.contentLayer.addChild(coinBg);

        const coinIcon = new Laya.Text();
        coinIcon.text = "金币";
        coinIcon.font = "Microsoft YaHei";
        coinIcon.fontSize = 12;
        coinIcon.color = "#FFD700";
        coinIcon.pos(8, 7);
        coinBg.addChild(coinIcon);

        this.coinText = new Laya.Text();
        this.coinText.text = String(AchievementManager.getTotalCoins());
        this.coinText.font = "Microsoft YaHei";
        this.coinText.fontSize = 14;
        this.coinText.bold = true;
        this.coinText.color = "#FFFFFF";
        this.coinText.width = 60;
        this.coinText.align = "right";
        this.coinText.pos(30, 5);
        coinBg.addChild(this.coinText);
    }

    private createTabs(): void {
        const tabY = 55;
        const tabW = 100;
        const tabH = 32;
        const gap = 20;
        const startX = (340 - tabW * 2 - gap) * 0.5;

        // 成就标签
        const achieveTab = new Laya.Sprite();
        achieveTab.size(tabW, tabH);
        achieveTab.pos(startX, tabY);
        achieveTab.mouseEnabled = true;
        achieveTab.graphics.drawRoundRect(0, 0, tabW, tabH, 8, "rgba(79,195,247,0.3)", "rgba(79,195,247,0.5)", 1);
        achieveTab.on(Event.CLICK, this, () => this.showTab("achievements"));
        this.contentLayer.addChild(achieveTab);

        const achieveText = new Laya.Text();
        achieveText.text = "成就";
        achieveText.font = "Microsoft YaHei";
        achieveText.fontSize = 14;
        achieveText.bold = true;
        achieveText.color = "#4FC3F7";
        achieveText.width = tabW;
        achieveText.height = tabH;
        achieveText.align = "center";
        achieveText.valign = "middle";
        achieveTab.addChild(achieveText);
        this.tabBtns.achievements = achieveTab;

        // 每日任务标签
        const taskTab = new Laya.Sprite();
        taskTab.size(tabW, tabH);
        taskTab.pos(startX + tabW + gap, tabY);
        taskTab.mouseEnabled = true;
        taskTab.graphics.drawRoundRect(0, 0, tabW, tabH, 8, "rgba(255,255,255,0.1)");
        taskTab.on(Event.CLICK, this, () => this.showTab("tasks"));
        this.contentLayer.addChild(taskTab);

        const taskText = new Laya.Text();
        taskText.text = "每日任务";
        taskText.font = "Microsoft YaHei";
        taskText.fontSize = 14;
        taskText.bold = true;
        taskText.color = "#FFFFFF";
        taskText.width = tabW;
        taskText.height = tabH;
        taskText.align = "center";
        taskText.valign = "middle";
        taskTab.addChild(taskText);
        this.tabBtns.tasks = taskTab;
    }

    private createScrollContainer(): void {
        this.scrollContainer = new Laya.Sprite();
        this.scrollContainer.pos(10, 95);
        this.scrollContainer.size(320, 380);
        this.contentLayer.addChild(this.scrollContainer);
    }

    private showTab(tab: TabType): void {
        this.currentTab = tab;

        // 更新标签样式
        Object.keys(this.tabBtns).forEach((key) => {
            const t = key as TabType;
            const btn = this.tabBtns[t];
            const isActive = t === tab;

            btn.graphics.clear();
            if (isActive) {
                btn.graphics.drawRoundRect(0, 0, btn.width, btn.height, 8, "rgba(79,195,247,0.3)", "rgba(79,195,247,0.5)", 1);
            } else {
                btn.graphics.drawRoundRect(0, 0, btn.width, btn.height, 8, "rgba(255,255,255,0.1)");
            }

            const text = btn.getChildAt(0) as Laya.Text;
            if (text) {
                text.color = isActive ? "#4FC3F7" : "#FFFFFF";
            }
        });

        // 清空并重新渲染内容
        this.scrollContainer.removeChildren();

        if (tab === "achievements") {
            this.renderAchievements();
        } else {
            this.renderDailyTasks();
        }
    }

    private renderAchievements(): void {
        const itemH = 70;
        const itemW = 310;

        this.achievements.forEach((achievement, index) => {
            const item = new Laya.Sprite();
            item.size(itemW, itemH);
            item.pos(5, index * (itemH + 8));

            const bgColor = achievement.unlocked ? "rgba(79,195,247,0.15)" : "rgba(255,255,255,0.05)";
            const borderColor = achievement.unlocked ? "rgba(79,195,247,0.3)" : "rgba(255,255,255,0.1)";
            item.graphics.drawRoundRect(0, 0, itemW, itemH, 10, bgColor, borderColor, 1);
            this.scrollContainer.addChild(item);

            // 图标
            const iconBg = new Laya.Sprite();
            iconBg.size(40, 40);
            iconBg.pos(12, 15);
            iconBg.graphics.drawCircle(20, 20, 20, achievement.unlocked ? "#4FC3F7" : "rgba(255,255,255,0.2)");
            item.addChild(iconBg);

            const iconText = new Laya.Text();
            iconText.text = this.getIconEmoji(achievement.icon);
            iconText.font = "Microsoft YaHei";
            iconText.fontSize = 18;
            iconText.width = 40;
            iconText.height = 40;
            iconText.align = "center";
            iconText.valign = "middle";
            iconText.pos(0, 0);
            iconBg.addChild(iconText);

            // 名称
            const nameText = new Laya.Text();
            nameText.text = achievement.name;
            nameText.font = "Microsoft YaHei";
            nameText.fontSize = 14;
            nameText.bold = true;
            nameText.color = achievement.unlocked ? "#FFFFFF" : "rgba(255,255,255,0.5)";
            nameText.pos(60, 15);
            item.addChild(nameText);

            // 描述
            const descText = new Laya.Text();
            descText.text = achievement.description;
            descText.font = "Microsoft YaHei";
            descText.fontSize = 11;
            descText.color = achievement.unlocked ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)";
            descText.pos(60, 35);
            item.addChild(descText);

            // 奖励
            const rewardText = new Laya.Text();
            rewardText.text = `+${achievement.reward}`;
            rewardText.font = "Microsoft YaHei";
            rewardText.fontSize = 14;
            rewardText.bold = true;
            rewardText.color = achievement.unlocked ? "#FFD700" : "rgba(255,215,0,0.3)";
            rewardText.width = 50;
            rewardText.align = "right";
            rewardText.pos(itemW - 60, 25);
            item.addChild(rewardText);

            // 已解锁标记
            if (achievement.unlocked) {
                const checkText = new Laya.Text();
                checkText.text = "已解锁";
                checkText.font = "Microsoft YaHei";
                checkText.fontSize = 10;
                checkText.color = "#4CAF50";
                checkText.pos(60, 52);
                item.addChild(checkText);
            }
        });
    }

    private renderDailyTasks(): void {
        const itemH = 80;
        const itemW = 310;

        // 刷新任务数据
        this.dailyTasks = AchievementManager.getDailyTasks();

        this.dailyTasks.forEach((task, index) => {
            const item = new Laya.Sprite();
            item.size(itemW, itemH);
            item.pos(5, index * (itemH + 8));

            let bgColor = "rgba(255,255,255,0.05)";
            let borderColor = "rgba(255,255,255,0.1)";
            if (task.completed && !task.claimed) {
                bgColor = "rgba(76,175,80,0.15)";
                borderColor = "rgba(76,175,80,0.3)";
            }

            item.graphics.drawRoundRect(0, 0, itemW, itemH, 10, bgColor, borderColor, 1);
            this.scrollContainer.addChild(item);

            // 名称
            const nameText = new Laya.Text();
            nameText.text = task.name;
            nameText.font = "Microsoft YaHei";
            nameText.fontSize = 14;
            nameText.bold = true;
            nameText.color = task.completed ? "#FFFFFF" : "rgba(255,255,255,0.7)";
            nameText.pos(12, 12);
            item.addChild(nameText);

            // 描述
            const descText = new Laya.Text();
            descText.text = task.description;
            descText.font = "Microsoft YaHei";
            descText.fontSize = 11;
            descText.color = "rgba(255,255,255,0.5)";
            descText.pos(12, 32);
            item.addChild(descText);

            // 进度条
            const progressBg = new Laya.Sprite();
            progressBg.size(200, 8);
            progressBg.pos(12, 52);
            progressBg.graphics.drawRoundRect(0, 0, 200, 8, 4, "rgba(255,255,255,0.1)");
            item.addChild(progressBg);

            const progressFill = new Laya.Sprite();
            const progressW = Math.min(200, (task.progress / task.target) * 200);
            progressFill.graphics.drawRoundRect(0, 0, progressW, 8, 4, task.completed ? "#4CAF50" : "#4FC3F7");
            progressFill.pos(12, 52);
            item.addChild(progressFill);

            // 进度文字
            const progressText = new Laya.Text();
            progressText.text = `${Math.min(task.progress, task.target)}/${task.target}`;
            progressText.font = "Microsoft YaHei";
            progressText.fontSize = 11;
            progressText.color = "rgba(255,255,255,0.7)";
            progressText.pos(220, 48);
            item.addChild(progressText);

            // 奖励/领取按钮
            if (task.completed && !task.claimed) {
                const claimBtn = new Laya.Sprite();
                claimBtn.size(60, 28);
                claimBtn.pos(itemW - 70, 26);
                claimBtn.mouseEnabled = true;
                claimBtn.graphics.drawRoundRect(0, 0, 60, 28, 8, "#4CAF50");
                claimBtn.on(Event.CLICK, this, () => this.claimTaskReward(task.id));
                item.addChild(claimBtn);

                const claimText = new Laya.Text();
                claimText.text = "领取";
                claimText.font = "Microsoft YaHei";
                claimText.fontSize = 12;
                claimText.bold = true;
                claimText.color = "#FFFFFF";
                claimText.width = 60;
                claimText.height = 28;
                claimText.align = "center";
                claimText.valign = "middle";
                claimBtn.addChild(claimText);
            } else if (task.claimed) {
                const claimedText = new Laya.Text();
                claimedText.text = "已领取";
                claimedText.font = "Microsoft YaHei";
                claimedText.fontSize = 12;
                claimedText.color = "#4CAF50";
                claimedText.pos(itemW - 70, 30);
                item.addChild(claimedText);
            } else {
                const rewardText = new Laya.Text();
                rewardText.text = `+${task.reward}`;
                rewardText.font = "Microsoft YaHei";
                rewardText.fontSize = 14;
                rewardText.bold = true;
                rewardText.color = "#FFD700";
                rewardText.pos(itemW - 55, 28);
                item.addChild(rewardText);
            }
        });
    }

    private getIconEmoji(icon: string): string {
        const iconMap: Record<string, string> = {
            trophy: "奖",
            lightning: "闪",
            star: "星",
            runner: "跑",
            brain: "脑",
            crown: "王",
            fire: "火",
            grid: "格"
        };
        return iconMap[icon] || "成";
    }

    private claimTaskReward(taskId: string): void {
        if (AchievementManager.claimDailyTaskReward(taskId)) {
            // 更新金币显示
            this.coinText.text = String(AchievementManager.getTotalCoins());
            // 重新渲染任务列表
            this.dailyTasks = AchievementManager.getDailyTasks();
            this.renderDailyTasks();
        }
    }

    private createBackButton(): void {
        const btn = new Laya.Sprite();
        btn.size(120, 40);
        btn.pos((340 - 120) * 0.5, 460);
        btn.mouseEnabled = true;
        btn.graphics.drawRoundRect(0, 0, 120, 40, 12, "rgba(255,255,255,0.1)", "rgba(255,255,255,0.3)", 1);

        const btnText = new Laya.Text();
        btnText.text = "返回";
        btnText.font = "Microsoft YaHei";
        btnText.fontSize = 14;
        btnText.bold = true;
        btnText.color = "#FFFFFF";
        btnText.width = 120;
        btnText.height = 40;
        btnText.align = "center";
        btnText.valign = "middle";
        btn.addChild(btnText);

        btn.on(Event.CLICK, this, this.goBack);
        this.contentLayer.addChild(btn);
    }

    private goBack(): void {
        import("../scenes/Main").then((module) => {
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