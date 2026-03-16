/**
 * 震动反馈管理器 - Focus Planet
 * 封装微信小游戏震动API，提供统一的震动反馈接口
 */

export class VibrationManager {
    private static _enabled: boolean = true;

    /**
     * 初始化震动管理器
     */
    public static init(): void {
        // 从设置中读取震动开关状态
        const settings = this.loadSettings();
        this._enabled = settings?.vibrationEnabled ?? true;
    }

    /**
     * 设置震动开关
     */
    public static setEnabled(enabled: boolean): void {
        this._enabled = enabled;
    }

    /**
     * 获取震动开关状态
     */
    public static isEnabled(): boolean {
        return this._enabled;
    }

    /**
     * 轻微震动 - 用于正确点击反馈
     */
    public static light(): void {
        if (!this._enabled) return;
        this.vibrate("light");
    }

    /**
     * 中等震动 - 用于错误点击反馈
     */
    public static medium(): void {
        if (!this._enabled) return;
        this.vibrate("medium");
    }

    /**
     * 强烈震动 - 用于游戏结束或重要事件
     */
    public static heavy(): void {
        if (!this._enabled) return;
        this.vibrate("heavy");
    }

    /**
     * 长震动 - 用于特殊成就解锁等
     */
    public static long(): void {
        if (!this._enabled) return;
        try {
            if (this.isWechatAvailable() && (window as any).wx.vibrateLong) {
                (window as any).wx.vibrateLong();
            }
        } catch (e) {
            // 忽略不支持的情况
        }
    }

    // ==================== 私有方法 ====================

    /**
     * 执行震动（提取重复逻辑）
     */
    private static vibrate(type: "light" | "medium" | "heavy"): void {
        try {
            if (this.isWechatAvailable() && (window as any).wx.vibrateShort) {
                (window as any).wx.vibrateShort({ type });
            }
        } catch (e) {
            // 忽略不支持的情况
        }
    }

    /**
     * 检查微信 API 是否可用
     */
    private static isWechatAvailable(): boolean {
        return typeof (window as any).wx !== "undefined";
    }

    /**
     * 加载设置（提取重复逻辑）
     */
    private static loadSettings(): { vibrationEnabled?: boolean } | null {
        try {
            const data = Laya.LocalStorage.getItem("focus_planet_settings");
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn("[Vibration] 加载设置失败", e);
        }
        return null;
    }
}
