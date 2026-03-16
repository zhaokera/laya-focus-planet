/**
 * 本地存储 Key 常量
 * 统一管理所有 Laya.LocalStorage 的 key，避免硬编码
 */

export enum StorageKey {
    // ==================== Focus Radar ====================
    /**
     * 专注力雷达图状态
     * 存储格式: FocusRadarState
     */
    RadarState = "focus_planet_radar_state",

    /**
     * 游戏记录
     * 存储格式: GameRecord[]
     */
    GameRecords = "focus_planet_game_records",

    // ==================== Streak System ====================
    /**
     * 连续打卡天数
     * 存储格式: string (number)
     */
    StreakCount = "focus_planet_streak",

    /**
     * 上次游戏日期
     * 存储格式: string (ISODateString)
     */
    LastPlayDate = "focus_planet_last_play_date",

    // ==================== Leaderboard ====================
    /**
     * 舒尔特排行榜
     * 存储格式: LeaderboardEntry[]
     */
    LeaderboardSchulte = "focus_planet_leaderboard_schulte",

    /**
     * 记忆排行榜
     * 存储格式: LeaderboardEntry[]
     */
    LeaderboardMemory = "focus_planet_leaderboard_memory",

    // ==================== Settings ====================
    /**
     * 声音开关
     * 存储格式: string (boolean)
     */
    SoundEnabled = "focus_planet_sound_enabled",

    /**
     * 震动开关
     * 存储格式: string (boolean)
     */
    VibrationEnabled = "focus_planet_vibration_enabled",

    /**
     * 背景音乐音量
     * 存储格式: string (number)
     */
   _BGMSoundVolume = "focus_planet_bgm_volume",

    /**
     * 音效音量
     * 存储格式: string (number)
     */
    SfxVolume = "focus_planet_sfx_volume",

    // ==================== Guide ====================
    /**
     * 新手引导是否已显示
     * 存储格式: string (boolean)
     */
    GuideShown = "focus_planet_guide_shown",

    // ==================== Achievement ====================
    /**
     * 成就数据
     * 存储格式: { [key: string]: boolean } (achievementId -> unlocked)
     */
    Achievements = "focus_planet_achievements",

    /**
     * 每日任务数据
     * 存储格式: { [key: string]: boolean } (taskId -> completed)
     */
    DailyTasks = "focus_planet_daily_tasks",

    // ==================== Statistics ====================
    /**
     * 玩家统计数据
     * 存储格式: AchievementStats
     */
    Stats = "focus_planet_stats",
}

/**
 * 安全获取存储值
 */
export class StorageUtils {
    /**
     * 获取存储值，带类型推断
     */
    static get<T>(key: StorageKey, defaultValue?: T): T | null {
        try {
            const data = Laya.LocalStorage.getItem(key);
            if (data === null || data === undefined) {
                return defaultValue ?? null;
            }
            return JSON.parse(data) as T;
        } catch (e) {
            console.warn(`[Storage] Get failed: ${key}`, e);
            return defaultValue ?? null;
        }
    }

    /**
     * 保存存储值
     */
    static set(key: StorageKey, value: any): boolean {
        try {
            Laya.LocalStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn(`[Storage] Set failed: ${key}`, e);
            return false;
        }
    }

    /**
     * 删除存储值
     */
    static remove(key: StorageKey): boolean {
        try {
            Laya.LocalStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn(`[Storage] Remove failed: ${key}`, e);
            return false;
        }
    }

    /**
     * 清空所有存储
     */
    static clear(): void {
        try {
            Laya.LocalStorage.clear();
        } catch (e) {
            console.warn("[Storage] Clear failed", e);
        }
    }
}
