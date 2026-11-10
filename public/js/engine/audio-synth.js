// Web Audio API Synthesizer for Piezo Buzzer
export class AudioSynth {
  constructor() {
    this.ctx = null;
    this.osc = null;
    this.gain = null;
    this.isPlaying = false;
    this.volume = 0.2;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.gain = this.ctx.createGain();
        this.gain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.gain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gain && this.isPlaying && !this.muted) {
      this.gain.gain.setValueAtTime(this.volume * 0.15, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.gain) {
      if (this.muted) {
        this.gain.gain.setValueAtTime(0, this.ctx.currentTime);
      } else if (this.isPlaying) {
        this.gain.gain.setValueAtTime(this.volume * 0.15, this.ctx.currentTime);
      }
    }
    return this.muted;
  }

  playTone(freq) {
    if (freq <= 20 || freq > 20000) {
      this.stopTone();
      return;
    }

    this.init();
    if (!this.ctx) return;

    if (!this.osc) {
      this.osc = this.ctx.createOscillator();
      this.osc.type = 'square'; // Classic piezo buzzer timbre
      this.osc.connect(this.gain);
      this.osc.start();
    }

    this.osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    if (!this.muted) {
      this.gain.gain.setValueAtTime(this.volume * 0.15, this.ctx.currentTime);
    }
    this.isPlaying = true;
  }

  stopTone() {
    if (this.gain && this.ctx) {
      this.gain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    this.isPlaying = false;
  }

  destroy() {
    this.stopTone();
    if (this.osc) {
      try { this.osc.stop(); } catch {}
      this.osc.disconnect();
      this.osc = null;
    }
  }
}
