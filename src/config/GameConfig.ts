/**
 * 游戏配置 - Focus Planet
 * 集中管理游戏相关参数
 */

// ==================== 网格配置 ====================
export const GRID_CONFIG = {
    // 网格尺寸配置
    SIZES: {
        SMALL: { size: 3, label: "3x3" },
        MEDIUM: { size: 4, label: "4x4" },
        LARGE: { size: 5, label: "5x5" }
    },

    // 默认网格大小
    DEFAULT: 4,

    // 网格内边距（像素）
    PADDING: 16,

    // 格子间距（像素）
    SPACING: 6,

    // 最小格子尺寸（像素）
    MIN_CELL_SIZE: 40
} as const;

// ==================== 时间配置 ====================
export const TIME_CONFIG = {
    // 序列显示时间（毫秒）
    SEQUENCE_DISPLAY: {
        EASY: 1500,
        MEDIUM: 1000,
        HARD: 600
    },

    // 互动反馈时间（毫秒）
    FEEDBACK: {
        PRESS: 80,
        ERROR: 90,
        CORRECT: 100
    },

    // 界面延迟（毫秒）
    DELAY: {
        SEQUENCE_START: 800,
        ROUND_COMPLETE: 1500,
        ERROR_REPLAY: 1000
    }
} as const;

// ==================== 游戏规则配置 ====================
export const GAME_RULES = {
    // 舒尔特方格
    SCHULTE: {
        MIN_NUMBER: 1,
        MAX_NUMBER: 25
    },

    // 记忆闪现
    MEMORY: {
        MIN_SEQUENCE_LENGTH: 3,
        MAX_SEQUENCE_LENGTH: 10,
        BASE_LIVES: 5
    },

    // 挑战模式
    CHALLENGE: {
        BLITZ: {
            TIME_LIMIT: 60000 // 60秒
        },
        ENDLESS: {
            START_LEVEL: 1,
            START_GRID_SIZE: 3
        },
        PERFECTIONIST: {
            START_LIVES: 3,
            MAX_LIVES: 5
        }
    }
} as const;

// ==================== 奖励配置 ====================
export const REWARD_CONFIG = {
    // 成就奖励金币
    ACHIEVEMENT_REWARDS: {
        FIRST_WIN: 3,
        SPEED_DEMON: 10,
        PERFECTIONIST: 5,
        MARATHON: 20,
        MEMORY_MASTER: 30,
        CHALLENGE_KING: 50,
        STREAK_5: 5,
        STREAK_10: 15,
        GRID_MASTER_4: 8,
        GRID_MASTER_5: 15
    },

    // 每日任务奖励
    DAILY_TASK_REWARDS: {
        PLAY_COUNT: 2,
        ZERO_ERROR: 5,
        COMBO_REACH: 3,
        LEVEL_REACH: 5,
        CHALLENGE: 10
    }
} as const;

// ==================== 分数计算配置 ====================
export const SCORING_CONFIG = {
    // 基础分数
    BASE_SCORE: 100,

    // 时间加成（每100ms减少的分数）
    TIME_BONUS_RATE: 10,
    TIME_BONUS_MAX: 1000,

    // 连击加成
    COMBO_BONUS: {
        MULTIPLIER: 20,
        MAX_LEVEL: 15
    }
} as const;
