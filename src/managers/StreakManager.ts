/**
 * 连续打卡管理器 - Focus Planet
 * 统一管理玩家连续打卡逻辑，避免在多个文件中重复实现
 */

import { StorageKey, StorageUtils } from "../constants/StorageKeys";

export class StreakManager {
    private static readonly STORAGE_KEYS = {
        count: StorageKey.StreakCount,
        lastPlayDate: StorageKey.LastPlayDate
    };

    /**
     * 获取连续打卡天数
     */
    public static getDays(): number {
        try {
            const streak = StorageUtils.get<number>(this.STORAGE_KEYS.count, 0) ?? 0;
            const lastPlayDate = StorageUtils.get<string>(this.STORAGE_KEYS.lastPlayDate, "");

            const today = this.getTodayDateString();
            const yesterday = this.getYesterdayDateString();

            if (lastPlayDate === today) {
                // 今天已打过卡
                return streak;
            } else if (lastPlayDate === yesterday) {
                // 昨天打过卡，今天尚未打卡
                return streak;
            } else if (lastPlayDate === "") {
                // 从未打过卡
                return 0;
            } else {
                // 连续中断
                return 0;
            }
        } catch (e) {
            console.warn("[Streak] 获取连续天数失败", e);
            return 0;
        }
    }

    /**
     * 记录一次打卡/游戏
     */
    public static recordPlay(): void {
        try {
            const today = this.getTodayDateString();
            const yesterday = this.getYesterdayDateString();
            const lastPlayDate = StorageUtils.get<string>(this.STORAGE_KEYS.lastPlayDate, "");
            let streak = StorageUtils.get<number>(this.STORAGE_KEYS.count, 0) ?? 0;

            if (lastPlayDate === today) {
                // 今天已打过卡，不重复增加
                return;
            } else if (lastPlayDate === yesterday) {
                // 昨天打过卡，连续+1
                streak++;
            } else {
                // 连续中断，重新开始
                streak = 1;
            }

            StorageUtils.set(this.STORAGE_KEYS.count, streak);
            StorageUtils.set(this.STORAGE_KEYS.lastPlayDate, today);
        } catch (e) {
            console.warn("[Streak] 记录打卡失败", e);
        }
    }

    /**
     * 检查今天是否已打卡
     */
    public static isTodayPlayed(): boolean {
        try {
            const lastPlayDate = StorageUtils.get<string>(this.STORAGE_KEYS.lastPlayDate, "");
            const today = this.getTodayDateString();
            return lastPlayDate === today;
        } catch (e) {
            return false;
        }
    }

    /**
     * 重置连续打卡（用于测试或特殊场景）
     */
    public static reset(): void {
        try {
            StorageUtils.remove(this.STORAGE_KEYS.count);
            StorageUtils.remove(this.STORAGE_KEYS.lastPlayDate);
        } catch (e) {
            console.warn("[Streak] 重置打卡失败", e);
        }
    }

    // ==================== 私有工具方法 ====================

    /**
     * 获取今天的日期字符串 (YYYY-MM-DD)
     */
    private static getTodayDateString(): string {
        return this.formatDate(new Date());
    }

    /**
     * 获取昨天的日期字符串 (YYYY-MM-DD)
     */
    private static getYesterdayDateString(): string {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return this.formatDate(yesterday);
    }

    /**
     * 格式化日期为 YYYY-MM-DD
     */
    private static formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
}
