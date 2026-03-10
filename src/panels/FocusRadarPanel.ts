/**
 * 专注力雷达图面板 - Focus Planet
 * 展示玩家专注力分析雷达图和训练推荐
 */

const { regClass, Event } = Laya;

import { FocusRadarManager } from "../managers/FocusRadarManager";
import { DIMENSION_CONFIG, TrainingRecommendation } from "../data/focusRadar";

@regClass()
export class FocusRadarPanel extends Laya.Scene {
    private readonly BASE_W: number = 375;
    private readonly BASE_H: number = 750;

    private root: Laya.Sprite = null;
    private bgLayer: Laya.Sprite = null;
    private uiLayer: Laya.Sprite = null;

    // 雷达图配置
    private readonly RADAR_CENTER_X: number = 187;
    private readonly RADAR_CENTER_Y: number = 200;
    private readonly RADAR_RADIUS: number = 120;

    // 当前数据
    private currentData: { speed: number; accuracy: number; memory: number; stability: number; endurance: number } = {
        speed: 0, accuracy: 0, memory: 0, stability: 0, endurance: 0
    };
    private bestData: { speed: number; accuracy: number; memory: number; stability: number; endurance: number } = {
        speed: 0, accuracy: 0, memory: 0, stability: 0, endurance: 0
    };
    private recommendations: TrainingRecommendation[] = [];

    onAwake(): void {
        Laya.stage.alignH = "center";
        Laya.stage.alignV = "middle";
        Laya.stage.scaleMode = "showall";
        Laya.stage.screenMode = "vertical";
        Laya.stage.bgColor = "#0D0B1E";

        this.initData();
        this.initRoot();
        this.createLayers();
        this.createBackground();
        this.createHeader();
        this.createRadarChart();
        this.createScoreSummary();
        this.createRecommendations();
        this.createBottomButtons();

        Laya.stage.on(Event.RESIZE, this, this.onResize);
    }

    private initData(): void {
        this.currentData = FocusRadarManager.getRadarData();
        this.bestData = FocusRadarManager.getBestScores();
        this.recommendations = FocusRadarManager.getRecommendations();
    }

    private initRoot(): void {
        this.size(Math.max(320, Laya.stage.width), Math.max(568, Laya.stage.height));

        this.root = new Laya.Sprite();
        this.addChild(this.root);

        const sw = Math.max(320, Laya.stage.width);
        const sh = Math.max(568, Laya.stage.height);
        const scale = Math.min(sw / this.BASE_W, sh / this.BASE_H);

        this.root.scale(scale, scale);
        this.root.pos((sw - this.BASE_W * scale) * 0.5, (sh - this.BASE_H * scale) * 0.5);
        this.root.size(this.BASE_W, this.BASE_H);
    }

    private createLayers(): void {
        this.bgLayer = new Laya.Sprite();
        this.uiLayer = new Laya.Sprite();

        this.root.addChild(this.bgLayer);
        this.root.addChild(this.uiLayer);
    }

    private createBackground(): void {
        // 深色背景
        this.bgLayer.graphics.drawRect(0, 0, this.BASE_W, this.BASE_H, "#0D0B1E");

        // 顶部装饰渐变
        const gradientBg = new Laya.Sprite();
        gradientBg.graphics.drawPath(0, 0, [
            ["moveTo", 0, 0],
            ["lineTo", this.BASE_W, 0],
            ["lineTo", this.BASE_W, 100],
            ["lineTo", 0, 150],
            ["closePath"]
        ], { fillStyle: "rgba(99, 102, 241, 0.15)" });
        this.bgLayer.addChild(gradientBg);
    }

    private createHeader(): void {
        // 标题
        const title = new Laya.Text();
        title.text = "专注力分析";
        title.font = "Microsoft YaHei";
        title.fontSize = 26;
        title.bold = true;
        title.color = "#F8F3CF";
        title.stroke = 2;
        title.strokeColor = "rgba(0,0,0,0.5)";
        title.width = this.BASE_W;
        title.align = "center";
        title.pos(0, 20);
        this.uiLayer.addChild(title);

        // 返回按钮
        const backBtn = new Laya.Sprite();
        backBtn.size(60, 32);
        backBtn.pos(16, 18);
        backBtn.mouseEnabled = true;
        backBtn.graphics.drawRoundRect(0, 0, 60, 32, 8, "rgba(255,255,255,0.1)", "rgba(255,255,255,0.2)", 1);

        const backText = new Laya.Text();
        backText.text = "← 返回";
        backText.font = "Microsoft YaHei";
        backText.fontSize = 14;
        backText.color = "#FFFFFF";
        backText.width = 60;
        backText.height = 32;
        backText.align = "center";
        backText.valign = "middle";
        backBtn.addChild(backText);

        backBtn.on(Event.CLICK, this, this.goBack);
        this.uiLayer.addChild(backBtn);

        // 综合评分区域
        this.createOverallScore();
    }

