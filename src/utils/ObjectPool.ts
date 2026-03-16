/**
 * 对象池工具 - Focus Planet
 * 用于复用频繁创建和销毁的对象（如 Sprite、Text），减少 GC 压力
 */

export class ObjectPool<T extends Laya.Sprite> {
    private pool: T[] = [];
    private creator: () => T;
    private maxSize: number;

    /**
     * @param creator 对象创建器
     * @param initialSize 初始对象数量
     * @param maxSize 最大对象数量（默认 100）
     */
    constructor(
        creator: () => T,
        initialSize: number = 10,
        maxSize: number = 100
    ) {
        this.creator = creator;
        this.maxSize = maxSize;
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.creator());
        }
    }

    /**
     * 获取对象
     */
    acquire(): T {
        if (this.pool.length > 0) {
            return this.pool.pop()!;
        }
        // 池为空时创建新对象（不超过最大限制）
        if (this.pool.length < this.maxSize) {
            return this.creator();
        }
        // 已达到最大限制，返回池中最后一个（强制复用）
        return this.pool[0];
    }

    /**
     * 归还对象
     */
    release(item: T): void {
        if (this.pool.length >= this.maxSize) {
            // 达到最大限制，销毁对象
            item.destroy();
            return;
        }
        // 清理对象状态
        item.removeChildren();
        item.clearGraphics();
        item.clearTexts();
        item.visible = true;
        item.mouseEnabled = true;
        item.pos(0, 0);
        item.size(0, 0);
        item.scale(1, 1);
        item.alpha = 1;
        this.pool.push(item);
    }

    /**
     * 清空池并销毁所有对象
     */
    clear(): void {
        this.pool.forEach(item => item.destroy());
        this.pool = [];
    }

    /**
     * 获取当前池大小
     */
    size(): number {
        return this.pool.length;
    }

    /**
     * 获取池的容量
     */
    capacity(): number {
        return this.maxSize;
    }
}

/**
 * 简单文本对象池 - 专门用于复用 Text 对象
 */
export class TextPool {
    private pool: Laya.Text[] = [];
    private maxSize: number;

    constructor(initialSize: number = 20, maxSize: number = 100) {
        this.maxSize = maxSize;
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createText());
        }
    }

    private createText(): Laya.Text {
        const t = new Laya.Text();
        t.align = "center";
        t.valign = "middle";
        t.font = "Microsoft YaHei";
        return t;
    }

    acquire(): Laya.Text {
        if (this.pool.length > 0) {
            const t = this.pool.pop()!;
            t.text = "";
            return t;
        }
        if (this.pool.length < this.maxSize) {
            return this.createText();
        }
        return this.pool[0];
    }

    release(text: Laya.Text): void {
        if (this.pool.length >= this.maxSize) {
            text.destroy();
            return;
        }
        text.text = "";
        this.pool.push(text);
    }

    clear(): void {
        this.pool.forEach(item => item.destroy());
        this.pool = [];
    }

    size(): number {
        return this.pool.length;
    }
}
