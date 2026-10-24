/* Flapbound — synthesized audio engine. No samples, no network. */
window.AudioSys = (() => {
  const A = {
    ctx: null,
    master: null,
    sfxBus: null,
    musicBus: null,
    noiseBuffer: null,
    muted: false,
    musicTimer: null,
    musicStep: 0,
    nextNote: 0,
    musicLevel: 0.14,
    musicScale: 1,
    sfxLevel: 0.9,
    intensity: 0,
    active: false,
  };

  const AC = window.AudioContext || window.webkitAudioContext;

  function makeNoise() {
    const len = Math.floor(A.ctx.sampleRate * 1.2);
    const buf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function ensure() {
    if (!AC) return false;
    if (A.ctx) {
      if (A.ctx.state === 'suspended') A.ctx.resume();
      return true;
    }
    try {
      A.ctx = new AC();
    } catch (e) {
      return false;
    }
    const ctx = A.ctx;
    A.master = ctx.createGain();
    A.master.gain.value = A.muted ? 0 : 0.9;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 18;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;

    A.sfxBus = ctx.createGain();
    A.sfxBus.gain.value = A.sfxLevel;
    A.musicBus = ctx.createGain();
    A.musicBus.gain.value = A.musicLevel * A.musicScale;

    A.sfxBus.connect(A.master);
    A.musicBus.connect(A.master);
    A.master.connect(comp);
    comp.connect(ctx.destination);

    A.noiseBuffer = makeNoise();
    A.active = true;
    startMusic();
    return true;
  }

  function setMuted(muted) {
    A.muted = !!muted;
    if (A.master && A.ctx) {
      A.master.gain.cancelScheduledValues(A.ctx.currentTime);
      A.master.gain.setTargetAtTime(A.muted ? 0 : 0.9, A.ctx.currentTime, 0.02);
    }
  }

  function setMusicLevel(level) {
    A.musicLevel = level;
    if (A.musicBus && A.ctx) {
      A.musicBus.gain.setTargetAtTime(
        level * A.musicScale,
        A.ctx.currentTime,
        0.25,
      );
    }
  }

  function setMusicVolume(volume) {
    A.musicScale = Math.max(0, Math.min(1, volume));
    if (A.musicBus && A.ctx) {
      A.musicBus.gain.setTargetAtTime(
        A.musicLevel * A.musicScale,
        A.ctx.currentTime,
        0.12,
      );
    }
  }

  function setSfxLevel(level) {
    A.sfxLevel = Math.max(0, Math.min(1, level));
    if (A.sfxBus && A.ctx) {
      A.sfxBus.gain.setTargetAtTime(A.sfxLevel, A.ctx.currentTime, 0.08);
    }
  }

  function setIntensity(value) {
    A.intensity = Math.max(0, Math.min(1, value));
  }

  // ---- primitives -------------------------------------------------------
  function tone(o) {
    if (!ensure() || A.muted) return;
    const ctx = A.ctx;
    const t0 = ctx.currentTime + (o.when || 0);
    const dur = o.dur || 0.2;
    const osc = ctx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(Math.max(20, o.freq || 440), t0);
    if (o.to) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, o.to),
        t0 + dur * (o.slide || 0.9),
      );
    }
    if (o.detune) osc.detune.value = o.detune;
    const g = ctx.createGain();
    const peak = Math.max(0.0002, o.gain == null ? 0.16 : o.gain);
    const atk = o.attack == null ? 0.006 : o.attack;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    let tail = g;
    if (o.filter) {
      const f = ctx.createBiquadFilter();
      f.type = o.filter.type || 'lowpass';
      f.frequency.setValueAtTime(o.filter.freq || 1200, t0);
      if (o.filter.to)
        f.frequency.exponentialRampToValueAtTime(
          Math.max(60, o.filter.to),
          t0 + dur,
        );
      f.Q.value = o.filter.q == null ? 0.7 : o.filter.q;
      g.connect(f);
      tail = f;
    }
    osc.connect(g);
    tail.connect(o.bus === 'music' ? A.musicBus : A.sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  function noise(o) {
    if (!ensure() || A.muted) return;
    const ctx = A.ctx;
    const t0 = ctx.currentTime + (o.when || 0);
    const dur = o.dur || 0.15;
    const src = ctx.createBufferSource();
    src.buffer = A.noiseBuffer;
    const f = ctx.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 900, t0);
    if (o.to)
      f.frequency.exponentialRampToValueAtTime(Math.max(60, o.to), t0 + dur);
    f.Q.value = o.q == null ? 0.8 : o.q;
    const g = ctx.createGain();
    const peak = o.gain == null ? 0.12 : o.gain;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + (o.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(A.sfxBus);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  // ---- game sfx ---------------------------------------------------------
  const PENTA = [
    523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51,
  ];

  function flap() {
    noise({
      dur: 0.11,
      freq: 700,
      to: 2200,
      gain: 0.11,
      type: 'bandpass',
      q: 0.9,
    });
    tone({
      freq: 330,
      to: 520,
      dur: 0.1,
      type: 'triangle',
      gain: 0.09,
      attack: 0.003,
    });
    tone({ freq: 66, to: 48, dur: 0.09, type: 'sine', gain: 0.06 });
  }

  function score(chain) {
    const i = Math.min(PENTA.length - 1, chain % PENTA.length);
    const f = PENTA[i];
    tone({
      freq: f,
      dur: 0.16,
      type: 'triangle',
      gain: 0.115,
      filter: { freq: 3200 },
    });
    tone({ freq: f * 1.5, dur: 0.22, type: 'sine', gain: 0.06, when: 0.045 });
  }

  function perfect(chain) {
    const i = Math.min(PENTA.length - 1, Math.max(0, chain));
    const f = PENTA[i] * 2;
    tone({ freq: f, dur: 0.28, type: 'sine', gain: 0.075, when: 0.01 });
    tone({
      freq: f * 1.5,
      dur: 0.34,
      type: 'triangle',
      gain: 0.05,
      when: 0.055,
    });
    noise({
      dur: 0.16,
      freq: 5200,
      to: 7200,
      gain: 0.03,
      type: 'highpass',
      q: 0.7,
      when: 0.02,
    });
  }

  function coin(chain) {
    const base = 1180 * Math.pow(1.0595, Math.min(12, chain || 0));
    tone({
      freq: base,
      to: base * 1.3,
      dur: 0.07,
      type: 'triangle',
      gain: 0.085,
    });
    tone({
      freq: base * 1.5,
      to: base * 1.9,
      dur: 0.12,
      type: 'triangle',
      gain: 0.065,
      when: 0.055,
    });
  }

  function power() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      tone({
        freq: f,
        dur: 0.32,
        type: 'triangle',
        gain: 0.075,
        when: i * 0.055,
        filter: { freq: 4200 },
      });
    });
    noise({
      dur: 0.5,
      freq: 2000,
      to: 6000,
      gain: 0.04,
      type: 'bandpass',
      q: 1.2,
      when: 0.05,
    });
  }

  function shieldUp() {
    tone({
      freq: 320,
      to: 640,
      dur: 0.35,
      type: 'sine',
      gain: 0.08,
      filter: { freq: 2400 },
    });
    tone({
      freq: 640,
      to: 960,
      dur: 0.4,
      type: 'sine',
      gain: 0.04,
      when: 0.05,
    });
  }

  function shieldBreak() {
    noise({
      dur: 0.35,
      freq: 2600,
      to: 400,
      gain: 0.16,
      type: 'bandpass',
      q: 0.6,
    });
    tone({ freq: 880, to: 220, dur: 0.32, type: 'triangle', gain: 0.1 });
    tone({
      freq: 1760,
      to: 440,
      dur: 0.25,
      type: 'sine',
      gain: 0.05,
      when: 0.01,
    });
  }

  function slowmo() {
    tone({
      freq: 840,
      to: 280,
      dur: 0.7,
      type: 'sine',
      gain: 0.09,
      filter: { freq: 1600, to: 600 },
    });
    tone({
      freq: 420,
      to: 140,
      dur: 0.9,
      type: 'triangle',
      gain: 0.05,
      when: 0.03,
    });
  }

  function magnet() {
    tone({
      freq: 220,
      to: 880,
      dur: 0.5,
      type: 'sine',
      gain: 0.065,
      filter: { freq: 3200 },
    });
    tone({
      freq: 440,
      to: 1320,
      dur: 0.44,
      type: 'triangle',
      gain: 0.04,
      when: 0.05,
    });
    noise({
      dur: 0.5,
      freq: 1200,
      to: 6200,
      gain: 0.028,
      type: 'bandpass',
      q: 1.1,
      when: 0.02,
    });
  }

  function closeCall() {
    noise({
      dur: 0.2,
      freq: 2800,
      to: 620,
      gain: 0.055,
      type: 'bandpass',
      q: 1.3,
    });
    tone({
      freq: 1240,
      to: 1720,
      dur: 0.08,
      type: 'sine',
      gain: 0.03,
      when: 0.01,
    });
  }

  function achievement() {
    [659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
      tone({
        freq: f,
        dur: 0.4,
        type: 'triangle',
        gain: 0.06,
        when: i * 0.075,
        filter: { freq: 4600 },
      });
    });
    noise({
      dur: 0.75,
      freq: 5000,
      to: 9000,
      gain: 0.022,
      type: 'highpass',
      q: 0.6,
      when: 0.06,
    });
  }

  function hit() {
    noise({
      dur: 0.3,
      freq: 1200,
      to: 160,
      gain: 0.2,
      type: 'lowpass',
      q: 0.9,
    });
    tone({ freq: 180, to: 55, dur: 0.32, type: 'sine', gain: 0.22 });
    tone({ freq: 90, to: 40, dur: 0.4, type: 'triangle', gain: 0.12 });
  }

  function die() {
    tone({
      freq: 392,
      to: 130,
      dur: 0.55,
      type: 'triangle',
      gain: 0.1,
      when: 0.12,
      filter: { freq: 1800, to: 500 },
    });
    tone({ freq: 196, to: 65, dur: 0.7, type: 'sine', gain: 0.08, when: 0.2 });
    noise({
      dur: 0.5,
      freq: 500,
      to: 120,
      gain: 0.05,
      type: 'lowpass',
      when: 0.1,
    });
  }

  function best() {
    const seq = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    seq.forEach((f, i) => {
      tone({
        freq: f,
        dur: 0.55,
        type: 'triangle',
        gain: 0.085,
        when: i * 0.09,
        filter: { freq: 4800 },
      });
      tone({
        freq: f * 0.5,
        dur: 0.6,
        type: 'sine',
        gain: 0.05,
        when: i * 0.09,
      });
    });
    noise({
      dur: 0.9,
      freq: 4000,
      to: 9000,
      gain: 0.035,
      type: 'highpass',
      q: 0.5,
      when: 0.1,
    });
  }

  function click() {
    tone({ freq: 660, to: 440, dur: 0.06, type: 'triangle', gain: 0.05 });
  }

  function select() {
    tone({ freq: 550, dur: 0.07, type: 'triangle', gain: 0.06 });
    tone({ freq: 825, dur: 0.1, type: 'triangle', gain: 0.05, when: 0.05 });
  }

  // ---- generative music -------------------------------------------------
  const CHORDS = [
    [220.0, 261.63, 329.63, 392.0], // Am7
    [174.61, 220.0, 261.63, 349.23], // Fmaj7
    [130.81, 196.0, 261.63, 329.63], // Cmaj7
    [196.0, 246.94, 293.66, 392.0], // G
  ];
  const STEP_LEN = 0.62;

  function scheduleMusic() {
    if (!A.ctx || A.muted) return;
    const now = A.ctx.currentTime;
    if (A.nextNote < now - 1) A.nextNote = now + 0.05;
    while (A.nextNote < now + 1.0) {
      const step = A.musicStep;
      const bar = Math.floor(step / 8) % CHORDS.length;
      const chord = CHORDS[bar];
      const inBar = step % 8;
      const when = Math.max(0, A.nextNote - now);

      if (inBar === 0) {
        // warm pad
        for (let i = 0; i < chord.length; i++) {
          const f = chord[i] / 2;
          tone({
            freq: f,
            dur: 4.9,
            type: i === 0 ? 'sine' : 'triangle',
            gain: i === 0 ? 0.04 : 0.014,
            attack: 0.9,
            when,
            bus: 'music',
            detune: i % 2 ? 5 : -5,
            filter: { freq: 900, q: 0.4 },
          });
        }
      }

      // soft arpeggio, skipped on some steps to breathe
      if (inBar % 2 === 0 || inBar === 3 || inBar === 7) {
        const idx = [0, 2, 1, 3, 2, 1, 3, 2][inBar % 8];
        const f = chord[idx] * 2;
        tone({
          freq: f,
          dur: 0.75,
          type: 'triangle',
          gain: 0.018,
          when,
          bus: 'music',
          filter: { freq: 2600, q: 0.5 },
        });
      }
      if (inBar === 4) {
        tone({
          freq: chord[1] * 4,
          dur: 1.1,
          type: 'sine',
          gain: 0.012,
          when,
          bus: 'music',
        });
      }

      // extra sparkle while a perfect streak is alive
      if (A.intensity > 0.45 && (inBar === 1 || inBar === 5)) {
        tone({
          freq: chord[3] * 4,
          dur: 0.2,
          type: 'sine',
          gain: 0.009 * A.intensity,
          when,
          bus: 'music',
        });
      }

      A.nextNote += STEP_LEN;
      A.musicStep++;
    }
  }

  function startMusic() {
    if (!A.ctx || A.musicTimer) return;
    A.nextNote = A.ctx.currentTime + 0.1;
    A.musicTimer = setInterval(scheduleMusic, 250);
    scheduleMusic();
  }

  function music(level) {
    setMusicLevel(level);
  }

  return {
    ensure,
    setMuted,
    setMusicLevel,
    setMusicVolume,
    setSfxLevel,
    setIntensity,
    music,
    flap,
    score,
    perfect,
    coin,
    power,
    shieldUp,
    shieldBreak,
    slowmo,
    magnet,
    closeCall,
    achievement,
    hit,
    die,
    best,
    click,
    select,
    startMusic,
  };
})();
