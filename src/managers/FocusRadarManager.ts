/**
 * 专注力雷达图管理器 - Focus Planet
 * 管理玩家专注力数据和雷达图计算
 */

import {
    GameRecord,
    FocusRadarData,
    FocusRadarState,
    TrainingRecommendation,
    calculateSpeedScore,
    calculateAccuracyScore,
    calculateMemoryScore,
    calculateStabilityScore,
    calculateEnduranceScore,
    generateRecommendations,
    calculateOverallScore,
    getFocusLevel
} from "../data/focusRadar";

export class FocusRadarManager {
    private static readonly STATE_KEY = "focus_planet_radar_state";
    private static readonly RECORDS_KEY = "focus_planet_game_records";
    private static readonly MAX_RECORDS = 50; // 保存最近50局记录

    private static state: FocusRadarState | null = null;
    private static records: GameRecord[] = [];
    private static initialized: boolean = false;

    /**
     * 初始化管理器
     */
    public static init(): void {
        if (this.initialized) return;

        this.loadState();
        this.loadRecords();
        this.checkWeekReset();
        this.initialized = true;
    }

    /**
     * 加载雷达图状态
     */
    private static loadState(): void {
        try {
            const data = Laya.LocalStorage.getItem(this.STATE_KEY);
            if (data) {
                this.state = JSON.parse(data);
            } else {
                this.state = this.createDefaultState();
            }
        } catch (e) {
            console.warn("[FocusRadar] 加载状态失败", e);
            this.state = this.createDefaultState();
        }
    }

