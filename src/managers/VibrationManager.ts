/**
 * 震动反馈管理器 - Focus Planet
 * 封装微信小游戏震动API，提供统一的震动反馈接口
 */

import { SettingsManager } from "../panels/SettingsPanel";

export class VibrationManager {
    private static _enabled: boolean = true;

    /**
     * 初始化震动管理器
     */
    public static init(): void {
        // 从设置中读取震动开关状态
        const settings = SettingsManager.load();
        this._enabled = settings.vibrationEnabled !== false;
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

        try {
            // 微信小游戏震动API
            if (typeof (window as any).wx !== "undefined" && (window as any).wx.vibrateShort) {
                (window as any).wx.vibrateShort({
                    type: "light"
                });
            }
        } catch (e) {
            // 忽略不支持的情况
        }
    }

    /**
     * 中等震动 - 用于错误点击反馈
     */
    public static medium(): void {
        if (!this._enabled) return;

        try {
            if (typeof (window as any).wx !== "undefined" && (window as any).wx.vibrateShort) {
                (window as any).wx.vibrateShort({
                    type: "medium"
                });
            }
        } catch (e) {
            // 忽略不支持的情况
        }
    }

    /**
     * 强烈震动 - 用于游戏结束或重要事件
     */
    public static heavy(): void {
        if (!this._enabled) return;

        try {
            if (typeof (window as any).wx !== "undefined" && (window as any).wx.vibrateShort) {
                (window as any).wx.vibrateShort({
                    type: "heavy"
                });
            }
        } catch (e) {
            // 忽略不支持的情况
        }
    }

    /**
     * 长震动 - 用于特殊成就解锁等
     */
    public static long(): void {
        if (!this._enabled) return;

        try {
            if (typeof (window as any).wx !== "undefined" && (window as any).wx.vibrateLong) {
                (window as any).wx.vibrateLong();
            }
        } catch (e) {
            // 忽略不支持的情况
        }
    }
}