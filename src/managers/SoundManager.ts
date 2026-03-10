/**
 * 音效管理器 - Focus Planet
 * 使用 Web Audio API 生成合成音效
 */

export class SoundManager {
    private static audioContext: AudioContext = null;
    private static enabled: boolean = true;
    private static volume: number = 0.5; // 音量 0-1

    /**
     * 初始化音频上下文（需要在用户交互后调用）
     */
    public static init(): void {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
        this.playTone(800, 0.1, 0.3 * this.volume, "sine");
    }

    /**
     * 播放点击错误音 - 低沉的"嘟"声
     */
    public static playWrong(): void {
        if (!this.enabled) return;
        this.playTone(200, 0.15, 0.3 * this.volume, "square");
    }

    /**
     * 播放完成游戏音 - 欢快的上升音阶
     */
    public static playComplete(): void {
        if (!this.enabled) return;
        this.playMelody([523, 659, 784, 1047], 0.12, 0.4 * this.volume);
    }

    /**
     * 播放按钮点击音 - 轻微的点击声
     */
    public static playClick(): void {
        if (!this.enabled) return;
        this.playTone(600, 0.05, 0.15 * this.volume, "sine");
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

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.warn("Failed to play tone", e);
        }
    }

    /**
     * 播放旋律（多个音符连续播放）
     */
    private static playMelody(frequencies: number[], noteDuration: number, volume: number): void {
        if (!this.audioContext) {
            this.init();
        }
        if (!this.audioContext) return;

        try {
            if (this.audioContext.state === "suspended") {
                this.audioContext.resume();
            }

            frequencies.forEach((freq, index) => {
                const startTime = this.audioContext.currentTime + index * noteDuration;

                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(freq, startTime);

                gainNode.gain.setValueAtTime(volume, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.start(startTime);
                oscillator.stop(startTime + noteDuration);
            });
        } catch (e) {
            console.warn("Failed to play melody", e);
        }
    }
}