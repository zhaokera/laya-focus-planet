/**
 * 音效管理器 - Focus Planet
 * 使用 Web Audio API 生成合成音效，支持对象池复用
 */

import { getAudioNodePool, AudioNodePool } from "./AudioNodePool";
import { SOUND_PARAM, AUDIO_CONTEXT_CONFIG } from "../config/AudioConfig";

export class SoundManager {
    private static audioContext: AudioContext = null;
    private static enabled: boolean = true;
    private static volume: number = 0.5;
    private static nodePool: AudioNodePool = null;

    /**
     * 初始化音频上下文和节点池
     */
    public static init(): void {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                this.nodePool = getAudioNodePool();
            } catch (e) {
                console.warn("AudioContext not supported", e);
            }
        }

        // 从设置中读取音效开关状态和音量
        const settings = Laya.LocalStorage.getItem("focus_planet_settings");
        if (settings) {
            try {
                const parsed = JSON.parse(settings);
                this.enabled = parsed.soundEnabled !== false;
                this.volume = parsed.soundVolume !== undefined ? parsed.soundVolume : 0.5;
            } catch (e) {
                this.enabled = true;
                this.volume = 0.5;
            }
        }
    }

    /**
     * 设置音效开关
     */
    public static setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * 获取音效开关状态
     */
    public static isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * 设置音量 (0-1)
     */
    public static setVolume(vol: number): void {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    /**
     * 获取当前音量
     */
    public static getVolume(): number {
        return this.volume;
    }

    /**
     * 播放点击正确音 - 清脆的"叮"声
     */
    public static playCorrect(): void {
        if (!this.enabled) return;
        this.playTone(SOUND_PARAM.CORRECT.FREQUENCY, SOUND_PARAM.CORRECT.DURATION, this.volume * SOUND_PARAM.CORRECT.VOLUME_PERCENT / 100, "sine");
    }

    /**
     * 播放点击错误音 - 低沉的"嘟"声
     */
    public static playWrong(): void {
        if (!this.enabled) return;
        this.playTone(SOUND_PARAM.WRONG.FREQUENCY, SOUND_PARAM.WRONG.DURATION, this.volume * SOUND_PARAM.WRONG.VOLUME_PERCENT / 100, "square");
    }

    /**
     * 播放完成游戏音 - 欢快的上升音阶
     */
    public static playComplete(): void {
        if (!this.enabled) return;
        this.playMelody(SOUND_PARAM.CORRECT.FREQUENCY, SOUND_PARAM.COMPLETE.FREQUENCIES, SOUND_PARAM.COMPLETE.NOTE_DURATION, this.volume * SOUND_PARAM.COMPLETE.VOLUME_PERCENT / 100);
    }

    /**
     * 播放按钮点击音 - 轻微的点击声
     */
    public static playClick(): void {
        if (!this.enabled) return;
        this.playTone(SOUND_PARAM.CLICK.FREQUENCY, SOUND_PARAM.CLICK.DURATION, this.volume * SOUND_PARAM.CLICK.VOLUME_PERCENT / 100, "sine");
    }

    /**
     * 播放单个音符
     */
    private static playTone(frequency: number, duration: number, volume: number, type: OscillatorType): void {
        if (!this.audioContext) {
            this.init();
        }
        if (!this.audioContext) return;

        try {
            // 如果音频上下文被暂停，则恢复
            if (this.audioContext.state === "suspended") {
                this.audioContext.resume();
            }

            // 使用对象池获取节点
            const oscillator = this.nodePool ? this.nodePool.acquireOscillator() : this.audioContext.createOscillator();
            const gainNode = this.nodePool ? this.nodePool.acquireGain() : this.audioContext.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);

            // 归还节点到池
            if (this.nodePool) {
                // 延迟归还，确保播放完成
                Laya.timer.once(duration * 1000 + 50, this, () => {
                    this.nodePool.releaseOscillator(oscillator);
                    this.nodePool.releaseGain(gainNode);
                });
            }
        } catch (e) {
            console.warn("Failed to play tone", e);
        }
    }

    /**
     * 播放旋律（多个音符连续播放）
     */
    private static playMelody(baseFreq: number, frequencies: number[], noteDuration: number, volume: number): void {
        if (!this.audioContext) {
            this.init();
        }
        if (!this.audioContext) return;

        try {
            if (this.audioContext.state === "suspended") {
                this.audioContext.resume();
            }

            const totalDuration = frequencies.length * noteDuration;

            frequencies.forEach((freq, index) => {
                const startTime = this.audioContext.currentTime + index * noteDuration;

                const oscillator = this.nodePool ? this.nodePool.acquireOscillator() : this.audioContext.createOscillator();
                const gainNode = this.nodePool ? this.nodePool.acquireGain() : this.audioContext.createGain();

                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(freq, startTime);

                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(volume, startTime + noteDuration * 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.start(startTime);
                oscillator.stop(startTime + noteDuration);

                // 归还节点到池
                if (this.nodePool) {
                    Laya.timer.once((totalDuration + 100) * 1000, this, () => {
                        this.nodePool.releaseOscillator(oscillator);
                        this.nodePool.releaseGain(gainNode);
                    });
                }
            });
        } catch (e) {
            console.warn("Failed to play melody", e);
        }
    }

    /**
     * 清理音频资源
     */
    public static cleanup(): void {
        if (this.nodePool) {
            this.nodePool.clear();
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}
