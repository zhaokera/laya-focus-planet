/**
 * 屏幕震动特效工具 - Focus Planet
 * 提供统一的屏幕震动效果
 */

export class ScreenShake {
    private static readonly shakeTimers: Map<Laya.Sprite, number> = new Map();

    /**
     * 屏幕震动 - 用于错误反馈
     * @param target 震动目标（通常是游戏场景的 root）
     * @param strength 震动强度（像素）
     * @param duration 震动持续时间（毫秒）
     */
    static shake(target: Laya.Sprite, strength: number = 4, duration: number = 80): void {
        // 清除已存在的震动
        this.clear(target);

        const originX = target.x;
        const originY = target.y;
        let elapsed = 0;

        // 震动动画 loop
        const shakeLoop = (): void => {
            elapsed += 2;
            if (elapsed >= duration) {
                target.pos(originX, originY);
                this.shakeTimers.delete(target);
                return;
            }

            // 使用 easeOutFunc 逐渐减小震动幅度
            const progress = elapsed / duration;
            const remaining = 1 - progress;
            const dx = (Math.random() - 0.5) * strength * remaining * 2;
            const dy = (Math.random() - 0.5) * strength * remaining * 2;

            target.pos(originX + dx, originY + dy);
        };

        // 使用 frameLoop 保证帧率同步
        Laya.timer.frameLoop(2, this, shakeLoop);
        this.shakeTimers.set(target, 1);
    }

    /**
     * 清除指定目标的震动
     */
    static clear(target: Laya.Sprite): void {
        if (this.shakeTimers.has(target)) {
            Laya.timer.clear(this, this.shakeTimers.get(target) as number);
            this.shakeTimers.delete(target);
        }
    }

    /**
     * 清除所有震动
     */
    static clearAll(): void {
        this.shakeTimers.forEach((timerId, target) => {
            this.clear(target);
        });
        this.shakeTimers.clear();
    }
}
