/**
 * 成就定义 - Focus Planet
 * 定义所有可解锁的成就
 */

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;          // 图标标识
    reward: number;        // 奖励金币数
    unlocked: boolean;
    unlockedAt?: number;   // 解锁时间戳
}

/**
 * 玩家统计数据接口
 */
export interface PlayerStats {
    totalGames: number;        // 累计游戏局数
    bestTime3x3: number;       // 3x3最佳时间(ms)
    bestTime4x4: number;       // 4x4最佳时间(ms)
    bestTime5x5: number;       // 5x5最佳时间(ms)
    totalErrors: number;       // 累计错误次数
    zeroErrorGames: number;    // 零错误完成局数
    maxCombo: number;          // 最大连击数
    memoryBestLevel: number;   // 记忆闪现最高关卡
    challengeCompleted: number; // 挑战模式完成次数
    totalCoins: number;        // 累计金币
}

/**
 * 成就列表定义
 */
export const ACHIEVEMENTS: Achievement[] = [
    {
        id: "first_win",
        name: "初次胜利",
        description: "完成第一局游戏",
        icon: "trophy",
        reward: 3,
        unlocked: false
    },
    {
        id: "speed_demon",
        name: "闪电手",
        description: "10秒内完成3x3方格",
        icon: "lightning",
        reward: 10,
        unlocked: false
    },
    {
        id: "perfectionist",
        name: "完美主义",
        description: "零错误完成任意难度",
        icon: "star",
        reward: 5,
        unlocked: false
    },
    {
        id: "marathon",
        name: "马拉松",
        description: "累计玩20局游戏",
        icon: "runner",
        reward: 20,
        unlocked: false
    },
    {
        id: "memory_master",
        name: "记忆大师",
        description: "通过记忆闪现第5关",
        icon: "brain",
        reward: 30,
        unlocked: false
    },
    {
        id: "challenge_king",
        name: "挑战王者",
        description: "完成所有挑战模式各一次",
        icon: "crown",
        reward: 50,
        unlocked: false
    },
    {
        id: "streak_5",
        name: "连击达人",
        description: "单局连续正确5次",
        icon: "fire",
        reward: 5,
        unlocked: false
    },
    {
        id: "streak_10",
        name: "连击大师",
        description: "单局连续正确10次",
        icon: "fire",
        reward: 15,
        unlocked: false
    },
    {
        id: "grid_master_4",
        name: "方格高手",
        description: "完成4x4方格",
        icon: "grid",
        reward: 8,
        unlocked: false
    },
    {
        id: "grid_master_5",
        name: "方格大师",
        description: "完成5x5方格",
        icon: "grid",
        reward: 15,
        unlocked: false
    }
];

/**
 * 成就检查器函数类型
 */
export type AchievementChecker = (stats: PlayerStats) => boolean;

/**
 * 成就检查器映射表
 * 使用映射表替代 switch 语句，便于扩展和维护
 */
export const ACHIEVEMENT_CHECKERS: Record<string, AchievementChecker> = {
    first_win: stats => stats.totalGames >= 1,
    speed_demon: stats => stats.bestTime3x3 > 0 && stats.bestTime3x3 <= 10000,
    perfectionist: stats => stats.zeroErrorGames >= 1,
    marathon: stats => stats.totalGames >= 20,
    memory_master: stats => stats.memoryBestLevel >= 5,
    challenge_king: stats => stats.challengeCompleted >= 3,
    streak_5: stats => stats.maxCombo >= 5,
    streak_10: stats => stats.maxCombo >= 10,
    grid_master_4: stats => stats.bestTime4x4 > 0,
    grid_master_5: stats => stats.bestTime5x5 > 0,
};

/**
 * 检查成就是否达成
 */
export function checkAchievement(achievementId: string, stats: PlayerStats): boolean {
    return ACHIEVEMENT_CHECKERS[achievementId]?.(stats) ?? false;
}