    private createOverallScore(): void {
        const score = FocusRadarManager.getOverallScore();
        const levelInfo = FocusRadarManager.getFocusLevelInfo();
        const summary = FocusRadarManager.getSummary();

        // 评分容器
        const container = new Laya.Sprite();
        container.pos(this.BASE_W - 100, 55);
        this.uiLayer.addChild(container);

        // 等级徽章
        const badge = new Laya.Sprite();
        badge.size(80, 36);
        badge.graphics.drawRoundRect(0, 0, 80, 36, 18, levelInfo.color, "rgba(255,255,255,0.3)", 2);
        container.addChild(badge);

        const levelText = new Laya.Text();
        levelText.text = levelInfo.level;
        levelText.font = "Microsoft YaHei";
        levelText.fontSize = 20;
        levelText.bold = true;
        levelText.color = "#FFFFFF";
        levelText.width = 80;
        levelText.height = 36;
        levelText.align = "center";
        levelText.valign = "middle";
        badge.addChild(levelText);

        // 称号
        const titleText = new Laya.Text();
        titleText.text = levelInfo.title;
        titleText.font = "Microsoft YaHei";
        titleText.fontSize = 12;
        titleText.color = levelInfo.color;
        titleText.width = 80;
        titleText.align = "center";
        titleText.pos(0, 40);
        container.addChild(titleText);
    }

    private createRadarChart(): void {
        const centerX = this.RADAR_CENTER_X;
        const centerY = this.RADAR_CENTER_Y;
        const radius = this.RADAR_RADIUS;

        // 雷达图容器
        const radarContainer = new Laya.Sprite();
        radarContainer.pos(0, 70);
        this.uiLayer.addChild(radarContainer);

        // 绘制背景网格
        this.drawRadarGrid(radarContainer, centerX, centerY, radius);

        // 绘制数据区域
        this.drawRadarData(radarContainer, centerX, centerY, radius);

        // 绘制维度标签
        this.drawDimensionLabels(radarContainer, centerX, centerY, radius);

        // 绘制得分标签
        this.drawScoreLabels(radarContainer, centerX, centerY, radius);
    }

    private drawRadarGrid(container: Laya.Sprite, cx: number, cy: number, radius: number): void {
        const dimensions = ["speed", "accuracy", "memory", "stability", "endurance"] as const;
        const angleStep = (Math.PI * 2) / 5;
        const startAngle = -Math.PI / 2; // 从顶部开始

        // 绘制同心圆网格
        const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
        levels.forEach(level => {
            const r = radius * level;
            const points: number[] = [];

            for (let i = 0; i < 5; i++) {
                const angle = startAngle + i * angleStep;
                points.push(cx + Math.cos(angle) * r);
                points.push(cy + Math.sin(angle) * r);
            }

            // 闭合路径
            points.push(points[0], points[1]);

            const alpha = level === 1.0 ? 0.3 : 0.15;
            container.graphics.drawPath(0, 0, this.createPolygonPath(points), {
                fillStyle: "transparent",
                strokeStyle: `rgba(99, 102, 241, ${alpha})`,
                lineWidth: 1
            });
        });

        // 绘制轴线
        for (let i = 0; i < 5; i++) {
            const angle = startAngle + i * angleStep;
            const endX = cx + Math.cos(angle) * radius;
            const endY = cy + Math.sin(angle) * radius;

            container.graphics.drawLine(cx, cy, endX, endY, "rgba(99, 102, 241, 0.3)", 1);
        }
    }

    private drawRadarData(container: Laya.Sprite, cx: number, cy: number, radius: number): void {
        const data = this.currentData;
        const values = [data.speed, data.accuracy, data.memory, data.stability, data.endurance];
        const angleStep = (Math.PI * 2) / 5;
        const startAngle = -Math.PI / 2;

        // 计算数据点
        const points: number[] = [];
        for (let i = 0; i < 5; i++) {
            const angle = startAngle + i * angleStep;
            const value = values[i] / 100; // 转换为0-1范围
            const r = radius * value;
            points.push(cx + Math.cos(angle) * r);
            points.push(cy + Math.sin(angle) * r);
        }

        // 绘制填充区域
        const fillPath = this.createPolygonPath([...points, points[0], points[1]]);
        container.graphics.drawPath(0, 0, fillPath, {
            fillStyle: "rgba(99, 102, 241, 0.4)",
            strokeStyle: "#6366F1",
            lineWidth: 2
        });

        // 绘制数据点
        for (let i = 0; i < 5; i++) {
            const x = points[i * 2];
            const y = points[i * 2 + 1];

            container.graphics.drawCircle(x, y, 4, "#FFFFFF", "#6366F1", 2);
        }
    }

