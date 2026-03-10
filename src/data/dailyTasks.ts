/**
 * 每日任务定义 - Focus Planet
 * 定义每日重置的任务
 */

export interface DailyTask {
    id: string;
    name: string;
    description: string;
    type: "play_count" | "zero_error" | "level_reach" | "combo_reach" | "challenge";
    target: number;        // 目标数值
    progress: number;      // 当前进度
    reward: number;        // 奖励金币数
    completed: boolean;    // 是否已完成
    claimed: boolean;      // 是否已领取奖励
    resetAt: number;       // 重置时间戳
}

/**
 * 每日任务模板
 */
export const DAILY_TASK_TEMPLATES: Omit<DailyTask, "progress" | "completed" | "claimed" | "resetAt">[] = [
    {
        id: "daily_play_3",
        name: "日常练习",
        description: "完成3局游戏",
        type: "play_count",
        target: 3,
        reward: 5
    },
    {
        id: "daily_perfect",
        name: "追求完美",
        description: "零错误完成1局",
        type: "zero_error",
        target: 1,
        reward: 10
    },
    {
        id: "daily_memory",
        name: "记忆训练",
        description: "通过记忆闪现第3关",
        type: "level_reach",
        target: 3,
        reward: 8
    },
    {
        id: "daily_challenge",
        name: "每日挑战",
        description: "完成1次挑战模式",
        type: "challenge",
        target: 1,
        reward: 10
    },
    {
        id: "daily_combo",
        name: "连击挑战",
        description: "单局达成5连击",
        type: "combo_reach",
        target: 5,
        reward: 8
    }
];

/**
 * 获取今日零点时间戳
 */
export function getTodayStart(): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
}

/**
 * 检查是否需要重置任务
 */
export function shouldResetTask(task: DailyTask): boolean {
    const todayStart = getTodayStart();
    return task.resetAt < todayStart;
}

/**
 * 创建新的每日任务实例
 */
export function createDailyTask(template: Omit<DailyTask, "progress" | "completed" | "claimed" | "resetAt">): DailyTask {
    return {
        ...template,
        progress: 0,
        completed: false,
        claimed: false,
        resetAt: getTodayStart()
    };
}