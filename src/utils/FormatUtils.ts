/**
 * 格式化工具类 - Focus Planet
 * 统一管理时间、数字等格式化逻辑
 */

/**
 * 时间格式化
 * 将毫秒转换为人类可读的格式
 */
export class TimeFormatter {
    /**
     * 格式化时间跨度（多少时间前）
     * @param timestamp 时间戳（毫秒）
     * @returns 格式化后的时间字符串
     */
    static formatTimeAgo(timestamp: number): string {
        if (!timestamp) return "从未";

        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 60000) {
            return "刚刚";
        } else if (diff < 3600000) {
            return `${Math.floor(diff / 60000)}分钟前`;
        } else if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}小时前`;
        } else if (diff < 604800000) {
            return `${Math.floor(diff / 86400000)}天前`;
        } else {
            return `${Math.floor(diff / 604800000)}周前`;
        }
    }

    /**
     * 格式化日期为 YYYY-MM-DD
     * @param date 日期对象
     * @returns 格式化后的日期字符串
     */
    static formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    /**
     * 格式化时间为 HH:mm
     * @param date 日期对象
     * @returns 格式化后的时间字符串
     */
    static formatTime(date: Date): string {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
    }

    /**
     * 格式化时长为 "HH:mm:ss"
     * @param ms 毫秒数
     * @returns 格式化后的时间字符串
     */
    static formatDuration(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        } else {
            return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        }
    }

    /**
     * 格式化时长为 "X分Y秒"
     * @param ms 毫秒数
     * @returns 格式化后的时间字符串
     */
    static formatDurationCompact(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        if (minutes > 0) {
            return `${minutes}分${seconds}秒`;
        } else {
            return `${seconds}秒`;
        }
    }
}

/**
 * 数字格式化
 */
export class NumberFormatter {
    /**
     * 格式化数字为 "X.XX" 格式
     * @param value 数值
     * @param decimals 小数位数
     * @returns 格式化后的字符串
     */
    static formatDecimal(value: number, decimals: number = 2): string {
        return value.toFixed(decimals);
    }

    /**
     * 格式化数字为带逗号的字符串
     * @param value 数值
     * @returns 格式化后的字符串
     */
    static formatWithCommas(value: number): string {
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * 格式化为百分比
     * @param value 比例值 (0-1)
     * @param decimals 小数位数
     * @returns 格式化后的百分比字符串
     */
    static formatPercent(value: number, decimals: number = 1): string {
        return `${(value * 100).toFixed(decimals)}%`;
    }

    /**
     * 格式化为分数显示 (如 "8/10")
     * @param numerator 分子
     * @param denominator 分母
     * @returns 格式化后的分数字符串
     */
    static formatFraction(numerator: number, denominator: number): string {
        return `${numerator}/${denominator}`;
    }
}

/**
 * 颜色工具
 */
export class ColorUtils {
    /**
     * 将 RGB 颜色转换为 rgba 字符串
     * @param r 红色 (0-255)
     * @param g 绿色 (0-255)
     * @param b 蓝色 (0-255)
     * @param alpha 透明度 (0-1)
     * @returns rgba 字符串
     */
    static toRgba(r: number, g: number, b: number, alpha: number = 1): string {
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * 将 hex 颜色转换为 RGB 对象
     * @param hex hex 颜色字符串
     * @returns RGB 对象
     */
    static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return null;

        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        };
    }
}