    /**
     * 保存雷达图状态
     */
    private static saveState(): void {
        if (!this.state) return;
        try {
            Laya.LocalStorage.setItem(this.STATE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.warn("[FocusRadar] 保存状态失败", e);
        }
    }

    /**
     * 加载游戏记录
     */
    private static loadRecords(): void {
        try {
            const data = Laya.LocalStorage.getItem(this.RECORDS_KEY);
            if (data) {
                this.records = JSON.parse(data);
            }
        } catch (e) {
            console.warn("[FocusRadar] 加载记录失败", e);
            this.records = [];
        }
    }

    /**
     * 保存游戏记录
     */
    private static saveRecords(): void {
        try {
            Laya.LocalStorage.setItem(this.RECORDS_KEY, JSON.stringify(this.records));
        } catch (e) {
            console.warn("[FocusRadar] 保存记录失败", e);
        }
    }

    /**
     * 创建默认状态
     */
    private static createDefaultState(): FocusRadarState {
        const now = Date.now();
        const weekStart = this.getWeekStart(now);

        return {
            speed: 0,
            accuracy: 0,
            memory: 0,
            stability: 0,
            endurance: 0,
            bestSpeed: 0,
            bestAccuracy: 0,
            bestMemory: 0,
            bestStability: 0,
            bestEndurance: 0,
            lastUpdated: now,
            totalGames: 0,
            weeklyGameCount: 0,
            weekStartTime: weekStart
        };
    }

    /**
     * 获取本周开始时间（周一零点）
     */
    private static getWeekStart(timestamp: number): number {
        const date = new Date(timestamp);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday.getTime();
    }

    /**
     * 检查是否需要重置周计数
     */
    private static checkWeekReset(): void {
        if (!this.state) return;

        const currentWeekStart = this.getWeekStart(Date.now());
        if (this.state.weekStartTime < currentWeekStart) {
            // 新的一周，重置计数
            this.state.weekStartTime = currentWeekStart;
            this.state.weeklyGameCount = 0;
            this.saveState();
        }
    }

    /**
     * 记录舒尔特方格游戏
     */
    public static recordSchulteGame(
        gridSize: number,
        time: number,
        errors: number,
        maxCombo: number
    ): void {
        this.init();

        const record: GameRecord = {
            timestamp: Date.now(),
            type: "schulte",
            gridSize,
            time,
            errors,
            maxCombo
        };

        this.addRecord(record);
        this.recalculateScores();
    }

    /**
     * 记录记忆闪现游戏
     */
    public static recordMemoryGame(level: number, maxCombo: number): void {
        this.init();

        const record: GameRecord = {
            timestamp: Date.now(),
            type: "memory",
            time: 0,
            errors: 0,
            maxCombo,
            memoryLevel: level
        };

        this.addRecord(record);
        this.recalculateScores();
    }

    /**
     * 记录挑战模式游戏
     */
    public static recordChallengeGame(time: number, errors: number, maxCombo: number): void {
        this.init();

        const record: GameRecord = {
            timestamp: Date.now(),
            type: "challenge",
            time,
            errors,
            maxCombo
        };

        this.addRecord(record);
        this.recalculateScores();
    }

    /**
     * 添加游戏记录
     */
    private static addRecord(record: GameRecord): void {
        this.records.unshift(record);

        // 保持最大记录数
        if (this.records.length > this.MAX_RECORDS) {
            this.records = this.records.slice(0, this.MAX_RECORDS);
        }

        // 更新周计数
        if (this.state) {
            this.state.totalGames++;
            this.state.weeklyGameCount++;
        }

        // 更新连续打卡
        this.updateStreak();

        this.saveRecords();
    }

    /**
     * 更新连续打卡数据
     */
    private static updateStreak(): void {
        const streakKey = "focus_planet_streak";
        const lastPlayKey = "focus_planet_last_play_date";

        try {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const lastPlayDate = Laya.LocalStorage.getItem(lastPlayKey) || "";
            let streak = parseInt(Laya.LocalStorage.getItem(streakKey) || "0");

            if (lastPlayDate === today) {
                // 今天已经打过卡，不重复增加
                return;
            } else if (lastPlayDate === yesterday) {
                // 昨天打过卡，连续+1
                streak++;
            } else {
                // 连续中断，重新开始
                streak = 1;
            }

            Laya.LocalStorage.setItem(streakKey, String(streak));
            Laya.LocalStorage.setItem(lastPlayKey, today);
        } catch (e) {
            console.warn("[FocusRadar] 更新连续打卡失败", e);
        }
    }

    /**
     * 重新计算所有得分
     */
    private static recalculateScores(): void {
        if (!this.state) return;

        // 获取最近20局记录用于计算
        const recentRecords = this.records.slice(0, 20);

        // 计算各维度得分
        const newScores: FocusRadarData = {
            speed: calculateSpeedScore(recentRecords),
            accuracy: calculateAccuracyScore(recentRecords),
            memory: calculateMemoryScore(this.getBestMemoryLevel()),
            stability: calculateStabilityScore(recentRecords),
            endurance: calculateEnduranceScore(this.state.weeklyGameCount)
        };

        // 更新当前得分
        this.state.speed = newScores.speed;
        this.state.accuracy = newScores.accuracy;
        this.state.memory = newScores.memory;
        this.state.stability = newScores.stability;
        this.state.endurance = newScores.endurance;

        // 更新历史最佳
        this.state.bestSpeed = Math.max(this.state.bestSpeed, newScores.speed);
        this.state.bestAccuracy = Math.max(this.state.bestAccuracy, newScores.accuracy);
        this.state.bestMemory = Math.max(this.state.bestMemory, newScores.memory);
        this.state.bestStability = Math.max(this.state.bestStability, newScores.stability);
        this.state.bestEndurance = Math.max(this.state.bestEndurance, newScores.endurance);

        this.state.lastUpdated = Date.now();

        this.saveState();
    }

    /**
     * 获取最高记忆关卡
     */
    private static getBestMemoryLevel(): number {
        const memoryRecords = this.records.filter(r => r.type === "memory" && r.memoryLevel);
        if (memoryRecords.length === 0) return 0;

        return Math.max(...memoryRecords.map(r => r.memoryLevel || 0));
    }

    /**
     * 获取雷达图数据
     */
    public static getRadarData(): FocusRadarData {
        this.init();

        return {
            speed: this.state?.speed || 0,
            accuracy: this.state?.accuracy || 0,
            memory: this.state?.memory || 0,
            stability: this.state?.stability || 0,
            endurance: this.state?.endurance || 0
        };
    }

    /**
     * 获取完整状态
     */
    public static getFullState(): FocusRadarState | null {
        this.init();
        return this.state;
    }

    /**
     * 获取训练推荐
     */
    public static getRecommendations(): TrainingRecommendation[] {
        this.init();
        return generateRecommendations(this.getRadarData());
    }

    /**
     * 获取综合评分
     */
    public static getOverallScore(): number {
        this.init();
        return calculateOverallScore(this.getRadarData());
    }

    /**
     * 获取专注力等级
     */
    public static getFocusLevelInfo(): { level: string; title: string; color: string } {
        const score = this.getOverallScore();
        return getFocusLevel(score);
    }

    /**
     * 获取弱项维度
     */
    public static getWeakDimensions(): string[] {
        this.init();
        const recommendations = this.getRecommendations();
        return recommendations
            .filter(r => r.isWeak)
            .map(r => r.dimensionName);
    }

    /**
     * 获取历史最佳
     */
    public static getBestScores(): FocusRadarData {
        this.init();
        return {
            speed: this.state?.bestSpeed || 0,
            accuracy: this.state?.bestAccuracy || 0,
            memory: this.state?.bestMemory || 0,
            stability: this.state?.bestStability || 0,
            endurance: this.state?.bestEndurance || 0
        };
    }

    /**
     * 获取最近游戏记录
     */
    public static getRecentRecords(count: number = 10): GameRecord[] {
        this.init();
        return this.records.slice(0, count);
    }

    /**
     * 获取统计摘要
     */
    public static getSummary(): {
        totalGames: number;
        weeklyGames: number;
        lastPlayed: string;
    } {
        this.init();

        let lastPlayed = "从未";
        if (this.records.length > 0) {
            const lastTime = this.records[0].timestamp;
            const now = Date.now();
            const diff = now - lastTime;

            if (diff < 60000) {
                lastPlayed = "刚刚";
            } else if (diff < 3600000) {
                lastPlayed = `${Math.floor(diff / 60000)}分钟前`;
            } else if (diff < 86400000) {
                lastPlayed = `${Math.floor(diff / 3600000)}小时前`;
            } else {
                lastPlayed = `${Math.floor(diff / 86400000)}天前`;
            }
        }

        return {
            totalGames: this.state?.totalGames || 0,
            weeklyGames: this.state?.weeklyGameCount || 0,
            lastPlayed
        };
    }

    /**
     * 获取连续打卡天数
     */
    public static getStreakDays(): number {
        const streakKey = "focus_planet_streak";
        const lastPlayKey = "focus_planet_last_play_date";

        try {
            const streak = parseInt(Laya.LocalStorage.getItem(streakKey) || "0");
            const lastPlayDate = Laya.LocalStorage.getItem(lastPlayKey) || "";

            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            if (lastPlayDate === today || lastPlayDate === yesterday) {
                return streak;
            } else if (lastPlayDate === "") {
                return 0;
            } else {
                return 0;
            }
        } catch (e) {
            return 0;
        }
    }

    /**
     * 检查今天是否已训练
     */
    public static isTodayPlayed(): boolean {
        const lastPlayKey = "focus_planet_last_play_date";
        try {
            const lastPlayDate = Laya.LocalStorage.getItem(lastPlayKey) || "";
            const today = new Date().toISOString().split('T')[0];
            return lastPlayDate === today;
        } catch (e) {
            return false;
        }
    }
}