    private drawDimensionLabels(container: Laya.Sprite, cx: number, cy: number, radius: number): void {
        const dimensions: (keyof typeof DIMENSION_CONFIG)[] = ["speed", "accuracy", "memory", "stability", "endurance"];
        const angleStep = (Math.PI * 2) / 5;
        const startAngle = -Math.PI / 2;

        dimensions.forEach((dim, i) => {
            const config = DIMENSION_CONFIG[dim];
            const angle = startAngle + i * angleStep;

            // 标签位置在雷达图外围
            const labelRadius = radius + 35;
            const x = cx + Math.cos(angle) * labelRadius;
            const y = cy + Math.sin(angle) * labelRadius;

            const label = new Laya.Text();
            label.text = `${config.icon} ${config.name}`;
            label.font = "Microsoft YaHei";
            label.fontSize = 14;
            label.bold = true;
            label.color = config.color;
            label.width = 70;
            label.height = 20;
            label.align = "center";
            label.pos(x - 35, y - 10);
            container.addChild(label);
        });
    }

    private drawScoreLabels(container: Laya.Sprite, cx: number, cy: number, radius: number): void {
        const dimensions: (keyof typeof DIMENSION_CONFIG)[] = ["speed", "accuracy", "memory", "stability", "endurance"];
        const values = [this.currentData.speed, this.currentData.accuracy, this.currentData.memory, this.currentData.stability, this.currentData.endurance];
        const angleStep = (Math.PI * 2) / 5;
        const startAngle = -Math.PI / 2;

        dimensions.forEach((dim, i) => {
            const angle = startAngle + i * angleStep;

            // 分数标签在雷达图边缘内侧
            const scoreRadius = radius + 18;
            const x = cx + Math.cos(angle) * scoreRadius;
            const y = cy + Math.sin(angle) * scoreRadius;

            const scoreLabel = new Laya.Text();
            scoreLabel.text = String(values[i]);
            scoreLabel.font = "Microsoft YaHei";
            scoreLabel.fontSize = 12;
            scoreLabel.bold = true;
            scoreLabel.color = "#FFFFFF";
            scoreLabel.width = 30;
            scoreLabel.height = 16;
            scoreLabel.align = "center";
            scoreLabel.pos(x - 15, y - 8);
            container.addChild(scoreLabel);
        });
    }

    private createPolygonPath(points: number[]): any[] {
        const path: any[] = [["moveTo", points[0], points[1]]];
        for (let i = 2; i < points.length; i += 2) {
            path.push(["lineTo", points[i], points[i + 1]]);
        }
        path.push(["closePath"]);
        return path;
    }

    private createScoreSummary(): void {
        // 分隔线
        const divider = new Laya.Sprite();
        divider.graphics.drawLine(20, 360, this.BASE_W - 20, 360, "rgba(255,255,255,0.2)", 1);
        this.uiLayer.addChild(divider);

        // 统计摘要
        const summary = FocusRadarManager.getSummary();

        const summaryContainer = new Laya.Sprite();
        summaryContainer.pos(20, 375);
        this.uiLayer.addChild(summaryContainer);

        // 标题
        const title = new Laya.Text();
        title.text = "训练统计";
        title.font = "Microsoft YaHei";
        title.fontSize = 18;
        title.bold = true;
        title.color = "#F8F3CF";
        title.width = this.BASE_W - 40;
        summaryContainer.addChild(title);

        // 统计项
        const stats = [
            { label: "累计训练", value: `${summary.totalGames} 局` },
            { label: "本周训练", value: `${summary.weeklyGames} 局` },
            { label: "上次训练", value: summary.lastPlayed }
        ];

        stats.forEach((stat, i) => {
            const y = 30 + i * 28;

            const label = new Laya.Text();
            label.text = stat.label;
            label.font = "Microsoft YaHei";
            label.fontSize = 14;
            label.color = "rgba(255,255,255,0.6)";
            label.width = 80;
            label.pos(0, y);
            summaryContainer.addChild(label);

            const value = new Laya.Text();
            value.text = stat.value;
            value.font = "Microsoft YaHei";
            value.fontSize = 14;
            value.bold = true;
            value.color = "#FFFFFF";
            value.width = 100;
            value.pos(90, y);
            summaryContainer.addChild(value);
        });
    }

