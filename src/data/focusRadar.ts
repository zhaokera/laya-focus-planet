/**
 * 专注力雷达图数据定义 - Focus Planet
 * 定义五大维度和计算逻辑
 */

/**
 * 游戏记录
 */
export interface GameRecord {
    timestamp: number;
    type: "schulte" | "memory" | "challenge";
    gridSize?: number;       // 舒尔特方格大小
    time: number;            // 用时(ms)
    errors: number;          // 错误次数
    maxCombo: number;        // 最大连击
    memoryLevel?: number;    // 记忆闪现关卡
}

/**
 * 雷达图数据
 */
export interface FocusRadarData {
    speed: number;           // 速度得分 0-100
    accuracy: number;        // 准确性得分 0-100
    memory: number;          // 记忆得分 0-100
    stability: number;       // 稳定性得分 0-100
    endurance: number;       // 持久性得分 0-100
}

/**
 * 完整的雷达图状态
 */
export interface FocusRadarState extends FocusRadarData {
    // 历史最佳
    bestSpeed: number;
    bestAccuracy: number;
    bestMemory: number;
    bestStability: number;
    bestEndurance: number;

    // 统计元数据
    lastUpdated: number;
    totalGames: number;
    weeklyGameCount: number;
    weekStartTime: number;
}

/**
 * 训练推荐
 */
export interface TrainingRecommendation {
    dimension: keyof FocusRadarData;
    dimensionName: string;
    score: number;
    isWeak: boolean;
    recommendations: string[];
}

/**
 * 维度配置
 */
export const DIMENSION_CONFIG = {
    speed: {
        name: "速度",
        icon: "⚡",
        color: "#FFD700",
        description: "反应速度和视觉搜索能力"
    },
    accuracy: {
        name: "准确性",
        icon: "🎯",
        color: "#4FC3F7",
        description: "精确度和冲动控制能力"
    },
    memory: {
        name: "记忆",
        icon: "🧠",
        color: "#9C27B0",
        description: "工作记忆容量"
    },
    stability: {
        name: "稳定性",
        icon: "⚖️",
        color: "#4CAF50",
        description: "注意力持续性"
    },
    endurance: {
        name: "持久性",
        icon: "💪",
        color: "#FF6B6B",
        description: "训练耐力和习惯"
    }
} as const;

/**
 * 计算速度得分
 * 基准时间：3x3=10秒, 4x4=25秒, 5x5=50秒
 */
export function calculateSpeedScore(records: GameRecord[]): number {
    const schulteRecords = records.filter(r => r.type === "schulte" && r.gridSize);

    if (schulteRecords.length === 0) return 0;

    let totalScore = 0;
    let count = 0;

    // 按网格大小分组计算
    const bySize: Record<number, GameRecord[]> = { 3: [], 4: [], 5: [] };
    schulteRecords.forEach(r => {
        if (r.gridSize && bySize[r.gridSize]) {
            bySize[r.gridSize].push(r);
        }
    });

    // 基准时间和扣分系数
    const baseConfig: Record<number, { base: number; penalty: number }> = {
        3: { base: 10000, penalty: 5 },   // 10秒基准，每秒扣5分
        4: { base: 25000, penalty: 3 },   // 25秒基准，每秒扣3分
        5: { base: 50000, penalty: 2 }    // 50秒基准，每秒扣2分
    };

    for (const size of [3, 4, 5] as const) {
        const sizeRecords = bySize[size];
        if (sizeRecords.length > 0) {
            const config = baseConfig[size];
            const avgTime = sizeRecords.reduce((sum, r) => sum + r.time, 0) / sizeRecords.length;
            const diffSec = (avgTime - config.base) / 1000;
            const score = Math.max(0, Math.min(100, 100 - diffSec * config.penalty));
            totalScore += score;
            count++;
        }
    }

    return count > 0 ? Math.round(totalScore / count) : 0;
}

/**
 * 计算准确性得分
 * 公式: 100 - (平均错误率 × 系数)
 */
export function calculateAccuracyScore(records: GameRecord[]): number {
    const schulteRecords = records.filter(r => r.type === "schulte" && r.gridSize);

    if (schulteRecords.length === 0) return 0;

    let totalScore = 0;

    schulteRecords.forEach(r => {
        const gridSize = r.gridSize || 4;
        const totalNumbers = gridSize * gridSize;
        const errorRate = r.errors / totalNumbers;

        // 难度系数：大方格容错率更高
        const difficultyBonus = gridSize === 5 ? 0.5 : (gridSize === 4 ? 0.7 : 1);
        const score = Math.max(0, 100 - errorRate * 100 * difficultyBonus * 1.5);

        totalScore += score;
    });

    return Math.round(totalScore / schulteRecords.length);
}

