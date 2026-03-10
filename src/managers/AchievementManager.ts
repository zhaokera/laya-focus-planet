/**
 * 成就管理器 - Focus Planet
 * 管理玩家成就解锁和统计数据
 */

import { ACHIEVEMENTS, Achievement, PlayerStats } from "../data/achievements";
import { DailyTask, DAILY_TASK_TEMPLATES, getTodayStart, shouldResetTask, createDailyTask } from "../data/dailyTasks";

export class AchievementManager {
    private static readonly STATS_KEY = "focus_planet_player_stats";
    private static readonly ACHIEVEMENTS_KEY = "focus_planet_achievements";
    private static readonly DAILY_TASKS_KEY = "focus_planet_daily_tasks";

    private static stats: PlayerStats = {
        totalGames: 0,
        bestTime3x3: 0,
        bestTime4x4: 0,
        bestTime5x5: 0,
        totalErrors: 0,
        zeroErrorGames: 0,
        maxCombo: 0,
        memoryBestLevel: 0,
        challengeCompleted: 0,
        totalCoins: 0
    };

    private static achievements: Achievement[] = [];
    private static dailyTasks: DailyTask[] = [];
    private static initialized: boolean = false;

    /**
     * 初始化管理器
     */
    public static init(): void {
        if (this.initialized) return;

        this.loadStats();
        this.loadAchievements();
        this.loadDailyTasks();
        this.initialized = true;
    }

    // ==================== 统计数据 ====================

    public static loadStats(): PlayerStats {
        try {
            const data = Laya.LocalStorage.getItem(this.STATS_KEY);
            if (data) {
                this.stats = { ...this.stats, ...JSON.parse(data) };
            }
        } catch (e) {
            console.warn("加载玩家统计失败", e);
        }
        return this.stats;
    }

    public static saveStats(): void {
        try {
            Laya.LocalStorage.setItem(this.STATS_KEY, JSON.stringify(this.stats));
        } catch (e) {
            console.warn("保存玩家统计失败", e);
        }
    }

    public static getStats(): PlayerStats {
        return { ...this.stats };
    }

    // ==================== 游戏结果更新 ====================

    /**
     * 记录舒尔特方格游戏结果
     */
    public static recordSchulteGame(gridSize: number, time: number, errors: number, maxCombo: number): string[] {
        this.init();

        // 更新统计数据
        this.stats.totalGames++;

        // 更新最佳时间
        if (gridSize === 3 && (this.stats.bestTime3x3 === 0 || time < this.stats.bestTime3x3)) {
            this.stats.bestTime3x3 = time;
        } else if (gridSize === 4 && (this.stats.bestTime4x4 === 0 || time < this.stats.bestTime4x4)) {
            this.stats.bestTime4x4 = time;
        } else if (gridSize === 5 && (this.stats.bestTime5x5 === 0 || time < this.stats.bestTime5x5)) {
            this.stats.bestTime5x5 = time;
        }

        // 更新错误统计
        this.stats.totalErrors += errors;
        if (errors === 0) {
            this.stats.zeroErrorGames++;
        }

        // 更新最大连击
        if (maxCombo > this.stats.maxCombo) {
            this.stats.maxCombo = maxCombo;
        }

        // 更新每日任务进度
        this.updateDailyTaskProgress("play_count", 1);
        if (errors === 0) {
            this.updateDailyTaskProgress("zero_error", 1);
        }
        if (maxCombo >= 5) {
            this.updateDailyTaskProgress("combo_reach", 1);
        }

        this.saveStats();
        this.saveDailyTasks();

        // 检查成就
        return this.checkAchievements();
    }

    /**
     * 记录记忆闪现游戏结果
     */
    public static recordMemoryGame(level: number, maxCombo: number): string[] {
        this.init();

        this.stats.totalGames++;

        if (level > this.stats.memoryBestLevel) {
            this.stats.memoryBestLevel = level;
        }

        if (maxCombo > this.stats.maxCombo) {
            this.stats.maxCombo = maxCombo;
        }

        // 更新每日任务进度
        this.updateDailyTaskProgress("play_count", 1);
        if (level >= 3) {
            this.updateDailyTaskProgress("level_reach", 1);
        }
        if (maxCombo >= 5) {
            this.updateDailyTaskProgress("combo_reach", 1);
        }

        this.saveStats();
        this.saveDailyTasks();

        return this.checkAchievements();
    }

    /**
     * 记录挑战模式完成
     */
    public static recordChallengeComplete(): string[] {
        this.init();

        this.stats.challengeCompleted++;
        this.stats.totalGames++;

        // 更新每日任务进度
        this.updateDailyTaskProgress("play_count", 1);
        this.updateDailyTaskProgress("challenge", 1);

        this.saveStats();
        this.saveDailyTasks();

        return this.checkAchievements();
    }

    // ==================== 成就系统 ====================

    private static loadAchievements(): void {
        try {
            const data = Laya.LocalStorage.getItem(this.ACHIEVEMENTS_KEY);
            if (data) {
                const saved = JSON.parse(data) as Record<string, { unlocked: boolean; unlockedAt?: number }>;
                this.achievements = ACHIEVEMENTS.map(a => ({
                    ...a,
                    unlocked: saved[a.id]?.unlocked || false,
                    unlockedAt: saved[a.id]?.unlockedAt
                }));
            } else {
                this.achievements = ACHIEVEMENTS.map(a => ({ ...a }));
            }
        } catch (e) {
            console.warn("加载成就失败", e);
            this.achievements = ACHIEVEMENTS.map(a => ({ ...a }));
        }
    }