    private createRecommendations(): void {
        // 分隔线
        const divider = new Laya.Sprite();
        divider.graphics.drawLine(20, 485, this.BASE_W - 20, 485, "rgba(255,255,255,0.2)", 1);
        this.uiLayer.addChild(divider);

        // 推荐容器
        const container = new Laya.Sprite();
        container.pos(20, 500);
        this.uiLayer.addChild(container);

        // 标题
        const title = new Laya.Text();
        title.text = "训练建议";
        title.font = "Microsoft YaHei";
        title.fontSize = 18;
        title.bold = true;
        title.color = "#F8F3CF";
        title.width = this.BASE_W - 40;
        container.addChild(title);

        // 获取前3个推荐（弱项优先）
        const topRecommendations = this.recommendations.slice(0, 3);

        topRecommendations.forEach((rec, i) => {
            const y = 30 + i * 50;
            const config = DIMENSION_CONFIG[rec.dimension];

            // 背景条
            const bg = new Laya.Sprite();
            bg.graphics.drawRoundRect(0, y, this.BASE_W - 40, 45, 8, rec.isWeak ? "rgba(255,107,107,0.15)" : "rgba(255,255,255,0.05)");
            container.addChild(bg);

            // 维度名称和分数
            const dimLabel = new Laya.Text();
            dimLabel.text = `${config.icon} ${rec.dimensionName}`;
            dimLabel.font = "Microsoft YaHei";
            dimLabel.fontSize = 14;
            dimLabel.bold = true;
            dimLabel.color = rec.isWeak ? "#FF6B6B" : config.color;
            dimLabel.pos(12, y + 5);
            container.addChild(dimLabel);

            // 分数
            const scoreLabel = new Laya.Text();
            scoreLabel.text = `${rec.score}分`;
            scoreLabel.font = "Microsoft YaHei";
            scoreLabel.fontSize = 12;
            scoreLabel.color = rec.isWeak ? "#FF6B6B" : "rgba(255,255,255,0.7)";
            scoreLabel.pos(this.BASE_W - 90, y + 5);
            container.addChild(scoreLabel);

            // 建议文字
            const tipLabel = new Laya.Text();
            tipLabel.text = rec.recommendations[0]; // 显示第一条建议
            tipLabel.font = "Microsoft YaHei";
            tipLabel.fontSize = 12;
            tipLabel.color = "rgba(255,255,255,0.6)";
            tipLabel.width = this.BASE_W - 70;
            tipLabel.pos(12, y + 25);
            container.addChild(tipLabel);

            // 弱项标记
            if (rec.isWeak) {
                const weakTag = new Laya.Sprite();
                weakTag.graphics.drawRoundRect(this.BASE_W - 55, y + 25, 40, 16, 4, "rgba(255,107,107,0.3)");
                container.addChild(weakTag);

                const weakText = new Laya.Text();
                weakText.text = "待提升";
                weakText.font = "Microsoft YaHei";
                weakText.fontSize = 10;
                weakText.color = "#FF6B6B";
                weakText.width = 40;
                weakText.height = 16;
                weakText.align = "center";
                weakText.valign = "middle";
                weakText.pos(this.BASE_W - 55, y + 25);
                container.addChild(weakText);
            }
        });
    }

    private createBottomButtons(): void {
        // 查看详细统计按钮
        const detailBtn = new Laya.Sprite();
        detailBtn.size(160, 44);
        detailBtn.pos((this.BASE_W - 160) * 0.5, this.BASE_H - 70);
        detailBtn.mouseEnabled = true;
        detailBtn.graphics.drawRoundRect(0, 0, 160, 44, 22, "#6366F1");
        this.uiLayer.addChild(detailBtn);

        const detailText = new Laya.Text();
        detailText.text = "查看详细数据";
        detailText.font = "Microsoft YaHei";
        detailText.fontSize = 16;
        detailText.bold = true;
        detailText.color = "#FFFFFF";
        detailText.width = 160;
        detailText.height = 44;
        detailText.align = "center";
        detailText.valign = "middle";
        detailBtn.addChild(detailText);

        detailBtn.on(Event.CLICK, this, this.showDetailedStats);
    }