/**
 * 计算记忆得分
 * 基于记忆闪现最高关卡
 */
export function calculateMemoryScore(bestLevel: number): number {
    // 每关12分，最高100分
    return Math.min(100, bestLevel * 12);
}

/**
 * 计算稳定性得分
 * 基于平均连击数
 */
export function calculateStabilityScore(records: GameRecord[]): number {
    if (records.length === 0) return 0;

    const avgCombo = records.reduce((sum, r) => sum + r.maxCombo, 0) / records.length;

    // 平均5连击 = 50分，平均10连击 = 100分
    return Math.min(100, Math.round(avgCombo * 10));
}

/**
 * 计算持久性得分
 * 基于最近7天的游戏局数
 */
export function calculateEnduranceScore(weeklyGameCount: number): number {
    // 每周20局 = 100分
    return Math.min(100, Math.round((weeklyGameCount / 20) * 100));
}

/**
 * 获取弱项维度
 * 得分低于60的维度为弱项
 */
export function getWeakDimensions(data: FocusRadarData): (keyof FocusRadarData)[] {
    const weak: (keyof FocusRadarData)[] = [];
    const threshold = 60;

    if (data.speed < threshold) weak.push("speed");
    if (data.accuracy < threshold) weak.push("accuracy");
    if (data.memory < threshold) weak.push("memory");
    if (data.stability < threshold) weak.push("stability");
    if (data.endurance < threshold) weak.push("endurance");

    return weak;
}

/**
 * 生成训练推荐
 */
export function generateRecommendations(data: FocusRadarData): TrainingRecommendation[] {
    const recommendations: TrainingRecommendation[] = [];
    const weakDimensions = getWeakDimensions(data);

    const recommendationMap: Record<keyof FocusRadarData, string[]> = {
        speed: [
            "尝试3×3计时挑战",
            "练习快速视觉搜索",
            "减少停顿，保持节奏"
        ],
        accuracy: [
            "放慢速度，先求准再求快",
            "尝试5×5模式锻炼耐心",
            "深呼吸，避免冲动点击"
        ],
        memory: [
            "多玩记忆闪现模式",
            "从第3关开始练习",
            "尝试联想记忆法"
        ],
        stability: [
            "挑战零失误模式",
            "保持专注，避免分心",
            "建立稳定的点击节奏"
        ],
        endurance: [
            "每天至少玩3局",
            "固定训练时间养成习惯",
            "完成每日任务获取奖励"
        ]
    };

    const dimensions: (keyof FocusRadarData)[] = ["speed", "accuracy", "memory", "stability", "endurance"];

    dimensions.forEach(dim => {
        recommendations.push({
            dimension: dim,
            dimensionName: DIMENSION_CONFIG[dim].name,
            score: data[dim],
            isWeak: weakDimensions.includes(dim),
            recommendations: recommendationMap[dim]
        });
    });

    // 按得分排序，弱项排在前面
    recommendations.sort((a, b) => {
        if (a.isWeak && !b.isWeak) return -1;
        if (!a.isWeak && b.isWeak) return 1;
        return a.score - b.score;
    });

    return recommendations;
}

/**
 * 计算综合专注力评分
 */
export function calculateOverallScore(data: FocusRadarData): number {
    // 加权平均：准确性权重最高
    const weights = {
        speed: 0.2,
        accuracy: 0.25,
        memory: 0.2,
        stability: 0.2,
        endurance: 0.15
    };

    const score = data.speed * weights.speed +
                  data.accuracy * weights.accuracy +
                  data.memory * weights.memory +
                  data.stability * weights.stability +
                  data.endurance * weights.endurance;

    return Math.round(score);
}

/**
 * 获取专注力等级
 */
export function getFocusLevel(score: number): { level: string; title: string; color: string } {
    if (score >= 90) return { level: "S+", title: "专注大师", color: "#FFD700" };
    if (score >= 80) return { level: "S", title: "专注达人", color: "#FFD700" };
    if (score >= 70) return { level: "A", title: "专注能手", color: "#4FC3F7" };
    if (score >= 60) return { level: "B", title: "专注学徒", color: "#4CAF50" };
    if (score >= 40) return { level: "C", title: "专注新手", color: "#FF9800" };
    return { level: "D", title: "专注入门", color: "#FF6B6B" };
}