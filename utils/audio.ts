
class AlarmSound {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private intervalId: any = null;
  public isPlaying = false;

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  play() {
    if (this.isPlaying || !this.audioContext) return;
    this.isPlaying = true;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    let beepOn = true;
    const beep = () => {
      if (!this.isPlaying || !this.audioContext) return;

      if (beepOn) {
        this.oscillator = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();

        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);

        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
        this.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);

        this.oscillator.start();
        setTimeout(() => {
          if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator = null;
          }
        }, 200);
      }
      beepOn = !beepOn;
    };

    beep();
    this.intervalId = setInterval(beep, 300);
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.oscillator) {
      try { this.oscillator.stop(); } catch {}
      this.oscillator = null;
    }
  }
}

export const alarmAudio = new AlarmSound();
