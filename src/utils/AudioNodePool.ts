/**
 * 音频节点池 - Focus Planet
 * 复用 Web Audio API 的 oscillator 和 gain 节点
 */

import { AUDIO_POOL_CONFIG } from "../config/AudioConfig";

export class AudioNodePool {
    private oscillatorPool: OscillatorNode[] = [];
    private gainPool: GainNode[] = [];

    constructor(
        private initialSize: number = AUDIO_POOL_CONFIG.INITIAL_SIZE,
        private maxSize: number = AUDIO_POOL_CONFIG.MAX_SIZE
    ) {
        // 预创建对象
        for (let i = 0; i < initialSize; i++) {
            this.oscillatorPool.push(this.createOscillator());
            this.gainPool.push(this.createGain());
        }
    }

    /**
     * 从池中获取 oscillator
     */
    acquireOscillator(): OscillatorNode {
        if (this.oscillatorPool.length > 0) {
            const node = this.oscillatorPool.pop()!;
            node.frequency.setValueAtTime(0, node.context.currentTime);
            node.stop();
            return node;
        }
        if (this.oscillatorPool.length < this.maxSize) {
            return this.createOscillator();
        }
        return this.oscillatorPool[0];
    }

    /**
     * 归还 oscillator 到池
     */
    releaseOscillator(node: OscillatorNode): void {
        if (this.oscillatorPool.length >= this.maxSize) {
            node.disconnect();
            return;
        }
        node.disconnect();
        this.oscillatorPool.push(node);
    }

    /**
     * 从池中获取 gain
     */
    acquireGain(): GainNode {
        if (this.gainPool.length > 0) {
            const node = this.gainPool.pop()!;
            node.gain.setValueAtTime(0, node.context.currentTime);
            return node;
        }
        if (this.gainPool.length < this.maxSize) {
            return this.createGain();
        }
        return this.gainPool[0];
    }

    /**
     * 归还 gain 到池
     */
    releaseGain(node: GainNode): void {
        if (this.gainPool.length >= this.maxSize) {
            node.disconnect();
            return;
        }
        node.disconnect();
        this.gainPool.push(node);
    }

    /**
     * 获取池状态
     */
    getState(): { available: number; used: number; capacity: number } {
        return {
            available: this.oscillatorPool.length,
            used: this.maxSize - this.oscillatorPool.length,
            capacity: this.maxSize
        };
    }

    /**
     * 清空池并销毁所有对象
     */
    clear(): void {
        this.oscillatorPool.forEach(node => node.disconnect());
        this.gainPool.forEach(node => node.disconnect());
        this.oscillatorPool = [];
        this.gainPool = [];
    }

    // ==================== 私有方法 ====================

    private createOscillator(): OscillatorNode {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        oscillator.type = "sine";
        return oscillator;
    }

    private createGain(): GainNode {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        return gain;
    }
}

// 全局单例
let audioNodePool: AudioNodePool | null = null;

export function getAudioNodePool(): AudioNodePool {
    if (!audioNodePool) {
        audioNodePool = new AudioNodePool();
    }
    return audioNodePool;
}
