/**
 * 设置页面 - Focus Planet
 * 支持音效开关、震动反馈、玩家名称、清除数据
 */

const { Event } = Laya;

interface GameSettings {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    playerName: string;
}

export class SettingsManager {
    private static readonly SETTINGS_KEY = "focus_planet_settings";
    private static settings: GameSettings = {
        soundEnabled: true,
        vibrationEnabled: true,
        playerName: "匿名玩家"
    };

    public static load(): GameSettings {
        try {
            const data = Laya.LocalStorage.getItem(this.SETTINGS_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                this.settings = { ...this.settings, ...parsed };
            }
        } catch (e) {
            console.warn("读取设置失败", e);
        }
        return this.settings;
    }

    public static save(): void {
        try {
            Laya.LocalStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
        } catch (e) {
            console.warn("保存设置失败", e);
        }
    }

    public static getSoundEnabled(): boolean {
        return this.settings.soundEnabled;
    }

    public static setSoundEnabled(enabled: boolean): void {
        this.settings.soundEnabled = enabled;
        this.save();
    }

    public static getVibrationEnabled(): boolean {
        return this.settings.vibrationEnabled;
    }

    public static setVibrationEnabled(enabled: boolean): void {
        this.settings.vibrationEnabled = enabled;
        this.save();
    }

    public static getPlayerName(): string {
        return this.settings.playerName || "匿名玩家";
    }

    public static setPlayerName(name: string): void {
        this.settings.playerName = name || "匿名玩家";
        this.save();
    }

    public static clearAllData(): void {
        // 清除排行榜数据
        for (let i = 0; i < 3; i++) {
            Laya.LocalStorage.removeItem(`focus_planet_leaderboard_${i}`);
        }
        // 重置设置为默认值
        this.settings = {
            soundEnabled: true,
            vibrationEnabled: true,
            playerName: "匿名玩家"
        };
        this.save();
    }
}

export class SettingsPanel extends Laya.Scene {
    private readonly BASE_W: number = 375;
    private readonly BASE_H: number = 750;

    private root: Laya.Sprite = null;
    private stageBg: Laya.Sprite = null;
    private bgLayer: Laya.Sprite = null;
    private panelContainer: Laya.Sprite = null;
    private contentLayer: Laya.Sprite = null;

    private settings: GameSettings;

    constructor() {
        super();
    }

    onAwake(): void {
        Laya.stage.alignH = "center";
        Laya.stage.alignV = "middle";
        Laya.stage.scaleMode = "showall";
        Laya.stage.screenMode = "vertical";
        Laya.stage.bgColor = "#1A1A2E";

        // 加载设置
        this.settings = SettingsManager.load();

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
        const panelW = 340;
        const panelH = 420;
        const panelX = (this.BASE_W - panelW) * 0.5;
        const panelY = 120;

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
        this.createSettingsItems();
        this.createClearButton();
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

        const titleText = new Laya.Text();
        titleText.text = "设 置";
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
    }

    private createSettingsItems(): void {
        const startY = 80;
        const itemH = 60;
        const panelW = 340;

        // 音效开关
        this.createToggleItem("音效", this.settings.soundEnabled, startY, (enabled) => {
            this.settings.soundEnabled = enabled;
            SettingsManager.setSoundEnabled(enabled);
        });

        // 震动反馈
        this.createToggleItem("震动反馈", this.settings.vibrationEnabled, startY + itemH, (enabled) => {
            this.settings.vibrationEnabled = enabled;
            SettingsManager.setVibrationEnabled(enabled);
        });

        // 玩家名称
        this.createInputItem("玩家名称", this.settings.playerName, startY + itemH * 2, (name) => {
            this.settings.playerName = name;
            SettingsManager.setPlayerName(name);
        });
    }

