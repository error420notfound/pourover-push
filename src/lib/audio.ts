export type AudioCue = 'start' | 'pour' | 'complete';

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
      cue === 'complete' ? [523.25, 659.25, 783.99] : cue === 'pour' ? [880, 1174.66] : [440, 659.25];

    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = cue === 'complete' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.045);
      gain.gain.setValueAtTime(0, now + index * 0.045);
      gain.gain.linearRampToValueAtTime(0.08, now + index * 0.045 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.045 + 0.55);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + index * 0.045);
      oscillator.stop(now + index * 0.045 + 0.65);
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
