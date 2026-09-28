// ==========================================
// VERTICAL TOWER DEFENSE GAME ENGINE (9:16)
// ==========================================

(function() {
  'use strict';

  // --- AUDIO SYNTHESIS ENGINE (Web Audio API) ---
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      const savedVol = localStorage.getItem('vtd_master_volume');
      this.masterVolume = savedVol !== null ? Math.max(0, Math.min(1, parseFloat(savedVol))) : 0.70;
      this.sfxEnabled = true;
      this.musicEnabled = true;
      this.musicTimer = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
          this.masterGain.connect(this.ctx.destination);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      if (this.ctx && this.masterGain) {
        this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      }
    }

    setMasterVolume(val) {
      this.masterVolume = Math.max(0, Math.min(1, val));
      localStorage.setItem('vtd_master_volume', this.masterVolume.toString());
      if (this.ctx && this.masterGain) {
        this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      }
    }

    playTone(freq, type, duration, vol = 0.2, freqEnd = null) {
      if (!this.sfxEnabled || this.masterVolume <= 0.001) return;
      this.init();
      if (!this.ctx || !this.masterGain) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (freqEnd !== null) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(10, freqEnd), this.ctx.currentTime + duration);
        }
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    }

    playNoise(duration, vol = 0.2) {
      if (!this.sfxEnabled || this.masterVolume <= 0.001) return;
      this.init();
      if (!this.ctx || !this.masterGain) return;
      try {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        noise.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
      } catch (e) {}
    }

    // --- SOUND EFFECTS ---
    arrowShoot() { this.playTone(650, 'triangle', 0.1, 0.12, 350); }
    cannonShoot() {
      this.playTone(130, 'sawtooth', 0.35, 0.25, 40);
      this.playNoise(0.28, 0.25);
    }
    magicShoot() { this.playTone(480, 'sine', 0.2, 0.15, 780); }
    lightningShoot() {
      this.playTone(850, 'square', 0.18, 0.15, 120);
      this.playNoise(0.12, 0.15);
    }
    enemyHit() { this.playTone(280, 'sine', 0.08, 0.1, 150); }
    enemyDeath() { this.playTone(180, 'triangle', 0.2, 0.15, 60); }
    coinCollect() {
      this.playTone(987, 'sine', 0.08, 0.15);
      setTimeout(() => this.playTone(1318, 'sine', 0.12, 0.15), 60);
    }
    lifeLost() {
      this.playTone(220, 'sawtooth', 0.35, 0.25, 80);
    }
    castleDamage() {
      this.playTone(90, 'sawtooth', 0.45, 0.35, 30);
      this.playNoise(0.4, 0.3);
    }
    waveHorn() {
      this.playTone(330, 'sawtooth', 0.5, 0.2, 440);
      setTimeout(() => this.playTone(440, 'sawtooth', 0.7, 0.2, 554), 200);
    }
    bossSpawn() {
      this.playTone(70, 'sawtooth', 0.7, 0.38, 45);
      this.playNoise(0.5, 0.3);
      setTimeout(() => this.playTone(105, 'sawtooth', 0.6, 0.32, 50), 220);
    }
    bossRoar() {
      this.playTone(115, 'sawtooth', 0.45, 0.3, 50);
      this.playNoise(0.35, 0.25);
    }
    victorySound() {
      const fanfare = [
        [523.25, 0.14], // C5
        [659.25, 0.14], // E5
        [783.99, 0.18], // G5
        [1046.50, 0.65] // C6
      ];
      fanfare.forEach(([f, dur], idx) => {
        setTimeout(() => this.playTone(f, 'triangle', dur, 0.35), idx * 130);
      });
    }
    gameOverSound() {
      const somber = [
        [261.63, 0.28], // C4
        [207.65, 0.32], // G#3
        [196.00, 0.38], // G3
        [174.61, 0.65]  // F3
      ];
      somber.forEach(([f, dur], idx) => {
        setTimeout(() => this.playTone(f, 'sawtooth', dur, 0.28, f * 0.85), idx * 230);
      });
    }
    buttonClick() { this.playTone(400, 'sine', 0.05, 0.08, 600); }
    upgradeSound() {
      this.playTone(523, 'sine', 0.1, 0.15);
      setTimeout(() => this.playTone(659, 'sine', 0.1, 0.15), 70);
      setTimeout(() => this.playTone(784, 'sine', 0.15, 0.15), 140);
    }

    startMusic() {
      if (!this.musicEnabled || this.musicTimer || this.masterVolume <= 0.001) return;
      const notes = [220, 261, 293, 329, 392, 440, 392, 329];
      let step = 0;
      this.musicTimer = setInterval(() => {
        if (!this.musicEnabled || !this.ctx || this.masterVolume <= 0.001) return;
        const freq = notes[step % notes.length];
        this.playTone(freq, 'sine', 0.35, 0.04);
        step++;
      }, 500);
    }

    stopMusic() {
      if (this.musicTimer) {
        clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
    }
  }

  // --- 100 PROGRESSIVE TASKS GENERATOR ---
  function generate100Tasks() {
    const list = [];
    // Task 1: Citadel Oath (claimable immediately)
    list.push({ id: 't_init', name: 'Citadel Oath', desc: 'Report for duty and accept commission', target: 1, current: 1, reward: 150, claimed: false, type: 'init' });

    // 24 Kills tiers
    const killTiers = [
      [5, 40], [15, 60], [30, 90], [50, 120], [75, 160],
      [100, 200], [150, 250], [200, 300], [300, 400], [400, 500],
      [500, 600], [650, 750], [800, 900], [1000, 1100], [1250, 1300],
      [1500, 1600], [2000, 2000], [2500, 2500], [3000, 3000], [4000, 4000],
      [5000, 5000], [6500, 6500], [8000, 8000], [10000, 10000]
    ];
    killTiers.forEach(([t, r]) => {
      list.push({ id: `t_kill_${t}`, name: `Kill ${t} Enemies`, desc: `Defeat ${t} monster invaders`, target: t, current: 0, reward: r, claimed: false, type: 'kills' });
    });

    // 25 Waves tiers
    const waveTiers = [
      [1, 50], [2, 75], [3, 100], [4, 125], [5, 160],
      [6, 190], [7, 220], [8, 260], [9, 300], [10, 350],
      [12, 420], [14, 500], [16, 600], [18, 700], [20, 850],
      [25, 1000], [30, 1200], [35, 1450], [40, 1700], [45, 2000],
      [50, 2400], [60, 3000], [70, 3700], [80, 4500], [100, 6000]
    ];
    waveTiers.forEach(([w, r]) => {
      list.push({ id: `t_wave_${w}`, name: `Complete Wave ${w}`, desc: `Survive defense wave ${w}`, target: w, current: 0, reward: r, claimed: false, type: 'waves' });
    });

    // 15 Builds tiers
    const buildTiers = [
      [1, 40], [3, 70], [5, 110], [8, 150], [12, 200],
      [16, 260], [20, 320], [25, 400], [30, 500], [40, 650],
      [50, 850], [75, 1200], [100, 1600], [150, 2400], [200, 3500]
    ];
    buildTiers.forEach(([b, r]) => {
      list.push({ id: `t_bld_${b}`, name: `Build ${b} Towers`, desc: `Place ${b} towers on pedestals`, target: b, current: 0, reward: r, claimed: false, type: 'builds' });
    });

    // 15 Upgrades tiers
    const upgTiers = [
      [1, 50], [3, 90], [5, 130], [8, 180], [12, 240],
      [16, 320], [20, 400], [25, 500], [30, 650], [40, 850],
      [50, 1100], [75, 1500], [100, 2000], [150, 2800], [200, 4000]
    ];
    upgTiers.forEach(([u, r]) => {
      list.push({ id: `t_upg_${u}`, name: `Upgrade Towers ${u} Times`, desc: `Rank up defenses ${u} times`, target: u, current: 0, reward: r, claimed: false, type: 'upgrades' });
    });

    // 10 Bosses tiers
    const bossTiers = [
      [1, 250], [2, 400], [3, 600], [5, 900], [7, 1300],
      [10, 1800], [15, 2600], [20, 3500], [30, 5000], [50, 8000]
    ];
    bossTiers.forEach(([bo, r]) => {
      list.push({ id: `t_boss_${bo}`, name: `Defeat ${bo} Bosses`, desc: `Vanquish ${bo} titan bosses`, target: bo, current: 0, reward: r, claimed: false, type: 'bosses' });
    });

    // 10 Earnings tiers (Total: 1 + 24 + 25 + 15 + 15 + 10 + 10 = 100)
    const earnTiers = [
      [200, 80], [500, 150], [1000, 250], [2000, 450], [5000, 900],
      [10000, 1600], [20000, 2800], [50000, 6000], [100000, 11000], [200000, 22000]
    ];
    earnTiers.forEach(([e, r]) => {
      list.push({ id: `t_earn_${e}`, name: `Earn Rs ${e.toLocaleString()}`, desc: `Collect Rs ${e.toLocaleString()} in combat`, target: e, current: 0, reward: r, claimed: false, type: 'earnings' });
    });

    return list;
  }

  // --- 100 PROGRESSIVE CHALLENGES GENERATOR ---
  function generate100Challenges() {
    const list = [];
    // 20 Wave Endurance
    const waveChs = [
      [2, 100], [4, 150], [6, 200], [8, 250], [10, 350],
      [12, 450], [14, 550], [16, 700], [18, 850], [20, 1000],
      [22, 1200], [25, 1500], [28, 1800], [30, 2200], [35, 2700],
      [40, 3300], [45, 4000], [50, 5000], [65, 6500], [80, 8500]
    ];
    waveChs.forEach(([w, r]) => {
      list.push({ id: `c_surv_${w}`, name: `Survive ${w} Waves`, desc: `Endure across ${w} battle waves`, target: w, current: 0, reward: r, claimed: false, type: 'waves' });
    });

    // 20 Flawless Defense (full 20 lives)
    const flawChs = [
      [1, 120], [2, 180], [3, 250], [4, 320], [5, 420],
      [6, 520], [7, 650], [8, 800], [9, 950], [10, 1150],
      [12, 1400], [14, 1700], [16, 2050], [18, 2450], [20, 2900],
      [25, 3600], [30, 4400], [35, 5300], [40, 6400], [50, 8000]
    ];
    flawChs.forEach(([f, r]) => {
      list.push({ id: `c_flaw_${f}`, name: `Flawless Defense ${f}`, desc: `Complete ${f} waves with castle at 100/100 health`, target: f, current: 0, reward: r, claimed: false, type: 'perfect' });
    });

    // 20 Carnage Milestones
    const killChs = [
      [20, 100], [50, 180], [100, 300], [200, 500], [350, 750],
      [500, 1000], [750, 1350], [1000, 1750], [1500, 2300], [2000, 2900],
      [2500, 3600], [3000, 4400], [4000, 5500], [5000, 6800], [6500, 8200],
      [8000, 9800], [10000, 11800], [12500, 14000], [15000, 17000], [20000, 22000]
    ];
    killChs.forEach(([k, r]) => {
      list.push({ id: `c_kill_${k}`, name: `Carnage: ${k} Kills`, desc: `Destroy ${k} enemy monsters`, target: k, current: 0, reward: r, claimed: false, type: 'kills' });
    });

    // 15 Titan Slayers
    const bossChs = [
      [1, 300], [2, 500], [3, 750], [4, 1050], [5, 1400],
      [6, 1800], [7, 2250], [8, 2750], [10, 3400], [12, 4200],
      [15, 5200], [20, 6500], [25, 8000], [35, 10500], [50, 15000]
    ];
    bossChs.forEach(([b, r]) => {
      list.push({ id: `c_boss_${b}`, name: `Titan Slayer ${b}`, desc: `Slay ${b} wave bosses`, target: b, current: 0, reward: r, claimed: false, type: 'bosses' });
    });

    // 10 Grand Architect (Level 3 towers)
    const archChs = [
      [1, 200], [2, 350], [3, 550], [4, 800], [5, 1100],
      [6, 1500], [7, 2000], [8, 2600], [10, 3500], [12, 5000]
    ];
    archChs.forEach(([a, r]) => {
      list.push({ id: `c_arch_${a}`, name: `Master Builder ${a}`, desc: `Own ${a} Level 3 towers simultaneously`, target: a, current: 0, reward: r, claimed: false, type: 'max_towers' });
    });

    // 15 Speed Rush (Total: 20 + 20 + 20 + 15 + 10 + 15 = 100)
    const spdChs = [
      [1, 150], [2, 250], [3, 380], [4, 520], [5, 700],
      [6, 900], [8, 1200], [10, 1600], [12, 2100], [15, 2700],
      [20, 3500], [25, 4500], [30, 5800], [40, 7500], [50, 10000]
    ];
    spdChs.forEach(([s, r]) => {
      list.push({ id: `c_spd_${s}`, name: `Rapid Cleansing ${s}`, desc: `Clear ${s} fast combat waves`, target: s, current: 0, reward: r, claimed: false, type: 'speed' });
    });

    return list;
  }

  // --- DIFFICULTY CONFIGURATION ---
  const DIFFICULTY_CONFIG = {
    easy: {
      id: 'easy',
      name: 'EASY',
      enemyHpMultiplier: 0.8,
      enemyCastleDamageMultiplier: 0.7,
      spawnInterval: 1.4,
      enemySpeedMultiplier: 0.75,
      towerDamageMultiplier: 1.0,
      startingCastleHealth: 100,
      desc: '<strong>EASY:</strong> Enemy HP: Low | Castle Dmg: Low | Speed: Very Slow | Spawns: Slow. Suitable for beginners.'
    },
    normal: {
      id: 'normal',
      name: 'NORMAL',
      enemyHpMultiplier: 1.0,
      enemyCastleDamageMultiplier: 1.0,
      spawnInterval: 1.0,
      enemySpeedMultiplier: 0.95,
      towerDamageMultiplier: 1.0,
      startingCastleHealth: 100,
      desc: '<strong>NORMAL:</strong> Enemy HP: Medium | Castle Dmg: Medium | Speed: Slow | Spawns: Medium. Standard balanced challenge.'
    },
    hard: {
      id: 'hard',
      name: 'HARD',
      enemyHpMultiplier: 1.35,
      enemyCastleDamageMultiplier: 1.5,
      spawnInterval: 0.75,
      enemySpeedMultiplier: 1.2,
      towerDamageMultiplier: 0.85,
      startingCastleHealth: 100,
      desc: '<strong>HARD:</strong> Enemy HP: High | Castle Dmg: High | Speed: Slow-to-medium | Spawns: Fast | Tower Dmg: Slightly reduced.'
    }
  };

  // --- GRAPHICS CONFIGURATION ---
  const GRAPHICS_CONFIG = {
    low: {
      id: 'low',
      name: 'LOW',
      particleMultiplier: 0.35,
      particleLifeMultiplier: 0.65,
      enhancedTowerEffects: false,
      enhancedEnemyEffects: false,
      enhancedBossEffects: false,
      detailedAnimations: false,
      desc: '<strong>LOW:</strong> Reduced particles • Reduced visual effects • Lower animation complexity • Best performance'
    },
    medium: {
      id: 'medium',
      name: 'MEDIUM',
      particleMultiplier: 1.0,
      particleLifeMultiplier: 1.0,
      enhancedTowerEffects: false,
      enhancedEnemyEffects: false,
      enhancedBossEffects: true,
      detailedAnimations: true,
      desc: '<strong>MEDIUM:</strong> Normal particles • Normal animations • Normal effects'
    },
    high: {
      id: 'high',
      name: 'HIGH',
      particleMultiplier: 1.9,
      particleLifeMultiplier: 1.4,
      enhancedTowerEffects: true,
      enhancedEnemyEffects: true,
      enhancedBossEffects: true,
      detailedAnimations: true,
      desc: '<strong>HIGH:</strong> Maximum particles • Detailed animations • Enhanced tower effects • Enhanced enemy effects • Enhanced boss effects • Higher-quality visual effects'
    }
  };

  // --- PERSISTENCE & STORAGE ---
  const Storage = {
    load() {
      try {
        const raw = localStorage.getItem('vtd_save_data');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            // Guarantee exactly 100 tasks and 100 challenges
            if (!parsed.tasks || parsed.tasks.length < 100) {
              const fresh = generate100Tasks();
              const oldMap = new Map((parsed.tasks || []).map(t => [t.id, t]));
              parsed.tasks = fresh.map(f => {
                const old = oldMap.get(f.id);
                return old ? { ...f, current: old.current, claimed: old.claimed } : f;
              });
            }
            if (!parsed.challenges || parsed.challenges.length < 100) {
              const fresh = generate100Challenges();
              const oldMap = new Map((parsed.challenges || []).map(c => [c.id, c]));
              parsed.challenges = fresh.map(f => {
                const old = oldMap.get(f.id);
                return old ? { ...f, current: old.current, claimed: old.claimed } : f;
              });
            }
            if (!parsed.settings) parsed.settings = {};
            if (!parsed.settings.difficulty) {
              parsed.settings.difficulty = localStorage.getItem('vtd_difficulty') || 'easy';
            }
            if (!parsed.settings.quality) {
              parsed.settings.quality = localStorage.getItem('vtd_graphics_quality') || 'medium';
            }
            // Ensure valid money number
            if (typeof parsed.money !== 'number') parsed.money = 0;
            return parsed;
          }
        }
      } catch (e) {}

      // Initial First-Time Save: STARTING MONEY MUST BE EXACTLY Rs 0
      const initialData = {
        playerName: "Your Player",
        playerPicture: "",
        money: 0,
        tasks: generate100Tasks(),
        challenges: generate100Challenges(),
        settings: {
          music: true,
          sfx: true,
          quality: localStorage.getItem('vtd_graphics_quality') || "medium",
          difficulty: localStorage.getItem('vtd_difficulty') || "easy"
        },
        totalKills: 0,
        highestWave: 0,
        totalPlayingTime: 0,
        towersBuilt: 0,
        towersUpgraded: 0,
        bossesDefeated: 0,
        totalMoneyEarned: 0,
        perfectWavesCount: 0,
        speedWavesCount: 0
      };
      this.save(initialData);
      return initialData;
    },
    save(data) {
      try {
        localStorage.setItem('vtd_save_data', JSON.stringify(data));
      } catch (e) {}
    },
    resetAll() {
      localStorage.removeItem('vtd_save_data');
      localStorage.removeItem('vtd_money');
      localStorage.removeItem('vtd_player_name');
      localStorage.removeItem('vtd_player_avatar');
      localStorage.removeItem('vtd_tasks');
      localStorage.removeItem('vtd_challenges');
      localStorage.removeItem('vtd_settings');
      localStorage.removeItem('vtd_difficulty');
      localStorage.removeItem('vtd_graphics_quality');
      localStorage.removeItem('vtd_master_volume');
      return this.load();
    }
  };

  // --- GAME CONSTANTS & DEFINITIONS ---
  const LOGICAL_WIDTH = 360;
  const LOGICAL_HEIGHT = 640;

  // The long winding path: 13 waypoints covering the vertical screen in switchbacks
  const PATH_WAYPOINTS = [
    { x: 180, y: -20 },
    { x: 180, y: 45 },
    { x: 300, y: 45 },
    { x: 300, y: 140 },
    { x: 60,  y: 140 },
    { x: 60,  y: 235 },
    { x: 300, y: 235 },
    { x: 300, y: 330 },
    { x: 60,  y: 330 },
    { x: 60,  y: 425 },
    { x: 300, y: 425 },
    { x: 300, y: 515 },
    { x: 180, y: 515 },
    { x: 180, y: 600 }
  ];

  // Pre-calculated segment lengths and total path length
  let TOTAL_PATH_LENGTH = 0;
  const PATH_SEGMENTS = [];
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const p1 = PATH_WAYPOINTS[i];
    const p2 = PATH_WAYPOINTS[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    PATH_SEGMENTS.push({ p1, p2, len, startDist: TOTAL_PATH_LENGTH });
    TOTAL_PATH_LENGTH += len;
  }

  function getPositionAlongPath(dist) {
    if (dist <= 0) return { x: PATH_WAYPOINTS[0].x, y: PATH_WAYPOINTS[0].y, angle: 0 };
    if (dist >= TOTAL_PATH_LENGTH) {
      const last = PATH_WAYPOINTS[PATH_WAYPOINTS.length - 1];
      return { x: last.x, y: last.y, angle: Math.PI / 2 };
    }
    for (let seg of PATH_SEGMENTS) {
      if (dist >= seg.startDist && dist <= seg.startDist + seg.len) {
        const segDist = dist - seg.startDist;
        const t = segDist / seg.len;
        const x = seg.p1.x + (seg.p2.x - seg.p1.x) * t;
        const y = seg.p1.y + (seg.p2.y - seg.p1.y) * t;
        const angle = Math.atan2(seg.p2.y - seg.p1.y, seg.p2.x - seg.p1.x);
        return { x, y, angle };
      }
    }
    return { x: 180, y: 600, angle: 0 };
  }

  // Pre-placed strategic stone pedestal slots beside the road
  const TOWER_SLOTS = [
    { id: 1,  x: 100, y: 92 },
    { id: 2,  x: 230, y: 92 },
    { id: 3,  x: 180, y: 187 },
    { id: 4,  x: 100, y: 282 },
    { id: 5,  x: 230, y: 282 },
    { id: 6,  x: 180, y: 377 },
    { id: 7,  x: 100, y: 470 },
    { id: 8,  x: 230, y: 470 },
    { id: 9,  x: 40,  y: 80 },
    { id: 10, x: 320, y: 190 },
    { id: 11, x: 40,  y: 380 },
    { id: 12, x: 320, y: 470 }
  ];

  // Tower Configurations
  const TOWER_CONFIGS = {
    archer: {
      name: 'Archer Tower',
      icon: '🏹',
      cost: 100,
      baseDamage: 22,
      baseRange: 110,
      fireInterval: 0.55,
      color: '#22c55e',
      desc: 'Rapid physical arrows'
    },
    cannon: {
      name: 'Cannon Tower',
      icon: '💣',
      cost: 150,
      baseDamage: 55,
      baseRange: 85,
      fireInterval: 1.4,
      splashRadius: 42,
      color: '#ef4444',
      desc: 'Heavy explosive splash'
    },
    magic: {
      name: 'Magic Tower',
      icon: '🔮',
      cost: 175,
      baseDamage: 28,
      baseRange: 100,
      fireInterval: 0.85,
      slowFactor: 0.55,
      slowDuration: 2.2,
      color: '#8b5cf6',
      desc: 'Frost magic slows enemies'
    },
    lightning: {
      name: 'Lightning Tower',
      icon: '⚡',
      cost: 225,
      baseDamage: 52,
      baseRange: 115,
      fireInterval: 1.1,
      chainCount: 3,
      color: '#f59e0b',
      desc: 'Chain lightning attacks'
    }
  };

  // Enemy Types
  const ENEMY_TYPES = {
    basic: {
      name: 'Goblin Scout',
      color: '#10b981',
      icon: '👺',
      radius: 9,
      baseHp: 75,
      speed: 1.05,
      baseCastleDamage: 5,
      reward: 15,
      flying: false
    },
    fast: {
      name: 'Shadow Imp',
      color: '#f97316',
      icon: '🐺',
      radius: 8,
      baseHp: 50,
      speed: 1.85,
      baseCastleDamage: 4,
      reward: 25,
      flying: false
    },
    heavy: {
      name: 'Armored Orc',
      color: '#64748b',
      icon: '🐗',
      radius: 13,
      baseHp: 240,
      speed: 0.65,
      baseCastleDamage: 10,
      reward: 50,
      flying: false
    },
    flying: {
      name: 'Winged Harpy',
      color: '#a855f7',
      icon: '🦇',
      radius: 10,
      baseHp: 90,
      speed: 1.3,
      baseCastleDamage: 6,
      reward: 35,
      flying: true
    },
    boss: {
      name: 'Void Behemoth',
      color: '#dc2626',
      icon: '👹',
      radius: 18,
      baseHp: 800,
      speed: 0.48,
      baseCastleDamage: 25,
      reward: 300,
      flying: false,
      isBoss: true
    },
    finalBoss: {
      name: 'Void Behemoth Supreme',
      color: '#7f1d1d',
      icon: '👑',
      radius: 24,
      baseHp: 3800,
      speed: 0.42,
      baseCastleDamage: 50,
      reward: 2500,
      flying: false,
      isBoss: true,
      isFinalBoss: true
    }
  };

  // --- STATE OF CURRENT GAMEPLAY ---
  class GameState {
    constructor() {
      this.sound = new SoundManager();
      this.saveData = Storage.load();
      this.money = typeof this.saveData.money === 'number' ? this.saveData.money : 0;
      this.playerName = this.saveData.playerName || "Your Player";
      this.playerAvatar = this.saveData.playerPicture || "";
      this.tasks = this.saveData.tasks;
      this.challenges = this.saveData.challenges;
      this.settings = this.saveData.settings || { music: true, sfx: true, quality: "medium", difficulty: "easy" };
      this.difficulty = this.settings.difficulty || localStorage.getItem('vtd_difficulty') || 'easy';

      this.totalKills = this.saveData.totalKills || 0;
      this.highestWave = this.saveData.highestWave || 0;
      this.totalPlayingTime = this.saveData.totalPlayingTime || 0;
      this.towersBuilt = this.saveData.towersBuilt || 0;
      this.towersUpgraded = this.saveData.towersUpgraded || 0;
      this.bossesDefeated = this.saveData.bossesDefeated || 0;
      this.totalMoneyEarned = this.saveData.totalMoneyEarned || 0;
      this.perfectWavesCount = this.saveData.perfectWavesCount || 0;
      this.speedWavesCount = this.saveData.speedWavesCount || 0;

      this.castleHealth = 100;
      this.maxCastleHealth = 100;
      this.castleHitTimer = 0;
      this.wave = 1;
      this.waveDuration = 0;
      this.gameSpeed = 1;
      this.isPaused = false;
      this.isPlaying = false;
      this.prepTimer = 10;
      this.isWaveActive = false;

      // Statistics
      this.sessionStartTime = 0;
      this.sessionDurationSec = 0;
      this.matchKills = 0;
      this.matchMoneyCollected = 0;
      this.towersBuiltCount = 0;
      this.upgradesCount = 0;
      this.perfectWaveCount = 0;

      // Objects in battle
      this.towers = []; // placed on slots
      this.enemies = [];
      this.projectiles = [];
      this.particles = [];
      this.floatingTexts = [];
      this.lightningArcs = [];

      // Wave Spawner State
      this.spawnQueue = [];
      this.spawnInterval = 0.8;
      this.spawnTimer = 0;

      // Selection
      this.selectedSlot = null;
      this.selectedTower = null;
      this.selectedBuildType = null;

      // Canvas & Rendering
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.scale = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this.lastTimestamp = 0;

      this.syncStats();
      this.setupDOM();
      this.applySettings();
      this.renderProfileUI();
      this.updateMoneyDisplay();
      this.renderMenuBadges();
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());

      // Start game loop
      requestAnimationFrame(ts => this.gameLoop(ts));
    }

    saveAll() {
      this.saveData.money = this.money;
      this.saveData.playerName = this.playerName;
      this.saveData.playerPicture = this.playerAvatar;
      this.saveData.tasks = this.tasks;
      this.saveData.challenges = this.challenges;
      this.saveData.settings = this.settings;
      this.saveData.totalKills = this.totalKills;
      this.saveData.highestWave = this.highestWave;
      this.saveData.totalPlayingTime = this.totalPlayingTime;
      this.saveData.towersBuilt = this.towersBuilt;
      this.saveData.towersUpgraded = this.towersUpgraded;
      this.saveData.bossesDefeated = this.bossesDefeated;
      this.saveData.totalMoneyEarned = this.totalMoneyEarned;
      this.saveData.perfectWavesCount = this.perfectWavesCount;
      this.saveData.speedWavesCount = this.speedWavesCount;
      Storage.save(this.saveData);
    }

    syncStats() {
      this.tasks.forEach(t => {
        if (t.type === 'kills') t.current = Math.min(t.target, this.totalKills);
        else if (t.type === 'waves') t.current = Math.min(t.target, this.highestWave);
        else if (t.type === 'builds') t.current = Math.min(t.target, this.towersBuilt);
        else if (t.type === 'upgrades') t.current = Math.min(t.target, this.towersUpgraded);
        else if (t.type === 'bosses') t.current = Math.min(t.target, this.bossesDefeated);
        else if (t.type === 'earnings') t.current = Math.min(t.target, this.totalMoneyEarned);
        else if (t.type === 'init') t.current = 1;
      });

      const maxLevelTowers = this.towers.filter(t => t.level >= 3).length;
      this.challenges.forEach(c => {
        if (c.type === 'waves') c.current = Math.min(c.target, this.highestWave);
        else if (c.type === 'perfect') c.current = Math.min(c.target, this.perfectWavesCount);
        else if (c.type === 'kills') c.current = Math.min(c.target, this.totalKills);
        else if (c.type === 'bosses') c.current = Math.min(c.target, this.bossesDefeated);
        else if (c.type === 'max_towers') c.current = Math.min(c.target, Math.max(c.current, maxLevelTowers));
        else if (c.type === 'speed') c.current = Math.min(c.target, this.speedWavesCount);
      });
    }

    getDifficultyConfig() {
      return DIFFICULTY_CONFIG[this.difficulty] || DIFFICULTY_CONFIG.easy;
    }

    getGraphicsConfig() {
      return GRAPHICS_CONFIG[this.settings.quality] || GRAPHICS_CONFIG.medium;
    }

    setDifficulty(diff) {
      if (!DIFFICULTY_CONFIG[diff]) return;
      this.difficulty = diff;
      this.settings.difficulty = diff;
      localStorage.setItem('vtd_difficulty', diff);
      this.saveAll();
      this.updateDifficultyUI();
    }

    setGraphicsQuality(quality) {
      if (!GRAPHICS_CONFIG[quality]) return;
      this.settings.quality = quality;
      localStorage.setItem('vtd_graphics_quality', quality);
      this.saveAll();
      this.applySettings();
    }

    updateDifficultyUI() {
      const diffCfg = this.getDifficultyConfig();
      document.querySelectorAll('.btn-difficulty').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-diff') === this.difficulty);
      });
      const descEl = document.getElementById('difficulty-desc');
      if (descEl) {
        descEl.innerHTML = diffCfg.desc;
      }
    }

    updateGraphicsUI() {
      const gfxCfg = this.getGraphicsConfig();
      document.querySelectorAll('#graphics-selector .btn-chip').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-quality') === this.settings.quality);
      });
      const descEl = document.getElementById('graphics-desc');
      if (descEl) {
        descEl.innerHTML = gfxCfg.desc;
      }
    }

    updateVolumeUI() {
      const slider = document.getElementById('slider-master-volume');
      const pct = Math.round(this.sound.masterVolume * 100);
      if (slider) slider.value = pct;
      const txt = document.getElementById('volume-percent-text');
      if (txt) txt.textContent = `${pct}%`;
      const icon = document.getElementById('volume-icon');
      if (icon) {
        icon.textContent = pct === 0 ? '🔇' : (pct < 50 ? '🔉' : '🔊');
      }
    }

    applySettings() {
      this.sound.sfxEnabled = this.settings.sfx;
      this.sound.musicEnabled = this.settings.music;
      const toggleMusic = document.getElementById('toggle-music');
      const toggleSfx = document.getElementById('toggle-sfx');
      if (toggleMusic) toggleMusic.checked = this.settings.music;
      if (toggleSfx) toggleSfx.checked = this.settings.sfx;

      this.updateVolumeUI();
      this.updateGraphicsUI();
      this.updateDifficultyUI();
    }

    addMoney(amount) {
      this.money += amount;
      this.matchMoneyCollected += Math.max(0, amount);
      if (amount > 0) this.totalMoneyEarned += amount;
      this.syncStats();
      this.saveAll();
      this.updateMoneyDisplay();
    }

    spendMoney(amount) {
      if (this.money < amount) return false;
      this.money -= amount;
      this.saveAll();
      this.updateMoneyDisplay();
      return true;
    }

    updateMoneyDisplay() {
      const formatted = 'Rs ' + this.money;
      const m1 = document.getElementById('menu-money-display');
      const m2 = document.getElementById('hud-money');
      if (m1) m1.textContent = formatted;
      if (m2) m2.textContent = formatted;
    }

    renderProfileUI() {
      const nameEl = document.getElementById('menu-player-name');
      const avatarImg = document.getElementById('menu-avatar-img');
      const avatarFallback = document.getElementById('menu-avatar-fallback');
      if (nameEl) nameEl.textContent = this.playerName;

      if (this.playerAvatar) {
        if (avatarImg) {
          avatarImg.src = this.playerAvatar;
          avatarImg.classList.remove('hidden');
        }
        if (avatarFallback) avatarFallback.classList.add('hidden');
      } else {
        if (avatarImg) avatarImg.classList.add('hidden');
        if (avatarFallback) avatarFallback.classList.remove('hidden');
      }
    }

    progressTask(id, increment = 1) {
      let changed = false;
      this.tasks.forEach(t => {
        if (t.id === id && !t.claimed) {
          t.current = Math.min(t.target, t.current + increment);
          changed = true;
        }
      });
      if (changed) {
        this.saveAll();
        this.renderMenuBadges();
      }
    }

    progressChallenge(id, increment = 1) {
      let changed = false;
      this.challenges.forEach(c => {
        if (c.id === id && !c.claimed) {
          c.current = Math.min(c.target, c.current + increment);
          changed = true;
        }
      });
      if (changed) {
        this.saveAll();
        this.renderMenuBadges();
      }
    }

    renderMenuBadges() {
      const claimableTasks = this.tasks.filter(t => !t.claimed && t.current >= t.target).length;
      const claimableChs = this.challenges.filter(c => !c.claimed && c.current >= c.target).length;
      
      const tb = document.getElementById('task-badge');
      if (tb) {
        tb.classList.toggle('hidden', claimableTasks === 0);
        tb.textContent = claimableTasks.toString();
      }

      const cb = document.getElementById('challenge-badge');
      if (cb) {
        cb.classList.toggle('hidden', claimableChs === 0);
        cb.textContent = claimableChs.toString();
      }
    }

    // --- SCREEN NAVIGATION ---
    showScreen(id) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      const sc = document.getElementById(id);
      if (sc) sc.classList.add('active');
    }

    startMatch() {
      this.sound.init();
      this.isPlaying = true;
      this.castleHealth = 100;
      this.maxCastleHealth = 100;
      this.castleHitTimer = 0;
      this.wave = 1;
      this.isPaused = false;
      this.gameSpeed = 1;
      this.prepTimer = 8;
      this.isWaveActive = false;
      this.sessionStartTime = Date.now();
      this.sessionDurationSec = 0;
      this.matchKills = 0;
      this.matchMoneyCollected = 0;

      this.towers = [];
      this.enemies = [];
      this.projectiles = [];
      this.particles = [];
      this.floatingTexts = [];
      this.lightningArcs = [];

      this.selectedSlot = null;
      this.selectedTower = null;
      this.selectedBuildType = null;
      document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
      this.closeInspector();

      this.updateHud();
      this.showScreen('gameplay-screen');
      this.showWaveBanner('WAVE 1 / 100', 'PREPARE DEFENSES!');
      this.sound.startMusic();
    }

    endMatchGameOver() {
      this.isPlaying = false;
      this.sound.stopMusic();
      this.sound.gameOverSound();

      // Update GameOver Dialog Values
      const goMoney = document.getElementById('go-money');
      const goKills = document.getElementById('go-kills');
      const goDur = document.getElementById('go-duration');

      if (goMoney) goMoney.textContent = `Rs ${this.matchMoneyCollected}`;
      if (goKills) goKills.textContent = this.matchKills.toString();
      if (goDur) goDur.textContent = this.formatDuration(this.sessionDurationSec);

      this.showScreen('game-over-screen');
    }

    showVictoryScreen() {
      this.isPlaying = false;
      this.sound.stopMusic();
      this.sound.victorySound();

      const diffCfg = this.getDifficultyConfig();
      const vDiff = document.getElementById('vic-difficulty');
      const vCastle = document.getElementById('vic-castle');
      const vMoney = document.getElementById('vic-money');
      const vKills = document.getElementById('vic-kills');
      const vDur = document.getElementById('vic-duration');

      if (vDiff) vDiff.textContent = diffCfg.name;
      if (vCastle) vCastle.textContent = `🏰 ${this.castleHealth} / ${this.maxCastleHealth}`;
      if (vMoney) vMoney.textContent = `Rs ${this.matchMoneyCollected}`;
      if (vKills) vKills.textContent = this.matchKills.toString();
      if (vDur) vDur.textContent = this.formatDuration(this.sessionDurationSec);

      this.showScreen('victory-screen');
    }

    formatDuration(seconds) {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }

    updateHud() {
      const hc = document.getElementById('hud-castle');
      const hw = document.getElementById('hud-wave');
      const pt = document.getElementById('prep-timer-val');
      const wb = document.getElementById('wave-control-bar');

      if (hc) hc.textContent = `${this.castleHealth} / ${this.maxCastleHealth}`;
      if (hw) hw.textContent = `WAVE ${this.wave} / 100`;
      this.updateMoneyDisplay();

      if (wb) {
        wb.style.display = this.isWaveActive ? 'none' : 'flex';
      }
      if (pt) {
        pt.textContent = `${Math.max(0, Math.ceil(this.prepTimer))}s`;
      }
    }

    showWaveBanner(title, subtitle) {
      const banner = document.getElementById('wave-banner');
      const t = document.getElementById('wave-banner-text');
      const s = document.getElementById('wave-banner-sub');
      if (t) t.textContent = title;
      if (s) s.textContent = subtitle;
      if (banner) {
        banner.classList.remove('hidden');
        setTimeout(() => banner.classList.add('hidden'), 2400);
      }
    }

    triggerWave() {
      if (this.isWaveActive) return;
      this.isWaveActive = true;
      this.prepTimer = 0;
      this.updateHud();

      const diffCfg = this.getDifficultyConfig();
      this.spawnInterval = diffCfg.spawnInterval;

      const isBossWave = (this.wave % 5 === 0);
      const isFinalWave = (this.wave === 100);

      this.sound.waveHorn();
      if (isFinalWave) {
        this.showWaveBanner('WAVE 100 / 100', '🔥 FINAL BOSS: VOID BEHEMOTH SUPREME!');
      } else if (isBossWave) {
        this.showWaveBanner(`WAVE ${this.wave} / 100`, '⚠️ VOID BEHEMOTH BOSS!');
      } else {
        this.showWaveBanner(`WAVE ${this.wave} / 100`, 'MONSTERS MARCH!');
      }

      // Generate Enemy Queue for this wave
      this.spawnQueue = [];
      const wave = this.wave;
      const count = Math.min(45, 6 + Math.floor(wave * 0.4) + Math.floor(wave / 5) * 2);
      const hpMultiplier = (1 + (wave - 1) * 0.16) * diffCfg.enemyHpMultiplier;
      const spdMultiplier = Math.min(1.35, 1 + (wave - 1) * 0.015) * diffCfg.enemySpeedMultiplier;

      for (let i = 0; i < count; i++) {
        let typeKey = 'basic';
        if (wave >= 2 && i % 4 === 1) typeKey = 'fast';
        if (wave >= 3 && i % 5 === 2) typeKey = 'flying';
        if (wave >= 4 && i % 6 === 3) typeKey = 'heavy';

        // Every 5th wave contains a Void Behemoth boss (or Void Behemoth Supreme on Wave 100)
        if (isBossWave && i === count - 1) {
          typeKey = isFinalWave ? 'finalBoss' : 'boss';
        }

        const cfg = ENEMY_TYPES[typeKey];
        const bossHpBonus = isFinalWave ? 4.5 : (typeKey === 'boss' ? 1.5 : 1.0);
        const calcHp = Math.round(cfg.baseHp * hpMultiplier * bossHpBonus);
        const castleDmg = Math.max(1, Math.round(cfg.baseCastleDamage * diffCfg.enemyCastleDamageMultiplier));

        this.spawnQueue.push({
          type: typeKey,
          name: cfg.name,
          hp: calcHp,
          maxHp: calcHp,
          speed: cfg.speed * spdMultiplier,
          castleDamage: castleDmg,
          reward: Math.round(cfg.reward * (1 + wave * 0.06)),
          color: cfg.color,
          icon: cfg.icon,
          radius: cfg.radius,
          flying: cfg.flying,
          isBoss: !!cfg.isBoss,
          isFinalBoss: !!cfg.isFinalBoss
        });
      }
      this.spawnTimer = 0.5;
    }

    onWaveComplete() {
      this.isWaveActive = false;
      const waveReward = 80 + this.wave * 25;
      this.addMoney(waveReward);

      this.highestWave = Math.max(this.highestWave, this.wave);
      if (this.castleHealth >= 100) {
        this.perfectWaveCount++;
        this.perfectWavesCount++;
      }
      if (this.waveDuration > 0 && this.waveDuration < 80) {
        this.speedWavesCount++;
      }
      this.syncStats();
      this.saveAll();

      if (this.wave >= 100) {
        // Successfully completed Wave 100: Show victory!
        this.sound.victorySound();
        this.showWaveBanner('🏆 100 WAVES COMPLETED!', 'CITADEL DEFENDED & VICTORY!');
        setTimeout(() => {
          this.showVictoryScreen();
        }, 1600);
        return;
      }

      this.showWaveBanner(`WAVE ${this.wave} / 100 CLEARED!`, `+Rs ${waveReward} BONUS`);
      this.wave++;
      this.waveDuration = 0;
      this.prepTimer = 10;
      this.updateHud();
    }

    // --- CANVAS SIZING & COORDINATES ---
    resizeCanvas() {
      const wrapper = document.querySelector('.game-wrapper');
      if (!this.canvas) return;

      const width = (wrapper && wrapper.clientWidth) ? wrapper.clientWidth : 360;
      const height = (wrapper && wrapper.clientHeight) ? wrapper.clientHeight : 640;
      const dpr = window.devicePixelRatio || 1;

      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;

      this.canvas.style.width = width + 'px';
      this.canvas.style.height = height + 'px';

      // Fit 360x640 logical coordinates inside canvas aspect ratio
      const scaleX = width / LOGICAL_WIDTH;
      const scaleY = height / LOGICAL_HEIGHT;
      this.scale = Math.min(scaleX, scaleY);
      this.offsetX = (width - LOGICAL_WIDTH * this.scale) / 2;
      this.offsetY = (height - LOGICAL_HEIGHT * this.scale) / 2;
    }

    async enterFullscreen() {
      const game = document.querySelector('.game-wrapper');
      try {
        if (!document.fullscreenElement) {
          if (game && game.requestFullscreen) {
            await game.requestFullscreen();
          } else if (game && game.webkitRequestFullscreen) {
            await game.webkitRequestFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          }
        }
      } catch (e) {}
    }

    screenToLogical(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      return {
        x: (x - this.offsetX) / this.scale,
        y: (y - this.offsetY) / this.scale
      };
    }

    // --- MAIN GAME LOOP ---
    gameLoop(timestamp) {
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      let dt = (timestamp - this.lastTimestamp) / 1000;
      this.lastTimestamp = timestamp;
      if (dt > 0.1) dt = 0.1; // clamp lag spike

      if (this.isPlaying && !this.isPaused) {
        const gameDt = dt * this.gameSpeed;
        this.updateGame(gameDt);
      }

      this.render();
      requestAnimationFrame(ts => this.gameLoop(ts));
    }

    updateGame(dt) {
      this.sessionDurationSec += dt;
      if (this.castleHitTimer > 0) {
        this.castleHitTimer -= dt;
      }

      // Wave prep countdown
      if (!this.isWaveActive) {
        this.prepTimer -= dt;
        const pt = document.getElementById('prep-timer-val');
        if (pt) pt.textContent = `${Math.max(0, Math.ceil(this.prepTimer))}s`;
        if (this.prepTimer <= 0) {
          this.triggerWave();
        }
      } else {
        // Spawn queued enemies
        if (this.spawnQueue.length > 0) {
          this.spawnTimer -= dt;
          if (this.spawnTimer <= 0) {
            const enemyData = this.spawnQueue.shift();
            if (enemyData.isBoss) {
              this.sound.bossSpawn();
              const gfx = this.getGraphicsConfig();
              if (gfx.enhancedBossEffects) {
                this.addFloatingText(PATH_WAYPOINTS[0].x, PATH_WAYPOINTS[0].y + 25, '⚠️ BOSS DETECTED!', '#ef4444');
                this.spawnExplosionParticles(PATH_WAYPOINTS[0].x, PATH_WAYPOINTS[0].y + 20, '#a855f7', 16);
              }
            }
            this.enemies.push({
              ...enemyData,
              distance: 0,
              x: PATH_WAYPOINTS[0].x,
              y: PATH_WAYPOINTS[0].y,
              angle: 0,
              slowTimer: 0,
              slowFactor: 1,
              hitFlash: 0
            });
            this.spawnTimer = this.spawnInterval;
          }
        } else if (this.enemies.length === 0) {
          // All enemies slain or reached castle
          this.onWaveComplete();
        }
      }

      // Update Enemies
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (e.slowTimer > 0) {
          e.slowTimer -= dt;
          if (e.slowTimer <= 0) e.slowFactor = 1;
        }
        if (e.hitFlash > 0) e.hitFlash -= dt * 6;

        e.distance += e.speed * e.slowFactor * 60 * dt;
        const pos = getPositionAlongPath(e.distance);
        e.x = pos.x;
        e.y = pos.y;
        e.angle = pos.angle;

        // Reached Castle Base
        if (e.distance >= TOTAL_PATH_LENGTH) {
          this.enemies.splice(i, 1);
          const dmg = Math.max(1, Math.round(e.castleDamage || 5));
          this.castleHealth = Math.max(0, this.castleHealth - dmg);
          this.castleHitTimer = 0.5;
          this.sound.castleDamage();

          // Castle damage visual effects & floating text
          this.addFloatingText(pos.x, pos.y - 12, `-${dmg} 🏰`, '#ef4444');
          for (let k = 0; k < 12; k++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 30 + Math.random() * 70;
            this.particles.push({
              x: pos.x,
              y: pos.y,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              color: Math.random() > 0.5 ? '#ef4444' : '#fbbf24',
              size: 3 + Math.random() * 3,
              maxLife: 0.5,
              life: 0.5,
              alpha: 1
            });
          }

          // Trigger screen shake & HUD highlight
          const wrapper = document.querySelector('.game-wrapper');
          if (wrapper) {
            wrapper.classList.remove('shake-effect');
            void wrapper.offsetWidth;
            wrapper.classList.add('shake-effect');
          }

          const statCastle = document.getElementById('stat-castle');
          if (statCastle) {
            statCastle.classList.remove('hud-castle-hit');
            void statCastle.offsetWidth;
            statCastle.classList.add('hud-castle-hit');
          }

          this.updateHud();
          if (this.castleHealth <= 0) {
            this.castleHealth = 0;
            this.updateHud();
            this.endMatchGameOver();
            return;
          }
        }
      }

      // Update Towers
      for (let t of this.towers) {
        t.cooldown -= dt;
        if (t.cooldown <= 0) {
          this.towerAttack(t);
        }
      }

      // Update Projectiles
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.projectiles.splice(i, 1);
          continue;
        }

        // Homing projectile towards target enemy if alive
        let targetX = p.targetX;
        let targetY = p.targetY;
        if (p.targetEnemy && this.enemies.includes(p.targetEnemy)) {
          targetX = p.targetEnemy.x;
          targetY = p.targetEnemy.y;
        }

        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const dist = Math.hypot(dx, dy);
        const step = p.speed * dt;

        if (dist <= step || dist < 8) {
          // Impact!
          this.onProjectileHit(p, targetX, targetY);
          this.projectiles.splice(i, 1);
        } else {
          p.x += (dx / dist) * step;
          p.y += (dy / dist) * step;
        }
      }

      // Update Lightning Arcs
      for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
        const arc = this.lightningArcs[i];
        arc.life -= dt;
        if (arc.life <= 0) this.lightningArcs.splice(i, 1);
      }

      // Update Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.life -= dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.alpha = pt.life / pt.maxLife;
        if (pt.life <= 0) this.particles.splice(i, 1);
      }

      // Update Floating Texts
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.life -= dt;
        ft.y += ft.vy * dt;
        ft.alpha = ft.life / ft.maxLife;
        if (ft.life <= 0) this.floatingTexts.splice(i, 1);
      }
    }

    towerAttack(tower) {
      // Find enemies in range
      const inRange = [];
      for (let e of this.enemies) {
        const d = Math.hypot(e.x - tower.x, e.y - tower.y);
        if (d <= tower.range) {
          inRange.push({ enemy: e, distAlongPath: e.distance });
        }
      }
      if (inRange.length === 0) return;

      // Target enemy furthest along path
      inRange.sort((a, b) => b.distAlongPath - a.distAlongPath);
      const target = inRange[0].enemy;

      tower.cooldown = tower.fireInterval;
      tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);

      const diffCfg = this.getDifficultyConfig();
      const effectiveDmg = Math.max(1, Math.round(tower.damage * diffCfg.towerDamageMultiplier));

      if (tower.type === 'archer') {
        this.sound.arrowShoot();
        this.projectiles.push({
          x: tower.x,
          y: tower.y,
          targetEnemy: target,
          targetX: target.x,
          targetY: target.y,
          speed: 460,
          damage: effectiveDmg,
          type: 'archer',
          life: 1.5,
          color: '#fbbf24',
          tower
        });
      } else if (tower.type === 'cannon') {
        this.sound.cannonShoot();
        this.projectiles.push({
          x: tower.x,
          y: tower.y,
          targetEnemy: target,
          targetX: target.x,
          targetY: target.y,
          speed: 280,
          damage: effectiveDmg,
          splashRadius: tower.splashRadius,
          type: 'cannon',
          life: 1.8,
          color: '#ef4444',
          tower
        });
      } else if (tower.type === 'magic') {
        this.sound.magicShoot();
        this.projectiles.push({
          x: tower.x,
          y: tower.y,
          targetEnemy: target,
          targetX: target.x,
          targetY: target.y,
          speed: 340,
          damage: effectiveDmg,
          slowFactor: tower.slowFactor,
          slowDuration: tower.slowDuration,
          type: 'magic',
          life: 1.5,
          color: '#a855f7',
          tower
        });
      } else if (tower.type === 'lightning') {
        this.sound.lightningShoot();
        // Chain lightning up to chainCount
        const chained = [target];
        let curr = target;
        for (let step = 1; step < tower.chainCount; step++) {
          let nearest = null;
          let minD = 90;
          for (let e of this.enemies) {
            if (!chained.includes(e)) {
              const d = Math.hypot(e.x - curr.x, e.y - curr.y);
              if (d < minD) {
                minD = d;
                nearest = e;
              }
            }
          }
          if (nearest) {
            chained.push(nearest);
            curr = nearest;
          } else break;
        }

        // Apply lightning damage & spawn arc graphics
        let prev = { x: tower.x, y: tower.y };
        chained.forEach((e, idx) => {
          this.lightningArcs.push({
            x1: prev.x, y1: prev.y,
            x2: e.x, y2: e.y,
            life: 0.15
          });
          prev = { x: e.x, y: e.y };
          const dmg = Math.round(effectiveDmg * (1 - idx * 0.2));
          this.damageEnemy(e, dmg, tower);
        });
      }
    }

    onProjectileHit(proj, hitX, hitY) {
      if (proj.type === 'cannon') {
        // Splash explosion
        this.spawnExplosionParticles(hitX, hitY, '#ef4444', 16);
        for (let e of this.enemies) {
          if (!e.flying) {
            const d = Math.hypot(e.x - hitX, e.y - hitY);
            if (d <= proj.splashRadius) {
              const falloff = 1 - (d / proj.splashRadius) * 0.45;
              this.damageEnemy(e, Math.round(proj.damage * falloff), proj.tower);
            }
          }
        }
      } else {
        // Single target
        this.spawnExplosionParticles(hitX, hitY, proj.color, 7);
        if (proj.targetEnemy && this.enemies.includes(proj.targetEnemy)) {
          if (proj.type === 'magic') {
            proj.targetEnemy.slowTimer = proj.slowDuration;
            proj.targetEnemy.slowFactor = proj.slowFactor;
          }
          this.damageEnemy(proj.targetEnemy, proj.damage, proj.tower);
        }
      }
    }

    damageEnemy(enemy, damage, tower) {
      enemy.hp -= damage;
      enemy.hitFlash = 1;
      this.sound.enemyHit();
      this.addFloatingText(enemy.x, enemy.y - 12, `-${damage}`, '#f8fafc');

      if (enemy.hp <= 0) {
        this.killEnemy(enemy, tower);
      }
    }

    killEnemy(enemy, tower) {
      const idx = this.enemies.indexOf(enemy);
      if (idx !== -1) this.enemies.splice(idx, 1);

      if (tower) tower.kills++;

      if (enemy.isBoss) {
        this.sound.bossRoar();
      } else {
        this.sound.enemyDeath();
      }
      this.sound.coinCollect();
      this.spawnExplosionParticles(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 30 : 14);

      // Reward
      this.addMoney(enemy.reward);
      this.addFloatingText(enemy.x, enemy.y - 16, `+Rs ${enemy.reward}`, '#fbbf24');

      this.matchKills++;
      this.totalKills++;
      if (enemy.isBoss) {
        this.bossesDefeated++;
      }
      this.syncStats();
      this.saveAll();

      if (this.selectedTower === tower) {
        this.updateInspectorUI();
      }
    }

    spawnExplosionParticles(x, y, color, baseCount) {
      const gfx = this.getGraphicsConfig();
      const count = Math.max(1, Math.round(baseCount * gfx.particleMultiplier));
      const lifeMult = gfx.particleLifeMultiplier;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = (18 + Math.random() * 82) * (gfx.detailedAnimations ? 1.0 : 0.8);
        const maxLife = (0.3 + Math.random() * 0.25) * lifeMult;
        this.particles.push({
          x, y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          color,
          size: 2 + Math.random() * (gfx.detailedAnimations ? 3.5 : 2),
          maxLife,
          life: maxLife,
          alpha: 1,
          sparkle: gfx.detailedAnimations && Math.random() > 0.4
        });
      }
    }

    addFloatingText(x, y, text, color) {
      this.floatingTexts.push({
        x, y,
        text, color,
        vy: -35,
        maxLife: 0.7,
        life: 0.7,
        alpha: 1
      });
    }

    // --- TOWER MANAGEMENT ---
    selectSlot(slot) {
      this.selectedSlot = slot;
      const existing = this.towers.find(t => t.slotId === slot.id);
      if (existing) {
        this.openInspector(existing);
      } else {
        this.closeInspector();
        if (this.selectedBuildType) {
          this.buildTowerOnSlot(slot, this.selectedBuildType);
        }
      }
    }

    buildTowerOnSlot(slot, typeKey) {
      const cfg = TOWER_CONFIGS[typeKey];
      if (!cfg) return;

      if (!this.spendMoney(cfg.cost)) {
        this.sound.buttonClick();
        this.addFloatingText(slot.x, slot.y - 15, 'NOT ENOUGH MONEY!', '#ef4444');
        return;
      }

      this.sound.upgradeSound();
      const tower = {
        slotId: slot.id,
        x: slot.x,
        y: slot.y,
        type: typeKey,
        name: cfg.name,
        icon: cfg.icon,
        level: 1,
        damage: cfg.baseDamage,
        range: cfg.baseRange,
        fireInterval: cfg.fireInterval,
        splashRadius: cfg.splashRadius || 0,
        slowFactor: cfg.slowFactor || 1,
        slowDuration: cfg.slowDuration || 0,
        chainCount: cfg.chainCount || 1,
        color: cfg.color,
        cooldown: 0,
        angle: 0,
        kills: 0,
        investedMoney: cfg.cost
      };

      this.towers.push(tower);
      this.towersBuiltCount++;
      this.towersBuilt++;
      this.syncStats();
      this.saveAll();

      this.openInspector(tower);
    }

    upgradeTower(tower) {
      const upgradeCost = Math.round(tower.investedMoney * 0.65);
      if (!this.spendMoney(upgradeCost)) {
        this.addFloatingText(tower.x, tower.y - 15, 'NOT ENOUGH MONEY!', '#ef4444');
        return;
      }

      this.sound.upgradeSound();
      tower.level++;
      tower.investedMoney += upgradeCost;
      tower.damage = Math.round(tower.damage * 1.45);
      tower.range = Math.round(tower.range * 1.12);
      tower.fireInterval = Math.max(0.2, tower.fireInterval * 0.9);

      this.upgradesCount++;
      this.towersUpgraded++;
      this.syncStats();
      this.saveAll();
      this.addFloatingText(tower.x, tower.y - 20, 'LEVEL UP!', '#10b981');
      this.updateInspectorUI();
    }

    sellTower(tower) {
      const refund = Math.round(tower.investedMoney * 0.7);
      this.addMoney(refund);
      this.sound.coinCollect();
      this.addFloatingText(tower.x, tower.y - 15, `+Rs ${refund}`, '#fbbf24');

      const idx = this.towers.indexOf(tower);
      if (idx !== -1) this.towers.splice(idx, 1);
      this.closeInspector();
    }

    openInspector(tower) {
      this.selectedTower = tower;
      this.updateInspectorUI();
      const panel = document.getElementById('tower-inspector');
      if (panel) panel.classList.remove('hidden');
    }

    closeInspector() {
      this.selectedTower = null;
      const panel = document.getElementById('tower-inspector');
      if (panel) panel.classList.add('hidden');
    }

    updateInspectorUI() {
      const t = this.selectedTower;
      if (!t) return;

      const icon = document.getElementById('insp-icon');
      const name = document.getElementById('insp-name');
      const lvl = document.getElementById('insp-level');
      const dmg = document.getElementById('insp-dmg');
      const rng = document.getElementById('insp-rng');
      const spd = document.getElementById('insp-spd');
      const kills = document.getElementById('insp-kills');
      const upgCost = document.getElementById('insp-upgrade-cost');
      const sellRef = document.getElementById('insp-sell-refund');

      if (icon) icon.textContent = t.icon;
      if (name) name.textContent = t.name;
      if (lvl) lvl.textContent = `Level ${t.level}`;
      if (dmg) dmg.textContent = t.damage.toString();
      if (rng) rng.textContent = t.range.toString();
      if (spd) spd.textContent = `${t.fireInterval.toFixed(2)}s`;
      if (kills) kills.textContent = t.kills.toString();

      const cost = Math.round(t.investedMoney * 0.65);
      const refund = Math.round(t.investedMoney * 0.7);
      if (upgCost) upgCost.textContent = `Rs ${cost}`;
      if (sellRef) sellRef.textContent = `+Rs ${refund}`;
    }

    // --- RENDER BATTLEFIELD ---
    render() {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const dpr = window.devicePixelRatio || 1;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Apply responsive center scaling
      ctx.scale(dpr, dpr);
      ctx.translate(this.offsetX, this.offsetY);
      ctx.scale(this.scale, this.scale);

      const gfx = this.getGraphicsConfig();

      // 1. Background Grass / Stone Terrain
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      // Terrain grid texture (skip on LOW for best performance)
      if (gfx.detailedAnimations) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= LOGICAL_WIDTH; x += 30) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, LOGICAL_HEIGHT); ctx.stroke();
        }
        for (let y = 0; y <= LOGICAL_HEIGHT; y += 30) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(LOGICAL_WIDTH, y); ctx.stroke();
        }
      }

      // 2. Winding Path (Stone Border + Dirt Track)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 26;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(PATH_WAYPOINTS[0].x, PATH_WAYPOINTS[0].y);
      for (let i = 1; i < PATH_WAYPOINTS.length; i++) {
        ctx.lineTo(PATH_WAYPOINTS[i].x, PATH_WAYPOINTS[i].y);
      }
      ctx.stroke();

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 20;
      ctx.stroke();

      if (gfx.detailedAnimations) {
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. Castle / Base at the end
      const lastWp = PATH_WAYPOINTS[PATH_WAYPOINTS.length - 1];
      ctx.save();
      ctx.translate(lastWp.x, lastWp.y);

      // Castle damage pulse shockwave if hit recently
      if (this.castleHitTimer > 0) {
        const pulseR = 26 + (1 - this.castleHitTimer / 0.5) * 25;
        ctx.strokeStyle = `rgba(239, 68, 68, ${this.castleHitTimer / 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        if (gfx.detailedAnimations) {
          ctx.strokeStyle = `rgba(251, 191, 36, ${(this.castleHitTimer / 0.5) * 0.7})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, pulseR * 0.7, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.fillStyle = this.castleHitTimer > 0 ? '#450a0a' : '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this.castleHitTimer > 0 ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Castle Health Bar below castle
      const cBarW = 44;
      const cBarH = 4;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-cBarW / 2, 30, cBarW, cBarH);
      const cHpPct = Math.max(0, this.castleHealth / this.maxCastleHealth);
      ctx.fillStyle = cHpPct > 0.5 ? '#10b981' : (cHpPct > 0.25 ? '#f59e0b' : '#ef4444');
      ctx.fillRect(-cBarW / 2, 30, cBarW * cHpPct, cBarH);

      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏰', 0, 0);
      ctx.restore();

      // 4. Enemy Entrance at top
      const firstWp = PATH_WAYPOINTS[1];
      ctx.save();
      ctx.translate(firstWp.x, firstWp.y - 20);
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚪 ENTRANCE', 0, 0);
      ctx.restore();

      // 5. Tower Slots / Pedestals
      for (let slot of TOWER_SLOTS) {
        const placed = this.towers.find(t => t.slotId === slot.id);
        ctx.save();
        ctx.translate(slot.x, slot.y);

        // Stone Base
        ctx.fillStyle = placed ? '#1e293b' : 'rgba(30, 41, 59, 0.6)';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = placed ? '#f59e0b' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = placed ? 2 : 1;
        ctx.stroke();

        if (!placed) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('+', 0, 0);
        }
        ctx.restore();
      }

      // 6. Placed Towers
      for (let t of this.towers) {
        ctx.save();
        ctx.translate(t.x, t.y);

        // Enhanced tower effects on HIGH
        if (gfx.enhancedTowerEffects) {
          if (t.cooldown <= 0) {
            ctx.strokeStyle = t.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 16 + Math.sin(Date.now() / 180) * 1.5, 0, Math.PI * 2);
            ctx.stroke();
          }
          if (t.level >= 3) {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Tower Body
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.icon, 0, -1);

        // Level Stars
        ctx.fillStyle = '#fef08a';
        ctx.font = '8px sans-serif';
        let stars = '★'.repeat(t.level);
        ctx.fillText(stars, 0, 11);

        ctx.restore();
      }

      // 7. Tower Range Overlay for Selected Tower
      if (this.selectedTower) {
        ctx.save();
        ctx.translate(this.selectedTower.x, this.selectedTower.y);
        ctx.beginPath();
        ctx.arc(0, 0, this.selectedTower.range, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }

      // 8. Lightning Arcs
      for (let arc of this.lightningArcs) {
        ctx.save();
        if (gfx.detailedAnimations) {
          ctx.strokeStyle = 'rgba(254, 240, 138, 0.35)';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(arc.x1, arc.y1);
          ctx.lineTo(arc.x2, arc.y2);
          ctx.stroke();
        }

        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(arc.x1, arc.y1);
        const midX = (arc.x1 + arc.x2) / 2 + (Math.random() - 0.5) * 16;
        const midY = (arc.y1 + arc.y2) / 2 + (Math.random() - 0.5) * 16;
        ctx.lineTo(midX, midY);
        ctx.lineTo(arc.x2, arc.y2);
        ctx.stroke();
        ctx.restore();
      }

      // 9. Enemies
      for (let e of this.enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);

        // Enhanced Boss Corona & Stomp Shockwave
        if (e.isBoss && gfx.enhancedBossEffects) {
          const bossGrad = ctx.createRadialGradient(0, 0, e.radius * 0.4, 0, 0, e.radius * 2.3);
          bossGrad.addColorStop(0, 'rgba(168, 85, 247, 0.5)');
          bossGrad.addColorStop(0.6, 'rgba(239, 68, 68, 0.22)');
          bossGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = bossGrad;
          ctx.beginPath();
          ctx.arc(0, 0, e.radius * 2.3, 0, Math.PI * 2);
          ctx.fill();

          const shockPhase = (Date.now() % 1600) / 1600;
          ctx.strokeStyle = `rgba(239, 68, 68, ${1 - shockPhase})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, e.radius + shockPhase * 24, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Flying shadow
        if (e.flying) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.ellipse(0, 10, e.radius, e.radius * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.translate(0, -6); // lift up
        }

        // Enemy Body
        ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : e.color;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Icon
        ctx.font = `${e.radius * 1.2}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.icon, 0, 0);

        // Frost tint overlay if slowed
        if (e.slowTimer > 0) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, e.radius + 2, 0, Math.PI * 2);
          ctx.fill();

          if (gfx.enhancedEnemyEffects) {
            ctx.fillStyle = '#bae6fd';
            for (let s = 0; s < 4; s++) {
              const sAng = (Date.now() / 250) + s * (Math.PI / 2);
              ctx.fillRect(Math.cos(sAng) * (e.radius + 4) - 1.5, Math.sin(sAng) * (e.radius + 4) - 1.5, 3, 3);
            }
          }
        }

        // Health Bar
        const barW = Math.max(20, e.radius * 2);
        const barH = 3;
        const barY = -e.radius - 6;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-barW / 2, barY, barW, barH);
        const hpPct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = hpPct > 0.4 ? '#10b981' : '#ef4444';
        ctx.fillRect(-barW / 2, barY, barW * hpPct, barH);

        ctx.restore();
      }

      // 10. Projectiles
      for (let p of this.projectiles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;
        if (p.type === 'archer') {
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'cannon') {
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'magic') {
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 11. Particles
      for (let pt of this.particles) {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 12. Floating Texts
      for (let ft of this.floatingTexts) {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      ctx.restore();
    }

    // --- USER INTERACTION ---
    setupDOM() {
      // Menu Navigation
      document.getElementById('btn-start')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.startMatch();
      });

      document.getElementById('btn-task')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.openTasksModal();
      });

      document.getElementById('btn-challenge')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.openChallengesModal();
      });

      document.getElementById('btn-settings')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.openSettingsModal();
      });

      document.getElementById('btn-exit')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.showScreen('exit-screen');
      });

      document.getElementById('btn-fullscreen')?.addEventListener('click', async () => {
        this.sound.buttonClick();
        await this.enterFullscreen();
      });

      document.getElementById('btn-return-game')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.showScreen('main-menu');
      });

      // Player Profile Customization
      document.getElementById('btn-open-profile')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.openProfileModal();
      });

      document.getElementById('btn-upload-avatar')?.addEventListener('click', () => {
        document.getElementById('avatar-file-input')?.click();
      });

      document.getElementById('avatar-file-input')?.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const dataUrl = evt.target.result;
            const previewImg = document.getElementById('profile-modal-img');
            const previewFallback = document.getElementById('profile-modal-fallback');
            if (previewImg) {
              previewImg.src = dataUrl;
              previewImg.classList.remove('hidden');
            }
            if (previewFallback) previewFallback.classList.add('hidden');
            this.pendingAvatar = dataUrl;
          };
          reader.readAsDataURL(file);
        }
      });

      document.getElementById('btn-save-profile')?.addEventListener('click', () => {
        this.sound.buttonClick();
        const input = document.getElementById('input-player-name');
        if (input && input.value.trim()) {
          this.playerName = input.value.trim();
          Storage.setPlayerName(this.playerName);
        }
        if (this.pendingAvatar) {
          this.playerAvatar = this.pendingAvatar;
          Storage.setPlayerAvatar(this.playerAvatar);
        }
        this.renderProfileUI();
        document.getElementById('profile-modal')?.classList.add('hidden');
      });

      // Close modal generic handlers
      document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.sound.buttonClick();
          const targetId = btn.getAttribute('data-close');
          document.getElementById(targetId)?.classList.add('hidden');
        });
      });

      // In-game HUD actions
      document.getElementById('btn-send-wave')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.triggerWave();
      });

      document.getElementById('btn-speed')?.addEventListener('click', () => {
        this.sound.buttonClick();
        if (this.gameSpeed === 1) this.gameSpeed = 2;
        else if (this.gameSpeed === 2) this.gameSpeed = 3;
        else this.gameSpeed = 1;
        document.getElementById('btn-speed').textContent = `${this.gameSpeed}x`;
      });

      document.getElementById('btn-pause')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.isPaused = !this.isPaused;
        const pModal = document.getElementById('pause-modal');
        if (pModal) {
          pModal.classList.toggle('hidden', !this.isPaused);
          const pw = document.getElementById('pause-wave-num');
          const pd = document.getElementById('pause-duration');
          if (pw) pw.textContent = this.wave.toString();
          if (pd) pd.textContent = this.formatDuration(this.sessionDurationSec);
        }
      });

      document.getElementById('btn-resume')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.isPaused = false;
        document.getElementById('pause-modal')?.classList.add('hidden');
      });

      document.getElementById('btn-pause-menu')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.isPaused = false;
        this.isPlaying = false;
        this.sound.stopMusic();
        document.getElementById('pause-modal')?.classList.add('hidden');
        this.showScreen('main-menu');
      });

      document.getElementById('btn-ingame-menu')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.isPlaying = false;
        this.sound.stopMusic();
        this.showScreen('main-menu');
      });

      // Tower Cards Selector in bottom bar
      document.querySelectorAll('.tower-card').forEach(card => {
        card.addEventListener('click', () => {
          this.sound.buttonClick();
          const type = card.getAttribute('data-type');
          if (this.selectedBuildType === type) {
            this.selectedBuildType = null;
            card.classList.remove('selected');
          } else {
            this.selectedBuildType = type;
            document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
          }
        });
      });

      // Tower Inspector Actions
      document.getElementById('btn-close-inspector')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.closeInspector();
      });

      document.getElementById('btn-upgrade-tower')?.addEventListener('click', () => {
        if (this.selectedTower) this.upgradeTower(this.selectedTower);
      });

      document.getElementById('btn-sell-tower')?.addEventListener('click', () => {
        if (this.selectedTower) this.sellTower(this.selectedTower);
      });

      // Game Over Screen Actions
      document.getElementById('btn-go-restart')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.startMatch();
      });

      document.getElementById('btn-go-menu')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.showScreen('main-menu');
      });

      // Victory Screen Actions
      document.getElementById('btn-vic-restart')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.startMatch();
      });

      document.getElementById('btn-vic-menu')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.showScreen('main-menu');
      });

      // Settings controls: Master Volume Slider
      const volSlider = document.getElementById('slider-master-volume');
      if (volSlider) {
        volSlider.value = Math.round(this.sound.masterVolume * 100);
        volSlider.addEventListener('input', (e) => {
          const val = parseInt(e.target.value, 10);
          this.sound.setMasterVolume(val / 100);
          const txt = document.getElementById('volume-percent-text');
          if (txt) txt.textContent = `${val}%`;
          const icon = document.getElementById('volume-icon');
          if (icon) {
            icon.textContent = val === 0 ? '🔇' : (val < 50 ? '🔉' : '🔊');
          }
        });
      }

      document.getElementById('toggle-music')?.addEventListener('change', (e) => {
        this.settings.music = e.target.checked;
        this.saveAll();
        this.applySettings();
      });

      document.getElementById('toggle-sfx')?.addEventListener('change', (e) => {
        this.settings.sfx = e.target.checked;
        this.saveAll();
        this.applySettings();
      });

      document.querySelectorAll('#graphics-selector .btn-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          this.sound.buttonClick();
          const q = btn.getAttribute('data-quality');
          this.setGraphicsQuality(q);
        });
      });

      document.querySelectorAll('.btn-difficulty').forEach(btn => {
        btn.addEventListener('click', () => {
          this.sound.buttonClick();
          const diff = btn.getAttribute('data-diff');
          this.setDifficulty(diff);
        });
      });

      // Network Connection Status detection (ONLINE / OFFLINE)
      const updateConnectionStatus = () => {
        const isOnline = typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
        const statusEl = document.getElementById('connection-status');
        if (statusEl) {
          if (isOnline) {
            statusEl.className = 'connection-status online';
            statusEl.innerHTML = '<span class="status-indicator">🟢</span> <span class="status-text">ONLINE</span>';
          } else {
            statusEl.className = 'connection-status offline';
            statusEl.innerHTML = '<span class="status-indicator">⚪</span> <span class="status-text">OFFLINE</span>';
          }
        }
      };

      window.addEventListener('online', updateConnectionStatus);
      window.addEventListener('offline', updateConnectionStatus);
      updateConnectionStatus();

      // Offline Service Worker registration
      if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      }

      document.getElementById('btn-reset-data')?.addEventListener('click', () => {
        this.sound.buttonClick();
        document.getElementById('reset-confirm-modal')?.classList.remove('hidden');
      });

      document.getElementById('btn-reset-cancel')?.addEventListener('click', () => {
        this.sound.buttonClick();
        document.getElementById('reset-confirm-modal')?.classList.add('hidden');
      });

      document.getElementById('btn-reset-confirm')?.addEventListener('click', () => {
        this.sound.buttonClick();
        Storage.resetAll();
        location.reload();
      });

      // Canvas Pointer & Tap Handling
      if (this.canvas) {
        const handleTap = (clientX, clientY) => {
          const pt = this.screenToLogical(clientX, clientY);
          // Check if tapped near any tower slot
          for (let slot of TOWER_SLOTS) {
            const d = Math.hypot(slot.x - pt.x, slot.y - pt.y);
            if (d <= 22) {
              this.sound.buttonClick();
              this.selectSlot(slot);
              return;
            }
          }
          // Clicked outside any tower slot: close inspector
          this.closeInspector();
        };

        this.canvas.addEventListener('click', (e) => {
          handleTap(e.clientX, e.clientY);
        });

        this.canvas.addEventListener('touchstart', (e) => {
          if (e.touches && e.touches.length > 0) {
            handleTap(e.touches[0].clientX, e.touches[0].clientY);
          }
        }, { passive: true });
      }
    }

    openProfileModal() {
      const modal = document.getElementById('profile-modal');
      const input = document.getElementById('input-player-name');
      const img = document.getElementById('profile-modal-img');
      const fallback = document.getElementById('profile-modal-fallback');

      if (input) input.value = this.playerName;
      this.pendingAvatar = this.playerAvatar;

      if (this.playerAvatar) {
        if (img) {
          img.src = this.playerAvatar;
          img.classList.remove('hidden');
        }
        if (fallback) fallback.classList.add('hidden');
      } else {
        if (img) img.classList.add('hidden');
        if (fallback) fallback.classList.remove('hidden');
      }
      modal?.classList.remove('hidden');
    }

    openTasksModal() {
      this.syncStats();
      const list = document.getElementById('tasks-list');
      if (!list) return;
      list.innerHTML = '';

      const claimedCount = this.tasks.filter(t => t.claimed).length;
      const titleEl = document.getElementById('tasks-title');
      if (titleEl) titleEl.textContent = `TASKS ${claimedCount} / 100`;

      this.tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'item-card';
        const pct = Math.min(100, Math.round((task.current / task.target) * 100));
        const canClaim = !task.claimed && task.current >= task.target;

        card.innerHTML = `
          <div class="item-header">
            <span class="item-title">${task.name}</span>
            <span class="item-reward">+Rs ${task.reward}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${pct}%"></div>
          </div>
          <div class="item-footer">
            <span class="progress-text">${task.desc} (${task.current} / ${task.target})</span>
            <button class="btn-claim" ${task.claimed ? 'disabled' : (canClaim ? '' : 'disabled')}>
              ${task.claimed ? 'CLAIMED' : 'CLAIM'}
            </button>
          </div>
        `;

        const claimBtn = card.querySelector('.btn-claim');
        if (canClaim) {
          claimBtn.addEventListener('click', () => {
            this.sound.coinCollect();
            task.claimed = true;
            this.addMoney(task.reward);
            this.saveAll();
            this.renderMenuBadges();
            this.openTasksModal();
          });
        }
        list.appendChild(card);
      });

      document.getElementById('tasks-modal')?.classList.remove('hidden');
    }

    openChallengesModal() {
      this.syncStats();
      const list = document.getElementById('challenges-list');
      if (!list) return;
      list.innerHTML = '';

      const claimedCount = this.challenges.filter(c => c.claimed).length;
      const titleEl = document.getElementById('challenges-title');
      if (titleEl) titleEl.textContent = `CHALLENGES ${claimedCount} / 100`;

      this.challenges.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'item-card';
        const pct = Math.min(100, Math.round((ch.current / ch.target) * 100));
        const canClaim = !ch.claimed && ch.current >= ch.target;

        card.innerHTML = `
          <div class="item-header">
            <span class="item-title">${ch.name}</span>
            <span class="item-reward">+Rs ${ch.reward}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${pct}%"></div>
          </div>
          <div class="item-footer">
            <span class="progress-text">${ch.desc} (${ch.current}/${ch.target})</span>
            <button class="btn-claim" ${ch.claimed ? 'disabled' : (canClaim ? '' : 'disabled')}>
              ${ch.claimed ? 'CLAIMED' : 'CLAIM'}
            </button>
          </div>
        `;

        const claimBtn = card.querySelector('.btn-claim');
        if (canClaim) {
          claimBtn.addEventListener('click', () => {
            this.sound.coinCollect();
            ch.claimed = true;
            this.addMoney(ch.reward);
            this.saveAll();
            this.renderMenuBadges();
            this.openChallengesModal();
          });
        }
        list.appendChild(card);
      });

      document.getElementById('challenges-modal')?.classList.remove('hidden');
    }

    openSettingsModal() {
      document.getElementById('settings-modal')?.classList.remove('hidden');
    }
  }

  let activeGame = null;

  function resizeGame() {
    if (activeGame) {
      activeGame.resizeCanvas();
    }
  }

  function initializeGame() {
    try {
      activeGame = new GameState();
      window.gameInstance = activeGame;
    } catch (err) {
      console.error('Game initialization failed:', err);
      const overlay = document.getElementById('fatal-error-overlay');
      const msg = document.getElementById('fatal-error-msg');
      if (overlay && msg) {
        overlay.classList.remove('hidden');
        msg.textContent = 'Error: ' + (err.message || 'Game init error');
      }
    }
  }

  window.addEventListener('error', (event) => {
    const overlay = document.getElementById('fatal-error-overlay');
    const msg = document.getElementById('fatal-error-msg');
    if (overlay && msg) {
      overlay.classList.remove('hidden');
      msg.textContent = 'Runtime Notice: ' + (event.message || 'Unexpected issue');
    }
  });

  window.addEventListener('resize', resizeGame);
  window.addEventListener('orientationchange', resizeGame);

  window.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    resizeGame();
  });
})();