    private createToggleItem(label: string, value: boolean, y: number, onChange: (enabled: boolean) => void): void {
        const panelW = 340;
        const itemW = 300;
        const startX = (panelW - itemW) * 0.5;

        // 标签文字
        const labelText = new Laya.Text();
        labelText.text = label;
        labelText.font = "Microsoft YaHei";
        labelText.fontSize = 16;
        labelText.color = "#FFFFFF";
        labelText.pos(startX, y + 18);
        this.contentLayer.addChild(labelText);

        // 开关按钮
        const toggleW = 50;
        const toggleH = 28;
        const toggleX = startX + itemW - toggleW;

        const toggle = new Laya.Sprite();
        toggle.size(toggleW, toggleH);
        toggle.pos(toggleX, y + 16);
        toggle.mouseEnabled = true;
        this.contentLayer.addChild(toggle);

        let isOn = value;

        const updateToggle = (on: boolean) => {
            const g = toggle.graphics;
            g.clear();

            // 背景
            const bgColor = on ? "#4CAF50" : "rgba(255,255,255,0.2)";
            g.drawRoundRect(0, 0, toggleW, toggleH, 14, bgColor);

            // 滑块
            const knobX = on ? toggleW - 24 : 4;
            g.drawCircle(knobX + 10, toggleH / 2, 10, "#FFFFFF");
        };

        updateToggle(isOn);

        toggle.on(Event.CLICK, this, () => {
            isOn = !isOn;
            updateToggle(isOn);
            onChange(isOn);
        });
    }

    private createInputItem(label: string, value: string, y: number, onChange: (name: string) => void): void {
        const panelW = 340;
        const itemW = 300;
        const startX = (panelW - itemW) * 0.5;

        // 标签文字
        const labelText = new Laya.Text();
        labelText.text = label;
        labelText.font = "Microsoft YaHei";
        labelText.fontSize = 16;
        labelText.color = "#FFFFFF";
        labelText.pos(startX, y + 18);
        this.contentLayer.addChild(labelText);

        // 名称显示框（点击可编辑）
        const inputW = 140;
        const inputH = 36;
        const inputX = startX + itemW - inputW;

        const inputBg = new Laya.Sprite();
        inputBg.size(inputW, inputH);
        inputBg.pos(inputX, y + 12);
        inputBg.mouseEnabled = true;
        inputBg.graphics.drawRoundRect(0, 0, inputW, inputH, 8, "rgba(255,255,255,0.1)", "rgba(255,255,255,0.2)", 1);
        this.contentLayer.addChild(inputBg);

        const nameText = new Laya.Text();
        nameText.text = value;
        nameText.font = "Microsoft YaHei";
        nameText.fontSize = 14;
        nameText.color = "#FFFFFF";
        nameText.width = inputW - 16;
        nameText.height = inputH;
        nameText.align = "center";
        nameText.valign = "middle";
        nameText.pos(8, 0);
        inputBg.addChild(nameText);

        // 点击编辑 - 使用浏览器原生 prompt
        inputBg.on(Event.CLICK, this, () => {
            const newName = Laya.Browser.window.prompt("请输入玩家名称", nameText.text);
            if (newName !== null && newName.trim() !== "") {
                const finalName = newName.trim().substring(0, 8) || "匿名玩家";
                nameText.text = finalName;
                onChange(finalName);
            }
        });
    }

    private createClearButton(): void {
        const panelW = 340;
        const btnW = 200;
        const btnH = 44;
        const btnX = (panelW - btnW) * 0.5;
        const btnY = 280;

        const btn = new Laya.Sprite();
        btn.size(btnW, btnH);
        btn.pos(btnX, btnY);
        btn.mouseEnabled = true;

        const g = btn.graphics;
        g.drawRoundRect(0, 0, btnW, btnH, 12, "rgba(255,107,107,0.2)", "rgba(255,107,107,0.5)", 1.5);

        const btnText = new Laya.Text();
        btnText.text = "清除排行榜数据";
        btnText.font = "Microsoft YaHei";
        btnText.fontSize = 14;
        btnText.bold = true;
        btnText.color = "#FF6B6B";
        btnText.width = btnW;
        btnText.height = btnH;
        btnText.align = "center";
        btnText.valign = "middle";
        btn.addChild(btnText);

        btn.on(Event.CLICK, this, this.showClearConfirm);

        this.contentLayer.addChild(btn);
    }

