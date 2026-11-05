// Procedural Web Audio Bio-Acoustic & Environmental Sound Engine
// Synthesizes realistic nature soundscapes, terrain footsteps, and species-specific
// sounds for Flora, Fauna, Insects, and Bacteria with zero external audio dependencies.

import { BiomeRegion } from './biodiversity';
import { AnimalKind, WeatherKind } from './types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;

  // Continuous gentle biome & weather ambience nodes
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;
  private weatherLayerSource: AudioBufferSourceNode | null = null;
  private weatherLayerFilter: BiquadFilterNode | null = null;
  private weatherLayerGain: GainNode | null = null;
  private ambientStarted = false;
  private natureCallTimer = 3.2;
  private weatherDetailTimer = 1.8;

  constructor() {
    try {
      const saved = localStorage.getItem('ctcd_muted');
      if (saved === 'true') this.muted = true;
    } catch {
      // ignore storage errors
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem('ctcd_muted', String(this.muted));
    } catch {
      // ignore
    }
    if (this.muted && this.ctx) {
      const now = this.ctx.currentTime;
      if (this.ambientGain) {
        this.ambientGain.gain.setTargetAtTime(0, now, 0.08);
      }
      if (this.rainGain) {
        this.rainGain.gain.setTargetAtTime(0, now, 0.08);
      }
      if (this.weatherLayerGain) {
        this.weatherLayerGain.gain.setTargetAtTime(0, now, 0.08);
      }
    } else if (!this.muted) {
      this.unlock();
      this.playUiClick();
    }
    return this.muted;
  }

  public unlock(): void {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && !this.noiseBuffer) {
      this.buildPinkNoiseBuffer(this.ctx);
    }
  }

  private buildPinkNoiseBuffer(ctx: AudioContext): void {
    const length = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const out = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    this.noiseBuffer = buffer;
  }

  private ensureCtx(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return null;
    if (!this.noiseBuffer) this.buildPinkNoiseBuffer(this.ctx);
    return this.ctx;
  }

  private initContinuousAmbience(ctx: AudioContext): void {
    if (this.ambientStarted || !this.noiseBuffer) return;
    this.ambientStarted = true;

    // 1. Biome Wind / Ocean Surf / River Stream continuous bed
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 340;
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();

    this.ambientSource = src;
    this.ambientFilter = filter;
    this.ambientGain = gain;

    // 2. Rain Patter continuous bed
    const rSrc = ctx.createBufferSource();
    rSrc.buffer = this.noiseBuffer;
    rSrc.loop = true;
    rSrc.playbackRate.value = 1.35;

    const rFilter = ctx.createBiquadFilter();
    rFilter.type = 'bandpass';
    rFilter.frequency.value = 1650;
    rFilter.Q.value = 0.75;

    const rGain = ctx.createGain();
    rGain.gain.value = 0;

    rSrc.connect(rFilter);
    rFilter.connect(rGain);
    rGain.connect(ctx.destination);
    rSrc.start();

    this.rainSource = rSrc;
    this.rainFilter = rFilter;
    this.rainGain = rGain;

    // 3. Secondary Weather Texture Bed (Snow flurry shimmer, Fog hollow drone, Sandstorm hiss, Gale whistle)
    const wSrc = ctx.createBufferSource();
    wSrc.buffer = this.noiseBuffer;
    wSrc.loop = true;
    wSrc.playbackRate.value = 0.92;

    const wFilter = ctx.createBiquadFilter();
    wFilter.type = 'bandpass';
    wFilter.frequency.value = 900;
    wFilter.Q.value = 2.0;

    const wGain = ctx.createGain();
    wGain.gain.value = 0;

    wSrc.connect(wFilter);
    wFilter.connect(wGain);
    wGain.connect(ctx.destination);
    wSrc.start();

    this.weatherLayerSource = wSrc;
    this.weatherLayerFilter = wFilter;
    this.weatherLayerGain = wGain;
  }

  // Updates continuous biome soundscape + dynamic weather acoustics + wildlife calls
  public updateBiomeAmbience(
    biome: BiomeRegion,
    weather: WeatherKind,
    weatherIntensity: number,
    isNight: boolean,
    active: boolean,
    dt: number
  ): void {
    if (this.muted || !active) {
      if (this.ctx && this.ambientStarted) {
        const now = this.ctx.currentTime;
        this.ambientGain?.gain.setTargetAtTime(0, now, 0.15);
        this.rainGain?.gain.setTargetAtTime(0, now, 0.15);
        this.weatherLayerGain?.gain.setTargetAtTime(0, now, 0.15);
      }
      return;
    }

    const ctx = this.ensureCtx();
    if (!ctx) return;
    this.initContinuousAmbience(ctx);

    const now = ctx.currentTime;
    const waveMod = Math.sin(now * 0.85) * 0.5 + 0.5;
    const gustMod = Math.sin(now * 1.45) * 0.5 + 0.5;
    const wInt = Math.max(0, Math.min(1, weatherIntensity));

    let targetFreq = 320;
    let targetQ = 1.2;
    let targetGain = 0.026;

    switch (biome) {
      case BiomeRegion.OCEAN:
      case BiomeRegion.COAST:
        targetFreq = 220 + waveMod * 260;
        targetQ = 0.85;
        targetGain = 0.032 + waveMod * 0.024;
        break;
      case BiomeRegion.RIVER:
      case BiomeRegion.RIVERBANK:
        targetFreq = 580 + Math.sin(now * 2.4) * 95;
        targetQ = 1.4;
        targetGain = 0.028;
        break;
      case BiomeRegion.FOREST:
        targetFreq = 420 + waveMod * 120;
        targetQ = 1.6;
        targetGain = 0.024;
        break;
      case BiomeRegion.DESERT:
        targetFreq = 510 + waveMod * 180;
        targetQ = 2.4;
        targetGain = 0.018;
        break;
      case BiomeRegion.MOUNTAIN:
      case BiomeRegion.SNOW_PEAK:
        targetFreq = 680 + Math.sin(now * 1.1) * 190;
        targetQ = 3.2;
        targetGain = 0.022;
        break;
      default:
        targetFreq = 350 + waveMod * 90;
        targetQ = 1.3;
        targetGain = 0.018;
        break;
    }

    // Weather-driven acoustic transformation of the environment!
    let rainVol = 0;
    let rainFreq = 1550;
    let layerVol = 0;
    let layerFreq = 900;
    let layerQ = 2.0;

    if (wInt > 0.03 && weather !== WeatherKind.CLEAR) {
      switch (weather) {
        case WeatherKind.RAIN:
          // Crisp high-frequency raindrop patter + low canopy downpour rumble
          rainVol = 0.056 * wInt;
          rainFreq = 1480 + wInt * 520 + gustMod * 140;
          layerFreq = 360 + waveMod * 90;
          layerQ = 0.9;
          layerVol = 0.03 * wInt;
          targetFreq *= 0.86;
          targetGain += 0.01 * wInt;
          break;

        case WeatherKind.SNOW:
          // Fresh snowfall dampens ambient high frequencies (hushed winter blanket) + soft crystalline air shimmer
          targetFreq *= 1 - 0.36 * wInt;
          targetGain *= 1 - 0.25 * wInt;
          layerFreq = 2650 + gustMod * 420;
          layerQ = 2.8;
          layerVol = 0.015 * wInt;
          break;

        case WeatherKind.BLIZZARD:
          // Howling subzero alpine gale + whipping ice-pellet hiss
          targetFreq = 540 + gustMod * 410;
          targetQ = 3.5;
          targetGain += 0.042 * wInt;
          layerFreq = 2150 + waveMod * 480;
          layerQ = 1.45;
          layerVol = 0.028 * wInt;
          break;

        case WeatherKind.FOG:
          // Thick damp fog muffles high frequencies into a low hollow resonance
          targetFreq = Math.min(targetFreq, 240 + waveMod * 55);
          targetQ = 2.1;
          targetGain *= 0.78;
          layerFreq = 275 + Math.sin(now * 0.55) * 45;
          layerQ = 4.2;
          layerVol = 0.024 * wInt;
          break;

        case WeatherKind.SANDSTORM:
          // Roaring desert wind + dry abrasive airborne sand hiss
          targetFreq = 460 + gustMod * 260;
          targetQ = 2.2;
          targetGain += 0.036 * wInt;
          layerFreq = 2480 + gustMod * 520;
          layerQ = 1.85;
          layerVol = 0.03 * wInt;
          break;

        case WeatherKind.WINDY:
          // Gusting monsoon breeze rustling through grass and canopy
          targetFreq += gustMod * 180 * wInt;
          targetGain += 0.018 * wInt;
          layerFreq = 1020 + gustMod * 360;
          layerQ = 1.7;
          layerVol = 0.018 * wInt;
          break;
      }
    }

    if (this.ambientFilter && this.ambientGain) {
      this.ambientFilter.frequency.setTargetAtTime(Math.max(120, targetFreq), now, 0.25);
      this.ambientFilter.Q.setTargetAtTime(targetQ, now, 0.25);
      this.ambientGain.gain.setTargetAtTime(targetGain, now, 0.25);
    }

    if (this.rainGain && this.rainFilter) {
      this.rainGain.gain.setTargetAtTime(rainVol, now, 0.25);
      this.rainFilter.frequency.setTargetAtTime(rainFreq, now, 0.25);
    }

    if (this.weatherLayerGain && this.weatherLayerFilter) {
      this.weatherLayerGain.gain.setTargetAtTime(layerVol, now, 0.28);
      this.weatherLayerFilter.frequency.setTargetAtTime(layerFreq, now, 0.28);
      this.weatherLayerFilter.Q.setTargetAtTime(layerQ, now, 0.28);
    }

    // Periodic discrete weather micro-details (raindrop plinks, fog mist drips, snow crystal chimes)
    if (wInt > 0.35 && weather !== WeatherKind.CLEAR) {
      this.weatherDetailTimer -= dt;
      if (this.weatherDetailTimer <= 0) {
        if (weather === WeatherKind.RAIN) {
          this.weatherDetailTimer = 0.55 + Math.random() * 0.9;
          this.playRaindropPlink(0.45 * wInt);
        } else if (weather === WeatherKind.FOG) {
          this.weatherDetailTimer = 2.6 + Math.random() * 2.8;
          this.playFogMistEcho(0.48 * wInt);
        } else if (weather === WeatherKind.SNOW) {
          this.weatherDetailTimer = 2.4 + Math.random() * 2.6;
          this.playSnowCrystalChime(0.4 * wInt);
        } else {
          this.weatherDetailTimer = 2.0;
        }
      }
    }

    // Periodic organic nature calls (muffled/sheltered during heavy storms!)
    this.natureCallTimer -= dt;
    if (this.natureCallTimer <= 0) {
      const stormShelter =
        (weather === WeatherKind.BLIZZARD || weather === WeatherKind.SANDSTORM) && wInt > 0.45;
      this.natureCallTimer = stormShelter ? 7.5 + Math.random() * 5 : 4.2 + Math.random() * 5.2;
      if (!stormShelter) {
        this.playAmbientBiomeDetail(biome, isNight, weather, wInt);
      }
    }
  }

  private playRaindropPlink(vol: number): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const base = 920 + Math.random() * 680;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.48, now + 0.045);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.036 * vol, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.055);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  private playFogMistEcho(vol: number): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Damp condensation droplet + hollow low mist resonance
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540 + Math.random() * 160, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.07);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.032 * vol, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  private playSnowCrystalChime(vol: number): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freq = [1760, 2093, 2349, 2637][Math.floor(Math.random() * 4)];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.022 * vol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0007, now + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playWeatherTransition(weather: WeatherKind): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    switch (weather) {
      case WeatherKind.RAIN:
        this.playRaindropPlink(0.95);
        setTimeout(() => this.playRaindropPlink(0.8), 90);
        break;
      case WeatherKind.SNOW:
        this.playSnowCrystalChime(0.95);
        setTimeout(() => this.playSnowCrystalChime(0.85), 110);
        break;
      case WeatherKind.BLIZZARD:
        this.playWindGust(true);
        break;
      case WeatherKind.SANDSTORM:
      case WeatherKind.WINDY:
        this.playWindGust(false);
        break;
      case WeatherKind.FOG:
        this.playFogMistEcho(0.95);
        break;
      case WeatherKind.CLEAR:
      default:
        this.playBirdSong(1.0);
        break;
    }
  }

  private playAmbientBiomeDetail(
    biome: BiomeRegion,
    isNight: boolean,
    weather: WeatherKind = WeatherKind.CLEAR,
    weatherIntensity = 0
  ): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;

    // During heavy rain, frogs call across wet forests & riverbanks while songbirds shelter
    if (weather === WeatherKind.RAIN && weatherIntensity > 0.4) {
      if (biome !== BiomeRegion.DESERT && biome !== BiomeRegion.SNOW_PEAK) {
        this.playFrogCroak(0.46);
      }
      return;
    }

    // Thick fog muffles bright daytime birds into quiet distant mist calls
    const dampMult = weather === WeatherKind.FOG && weatherIntensity > 0.4 ? 0.55 : 1;

    if (isNight) {
      const roll = Math.random();
      if ((biome === BiomeRegion.FOREST || biome === BiomeRegion.MOUNTAIN) && roll < 0.45) {
        this.playNightOwlHoot(0.45 * dampMult);
      } else if (biome === BiomeRegion.SAVANNA && roll < 0.35) {
        this.playAnimalCall(AnimalKind.PRAIRIE_WOLF, 0.36 * dampMult);
      } else if ((biome === BiomeRegion.RIVER || biome === BiomeRegion.RIVERBANK) && roll < 0.45) {
        this.playFrogCroak(0.42 * dampMult);
      } else if (weather !== WeatherKind.SNOW) {
        this.playInsectSound('water_firefly', 0.42 * dampMult);
      }
      return;
    }

    if (weather === WeatherKind.SNOW && weatherIntensity > 0.45) {
      this.playSnowCrystalChime(0.42);
      return;
    }

    switch (biome) {
      case BiomeRegion.FOREST:
      case BiomeRegion.SAVANNA:
      case BiomeRegion.SANCTUARY:
        this.playBirdSong(biome === BiomeRegion.FOREST ? 1.15 : 0.95);
        break;
      case BiomeRegion.OCEAN:
      case BiomeRegion.COAST:
        this.playSeagullCall(0.48 * dampMult);
        break;
      case BiomeRegion.RIVER:
      case BiomeRegion.RIVERBANK:
        if (Math.random() < 0.55) {
          this.playFloraSound('sacred_lotus', 0.55 * dampMult);
        } else {
          this.playFrogCroak(0.45 * dampMult);
        }
        break;
      case BiomeRegion.SNOW_PEAK:
      case BiomeRegion.MOUNTAIN:
        this.playFloraSound('edelweiss_herb', 0.42 * dampMult);
        break;
      default:
        break;
    }
  }

  private playNightOwlHoot(vol: number): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Hollow nocturnal owl hoot ("hoo... hoo-hoo")
    [
      [0, 0.24, 395, 360],
      [0.34, 0.14, 405, 385],
      [0.54, 0.28, 375, 330],
    ].forEach(([offset, dur, fStart, fEnd]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + offset;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(fStart, t);
      osc.frequency.exponentialRampToValueAtTime(fEnd, t + dur);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.055 * vol, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    });
  }

  public playDayPhaseTransition(isDawn: boolean): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    if (isDawn) {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.07;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.04, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.58);
      });
      this.playBirdSong(1.05);
    } else {
      this.playNightOwlHoot(0.65);
    }
  }

  private playBirdSong(pitchMult: number): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [1680, 2120, 1890, 2480];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.085;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f * pitchMult, t);
      osc.frequency.exponentialRampToValueAtTime(f * pitchMult * 1.16, t + 0.065);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.036, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.075);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    });
  }

  private playSeagullCall(vol: number): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [0, 0.24].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      const t = now + offset;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(i === 0 ? 1180 : 1060, t);
      osc.frequency.exponentialRampToValueAtTime(690, t + 0.19);
      filter.type = 'bandpass';
      filter.frequency.value = 1450;
      filter.Q.value = 2.8;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.045 * vol, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.2);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.21);
    });
  }

  private playFrogCroak(vol: number): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [0, 0.14].forEach((offset) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      const t = now + offset;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(145, t);
      osc.frequency.linearRampToValueAtTime(195, t + 0.09);
      filter.type = 'bandpass';
      filter.frequency.value = 520;
      filter.Q.value = 4.2;
      gain.gain.setValueAtTime(0.055 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.11);
    });
  }

  // =========================================================================
  // TERRAIN-AWARE FOOTSTEPS
  // =========================================================================

  public playFootstep(
    biome: BiomeRegion,
    weather: WeatherKind = WeatherKind.CLEAR,
    weatherIntensity = 0
  ): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    if (biome === BiomeRegion.RIVER || biome === BiomeRegion.OCEAN) {
      // Water wade splash
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(750, now);
      filter.frequency.exponentialRampToValueAtTime(1450, now + 0.09);
      filter.Q.value = 1.8;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now, Math.random() * 1.5, 0.11);
      return;
    }

    // Weather-modified terrestrial footsteps: wet puddle splash in Rain, fresh snow crunch in Snow/Blizzard!
    const isSnowCovered =
      biome === BiomeRegion.SNOW_PEAK ||
      ((weather === WeatherKind.SNOW || weather === WeatherKind.BLIZZARD) && weatherIntensity > 0.3);
    const isRainSoaked = weather === WeatherKind.RAIN && weatherIntensity > 0.32;
    const fogMuffle = weather === WeatherKind.FOG && weatherIntensity > 0.35 ? 0.78 : 1;

    if (isRainSoaked) {
      // Wet mud / puddle splash transient layered on step
      const splashSrc = ctx.createBufferSource();
      splashSrc.buffer = this.noiseBuffer;
      const splashFilter = ctx.createBiquadFilter();
      splashFilter.type = 'bandpass';
      splashFilter.frequency.setValueAtTime(920, now);
      splashFilter.frequency.exponentialRampToValueAtTime(1760, now + 0.075);
      splashFilter.Q.value = 2.1;
      const splashGain = ctx.createGain();
      splashGain.gain.setValueAtTime(0.048 * weatherIntensity, now);
      splashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
      splashSrc.connect(splashFilter);
      splashFilter.connect(splashGain);
      splashGain.connect(ctx.destination);
      splashSrc.start(now, Math.random() * 1.5, 0.09);
    }

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (isSnowCovered) {
      // Crisp fresh snow crunch
      filter.type = 'bandpass';
      filter.frequency.value = 1920 + Math.random() * 280;
      filter.Q.value = 1.45;
      gain.gain.setValueAtTime(0.058 * fogMuffle, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    } else if (biome === BiomeRegion.DESERT || biome === BiomeRegion.COAST) {
      // Soft sand step
      filter.type = 'bandpass';
      filter.frequency.value = (1150 + Math.random() * 180) * fogMuffle;
      filter.Q.value = 1.2;
      gain.gain.setValueAtTime(0.042 * fogMuffle, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    } else if (biome === BiomeRegion.MOUNTAIN || biome === BiomeRegion.SANCTUARY) {
      // Stone tap
      const osc = ctx.createOscillator();
      const oGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190 + Math.random() * 35, now);
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.045);
      oGain.gain.setValueAtTime(0.05, now);
      oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(oGain);
      oGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
      return;
    } else {
      // Grass / forest leaf rustle step
      filter.type = 'bandpass';
      filter.frequency.value = 920 + Math.random() * 220;
      filter.Q.value = 1.6;
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    }

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now, Math.random() * 1.5, 0.08);
  }

  public playUiClick(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.045);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  // =========================================================================
  // UNIFIED SPECIES SOUND ROUTER (ALL 36 SPECIES ACROSS 4 KINGDOMS)
  // =========================================================================

  public playSpeciesSound(speciesId: string, volumeScale: number = 1): void {
    const v = Math.max(0.12, Math.min(1.2, volumeScale));
    switch (speciesId) {
      // --- FAUNA ---
      case 'sea_turtle':
        this.playAnimalCall(AnimalKind.SEA_TURTLE, v);
        break;
      case 'reef_crab':
        this.playAnimalCall(AnimalKind.REEF_CRAB, v);
        break;
      case 'river_croc':
        this.playAnimalCall(AnimalKind.RIVER_CROC, v);
        break;
      case 'river_otter':
        this.playAnimalCall(AnimalKind.RIVER_OTTER, v);
        break;
      case 'spotted_deer':
        this.playAnimalCall(AnimalKind.SPOTTED_DEER, v);
        break;
      case 'prairie_wolf':
        this.playAnimalCall(AnimalKind.PRAIRIE_WOLF, v);
        break;
      case 'wild_boar':
        this.playAnimalCall(AnimalKind.WILD_BOAR, v);
        break;
      case 'jungle_jaguar':
        this.playAnimalCall(AnimalKind.JUNGLE_JAGUAR, v);
        break;
      case 'desert_camel':
        this.playAnimalCall(AnimalKind.DESERT_CAMEL, v);
        break;
      case 'emperor_scorpion':
        this.playAnimalCall(AnimalKind.EMPEROR_SCORPION, v);
        break;
      case 'alpine_ibex':
        this.playAnimalCall(AnimalKind.ALPINE_IBEX, v);
        break;
      case 'mountain_bear':
        this.playAnimalCall(AnimalKind.MOUNTAIN_BEAR, v);
        break;

      // --- INSECTS ---
      case 'golden_honeybee':
      case 'emperor_dragonfly':
      case 'coastal_skimmer':
      case 'water_firefly':
      case 'monarch_butterfly':
      case 'morpho_butterfly':
      case 'apollo_butterfly':
      case 'hercules_beetle':
      case 'sacred_scarab':
      case 'tiger_beetle':
        this.playInsectSound(speciesId, v);
        break;

      // --- FLORA ---
      case 'palm_coconut':
      case 'giant_kelp':
      case 'weeping_willow':
      case 'sacred_lotus':
      case 'ancient_oak':
      case 'wild_berry':
      case 'rainforest_banyan':
      case 'glow_mushroom':
      case 'saguaro_cactus':
      case 'alpine_pine':
      case 'edelweiss_herb':
        this.playFloraSound(speciesId, v);
        break;

      // --- BACTERIA ---
      default:
        this.playBacteriaSound(speciesId, v);
        break;
    }
  }

  // 1. ANIMAL VOCALIZATIONS (ĐỘNG VẬT)
  public playAnimalCall(kind: AnimalKind, vol: number = 1): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const v = Math.max(0.1, Math.min(1.2, vol));

    switch (kind) {
      case AnimalKind.PRAIRIE_WOLF: {
        // Expressive rising & falling wolf howl
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(290, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.24);
        osc.frequency.setValueAtTime(535, now + 0.42);
        osc.frequency.exponentialRampToValueAtTime(340, now + 0.78);
        filter.type = 'lowpass';
        filter.frequency.value = 1100;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.16 * v, now + 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.82);
        break;
      }

      case AnimalKind.JUNGLE_JAGUAR:
      case AnimalKind.MOUNTAIN_BEAR: {
        // Deep resonant feline roar / grizzly growl
        const isBear = kind === AnimalKind.MOUNTAIN_BEAR;
        const osc = ctx.createOscillator();
        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(isBear ? 92 : 128, now);
        osc.frequency.exponentialRampToValueAtTime(isBear ? 54 : 68, now + 0.42);

        mod.type = 'sine';
        mod.frequency.value = isBear ? 26 : 38;
        modGain.gain.value = 22;
        mod.connect(modGain);
        modGain.connect(osc.frequency);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isBear ? 460 : 680, now);
        filter.frequency.exponentialRampToValueAtTime(210, now + 0.42);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.2 * v, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        mod.start(now);
        osc.stop(now + 0.45);
        mod.stop(now + 0.45);
        break;
      }

      case AnimalKind.RIVER_CROC: {
        // Deep bellow + crisp jaw snap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(78, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.3);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 280;
        gain.gain.setValueAtTime(0.18 * v, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.33);

        // Jaw snap click
        const snap = ctx.createOscillator();
        const sGain = ctx.createGain();
        snap.type = 'triangle';
        snap.frequency.setValueAtTime(420, now + 0.18);
        snap.frequency.exponentialRampToValueAtTime(95, now + 0.24);
        sGain.gain.setValueAtTime(0.16 * v, now + 0.18);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        snap.connect(sGain);
        sGain.connect(ctx.destination);
        snap.start(now + 0.18);
        snap.stop(now + 0.26);
        break;
      }

      case AnimalKind.WILD_BOAR: {
        // Double snort grunt
        [0, 0.14].forEach((off) => {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();
          const t = now + off;
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(115, t);
          osc.frequency.exponentialRampToValueAtTime(72, t + 0.11);
          filter.type = 'bandpass';
          filter.frequency.value = 320;
          filter.Q.value = 2.2;
          gain.gain.setValueAtTime(0.17 * v, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.13);
        });
        break;
      }

      case AnimalKind.RIVER_OTTER: {
        // Playful 3-note chirp squeak
        [1150, 1480, 1320].forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.075;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, t);
          osc.frequency.exponentialRampToValueAtTime(f * 1.22, t + 0.055);
          gain.gain.setValueAtTime(0.11 * v, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.07);
        });
        break;
      }

      case AnimalKind.SPOTTED_DEER:
      case AnimalKind.ALPINE_IBEX: {
        // Gentle woodland/alpine bleat with subtle vibrato
        const isIbex = kind === AnimalKind.ALPINE_IBEX;
        const osc = ctx.createOscillator();
        const vibrato = ctx.createOscillator();
        const vibGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(isIbex ? 390 : 480, now);
        osc.frequency.exponentialRampToValueAtTime(isIbex ? 310 : 410, now + 0.28);

        vibrato.frequency.value = 24;
        vibGain.gain.value = 14;
        vibrato.connect(vibGain);
        vibGain.connect(osc.frequency);

        filter.type = 'bandpass';
        filter.frequency.value = isIbex ? 920 : 1150;
        filter.Q.value = 2.4;

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.13 * v, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        vibrato.start(now);
        osc.stop(now + 0.31);
        vibrato.stop(now + 0.31);
        break;
      }

      case AnimalKind.DESERT_CAMEL: {
        // Low resonant desert vocalization
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(165, now);
        osc.frequency.linearRampToValueAtTime(215, now + 0.16);
        osc.frequency.exponentialRampToValueAtTime(125, now + 0.42);
        filter.type = 'bandpass';
        filter.frequency.value = 480;
        filter.Q.value = 2.6;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.15 * v, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }

      case AnimalKind.REEF_CRAB: {
        // Rapid chitinous claw clicks
        [0, 0.065, 0.14].forEach((off, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + off;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(980 + idx * 140, t);
          osc.frequency.exponentialRampToValueAtTime(320, t + 0.035);
          gain.gain.setValueAtTime(0.13 * v, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.045);
        });
        break;
      }

      case AnimalKind.EMPEROR_SCORPION: {
        // Dry desert hiss + stinger rattle
        if (this.noiseBuffer) {
          const src = ctx.createBufferSource();
          src.buffer = this.noiseBuffer;
          const filter = ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.value = 2800;
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.11 * v, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
          src.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          src.start(now, 0.2, 0.25);
        }
        break;
      }

      case AnimalKind.SEA_TURTLE: {
        // Gentle sea breath + water ripple plop
        this.playFloraSound('sacred_lotus', v * 0.9);
        if (this.noiseBuffer) {
          const src = ctx.createBufferSource();
          src.buffer = this.noiseBuffer;
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(520, now);
          filter.frequency.exponentialRampToValueAtTime(920, now + 0.22);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.08 * v, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
          src.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          src.start(now, 0.5, 0.25);
        }
        break;
      }

      default:
        this.playBossSlam();
        break;
    }
  }

  // 2. INSECT BIO-ACOUSTICS (CÔN TRÙNG)
  public playInsectSound(speciesId: string, vol: number = 1): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const v = Math.max(0.1, Math.min(1.2, vol));

    if (speciesId === 'golden_honeybee') {
      // Warm 195Hz FM-modulated honeybee buzz
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(196, now);
      osc.frequency.linearRampToValueAtTime(214, now + 0.16);
      osc.frequency.linearRampToValueAtTime(188, now + 0.34);

      lfo.frequency.value = 32;
      lfoGain.gain.value = 12;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      filter.type = 'bandpass';
      filter.frequency.value = 720;
      filter.Q.value = 2.1;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.095 * v, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      lfo.start(now);
      osc.stop(now + 0.37);
      lfo.stop(now + 0.37);
      return;
    }

    if (speciesId === 'water_firefly') {
      // Crystalline firefly & night-cricket trill
      [0, 0.045, 0.09, 0.135].forEach((off, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + off;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(3850 + (idx % 2) * 240, t);
        gain.gain.setValueAtTime(0.055 * v, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.038);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.04);
      });
      return;
    }

    if (speciesId === 'emperor_dragonfly' || speciesId === 'coastal_skimmer') {
      // Crisp 4-wing papery flutter whir
      if (!this.noiseBuffer) return;
      [0, 0.05, 0.1, 0.15].forEach((off) => {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2200;
        filter.Q.value = 2.5;
        const gain = ctx.createGain();
        const t = now + off;
        gain.gain.setValueAtTime(0.075 * v, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.042);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(t, Math.random(), 0.045);
      });
      return;
    }

    if (
      speciesId === 'monarch_butterfly' ||
      speciesId === 'morpho_butterfly' ||
      speciesId === 'apollo_butterfly'
    ) {
      // Silky butterfly wing flutter + delicate harmonic sparkle
      [587.33, 880, 1174.66].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.055;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.055 * v, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.19);
      });
      return;
    }

    // Beetles (Hercules, Scarab, Tiger Beetle): Chitinous click + low elytra buzz
    const click = ctx.createOscillator();
    const cGain = ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(840, now);
    click.frequency.exponentialRampToValueAtTime(190, now + 0.05);
    cGain.gain.setValueAtTime(0.12 * v, now);
    cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    click.connect(cGain);
    cGain.connect(ctx.destination);
    click.start(now);
    click.stop(now + 0.06);

    const buzz = ctx.createOscillator();
    const bGain = ctx.createGain();
    buzz.type = 'sawtooth';
    buzz.frequency.setValueAtTime(132, now + 0.04);
    bGain.gain.setValueAtTime(0.055 * v, now + 0.04);
    bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    const bFilter = ctx.createBiquadFilter();
    bFilter.type = 'lowpass';
    bFilter.frequency.value = 480;
    buzz.connect(bFilter);
    bFilter.connect(bGain);
    bGain.connect(ctx.destination);
    buzz.start(now + 0.04);
    buzz.stop(now + 0.21);
  }

  // 3. BOTANICAL / FLORA SOUNDS (THỰC VẬT)
  public playFloraSound(speciesId: string, vol: number = 1): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const v = Math.max(0.1, Math.min(1.2, vol));

    if (speciesId === 'sacred_lotus' || speciesId === 'giant_kelp') {
      // Pure water droplet plop on lotus leaf / coral reef bubble
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(1120, now + 0.085);
      gain.gain.setValueAtTime(0.11 * v, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
      return;
    }

    if (speciesId === 'glow_mushroom' || speciesId === 'edelweiss_herb') {
      // Bioluminescent spore / crystalline alpine harmonic shimmer
      const freqs = speciesId === 'glow_mushroom' ? [523.25, 783.99, 1046.5] : [659.25, 987.77, 1318.5];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.06;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.065 * v, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      });
      return;
    }

    // Trees, Willows, Palms, Pines, Cacti, Berry Bush: Lush leaf canopy rustle + wood resonance
    if (this.noiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(980, now);
      filter.frequency.linearRampToValueAtTime(1650, now + 0.16);
      filter.frequency.linearRampToValueAtTime(860, now + 0.34);
      filter.Q.value = 1.6;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.095 * v, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now, Math.random(), 0.38);
    }
  }

  // 4. BACTERIA & MICROSCOPE SOUNDS (VI KHUẨN & KÍNH HIỂN VI 400X)
  public playMicroscopeToggle(active: boolean): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Precision optical turret click + harmonic zoom sweep
    const click = ctx.createOscillator();
    const cGain = ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(active ? 920 : 680, now);
    click.frequency.exponentialRampToValueAtTime(active ? 1480 : 420, now + 0.08);
    cGain.gain.setValueAtTime(0.11, now);
    cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    click.connect(cGain);
    cGain.connect(ctx.destination);
    click.start(now);
    click.stop(now + 0.1);
  }

  public playMicrobeScan(foundNew: boolean): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Micro-bubble cascade + bioluminescent sonar chord
    [0, 0.05, 0.1, 0.16].forEach((off, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + off;
      osc.type = 'sine';
      const base = (foundNew ? 520 : 420) + idx * 145;
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 1.45, t + 0.075);
      gain.gain.setValueAtTime(0.085, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    });
  }

  public playBacteriaSound(speciesId: string, vol: number = 1): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const v = Math.max(0.1, Math.min(1.2, vol));

    const pitchMap: Record<string, number[]> = {
      vibrio_fischeri: [587.33, 880, 1174.66],
      prochlorococcus: [523.25, 659.25, 1046.5],
      nitrosomonas: [440, 587.33, 783.99],
      spirulina_platensis: [392, 523.25, 659.25, 783.99],
      rhizobium_leguminosarum: [349.23, 523.25, 698.46],
      streptomyces_griseus: [493.88, 659.25, 987.77],
      deinococcus_radiodurans: [659.25, 830.61, 1318.5],
      thermus_aquaticus: [293.66, 440, 622.25, 880],
      psychrobacter_arcticus: [783.99, 1174.66, 1567.98],
    };

    const notes = pitchMap[speciesId] || [480, 720, 960];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.055;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f * 0.85, t);
      osc.frequency.exponentialRampToValueAtTime(f * 1.28, t + 0.09);
      gain.gain.setValueAtTime(0.08 * v, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  // =========================================================================
  // COMBAT, HARVESTING & WEATHER SFX
  // =========================================================================

  public playSwing(combo: number = 0): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.11);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.6);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const baseFreq = 520 + combo * 110;
    filter.frequency.setValueAtTime(baseFreq * 1.4, now);
    filter.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, now + 0.1);
    filter.Q.value = 1.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  public playWoodChop(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(195 + Math.random() * 35, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.09);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playStoneClink(isCrystal: boolean = false): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const freqs = isCrystal ? [1180, 1760] : [680, 1020];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isCrystal ? 'sine' : 'triangle';
      const pitchJitter = 0.96 + Math.random() * 0.08;
      osc.frequency.setValueAtTime(f * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(
        f * (isCrystal ? 1.05 : 0.72),
        now + (isCrystal ? 0.22 : 0.1)
      );

      gain.gain.setValueAtTime(idx === 0 ? 0.16 : 0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isCrystal ? 0.24 : 0.11));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    });
  }

  public playEnemyHit(heavy: boolean = false): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = heavy ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(heavy ? 150 : 230, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + (heavy ? 0.16 : 0.09));

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, now);

    gain.gain.setValueAtTime(heavy ? 0.24 : 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.17 : 0.1));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playPlayerHurt(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(185, now);
    osc.frequency.linearRampToValueAtTime(75, now + 0.18);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 540;

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  public playDash(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.16);

    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playPickup(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [587.33, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const start = now + i * 0.045;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.11, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.13);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.14);
    });
  }

  public playCraftOrHeal(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const chord = [440, 554.37, 659.25, 880];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.055;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  public playObeliskActivate(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const chord = [293.66, 440, 587.33, 739.99, 880];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + i * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.13, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.68);
    });
  }

  public playBossSlam(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.38);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  public playThunderRumble(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const duration = 0.85;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((i / bufferSize) * Math.PI) * Math.pow(1 - i / bufferSize, 0.7);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(145, now);
    filter.frequency.exponentialRampToValueAtTime(48, now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  public playWindGust(isCold: boolean = false): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const duration = 0.65;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const baseFreq = isCold ? 620 : 340;
    filter.frequency.setValueAtTime(baseFreq * 0.75, now);
    filter.frequency.linearRampToValueAtTime(baseFreq * 1.25, now + duration * 0.5);
    filter.frequency.linearRampToValueAtTime(baseFreq * 0.8, now + duration);
    filter.Q.value = isCold ? 3.2 : 1.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.075, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  public playSkillUnlock(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.065;
      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(freq * 2, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.11, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.42);

      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(0.035, start);
      harmGain.gain.exponentialRampToValueAtTime(0.001, start + 0.34);

      osc.connect(gain);
      harmonic.connect(harmGain);
      harmGain.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      harmonic.start(start);
      osc.stop(start + 0.45);
      harmonic.stop(start + 0.38);
    });
  }
}

export const sound = new SoundEngine();