    private showDetailedStats(): void {
        // 显示详细统计弹窗
        const popup = new Laya.Sprite();
        popup.name = "detailPopup";
        popup.size(this.BASE_W, this.BASE_H);
        popup.graphics.drawRect(0, 0, this.BASE_W, this.BASE_H, "rgba(0,0,0,0.7)");
        popup.mouseEnabled = true;
        popup.on(Event.CLICK, this, () => {
            const child = this.uiLayer.getChildByName("detailPopup");
            if (child) {
                child.removeSelf();
                child.destroy();
            }
        });
        this.uiLayer.addChild(popup);

        // 弹窗面板
        const panel = new Laya.Sprite();
        panel.size(320, 400);
        panel.pos((this.BASE_W - 320) * 0.5, (this.BASE_H - 400) * 0.5);
        panel.graphics.drawRoundRect(0, 0, 320, 400, 16, "rgba(30,30,50,0.95)", "rgba(255,255,255,0.2)", 1);
        popup.addChild(panel);

        // 标题
        const title = new Laya.Text();
        title.text = "详细数据";
        title.font = "Microsoft YaHei";
        title.fontSize = 22;
        title.bold = true;
        title.color = "#FFD700";
        title.width = 320;
        title.align = "center";
        title.pos(0, 20);
        panel.addChild(title);

        // 各维度详细数据
        const dimensions: (keyof typeof DIMENSION_CONFIG)[] = ["speed", "accuracy", "memory", "stability", "endurance"];
        const currentData = this.currentData;
        const bestData = this.bestData;

        dimensions.forEach((dim, i) => {
            const config = DIMENSION_CONFIG[dim];
            const current = currentData[dim];
            const best = bestData[dim];
            const y = 70 + i * 60;

            // 维度名称
            const nameLabel = new Laya.Text();
            nameLabel.text = `${config.icon} ${config.name}`;
            nameLabel.font = "Microsoft YaHei";
            nameLabel.fontSize = 16;
            nameLabel.bold = true;
            nameLabel.color = config.color;
            nameLabel.width = 100;
            nameLabel.pos(20, y);
            panel.addChild(nameLabel);

            // 当前得分
            const currentLabel = new Laya.Text();
            currentLabel.text = `当前: ${current}分`;
            currentLabel.font = "Microsoft YaHei";
            currentLabel.fontSize = 14;
            currentLabel.color = "#FFFFFF";
            currentLabel.pos(20, y + 25);
            panel.addChild(currentLabel);

            // 最佳得分
            const bestLabel = new Laya.Text();
            bestLabel.text = `最佳: ${best}分`;
            bestLabel.font = "Microsoft YaHei";
            bestLabel.fontSize = 14;
            bestLabel.color = "rgba(255,255,255,0.6)";
            bestLabel.pos(120, y + 25);
            panel.addChild(bestLabel);

            // 进度条
            const barBg = new Laya.Sprite();
            barBg.graphics.drawRoundRect(0, 0, 120, 8, 4, "rgba(255,255,255,0.1)");
            barBg.pos(180, y + 28);
            panel.addChild(barBg);

            const barFill = new Laya.Sprite();
            const fillWidth = Math.max(0, Math.min(120, current * 1.2));
            barFill.graphics.drawRoundRect(0, 0, fillWidth, 8, 4, config.color);
            barFill.pos(180, y + 28);
            panel.addChild(barFill);
        });

        // 关闭提示
        const closeTip = new Laya.Text();
        closeTip.text = "点击任意处关闭";
        closeTip.font = "Microsoft YaHei";
        closeTip.fontSize = 12;
        closeTip.color = "rgba(255,255,255,0.4)";
        closeTip.width = 320;
        closeTip.align = "center";
        closeTip.pos(0, 365);
        panel.addChild(closeTip);
    }

    private goBack(): void {
        import("../scenes/Main").then((module) => {
            const mainScene = new module.Main();
            mainScene.name = "Main";
            Laya.stage.addChild(mainScene);
            this.destroy();
        });
    }

    private onResize(): void {
        const sw = Math.max(320, Laya.stage.width);
        const sh = Math.max(568, Laya.stage.height);
        const scale = Math.min(sw / this.BASE_W, sh / this.BASE_H);

        if (this.root) {
            this.root.scale(scale, scale);
            this.root.pos((sw - this.BASE_W * scale) * 0.5, (sh - this.BASE_H * scale) * 0.5);
        }
    }

    onDestroy(): void {
        Laya.stage.off(Event.RESIZE, this, this.onResize);
    }
}