    private showClearConfirm(): void {
        // 创建确认弹窗
        const overlay = new Laya.Sprite();
        overlay.size(this.BASE_W, this.BASE_H);
        overlay.graphics.drawRect(0, 0, this.BASE_W, this.BASE_H, "rgba(0,0,0,0.7)");
        overlay.alpha = 0;
        this.root.addChild(overlay);

        const popupW = 280;
        const popupH = 160;
        const popup = new Laya.Sprite();
        popup.size(popupW, popupH);
        popup.pos((this.BASE_W - popupW) * 0.5, (this.BASE_H - popupH) * 0.5);
        popup.graphics.drawRoundRect(0, 0, popupW, popupH, 16, "rgba(40,40,60,0.95)", "rgba(255,255,255,0.2)", 1);
        overlay.addChild(popup);

        const title = new Laya.Text();
        title.text = "确认清除";
        title.font = "Microsoft YaHei";
        title.fontSize = 20;
        title.bold = true;
        title.color = "#FFD700";
        title.width = popupW;
        title.align = "center";
        title.pos(0, 20);
        popup.addChild(title);

        const msg = new Laya.Text();
        msg.text = "确定要清除所有排行榜数据吗？\n此操作不可恢复。";
        msg.font = "Microsoft YaHei";
        msg.fontSize = 14;
        msg.color = "#FFFFFF";
        msg.width = popupW;
        msg.align = "center";
        msg.leading = 6;
        msg.pos(0, 55);
        popup.addChild(msg);

        // 取消按钮
        const cancelBtn = new Laya.Sprite();
        cancelBtn.size(100, 36);
        cancelBtn.pos(20, 110);
        cancelBtn.mouseEnabled = true;
        cancelBtn.graphics.drawRoundRect(0, 0, 100, 36, 10, "rgba(255,255,255,0.1)");
        const cancelText = new Laya.Text();
        cancelText.text = "取消";
        cancelText.font = "Microsoft YaHei";
        cancelText.fontSize = 14;
        cancelText.color = "#FFFFFF";
        cancelText.width = 100;
        cancelText.height = 36;
        cancelText.align = "center";
        cancelText.valign = "middle";
        cancelBtn.addChild(cancelText);
        cancelBtn.on(Event.CLICK, this, () => {
            overlay.removeSelf();
            overlay.destroy();
        });
        popup.addChild(cancelBtn);

        // 确认按钮
        const confirmBtn = new Laya.Sprite();
        confirmBtn.size(100, 36);
        confirmBtn.pos(160, 110);
        confirmBtn.mouseEnabled = true;
        confirmBtn.graphics.drawRoundRect(0, 0, 100, 36, 10, "rgba(255,107,107,0.8)");
        const confirmText = new Laya.Text();
        confirmText.text = "确认清除";
        confirmText.font = "Microsoft YaHei";
        confirmText.fontSize = 14;
        confirmText.color = "#FFFFFF";
        confirmText.width = 100;
        confirmText.height = 36;
        confirmText.align = "center";
        confirmText.valign = "middle";
        confirmBtn.addChild(confirmText);
        confirmBtn.on(Event.CLICK, this, () => {
            SettingsManager.clearAllData();
            overlay.removeSelf();
            overlay.destroy();

            // 显示成功提示
            this.showToast("数据已清除");
        });
        popup.addChild(confirmBtn);

        // 显示动画
        Laya.Tween.to(overlay, { alpha: 1 }, 200);
    }

    private showToast(msg: string): void {
        const toast = new Laya.Sprite();
        toast.size(200, 44);
        toast.pos((this.BASE_W - 200) * 0.5, this.BASE_H - 100);
        toast.graphics.drawRoundRect(0, 0, 200, 44, 12, "rgba(0,0,0,0.8)");
        this.root.addChild(toast);

        const text = new Laya.Text();
        text.text = msg;
        text.font = "Microsoft YaHei";
        text.fontSize = 14;
        text.color = "#FFFFFF";
        text.width = 200;
        text.height = 44;
        text.align = "center";
        text.valign = "middle";
        toast.addChild(text);

        toast.alpha = 0;
        Laya.Tween.to(toast, { alpha: 1 }, 200, null, Laya.Handler.create(this, () => {
            Laya.timer.once(1500, this, () => {
                Laya.Tween.to(toast, { alpha: 0 }, 200, null, Laya.Handler.create(this, () => {
                    toast.removeSelf();
                    toast.destroy();
                }));
            });
        }));
    }

    private createBackButton(): void {
        const panelW = 340;
        const btnW = 120;
        const btnH = 40;
        const btnX = (panelW - btnW) * 0.5;
        const btnY = 350;

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

    private goBack(): void {
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