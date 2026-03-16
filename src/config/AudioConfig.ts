/**
 * 音频配置 - Focus Planet
 * 集中管理音效参数
 */

// ==================== 音效类型配置 ====================
export const SOUND_TYPE = {
    CORRECT: "sine",      // 清脆的"叮"声
    WRONG: "square",      // 低沉的"嘟"声
    CLICK: "sine",        // 轻微的点击声
    COMPLETE: "sine",     // 欢快的上升音阶
    BLIP: "triangle"      // 快速的提示音
} as const;

// ==================== 音效参数配置 ====================
export const SOUND_PARAM = {
    // 正确音效
    CORRECT: {
        FREQUENCY: 800,
        DURATION: 0.1,
        VOLUME: 0.3,
        VOLUME_PERCENT: 30
    },

    // 错误音效
    WRONG: {
        FREQUENCY: 200,
        DURATION: 0.15,
        VOLUME: 0.3,
        VOLUME_PERCENT: 30
    },

    // 点击音效
    CLICK: {
        FREQUENCY: 600,
        DURATION: 0.05,
        VOLUME: 0.15,
        VOLUME_PERCENT: 15
    },

    // 完成音效
    COMPLETE: {
        FREQUENCIES: [523, 659, 784, 1047], // C4, E4, G4, C5
        NOTE_DURATION: 0.12,
        VOLUME: 0.4,
        VOLUME_PERCENT: 40
    },

    // 蜂鸣音效
    BEEP: {
        FREQUENCY: 440,
        DURATION: 0.08,
        VOLUME: 0.2,
        VOLUME_PERCENT: 20
    }
} as const;

// ==================== 音频节点池配置 ====================
export const AUDIO_POOL_CONFIG = {
    // 池大小
    INITIAL_SIZE: 10,
    MAX_SIZE: 50,

    // 音频参数
    SAMPLE_RATE: 44100,
    BUFFER_SIZE: 4096
} as const;

// ==================== 旋律配置 ====================
export const MELODY_CONFIG = {
    // 成功旋律
    SUCCESS: {
        NOTES: [523, 659, 784, 1047], // C大调音阶
        NOTE_DURATION: 0.12,
        VOLUME: 0.4,
        GAP: 0.05
    },

    // 失败旋律
    FAILURE: {
        NOTES: [392, 349, 311, 294], // G3, F3, D#3, D3
        NOTE_DURATION: 0.15,
        VOLUME: 0.3,
        GAP: 0.08
    },

    // 等级提升旋律
    LEVEL_UP: {
        NOTES: [523, 659, 784, 1047, 1318], // C大调上行
        NOTE_DURATION: 0.1,
        VOLUME: 0.5,
        GAP: 0.03
    }
} as const;

// ==================== 音频上下文配置 ====================
export const AUDIO_CONTEXT_CONFIG = {
    // 默认音量
    DEFAULT_VOLUME: 0.5,

    // 音量范围
    VOLUME_MIN: 0,
    VOLUME_MAX: 1,

    // 自动恢复状态
    AUTO_RESUME: true
} as const;
