import { VoiceProvider, VoiceProviderOptions } from './types';

const isBrowserSpeechSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
};

export class BrowserSpeechSynthesisProvider implements VoiceProvider {
  private rate: number = 1.0;
  private volume: number = 1.0;
  private lang: string = 'en-US';
  private abortRequested = false;

  public isSupported(): boolean {
    return isBrowserSpeechSupported();
  }

  public async speak(text: string, options: VoiceProviderOptions = {}): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Browser speech synthesis is not supported in this environment.');
    }

    this.abortRequested = false;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? this.rate;
    utterance.volume = options.volume ?? this.volume;
    utterance.lang = options.lang ?? this.lang;
    if (options.voiceName) {
      const voice = window.speechSynthesis.getVoices().find((candidate) => candidate.name === options.voiceName);
      if (voice) {
        utterance.voice = voice;
      }
    }

    return new Promise<void>((resolve, reject) => {
      utterance.onend = () => {
        if (this.abortRequested) {
          return reject(new Error('Speech cancelled.'));
        }
        resolve();
      };
      utterance.onerror = (event) => {
        reject(new Error(event.error || 'Speech synthesis error')); 
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  }

  public pause(): void {
    if (!this.isSupported()) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
    }
  }

  public resume(): void {
    if (!this.isSupported()) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  public stop(): void {
    if (!this.isSupported()) return;
    this.abortRequested = true;
    window.speechSynthesis.cancel();
  }

  public setRate(rate: number): void {
    this.rate = rate;
  }

  public setVolume(volume: number): void {
    this.volume = volume;
  }
}

export class NoopVoiceProvider implements VoiceProvider {
  public isSupported(): boolean {
    return false;
  }
  public async speak(): Promise<void> {}
  public pause(): void {}
  public resume(): void {}
  public stop(): void {}
  public setRate(): void {}
  public setVolume(): void {}
}
