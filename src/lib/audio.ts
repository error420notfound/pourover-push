export type AudioCue = 'start' | 'pour' | 'complete' | 'tick';

let audioContext: AudioContext | null = null;

const getContext = () => {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!audioContext && AudioCtor) audioContext = new AudioCtor();
  return audioContext;
};

export const playCue = (cue: AudioCue, enabled: boolean) => {
  if (!enabled) return;
  try {
    const context = getContext();
    if (!context) return;
    if (context.state === 'suspended') void context.resume();

    const now = context.currentTime;
    const frequencies =
      cue === 'complete'
        ? [523.25, 659.25, 783.99]
        : cue === 'pour'
          ? [880, 1174.66]
          : cue === 'tick'
            ? [1046.5]
            : [440, 659.25];

    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.045;
      const duration = cue === 'tick' ? 0.16 : 0.65;
      const peak = cue === 'tick' ? 0.045 : 0.08;
      oscillator.type = cue === 'complete' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(peak, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    });
  } catch {
    // Audio is progressive enhancement and can fail when the browser blocks it.
  }
};

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