    private static saveAchievements(): void {
        try {
            const data: Record<string, { unlocked: boolean; unlockedAt?: number }> = {};
            this.achievements.forEach(a => {
                data[a.id] = {
                    unlocked: a.unlocked,
                    unlockedAt: a.unlockedAt
                };
            });
            Laya.LocalStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn("保存成就失败", e);
        }
    }

    public static getAchievements(): Achievement[] {
        this.init();
        return [...this.achievements];
    }

    public static getUnlockedCount(): number {
        return this.achievements.filter(a => a.unlocked).length;
    }

    public static getTotalCount(): number {
        return this.achievements.length;
    }

    /**
     * 检查所有成就，返回新解锁的成就ID列表
     */
    private static checkAchievements(): string[] {
        const newlyUnlocked: string[] = [];

        this.achievements.forEach(achievement => {
            if (achievement.unlocked) return;

            let conditionMet = false;
            switch (achievement.id) {
                case "first_win":
                    conditionMet = this.stats.totalGames >= 1;
                    break;
                case "speed_demon":
                    conditionMet = this.stats.bestTime3x3 > 0 && this.stats.bestTime3x3 <= 10000;
                    break;
                case "perfectionist":
                    conditionMet = this.stats.zeroErrorGames >= 1;
                    break;
                case "marathon":
                    conditionMet = this.stats.totalGames >= 20;
                    break;
                case "memory_master":
                    conditionMet = this.stats.memoryBestLevel >= 5;
                    break;
                case "challenge_king":
                    conditionMet = this.stats.challengeCompleted >= 3;
                    break;
                case "streak_5":
                    conditionMet = this.stats.maxCombo >= 5;
                    break;
                case "streak_10":
                    conditionMet = this.stats.maxCombo >= 10;
                    break;
                case "grid_master_4":
                    conditionMet = this.stats.bestTime4x4 > 0;
                    break;
                case "grid_master_5":
                    conditionMet = this.stats.bestTime5x5 > 0;
                    break;
            }

            if (conditionMet) {
                achievement.unlocked = true;
                achievement.unlockedAt = Date.now();
                this.stats.totalCoins += achievement.reward;
                newlyUnlocked.push(achievement.id);
            }
        });

        if (newlyUnlocked.length > 0) {
            this.saveAchievements();
            this.saveStats();
        }

        return newlyUnlocked;
    }

    // ==================== 每日任务 ====================

    private static loadDailyTasks(): void {
        try {
            const data = Laya.LocalStorage.getItem(this.DAILY_TASKS_KEY);
            if (data) {
                const saved = JSON.parse(data) as DailyTask[];
                const todayStart = getTodayStart();

                // 检查是否需要重置
                this.dailyTasks = DAILY_TASK_TEMPLATES.map(template => {
                    const existing = saved.find(t => t.id === template.id);
                    if (existing && !shouldResetTask(existing)) {
                        return existing;
                    }
                    return createDailyTask(template);
                });
            } else {
                this.dailyTasks = DAILY_TASK_TEMPLATES.map(template => createDailyTask(template));
            }
        } catch (e) {
            console.warn("加载每日任务失败", e);
            this.dailyTasks = DAILY_TASK_TEMPLATES.map(template => createDailyTask(template));
        }
    }

    private static saveDailyTasks(): void {
        try {
            Laya.LocalStorage.setItem(this.DAILY_TASKS_KEY, JSON.stringify(this.dailyTasks));
        } catch (e) {
            console.warn("保存每日任务失败", e);
        }
    }

    public static getDailyTasks(): DailyTask[] {
        this.init();
        // 检查重置
        this.dailyTasks.forEach(task => {
            if (shouldResetTask(task)) {
                const template = DAILY_TASK_TEMPLATES.find(t => t.id === task.id);
                if (template) {
                    Object.assign(task, createDailyTask(template));
                }
            }
        });
        return [...this.dailyTasks];
    }

    /**
     * 更新每日任务进度
     */
    private static updateDailyTaskProgress(type: DailyTask["type"], amount: number): void {
        this.dailyTasks.forEach(task => {
            if (task.type === type && !task.completed) {
                task.progress += amount;
                if (task.progress >= task.target) {
                    task.completed = true;
                }
            }
        });
    }

    /**
     * 领取每日任务奖励
     */
    public static claimDailyTaskReward(taskId: string): boolean {
        const task = this.dailyTasks.find(t => t.id === taskId);
        if (!task || !task.completed || task.claimed) {
            return false;
        }

        task.claimed = true;
        this.stats.totalCoins += task.reward;
        this.saveStats();
        this.saveDailyTasks();
        return true;
    }

    /**
     * 获取未完成的每日任务数量
     */
    public static getUnclaimedTaskCount(): number {
        return this.dailyTasks.filter(t => t.completed && !t.claimed).length;
    }

    /**
     * 获取总金币数
     */
    public static getTotalCoins(): number {
        this.init();
        return this.stats.totalCoins;
    }
}