// Web Audio API Synthesizer for Authentic MSN Messenger Sound Effects
// Works 100% offline, zero network latency, no external mp3 files required!

let audioCtx: AudioContext | null = null;
let isSoundMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function setSoundMuted(muted: boolean) {
  isSoundMuted = muted;
}

export function getSoundMuted(): boolean {
  return isSoundMuted;
}

/**
 * Iconic MSN Message Received Sound ("du-du-lin" / pop chime)
 */
export function playMsnMessageSound() {
  if (isSoundMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    
    // Note 1: High crisp pop
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.08); // E6
    
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.16);

    // Note 2: Resolution chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1320, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.22); // A6
    
    gain2.gain.setValueAtTime(0.0, now);
    gain2.gain.setValueAtTime(0.28, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc2.start(now + 0.08);
    osc2.stop(now + 0.36);
  } catch (e) {
    console.debug('Audio error:', e);
  }
}

/**
 * Iconic MSN Nudge / Buzz Sound ("BZZZZZT-BZZZZZT")
 */
export function playMsnNudgeSound() {
  if (isSoundMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Burst 1: Low frequency buzzer
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(150, now);
    osc1.frequency.linearRampToValueAtTime(130, now + 0.15);

    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Burst 2: Second buzzer hit
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(180, now + 0.18);
    osc2.frequency.linearRampToValueAtTime(110, now + 0.4);

    gain2.gain.setValueAtTime(0.0, now);
    gain2.gain.setValueAtTime(0.4, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.46);
  } catch (e) {
    console.debug('Audio error:', e);
  }
}

/**
 * MSN Login / Contact Online Chime
 */
export function playMsnLoginSound() {
  if (isSoundMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const startTime = now + index * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.26);
    });
  } catch (e) {
    console.debug('Audio error:', e);
  }
}

/**
 * Message Sent Sound
 */
export function playMsnSendSound() {
  if (isSoundMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  } catch (e) {
    console.debug('Audio error:', e);
  }
}
