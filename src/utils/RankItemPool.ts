/**
 * 排行榜列表项对象池 - Focus Planet
 * 复用列表项组件，减少对象创建和 GC
 */

import { RankRecord } from "../panels/LeaderboardPanel";

export interface RankItemData {
    data: RankRecord;
    index: number;
    width: number;
    height: number;
}

export class RankItemPool {
    private pool: Laya.Sprite[] = [];
    private maxSize: number;

    constructor(initialSize: number = 10, maxSize: number = 50) {
        this.maxSize = maxSize;
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createItem());
        }
    }

    /**
     * 获取列表项
     */
    acquire(data: RankItemData): Laya.Sprite {
        const item = this.pool.length > 0 ? this.pool.pop()! : this.createItem();

        // 重置并设置新数据
        this.setupItem(item, data);

        return item;
    }

    /**
     * 归还列表项
     */
    release(item: Laya.Sprite): void {
        if (this.pool.length >= this.maxSize) {
            item.destroy();
            return;
        }

        // 清理项
        item.removeChildren();
        item.clearGraphics();
        item.size(0, 0);
        item.pos(0, 0);
        item.scale(1, 1);
        item.alpha = 1;

        this.pool.push(item);
    }

    /**
     * 批量归还
     */
    releaseAll(items: Laya.Sprite[]): void {
        items.forEach(item => this.release(item));
    }

    /**
     * 清空池
     */
    clear(): void {
        this.pool.forEach(item => item.destroy());
        this.pool = [];
    }

    /**
     * 获取池状态
     */
    getState(): { available: number; used: number; capacity: number } {
        return {
            available: this.pool.length,
            used: this.maxSize - this.pool.length,
            capacity: this.maxSize
        };
    }

    // ==================== 私有方法 ====================

    private createItem(): Laya.Sprite {
        return new Laya.Sprite();
    }

    private setupItem(item: Laya.Sprite, data: RankItemData): void {
        const { data: record, index, width, height } = data;
        item.size(width, height);

        const isTop3 = record.rank <= 3;
        const rankType = record.rank === 1 ? "gold" : record.rank === 2 ? "silver" : record.rank === 3 ? "bronze" : "normal";

        // 绘制背景
        const g = item.graphics;
        g.clear();

        if (isTop3) {
            // 前三名 - 渐变背景
            const bgColor = rankType === "gold"
                ? { r: 255, g: 215, b: 0 }
                : rankType === "silver"
                    ? { r: 192, g: 192, b: 192 }
                    : { r: 205, g: 127, b: 50 };

            const borderColor = rankType === "gold"
                ? "rgba(255,215,0,0.4)"
                : rankType === "silver"
                    ? "rgba(192,192,192,0.4)"
                    : "rgba(205,127,50,0.4)";

            // 绘制渐变背景
            const steps = 6;
            for (let i = 0; i < steps; i++) {
                const ratio = i / steps;
                const nextRatio = (i + 1) / steps;
                const x1 = width * ratio;
                const x2 = width * nextRatio;
                const stepW = x2 - x1;

                const alpha = 0.08 + ratio * 0.08;
                const color = `rgba(${bgColor.r},${bgColor.g},${bgColor.b},${alpha})`;
                g.drawRect(x1, 0, stepW + 1, height, color);
            }

            // 边框
            g.drawRoundRect(0, 0, width, height, 10, null, `rgba(${bgColor.r},${bgColor.g},${bgColor.b},0.15)`, 3);
            g.drawRoundRect(0, 0, width, height, 10, null, borderColor, 1);
        } else {
            // 普通项
            g.drawRoundRect(0, 0, width, height, 10, "rgba(255,255,255,0.02)", "rgba(255,255,255,0.04)", 1);
        }

        // 排名徽章
        const badgeSize = isTop3 ? 32 : 26;
        const badgeX = 12;
        const badgeY = (height - badgeSize) / 2;

        if (isTop3) {
            const badgeColor = rankType === "gold"
                ? "#FFD700"
                : rankType === "silver"
                    ? "#C0C0C0"
                    : "#CD7F32";

            const glowColor = rankType === "gold"
                ? "rgba(255,215,0,0.25)"
                : rankType === "silver"
                    ? "rgba(192,192,192,0.25)"
                    : "rgba(205,127,50,0.25)";
            g.drawCircle(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2 + 4, glowColor);

            const innerColor = rankType === "gold"
                ? "#FFE066"
                : rankType === "silver"
                    ? "#E0E0E0"
                    : "#E5A060";
            g.drawCircle(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, badgeColor);
            g.drawCircle(badgeX + badgeSize / 2 - 2, badgeY + badgeSize / 2 - 2, badgeSize / 4, innerColor);

            // 排名数字
            const rankNum = this.createText();
            rankNum.text = String(record.rank);
            rankNum.font = "Microsoft YaHei";
            rankNum.fontSize = 14;
            rankNum.bold = true;
            rankNum.color = "#FFFFFF";
            rankNum.width = badgeSize;
            rankNum.height = badgeSize;
            rankNum.align = "center";
            rankNum.valign = "middle";
            rankNum.pos(badgeX, badgeY);
            item.addChild(rankNum);
        } else {
            // 普通排名
            g.drawCircle(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, "rgba(255,255,255,0.08)");

            const rankNum = this.createText();
            rankNum.text = String(record.rank);
            rankNum.font = "Microsoft YaHei";
            rankNum.fontSize = 12;
            rankNum.color = "#8b9dc3";
            rankNum.width = badgeSize;
            rankNum.height = badgeSize;
            rankNum.align = "center";
            rankNum.valign = "middle";
            rankNum.pos(badgeX, badgeY);
            item.addChild(rankNum);
        }

        // 玩家名称
        const nameText = this.createText();
        nameText.text = record.name;
        nameText.font = "Microsoft YaHei";
        nameText.fontSize = isTop3 ? 14 : 13;
        nameText.bold = isTop3;
        nameText.color = isTop3 ? (rankType === "gold" ? "#FFD700" : rankType === "silver" ? "#C0C0C0" : "#CD7F32") : "#FFFFFF";
        nameText.pos(52, isTop3 ? 8 : 6);
        item.addChild(nameText);

        // 根据游戏类型显示不同的信息
        const statsY = isTop3 ? 24 : 22;

        if (true) { // 简化：假设总是显示时间格式
            const timeText = this.createText();
            timeText.text = record.time;
            timeText.font = "Microsoft YaHei";
            timeText.fontSize = 11;
            timeText.color = "#3498DB";
            timeText.pos(52, statsY);
            item.addChild(timeText);

            const scoreText = this.createText();
            scoreText.text = record.score + "分";
            scoreText.font = "Microsoft YaHei";
            scoreText.fontSize = 11;
            scoreText.color = "#8b9dc3";
            scoreText.pos(140, statsY);
            item.addChild(scoreText);
        }

        // 存储原始数据供后续使用
        (item as any).__rankData = record;
    }

    private createText(): Laya.Text {
        const t = new Laya.Text();
        t.align = "left";
        t.valign = "middle";
        t.font = "Microsoft YaHei";
        return t;
    }
}
