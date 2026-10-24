/* Flapbound — a hand-made flappy bird-style game. */ (() => {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const damp = (a, b, l, dt) => lerp(a, b, 1 - Math.exp(-l * dt));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const W = 480;
  const BASE_H = 720;
  const GROUND_H = 86;
  const PIPE_W = 78;
  const STEP = 1 / 120;
  const SAVE_KEY = 'flapbound.save.v1';
  const REDUCED =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ---------------------------------------------------------------- audio
  const Sound = window.AudioSys || {
    ensure() {},
    setMuted() {},
    setMusicLevel() {},
    setMusicVolume() {},
    setSfxLevel() {},
    setIntensity() {},
    music() {},
    flap() {},
    score() {},
    perfect() {},
    coin() {},
    power() {},
    shieldUp() {},
    shieldBreak() {},
    slowmo() {},
    magnet() {},
    closeCall() {},
    achievement() {},
    hit() {},
    die() {},
    best() {},
    click() {},
    select() {},
    startMusic() {},
  };
  // ---------------------------------------------------------------- modes
  const MODES = {
    chill: {
      label: 'Chill',
      note: 'Gentle gaps. Room to breathe.',
      speed: 138,
      speedMax: 208,
      gap: 214,
      gapMin: 186,
      spacing: 268,
      gravity: 1320,
      flap: -392,
      drift: 0,
      powerChance: 0.32,
    },
    classic: {
      label: 'Classic',
      note: 'The one that started it all.',
      speed: 156,
      speedMax: 274,
      gap: 198,
      gapMin: 152,
      spacing: 244,
      gravity: 1500,
      flap: -420,
      drift: 0,
      powerChance: 0.22,
    },
    chaos: {
      label: 'Chaos',
      note: 'Moving gaps. No mercy.',
      speed: 176,
      speedMax: 328,
      gap: 190,
      gapMin: 142,
      spacing: 220,
      gravity: 1580,
      flap: -438,
      drift: 1,
      powerChance: 0.2,
    },
  };
  const MEDALS = [
    { min: 50, tier: 'platinum', label: 'Platinum' },
    { min: 35, tier: 'gold', label: 'Gold' },
    { min: 20, tier: 'silver', label: 'Silver' },
    { min: 10, tier: 'bronze', label: 'Bronze' },
  ];
  const POWER_COLORS = {
    shield: '#7dd3fc',
    slow: '#a78bfa',
    magnet: '#ffd166',
  };
  const ACHIEVEMENTS = [
    {
      id: 'first-flight',
      name: 'First Flight',
      desc: 'Finish your first run.',
      stat: 'runs',
      goal: 1,
      reward: 25,
    },
    {
      id: 'getting-good',
      name: 'Getting Good',
      desc: 'Reach 10 points in one run.',
      stat: 'best',
      goal: 10,
      reward: 40,
    },
    {
      id: 'silver-wings',
      name: 'Silver Wings',
      desc: 'Reach 20 points in one run.',
      stat: 'best',
      goal: 20,
      reward: 60,
    },
    {
      id: 'gold-wings',
      name: 'Gold Wings',
      desc: 'Reach 35 points in one run.',
      stat: 'best',
      goal: 35,
      reward: 100,
    },
    {
      id: 'sky-legend',
      name: 'Sky Legend',
      desc: 'Reach 50 points in one run.',
      stat: 'best',
      goal: 50,
      reward: 150,
    },
    {
      id: 'sharpshooter',
      name: 'Sharpshooter',
      desc: 'Land 15 perfect passes.',
      stat: 'perfects',
      goal: 15,
      reward: 60,
    },
    {
      id: 'in-the-zone',
      name: 'In the Zone',
      desc: 'Chain 5 perfect passes in one run.',
      stat: 'bestFlow',
      goal: 5,
      reward: 80,
    },
    {
      id: 'nerves-of-steel',
      name: 'Nerves of Steel',
      desc: 'Collect 10 close-call bonuses.',
      stat: 'nearMisses',
      goal: 10,
      reward: 50,
    },
    {
      id: 'power-player',
      name: 'Power Player',
      desc: 'Grab 8 power-ups.',
      stat: 'powerups',
      goal: 8,
      reward: 50,
    },
    {
      id: 'coin-purse',
      name: 'Coin Purse',
      desc: 'Earn 150 coins from runs.',
      stat: 'coinsEarned',
      goal: 150,
      reward: 75,
    },
    {
      id: 'regular',
      name: 'Regular Flyer',
      desc: 'Finish 25 runs.',
      stat: 'runs',
      goal: 25,
      reward: 80,
    },
    {
      id: 'collector',
      name: 'Collector',
      desc: 'Own 3 bird skins.',
      stat: 'skinsOwned',
      goal: 3,
      reward: 60,
    },
  ];
  // ---------------------------------------------------------------- birds
  const SKINS = [
    {
      id: 'sunny',
      name: 'Sunny',
      price: 0,
      body: '#ffd166',
      bodyLight: '#ffe9a8',
      wing: '#f79a3f',
      belly: '#fff6de',
      beak: '#ff9436',
      beakDark: '#e0761c',
      outline: '#7a4310',
      accent: '#ff7a59',
      eye: '#242a3d',
    },
    {
      id: 'mint',
      name: 'Mint',
      price: 90,
      body: '#6ee7c8',
      bodyLight: '#b9ffec',
      wing: '#2dd4bf',
      belly: '#f0fffa',
      beak: '#ffd166',
      beakDark: '#e0a92d',
      outline: '#136a5d',
      accent: '#ff8fab',
      eye: '#153a38',
    },
    {
      id: 'berry',
      name: 'Berry',
      price: 180,
      body: '#c084fc',
      bodyLight: '#e6ccff',
      wing: '#a855f7',
      belly: '#faf2ff',
      beak: '#ffb86b',
      beakDark: '#e08f3c',
      outline: '#4c2378',
      accent: '#ffd166',
      eye: '#2a1745',
    },
    {
      id: 'ember',
      name: 'Ember',
      price: 300,
      body: '#ff7a59',
      bodyLight: '#ffc0a6',
      wing: '#ef4444',
      belly: '#ffe9df',
      beak: '#ffd166',
      beakDark: '#d9a02a',
      outline: '#6d1d10',
      accent: '#ffe29a',
      eye: '#2c1410',
    },
    {
      id: 'frost',
      name: 'Frost',
      price: 460,
      body: '#a5f3fc',
      bodyLight: '#e4fdff',
      wing: '#38bdf8',
      belly: '#f4feff',
      beak: '#ffb703',
      beakDark: '#d99a00',
      outline: '#1d5a74',
      accent: '#c084fc',
      eye: '#0f3345',
    },
    {
      id: 'midnight',
      name: 'Midnight',
      price: 700,
      body: '#303a63',
      bodyLight: '#4d5a92',
      wing: '#1b2138',
      belly: '#141a30',
      beak: '#ffd166',
      beakDark: '#d9a427',
      outline: '#080b16',
      accent: '#8be9ff',
      eye: '#f2f8ff',
      sparkle: true,
      glow: 'rgba(139,233,255,0.45)',
    },
    {
      id: 'ghost',
      name: 'Ghost',
      price: 1000,
      body: '#e8f4ff',
      bodyLight: '#ffffff',
      wing: '#c9e4ff',
      belly: '#ffffff',
      beak: '#d7ecff',
      beakDark: '#a8c8e8',
      outline: '#7fa6c9',
      accent: '#9ad8ff',
      eye: '#4d7099',
      glow: 'rgba(180,230,255,0.55)',
      alpha: 0.82,
    },
  ];
  const skinById = (id) => SKINS.find((s) => s.id === id) || SKINS[0];
  // -------------------------------------------------------------- palettes
  const PALETTES = [
    {
      top: '#20224f',
      mid: '#6b3d76',
      bottom: '#f6a37a',
      cloud: '#ffe1cf',
      cloudShade: '#e7a6a0',
      hillFar: '#7a4f80',
      hillNear: '#463257',
      pipe: '#54c88a',
      pipeDark: '#207a52',
      pipeLight: '#a5f0c3',
      cap: '#66d99a',
      ground: '#5f3f63',
      groundDark: '#33253f',
      grass: '#8ee08a',
      grassDark: '#4da368',
      orb: '#ffcf8f',
      night: 0.12,
      stars: 0.18,
    },
    {
      top: '#3d9fe0',
      mid: '#8fd4f3',
      bottom: '#d9f3ff',
      cloud: '#ffffff',
      cloudShade: '#cfe4f2',
      hillFar: '#8fd6c2',
      hillNear: '#57b98f',
      pipe: '#5cc96f',
      pipeDark: '#2a8c46',
      pipeLight: '#b4f2b8',
      cap: '#6dd97f',
      ground: '#d8b477',
      groundDark: '#9a774a',
      grass: '#84d96a',
      grassDark: '#4da34e',
      orb: '#fff4b0',
      night: 0,
      stars: 0,
    },
    {
      top: '#262650',
      mid: '#7a3f74',
      bottom: '#ff8a6b',
      cloud: '#ffcfc1',
      cloudShade: '#cc8580',
      hillFar: '#5c3f74',
      hillNear: '#33284d',
      pipe: '#38b2a3',
      pipeDark: '#1d6f68',
      pipeLight: '#8ce6d4',
      cap: '#4ac6b4',
      ground: '#54304f',
      groundDark: '#2b1c33',
      grass: '#62b06a',
      grassDark: '#3c7a4c',
      orb: '#ff9f6e',
      night: 0.3,
      stars: 0.35,
    },
    {
      top: '#05081c',
      mid: '#131d3f',
      bottom: '#2b3a68',
      cloud: '#6b7cb0',
      cloudShade: '#3b4877',
      hillFar: '#1b2650',
      hillNear: '#0e1638',
      pipe: '#3f8f92',
      pipeDark: '#1d5559',
      pipeLight: '#7fd8d4',
      cap: '#4da3a4',
      ground: '#171a35',
      groundDark: '#0a0d1e',
      grass: '#2f5f6b',
      grassDark: '#1b3f4c',
      orb: '#e8f1ff',
      night: 0.95,
      stars: 1,
    },
  ];
  // --------------------------------------------------------------- storage
  const DEFAULT_SAVE = {
    best: 0,
    bestByMode: { chill: 0, classic: 0, chaos: 0 },
    runs: 0,
    coins: 0,
    skins: ['sunny'],
    skin: 'sunny',
    mode: 'classic',
    sound: true,
    sfx: 0.9,
    music: 0.75,
    haptics: true,
    shake: true,
    stats: {
      perfects: 0,
      nearMisses: 0,
      powerups: 0,
      coinsEarned: 0,
      bestFlow: 0,
    },
    achievements: {},
  };
  function loadSave() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (!raw || typeof raw !== 'object')
        return {
          ...DEFAULT_SAVE,
          bestByMode: { ...DEFAULT_SAVE.bestByMode },
          stats: { ...DEFAULT_SAVE.stats },
          achievements: {},
        };
      const merged = {
        ...DEFAULT_SAVE,
        ...raw,
        bestByMode: { ...DEFAULT_SAVE.bestByMode, ...(raw.bestByMode || {}) },
        stats: { ...DEFAULT_SAVE.stats, ...(raw.stats || {}) },
        achievements:
          raw.achievements && typeof raw.achievements === 'object'
            ? raw.achievements
            : {},
        skins:
          Array.isArray(raw.skins) && raw.skins.length ? raw.skins : ['sunny'],
      };
      merged.best = Math.max(0, Number(merged.best) || 0);
      merged.coins = Math.max(0, Number(merged.coins) || 0);
      merged.runs = Math.max(0, Number(merged.runs) || 0);
      merged.sfx = clamp(Number(merged.sfx), 0, 1);
      merged.music = clamp(Number(merged.music), 0, 1);
      merged.haptics = merged.haptics !== false;
      merged.shake = merged.shake !== false;
      if (!Number.isFinite(merged.sfx)) merged.sfx = 0.9;
      if (!Number.isFinite(merged.music)) merged.music = 0.75;
      for (const key in merged.stats)
        merged.stats[key] = Math.max(0, Number(merged.stats[key]) || 0);
      if (!MODES[merged.mode]) merged.mode = 'classic';
      if (!merged.skins.includes('sunny')) merged.skins.push('sunny');
      if (!merged.skins.includes(merged.skin)) merged.skin = 'sunny';
      return merged;
    } catch (e) {
      return {
        ...DEFAULT_SAVE,
        bestByMode: { ...DEFAULT_SAVE.bestByMode },
        stats: { ...DEFAULT_SAVE.stats },
        achievements: {},
      };
    }
  }
  const save = loadSave();
  function persist() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (e) {
      /* private mode */
    }
  }
  // ---------------------------------------------------------------- canvas
  const view = {
    cw: 0,
    ch: 0,
    dpr: 1,
    scale: 1,
    vw: W,
    vh: BASE_H,
    groundY: BASE_H - GROUND_H,
    playX: 0,
    birdX: 150,
  };
  function resize() {
    const cw = Math.max(1, window.innerWidth);
    const ch = Math.max(1, window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    view.cw = cw;
    view.ch = ch;
    view.dpr = dpr;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    const scale = Math.min(cw / W, ch / BASE_H);
    view.scale = scale;
    view.vw = cw / scale;
    view.vh = ch / scale;
    view.groundY = view.vh - GROUND_H;
    view.playX = (view.vw - W) / 2;
    view.birdX = view.playX + 150;
    if (game) {
      game.bird.x = view.birdX;
      if (game.scene === 'menu' || game.scene === 'shop')
        game.bird.y = view.vh * 0.42;
      game.bird.y = clamp(game.bird.y, 30, view.groundY - 30);
    }
  }
  // ----------------------------------------------------------------- state
  const game = {
    scene: 'menu',
    time: 0,
    day: 0.3,
    scroll: 0,
    speed: 0,
    score: 0,
    flow: 0,
    bestFlow: 0,
    perfects: 0,
    nearMisses: 0,
    powerupsTaken: 0,
    coinsRun: 0,
    pipes: [],
    coins: [],
    powerups: [],
    particles: [],
    floaters: [],
    spawnAcc: 0,
    pipesSincePower: 0,
    trailAcc: 0,
    coinChain: 0,
    coinChainTimer: 0,
    shield: 0,
    slow: 0,
    magnet: 0,
    closePulse: 0,
    invuln: 0,
    shake: 0,
    flash: 0,
    hitstop: 0,
    deathTimer: 0,
    deathHandled: false,
    flaps: 0,
    newBest: false,
    bestAtStart: 0,
    modeBestAtStart: 0,
    milestones: {},
    bird: {
      x: 150,
      y: 300,
      vy: 0,
      rot: 0,
      wing: 0,
      wingSpeed: 10,
      blink: 3,
      alive: true,
    },
  };
  const el = {
    score: $('#score'),
    combo: $('#combo'),
    coins: $('#coinCount'),
    powerups: $('#powerups'),
    pause: $('#btnPause'),
    toast: $('#toast'),
    menuBest: $('#menuBest'),
    menuModeBest: $('#menuModeBest'),
    menuModeLabel: $('#menuModeLabel'),
    menuRuns: $('#menuRuns'),
    menuCoins: $('#menuCoins'),
    goalMenuCount: $('#goalMenuCount'),
    modeNote: $('#modeNote'),
    skinGrid: $('#skinGrid'),
    shopCoins: $('#shopCoins'),
    shopHint: $('#skinHint'),
    goalList: $('#goalList'),
    goalCount: $('#goalCount'),
    sfxRange: $('#sfxRange'),
    musicRange: $('#musicRange'),
    sfxValue: $('#sfxValue'),
    musicValue: $('#musicValue'),
    btnHaptics: $('#btnHaptics'),
    btnShake: $('#btnShake'),
    pauseScore: $('#pauseScore'),
    pauseFlow: $('#pauseFlow'),
    pauseClose: $('#pauseClose'),
    pauseCoins: $('#pauseCoins'),
    soundLabel: $('#soundLabel'),
    finalScore: $('#finalScore'),
    overBest: $('#overBest'),
    overCoins: $('#overCoins'),
    overPerfect: $('#overPerfect'),
    overStreak: $('#overStreak'),
    overClose: $('#overClose'),
    overFlaps: $('#overFlaps'),
    medal: $('#medal'),
    medalLabel: $('#medalLabel'),
    overTitle: $('#overTitle'),
    newBest: $('#newBest'),
  };
  let shopPreviews = [];
  let shopReturn = 'menu';
  let hudCache = { score: -1, coins: -1, combo: '' };
  // ---------------------------------------------------------------- colour
  const hexCache = new Map();
  function hexRgb(hex) {
    let v = hexCache.get(hex);
    if (v) return v;
    const n = parseInt(hex.slice(1), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    hexCache.set(hex, v);
    return v;
  }
  function mixHex(a, b, t) {
    const A = hexRgb(a),
      B = hexRgb(b);
    return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
  }
  function withAlpha(hex, a) {
    const c = hexRgb(hex);
    return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  }
  function paletteNow() {
    const pos = ((game.day % 4) + 4) % 4;
    const i = Math.floor(pos);
    const f = pos - i;
    const A = PALETTES[i],
      B = PALETTES[(i + 1) % 4];
    const out = {};
    for (const k in A) {
      if (k === 'name') continue;
      out[k] =
        typeof A[k] === 'number' ? lerp(A[k], B[k], f) : mixHex(A[k], B[k], f);
    }
    return out;
  }
  function roundRect(c, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function starPath(c, cx, cy, outer, inner, points) {
    c.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 ? inner : outer;
      const a = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.closePath();
  }
  // ------------------------------------------------------------- seed data
  const STAR_SEEDS = Array.from({ length: 80 }, () => ({
    u: Math.random(),
    v: Math.random() * 0.8,
    r: rand(0.5, 1.9),
    ph: rand(0, TAU),
    tw: rand(0.5, 2.1),
  }));
  const CLOUD_SEEDS = Array.from({ length: 8 }, () => ({
    u: Math.random(),
    y: rand(0.05, 0.52),
    s: rand(0.55, 1.35),
    sp: rand(0.5, 1.15),
    a: rand(0.4, 0.85),
  }));
  const MOTE_SEEDS = Array.from({ length: 16 }, () => ({
    u: Math.random(),
    v: rand(0.1, 0.85),
    ph: rand(0, TAU),
    r: rand(0.7, 1.7),
    sp: rand(0.2, 0.6),
  }));
  // ------------------------------------------------------------ background
  function drawSky(p) {
    const { vw, groundY } = view;
    const sky = ctx.createLinearGradient(0, -40, 0, groundY + 20);
    sky.addColorStop(0, p.top);
    sky.addColorStop(0.55, p.mid);
    sky.addColorStop(1, p.bottom);
    ctx.fillStyle = sky;
    ctx.fillRect(-60, -60, vw + 120, groundY + 120);
  }
  function drawOrb(t, p) {
    const { vw, vh, groundY } = view;
    const ox = vw * 0.76;
    const oy = Math.min(vh * 0.19, groundY * 0.3) + Math.sin(t * 0.12) * 5;
    const r = 33;
    const night = p.night > 0.55;
    const glow = ctx.createRadialGradient(ox, oy, r * 0.3, ox, oy, r * 3.6);
    glow.addColorStop(0, withAlpha(p.orb, night ? 0.28 : 0.42));
    glow.addColorStop(1, withAlpha(p.orb, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ox, oy, r * 3.6, 0, TAU);
    ctx.fill();
    if (!night) {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(t * 0.05);
      ctx.globalAlpha = 0.16;
      ctx.strokeStyle = p.orb;
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r + 10), Math.sin(a) * (r + 10));
        ctx.lineTo(Math.cos(a) * (r + 22), Math.sin(a) * (r + 22));
        ctx.stroke();
      }
      ctx.restore();
    }
    const body = ctx.createLinearGradient(ox, oy - r, ox, oy + r);
    body.addColorStop(0, '#ffffff');
    body.addColorStop(0.45, p.orb);
    body.addColorStop(1, withAlpha(p.orb, 0.85));
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(ox, oy, r, 0, TAU);
    ctx.fill();
    if (night) {
      ctx.fillStyle = 'rgba(70,88,125,0.18)';
      [
        [-10, -8, 7],
        [9, 4, 5],
        [-2, 13, 3.5],
        [12, -12, 3],
      ].forEach(([x, y, rr]) => {
        ctx.beginPath();
        ctx.arc(ox + x, oy + y, rr, 0, TAU);
        ctx.fill();
      });
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(ox - 9, oy - 9, 8, Math.PI * 0.8, Math.PI * 1.7);
      ctx.fill();
    }
  }
  function drawStars(t, p) {
    if (p.stars < 0.02) return;
    const { vw, vh } = view;
    ctx.save();
    for (const s of STAR_SEEDS) {
      const tw = 0.45 + 0.55 * Math.sin(t * s.tw + s.ph);
      ctx.globalAlpha = clamp(p.stars * tw, 0, 1) * 0.9;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.u * vw, s.v * vh * 0.85, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  function drawClouds(t, p) {
    const { vw, vh, groundY } = view;
    const span = vw + 340;
    for (const c of CLOUD_SEEDS) {
      let x =
        ((((c.u * span - game.scroll * 0.045 * c.sp) % span) + span) % span) -
        170;
      const y = c.y * groundY;
      const s = c.s * 46;
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = c.a * (0.75 + 0.25 * Math.cos(t * 0.2 + c.u * 9));
      ctx.fillStyle = p.cloud;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 1.1, s * 0.5, 0, 0, TAU);
      ctx.ellipse(-s * 0.62, s * 0.1, s * 0.55, s * 0.36, 0, 0, TAU);
      ctx.ellipse(s * 0.55, s * 0.06, s * 0.6, s * 0.4, 0, 0, TAU);
      ctx.ellipse(s * 0.05, -s * 0.34, s * 0.52, s * 0.42, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha *= 0.35;
      ctx.fillStyle = p.cloudShade;
      ctx.beginPath();
      ctx.ellipse(0, s * 0.26, s * 0.92, s * 0.2, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
  function drawFlocks(t, p) {
    const { vw, vh } = view;
    ctx.save();
    ctx.strokeStyle =
      p.night > 0.55 ? 'rgba(220,235,255,0.35)' : 'rgba(30,24,52,0.22)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let g = 0; g < 2; g++) {
      const speed = 11 + g * 5;
      const baseX = ((t * speed + g * 260) % (vw + 260)) - 130;
      const baseY = vh * (0.17 + g * 0.1) + Math.sin(t * 0.4 + g) * 10;
      for (let i = 0; i < 3; i++) {
        const x = baseX - i * 22;
        const y = baseY + i * 9 + Math.sin(t * 2 + i) * 2;
        const s = 5 - i * 0.8;
        ctx.beginPath();
        ctx.moveTo(x - s, y);
        ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.8, x, y);
        ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.8, x + s, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  function drawHills(t, p) {
    const { vw, groundY } = view;
    const layers = [
      {
        color: p.hillFar,
        base: groundY - 96,
        amp: 26,
        k: 0.01,
        sp: 0.16,
        seed: 0,
      },
      {
        color: p.hillNear,
        base: groundY - 52,
        amp: 22,
        k: 0.015,
        sp: 0.34,
        seed: 120,
      },
    ];
    for (const L of layers) {
      const off = game.scroll * L.sp;
      ctx.beginPath();
      ctx.moveTo(-60, groundY + 10);
      for (let x = -60; x <= vw + 60; x += 18) {
        const y =
          L.base +
          Math.sin((x + off + L.seed) * L.k) * L.amp +
          Math.sin((x + off + L.seed) * L.k * 2.4) * L.amp * 0.3;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(vw + 60, groundY + 10);
      ctx.closePath();
      ctx.fillStyle = L.color;
      ctx.fill();
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }
  function drawMotes(t, p) {
    const { vw, groundY } = view;
    ctx.save();
    ctx.fillStyle = p.night > 0.5 ? '#cfe6ff' : '#fff4d8';
    for (const m of MOTE_SEEDS) {
      const x = (m.u * vw + Math.sin(t * 0.25 + m.ph) * 34 + vw) % vw;
      const y = m.v * groundY + Math.sin(t * m.sp + m.ph) * 24;
      ctx.globalAlpha = 0.1 + 0.12 * (0.5 + 0.5 * Math.sin(t * 0.8 + m.ph));
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  // ---------------------------------------------------------------- ground
  function drawGround(t, p) {
    const { vw, vh, groundY } = view;
    const soil = ctx.createLinearGradient(0, groundY, 0, vh);
    soil.addColorStop(0, p.ground);
    soil.addColorStop(1, p.groundDark);
    ctx.fillStyle = soil;
    ctx.fillRect(-60, groundY, vw + 120, vh - groundY + 60);
    const off = game.scroll % 28;
    ctx.fillStyle = p.grass;
    for (let x = -40 + off; x < vw + 40; x += 28) {
      ctx.beginPath();
      ctx.arc(x, groundY + 15, 9, 0, Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = p.grassDark;
    ctx.fillRect(-60, groundY + 15, vw + 120, 6);
    ctx.fillStyle = p.grass;
    ctx.fillRect(-60, groundY + 6, vw + 120, 10);
    ctx.fillStyle = withAlpha('#ffffff', 0.22);
    ctx.fillRect(-60, groundY + 5, vw + 120, 2);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, groundY + 21, vw, vh - groundY);
    ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 7;
    const off2 = (game.scroll * 0.55) % 42;
    for (let x = -80 + off2; x < vw + 100; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + 30);
      ctx.lineTo(x + 34, vh + 10);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 2;
    for (let x = -80 + off2; x < vw + 100; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x + 5, groundY + 30);
      ctx.lineTo(x + 39, vh + 10);
      ctx.stroke();
    }
    ctx.restore();
    const shade = ctx.createLinearGradient(0, groundY, 0, groundY + 50);
    shade.addColorStop(0, 'rgba(8,10,22,0.28)');
    shade.addColorStop(1, 'rgba(8,10,22,0)');
    ctx.fillStyle = shade;
    ctx.fillRect(-60, groundY, vw + 120, 50);
  }
  // ----------------------------------------------------------------- pipes
  function drawPipes(p) {
    for (const pipe of game.pipes) {
      const gapTop = pipe.center - pipe.gap / 2;
      const gapBot = pipe.center + pipe.gap / 2;
      drawPipeBody(pipe.x, -40, PIPE_W, gapTop - 22 + 40, p);
      drawPipeCap(pipe.x - 5, gapTop - 22, PIPE_W + 10, 22, p, false);
      drawPipeCap(pipe.x - 5, gapBot, PIPE_W + 10, 22, p, true);
      drawPipeBody(pipe.x, gapBot + 22, PIPE_W, view.groundY - gapBot + 30, p);
    }
  }
  function drawPipeBody(x, y, w, h, p) {
    if (h <= 0) return;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, p.pipeDark);
    g.addColorStop(0.16, p.pipe);
    g.addColorStop(0.42, p.pipeLight);
    g.addColorStop(0.58, p.pipe);
    g.addColorStop(0.88, p.pipeDark);
    g.addColorStop(1, p.pipeDark);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(x + 12, y, 7, h);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x + w - 7, y, 7, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.75, y, w - 1.5, h);
  }
  function drawPipeCap(x, y, w, h, p, flip) {
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, p.pipeDark);
    g.addColorStop(0.18, p.cap);
    g.addColorStop(0.4, p.pipeLight);
    g.addColorStop(0.7, p.cap);
    g.addColorStop(1, p.pipeDark);
    ctx.fillStyle = g;
    roundRect(ctx, x, y, w, h, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    roundRect(ctx, x + 10, y + (flip ? 6 : 4), 8, h - 10, 4);
    ctx.fill();
  }
  // ------------------------------------------------------------------ bird
  function drawBirdShape(c, x, y, r, rot, skin, wingPhase, opt = {}) {
    const alpha =
      (opt.alpha == null ? 1 : opt.alpha) *
      (skin.alpha == null ? 1 : skin.alpha);
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.globalAlpha = alpha;
    if (skin.glow) {
      c.shadowColor = skin.glow;
      c.shadowBlur = r * 1.6;
    } // tail
    c.fillStyle = skin.wing;
    c.beginPath();
    c.moveTo(-r * 0.75, -r * 0.08);
    c.lineTo(-r * 1.62, -r * 0.56);
    c.lineTo(-r * 1.5, r * 0.34);
    c.closePath();
    c.fill(); // body
    const body = c.createLinearGradient(0, -r, 0, r);
    body.addColorStop(0, skin.bodyLight || skin.body);
    body.addColorStop(1, skin.body);
    c.fillStyle = body;
    c.beginPath();
    c.ellipse(0, 0, r * 1.18, r, 0, 0, TAU);
    c.fill();
    c.shadowBlur = 0;
    c.lineWidth = Math.max(1.2, r * 0.09);
    c.strokeStyle = skin.outline;
    c.globalAlpha = alpha * 0.32;
    c.stroke();
    c.globalAlpha = alpha; // belly
    c.fillStyle = skin.belly;
    c.beginPath();
    c.ellipse(r * 0.2, r * 0.34, r * 0.64, r * 0.45, 0.12, 0, TAU);
    c.fill(); // wing
    const wa = Math.sin(wingPhase) * 0.9 - 0.22;
    c.save();
    c.translate(-r * 0.08, r * 0.02);
    c.rotate(wa);
    c.fillStyle = skin.wing;
    c.beginPath();
    c.ellipse(-r * 0.16, 0, r * 0.74, r * 0.4, -0.22, 0, TAU);
    c.fill();
    c.strokeStyle = skin.outline;
    c.globalAlpha = alpha * 0.18;
    c.lineWidth = r * 0.07;
    c.stroke();
    c.globalAlpha = alpha;
    c.restore(); // eye
    const eyeX = r * 0.52,
      eyeY = -r * 0.3;
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(eyeX, eyeY, r * 0.31, 0, TAU);
    c.fill();
    c.save();
    c.translate(eyeX, eyeY);
    c.scale(1, opt.blink ? 0.12 : 1);
    c.fillStyle = skin.eye || '#20243a';
    c.beginPath();
    c.arc(r * 0.07, 0, r * 0.155, 0, TAU);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath();
    c.arc(r * 0.12, -r * 0.06, r * 0.05, 0, TAU);
    c.fill();
    c.restore(); // beak
    c.fillStyle = skin.beak;
    c.beginPath();
    c.moveTo(r * 0.94, -r * 0.06);
    c.lineTo(r * 1.72, r * 0.04);
    c.lineTo(r * 0.98, r * 0.2);
    c.closePath();
    c.fill();
    c.fillStyle = skin.beakDark;
    c.beginPath();
    c.moveTo(r * 0.99, r * 0.16);
    c.lineTo(r * 1.56, r * 0.11);
    c.lineTo(r * 0.99, r * 0.32);
    c.closePath();
    c.fill(); // cheek
    c.fillStyle = skin.accent;
    c.globalAlpha = alpha * 0.45;
    c.beginPath();
    c.arc(r * 0.46, r * 0.17, r * 0.12, 0, TAU);
    c.fill();
    c.globalAlpha = alpha;
    if (skin.sparkle) {
      c.fillStyle = skin.accent;
      const tw = 0.55 + 0.45 * Math.sin(wingPhase * 0.9);
      c.globalAlpha = alpha * tw;
      starPath(c, -r * 0.55, -r * 0.6, r * 0.16, r * 0.05, 4);
      c.fill();
      c.globalAlpha = alpha * (1 - tw) * 0.8;
      starPath(c, r * 0.3, r * 0.85, r * 0.11, r * 0.035, 4);
      c.fill();
    }
    c.restore();
  }
  function drawShield(t) {
    const b = game.bird;
    const r = 28 + Math.sin(t * 4) * 1.5;
    const g = ctx.createRadialGradient(b.x - 7, b.y - 8, 2, b.x, b.y, r);
    g.addColorStop(0, 'rgba(160,235,255,0.05)');
    g.addColorStop(0.72, 'rgba(125,211,252,0.12)');
    g.addColorStop(1, 'rgba(125,211,252,0.35)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(190,245,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, -0.6, 1.6);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(190,245,255,0.35)';
    ctx.beginPath();
    ctx.arc(b.x, b.y, r - 4, 1.8, 4.3);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(b.x - r * 0.55, b.y - r * 0.52, 2.2, 0, TAU);
    ctx.fill();
  }
  function drawMagnetField(t) {
    const b = game.bird;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.strokeStyle = 'rgba(255,209,102,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 7]);
    ctx.lineDashOffset = -t * 22;
    ctx.beginPath();
    ctx.arc(0, 0, 26 + Math.sin(t * 4) * 2, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.rotate(t * 0.9);
    ctx.strokeStyle = 'rgba(255,209,102,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0.4, 2.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 32, 3.6, 5.3);
    ctx.stroke();
    ctx.restore();
  }
  function drawComboAura(t) {
    if (game.flow < 3) return;
    const b = game.bird;
    const strength = Math.min(1, (game.flow - 2) / 4);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.globalAlpha = 0.35 + strength * 0.35;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([2, 5]);
    ctx.lineDashOffset = t * 18;
    ctx.beginPath();
    ctx.arc(0, 0, 23 + Math.sin(t * 3) * 1.5, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 3; i++) {
      const a = t * 1.6 + (i / 3) * TAU;
      ctx.globalAlpha = strength * (0.4 + 0.3 * Math.sin(t * 4 + i));
      ctx.fillStyle = '#ffe29a';
      starPath(ctx, Math.cos(a) * 24, Math.sin(a) * 24, 2.4, 1, 4);
      ctx.fill();
    }
    ctx.restore();
  }
  // ----------------------------------------------------------------- coins
  function drawCoins(t) {
    for (const c of game.coins) {
      if (game.magnet > 0) {
        const mdx = game.bird.x - c.x;
        const mdy = game.bird.y - c.y;
        const dist = Math.hypot(mdx, mdy);
        if (dist < 300) {
          ctx.save();
          ctx.strokeStyle = `rgba(255,209,102,${0.2 * (1 - dist / 300)})`;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([2, 6]);
          ctx.beginPath();
          ctx.moveTo(c.x, c.y);
          ctx.lineTo(game.bird.x, game.bird.y);
          ctx.stroke();
          ctx.restore();
        }
      }
      const bob = Math.sin(t * 3 + c.phase) * 3;
      const squash = 0.35 + 0.65 * Math.abs(Math.cos(t * 4 + c.phase));
      ctx.save();
      ctx.translate(c.x, c.y + bob);
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.scale(squash, 1);
      const g = ctx.createRadialGradient(-3, -4, 1, 0, 0, 13);
      g.addColorStop(0, '#fff8d2');
      g.addColorStop(0.45, '#ffd166');
      g.addColorStop(1, '#dd961f');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(122,72,6,0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 8.4, -2.3, 0.5);
      ctx.stroke();
      ctx.fillStyle = 'rgba(141,86,12,0.75)';
      starPath(ctx, 0, 0.5, 4.6, 2, 5);
      ctx.fill();
      ctx.restore();
    }
  }
  function drawPowerups(t) {
    for (const pu of game.powerups) {
      const y = pu.y + Math.sin(t * 3 + pu.phase) * 4;
      const color = POWER_COLORS[pu.type] || '#a78bfa';
      ctx.save();
      ctx.translate(pu.x, y);
      const pulse = 0.5 + 0.5 * Math.sin(t * 4 + pu.phase);
      const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 30);
      glow.addColorStop(0, withAlpha(color, 0.4));
      glow.addColorStop(1, withAlpha(color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = withAlpha(color, 0.55);
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 5]);
      ctx.lineDashOffset = -t * 16;
      ctx.beginPath();
      ctx.arc(0, 0, 21 + pulse * 2, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(12,18,38,0.82)';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.strokeStyle = '#f4fbff';
      ctx.fillStyle = '#f4fbff';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (pu.type === 'shield') {
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(7, -5.5);
        ctx.lineTo(6.3, 2);
        ctx.quadraticCurveTo(5, 6.2, 0, 8.6);
        ctx.quadraticCurveTo(-5, 6.2, -6.3, 2);
        ctx.lineTo(-7, -5.5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else if (pu.type === 'slow') {
        ctx.beginPath();
        ctx.arc(0, 0, 7.2, 0, TAU);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -4.5);
        ctx.lineTo(0, 0.5);
        ctx.lineTo(3.4, 2.6);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 1.7, 0, TAU);
        ctx.fill();
      } else {
        // horseshoe magnet
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-6, 5.2);
        ctx.lineTo(-6, -0.5);
        ctx.arc(0, -0.5, 6, Math.PI, 0);
        ctx.lineTo(6, 5.2);
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-6, 5.6);
        ctx.lineTo(-6, 2.4);
        ctx.moveTo(6, 5.6);
        ctx.lineTo(6, 2.4);
        ctx.stroke();
      }
      ctx.restore();
      ctx.restore();
    }
  }
  // ------------------------------------------------------------- particles
  function spawnParticle(o) {
    if (game.particles.length > 300) return;
    game.particles.push({
      x: o.x,
      y: o.y,
      vx: o.vx || 0,
      vy: o.vy || 0,
      life: o.life || 0.6,
      max: o.life || 0.6,
      r: o.r || 3,
      color: o.color || '#ffffff',
      type: o.type || 'puff',
      gravity: o.gravity || 0,
      rot: o.rot || 0,
      vr: o.vr || 0,
      alpha: o.alpha == null ? 1 : o.alpha,
    });
  }
  function updateParticles(dt) {
    for (let i = game.particles.length - 1; i >= 0; i--) {
      const p = game.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        game.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
  }
  function drawParticles() {
    for (const p of game.particles) {
      const k = clamp(p.life / p.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = k * p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.type === 'confetti') {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r, -p.r * 0.55, p.r * 2, p.r * 1.1);
      } else if (p.type === 'feather') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r * 1.6, p.r * 0.65, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-p.r * 1.4, 0);
        ctx.lineTo(p.r * 1.4, 0);
        ctx.stroke();
      } else if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, p.r * (1 + (1 - k) * 1.8), 0, TAU);
        ctx.stroke();
      } else if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        starPath(ctx, 0, 0, p.r, p.r * 0.3, 4);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.r * (0.6 + k * 0.7), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  function floaterMetrics(text, size) {
    ctx.save();
    ctx.font = `900 ${size}px "Segoe UI", system-ui, sans-serif`;
    const textW = ctx.measureText(text).width;
    ctx.restore();
    const iconR = size * 0.43;
    const tileR = iconR + 3.2;
    return {
      w: 7 + tileR * 2 + 7 + textW + 13,
      h: size + 14,
      iconR,
      tileR,
    };
  }
  function addFloater(text, x, y, color, size, kind) {
    const b = game.bird;
    const s = size || 16;
    // All gameplay callouts live on a feedback rail behind the bird. They
    // follow the bird and drift away from it, so a word can never cover the
    // bird or the gap the player is aiming for.
    const halfW = Math.min(150, floaterMetrics(text, s).w / 2);
    x = Math.max(view.playX + halfW + 16, b.x - halfW - 32);
    y = b.y - 54;
    if (y < 46) y = Math.min(view.groundY - 28, b.y + 56);
    const piled = game.floaters.reduce(
      (n, f) => n + (Math.abs(f.x - x) < 130 && f.life > 0.7 ? 1 : 0),
      0,
    );
    const dir = y < b.y ? -1 : 1;
    y = clamp(y + dir * Math.min(6, piled) * 32, 34, view.groundY - 26);
    const hold =
      kind === 'shield' || kind === 'slow' || kind === 'magnet' ? 1.45 : 1.1;
    game.floaters.push({
      text,
      x,
      y,
      offX: x - b.x,
      offY: y - b.y,
      age: 0,
      life: hold,
      max: hold,
      color: color || '#fff6e8',
      size: s,
      icon: kind || 'spark',
    });
  }
  function updateFloaters(dt) {
    const b = game.bird;
    for (let i = game.floaters.length - 1; i >= 0; i--) {
      const f = game.floaters[i];
      f.life -= dt;
      f.age += dt;
      const drift = f.offY > 0 ? 34 : -34;
      f.x = b.x + f.offX;
      f.y = clamp(b.y + f.offY + drift * f.age, 34, view.groundY - 26);
      if (f.life <= 0) game.floaters.splice(i, 1);
    }
  }
  function drawFloaterIcon(kind, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.scale(r / 8, r / 8);
    if (kind === 'shield') {
      ctx.beginPath();
      ctx.moveTo(0, -7.4);
      ctx.lineTo(6.1, -4.9);
      ctx.lineTo(5.6, 1.3);
      ctx.quadraticCurveTo(4.6, 5.5, 0, 7.7);
      ctx.quadraticCurveTo(-4.6, 5.5, -5.6, 1.3);
      ctx.lineTo(-6.1, -4.9);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-2.5, 0.2);
      ctx.lineTo(-0.4, 2.3);
      ctx.lineTo(3.1, -1.5);
      ctx.stroke();
    } else if (kind === 'slow') {
      ctx.beginPath();
      ctx.arc(0, 0, 6.3, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -3.8);
      ctx.lineTo(0, 0.3);
      ctx.lineTo(2.9, 2.1);
      ctx.stroke();
    } else if (kind === 'magnet') {
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-5.1, 4.7);
      ctx.lineTo(-5.1, -0.6);
      ctx.arc(0, -0.6, 5.1, Math.PI, 0);
      ctx.lineTo(5.1, 4.7);
      ctx.stroke();
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(-5.1, 4.7);
      ctx.lineTo(-5.1, 2.2);
      ctx.moveTo(5.1, 4.7);
      ctx.lineTo(5.1, 2.2);
      ctx.stroke();
    } else if (kind === 'coin') {
      ctx.beginPath();
      ctx.arc(0, 0, 6.2, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 3.1, 0, TAU);
      ctx.stroke();
    } else if (kind === 'close') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 4.3, 0, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 2.1, 0, TAU);
      ctx.fill();
    } else if (kind === 'flow') {
      ctx.beginPath();
      ctx.moveTo(1.1, -7.2);
      ctx.lineTo(-4.5, 1.1);
      ctx.lineTo(-0.4, 1.1);
      ctx.lineTo(-1.1, 7.2);
      ctx.lineTo(4.5, -1.2);
      ctx.lineTo(0.4, -1.2);
      ctx.closePath();
      ctx.fill();
    } else {
      starPath(ctx, 0, 0, 7.3, 2.6, 4);
      ctx.fill();
    }
    ctx.restore();
  }
  function drawFloaters() {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (const f of game.floaters) {
      const k = clamp(f.life / f.max, 0, 1);
      const appear = clamp(f.age / 0.13, 0, 1);
      const ease = 1 - Math.pow(1 - appear, 3);
      const scale = 0.82 + 0.18 * ease;
      ctx.globalAlpha = Math.min(1, k * 2.4) * (0.3 + 0.7 * ease);
      ctx.font = `900 ${f.size}px "Segoe UI", system-ui, sans-serif`;
      const metrics = floaterMetrics(f.text, f.size);
      const iconR = metrics.iconR;
      const tileR = metrics.tileR;
      const w = Math.min(view.vw - 24, metrics.w);
      const h = metrics.h;
      const cx = -w / 2 + 7 + tileR;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(scale, scale);
      const bg = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      bg.addColorStop(0, 'rgba(24, 30, 54, 0.96)');
      bg.addColorStop(1, 'rgba(7, 11, 25, 0.94)');
      ctx.shadowColor = withAlpha(f.color, 0.42);
      ctx.shadowBlur = 16;
      ctx.fillStyle = bg;
      roundRect(ctx, -w / 2, -h / 2, w, h, h / 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = withAlpha(f.color, 0.58);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = withAlpha('#ffffff', 0.12);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + h * 0.6, -h / 2 + 1);
      ctx.lineTo(w / 2 - h * 0.6, -h / 2 + 1);
      ctx.stroke();
      ctx.fillStyle = withAlpha(f.color, 0.16);
      ctx.beginPath();
      ctx.arc(cx, 0, tileR, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = withAlpha(f.color, 0.46);
      ctx.lineWidth = 1;
      ctx.stroke();
      drawFloaterIcon(f.icon, cx, 0, iconR, f.color);
      ctx.fillStyle = '#fff8ec';
      ctx.fillText(f.text, cx + tileR + 7, 0.5);
      ctx.restore();
    }
    ctx.restore();
  }
  // --------------------------------------------------------------- fx layer
  function drawOverlayFx(t) {
    const { vw, vh, groundY } = view;
    const vg = ctx.createRadialGradient(
      vw / 2,
      vh * 0.45,
      Math.min(vw, vh) * 0.32,
      vw / 2,
      vh * 0.5,
      Math.max(vw, vh) * 0.78,
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(4,7,18,0.4)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, vw, vh);
    if (game.slow > 0) {
      const a = Math.min(1, game.slow / 1.1) * 0.55;
      const left = ctx.createLinearGradient(0, 0, vw * 0.22, 0);
      left.addColorStop(0, `rgba(110,80,220,${a})`);
      left.addColorStop(1, 'rgba(110,80,220,0)');
      ctx.fillStyle = left;
      ctx.fillRect(0, 0, vw * 0.22, vh);
      const right = ctx.createLinearGradient(vw, 0, vw * 0.78, 0);
      right.addColorStop(0, `rgba(110,80,220,${a})`);
      right.addColorStop(1, 'rgba(110,80,220,0)');
      ctx.fillStyle = right;
      ctx.fillRect(vw * 0.78, 0, vw * 0.22, vh);
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = '#c4b5fd';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const y = ((t * 90 + i * 160) % (groundY + 60)) - 30;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(vw, y + 12);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (game.closePulse > 0) {
      const a = game.closePulse * 0.25;
      const cg = ctx.createRadialGradient(
        vw / 2,
        vh * 0.48,
        Math.min(vw, vh) * 0.34,
        vw / 2,
        vh * 0.5,
        Math.max(vw, vh) * 0.7,
      );
      cg.addColorStop(0, 'rgba(155,232,245,0)');
      cg.addColorStop(1, `rgba(155,232,245,${a})`);
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, vw, vh);
    }
    if (game.invuln > 0) {
      ctx.strokeStyle = `rgba(160,240,255,${0.3 * Math.min(1, game.invuln)})`;
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, vw - 8, vh - 8);
    }
    if (game.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${game.flash * 0.55})`;
      ctx.fillRect(0, 0, vw, vh);
    }
  }
  function drawTutorial(t) {
    if (game.scene !== 'playing' || game.score !== 0 || game.flaps > 0) return;
    if (game.floaters.length) return;
    const b = game.bird;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.4);
    const a = 0.58 + 0.28 * Math.sin(t * 4);
    const label = 'TAP  ·  SPACE';
    const font = '900 11.5px "Segoe UI", system-ui, sans-serif';
    ctx.save();
    ctx.globalAlpha = a;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = font;
    const tw = ctx.measureText(label).width;
    const w = tw + 52;
    const h = 34;
    const x = b.x + 6;
    const y = b.y - 76;
    ctx.shadowColor = 'rgba(255, 209, 102, 0.2)';
    ctx.shadowBlur = 18 + pulse * 8;
    const bg = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
    bg.addColorStop(0, 'rgba(23, 30, 55, 0.95)');
    bg.addColorStop(1, 'rgba(7, 11, 24, 0.93)');
    ctx.fillStyle = bg;
    roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = withAlpha('#ffd166', 0.3 + 0.14 * pulse);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = withAlpha('#fff3c4', 0.66);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + h * 0.55, y - h / 2 + 1);
    ctx.lineTo(x + w / 2 - h * 0.55, y - h / 2 + 1);
    ctx.stroke();
    const ix = x - w / 2 + 16;
    ctx.strokeStyle = '#ffd166';
    ctx.fillStyle = '#ffd166';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(ix, y, 5.2, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ix, y, 2, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a * (0.3 + 0.3 * pulse);
    ctx.beginPath();
    ctx.arc(ix, y, 7 + pulse * 3, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = a;
    ctx.font = font;
    ctx.fillStyle = '#fff8ec';
    ctx.fillText(label, ix + 14, y + 0.5);
    const ay = y - 26 - pulse * 2;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, ay + 10);
    ctx.lineTo(x, ay);
    ctx.moveTo(x - 5, ay + 5);
    ctx.lineTo(x, ay);
    ctx.lineTo(x + 5, ay + 5);
    ctx.stroke();
    ctx.restore();
  }
  function animateShopPreviews(t) {
    for (const pv of shopPreviews) {
      const g = pv.ctx;
      const size = pv.size;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, size, size);
      g.save();
      g.scale(size / 58, size / 58);
      drawBirdShape(
        g,
        29,
        31,
        14,
        Math.sin(t * 1.1 + pv.i) * 0.08,
        pv.skin,
        t * 5 + pv.i,
        {},
      );
      g.restore();
    }
  }
  // ----------------------------------------------------------------- render
  function render(t) {
    const p = paletteNow();
    const s = view.dpr * view.scale;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    drawSky(p);
    ctx.save();
    const shake = shakeOn() ? game.shake : 0;
    if (shake > 0.25)
      ctx.translate(rand(-shake, shake) * 0.6, rand(-shake, shake) * 0.6);
    drawStars(t, p);
    drawOrb(t, p);
    drawClouds(t, p);
    drawFlocks(t, p);
    drawHills(t, p);
    drawMotes(t, p);
    drawPipes(p);
    drawCoins(t);
    drawPowerups(t);
    // Draw callouts before the bird so they can never obscure it.
    drawFloaters();
    if (game.scene !== 'menu' && game.scene !== 'shop') {
      const b = game.bird;
      const skin = skinById(save.skin);
      const flicker = game.invuln > 0 ? 0.55 + 0.45 * Math.sin(t * 42) : 1;
      drawComboAura(t);
      drawBirdShape(ctx, b.x, b.y, 15, b.rot, skin, b.wing, {
        blink: b.blink < 0.12,
        alpha: flicker,
      });
      if (game.shield > 0) drawShield(t);
      if (game.magnet > 0) drawMagnetField(t);
    }
    drawGround(t, p);
    drawParticles();
    drawTutorial(t);
    drawOverlayFx(t);
    ctx.restore();
    if (game.scene === 'shop') animateShopPreviews(t);
  }
  // -------------------------------------------------------------- mechanics
  function flap() {
    if (game.scene !== 'playing') return;
    const M = MODES[save.mode];
    const b = game.bird;
    b.vy = M.flap;
    b.rot = -0.55;
    b.wingSpeed = 34;
    game.flaps++;
    Sound.flap();
    game.shake = Math.max(game.shake, 2.4);
    const skin = skinById(save.skin);
    for (let i = 0; i < 3; i++) {
      spawnParticle({
        x: b.x - 16,
        y: b.y + rand(-6, 8),
        vx: rand(-110, -40),
        vy: rand(-30, 40),
        r: rand(2, 4.5),
        color: '#ffffff',
        type: 'puff',
        life: rand(0.3, 0.55),
        alpha: 0.35,
      });
    }
    spawnParticle({
      x: b.x - 10,
      y: b.y + 6,
      vx: -30,
      vy: 20,
      r: 3.4,
      color: skin.accent,
      type: 'puff',
      life: 0.4,
      alpha: 0.6,
    });
  }
  function circleRect(cx, cy, r, rx, ry, rw, rh) {
    const nx = clamp(cx, rx, rx + rw);
    const ny = clamp(cy, ry, ry + rh);
    const dx = cx - nx,
      dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  }
  function spawnPipe(M) {
    const gap = Math.max(M.gapMin, M.gap - game.score * 0.8);
    const topMargin = 96;
    const bottomMargin = 86;
    let minC = topMargin + gap / 2;
    let maxC = view.groundY - bottomMargin - gap / 2;
    if (maxC < minC) {
      const mid = (minC + maxC) / 2;
      minC = mid;
      maxC = mid;
    }
    let center = rand(minC, maxC);
    const last = game.pipes[game.pipes.length - 1];
    if (last) center = clamp(center, last.center - 210, last.center + 210);
    center = clamp(center, minC, maxC);
    const pipe = {
      x: view.vw + 70,
      base: center,
      center,
      gap,
      drift: M.drift && game.score >= 6 ? rand(16, 36) : 0,
      phase: rand(0, TAU),
      scored: false,
    };
    game.pipes.push(pipe);
    if (
      game.score > 2 &&
      game.pipesSincePower >= 7 &&
      Math.random() < 0.58 + M.powerChance * 0.4
    ) {
      game.pipesSincePower = 0;
      const roll = Math.random();
      game.powerups.push({
        x: pipe.x + PIPE_W / 2,
        y: center,
        type: roll < 0.42 ? 'shield' : roll < 0.72 ? 'slow' : 'magnet',
        phase: rand(0, TAU),
      });
    } else {
      game.pipesSincePower++;
      if (Math.random() < 0.72) {
        const n = randInt(3, 5);
        const usable = Math.min(gap - 62, 168);
        const step = n > 1 ? usable / (n - 1) : 0;
        const start = center - usable / 2;
        for (let i = 0; i < n; i++) {
          const k = n > 1 ? i / (n - 1) : 0.5;
          game.coins.push({
            x: pipe.x + PIPE_W / 2 + Math.sin(k * Math.PI) * 16 - 8,
            y: start + i * step,
            phase: rand(0, TAU),
          });
        }
      }
    }
  }
  function burstFeathers() {
    const b = game.bird;
    const skin = skinById(save.skin);
    const colors = [skin.body, skin.wing, skin.belly, skin.accent, '#ffffff'];
    for (let i = 0; i < 22; i++) {
      spawnParticle({
        x: b.x + rand(-8, 8),
        y: b.y + rand(-8, 8),
        vx: rand(-260, 260),
        vy: rand(-320, 120),
        r: rand(2.5, 5),
        color: pick(colors),
        type: 'feather',
        life: rand(0.7, 1.4),
        gravity: 620,
        rot: rand(0, TAU),
        vr: rand(-9, 9),
        alpha: 0.95,
      });
    }
    for (let i = 0; i < 10; i++) {
      spawnParticle({
        x: b.x,
        y: b.y,
        vx: rand(-180, 180),
        vy: rand(-180, 180),
        r: rand(1.5, 3.2),
        color: '#ffe29a',
        type: 'spark',
        life: rand(0.3, 0.7),
        gravity: 200,
        vr: rand(-6, 6),
        alpha: 0.9,
      });
    }
    spawnParticle({
      x: b.x,
      y: b.y,
      r: 18,
      color: 'rgba(255,255,255,0.75)',
      type: 'ring',
      life: 0.4,
    });
  }
  function breakShield(kind) {
    const b = game.bird;
    game.shield = 0;
    game.invuln = 1.4;
    game.shake = shakeOn() ? 13 : 0;
    game.flash = shakeOn() ? 0.4 : 0.15;
    if (kind === 'ground') {
      b.y = Math.min(b.y, view.groundY - 46);
      b.vy = -360;
    } else {
      b.vy = -300;
    }
    Sound.shieldBreak();
    try {
      if (navigator.vibrate && save.haptics !== false) navigator.vibrate(24);
    } catch (e) {
      /* ignore */
    }
    addFloater('Shield broken', b.x, b.y - 36, '#a5f3fc', 14, 'shield');
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * TAU;
      spawnParticle({
        x: b.x + Math.cos(a) * 18,
        y: b.y + Math.sin(a) * 18,
        vx: Math.cos(a) * rand(80, 220),
        vy: Math.sin(a) * rand(80, 220),
        r: rand(1.8, 3.4),
        color: i % 2 ? '#bdf3ff' : '#7dd3fc',
        type: 'spark',
        life: rand(0.4, 0.8),
        gravity: 120,
        vr: rand(-8, 8),
        alpha: 0.95,
      });
    }
    updateHud();
  }
  function die(kind) {
    if (game.scene !== 'playing' || game.invuln > 0) return;
    if (game.shield > 0) {
      breakShield(kind);
      return;
    }
    game.scene = 'dying';
    document.body.dataset.scene = 'dying';
    game.deathTimer = 0;
    game.deathHandled = false;
    game.slow = 0;
    const b = game.bird;
    b.alive = false;
    b.vy = kind === 'ground' ? -300 : -340;
    b.wingSpeed = 22;
    game.shake = shakeOn() ? 17 : 0;
    game.flash = shakeOn() ? 0.8 : 0.2;
    Sound.hit();
    Sound.die();
    burstFeathers();
    try {
      if (navigator.vibrate && save.haptics !== false)
        navigator.vibrate([22, 26, 55]);
    } catch (e) {
      /* ignore */
    }
  }
  function collectCoin(c) {
    const mult = game.flow >= 5 ? 2 : 1;
    game.coinsRun += mult;
    game.coinChain = Math.min(12, game.coinChain + 1);
    game.coinChainTimer = 1.3;
    Sound.coin(game.coinChain - 1);
    addFloater(
      `+${mult}`,
      c.x,
      c.y - 16,
      mult > 1 ? '#ffe29a' : '#ffd166',
      13,
      'coin',
    );
    updateCoinsHud();
    for (let i = 0; i < 6; i++) {
      spawnParticle({
        x: c.x,
        y: c.y,
        vx: rand(-100, 100),
        vy: rand(-140, -20),
        r: rand(1.4, 2.8),
        color: '#ffd166',
        type: 'spark',
        life: rand(0.3, 0.6),
        gravity: 320,
        vr: rand(-6, 6),
        alpha: 0.95,
      });
    }
  }
  function collectPower(pu) {
    const b = game.bird;
    game.powerupsTaken++;
    if (pu.type === 'shield') {
      game.shield = 1;
      Sound.shieldUp();
      addFloater('Shield armed', b.x, b.y - 38, '#a5f3fc', 15, 'shield');
      toast('Shield ready — one free hit', 1900, 'shield');
    } else if (pu.type === 'slow') {
      game.slow = 6;
      Sound.slowmo();
      addFloater('Slow-mo', b.x, b.y - 38, '#c4b5fd', 15, 'slow');
      toast('Slow motion — take your time', 2100, 'slow');
    } else {
      game.magnet = 7;
      Sound.magnet();
      addFloater('Magnet', b.x, b.y - 38, '#ffd166', 15, 'magnet');
      toast('Magnet — coins come to you', 2100, 'magnet');
      spawnParticle({
        x: b.x,
        y: b.y,
        r: 30,
        color: 'rgba(255,209,102,0.7)',
        type: 'ring',
        life: 0.5,
      });
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      spawnParticle({
        x: pu.x,
        y: pu.y,
        vx: Math.cos(a) * rand(50, 160),
        vy: Math.sin(a) * rand(50, 160),
        r: rand(1.5, 3),
        color: POWER_COLORS[pu.type] || '#c4b5fd',
        type: 'spark',
        life: rand(0.4, 0.8),
        gravity: 40,
        vr: rand(-5, 5),
        alpha: 0.9,
      });
    }
    updateHud();
  }
  function onPass(pipe) {
    const b = game.bird;
    game.score += 1;
    const diff = Math.abs(b.y - pipe.center);
    const perfect = diff < 28;
    if (perfect) {
      game.score += 1;
      game.flow++;
      game.bestFlow = Math.max(game.bestFlow, game.flow);
      game.perfects++;
      const bonus = game.flow >= 5 ? 2 : 1;
      game.coinsRun += bonus;
      game.shake = Math.max(game.shake, 3);
      Sound.perfect(game.flow - 1);
      addFloater(
        `Perfect +${bonus}`,
        b.x + 10,
        pipe.center,
        '#ffe29a',
        16,
        'perfect',
      );
      for (let i = 0; i < 10; i++) {
        spawnParticle({
          x: b.x + rand(-16, 22),
          y: pipe.center + rand(-14, 14),
          vx: rand(-90, 140),
          vy: rand(-110, 60),
          r: rand(1.4, 2.8),
          color: i % 3 ? '#ffd166' : '#fff8d2',
          type: 'spark',
          life: rand(0.35, 0.7),
          gravity: 120,
          vr: rand(-6, 6),
          alpha: 0.95,
        });
      }
      spawnParticle({
        x: b.x,
        y: b.y,
        r: 22,
        color: 'rgba(255,224,150,0.75)',
        type: 'ring',
        life: 0.45,
      });
      if (game.flow === 5 || game.flow === 10 || game.flow === 15) {
        const label =
          game.flow === 5 ? 'FLOW ×5 · 2× COINS' : `FLOW ×${game.flow}!`;
        toast(label, 1500, 'flow');
        addFloater(
          `Flow ×${game.flow}`,
          b.x - 58,
          b.y - 70,
          '#ffd166',
          17,
          'flow',
        );
        Sound.perfect(5);
        game.shake = Math.max(game.shake, 4);
        for (let i = 0; i < 14; i++) {
          spawnParticle({
            x: b.x,
            y: b.y,
            vx: rand(-220, 220),
            vy: rand(-220, 220),
            r: rand(1.6, 3.2),
            color: i % 2 ? '#ffd166' : '#fff8d2',
            type: 'spark',
            life: rand(0.35, 0.7),
            gravity: 90,
            vr: rand(-7, 7),
            alpha: 0.95,
          });
        }
      }
    } else {
      game.flow = 0;
      const clearance = pipe.gap / 2 - diff;
      if (clearance < 24 && clearance > 10) {
        game.nearMisses++;
        game.coinsRun += 1;
        game.closePulse = 1;
        game.shake = Math.max(game.shake, 2.4);
        Sound.closeCall();
        addFloater('Close +1', b.x + 24, pipe.center, '#9be8f5', 14, 'close');
        for (let i = 0; i < 8; i++) {
          spawnParticle({
            x: b.x + rand(-6, 20),
            y: pipe.center + rand(-12, 12),
            vx: rand(-180, 60),
            vy: rand(-70, 70),
            r: rand(1.1, 2.2),
            color: i % 2 ? '#9be8f5' : '#fff6e8',
            type: 'spark',
            life: rand(0.25, 0.5),
            gravity: 40,
            vr: rand(-5, 5),
            alpha: 0.9,
          });
        }
      } else {
        addFloater('+1', b.x + 18, pipe.center, '#ffd166', 14, 'coin');
        for (let i = 0; i < 4; i++) {
          spawnParticle({
            x: b.x + rand(0, 18),
            y: pipe.center + rand(-10, 10),
            vx: rand(-40, 90),
            vy: rand(-60, 40),
            r: rand(1.2, 2.2),
            color: '#fff6e8',
            type: 'spark',
            life: rand(0.25, 0.5),
            gravity: 80,
            vr: rand(-5, 5),
            alpha: 0.8,
          });
        }
      }
    }
    Sound.score(perfect ? game.flow + 2 : game.score);
    updateScoreHud(true);
    updateCoinsHud();
    checkMilestones();
  }
  function checkMilestones() {
    const marks = [
      {
        at: 10,
        title: 'Bronze Pace',
        tier: 'bronze',
        sub: 'Keep climbing',
        color: '#ffc08a',
      },
      {
        at: 20,
        title: 'Silver Pace',
        tier: 'silver',
        sub: 'Smooth flying',
        color: '#e7f0ff',
      },
      {
        at: 35,
        title: 'Gold Pace',
        tier: 'gold',
        sub: "You're on fire",
        color: '#ffe08a',
      },
      {
        at: 50,
        title: 'Platinum Pace',
        tier: 'platinum',
        sub: 'Legendary',
        color: '#b8f4ff',
      },
    ];
    marks.forEach((mark, index) => {
      if (game.score >= mark.at && !game.milestones[mark.at]) {
        game.milestones[mark.at] = true;
        showMilestone(mark);
        Sound.perfect(4 + index);
        game.shake = Math.max(game.shake, 2.4);
        const b = game.bird;
        spawnParticle({
          x: b.x,
          y: b.y,
          r: 28,
          color: mark.color,
          type: 'ring',
          life: 0.6,
        });
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * TAU;
          spawnParticle({
            x: b.x,
            y: b.y,
            vx: Math.cos(a) * rand(70, 210),
            vy: Math.sin(a) * rand(70, 210),
            r: rand(1.3, 2.8),
            color: i % 3 ? mark.color : '#fff9ec',
            type: 'spark',
            life: rand(0.35, 0.7),
            gravity: 80,
            vr: rand(-6, 6),
            alpha: 0.95,
          });
        }
      }
    });
  }
  function updateWorld(wdt, rdt) {
    const M = MODES[save.mode];
    const b = game.bird;
    game.speed = Math.min(M.speedMax, M.speed + game.score * 1.55);
    if (game.slow > 0) game.slow = Math.max(0, game.slow - rdt);
    if (game.magnet > 0) game.magnet = Math.max(0, game.magnet - rdt);
    if (game.invuln > 0) game.invuln = Math.max(0, game.invuln - rdt);
    if (game.coinChainTimer > 0) {
      game.coinChainTimer -= rdt;
      if (game.coinChainTimer <= 0) game.coinChain = 0;
    }
    b.vy = Math.min(780, b.vy + M.gravity * wdt);
    b.y += b.vy * wdt;
    b.rot = damp(b.rot, clamp(b.vy / 620, -0.52, 1.15), 11, wdt);
    b.wingSpeed = damp(b.wingSpeed, 9, 3.5, wdt);
    b.wing += wdt * b.wingSpeed;
    b.blink -= rdt;
    if (b.blink < 0) b.blink = rand(2.4, 5.4);
    if (b.y < 18) {
      b.y = 18;
      b.vy = Math.max(b.vy, 50);
    }
    game.trailAcc += wdt;
    if (game.trailAcc > 0.05 && game.particles.length < 240) {
      game.trailAcc = 0;
      const skin = skinById(save.skin);
      spawnParticle({
        x: b.x - 24,
        y: b.y + rand(-4, 6),
        vx: -game.speed * 0.2,
        vy: rand(-8, 8),
        r: rand(1.6, 3.2),
        color: skin.accent,
        type: 'puff',
        life: rand(0.35, 0.6),
        alpha: 0.28,
      });
    }
    game.spawnAcc += game.speed * wdt;
    const spacing = Math.max(196, M.spacing - game.score * 0.9);
    if (game.spawnAcc >= spacing) {
      game.spawnAcc = 0;
      spawnPipe(M);
    } // pipes
    for (const pipe of game.pipes) {
      pipe.x -= game.speed * wdt;
      if (pipe.drift > 0) {
        const lo = 96 + pipe.gap / 2;
        const hi = view.groundY - 86 - pipe.gap / 2;
        pipe.center = clamp(
          pipe.base + Math.sin(game.time * 1.15 + pipe.phase) * pipe.drift,
          lo,
          hi,
        );
      }
      if (!pipe.scored && pipe.x + PIPE_W * 0.5 < b.x) {
        pipe.scored = true;
        onPass(pipe);
      }
    } // pickups
    for (let i = game.coins.length - 1; i >= 0; i--) {
      const c = game.coins[i];
      c.x -= game.speed * wdt;
      if (game.magnet > 0) {
        const mx = b.x - c.x;
        const my = b.y - c.y;
        const dist = Math.hypot(mx, my);
        if (dist < 300 && dist > 1) {
          const pull = 820 * (1 - dist / 300) * wdt;
          c.x += (mx / dist) * pull;
          c.y += (my / dist) * pull;
          if (Math.random() < 0.06 && game.particles.length < 220) {
            spawnParticle({
              x: c.x,
              y: c.y,
              vx: rand(-20, 20),
              vy: rand(-20, 20),
              r: rand(1, 2),
              color: '#ffd166',
              type: 'spark',
              life: rand(0.2, 0.4),
              gravity: 0,
              vr: 0,
              alpha: 0.7,
            });
          }
        }
      }
      const dx = c.x - b.x,
        dy = c.y - b.y;
      if (dx * dx + dy * dy < 26 * 26) {
        collectCoin(c);
        game.coins.splice(i, 1);
      } else if (c.x < -40) {
        game.coins.splice(i, 1);
      }
    }
    for (let i = game.powerups.length - 1; i >= 0; i--) {
      const pu = game.powerups[i];
      pu.x -= game.speed * wdt;
      const dx = pu.x - b.x,
        dy = pu.y - b.y;
      if (dx * dx + dy * dy < 30 * 30) {
        collectPower(pu);
        game.powerups.splice(i, 1);
      } else if (pu.x < -50) {
        game.powerups.splice(i, 1);
      }
    }
    for (let i = game.pipes.length - 1; i >= 0; i--) {
      if (game.pipes[i].x + PIPE_W < -20) game.pipes.splice(i, 1);
    } // collisions
    if (game.scene !== 'playing') return;
    for (const pipe of game.pipes) {
      const gapTop = pipe.center - pipe.gap / 2;
      const gapBot = pipe.center + pipe.gap / 2;
      if (
        circleRect(b.x, b.y, 12.5, pipe.x, -80, PIPE_W, gapTop + 80) ||
        circleRect(
          b.x,
          b.y,
          12.5,
          pipe.x,
          gapBot,
          PIPE_W,
          view.groundY - gapBot,
        )
      ) {
        die('pipe');
        return;
      }
    }
    if (b.y + 12.5 >= view.groundY) {
      b.y = view.groundY - 12.5;
      die('ground');
    }
  }
  function updateDying(dt) {
    const b = game.bird;
    b.vy = Math.min(940, b.vy + 2100 * dt);
    b.y += b.vy * dt;
    b.rot += dt * 6.5;
    if (b.y > view.groundY - 14) {
      b.y = view.groundY - 14;
      if (b.vy > 200) {
        for (let i = 0; i < 8; i++) {
          spawnParticle({
            x: b.x + rand(-12, 12),
            y: b.y + 4,
            vx: rand(-100, 100),
            vy: rand(-90, -20),
            r: rand(2, 4.5),
            color: '#d8c3a5',
            type: 'puff',
            life: rand(0.3, 0.6),
            alpha: 0.5,
          });
        }
      }
      b.vy = 0;
    }
    game.deathTimer += dt;
    if (game.deathTimer > 0.92 && !game.deathHandled) {
      game.deathHandled = true;
      endRun();
    }
  }
  function updateTimeline(dt) {
    game.time += dt;
    if (game.scene === 'paused') return;
    game.day = (game.day + dt * 0.012) % 4;
    if (game.flash > 0) game.flash = Math.max(0, game.flash - dt * 2.4);
    if (game.shake > 0) game.shake = Math.max(0, game.shake - dt * 24);
    if (game.closePulse > 0)
      game.closePulse = Math.max(0, game.closePulse - dt * 2.4);
    game.scroll += (game.scene === 'playing' ? game.speed : 26) * dt;
    updateParticles(dt);
    updateFloaters(dt);
  }
  function tick(dt) {
    updateTimeline(dt);
    if (game.scene === 'paused') return;
    if (game.scene === 'playing') {
      if (game.hitstop > 0) {
        game.hitstop = Math.max(0, game.hitstop - dt);
        return;
      }
      const slow = game.slow > 0 ? 0.55 : 1;
      updateWorld(dt * slow, dt);
      updateHud();
    } else if (game.scene === 'dying') {
      updateDying(dt);
      updateHud();
    } else if (game.scene === 'over') {
      game.bird.wing += dt * 2;
    } else if (game.scene === 'menu' || game.scene === 'shop') {
      game.bird.wing += dt * 5;
      game.ambientAcc = (game.ambientAcc || 0) + dt;
      if (game.ambientAcc > 1.7) {
        game.ambientAcc = 0;
        const tints = ['#ffd166', '#ff9f7a', '#6ee7c8', '#c084fc'];
        spawnParticle({
          x: rand(view.playX, view.playX + W),
          y: rand(-20, view.vh * 0.4),
          vx: rand(-16, 16),
          vy: rand(12, 26),
          r: rand(2, 3.6),
          color: pick(tints),
          type: 'feather',
          life: rand(4, 7),
          rot: rand(0, TAU),
          vr: rand(-2, 2),
          alpha: 0.5,
        });
      }
    }
  }
  // -------------------------------------------------------------------- UI
  function shakeOn() {
    return !REDUCED && save.shake !== false;
  }
  function achValue(a) {
    switch (a.stat) {
      case 'runs':
        return save.runs;
      case 'best':
        return save.best;
      case 'perfects':
        return save.stats.perfects;
      case 'nearMisses':
        return save.stats.nearMisses;
      case 'powerups':
        return save.stats.powerups;
      case 'coinsEarned':
        return save.stats.coinsEarned;
      case 'bestFlow':
        return save.stats.bestFlow;
      case 'skinsOwned':
        return save.skins.length;
      default:
        return 0;
    }
  }
  function renderGoals() {
    if (!el.goalList) return;
    const done = ACHIEVEMENTS.filter((a) => save.achievements[a.id]).length;
    el.goalCount.textContent = `${done}/${ACHIEVEMENTS.length}`;
    el.goalList.innerHTML = ACHIEVEMENTS.map((a) => {
      const value = Math.min(a.goal, achValue(a));
      const complete = !!save.achievements[a.id];
      const pct = Math.round((value / a.goal) * 100);
      return `<div class="goal" data-done="${complete}" role="listitem">
        <span class="goal-mark" aria-hidden="true"></span>
        <div class="goal-info">
          <div class="goal-name">${a.name}</div>
          <div class="goal-desc">${a.desc} <span class="goal-progress">${complete ? 'Done' : `${value}/${a.goal}`}</span></div>
          <div class="goal-bar"><span style="width:${pct}%"></span></div>
        </div>
        <span class="goal-reward"><span class="coin-icon"></span>${a.reward}</span>
      </div>`;
    }).join('');
  }
  function checkAchievements() {
    const unlocked = [];
    for (const a of ACHIEVEMENTS) {
      if (save.achievements[a.id]) continue;
      if (achValue(a) >= a.goal) {
        save.achievements[a.id] = true;
        save.coins += a.reward;
        unlocked.push(a);
      }
    }
    if (!unlocked.length) return 0;
    persist();
    refreshMenu();
    updateCoinsHud();
    if (game.scene === 'goals') renderGoals();
    Sound.ensure();
    Sound.achievement();
    unlocked.forEach((a, i) => {
      setTimeout(
        () => {
          toast(`Goal complete — ${a.name} · +${a.reward} coins`, 2400, 'goal');
        },
        500 + i * 1600,
      );
    });
    return unlocked.length;
  }
  function applyAudioSettings() {
    Sound.setSfxLevel(save.sfx);
    Sound.setMusicVolume(save.music);
  }
  function syncSettingsUI() {
    const sfx = Math.round(save.sfx * 100);
    const music = Math.round(save.music * 100);
    if (el.sfxRange) el.sfxRange.value = String(sfx);
    if (el.musicRange) el.musicRange.value = String(music);
    if (el.sfxValue) el.sfxValue.textContent = `${sfx}%`;
    if (el.musicValue) el.musicValue.textContent = `${music}%`;
    if (el.btnHaptics)
      el.btnHaptics.setAttribute(
        'aria-pressed',
        save.haptics !== false ? 'true' : 'false',
      );
    if (el.btnShake)
      el.btnShake.setAttribute(
        'aria-pressed',
        save.shake !== false ? 'true' : 'false',
      );
  }
  function refreshMenu() {
    el.menuBest.textContent = save.best;
    el.menuModeBest.textContent = save.bestByMode[save.mode] || 0;
    el.menuModeLabel.textContent = MODES[save.mode].label + ' best';
    el.menuRuns.textContent = save.runs;
    el.menuCoins.textContent = save.coins;
    el.goalMenuCount.textContent = `${ACHIEVEMENTS.filter((a) => save.achievements[a.id]).length}/${ACHIEVEMENTS.length}`;
    el.modeNote.textContent = MODES[save.mode].note;
    $$('#menu .mode-btn').forEach((b) => {
      b.setAttribute(
        'aria-pressed',
        b.dataset.mode === save.mode ? 'true' : 'false',
      );
    });
    const soundBtn = $('#btnSound');
    if (soundBtn)
      soundBtn.setAttribute('aria-pressed', save.sound ? 'true' : 'false');
    el.soundLabel.textContent = save.sound ? 'Sound on' : 'Sound off';
  }
  function refreshSound() {
    Sound.setMuted(!save.sound);
    refreshMenu();
  }
  function updateScoreHud(pop) {
    if (el.score.textContent !== String(game.score)) {
      el.score.textContent = game.score;
      if (pop) {
        el.score.classList.remove('pop');
        void el.score.offsetWidth;
        el.score.classList.add('pop');
        clearTimeout(hudCache.popTimer);
        hudCache.popTimer = setTimeout(
          () => el.score.classList.remove('pop'),
          130,
        );
      }
    }
  }
  function updateCoinsHud() {
    const inRun =
      game.scene === 'playing' ||
      game.scene === 'dying' ||
      game.scene === 'paused';
    const shown = inRun ? game.coinsRun : save.coins;
    if (el.coins.textContent !== String(shown)) el.coins.textContent = shown;
    el.shopCoins.textContent = save.coins;
    el.menuCoins.textContent = save.coins;
  }
  const PU_ICONS = {
    shield:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5 18.5 6v5.2c0 4.1-2.6 7.2-6.5 8.8-3.9-1.6-6.5-4.7-6.5-8.8V6L12 3.5Z"/><path d="m9.2 11.8 1.9 1.9 3.8-3.8"/></svg>',
    slow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="7.3"/><path d="M12 7.6V12l3 1.8"/><path d="M9.2 3.2h5.6M9.2 20.8h5.6"/></svg>',
    magnet:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4v7a6 6 0 0 0 12 0V4h-4v7a2 2 0 0 1-4 0V4H6Z"/><path d="M6 7.2h4M14 7.2h4"/></svg>',
  };
  const TOAST_ICONS = {
    ...PU_ICONS,
    flow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m13.5 2.8-7 10.1h5.1l-1.1 8.3 7-10.6h-5.1l1.1-7.8Z"/></svg>',
    goal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h8v3.5a4 4 0 0 1-8 0V4Z"/><path d="M8 5.2H5v1.5a3 3 0 0 0 3 3M16 5.2h3v1.5a3 3 0 0 1-3 3M12 11.5V17M9 20h6"/></svg>',
  };
  const PU_CHIP_META = {
    shield: { label: 'Shield', max: 0, icon: PU_ICONS.shield },
    slow: { label: 'Slow-mo', max: 6, icon: PU_ICONS.slow },
    magnet: { label: 'Magnet', max: 7, icon: PU_ICONS.magnet },
  };
  const PU_CHIP_ORDER = ['shield', 'slow', 'magnet'];
  function powerupChipMarkup(type) {
    const meta = PU_CHIP_META[type];
    if (!meta) return '';
    const timer = meta.max > 0 ? `${game[type].toFixed(1)}s` : 'Armed';
    return `<span class="pu-chip pu-${type}" data-pu="${type}" style="--pu-progress:100%;order:${PU_CHIP_ORDER.indexOf(type)}">
      <span class="pu-icon" aria-hidden="true">${meta.icon}</span>
      <span class="pu-copy">
        <span class="pu-label">${meta.label}</span>
        <span class="pu-timer">${timer}</span>
      </span>
      <span class="pu-meter" aria-hidden="true"><span class="pu-fill"></span></span>
    </span>`;
  }
  function updatePowerupChips() {
    for (const type of PU_CHIP_ORDER) {
      const active = game[type] > 0;
      let chip = el.powerups.querySelector(`[data-pu="${type}"]`);
      if (!active) {
        if (chip) chip.remove();
        continue;
      }
      if (!chip) {
        el.powerups.insertAdjacentHTML('beforeend', powerupChipMarkup(type));
        chip = el.powerups.querySelector(`[data-pu="${type}"]`);
      }
      if (!chip) continue;
      const meta = PU_CHIP_META[type];
      const left = game[type];
      const progress = meta.max > 0 ? clamp(left / meta.max, 0, 1) : 1;
      chip.style.setProperty(
        '--pu-progress',
        `${(progress * 100).toFixed(1)}%`,
      );
      const timer = chip.querySelector('.pu-timer');
      const label = meta.max > 0 ? `${left.toFixed(1)}s` : 'Armed';
      if (timer && timer.textContent !== label) timer.textContent = label;
      chip.classList.toggle('pu-low', meta.max > 0 && left <= 2);
    }
  }
  let lastHudAt = 0;
  function updateHud(force) {
    const now = performance.now();
    if (!force && now - lastHudAt < 85) return;
    lastHudAt = now;
    updatePowerupChips();
    const combo =
      game.flow >= 5
        ? `PERFECT ×${game.flow} · 2× COINS`
        : game.flow >= 2
          ? `PERFECT ×${game.flow}`
          : '';
    if (combo !== hudCache.combo) {
      hudCache.combo = combo;
      if (!combo) {
        el.combo.hidden = true;
        el.combo.innerHTML = '';
        el.combo.classList.remove('combo-pop');
      } else {
        el.combo.dataset.hot = game.flow >= 5 ? 'true' : 'false';
        el.combo.innerHTML =
          game.flow >= 5
            ? `<span class="combo-main">Perfect ×${game.flow}</span> <span class="combo-bonus">2× coins</span>`
            : `<span class="combo-main">Perfect ×${game.flow}</span>`;
        el.combo.hidden = false;
        el.combo.classList.remove('combo-pop');
        void el.combo.offsetWidth;
        el.combo.classList.add('combo-pop');
      }
    }
    updateScoreHud(false);
    updateCoinsHud();
    Sound.setIntensity(
      game.scene === 'playing' ? Math.min(1, game.flow / 6) : 0,
    );
  }
  let toastTimer = 0;
  let toastHideTimer = 0;
  let scorePulseTimer = 0;
  function scheduleToastHide(ms) {
    clearTimeout(toastTimer);
    clearTimeout(toastHideTimer);
    toastTimer = setTimeout(() => {
      el.toast.classList.remove('show');
      toastHideTimer = setTimeout(() => {
        if (!el.toast.classList.contains('show')) {
          el.toast.hidden = true;
          el.toast.className = 'toast';
          el.toast.dataset.kind = '';
          delete el.toast.dataset.tier;
        }
      }, 320);
    }, ms);
  }
  function toast(message, ms, kind) {
    if (!el.toast) return;
    clearTimeout(toastTimer);
    clearTimeout(toastHideTimer);
    const icon = TOAST_ICONS[kind];
    const wasShown = el.toast.classList.contains('show');
    el.toast.className =
      'toast' + (wasShown ? ' show' : '') + (icon ? ' has-icon' : '');
    delete el.toast.dataset.tier;
    el.toast.dataset.kind = kind || '';
    el.toast.textContent = '';
    if (icon) {
      const iconEl = document.createElement('span');
      iconEl.className = 'toast-icon';
      iconEl.setAttribute('aria-hidden', 'true');
      iconEl.innerHTML = icon;
      el.toast.append(iconEl);
    }
    const copyEl = document.createElement('span');
    copyEl.className = 'toast-copy';
    copyEl.textContent = message;
    el.toast.append(copyEl);
    el.toast.hidden = false;
    requestAnimationFrame(() => el.toast.classList.add('show'));
    scheduleToastHide(ms || 1600);
  }
  function showMilestone(mark) {
    if (!el.toast || !el.score) return;
    clearTimeout(toastTimer);
    clearTimeout(toastHideTimer);
    el.toast.className = 'toast milestone-toast';
    el.toast.dataset.kind = 'milestone';
    el.toast.dataset.tier = mark.tier;
    el.toast.innerHTML = `
      <span class="milestone-badge" aria-hidden="true">
        <span class="milestone-number">${mark.at}</span>
        <span class="milestone-unit">PTS</span>
      </span>
      <span class="milestone-copy">
        <span class="milestone-kicker">Milestone</span>
        <strong class="milestone-title">${mark.title}</strong>
        <span class="milestone-sub">${mark.sub}</span>
      </span>
      <span class="milestone-shine" aria-hidden="true"></span>
    `;
    el.toast.hidden = false;
    void el.toast.offsetWidth;
    requestAnimationFrame(() => el.toast.classList.add('show'));
    scheduleToastHide(2200);
    el.score.style.setProperty('--pulse-color', mark.color);
    el.score.classList.remove('milestone-pulse');
    void el.score.offsetWidth;
    el.score.classList.add('milestone-pulse');
    clearTimeout(scorePulseTimer);
    scorePulseTimer = setTimeout(
      () => el.score.classList.remove('milestone-pulse'),
      760,
    );
  }
  const SCREEN_MAP = {
    menu: '#menu',
    shop: '#shop',
    goals: '#goals',
    settings: '#settings',
    paused: '#pause',
    over: '#over',
  };
  function setScene(scene) {
    game.scene = scene;
    document.body.dataset.scene = scene;
    for (const key in SCREEN_MAP) {
      const node = $(SCREEN_MAP[key]);
      if (!node) continue;
      const on = key === scene;
      node.hidden = !on;
      node.classList.toggle('visible', on);
    }
    el.pause.hidden = scene !== 'playing';
    const levels = {
      menu: 0.1,
      shop: 0.09,
      goals: 0.08,
      settings: 0.08,
      playing: 0.16,
      paused: 0.035,
      dying: 0.08,
      over: 0.07,
    };
    Sound.music(levels[scene] == null ? 0.1 : levels[scene]);
    Sound.setIntensity(scene === 'playing' ? Math.min(1, game.flow / 6) : 0);
    if (scene === 'shop') renderShop();
    if (scene === 'goals') renderGoals();
    if (scene === 'settings') syncSettingsUI();
    updateCoinsHud();
  }
  function resetIdleWorld() {
    game.pipes.length = 0;
    game.coins.length = 0;
    game.powerups.length = 0;
    game.floaters.length = 0;
    game.score = 0;
    game.flow = 0;
    game.bestFlow = 0;
    game.perfects = 0;
    game.nearMisses = 0;
    game.powerupsTaken = 0;
    game.coinsRun = 0;
    game.slow = 0;
    game.shield = 0;
    game.magnet = 0;
    game.closePulse = 0;
    game.invuln = 0;
    game.flash = 0;
    game.shake = 0;
    game.bird.y = view.vh * 0.42;
    game.bird.vy = 0;
    game.bird.rot = 0;
    game.bird.blink = 3;
    updateScoreHud(false);
    updateHud(true);
  }
  function startRun() {
    Sound.ensure();
    const M = MODES[save.mode];
    game.score = 0;
    game.flow = 0;
    game.bestFlow = 0;
    game.perfects = 0;
    game.nearMisses = 0;
    game.powerupsTaken = 0;
    game.coinsRun = 0;
    game.pipes.length = 0;
    game.coins.length = 0;
    game.powerups.length = 0;
    game.floaters.length = 0;
    game.particles.length = 0;
    game.speed = M.speed;
    game.spawnAcc = M.spacing * 0.35;
    game.pipesSincePower = 0;
    game.trailAcc = 0;
    game.coinChain = 0;
    game.coinChainTimer = 0;
    game.shield = 0;
    game.slow = 0;
    game.magnet = 0;
    game.closePulse = 0;
    game.invuln = 0;
    game.shake = 0;
    game.flash = 0;
    game.hitstop = 0;
    game.deathTimer = 0;
    game.deathHandled = false;
    game.flaps = 0;
    game.newBest = false;
    game.milestones = {};
    game.bestAtStart = save.best;
    game.modeBestAtStart = save.bestByMode[save.mode] || 0;
    const b = game.bird;
    b.x = view.birdX;
    b.y = clamp(view.vh * 0.4, 90, view.groundY - 140);
    b.vy = -150;
    b.rot = -0.2;
    b.wing = 0;
    b.wingSpeed = 16;
    b.blink = rand(2.5, 5);
    b.alive = true;
    el.powerups.innerHTML = '';
    hudCache.combo = '__reset__';
    setScene('playing');
    updateScoreHud(false);
    updateHud(true);
    Sound.music(0.16);
    Sound.select();
  }
  function resetAfterRun() {
    game.coinsRun = 0;
    game.pipes.length = 0;
    game.coins.length = 0;
    game.powerups.length = 0;
    game.shield = 0;
    game.slow = 0;
    game.magnet = 0;
    game.closePulse = 0;
  }
  function restartRun() {
    if (game.scene === 'paused') {
      endRun(true);
      startRun();
      return;
    }
    startRun();
  }
  function endRun(abandoned) {
    if (game.scene === 'over' || game.scene === 'menu') return;
    const score = game.score;
    const previousBest = save.bestByMode[save.mode] || 0;
    game.newBest = score > previousBest && score > 0;
    if (game.newBest) save.bestByMode[save.mode] = score;
    save.best = Math.max(save.best, score);
    save.runs += 1;
    save.coins += game.coinsRun;
    save.stats.perfects += game.perfects;
    save.stats.nearMisses += game.nearMisses;
    save.stats.powerups += game.powerupsTaken;
    save.stats.coinsEarned += game.coinsRun;
    save.stats.bestFlow = Math.max(save.stats.bestFlow, game.bestFlow);
    persist();
    checkAchievements();
    refreshMenu();
    updateCoinsHud();
    if (abandoned) {
      resetAfterRun();
      resetIdleWorld();
      setScene('menu');
      return;
    }
    el.finalScore.textContent = score;
    el.overBest.textContent = save.bestByMode[save.mode] || 0;
    el.overCoins.textContent = '+' + game.coinsRun;
    el.overPerfect.textContent = game.perfects;
    el.overStreak.textContent = game.bestFlow;
    el.overClose.textContent = game.nearMisses;
    el.overFlaps.textContent = game.flaps;
    if (game.newBest) {
      el.newBest.hidden = false;
      el.newBest.textContent =
        previousBest === 0
          ? 'First record!'
          : `New ${MODES[save.mode].label} best · +${score - previousBest}`;
    } else {
      el.newBest.hidden = true;
    }
    const medal = MEDALS.find((m) => score >= m.min);
    el.medal.dataset.tier = medal ? medal.tier : 'none';
    el.medal.textContent = medal ? medal.tier.toUpperCase() : '—';
    el.medalLabel.textContent = medal ? medal.label : 'Keep flapping';
    el.overTitle.textContent =
      score === 0
        ? 'Ouch.'
        : score >= 50
          ? 'Legendary.'
          : score >= 35
            ? 'So close to legend.'
            : score >= 20
              ? 'Smooth flying.'
              : score >= 10
                ? 'Getting good.'
                : 'Nice run';
    setScene('over');
    Sound.select();
    if (game.newBest) {
      spawnConfetti();
      setTimeout(() => Sound.best(), 240);
    }
    resetAfterRun();
    updateScoreHud(false);
    updateHud(true);
  }
  function quitToMenu() {
    resetAfterRun();
    resetIdleWorld();
    refreshMenu();
    setScene('menu');
  }
  function pauseGame() {
    if (game.scene !== 'playing') return;
    el.pauseScore.textContent = game.score;
    el.pauseFlow.textContent = game.bestFlow;
    el.pauseClose.textContent = game.nearMisses;
    el.pauseCoins.textContent = game.coinsRun;
    setScene('paused');
    el.combo.hidden = true;
  }
  function resumeGame() {
    if (game.scene !== 'paused') return;
    Sound.ensure();
    setScene('playing');
  }
  function spawnConfetti() {
    const colors = ['#ffd166', '#ff7a59', '#6ee7c8', '#a78bfa', '#fff6e8'];
    for (let i = 0; i < 70; i++) {
      spawnParticle({
        x: rand(view.playX, view.playX + W),
        y: rand(-80, -10),
        vx: rand(-70, 70),
        vy: rand(70, 240),
        r: rand(2.5, 5.2),
        color: pick(colors),
        type: 'confetti',
        life: rand(2, 3.4),
        gravity: 110,
        rot: rand(0, TAU),
        vr: rand(-9, 9),
        alpha: 0.95,
      });
    }
  }
  // ---------------------------------------------------------------- shop UI
  function renderShop() {
    el.skinGrid.innerHTML = '';
    shopPreviews = [];
    SKINS.forEach((skin, i) => {
      const owned = save.skins.includes(skin.id);
      const selected = save.skin === skin.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skin-card';
      btn.dataset.selected = selected ? 'true' : 'false';
      btn.dataset.locked = owned ? 'false' : 'true';
      btn.setAttribute(
        'aria-label',
        owned
          ? `Use ${skin.name}`
          : `Unlock ${skin.name} for ${skin.price} coins`,
      );
      const cv = document.createElement('canvas');
      cv.width = 116;
      cv.height = 116;
      cv.setAttribute('aria-hidden', 'true');
      btn.appendChild(cv);
      const name = document.createElement('span');
      name.className = 'skin-name';
      name.textContent = skin.name;
      btn.appendChild(name);
      if (!owned) {
        const price = document.createElement('span');
        price.className = 'skin-price';
        price.innerHTML = '<span class="coin-icon"></span>' + skin.price;
        btn.appendChild(price);
      }
      if (selected) {
        const badge = document.createElement('span');
        badge.className = 'skin-badge';
        badge.textContent = 'ON';
        btn.appendChild(badge);
      }
      btn.addEventListener('click', () => onSkinClick(skin));
      el.skinGrid.appendChild(btn);
      shopPreviews.push({ ctx: cv.getContext('2d'), skin, size: 116, i });
    });
    el.shopCoins.textContent = save.coins;
    el.shopHint.textContent =
      save.coins > 0
        ? `You have ${save.coins} coins.`
        : 'Coins are earned in every run.';
  }
  function onSkinClick(skin) {
    Sound.ensure();
    const owned = save.skins.includes(skin.id);
    if (owned) {
      if (save.skin !== skin.id) {
        save.skin = skin.id;
        persist();
        Sound.select();
        renderShop();
        toast(skin.name + ' equipped');
      } else {
        Sound.click();
      }
      return;
    }
    if (save.coins >= skin.price) {
      save.coins -= skin.price;
      save.skins.push(skin.id);
      save.skin = skin.id;
      persist();
      Sound.power();
      checkAchievements();
      renderShop();
      updateCoinsHud();
      refreshMenu();
      toast(skin.name + ' unlocked!');
    } else {
      Sound.click();
      toast(`Need ${skin.price - save.coins} more coins`);
    }
  }
  function openShop(from) {
    shopReturn = from;
    Sound.ensure();
    Sound.click();
    setScene('shop');
  }
  function closeShop() {
    Sound.click();
    if (shopReturn === 'over') {
      setScene('over');
    } else {
      resetIdleWorld();
      setScene('menu');
    }
  }
  function openGoals() {
    Sound.ensure();
    Sound.click();
    renderGoals();
    setScene('goals');
  }
  function closeGoals() {
    Sound.click();
    setScene('menu');
  }
  function openSettings() {
    Sound.ensure();
    Sound.click();
    syncSettingsUI();
    setScene('settings');
  }
  function closeSettings() {
    Sound.click();
    setScene('menu');
  }
  // ------------------------------------------------------------------ input
  function onKey(e) {
    const k = e.code;
    const tag = e.target && e.target.tagName;
    const activating =
      tag === 'BUTTON' ||
      tag === 'A' ||
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT';
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') {
      if (activating && (k === 'Space' || k === 'Enter')) return;
      if (game.scene === 'playing') {
        e.preventDefault();
        flap();
        return;
      }
      if (game.scene === 'menu') {
        e.preventDefault();
        startRun();
        return;
      }
      if (game.scene === 'over') {
        e.preventDefault();
        startRun();
        return;
      }
      if (game.scene === 'paused') {
        e.preventDefault();
        resumeGame();
        return;
      }
    }
    if (k === 'Escape' || k === 'KeyP') {
      if (game.scene === 'playing') {
        e.preventDefault();
        pauseGame();
      } else if (game.scene === 'paused') {
        e.preventDefault();
        resumeGame();
      } else if (game.scene === 'shop') {
        e.preventDefault();
        closeShop();
      } else if (game.scene === 'goals') {
        e.preventDefault();
        closeGoals();
      } else if (game.scene === 'settings') {
        e.preventDefault();
        closeSettings();
      } else if (game.scene === 'over') {
        e.preventDefault();
        quitToMenu();
      } else if (game.scene === 'menu') {
        /* nothing */
      }
    }
    if (k === 'KeyR' && (game.scene === 'over' || game.scene === 'paused')) {
      e.preventDefault();
      restartRun();
    }
    if (k === 'KeyM') {
      save.sound = !save.sound;
      persist();
      refreshSound();
      if (save.sound) {
        Sound.ensure();
        Sound.click();
      }
    }
  }
  function bindUI() {
    $('#btnPlay').addEventListener('click', () => startRun());
    $('#btnPause').addEventListener('click', () => pauseGame());
    $('#btnResume').addEventListener('click', () => resumeGame());
    $('#btnRestart').addEventListener('click', () => restartRun());
    $('#btnQuit').addEventListener('click', () => endRun(true));
    $('#btnRetry').addEventListener('click', () => startRun());
    $('#btnOverMenu').addEventListener('click', () => quitToMenu());
    $('#btnOverShop').addEventListener('click', () => openShop('over'));
    $('#btnShop').addEventListener('click', () => openShop('menu'));
    $('#btnShopBack').addEventListener('click', () => closeShop());
    $('#btnGoals').addEventListener('click', () => openGoals());
    $('#btnGoalsBack').addEventListener('click', () => closeGoals());
    $('#btnSettings').addEventListener('click', () => openSettings());
    $('#btnSettingsBack').addEventListener('click', () => closeSettings());
    const onVolume = (which, value) => {
      const v = clamp(Number(value) / 100, 0, 1);
      save[which] = v;
      persist();
      applyAudioSettings();
      syncSettingsUI();
    };
    el.sfxRange.addEventListener('input', (e) =>
      onVolume('sfx', e.target.value),
    );
    el.musicRange.addEventListener('input', (e) =>
      onVolume('music', e.target.value),
    );
    el.btnHaptics.addEventListener('click', () => {
      save.haptics = save.haptics === false;
      persist();
      syncSettingsUI();
      Sound.ensure();
      Sound.click();
    });
    el.btnShake.addEventListener('click', () => {
      save.shake = save.shake === false;
      persist();
      syncSettingsUI();
      Sound.ensure();
      Sound.click();
    });
    $('#btnSound').addEventListener('click', () => {
      save.sound = !save.sound;
      persist();
      Sound.ensure();
      refreshSound();
      if (save.sound) Sound.click();
      toast(save.sound ? 'Sound on' : 'Sound off', 900);
    });
    $$('#menu .mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (!MODES[mode] || save.mode === mode) return;
        save.mode = mode;
        persist();
        refreshMenu();
        Sound.ensure();
        Sound.click();
      });
    });
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (game.scene === 'playing') flap();
    });
    $('#menu').addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, a, input, .mode-picker')) return;
      startRun();
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', () => {
      resize();
      if (game.scene === 'playing' || game.scene === 'paused') {
        game.pipes.forEach((p) => {
          const lo = 96 + p.gap / 2;
          const hi = view.groundY - 86 - p.gap / 2;
          p.center = clamp(p.center, lo, hi);
          p.base = clamp(p.base, lo, hi);
        });
        game.bird.y = clamp(game.bird.y, 30, view.groundY - 30);
      }
      updateHud(true);
    });
    window.addEventListener('orientationchange', () =>
      setTimeout(() => {
        resize();
        updateHud(true);
      }, 120),
    );
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && game.scene === 'playing') pauseGame();
    });
    window.addEventListener('pointerdown', () => Sound.ensure(), {
      once: true,
    });
    window.addEventListener('keydown', () => Sound.ensure(), { once: true });
  }
  // ------------------------------------------------------------------- loop
  let lastFrame = performance.now();
  let accumulator = 0;
  function frame(now) {
    const raw = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;
    accumulator += raw;
    let guard = 0;
    while (accumulator >= STEP && guard < 14) {
      accumulator -= STEP;
      tick(STEP);
      guard++;
    }
    if (guard >= 14) accumulator = 0;
    render(now / 1000);
    requestAnimationFrame(frame);
  }
  function init() {
    resize();
    game.bird.y = view.vh * 0.42;
    applyAudioSettings();
    refreshMenu();
    refreshSound();
    bindUI();
    setScene('menu');
    updateCoinsHud();
    updateHud(true);
    requestAnimationFrame(frame);
  }
  init();
})();
