/**
 * UI 配置 - Focus Planet
 * 集中管理 UI 布局参数
 */

// ==================== 屏幕安全区配置 ====================
export const SAFE_AREA_CONFIG = {
    // iPhone X 及以上异形屏
    IPHONE_X: {
        SAFE_TOP: 74,
        SAFE_BOTTOM: 56
    },

    // 普通屏幕
    NORMAL: {
        SAFE_TOP: 44,
        SAFE_BOTTOM: 34
    },

    //安全高度阈值（像素）
    HEIGHT_THRESHOLD: 2400
} as const;

// ==================== 首页布局配置 ====================
export const HOME_CONFIG = {
    // LOGO 配置
    LOGO: {
        WIDTH_RATIO: 0.72,
        ASPECT_RATIO: 500 / 333,
        MIN_HEIGHT: 180,
        GAP_TO_BUTTONS: 26,
        POSITION_Y_OFFSET: 56
    },

    // 玩家状态卡片
    PLAYER_CARD: {
        Y_POSITION: 260,
        WIDTH_RATIO: 0.88,
        HEIGHT: 75,
        AVATAR_SIZE: 60,
        AVATAR_X: 20,
        AVATAR_Y: 20
    },

    // 按钮配置
    BUTTONS: {
        START_Y: 420,
        WIDTH_RATIO: 0.68,
        HEIGHT_RATIO: 200 / 1024,
        GAP: 4,
        ICON_SIZE: 48,
        ICON_X: 40,
        FONT_SIZE_RATIO: 0.28
    }
} as const;

// ==================== 游戏区域配置 ====================
export const GAME_CONFIG = {
    // 游戏面板
    PANEL: {
        WIDTH: 320,
        HEIGHT: 320,
        POSITION_Y: 200
    },

    // 网格计算
    GRID: {
        PADDING: 16,
        SPACING: 6
    },

    // HUD 面板
    HUD: {
        WIDTH: 340,
        HEIGHT: 90,
        POSITION_Y: 75,
        ITEM_WIDTH_RATIO: 1 / 3
    }
} as const;

// ==================== 弹窗配置 ====================
export const POPUP_CONFIG = {
    // 基础弹窗
    BASE: {
        WIDTH: 280,
        HEIGHT: 300,
        Y_OFFSET: 150
    },

    // 按钮配置
    BUTTON: {
        WIDTH: 120,
        HEIGHT: 44,
        POSITION_Y: 220
    },

    // 文本配置
    TEXT: {
        TITLE_SIZE: 28,
        RESULT_SIZE: 16,
        RESULT_LEADING: 8
    }
} as const;

// ==================== 雷达图配置 ====================
export const RADAR_CONFIG = {
    // 尺寸
    SIZE: 280,
    PADDING: 40,

    // 网格层级
    GRID_LEVELS: 5,

    // 顶点数（5个维度）
    VERTICES: 5,

    // 动画
    ANIMATION: {
        DURATION: 1000,
        EASE: "easeOut"
    }
} as const;

// ==================== 排行榜配置 ====================
export const LEADERBOARD_CONFIG = {
    // 列表项
    ITEM: {
        HEIGHT: 60,
        PADDING_X: 16,
        PADDING_Y: 8
    },

    // 排名位置
    RANK: {
        X: 16,
        WIDTH: 50,
        FONT_SIZE: 20
    },

    // 玩家信息
    PLAYER: {
        X: 80,
        WIDTH: 150,
        FONT_SIZE: 16
    },

    // 分数
    SCORE: {
        X: 250,
        WIDTH: 80,
        FONT_SIZE: 18,
        ALIGN: "right"
    }
} as const;

// ==================== 字体配置 ====================
export const FONT_CONFIG = {
    MAIN: "Microsoft YaHei",
    TITLE_SIZE: 24,
    HEADING_SIZE: 18,
    BODY_SIZE: 16,
    SMALL_SIZE: 12,
    BOLD_WEIGHT: true
} as const;

// ==================== 颜色配置 ====================
export const COLOR_CONFIG = {
    PRIMARY: "#4FC3F7",
    SECONDARY: "#7C4DFF",
    SUCCESS: "#4CAF50",
    WARNING: "#FFD700",
    ERROR: "#FF6B6B",
    ACCENT: "#FFE082"
} as const;
