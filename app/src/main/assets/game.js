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

    // --- UNIQUE TOWER SOUND EFFECTS ---
    arrowShoot() {
      // Archer: Crisp bow release twang dropping frequency rapidly
      this.playTone(680, 'triangle', 0.09, 0.16, 280);
    }
    cannonShoot() {
      // Cannon: Deep explosive blast thud and noise burst
      this.playTone(110, 'sawtooth', 0.35, 0.32, 28);
      this.playNoise(0.26, 0.28);
    }
    magicShoot() {
      // Magic: Mystical crystalline frost sweep with sparkling harmonic chime
      this.playTone(460, 'sine', 0.19, 0.18, 880);
      setTimeout(() => this.playTone(690, 'triangle', 0.14, 0.12, 1150), 35);
    }
    lightningShoot() {
      // Lightning: High-voltage crackling electric discharge zap
      this.playTone(980, 'square', 0.15, 0.22, 90);
      this.playNoise(0.12, 0.24);
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

  // --- 100 PLAYABLE CHALLENGES GENERATOR ---
  function generate100Challenges() {
    const list = [];
    const specs = [
      // 1 - 10: Introductory Trials
      { id: 1, title: 'SURVIVE 5 WAVES', desc: 'Survive 5 complete waves.', reward: 100, type: 'waves', target: 5, req: 0 },
      { id: 2, title: 'SURVIVE 10 WAVES', desc: 'Survive 10 complete waves.', reward: 200, type: 'waves', target: 10, req: 0 },
      { id: 3, title: 'KILL 50 ENEMIES', desc: 'Eliminate 50 enemy invaders.', reward: 150, type: 'kills', target: 50, req: 0 },
      { id: 4, title: 'KILL 100 ENEMIES', desc: 'Eliminate 100 enemy invaders.', reward: 250, type: 'kills', target: 100, req: 0 },
      { id: 5, title: 'DEFEAT 1 BOSS', desc: 'Slay the wave boss.', reward: 300, type: 'boss', target: 1, req: 0 },
      { id: 6, title: 'DEFEAT 5 BOSSES', desc: 'Slay 5 bosses across waves.', reward: 500, type: 'boss', target: 5, req: 2 },
      { id: 7, title: 'PERFECT DEFENSE', desc: 'Complete 5 waves without castle health falling below 100.', reward: 400, type: 'perfect', target: 5, req: 3 },
      { id: 8, title: 'SPEED RUNNER', desc: 'Complete 5 waves within 90 seconds.', reward: 500, type: 'timed', target: 5, timeLimit: 90, req: 4 },
      { id: 9, title: 'ARCHER MASTER', desc: 'Use Archer Towers to defeat 50 enemies.', reward: 350, type: 'archer_kills', target: 50, req: 5 },
      { id: 10, title: 'TITAN CRUSHER', desc: 'Defeat a Void Behemoth.', reward: 600, type: 'boss', target: 1, req: 6 },

      // 11 - 20: Weapon Specialists & Restraints
      { id: 11, title: 'CANNON BARRAGE', desc: 'Use Cannon Towers to defeat 50 enemies.', reward: 350, type: 'cannon_kills', target: 50, req: 7 },
      { id: 12, title: 'FROST DOMAIN', desc: 'Use Magic Towers to defeat 50 enemies.', reward: 350, type: 'magic_kills', target: 50, req: 8 },
      { id: 13, title: 'STORM CALLER', desc: 'Use Lightning Towers to defeat 50 enemies.', reward: 350, type: 'lightning_kills', target: 50, req: 9 },
      { id: 14, title: 'ARCHER ONLY 5', desc: 'Survive 5 waves using only Archer Towers.', reward: 400, type: 'archer_only', target: 5, allowedTowers: ['archer'], req: 10 },
      { id: 15, title: 'CANNON ONLY 5', desc: 'Survive 5 waves using only Cannon Towers.', reward: 450, type: 'cannon_only', target: 5, allowedTowers: ['cannon'], req: 11 },
      { id: 16, title: 'MAGIC ONLY 5', desc: 'Survive 5 waves using only Magic Towers.', reward: 500, type: 'magic_only', target: 5, allowedTowers: ['magic'], req: 12 },
      { id: 17, title: 'LIGHTNING ONLY 5', desc: 'Survive 5 waves using only Lightning Towers.', reward: 550, type: 'lightning_only', target: 5, allowedTowers: ['lightning'], req: 13 },
      { id: 18, title: 'SWARM DEFENSE', desc: 'Eliminate 75 fast scout invaders.', reward: 380, type: 'kills', target: 75, req: 14 },
      { id: 19, title: 'AIR PATROL', desc: 'Eliminate 60 enemies with fast targeting.', reward: 400, type: 'kills', target: 60, req: 15 },
      { id: 20, title: 'BUDGET GUARDIAN', desc: 'Survive 5 waves starting with only Rs 250.', reward: 500, type: 'budget', target: 5, startMoney: 250, req: 16 },

      // 21 - 30: Advanced Endurance
      { id: 21, title: 'SURVIVE 12 WAVES', desc: 'Survive 12 complete waves.', reward: 450, type: 'waves', target: 12, req: 17 },
      { id: 22, title: 'KILL 150 ENEMIES', desc: 'Eliminate 150 enemy invaders.', reward: 400, type: 'kills', target: 150, req: 18 },
      { id: 23, title: 'SPEED RUNNER II', desc: 'Complete 7 waves within 110 seconds.', reward: 550, type: 'timed', target: 7, timeLimit: 110, req: 19 },
      { id: 24, title: 'PERFECT DEFENSE II', desc: 'Complete 8 waves without castle taking damage.', reward: 600, type: 'perfect', target: 8, req: 20 },
      { id: 25, title: 'DEFEAT 3 BOSSES', desc: 'Defeat 3 bosses on the battlefield.', reward: 550, type: 'boss', target: 3, req: 21 },
      { id: 26, title: 'ARCHER SNIPER', desc: 'Kill 80 enemies with Archer Towers.', reward: 450, type: 'archer_kills', target: 80, req: 22 },
      { id: 27, title: 'ARTILLERY EXPERT', desc: 'Kill 80 enemies with Cannon Towers.', reward: 450, type: 'cannon_kills', target: 80, req: 23 },
      { id: 28, title: 'GLACIAL CURSE', desc: 'Kill 80 enemies with Magic Towers.', reward: 450, type: 'magic_kills', target: 80, req: 24 },
      { id: 29, title: 'THUNDERSTORM', desc: 'Kill 80 enemies with Lightning Towers.', reward: 450, type: 'lightning_kills', target: 80, req: 25 },
      { id: 30, title: 'BUDGET GUARDIAN II', desc: 'Survive 8 waves starting with only Rs 300.', reward: 600, type: 'budget', target: 8, startMoney: 300, req: 26 },

      // 31 - 40: Veteran Gauntlet
      { id: 31, title: 'SURVIVE 15 WAVES', desc: 'Survive 15 complete waves.', reward: 600, type: 'waves', target: 15, req: 27 },
      { id: 32, title: 'KILL 200 ENEMIES', desc: 'Eliminate 200 enemy invaders.', reward: 500, type: 'kills', target: 200, req: 28 },
      { id: 33, title: 'ARCHER ONLY 8', desc: 'Survive 8 waves using only Archer Towers.', reward: 650, type: 'archer_only', target: 8, allowedTowers: ['archer'], req: 29 },
      { id: 34, title: 'CANNON ONLY 8', desc: 'Survive 8 waves using only Cannon Towers.', reward: 700, type: 'cannon_only', target: 8, allowedTowers: ['cannon'], req: 30 },
      { id: 35, title: 'MAGIC ONLY 8', desc: 'Survive 8 waves using only Magic Towers.', reward: 750, type: 'magic_only', target: 8, allowedTowers: ['magic'], req: 31 },
      { id: 36, title: 'LIGHTNING ONLY 8', desc: 'Survive 8 waves using only Lightning Towers.', reward: 800, type: 'lightning_only', target: 8, allowedTowers: ['lightning'], req: 32 },
      { id: 37, title: 'SPEED RUNNER III', desc: 'Complete 10 waves within 150 seconds.', reward: 700, type: 'timed', target: 10, timeLimit: 150, req: 33 },
      { id: 38, title: 'PERFECT DEFENSE III', desc: 'Complete 10 waves without castle taking damage.', reward: 800, type: 'perfect', target: 10, req: 34 },
      { id: 39, title: 'DEFEAT 6 BOSSES', desc: 'Slay 6 bosses across the battlefield.', reward: 750, type: 'boss', target: 6, req: 35 },
      { id: 40, title: 'CARNAGE SPREE', desc: 'Eliminate 250 enemy invaders.', reward: 650, type: 'kills', target: 250, req: 36 },

      // 41 - 50: Elite Assaults
      { id: 41, title: 'SURVIVE 18 WAVES', desc: 'Survive 18 complete waves.', reward: 750, type: 'waves', target: 18, req: 37 },
      { id: 42, title: 'ARCHER ELITE', desc: 'Kill 120 enemies with Archer Towers.', reward: 600, type: 'archer_kills', target: 120, req: 38 },
      { id: 43, title: 'CANNON BLASTER', desc: 'Kill 120 enemies with Cannon Towers.', reward: 600, type: 'cannon_kills', target: 120, req: 39 },
      { id: 44, title: 'BLIZZARD MASTER', desc: 'Kill 120 enemies with Magic Towers.', reward: 600, type: 'magic_kills', target: 120, req: 40 },
      { id: 45, title: 'VOLT COMMANDER', desc: 'Kill 120 enemies with Lightning Towers.', reward: 600, type: 'lightning_kills', target: 120, req: 41 },
      { id: 46, title: 'BUDGET GUARDIAN III', desc: 'Survive 10 waves starting with only Rs 350.', reward: 800, type: 'budget', target: 10, startMoney: 350, req: 42 },
      { id: 47, title: 'SPEED RUNNER IV', desc: 'Complete 12 waves within 170 seconds.', reward: 850, type: 'timed', target: 12, timeLimit: 170, req: 43 },
      { id: 48, title: 'DEFEAT 8 BOSSES', desc: 'Slay 8 wave bosses.', reward: 900, type: 'boss', target: 8, req: 44 },
      { id: 49, title: 'KILL 300 ENEMIES', desc: 'Eliminate 300 enemy monsters.', reward: 800, type: 'kills', target: 300, req: 45 },
      { id: 50, title: 'MIDWAY CHAMPION', desc: 'Survive 20 complete waves.', reward: 1000, type: 'waves', target: 20, req: 46 },

      // 51 - 60: Frost & Thunder Trials
      { id: 51, title: 'PERFECT DEFENSE IV', desc: 'Complete 12 waves without castle taking damage.', reward: 950, type: 'perfect', target: 12, req: 47 },
      { id: 52, title: 'ARCHER ONLY 10', desc: 'Survive 10 waves using only Archer Towers.', reward: 900, type: 'archer_only', target: 10, allowedTowers: ['archer'], req: 48 },
      { id: 53, title: 'CANNON ONLY 10', desc: 'Survive 10 waves using only Cannon Towers.', reward: 950, type: 'cannon_only', target: 10, allowedTowers: ['cannon'], req: 49 },
      { id: 54, title: 'MAGIC ONLY 10', desc: 'Survive 10 waves using only Magic Towers.', reward: 1000, type: 'magic_only', target: 10, allowedTowers: ['magic'], req: 50 },
      { id: 55, title: 'LIGHTNING ONLY 10', desc: 'Survive 10 waves using only Lightning Towers.', reward: 1050, type: 'lightning_only', target: 10, allowedTowers: ['lightning'], req: 51 },
      { id: 56, title: 'KILL 350 ENEMIES', desc: 'Eliminate 350 enemy monsters.', reward: 900, type: 'kills', target: 350, req: 52 },
      { id: 57, title: 'SPEED RUNNER V', desc: 'Complete 15 waves within 200 seconds.', reward: 1000, type: 'timed', target: 15, timeLimit: 200, req: 53 },
      { id: 58, title: 'DEFEAT 10 BOSSES', desc: 'Slay 10 bosses across waves.', reward: 1100, type: 'boss', target: 10, req: 54 },
      { id: 59, title: 'ARCHER CHAMPION', desc: 'Kill 150 enemies with Archer Towers.', reward: 850, type: 'archer_kills', target: 150, req: 55 },
      { id: 60, title: 'SURVIVE 22 WAVES', desc: 'Endure 22 waves of assault.', reward: 1150, type: 'waves', target: 22, req: 56 },

      // 61 - 70: Fortress Siege
      { id: 61, title: 'CANNON COLOSSUS', desc: 'Kill 150 enemies with Cannon Towers.', reward: 850, type: 'cannon_kills', target: 150, req: 57 },
      { id: 62, title: 'CRYOMANCER', desc: 'Kill 150 enemies with Magic Towers.', reward: 850, type: 'magic_kills', target: 150, req: 58 },
      { id: 63, title: 'TEMPEST FURY', desc: 'Kill 150 enemies with Lightning Towers.', reward: 850, type: 'lightning_kills', target: 150, req: 59 },
      { id: 64, title: 'BUDGET GUARDIAN IV', desc: 'Survive 12 waves starting with only Rs 380.', reward: 1100, type: 'budget', target: 12, startMoney: 380, req: 60 },
      { id: 65, title: 'PERFECT DEFENSE V', desc: 'Complete 15 waves without castle taking damage.', reward: 1300, type: 'perfect', target: 15, req: 61 },
      { id: 66, title: 'KILL 400 ENEMIES', desc: 'Eliminate 400 enemy monsters.', reward: 1100, type: 'kills', target: 400, req: 62 },
      { id: 67, title: 'ARCHER ONLY 12', desc: 'Survive 12 waves using only Archer Towers.', reward: 1200, type: 'archer_only', target: 12, allowedTowers: ['archer'], req: 63 },
      { id: 68, title: 'CANNON ONLY 12', desc: 'Survive 12 waves using only Cannon Towers.', reward: 1250, type: 'cannon_only', target: 12, allowedTowers: ['cannon'], req: 64 },
      { id: 69, title: 'MAGIC ONLY 12', desc: 'Survive 12 waves using only Magic Towers.', reward: 1300, type: 'magic_only', target: 12, allowedTowers: ['magic'], req: 65 },
      { id: 70, title: 'LIGHTNING ONLY 12', desc: 'Survive 12 waves using only Lightning Towers.', reward: 1350, type: 'lightning_only', target: 12, allowedTowers: ['lightning'], req: 66 },

      // 71 - 80: Grand Citadel Defense
      { id: 71, title: 'SURVIVE 25 WAVES', desc: 'Endure 25 full waves.', reward: 1400, type: 'waves', target: 25, req: 67 },
      { id: 72, title: 'DEFEAT 12 BOSSES', desc: 'Slay 12 bosses.', reward: 1400, type: 'boss', target: 12, req: 68 },
      { id: 73, title: 'SPEED RUNNER VI', desc: 'Complete 18 waves within 240 seconds.', reward: 1350, type: 'timed', target: 18, timeLimit: 240, req: 69 },
      { id: 74, title: 'KILL 450 ENEMIES', desc: 'Eliminate 450 monsters.', reward: 1250, type: 'kills', target: 450, req: 70 },
      { id: 75, title: 'SHARPSHOOTER LEGEND', desc: 'Kill 200 enemies with Archer Towers.', reward: 1200, type: 'archer_kills', target: 200, req: 71 },
      { id: 76, title: 'BOMBARDMENT LEGEND', desc: 'Kill 200 enemies with Cannon Towers.', reward: 1200, type: 'cannon_kills', target: 200, req: 72 },
      { id: 77, title: 'FROSTBITE LEGEND', desc: 'Kill 200 enemies with Magic Towers.', reward: 1200, type: 'magic_kills', target: 200, req: 73 },
      { id: 78, title: 'THUNDER GOD', desc: 'Kill 200 enemies with Lightning Towers.', reward: 1200, type: 'lightning_kills', target: 200, req: 74 },
      { id: 79, title: 'BUDGET GUARDIAN V', desc: 'Survive 15 waves starting with only Rs 400.', reward: 1400, type: 'budget', target: 15, startMoney: 400, req: 75 },
      { id: 80, title: 'SURVIVE 28 WAVES', desc: 'Endure 28 full waves.', reward: 1600, type: 'waves', target: 28, req: 76 },

      // 81 - 90: Champion Crucible
      { id: 81, title: 'PERFECT DEFENSE VI', desc: 'Complete 18 waves without taking damage.', reward: 1700, type: 'perfect', target: 18, req: 77 },
      { id: 82, title: 'KILL 500 ENEMIES', desc: 'Eliminate 500 monsters.', reward: 1500, type: 'kills', target: 500, req: 78 },
      { id: 83, title: 'ARCHER ONLY 15', desc: 'Survive 15 waves using only Archer Towers.', reward: 1600, type: 'archer_only', target: 15, allowedTowers: ['archer'], req: 79 },
      { id: 84, title: 'CANNON ONLY 15', desc: 'Survive 15 waves using only Cannon Towers.', reward: 1650, type: 'cannon_only', target: 15, allowedTowers: ['cannon'], req: 80 },
      { id: 85, title: 'MAGIC ONLY 15', desc: 'Survive 15 waves using only Magic Towers.', reward: 1700, type: 'magic_only', target: 15, allowedTowers: ['magic'], req: 81 },
      { id: 86, title: 'LIGHTNING ONLY 15', desc: 'Survive 15 waves using only Lightning Towers.', reward: 1750, type: 'lightning_only', target: 15, allowedTowers: ['lightning'], req: 82 },
      { id: 87, title: 'DEFEAT 15 BOSSES', desc: 'Slay 15 wave bosses.', reward: 1800, type: 'boss', target: 15, req: 83 },
      { id: 88, title: 'SPEED RUNNER VII', desc: 'Complete 20 waves within 260 seconds.', reward: 1700, type: 'timed', target: 20, timeLimit: 260, req: 84 },
      { id: 89, title: 'SURVIVE 32 WAVES', desc: 'Endure 32 waves.', reward: 1900, type: 'waves', target: 32, req: 85 },
      { id: 90, title: 'TITAN SLAYER SUPREME', desc: 'Slay 18 wave bosses.', reward: 2000, type: 'boss', target: 18, req: 86 },

      // 91 - 100: Legend Trials
      { id: 91, title: 'KILL 600 ENEMIES', desc: 'Eliminate 600 enemy invaders.', reward: 2000, type: 'kills', target: 600, req: 87 },
      { id: 92, title: 'PERFECT DEFENSE VII', desc: 'Complete 20 waves without taking damage.', reward: 2300, type: 'perfect', target: 20, req: 88 },
      { id: 93, title: 'SURVIVE 35 WAVES', desc: 'Endure 35 waves.', reward: 2200, type: 'waves', target: 35, req: 89 },
      { id: 94, title: 'ARCHER DEMIGOD', desc: 'Kill 250 enemies with Archer Towers.', reward: 1800, type: 'archer_kills', target: 250, req: 90 },
      { id: 95, title: 'CANNON DEMIGOD', desc: 'Kill 250 enemies with Cannon Towers.', reward: 1800, type: 'cannon_kills', target: 250, req: 91 },
      { id: 96, title: 'MAGIC DEMIGOD', desc: 'Kill 250 enemies with Magic Towers.', reward: 1800, type: 'magic_kills', target: 250, req: 92 },
      { id: 97, title: 'LIGHTNING DEMIGOD', desc: 'Kill 250 enemies with Lightning Towers.', reward: 1800, type: 'lightning_kills', target: 250, req: 93 },
      { id: 98, title: 'SPEED RUNNER VIII', desc: 'Complete 25 waves within 320 seconds.', reward: 2500, type: 'timed', target: 25, timeLimit: 320, req: 94 },
      { id: 99, title: 'SURVIVE 40 WAVES', desc: 'Endure 40 waves of relentless siege.', reward: 3000, type: 'waves', target: 40, req: 95 },
      { id: 100, title: 'REALM GUARDIAN SUPREME', desc: 'Defeat 20 Bosses and survive 50 waves!', reward: 5000, type: 'waves', target: 50, req: 96 }
    ];

    specs.forEach(s => {
      list.push({
        id: s.id,
        numStr: `Challenge ${s.id < 10 ? '0' + s.id : s.id}`,
        title: s.title,
        desc: s.desc,
        reward: s.reward,
        type: s.type,
        target: s.target,
        timeLimit: s.timeLimit || 0,
        allowedTowers: s.allowedTowers || null,
        startMoney: s.startMoney !== undefined ? s.startMoney : 450,
        reqCompleted: s.req || 0,
        unlocked: s.id <= 5,
        completed: false,
        claimed: false,
        progress: 0
      });
    });

    return list;
  }

  const create100Challenges = generate100Challenges;

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
    _cache: null,

    // Safe localStorage wrapper
    _getItem(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    _setItem(key, val) {
      try {
        localStorage.setItem(key, val);
      } catch (e) {}
    },
    _removeItem(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    },

    init() {
      try {
        return this.load();
      } catch (e) {
        return this.createDefaultData();
      }
    },

    createDefaultData() {
      // First-time player defaults:
      // Player Name: Your Player, Money: Rs 0, Difficulty: Easy, Master Volume: 70%, Graphics: Medium, Castle Health: 100, Wave: 1
      const initialData = {
        playerName: "Your Player",
        playerPicture: "",
        money: 0,
        tasks: generate100Tasks(),
        challenges: generate100Challenges(),
        settings: {
          music: true,
          sfx: true,
          quality: "medium",
          difficulty: "easy",
          masterVolume: 0.70
        },
        difficulty: "easy",
        masterVolume: 0.70,
        graphicsQuality: "medium",
        castleHealth: 100,
        wave: 1,
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

    load() {
      try {
        const raw = this._getItem('vtd_save_data');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            // Player Name: preserve existing save data, migrate if dedicated key exists
            const savedName = this._getItem('vtd_player_name');
            if (savedName && savedName.trim()) {
              parsed.playerName = savedName.trim();
            } else if (!parsed.playerName || !parsed.playerName.trim()) {
              parsed.playerName = "Your Player";
            }

            // Player Picture
            const savedPic = this._getItem('vtd_player_avatar');
            if (savedPic) {
              parsed.playerPicture = savedPic;
            } else if (!parsed.playerPicture) {
              parsed.playerPicture = "";
            }

            // Money (Default: Rs 0)
            const savedMoney = this._getItem('vtd_money');
            if (savedMoney !== null && !isNaN(parseInt(savedMoney, 10))) {
              parsed.money = parseInt(savedMoney, 10);
            } else if (typeof parsed.money !== 'number' || isNaN(parsed.money)) {
              parsed.money = 0;
            }

            // Settings & Difficulty & Graphics & Master Volume
            if (!parsed.settings) parsed.settings = {};
            const savedDiff = this._getItem('vtd_difficulty');
            parsed.settings.difficulty = savedDiff || parsed.settings.difficulty || parsed.difficulty || 'easy';
            parsed.difficulty = parsed.settings.difficulty;

            const savedQual = this._getItem('vtd_graphics_quality');
            parsed.settings.quality = savedQual || parsed.settings.quality || parsed.graphicsQuality || 'medium';
            parsed.graphicsQuality = parsed.settings.quality;

            const savedVol = this._getItem('vtd_master_volume');
            if (savedVol !== null && !isNaN(parseFloat(savedVol))) {
              parsed.settings.masterVolume = parseFloat(savedVol);
            } else if (typeof parsed.settings.masterVolume !== 'number') {
              parsed.settings.masterVolume = 0.70;
            }
            parsed.masterVolume = parsed.settings.masterVolume;

            if (typeof parsed.castleHealth !== 'number') parsed.castleHealth = 100;
            if (typeof parsed.wave !== 'number') parsed.wave = 1;

            // Guarantee exactly 100 tasks
            if (!parsed.tasks || !Array.isArray(parsed.tasks) || parsed.tasks.length < 100) {
              const fresh = generate100Tasks();
              const oldMap = new Map((parsed.tasks || []).map(t => [t.id, t]));
              parsed.tasks = fresh.map(f => {
                const old = oldMap.get(f.id);
                return old ? { ...f, current: old.current || 0, claimed: !!old.claimed } : f;
              });
            }

            // Guarantee exactly 100 challenges
            const freshChs = generate100Challenges();
            let savedChList = [];
            try {
              const chRaw = this._getItem('vtd_challenges_data');
              if (chRaw) savedChList = JSON.parse(chRaw);
            } catch (e) {}
            if (!savedChList || savedChList.length === 0) {
              if (parsed.challenges && Array.isArray(parsed.challenges)) {
                savedChList = parsed.challenges;
              }
            }
            if (savedChList && savedChList.length > 0) {
              const chMap = new Map(savedChList.map(c => [c.id, c]));
              const completedCount = savedChList.filter(c => c.completed).length;
              freshChs.forEach(c => {
                const s = chMap.get(c.id);
                if (s) {
                  c.completed = !!s.completed;
                  c.claimed = !!s.claimed;
                  c.progress = typeof s.progress === 'number' ? s.progress : (typeof s.current === 'number' ? s.current : 0);
                }
                c.unlocked = (c.id <= 5) || c.completed || (completedCount >= (c.reqCompleted || 0));
              });
            }
            parsed.challenges = freshChs;

            this._cache = parsed;
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Storage load failed, creating clean defaults', e);
      }

      return this.createDefaultData();
    },

    save(data) {
      if (!data || typeof data !== 'object') return;
      this._cache = data;
      try {
        this._setItem('vtd_save_data', JSON.stringify(data));
      } catch (e) {}
    },

    // --- PLAYER NAME ---
    setPlayerName(name) {
      const validName = (typeof name === 'string' && name.trim()) ? name.trim().slice(0, 20) : "Your Player";
      this._setItem('vtd_player_name', validName);
      try {
        const data = this._cache || this.load();
        data.playerName = validName;
        this.save(data);
      } catch (e) {}
      // Update DOM immediately
      const menuEl = document.getElementById('menu-player-name');
      if (menuEl) menuEl.textContent = validName;
      if (window.activeGame) window.activeGame.playerName = validName;
      return validName;
    },
    getPlayerName() {
      const direct = this._getItem('vtd_player_name');
      if (direct && direct.trim()) return direct.trim();
      const data = this._cache || this.load();
      return (data && data.playerName && data.playerName.trim()) ? data.playerName.trim() : "Your Player";
    },

    // --- PLAYER AVATAR / PICTURE ---
    setPlayerAvatar(picture) {
      const picStr = typeof picture === 'string' ? picture : "";
      this._setItem('vtd_player_avatar', picStr);
      try {
        const data = this._cache || this.load();
        data.playerPicture = picStr;
        this.save(data);
      } catch (e) {}
      if (window.activeGame) {
        window.activeGame.playerAvatar = picStr;
        window.activeGame.renderProfileUI?.();
      }
      return picStr;
    },
    setPlayerPicture(picture) {
      return this.setPlayerAvatar(picture);
    },
    getPlayerAvatar() {
      const direct = this._getItem('vtd_player_avatar');
      if (direct) return direct;
      const data = this._cache || this.load();
      return (data && data.playerPicture) ? data.playerPicture : "";
    },
    getPlayerPicture() {
      return this.getPlayerAvatar();
    },

    // --- MONEY ---
    setMoney(amount) {
      const num = typeof amount === 'number' && !isNaN(amount) ? Math.max(0, Math.floor(amount)) : 0;
      this._setItem('vtd_money', num.toString());
      try {
        const data = this._cache || this.load();
        data.money = num;
        this.save(data);
      } catch (e) {}
      if (window.activeGame) {
        window.activeGame.money = num;
        window.activeGame.updateMoneyDisplay?.();
      }
      return num;
    },
    getMoney() {
      const direct = this._getItem('vtd_money');
      if (direct !== null && !isNaN(parseInt(direct, 10))) return parseInt(direct, 10);
      const data = this._cache || this.load();
      return (data && typeof data.money === 'number') ? data.money : 0;
    },

    // --- DIFFICULTY ---
    setDifficulty(diff) {
      const valid = diff === 'hard' || diff === 'normal' || diff === 'easy' ? diff : 'easy';
      this._setItem('vtd_difficulty', valid);
      try {
        const data = this._cache || this.load();
        data.difficulty = valid;
        if (!data.settings) data.settings = {};
        data.settings.difficulty = valid;
        this.save(data);
      } catch (e) {}
      if (window.activeGame) {
        window.activeGame.difficulty = valid;
        if (window.activeGame.settings) window.activeGame.settings.difficulty = valid;
      }
      return valid;
    },
    getDifficulty() {
      const direct = this._getItem('vtd_difficulty');
      if (direct) return direct;
      const data = this._cache || this.load();
      return (data && data.settings && data.settings.difficulty) ? data.settings.difficulty : 'easy';
    },

    // --- MASTER VOLUME ---
    setMasterVolume(vol) {
      const v = typeof vol === 'number' && !isNaN(vol) ? Math.max(0, Math.min(1, vol)) : 0.70;
      this._setItem('vtd_master_volume', v.toString());
      try {
        const data = this._cache || this.load();
        data.masterVolume = v;
        if (!data.settings) data.settings = {};
        data.settings.masterVolume = v;
        this.save(data);
      } catch (e) {}
      if (window.activeGame && window.activeGame.sound) {
        window.activeGame.sound.setMasterVolume(v);
      }
      return v;
    },
    getMasterVolume() {
      const direct = this._getItem('vtd_master_volume');
      if (direct !== null && !isNaN(parseFloat(direct))) return parseFloat(direct);
      const data = this._cache || this.load();
      return (data && data.settings && typeof data.settings.masterVolume === 'number') ? data.settings.masterVolume : 0.70;
    },

    // --- GRAPHICS QUALITY ---
    setGraphicsQuality(quality) {
      const q = quality === 'high' || quality === 'low' || quality === 'medium' ? quality : 'medium';
      this._setItem('vtd_graphics_quality', q);
      try {
        const data = this._cache || this.load();
        data.graphicsQuality = q;
        if (!data.settings) data.settings = {};
        data.settings.quality = q;
        this.save(data);
      } catch (e) {}
      if (window.activeGame) {
        if (window.activeGame.settings) window.activeGame.settings.quality = q;
      }
      return q;
    },
    getGraphicsQuality() {
      const direct = this._getItem('vtd_graphics_quality');
      if (direct) return direct;
      const data = this._cache || this.load();
      return (data && data.settings && data.settings.quality) ? data.settings.quality : 'medium';
    },

    // --- WAVE PROGRESS ---
    setWave(w) {
      const wave = typeof w === 'number' && !isNaN(w) ? Math.max(1, Math.floor(w)) : 1;
      this._setItem('vtd_wave', wave.toString());
      try {
        const data = this._cache || this.load();
        data.wave = wave;
        this.save(data);
      } catch (e) {}
      return wave;
    },
    setWaveProgress(w) {
      return this.setWave(w);
    },
    getWave() {
      const direct = this._getItem('vtd_wave');
      if (direct !== null && !isNaN(parseInt(direct, 10))) return parseInt(direct, 10);
      const data = this._cache || this.load();
      return (data && typeof data.wave === 'number') ? data.wave : 1;
    },
    getWaveProgress() {
      return this.getWave();
    },

    // --- CASTLE HEALTH ---
    setCastleHealth(hp) {
      const health = typeof hp === 'number' && !isNaN(hp) ? Math.max(0, Math.min(100, Math.floor(hp))) : 100;
      this._setItem('vtd_castle_health', health.toString());
      try {
        const data = this._cache || this.load();
        data.castleHealth = health;
        this.save(data);
      } catch (e) {}
      return health;
    },
    getCastleHealth() {
      const direct = this._getItem('vtd_castle_health');
      if (direct !== null && !isNaN(parseInt(direct, 10))) return parseInt(direct, 10);
      const data = this._cache || this.load();
      return (data && typeof data.castleHealth === 'number') ? data.castleHealth : 100;
    },

    // --- TASKS ---
    saveTasks(tasks) {
      if (!Array.isArray(tasks)) return;
      try {
        const minimal = tasks.map(t => ({
          id: t.id,
          current: t.current || 0,
          claimed: !!t.claimed
        }));
        this._setItem('vtd_tasks_data', JSON.stringify(minimal));
        const data = this._cache || this.load();
        data.tasks = tasks;
        this.save(data);
      } catch (e) {}
    },
    getTasks() {
      const data = this._cache || this.load();
      return (data && data.tasks) ? data.tasks : generate100Tasks();
    },

    // --- CHALLENGES ---
    saveChallenges(challenges) {
      if (!Array.isArray(challenges)) return;
      try {
        const minimal = challenges.map(c => ({
          id: c.id,
          completed: !!c.completed,
          claimed: !!c.claimed,
          unlocked: !!c.unlocked,
          progress: c.progress || 0
        }));
        this._setItem('vtd_challenges_data', JSON.stringify(minimal));
        const data = this._cache || this.load();
        data.challenges = challenges;
        this.save(data);
      } catch (e) {}
    },
    getChallenges() {
      const data = this._cache || this.load();
      return (data && data.challenges) ? data.challenges : generate100Challenges();
    },

    // --- STATISTICS ---
    saveStatistics(stats) {
      if (!stats || typeof stats !== 'object') return;
      try {
        const data = this._cache || this.load();
        Object.assign(data, stats);
        this.save(data);
      } catch (e) {}
    },
    getStatistics() {
      const data = this._cache || this.load();
      return {
        totalKills: data?.totalKills || 0,
        highestWave: data?.highestWave || 0,
        totalPlayingTime: data?.totalPlayingTime || 0,
        towersBuilt: data?.towersBuilt || 0,
        towersUpgraded: data?.towersUpgraded || 0,
        bossesDefeated: data?.bossesDefeated || 0,
        totalMoneyEarned: data?.totalMoneyEarned || 0,
        perfectWavesCount: data?.perfectWavesCount || 0,
        speedWavesCount: data?.speedWavesCount || 0
      };
    },

    // --- RESET ALL ---
    resetAll() {
      const keys = [
        'vtd_save_data', 'vtd_challenges_data', 'vtd_tasks_data',
        'vtd_money', 'vtd_player_name', 'vtd_player_avatar',
        'vtd_tasks', 'vtd_challenges', 'vtd_settings',
        'vtd_difficulty', 'vtd_graphics_quality', 'vtd_master_volume',
        'vtd_wave', 'vtd_castle_health'
      ];
      keys.forEach(k => this._removeItem(k));
      this._cache = null;
      return this.load();
    }
  };

  // Safe storage initialization before any screens or UI
  Storage.init();
  window.Storage = Storage;
  window.setPlayerName = (name) => Storage.setPlayerName(name);
  window.getPlayerName = () => Storage.getPlayerName();

  // --- GAME CONSTANTS & DEFINITIONS ---
  const LOGICAL_WIDTH = 360;
  const LOGICAL_HEIGHT = 640;

  // Grid Configuration for Long Vertical Battlefield
  const TILE_SIZE = 40;
  const GRID_COLS = 9;   // 9 * 40 = 360px (fills width)
  const GRID_ROWS = 28;  // 28 * 40 = 1120px (long vertical battlefield with scroll)
  const MAP_WIDTH = GRID_COLS * TILE_SIZE;
  const MAP_HEIGHT = GRID_ROWS * TILE_SIZE;

  // Long winding dirt/stone enemy path through the grid with many turns and switchbacks
  const PATH_WAYPOINTS = [
    { x: 180, y: -20 },   // Top Enemy Spawn (col 4, above row 0)
    { x: 180, y: 100 },   // Down to (col 4, row 2)
    { x: 300, y: 100 },   // Right to (col 7, row 2)
    { x: 300, y: 220 },   // Down to (col 7, row 5)
    { x: 60,  y: 220 },   // Left switchback across to (col 1, row 5)
    { x: 60,  y: 380 },   // Down to (col 1, row 9)
    { x: 300, y: 380 },   // Right switchback across to (col 7, row 9)
    { x: 300, y: 540 },   // Down to (col 7, row 13)
    { x: 60,  y: 540 },   // Left switchback across to (col 1, row 13)
    { x: 60,  y: 700 },   // Down to (col 1, row 17)
    { x: 300, y: 700 },   // Right switchback across to (col 7, row 17)
    { x: 300, y: 860 },   // Down to (col 7, row 21)
    { x: 180, y: 860 },   // Left to (col 4, row 21)
    { x: 180, y: 1020 }   // Down to Castle Gate (col 4, row 25.5)
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
    if (dist <= 0) return { x: PATH_WAYPOINTS[0].x, y: PATH_WAYPOINTS[0].y, angle: Math.PI / 2 };
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
    return { x: 180, y: 1020, angle: Math.PI / 2 };
  }

  // Path detection for grid tiles
  function isTileOnPath(col, row) {
    const tileCenterX = col * TILE_SIZE + TILE_SIZE / 2;
    const tileCenterY = row * TILE_SIZE + TILE_SIZE / 2;
    for (let seg of PATH_SEGMENTS) {
      const x1 = seg.p1.x, y1 = seg.p1.y, x2 = seg.p2.x, y2 = seg.p2.y;
      const dx = x2 - x1, dy = y2 - y1;
      const lenSq = dx * dx + dy * dy;
      let t = 0;
      if (lenSq > 0) {
        t = Math.max(0, Math.min(1, ((tileCenterX - x1) * dx + (tileCenterY - y1) * dy) / lenSq));
      }
      const projX = x1 + t * dx;
      const projY = y1 + t * dy;
      const dist = Math.hypot(tileCenterX - projX, tileCenterY - projY);
      if (dist < TILE_SIZE * 0.55) {
        return true;
      }
    }
    return false;
  }

  // Decorative nature elements on select grass tiles (pine trees, rocks, bushes, flowers)
  const NATURE_DECORATIONS = [
    { col: 1, row: 1, type: 'trees', count: 4 },
    { col: 2, row: 1, type: 'trees', count: 4 },
    { col: 5, row: 1, type: 'bushes' },
    { col: 6, row: 1, type: 'trees', count: 4 },
    { col: 2, row: 3, type: 'trees', count: 6 },
    { col: 3, row: 3, type: 'trees', count: 6 },
    { col: 4, row: 3, type: 'rocks', count: 3 },
    { col: 1, row: 7, type: 'bushes' },
    { col: 3, row: 7, type: 'trees', count: 6 },
    { col: 4, row: 7, type: 'trees', count: 6 },
    { col: 5, row: 7, type: 'flowers', count: 4 },
    { col: 3, row: 11, type: 'rocks', count: 3 },
    { col: 4, row: 11, type: 'trees', count: 6 },
    { col: 5, row: 11, type: 'trees', count: 6 },
    { col: 6, row: 11, type: 'bushes' },
    { col: 1, row: 15, type: 'bushes' },
    { col: 2, row: 15, type: 'trees', count: 6 },
    { col: 3, row: 15, type: 'trees', count: 6 },
    { col: 4, row: 15, type: 'flowers', count: 4 },
    { col: 1, row: 19, type: 'bushes' },
    { col: 3, row: 19, type: 'trees', count: 6 },
    { col: 4, row: 19, type: 'trees', count: 6 },
    { col: 5, row: 19, type: 'rocks', count: 3 },
    { col: 1, row: 23, type: 'trees', count: 6 },
    { col: 2, row: 23, type: 'trees', count: 6 },
    { col: 5, row: 23, type: 'bushes' },
    { col: 6, row: 23, type: 'rocks', count: 3 }
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

  // --- MENU LIVE DEFENSE BATTLE BACKGROUND ---
  class MenuBattleBackground {
    constructor() {
      this.canvas = document.getElementById('menu-battle-canvas');
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.running = false;
      this.lastTime = 0;
      this.rafId = null;

      this.scale = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this.dpr = 1;

      // Long winding stone enemy path
      this.waypoints = [
        { x: 180, y: -25 },
        { x: 180, y: 55 },
        { x: 65,  y: 110 },
        { x: 65,  y: 200 },
        { x: 295, y: 250 },
        { x: 295, y: 360 },
        { x: 65,  y: 410 },
        { x: 65,  y: 490 },
        { x: 180, y: 540 },
        { x: 180, y: 640 }
      ];

      this.segments = [];
      this.totalPathLength = 0;
      for (let i = 0; i < this.waypoints.length - 1; i++) {
        const p1 = this.waypoints[i];
        const p2 = this.waypoints[i + 1];
        const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        this.segments.push({ p1, p2, length: len, startDist: this.totalPathLength });
        this.totalPathLength += len;
      }

      // Defensive towers placed beside the path actively fighting
      this.towers = [
        { type: 'archer', x: 125, y: 80, range: 95, interval: 0.65, cooldown: 0.2, angle: 0, recoil: 0, color: '#22c55e', name: 'Archer Tower' },
        { type: 'archer', x: 235, y: 390, range: 95, interval: 0.6, cooldown: 0.4, angle: 0, recoil: 0, color: '#22c55e', name: 'Archer Tower' },
        { type: 'cannon', x: 235, y: 175, range: 90, interval: 1.4, cooldown: 0.6, angle: 0, recoil: 0, color: '#ef4444', name: 'Cannon Tower' },
        { type: 'cannon', x: 125, y: 440, range: 90, interval: 1.3, cooldown: 1.0, angle: 0, recoil: 0, color: '#ef4444', name: 'Cannon Tower' },
        { type: 'magic', x: 125, y: 230, range: 100, interval: 1.0, cooldown: 0.1, angle: 0, energy: 0, color: '#8b5cf6', name: 'Magic Tower' },
        { type: 'magic', x: 235, y: 515, range: 100, interval: 0.95, cooldown: 0.5, angle: 0, energy: 0, color: '#8b5cf6', name: 'Magic Tower' },
        { type: 'lightning', x: 235, y: 290, range: 110, interval: 1.1, cooldown: 0.3, angle: 0, charge: 0, color: '#f59e0b', name: 'Lightning Tower' },
        { type: 'lightning', x: 125, y: 335, range: 110, interval: 1.15, cooldown: 0.8, angle: 0, charge: 0, color: '#f59e0b', name: 'Lightning Tower' }
      ];

      this.enemies = [];
      this.projectiles = [];
      this.particles = [];
      this.floatingTexts = [];
      this.lightningArcs = [];

      this.spawnTimer = 0.6;
      this.castleHitTimer = 0;
      this.smokeTimer = 0;
      this.castleShootTimer = 1.0;

      this.seedInitialBattle();
      this.resize();
      this.resume();
    }

    seedInitialBattle() {
      // Seed 6 staggered enemies across the path for immediate active battle
      const seeds = [
        { type: 'basic', dist: 60 },
        { type: 'fast',  dist: 150 },
        { type: 'heavy', dist: 250 },
        { type: 'flying', dist: 350 },
        { type: 'basic', dist: 450 },
        { type: 'fast',  dist: 520 }
      ];
      seeds.forEach(s => this.spawnEnemy(s.type, s.dist));
    }

    spawnEnemy(typeKey, initialDist = -15) {
      const defs = {
        basic: { name: 'Goblin Scout', color: '#10b981', radius: 9, hp: 60, maxHp: 60, speed: 44, flying: false },
        fast:  { name: 'Shadow Imp', color: '#f97316', radius: 8, hp: 45, maxHp: 45, speed: 64, flying: false },
        heavy: { name: 'Armored Orc', color: '#64748b', radius: 12, hp: 160, maxHp: 160, speed: 28, flying: false },
        flying: { name: 'Winged Harpy', color: '#a855f7', radius: 10, hp: 70, maxHp: 70, speed: 50, flying: true }
      };
      const def = defs[typeKey] || defs.basic;
      const pos = this.getPathPosition(initialDist);
      this.enemies.push({
        type: typeKey,
        ...def,
        dist: initialDist,
        x: pos.x,
        y: pos.y,
        angle: pos.angle,
        slowTimer: 0,
        slowFactor: 1,
        hitFlash: 0
      });
    }

    getPathPosition(dist) {
      if (dist <= 0) return { x: this.waypoints[0].x, y: this.waypoints[0].y, angle: Math.PI / 2 };
      for (let seg of this.segments) {
        if (dist <= seg.startDist + seg.length) {
          const segDist = dist - seg.startDist;
          const ratio = seg.length > 0 ? segDist / seg.length : 0;
          const x = seg.p1.x + (seg.p2.x - seg.p1.x) * ratio;
          const y = seg.p1.y + (seg.p2.y - seg.p1.y) * ratio;
          const angle = Math.atan2(seg.p2.y - seg.p1.y, seg.p2.x - seg.p1.x);
          return { x, y, angle };
        }
      }
      const last = this.waypoints[this.waypoints.length - 1];
      return { x: last.x, y: last.y, angle: Math.PI / 2 };
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;

      const scaleX = rect.width / LOGICAL_WIDTH;
      const scaleY = rect.height / LOGICAL_HEIGHT;
      this.scale = Math.min(scaleX, scaleY);
      this.offsetX = (rect.width - LOGICAL_WIDTH * this.scale) / 2;
      this.offsetY = (rect.height - LOGICAL_HEIGHT * this.scale) / 2;
      this.dpr = dpr;
    }

    pause() {
      this.running = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    resume() {
      if (this.running) return;
      this.running = true;
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(ts => this.loop(ts));
    }

    loop(ts) {
      if (!this.running) return;
      const dt = Math.min((ts - this.lastTime) / 1000, 0.1);
      this.lastTime = ts;

      this.update(dt);
      this.render();

      this.rafId = requestAnimationFrame(t => this.loop(t));
    }

    update(dt) {
      if (this.castleHitTimer > 0) this.castleHitTimer -= dt;

      // Chimney & environmental dust effects
      this.smokeTimer -= dt;
      if (this.smokeTimer <= 0) {
        this.smokeTimer = 0.2;
        this.particles.push({
          x: 180 + (Math.random() - 0.5) * 22,
          y: 540,
          vx: (Math.random() - 0.5) * 8,
          vy: -20 - Math.random() * 12,
          color: 'rgba(148, 163, 184, 0.45)',
          size: 3 + Math.random() * 3,
          maxLife: 1.3,
          life: 1.3,
          alpha: 0.5
        });
      }

      // Continuous enemy spawning
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const types = ['basic', 'fast', 'heavy', 'flying'];
        const chosen = types[Math.floor(Math.random() * types.length)];
        this.spawnEnemy(chosen);
        this.spawnTimer = 1.6 + Math.random() * 0.9;
      }

      // Castle Defensive Activity: Wall archers fire defensive arrows
      this.castleShootTimer -= dt;
      if (this.castleShootTimer <= 0) {
        this.castleShootTimer = 1.1;
        // Check for enemies within castle defense range (y > 430)
        let castleTarget = null;
        let maxDist = -1;
        for (let e of this.enemies) {
          if (e.y > 430 && e.dist > maxDist) {
            maxDist = e.dist;
            castleTarget = e;
          }
        }
        if (castleTarget) {
          const turretSide = Math.random() > 0.5 ? -45 : 45;
          const originX = 180 + turretSide;
          const originY = 545;
          const ang = Math.atan2(castleTarget.y - originY, castleTarget.x - originX);
          this.projectiles.push({
            type: 'arrow',
            x: originX,
            y: originY,
            target: castleTarget,
            targetX: castleTarget.x,
            targetY: castleTarget.y,
            angle: ang,
            speed: 340,
            damage: 20,
            life: 1.2
          });
        }
      }

      // Update enemies
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (e.slowTimer > 0) {
          e.slowTimer -= dt;
          if (e.slowTimer <= 0) e.slowFactor = 1;
        }
        if (e.hitFlash > 0) e.hitFlash -= dt * 6;

        e.dist += e.speed * e.slowFactor * dt;
        const pos = this.getPathPosition(e.dist);
        e.x = pos.x;
        e.y = pos.y;
        e.angle = pos.angle;

        // Occasional enemy reaching castle to trigger active battle impact!
        if (e.dist >= this.totalPathLength - 10) {
          this.castleHitTimer = 0.5;
          // Spawn impact blast, sparks, and stone dust
          for (let k = 0; k < 16; k++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 30 + Math.random() * 65;
            this.particles.push({
              x: 180,
              y: 575,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              color: Math.random() > 0.4 ? '#ef4444' : '#fbbf24',
              size: 2.5 + Math.random() * 3,
              maxLife: 0.5,
              life: 0.5,
              alpha: 1
            });
          }
          this.enemies.splice(i, 1);
        }
      }

      // Update Towers: combat targeting and recoil
      for (let t of this.towers) {
        if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt * 4.5);
        t.cooldown -= dt;

        // Find nearest valid enemy in range
        let target = null;
        let minDist = t.range;
        for (let e of this.enemies) {
          if (t.type === 'cannon' && e.flying) continue; // Cannons don't target flying harpies
          const d = Math.hypot(e.x - t.x, e.y - t.y);
          if (d <= minDist) {
            minDist = d;
            target = e;
          }
        }

        if (target) {
          t.angle = Math.atan2(target.y - t.y, target.x - t.x);
          if (t.cooldown <= 0) {
            t.cooldown = t.interval;
            t.recoil = 1.0;
            this.towerShoot(t, target);
          }
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

        if (p.type === 'arrow' || p.type === 'frostbolt') {
          if (p.target && this.enemies.includes(p.target)) {
            p.targetX = p.target.x;
            p.targetY = p.target.y;
          }
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          const d = Math.hypot(dx, dy);
          if (d < 14) {
            this.onProjectileHit(p);
            this.projectiles.splice(i, 1);
          } else {
            const step = p.speed * dt;
            p.x += (dx / d) * step;
            p.y += (dy / d) * step;
            p.angle = Math.atan2(dy, dx);
            if (p.type === 'frostbolt' && Math.random() > 0.3) {
              this.particles.push({
                x: p.x, y: p.y,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                color: '#38bdf8',
                size: 2.2,
                maxLife: 0.25,
                life: 0.25,
                alpha: 0.9
              });
            }
          }
        } else if (p.type === 'cannonball') {
          p.progress += dt / p.duration;
          p.x = p.startX + (p.targetX - p.startX) * p.progress;
          p.y = p.startY + (p.targetY - p.startY) * p.progress - 4 * p.arcHeight * p.progress * (1 - p.progress);

          // Smoke puffs along arc
          if (Math.random() > 0.25) {
            this.particles.push({
              x: p.x, y: p.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              color: 'rgba(100, 116, 139, 0.6)',
              size: 2.8,
              maxLife: 0.35,
              life: 0.35,
              alpha: 0.6
            });
          }

          if (p.progress >= 1) {
            this.onProjectileHit(p);
            this.projectiles.splice(i, 1);
          }
        }
      }

      // Update Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.life -= dt;
        if (pt.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.alpha = pt.life / pt.maxLife;
      }

      // Update Lightning Arcs
      for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
        this.lightningArcs[i].life -= dt;
        if (this.lightningArcs[i].life <= 0) {
          this.lightningArcs.splice(i, 1);
        }
      }

      // Update Floating Texts
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.life -= dt;
        if (ft.life <= 0) {
          this.floatingTexts.splice(i, 1);
          continue;
        }
        ft.y += ft.vy * dt;
        ft.alpha = ft.life / ft.maxLife;
      }
    }

    towerShoot(tower, target) {
      if (tower.type === 'archer') {
        this.projectiles.push({
          type: 'arrow',
          x: tower.x,
          y: tower.y,
          target,
          targetX: target.x,
          targetY: target.y,
          angle: tower.angle,
          speed: 340,
          damage: 18,
          life: 1.2
        });
      } else if (tower.type === 'cannon') {
        // Muzzle flash particle
        const mx = tower.x + Math.cos(tower.angle) * 16;
        const my = tower.y + Math.sin(tower.angle) * 16;
        this.particles.push({
          x: mx, y: my,
          vx: Math.cos(tower.angle) * 20,
          vy: Math.sin(tower.angle) * 20,
          color: '#fbbf24',
          size: 5,
          maxLife: 0.12,
          life: 0.12,
          alpha: 1
        });

        this.projectiles.push({
          type: 'cannonball',
          startX: mx,
          startY: my,
          x: mx,
          y: my,
          targetX: target.x,
          targetY: target.y,
          progress: 0,
          duration: 0.6,
          arcHeight: 38,
          splashRadius: 44,
          damage: 50,
          life: 1.5
        });
      } else if (tower.type === 'magic') {
        this.projectiles.push({
          type: 'frostbolt',
          x: tower.x,
          y: tower.y,
          target,
          targetX: target.x,
          targetY: target.y,
          speed: 250,
          damage: 24,
          slowDuration: 2.2,
          slowFactor: 0.5,
          life: 1.2
        });
      } else if (tower.type === 'lightning') {
        // Jump between up to 3 enemies
        const chained = [target];
        let curr = target;
        for (let step = 1; step < 3; step++) {
          let nearest = null;
          let minD = 95;
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

        let prev = { x: tower.x, y: tower.y };
        chained.forEach((e, idx) => {
          this.lightningArcs.push({
            x1: prev.x, y1: prev.y,
            x2: e.x, y2: e.y,
            life: 0.18
          });
          prev = { x: e.x, y: e.y };
          const dmg = Math.round(38 * (1 - idx * 0.22));
          this.damageEnemy(e, dmg);
        });
      }
    }

    onProjectileHit(proj) {
      if (proj.type === 'cannonball') {
        // Visible blast explosion
        this.spawnExplosion(proj.targetX, proj.targetY, '#ef4444', 18);
        this.spawnExplosion(proj.targetX, proj.targetY, '#fbbf24', 12);
        for (let e of this.enemies) {
          if (!e.flying) {
            const d = Math.hypot(e.x - proj.targetX, e.y - proj.targetY);
            if (d <= proj.splashRadius) {
              const falloff = 1 - (d / proj.splashRadius) * 0.45;
              this.damageEnemy(e, Math.round(proj.damage * falloff));
            }
          }
        }
      } else if (proj.type === 'arrow') {
        this.spawnExplosion(proj.x, proj.y, '#22c55e', 5);
        if (proj.target && this.enemies.includes(proj.target)) {
          this.damageEnemy(proj.target, proj.damage);
        }
      } else if (proj.type === 'frostbolt') {
        this.spawnExplosion(proj.x, proj.y, '#38bdf8', 10);
        if (proj.target && this.enemies.includes(proj.target)) {
          proj.target.slowTimer = proj.slowDuration;
          proj.target.slowFactor = proj.slowFactor;
          this.damageEnemy(proj.target, proj.damage);
        }
      }
    }

    damageEnemy(enemy, dmg) {
      enemy.hp -= dmg;
      enemy.hitFlash = 1;
      this.floatingTexts.push({
        x: enemy.x + (Math.random() - 0.5) * 8,
        y: enemy.y - 12,
        text: `-${dmg}`,
        color: '#f8fafc',
        vy: -26,
        maxLife: 0.5,
        life: 0.5,
        alpha: 1
      });

      if (enemy.hp <= 0) {
        const idx = this.enemies.indexOf(enemy);
        if (idx !== -1) {
          this.enemies.splice(idx, 1);
          this.spawnExplosion(enemy.x, enemy.y, enemy.color, 16);
        }
      }
    }

    spawnExplosion(x, y, color, count) {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 20 + Math.random() * 80;
        this.particles.push({
          x, y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          color,
          size: 2 + Math.random() * 3,
          maxLife: 0.35 + Math.random() * 0.25,
          life: 0.35 + Math.random() * 0.25,
          alpha: 1
        });
      }
    }

    render() {
      if (!this.ctx) return;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.save();
      ctx.scale(this.dpr, this.dpr);
      ctx.translate(this.offsetX, this.offsetY);
      ctx.scale(this.scale, this.scale);

      // Subtle cinematic camera drift
      const t = performance.now();
      const camX = Math.sin(t * 0.00025) * 4.0;
      const camY = Math.cos(t * 0.0002) * 3.5;
      const camZoom = 1.0 + Math.sin(t * 0.00015) * 0.01;

      ctx.translate(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
      ctx.scale(camZoom, camZoom);
      ctx.translate(-LOGICAL_WIDTH / 2 + camX, -LOGICAL_HEIGHT / 2 + camY);

      // 1. Terrain Grass Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      // Grass terrain texture
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= LOGICAL_WIDTH; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, LOGICAL_HEIGHT); ctx.stroke();
      }
      for (let y = 0; y <= LOGICAL_HEIGHT; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(LOGICAL_WIDTH, y); ctx.stroke();
      }

      // Decorative trees/shrubs along the countryside
      const decors = [
        { x: 30, y: 40, r: 8, c: '#065f46' },
        { x: 320, y: 80, r: 10, c: '#047857' },
        { x: 330, y: 200, r: 9, c: '#065f46' },
        { x: 35, y: 310, r: 11, c: '#047857' },
        { x: 325, y: 450, r: 9, c: '#065f46' },
        { x: 30, y: 550, r: 10, c: '#047857' }
      ];
      for (let d of decors) {
        ctx.fillStyle = d.c;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.arc(d.x - 2, d.y - 2, d.r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Long Winding Stone Enemy Path (Cobblestone textured)
      // Path bed shadow
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 32;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(this.waypoints[0].x, this.waypoints[0].y);
      for (let i = 1; i < this.waypoints.length; i++) {
        ctx.lineTo(this.waypoints[i].x, this.waypoints[i].y);
      }
      ctx.stroke();

      // Outer stone border
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 28;
      ctx.stroke();

      // Cobblestone stone slabs
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 22;
      ctx.stroke();

      // Worn center trail
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Top Enemy Entrance Stone Arch
      const ent = this.waypoints[1];
      ctx.save();
      ctx.translate(ent.x, ent.y - 22);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-24, -8, 48, 16);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-24, -8, 48, 16);
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚔️ SPAWN GATE', 0, 0);
      ctx.restore();

      // 4. Defensive Towers beside the path
      for (let tw of this.towers) {
        ctx.save();
        ctx.translate(tw.x, tw.y);

        // Stone Base
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = tw.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (tw.type === 'archer') {
          // Archer Tower: Rotating swivel turret and drawn bow
          ctx.save();
          ctx.rotate(tw.angle);
          // Turret wooden platform
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.arc(0, 0, 11, 0, Math.PI * 2);
          ctx.fill();
          // Bow
          const recoilOff = (tw.recoil || 0) * 3;
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(5 - recoilOff, 0, 9, -Math.PI / 2.2, Math.PI / 2.2);
          ctx.stroke();
          // Bowstring
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(5 - recoilOff + Math.cos(-Math.PI / 2.2) * 9, Math.sin(-Math.PI / 2.2) * 9);
          ctx.lineTo(-2 - recoilOff, 0);
          ctx.lineTo(5 - recoilOff + Math.cos(Math.PI / 2.2) * 9, Math.sin(Math.PI / 2.2) * 9);
          ctx.stroke();
          // Arrow on bow
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-2 - recoilOff, 0);
          ctx.lineTo(12 - recoilOff, 0);
          ctx.stroke();
          ctx.restore();

          // Pennant
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();

        } else if (tw.type === 'cannon') {
          // Cannon Tower: Rotating iron barrel with recoil kickback
          ctx.save();
          ctx.rotate(tw.angle);
          const kickback = (tw.recoil || 0) * 5;
          // Cannon mount
          ctx.fillStyle = '#334155';
          ctx.fillRect(-7, -7, 14, 14);
          // Cannon barrel
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-2 - kickback, -5, 17, 10);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-2 - kickback, -5, 17, 10);
          // Cannon bore
          ctx.fillStyle = '#000000';
          ctx.fillRect(14 - kickback, -4, 2, 8);
          ctx.restore();

        } else if (tw.type === 'magic') {
          // Magic Tower: Arcane obelisk and glowing floating crystal orb
          ctx.fillStyle = '#312e81';
          ctx.beginPath();
          ctx.arc(0, 0, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Glowing floating orb
          const orbBob = Math.sin(t * 0.005) * 3;
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(0, orbBob, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Orbiting magical sparkle crystals
          for (let s = 0; s < 3; s++) {
            const sAng = t * 0.004 + s * ((Math.PI * 2) / 3);
            const sx = Math.cos(sAng) * 12;
            const sy = Math.sin(sAng) * 12;
            ctx.fillStyle = '#c084fc';
            ctx.beginPath();
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
            ctx.fill();
          }

        } else if (tw.type === 'lightning') {
          // Lightning Tower: Tesla coil with crackling electric sparks
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.arc(0, 0, 11, 0, Math.PI * 2);
          ctx.fill();
          // Copper coil rings
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.stroke();
          // Central conductor sphere
          ctx.fillStyle = '#fef08a';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 9;
          ctx.beginPath();
          ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Crackling electric spark rings
          ctx.strokeStyle = 'rgba(254, 240, 138, 0.7)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          const spkR = 14 + Math.sin(t * 0.012) * 2;
          ctx.arc(0, 0, spkR, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // 5. Lightning Arcs
      for (let arc of this.lightningArcs) {
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(arc.x1, arc.y1);
        ctx.lineTo(arc.x2, arc.y2);
        ctx.stroke();

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

      // 6. Enemies
      for (let e of this.enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);

        // Ground shadow for flying or ground enemies
        if (e.flying) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.beginPath();
          ctx.ellipse(0, 12, e.radius, e.radius * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.translate(0, -9); // Fly above ground
        } else {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.ellipse(0, e.radius * 0.7, e.radius * 0.8, e.radius * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Enemy visual rendering
        if (e.type === 'basic') {
          // Goblin Scout: Green skin, pointy ears, small dagger
          ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#10b981';
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#064e3b';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Pointy ears
          ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#059669';
          ctx.beginPath();
          ctx.moveTo(-e.radius, -2); ctx.lineTo(-e.radius - 5, -5); ctx.lineTo(-e.radius + 1, 3);
          ctx.moveTo(e.radius, -2); ctx.lineTo(e.radius + 5, -5); ctx.lineTo(e.radius - 1, 3);
          ctx.fill();
          // Face
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-3, -2, 2, 2);
          ctx.fillRect(2, -2, 2, 2);

        } else if (e.type === 'fast') {
          // Shadow Imp: Dark violet, demon horns, glowing eyes
          ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#4338ca';
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#312e81';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Horns
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(-4, -e.radius + 1); ctx.lineTo(-6, -e.radius - 4); ctx.lineTo(-2, -e.radius);
          ctx.moveTo(4, -e.radius + 1); ctx.lineTo(6, -e.radius - 4); ctx.lineTo(2, -e.radius);
          ctx.fill();
          // Eyes
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-3, -2, 2, 2);
          ctx.fillRect(2, -2, 2, 2);

        } else if (e.type === 'heavy') {
          // Armored Orc: Bulky grey plate armor, horned visor, steel shield
          ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#64748b';
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Iron helmet visor
          ctx.fillStyle = '#334155';
          ctx.fillRect(-6, -4, 12, 4);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-4, -3, 3, 2);
          ctx.fillRect(1, -3, 3, 2);
          // Steel shield
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(7, 3, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.stroke();

        } else if (e.type === 'flying') {
          // Winged Harpy: Purple body, flapping winged animation cycle
          const flap = Math.sin(t * 0.015) * 8;
          ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#7c3aed';
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#4c1d95';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Left & Right Flapping Wings
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.moveTo(-e.radius + 2, 0);
          ctx.lineTo(-e.radius - 10, -5 + flap);
          ctx.lineTo(-e.radius - 2, 5);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(e.radius - 2, 0);
          ctx.lineTo(e.radius + 10, -5 + flap);
          ctx.lineTo(e.radius + 2, 5);
          ctx.fill();
          // Eyes
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(-3, -2, 2, 2);
          ctx.fillRect(2, -2, 2, 2);
        }

        // Frost Slow Effect: Cyan aura and orbiting crystal snowflakes
        if (e.slowTimer > 0) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
          ctx.beginPath();
          ctx.arc(0, 0, e.radius + 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#bae6fd';
          for (let s = 0; s < 4; s++) {
            const sAng = (t * 0.005) + s * (Math.PI / 2);
            ctx.fillRect(Math.cos(sAng) * (e.radius + 4) - 1, Math.sin(sAng) * (e.radius + 4) - 1, 2.5, 2.5);
          }
        }

        // Health Bar
        const barW = Math.max(18, e.radius * 2 + 2);
        const barH = 3;
        const barY = -e.radius - 6;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-barW / 2, barY, barW, barH);
        const hpPct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = hpPct > 0.4 ? '#10b981' : '#ef4444';
        ctx.fillRect(-barW / 2, barY, barW * hpPct, barH);

        ctx.restore();
      }

      // 7. Projectiles
      for (let p of this.projectiles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.type === 'arrow') {
          ctx.rotate(p.angle);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-7, 0);
          ctx.lineTo(7, 0);
          ctx.stroke();
          // Arrow tip
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.moveTo(7, 0);
          ctx.lineTo(3, -3);
          ctx.lineTo(3, 3);
          ctx.closePath();
          ctx.fill();
        } else if (p.type === 'cannonball') {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(-1, -1, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'frostbolt') {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 8. Fantasy Castle at bottom
      const cX = 180;
      const cY = 575;
      ctx.save();
      ctx.translate(cX, cY);

      // Castle Hit pulse ring when enemy reaches it
      if (this.castleHitTimer > 0) {
        const pulseR = 30 + (1 - this.castleHitTimer / 0.5) * 30;
        ctx.strokeStyle = `rgba(239, 68, 68, ${this.castleHitTimer / 0.5})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Castle Stone Keep Main Body
      ctx.fillStyle = this.castleHitTimer > 0 ? '#450a0a' : '#1e293b';
      ctx.fillRect(-48, -22, 96, 44);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(-48, -22, 96, 44);

      // Crenellations / Battlements
      ctx.fillStyle = '#334155';
      for (let cx = -46; cx <= 36; cx += 16) {
        ctx.fillRect(cx, -30, 10, 8);
      }

      // Central Arched Gate
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(0, 12, 14, Math.PI, 0);
      ctx.rect(-14, 12, 28, 10);
      ctx.fill();

      // Portcullis iron bars
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      for (let bx = -10; bx <= 10; bx += 5) {
        ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx, 22); ctx.stroke();
      }

      // Glowing Warm Amber Windows
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-28, -8, 8, 12);
      ctx.fillRect(20, -8, 8, 12);

      // Left & Right Watchturrets
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-56, -34, 16, 52);
      ctx.fillRect(40, -34, 16, 52);
      ctx.strokeRect(-56, -34, 16, 52);
      ctx.strokeRect(40, -34, 16, 52);

      // Castle Defenders on Turrets (Defensive Activity)
      // Left Archer
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(-48, -38, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-48, -38, 6, -Math.PI / 2, Math.PI / 3);
      ctx.stroke();

      // Right Archer
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(48, -38, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(48, -38, 6, Math.PI * 0.7, Math.PI * 1.5);
      ctx.stroke();

      // Animated Flickering Torches
      const flameFlicker = Math.sin(t * 0.015) * 2;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(-48, -45, 4 + flameFlicker * 0.5, 0, Math.PI * 2);
      ctx.arc(48, -45, 4 - flameFlicker * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-48, -45, 2, 0, Math.PI * 2);
      ctx.arc(48, -45, 2, 0, Math.PI * 2);
      ctx.fill();

      // Animated Waving Cloth Flags
      const flagWave = Math.sin(t * 0.006) * 4;
      // Left flag
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-48, -34); ctx.lineTo(-48, -55); ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-48, -55);
      ctx.quadraticCurveTo(-36 + flagWave, -50, -28, -49 + flagWave);
      ctx.lineTo(-48, -43);
      ctx.closePath();
      ctx.fill();

      // Right flag
      ctx.beginPath();
      ctx.moveTo(48, -34); ctx.lineTo(48, -55); ctx.stroke();
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(48, -55);
      ctx.quadraticCurveTo(60 + flagWave, -50, 68, -49 + flagWave);
      ctx.lineTo(48, -43);
      ctx.closePath();
      ctx.fill();

      // Castle Icon Emblem
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏰', 0, -4);

      ctx.restore();

      // 9. Particles
      for (let pt of this.particles) {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 10. Floating Damage Texts
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
  }

  // --- STATE OF CURRENT GAMEPLAY ---
  class GameState {
    constructor() {
      this.sound = new SoundManager();
      this.menuBattle = new MenuBattleBackground();
      this.saveData = Storage.load();
      this.money = typeof this.saveData.money === 'number' ? this.saveData.money : Storage.getMoney();
      this.playerName = this.saveData.playerName || Storage.getPlayerName();
      this.playerAvatar = this.saveData.playerPicture || Storage.getPlayerPicture();
      this.tasks = this.saveData.tasks || Storage.getTasks();
      this.challenges = this.saveData.challenges || Storage.getChallenges();
      this.settings = this.saveData.settings || { music: true, sfx: true, quality: "medium", difficulty: "easy", masterVolume: 0.70 };
      this.difficulty = this.settings.difficulty || Storage.getDifficulty();

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

      // Selection & Grid
      this.selectedTile = null;
      this.selectedTower = null;
      this.selectedBuildType = null;
      this.hoverTile = null;

      // Playable Challenge Tracking (100 Challenges)
      this.activeChallenge = null;
      this.isChallengeMode = false;
      this.challengeKills = 0;
      this.challengeWavesCompleted = 0;
      this.challengeBossKills = 0;
      this.challengeTowerKills = { archer: 0, cannon: 0, magic: 0, lightning: 0 };
      this.challengeCastleDamaged = false;
      this.challengeStartTime = 0;
      this.challengeTimeElapsed = 0;
      this.challengeTimeLimit = 0;

      // Camera Scrolling for Long Vertical Battlefield
      this.cameraY = 0;
      this.targetCameraY = 0;
      this.maxCameraY = Math.max(0, MAP_HEIGHT - (LOGICAL_HEIGHT - 120));

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

    saveGameData() {
      this.syncStats();
      this.saveData.money = this.money;
      this.saveData.playerName = this.playerName;
      this.saveData.playerPicture = this.playerAvatar;
      this.saveData.tasks = this.tasks;
      this.saveData.challenges = this.challenges;
      this.saveData.difficulty = this.difficulty;
      const vol = this.sound ? this.sound.masterVolume : 0.70;
      const qual = this.settings?.quality || 'medium';
      this.saveData.masterVolume = vol;
      this.saveData.quality = qual;
      this.saveData.castleHealth = this.castleHealth || 100;
      this.saveData.wave = this.wave || 1;
      this.saveData.settings = {
        ...this.settings,
        difficulty: this.difficulty,
        masterVolume: vol,
        quality: qual,
        sfx: this.sound ? this.sound.sfxEnabled : true,
        music: this.sound ? this.sound.musicEnabled : true
      };
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
      Storage.setPlayerName(this.playerName);
      if (this.playerAvatar) Storage.setPlayerAvatar(this.playerAvatar);
      Storage.setMoney(this.money);
      Storage.setDifficulty(this.difficulty);
      Storage.setMasterVolume(vol);
      Storage.setGraphicsQuality(qual);
      Storage.setCastleHealth(this.castleHealth || 100);
      Storage.setWave(this.wave || 1);
      Storage.saveChallenges(this.challenges);
      Storage.saveTasks(this.tasks);
      Storage.saveStatistics({
        totalKills: this.totalKills,
        highestWave: this.highestWave,
        totalPlayingTime: this.totalPlayingTime,
        towersBuilt: this.towersBuilt,
        towersUpgraded: this.towersUpgraded,
        bossesDefeated: this.bossesDefeated,
        totalMoneyEarned: this.totalMoneyEarned,
        perfectWavesCount: this.perfectWavesCount,
        speedWavesCount: this.speedWavesCount
      });
    }

    saveAll() {
      this.saveGameData();
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

    setPlayerName(name) {
      this.playerName = Storage.setPlayerName(name);
      this.renderProfileUI();
      return this.playerName;
    }

    getPlayerName() {
      return this.playerName || Storage.getPlayerName();
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
    showScreen(screenOrId) {
      const screens = {
        mainMenu: document.getElementById('main-menu'),
        gameScreen: document.getElementById('gameplay-screen'),
        gameplayScreen: document.getElementById('gameplay-screen'),
        challengeScreen: document.getElementById('challenges-screen'),
        taskScreen: document.getElementById('tasks-modal'),
        settingsScreen: document.getElementById('settings-modal'),
        customizationScreen: document.getElementById('profile-modal'),
        exitScreen: document.getElementById('exit-screen'),
        gameOverScreen: document.getElementById('game-over-screen'),
        victoryScreen: document.getElementById('victory-screen')
      };

      let targetEl = null;
      let targetId = '';

      if (typeof screenOrId === 'string') {
        if (screens[screenOrId]) {
          targetEl = screens[screenOrId];
          targetId = targetEl.id || screenOrId;
        } else {
          targetEl = document.getElementById(screenOrId);
          targetId = screenOrId;
        }
      } else if (screenOrId && (screenOrId.nodeType || screenOrId.style || screenOrId.id)) {
        targetEl = screenOrId;
        targetId = screenOrId.id || '';
      }

      // Hide all registered screens
      const uniqueScreens = new Set(Object.values(screens).filter(Boolean));
      uniqueScreens.forEach(sc => {
        sc.style.display = 'none';
        sc.classList.remove('active');
        if (sc.classList.contains('modal-overlay')) {
          sc.classList.add('hidden');
        }
      });

      // Close open modals so screens never get blocked
      const overlayModals = [
        'tasks-modal',
        'settings-modal',
        'profile-modal',
        'pause-modal',
        'challenge-complete-modal',
        'challenge-failed-modal'
      ];
      overlayModals.forEach(mId => {
        const modal = document.getElementById(mId);
        if (modal && modal !== targetEl) {
          modal.classList.add('hidden');
        }
      });

      if (targetEl) {
        targetEl.style.display = 'flex';
        targetEl.classList.add('active');
        if (targetEl.classList.contains('modal-overlay')) {
          targetEl.classList.remove('hidden');
        }
      }

      if (this.menuBattle) {
        if (targetId === 'main-menu') {
          this.menuBattle.resume();
        } else {
          this.menuBattle.pause();
        }
      }
    }

    openExitScreen() {
      this.sound?.buttonClick();
      this.saveGameData();
      const exitScreen = document.getElementById('exit-screen');
      this.showScreen(exitScreen || 'exitScreen');
    }

    returnToMainMenu() {
      this.sound?.buttonClick();
      const mainMenu = document.getElementById('main-menu');
      this.showScreen(mainMenu || 'mainMenu');
    }

    closeGame() {
      this.sound?.buttonClick();
      this.saveGameData();
      try {
        if (window.AndroidBridge && window.AndroidBridge.closeApp) {
          window.AndroidBridge.closeApp();
          return;
        }
      } catch (e) {}
      const exitDesc = document.querySelector('.exit-desc');
      if (exitDesc) {
        exitDesc.textContent = 'Game saved successfully. You may safely return to your home screen or close the app.';
      }
    }

    startMatch() {
      this.sound.init();
      this.isChallengeMode = false;
      this.activeChallenge = null;
      this.updateTowerCardsAvailability();
      document.getElementById('active-challenge-hud')?.classList.add('hidden');
      document.getElementById('challenge-complete-modal')?.classList.add('hidden');
      document.getElementById('challenge-failed-modal')?.classList.add('hidden');

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

      this.selectedTile = null;
      this.selectedTower = null;
      this.selectedBuildType = null;
      this.hoverTile = null;
      this.cameraY = 0;
      this.targetCameraY = 0;
      document.getElementById('tile-selection-hint')?.classList.add('hidden');
      document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
      this.closeInspector();

      this.updateHud();
      this.showScreen('gameplay-screen');
      this.showWaveBanner('WAVE 1 / 100', 'PREPARE DEFENSES!');
      this.sound.startMusic();
    }

    endMatchGameOver() {
      if (this.isChallengeMode) {
        this.failChallenge();
        return;
      }
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
      if (this.isChallengeMode) {
        this.completeChallenge();
        return;
      }
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
      if (hw) {
        if (this.isChallengeMode && this.activeChallenge) {
          const ch = this.activeChallenge;
          if (['waves', 'perfect', 'timed', 'archer_only', 'cannon_only', 'magic_only', 'lightning_only', 'budget'].includes(ch.type)) {
            hw.textContent = `WAVE ${this.wave} / ${ch.target}`;
          } else {
            hw.textContent = `WAVE ${this.wave}`;
          }
        } else {
          hw.textContent = `WAVE ${this.wave} / 100`;
        }
      }
      this.updateMoneyDisplay();

      if (wb) {
        wb.style.display = this.isWaveActive ? 'none' : 'flex';
      }
      if (pt) {
        pt.textContent = `${Math.max(0, Math.ceil(this.prepTimer))}s`;
      }
      if (this.isChallengeMode) {
        this.updateChallengeProgressUI();
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
      const currentWave = this.wave;
      // ENEMY HEALTH RULE:
      // Wave 1 -> 1, Wave 2 -> 2, Wave 3 -> 3, Wave 4 -> 4, Wave 5+ -> 4
      // Increases by exactly +1 at the start of each new wave until 4. Maximum is 4. Never above 4.
      const enemyHealth = Math.min(currentWave, 4);

      const count = Math.min(45, 6 + Math.floor(currentWave * 0.4) + Math.floor(currentWave / 5) * 2);
      const spdMultiplier = Math.min(1.35, 1 + (currentWave - 1) * 0.015) * diffCfg.enemySpeedMultiplier;

      for (let i = 0; i < count; i++) {
        let typeKey = 'basic';
        if (currentWave >= 2 && i % 4 === 1) typeKey = 'fast';
        if (currentWave >= 3 && i % 5 === 2) typeKey = 'flying';
        if (currentWave >= 4 && i % 6 === 3) typeKey = 'heavy';

        // Every 5th wave contains a Void Behemoth boss (or Void Behemoth Supreme on Wave 100)
        if (isBossWave && i === count - 1) {
          typeKey = isFinalWave ? 'finalBoss' : 'boss';
        }

        const cfg = ENEMY_TYPES[typeKey];
        const calcHp = enemyHealth;
        const castleDmg = 1;

        this.spawnQueue.push({
          type: typeKey,
          name: cfg.name,
          hp: calcHp,
          maxHp: calcHp,
          speed: cfg.speed * spdMultiplier,
          castleDamage: castleDmg,
          reward: Math.round(cfg.reward * (1 + currentWave * 0.06)),
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

      if (this.isChallengeMode && this.activeChallenge) {
        this.challengeWavesCompleted++;
        this.checkChallengeConditions();
        if (!this.isPlaying) return;
      }

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
      if (this.canvas) {
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

      if (this.menuBattle) {
        this.menuBattle.resize();
      }
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

      if (this.isChallengeMode && this.activeChallenge) {
        this.challengeTimeElapsed += dt;
        if (this.activeChallenge.timeLimit > 0) {
          const timeLeft = Math.max(0, this.activeChallenge.timeLimit - this.challengeTimeElapsed);
          const timerEl = document.getElementById('challenge-hud-timer');
          if (timerEl) {
            timerEl.classList.remove('hidden');
            const m = Math.floor(timeLeft / 60);
            const s = Math.floor(timeLeft % 60);
            timerEl.textContent = `⏱️ ${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
          }
          if (timeLeft <= 0) {
            this.failChallenge(`Time limit of ${this.activeChallenge.timeLimit}s exceeded!`);
            return;
          }
        }
      }

      // Smooth camera interpolation
      this.cameraY += (this.targetCameraY - this.cameraY) * 0.16;

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

        // Reached Castle Base: Castle loses exactly 1 health per enemy
        if (e.distance >= TOTAL_PATH_LENGTH) {
          this.enemies.splice(i, 1);
          const dmg = 1;
          this.castleHealth = Math.max(0, this.castleHealth - 1);
          this.castleHitTimer = 0.5;
          this.sound.castleDamage();

          if (this.isChallengeMode && this.activeChallenge) {
            this.challengeCastleDamaged = true;
            if (this.activeChallenge.type === 'perfect') {
              this.failChallenge('Castle took damage! (Requirement: No damage taken)');
              return;
            }
          }

          // Castle damage visual effects & floating text (-1)
          this.addFloatingText(pos.x, pos.y - 12, `-1 🏰`, '#ef4444');
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

      if (this.isChallengeMode && this.activeChallenge) {
        this.challengeKills++;
        if (enemy.isBoss) {
          this.challengeBossKills++;
        }
        if (tower && tower.type) {
          this.challengeTowerKills[tower.type] = (this.challengeTowerKills[tower.type] || 0) + 1;
        }
        this.checkChallengeConditions();
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

    // --- FREE TOWER PLACEMENT & GRID INTERACTION ---
    isTileValidForPlacement(col, row) {
      if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return false;
      if (row >= 25) return false; // Castle ramparts & fortress
      if (row === 0 && col === 4) return false; // Enemy spawn portal
      if (isTileOnPath(col, row)) return false; // Enemy path
      if (this.towers.some(t => t.col === col && t.row === row)) return false; // Already occupied
      return true;
    }

    clearTileSelection() {
      this.selectedTile = null;
      document.getElementById('tile-selection-hint')?.classList.add('hidden');
      document.getElementById('tile-tower-modal')?.classList.add('hidden');
    }

    openTowerSelectModal(col, row) {
      this.selectedTile = { col, row };
      const modal = document.getElementById('tile-tower-modal');
      const coord = document.getElementById('tile-select-coord');
      if (coord) coord.textContent = `Selected Block (Row ${row + 1}, Col ${col + 1})`;

      // Update affordability on the tower options
      document.querySelectorAll('.tower-select-option').forEach(btn => {
        const type = btn.getAttribute('data-build');
        const cfg = TOWER_CONFIGS[type];
        if (cfg) {
          if (this.money < cfg.cost) {
            btn.classList.add('cant-afford');
          } else {
            btn.classList.remove('cant-afford');
          }
        }
      });

      if (modal) modal.classList.remove('hidden');

      const hint = document.getElementById('tile-selection-hint');
      const text = document.getElementById('tile-selection-text');
      if (hint && text) {
        text.textContent = `Block [R${row + 1}, C${col + 1}] selected`;
        hint.classList.remove('hidden');
      }
    }

    closeTowerSelectModal() {
      document.getElementById('tile-tower-modal')?.classList.add('hidden');
      this.clearTileSelection();
    }

    handleTileClick(col, row) {
      if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) {
        this.closeInspector();
        this.clearTileSelection();
        return;
      }

      // 1. Check if clicked an existing tower on this tile
      const existing = this.towers.find(t => t.col === col && t.row === row);
      if (existing) {
        this.clearTileSelection();
        this.sound.buttonClick();
        this.openInspector(existing);
        return;
      }

      // 2. Check if clicked castle or spawn
      if (row >= 25 || (row === 0 && col === 4)) {
        this.closeInspector();
        this.clearTileSelection();
        this.sound.buttonClick();
        this.addFloatingText(col * TILE_SIZE + 20, row * TILE_SIZE + 20, 'CASTLE AREA!', '#ef4444');
        return;
      }

      // 3. Check if clicked enemy path
      if (isTileOnPath(col, row)) {
        this.closeInspector();
        this.clearTileSelection();
        this.sound.buttonClick();
        this.addFloatingText(col * TILE_SIZE + 20, row * TILE_SIZE + 20, 'CANNOT BUILD ON PATH!', '#ef4444');
        return;
      }

      // 4. Clicked an available green grass tile!
      this.closeInspector();
      this.sound.buttonClick();

      // If a tower card was already selected in the bottom bar, build it immediately!
      if (this.selectedBuildType) {
        this.buildTowerOnTile(col, row, this.selectedBuildType);
        return;
      }

      // Otherwise highlight selected tile and open the tower selection UI!
      this.openTowerSelectModal(col, row);
    }

    buildTowerOnTile(col, row, typeKey) {
      if (!this.isTileValidForPlacement(col, row)) {
        this.addFloatingText(col * TILE_SIZE + 20, row * TILE_SIZE + 20, 'INVALID LOCATION!', '#ef4444');
        return;
      }

      if (this.isChallengeMode && this.activeChallenge && this.activeChallenge.allowedTowers) {
        if (!this.activeChallenge.allowedTowers.includes(typeKey)) {
          this.sound.buttonClick();
          this.addFloatingText(col * TILE_SIZE + 20, row * TILE_SIZE + 20, 'RESTRICTED TOWER!', '#ef4444');
          return;
        }
      }

      const cfg = TOWER_CONFIGS[typeKey];
      if (!cfg) return;

      if (!this.spendMoney(cfg.cost)) {
        this.sound.buttonClick();
        this.addFloatingText(col * TILE_SIZE + 20, row * TILE_SIZE + 20, `NEED Rs ${cfg.cost}!`, '#ef4444');
        return;
      }

      this.sound.upgradeSound();
      const x = col * TILE_SIZE + TILE_SIZE / 2;
      const y = row * TILE_SIZE + TILE_SIZE / 2;

      const tower = {
        id: Date.now() + Math.random(),
        col,
        row,
        x,
        y,
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

      // Build particles & dust
      for (let i = 0; i < 14; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 15 + Math.random() * 45;
        this.particles.push({
          x, y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          color: cfg.color,
          size: 2.5 + Math.random() * 2.5,
          maxLife: 0.45,
          life: 0.45,
          alpha: 1
        });
      }
      this.addFloatingText(x, y - 20, `BUILT! -Rs ${cfg.cost}`, '#fbbf24');

      this.clearTileSelection();
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

      // Center & scale responsive logical viewport (360x640)
      ctx.scale(dpr, dpr);
      ctx.translate(this.offsetX, this.offsetY);
      ctx.scale(this.scale, this.scale);

      const gfx = this.getGraphicsConfig();
      const now = performance.now();

      // Viewport clip so battle content stays within logical canvas bounds
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      ctx.clip();

      // Camera Scrolling Translation
      ctx.save();
      ctx.translate(0, -Math.round(this.cameraY));

      // 1. Tiled Grid-Based Grass & Path Battlefield
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const tileX = c * TILE_SIZE;
          const tileY = r * TILE_SIZE;

          if (r >= 26) {
            // Castle Stone Courtyard
            ctx.fillStyle = (c + r) % 2 === 0 ? '#1e293b' : '#172033';
            ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.strokeRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
          } else if (isTileOnPath(c, r)) {
            // Dirt / Stone Path Tile
            ctx.fillStyle = '#dfb064';
            ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);

            // Path cobblestones / pebbles
            if (gfx.detailedAnimations) {
              ctx.fillStyle = '#caa054';
              const pSeed = (c * 17 + r * 31) % 10;
              ctx.beginPath();
              ctx.arc(tileX + 12 + (pSeed % 16), tileY + 14 + (pSeed * 2 % 14), 2.5, 0, Math.PI * 2);
              ctx.arc(tileX + 26 - (pSeed % 10), tileY + 28 - (pSeed * 3 % 12), 2, 0, Math.PI * 2);
              ctx.fill();
            }

            // Path borders
            ctx.strokeStyle = '#c29143';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
          } else {
            // Vibrant Green Grass Tile (with subtle checkerboard shading like reference)
            ctx.fillStyle = (c + r) % 2 === 0 ? '#4da428' : '#459922';
            ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);

            // Subtle grass border
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
            ctx.lineWidth = 1;
            ctx.strokeRect(tileX, tileY, TILE_SIZE, TILE_SIZE);

            // Top-left light edge for crisp tile depth
            if (gfx.detailedAnimations) {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
              ctx.beginPath();
              ctx.moveTo(tileX, tileY + TILE_SIZE);
              ctx.lineTo(tileX, tileY);
              ctx.lineTo(tileX + TILE_SIZE, tileY);
              ctx.stroke();
            }
          }
        }
      }

      // 2. Decorative Nature Elements (Pine trees, rocks, flowers like reference)
      for (let dec of NATURE_DECORATIONS) {
        // Skip drawing nature if a tower is built on this tile
        if (this.towers.some(t => t.col === dec.col && t.row === dec.row)) continue;
        const dx = dec.col * TILE_SIZE + 20;
        const dy = dec.row * TILE_SIZE + 20;

        if (dec.type === 'trees') {
          // Pine tree clump (conical layered trees with drop shadow)
          const offsets = [
            [-8, -8], [8, -8],
            [-8, 6],  [8, 6]
          ];
          for (let i = 0; i < Math.min(dec.count, offsets.length); i++) {
            const tx = dx + offsets[i][0];
            const ty = dy + offsets[i][1];

            // Tree Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(tx, ty + 5, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Trunk
            ctx.fillStyle = '#5c3a1e';
            ctx.fillRect(tx - 1, ty + 2, 2, 4);

            // Layered Conical Foliage
            ctx.fillStyle = '#2d6a1b';
            ctx.beginPath();
            ctx.arc(tx, ty + 1, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#3a8723';
            ctx.beginPath();
            ctx.arc(tx, ty - 3, 4.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#52b728';
            ctx.beginPath();
            ctx.arc(tx, ty - 6, 2.8, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (dec.type === 'rocks') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.beginPath();
          ctx.ellipse(dx, dy + 4, 8, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(dx - 3, dy, 5, 0, Math.PI * 2);
          ctx.arc(dx + 4, dy + 1, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(dx - 4, dy - 2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (dec.type === 'bushes') {
          // Lush rounded bush clump
          ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
          ctx.beginPath();
          ctx.ellipse(dx, dy + 5, 9, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#226017';
          ctx.beginPath();
          ctx.arc(dx - 5, dy + 1, 6, 0, Math.PI * 2);
          ctx.arc(dx + 5, dy + 1, 6, 0, Math.PI * 2);
          ctx.arc(dx, dy - 2, 7.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#3eb321';
          ctx.beginPath();
          ctx.arc(dx - 2, dy - 3, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (dec.type === 'flowers') {
          const fColors = ['#f43f5e', '#fbbf24', '#ffffff', '#38bdf8'];
          for (let f = 0; f < 4; f++) {
            ctx.fillStyle = fColors[f];
            ctx.beginPath();
            ctx.arc(dx + (f % 2 === 0 ? -6 : 6), dy + (f < 2 ? -6 : 6), 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 3. Enemy Spawn Portal at Top (row 0, col 4)
      ctx.save();
      ctx.translate(180, 20);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      const portalAura = (now * 0.005) % (Math.PI * 2);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.beginPath();
      ctx.arc(0, 0, 12, portalAura, portalAura + Math.PI);
      ctx.stroke();

      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚪', 0, 0);

      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = '#fca5a5';
      ctx.fillText('SPAWN', 0, 24);
      ctx.restore();

      // 4. Fantasy Castle at Bottom (rows 25 to 27)
      const castleGateY = 25 * TILE_SIZE + 20; // 1020px
      ctx.save();
      ctx.translate(180, castleGateY);

      // Castle Hit pulse shockwave
      if (this.castleHitTimer > 0) {
        const pulseR = 30 + (1 - this.castleHitTimer / 0.5) * 35;
        ctx.strokeStyle = `rgba(239, 68, 68, ${this.castleHitTimer / 0.5})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Stone Wall with Crenellations across row 26
      ctx.fillStyle = this.castleHitTimer > 0 ? '#450a0a' : '#1e293b';
      ctx.fillRect(-180, 20, 360, 50);
      ctx.strokeStyle = this.castleHitTimer > 0 ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(-180, 20, 360, 50);

      // Battlements / Crenellations
      ctx.fillStyle = '#334155';
      for (let bx = -180; bx < 180; bx += 20) {
        ctx.fillRect(bx, 10, 12, 10);
      }

      // Central Arched Fortress Gateway
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(0, 30, 20, Math.PI, 0);
      ctx.rect(-20, 30, 40, 25);
      ctx.fill();

      // Portcullis iron bars
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      for (let ix = -14; ix <= 14; ix += 7) {
        ctx.beginPath(); ctx.moveTo(ix, 15); ctx.lineTo(ix, 55); ctx.stroke();
      }

      // Torches on Left & Right
      const flameP = Math.sin(now * 0.015) * 2;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(-35, 18, 4 + flameP * 0.5, 0, Math.PI * 2);
      ctx.arc(35, 18, 4 - flameP * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-35, 18, 2, 0, Math.PI * 2);
      ctx.arc(35, 18, 2, 0, Math.PI * 2);
      ctx.fill();

      // Animated Flags on Towers
      const fWave = Math.sin(now * 0.006) * 4;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-140, 10); ctx.lineTo(-140, -10); ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-140, -10);
      ctx.quadraticCurveTo(-128 + fWave, -6, -120, -5 + fWave);
      ctx.lineTo(-140, 0);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath(); ctx.moveTo(140, 10); ctx.lineTo(140, -10); ctx.stroke();
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(140, -10);
      ctx.quadraticCurveTo(152 + fWave, -6, 160, -5 + fWave);
      ctx.lineTo(140, 0);
      ctx.closePath();
      ctx.fill();

      // Castle Health Bar & Label
      const cBarW = 100;
      const cBarH = 6;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(-cBarW / 2, -20, cBarW, cBarH);
      const cHpPct = Math.max(0, this.castleHealth / this.maxCastleHealth);
      ctx.fillStyle = cHpPct > 0.5 ? '#10b981' : (cHpPct > 0.25 ? '#f59e0b' : '#ef4444');
      ctx.fillRect(-cBarW / 2, -20, cBarW * cHpPct, cBarH);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-cBarW / 2, -20, cBarW, cBarH);

      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`🏰 CASTLE DEFENSE (${this.castleHealth} HP)`, 0, -28);
      ctx.restore();

      // 5. Grid Hover & Selection Highlights
      // A) Hover preview
      if (this.hoverTile) {
        const hc = this.hoverTile.col;
        const hr = this.hoverTile.row;
        const hx = hc * TILE_SIZE;
        const hy = hr * TILE_SIZE;
        const occupied = this.towers.find(t => t.col === hc && t.row === hr);

        if (occupied) {
          // Occupied tile: subtle blue/gold inspect highlight
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(hx + 1, hy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.fillRect(hx, hy, TILE_SIZE, TILE_SIZE);
        } else if (this.isTileValidForPlacement(hc, hr)) {
          // Available placement tile: green highlight + placement preview
          ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
          ctx.fillRect(hx, hy, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.strokeRect(hx + 1, hy + 1, TILE_SIZE - 2, TILE_SIZE - 2);

          // Tower placement preview & range
          const previewType = this.selectedBuildType || 'archer';
          const cfg = TOWER_CONFIGS[previewType];
          if (cfg) {
            ctx.save();
            ctx.strokeStyle = this.selectedBuildType ? 'rgba(34, 197, 94, 0.65)' : 'rgba(255, 255, 255, 0.35)';
            ctx.fillStyle = this.selectedBuildType ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.04)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(hx + 20, hy + 20, cfg.baseRange, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = this.selectedBuildType ? 0.9 : 0.55;
            ctx.fillText(this.selectedBuildType ? cfg.icon : '➕', hx + 20, hy + 20);
            ctx.restore();
          }
        } else if (isTileOnPath(hc, hr) || hr >= 25 || (hr === 0 && hc === 4)) {
          // Path or Castle tile: red preview indicating no placement allowed
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.fillRect(hx, hy, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(hx + 1, hy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🚫', hx + 20, hy + 20);
        }
      }

      // B) Currently selected tile (awaiting tower build)
      if (this.selectedTile) {
        const sc = this.selectedTile.col;
        const sr = this.selectedTile.row;
        const sx = sc * TILE_SIZE;
        const sy = sr * TILE_SIZE;

        const pulse = Math.sin(now * 0.008) * 3;
        ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(sx + 1, sy + 1, TILE_SIZE - 2, TILE_SIZE - 2);

        // Glowing corners
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.strokeRect(sx - pulse * 0.3, sy - pulse * 0.3, TILE_SIZE + pulse * 0.6, TILE_SIZE + pulse * 0.6);
      }

      // 6. Placed Towers
      for (let t of this.towers) {
        ctx.save();
        ctx.translate(t.x, t.y);

        // Range circle if selected
        if (this.selectedTower === t) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
          ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, t.range, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Selection bracket
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.strokeRect(-18, -18, 36, 36);
        }

        // Stone Base Pedestal
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = t.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Tower Body
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Rotating Weaponry / Turret
        ctx.save();
        ctx.rotate(t.angle);
        if (t.type === 'archer') {
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 9, -Math.PI / 3, Math.PI / 3);
          ctx.stroke();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-4, 0); ctx.lineTo(10, 0); ctx.stroke();
        } else if (t.type === 'cannon') {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, -3.5, 14, 7);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(10, -4, 3, 8);
        } else if (t.type === 'magic') {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(12, 0); ctx.lineTo(0, -5); ctx.lineTo(-4, 0); ctx.lineTo(0, 5); ctx.closePath();
          ctx.fill();
        } else if (t.type === 'lightning') {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(0, -2, 12, 4);
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(12, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Tower Icon
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.icon, 0, -1);

        // Level Stars Badge
        if (t.level > 1) {
          ctx.font = 'bold 9px sans-serif';
          ctx.fillStyle = '#fef08a';
          ctx.fillText('★'.repeat(t.level), 0, 15);
        }

        ctx.restore();
      }

      // 7. Lightning Arcs
      for (let arc of this.lightningArcs) {
        ctx.save();
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(arc.x1, arc.y1); ctx.lineTo(arc.x2, arc.y2); ctx.stroke();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(arc.x1, arc.y1);
        const midX = (arc.x1 + arc.x2) / 2 + (Math.random() - 0.5) * 16;
        const midY = (arc.y1 + arc.y2) / 2 + (Math.random() - 0.5) * 16;
        ctx.lineTo(midX, midY); ctx.lineTo(arc.x2, arc.y2);
        ctx.stroke();
        ctx.restore();
      }

      // 8. Enemies
      for (let e of this.enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);

        // Flying shadow
        if (e.flying) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.ellipse(0, 12, e.radius, e.radius * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.translate(0, -8);
        }

        // Enemy Body
        ctx.fillStyle = e.hitFlashTimer > 0 ? '#ffffff' : e.color;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = e.isBoss ? '#f59e0b' : '#020617';
        ctx.lineWidth = e.isBoss ? 2.5 : 1.5;
        ctx.stroke();

        // Monster Icon
        ctx.font = `${Math.round(e.radius * 1.2)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.icon, 0, 0);

        // Frost Slow Aura
        if (e.slowTimer > 0) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, e.radius + 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#bae6fd';
          for (let s = 0; s < 4; s++) {
            const sAng = (now * 0.005) + s * (Math.PI / 2);
            ctx.fillRect(Math.cos(sAng) * (e.radius + 4) - 1, Math.sin(sAng) * (e.radius + 4) - 1, 2, 2);
          }
        }

        // Health Bar
        const barW = Math.max(20, e.radius * 2 + 4);
        const barH = e.isBoss ? 5 : 3.5;
        const barY = -e.radius - 6;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-barW / 2, barY, barW, barH);
        const hpPct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = hpPct > 0.4 ? '#10b981' : '#ef4444';
        ctx.fillRect(-barW / 2, barY, barW * hpPct, barH);
        ctx.restore();
      }

      // 9. Projectiles
      for (let p of this.projectiles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.type === 'arrow') {
          ctx.rotate(p.angle);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.stroke();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(2, -3); ctx.lineTo(2, 3); ctx.closePath(); ctx.fill();
        } else if (p.type === 'cannon') {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath(); ctx.arc(-1, -1, 2, 0, Math.PI * 2); ctx.fill();
        } else if (p.type === 'magic') {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }

      // 10. Particles
      for (let pt of this.particles) {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 11. Floating Texts
      for (let ft of this.floatingTexts) {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      ctx.restore(); // Restore Camera Translation

      // 12. Minimap / Scroll Bar Indicator on Right Screen Edge
      const trackH = 140;
      const trackW = 4;
      const trackX = LOGICAL_WIDTH - 8;
      const trackY = (LOGICAL_HEIGHT - trackH) / 2;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(trackX, trackY, trackW, trackH);

      const thumbH = Math.max(16, trackH * (LOGICAL_HEIGHT / MAP_HEIGHT));
      const scrollPct = this.maxCameraY > 0 ? (this.cameraY / this.maxCameraY) : 0;
      const thumbY = trackY + scrollPct * (trackH - thumbH);

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(trackX - 1, thumbY, trackW + 2, thumbH);

      ctx.restore(); // Restore Viewport Clip
      ctx.restore(); // Restore Logical Scale
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
        this.openChallengesScreen();
      });

      // Challenges Screen Navigation & Modals
      document.getElementById('btn-challenges-back')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.showScreen('main-menu');
      });

      document.getElementById('btn-claim-challenge-reward')?.addEventListener('click', () => {
        this.sound.coinCollect();
        if (this.activeChallenge && !this.activeChallenge.claimed) {
          this.activeChallenge.claimed = true;
          this.addMoney(this.activeChallenge.reward);
          Storage.saveChallenges(this.challenges);
          this.saveAll();
          this.renderMenuBadges();
        }
        document.getElementById('challenge-complete-modal')?.classList.add('hidden');
        this.openChallengesScreen();
      });

      document.getElementById('btn-back-challenges-from-win')?.addEventListener('click', () => {
        this.sound.buttonClick();
        document.getElementById('challenge-complete-modal')?.classList.add('hidden');
        this.openChallengesScreen();
      });

      document.getElementById('btn-retry-challenge')?.addEventListener('click', () => {
        this.sound.buttonClick();
        document.getElementById('challenge-failed-modal')?.classList.add('hidden');
        if (this.activeChallenge) {
          this.startChallenge(this.activeChallenge.id);
        } else {
          this.openChallengesScreen();
        }
      });

      document.getElementById('btn-back-challenges-from-fail')?.addEventListener('click', () => {
        this.sound.buttonClick();
        document.getElementById('challenge-failed-modal')?.classList.add('hidden');
        this.openChallengesScreen();
      });

      document.getElementById('btn-settings')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.openSettingsModal();
      });

      document.getElementById('btn-exit')?.addEventListener('click', () => {
        this.openExitScreen();
      });

      document.getElementById('btn-fullscreen')?.addEventListener('click', async () => {
        this.sound.buttonClick();
        await this.enterFullscreen();
      });

      document.getElementById('btn-return-game')?.addEventListener('click', () => {
        this.returnToMainMenu();
      });

      document.getElementById('btn-close-game')?.addEventListener('click', () => {
        this.closeGame();
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
        if (document.getElementById('main-menu')?.classList.contains('active')) {
          this.menuBattle?.resume();
        }
      });

      // Close modal generic handlers
      document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.sound.buttonClick();
          const targetId = btn.getAttribute('data-close');
          document.getElementById(targetId)?.classList.add('hidden');
          if (document.getElementById('main-menu')?.classList.contains('active')) {
            this.menuBattle?.resume();
          }
        });
      });

      // Pause/resume background battle on tab visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.menuBattle?.pause();
        } else if (document.getElementById('main-menu')?.classList.contains('active')) {
          this.menuBattle?.resume();
        }
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
        this.isPaused = true;
        const pModal = document.getElementById('pause-modal');
        if (pModal) {
          pModal.classList.remove('hidden');
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

      document.getElementById('btn-pause-restart')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.isPaused = false;
        document.getElementById('pause-modal')?.classList.add('hidden');
        if (this.isChallengeMode && this.activeChallenge) {
          this.startChallenge(this.activeChallenge.id);
        } else {
          this.startMatch();
        }
      });

      document.getElementById('btn-pause-menu')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.saveGameData();
        this.isPaused = false;
        document.getElementById('pause-modal')?.classList.add('hidden');
        if (this.isChallengeMode) {
          this.exitCurrentChallenge();
        } else {
          this.isPlaying = false;
          this.sound.stopMusic();
          this.showScreen('main-menu');
        }
      });

      document.getElementById('btn-ingame-menu')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.saveGameData();
        if (this.isChallengeMode) {
          this.exitCurrentChallenge();
        } else {
          this.isPlaying = false;
          this.sound.stopMusic();
          this.showScreen('main-menu');
        }
      });

      // Tower Cards Selector in bottom bar
      document.querySelectorAll('.tower-card').forEach(card => {
        card.addEventListener('click', () => {
          this.sound.buttonClick();
          const type = card.getAttribute('data-type');
          if (this.selectedBuildType === type) {
            this.selectedBuildType = null;
            card.classList.remove('selected');
            if (!this.selectedTile) {
              document.getElementById('tile-selection-hint')?.classList.add('hidden');
            }
          } else {
            this.selectedBuildType = type;
            document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            // If a tile was already selected, build it directly onto that tile!
            if (this.selectedTile) {
              this.buildTowerOnTile(this.selectedTile.col, this.selectedTile.row, type);
            } else {
              const hint = document.getElementById('tile-selection-hint');
              const text = document.getElementById('tile-selection-text');
              if (hint && text) {
                text.textContent = `Tap any green grass block to build ${type}`;
                hint.classList.remove('hidden');
              }
            }
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
        this.saveGameData();
        this.showScreen('main-menu');
      });

      // Victory Screen Actions
      document.getElementById('btn-vic-restart')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.startMatch();
      });

      document.getElementById('btn-vic-menu')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.saveGameData();
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

      // 100% Offline Service Worker registration
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

      // Quick Camera Navigation Buttons
      document.getElementById('btn-scroll-top')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.targetCameraY = 0;
      });

      document.getElementById('btn-scroll-castle')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.targetCameraY = this.maxCameraY;
      });

      document.getElementById('btn-cancel-placement')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.clearTileSelection();
      });

      // Free Grid Tower Selection Modal listeners
      document.querySelectorAll('.tower-select-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.getAttribute('data-build');
          if (this.selectedTile && type) {
            this.buildTowerOnTile(this.selectedTile.col, this.selectedTile.row, type);
          }
        });
      });

      document.getElementById('btn-close-tower-modal')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.closeTowerSelectModal();
      });

      document.getElementById('btn-cancel-tower-modal')?.addEventListener('click', () => {
        this.sound.buttonClick();
        this.closeTowerSelectModal();
      });

      // Canvas Pointer, Drag-Scroll, Hover & Tap Handling
      if (this.canvas) {
        let isPointerDown = false;
        let startX = 0;
        let startY = 0;
        let lastY = 0;
        let hasMoved = false;

        const getCoords = (e) => {
          if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
          return { x: e.clientX, y: e.clientY };
        };

        const onDown = (e) => {
          isPointerDown = true;
          const pos = getCoords(e);
          startX = pos.x;
          startY = pos.y;
          lastY = pos.y;
          hasMoved = false;
        };

        const onMove = (e) => {
          const pos = getCoords(e);
          // Update hover tile on battlefield
          const pt = this.screenToLogical(pos.x, pos.y);
          const worldX = pt.x;
          const worldY = pt.y + this.cameraY;
          const col = Math.floor(worldX / TILE_SIZE);
          const row = Math.floor(worldY / TILE_SIZE);
          if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
            this.hoverTile = { col, row };
          } else {
            this.hoverTile = null;
          }

          if (!isPointerDown) return;

          const dy = pos.y - lastY;
          lastY = pos.y;

          if (Math.abs(pos.y - startY) > 6 || Math.abs(pos.x - startX) > 6) {
            hasMoved = true;
          }

          if (hasMoved) {
            // Drag-scroll battlefield camera vertically
            const deltaWorldY = dy / (this.scale || 1);
            this.targetCameraY = Math.max(0, Math.min(this.maxCameraY, this.targetCameraY - deltaWorldY));
            this.cameraY = this.targetCameraY;
          }
        };

        const onUp = (e) => {
          if (!isPointerDown) return;
          isPointerDown = false;

          // If was not dragged, treat as tap / click
          if (!hasMoved) {
            const pt = this.screenToLogical(startX, startY);
            const worldX = pt.x;
            const worldY = pt.y + this.cameraY;
            const col = Math.floor(worldX / TILE_SIZE);
            const row = Math.floor(worldY / TILE_SIZE);
            this.handleTileClick(col, row);
          }
        };

        this.canvas.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);

        this.canvas.addEventListener('touchstart', onDown, { passive: true });
        this.canvas.addEventListener('touchmove', onMove, { passive: true });
        this.canvas.addEventListener('touchend', onUp, { passive: true });
        this.canvas.addEventListener('touchcancel', () => { isPointerDown = false; });

        this.canvas.addEventListener('wheel', (e) => {
          e.preventDefault();
          this.targetCameraY = Math.max(0, Math.min(this.maxCameraY, this.targetCameraY + e.deltaY * 0.7));
        }, { passive: false });

        this.canvas.addEventListener('mouseleave', () => {
          this.hoverTile = null;
        });
      }
    }

    openProfileModal() {
      this.menuBattle?.pause();
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
      this.menuBattle?.pause();
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

    initializeChallenges() {
      if (!this.challenges || !Array.isArray(this.challenges) || this.challenges.length !== 100) {
        this.challenges = create100Challenges();
        Storage.saveChallenges(this.challenges);
        this.saveAll();
      } else {
        const completedCount = this.challenges.filter(c => c.completed).length;
        this.challenges.forEach(c => {
          if (!c.numStr) {
            c.numStr = `Challenge ${c.id < 10 ? '0' + c.id : c.id}`;
          }
          if (typeof c.progress !== 'number') c.progress = 0;
          c.unlocked = (c.id <= 5) || !!c.completed || (completedCount >= (c.reqCompleted || c.req || 0));
        });
      }
    }

    openChallenges() {
      this.openChallengesScreen();
    }

    closeChallenges() {
      this.showScreen('main-menu');
    }

    exitCurrentChallenge() {
      this.isPlaying = false;
      this.isPaused = false;
      this.sound.stopMusic();
      document.getElementById('pause-modal')?.classList.add('hidden');
      document.getElementById('challenge-complete-modal')?.classList.add('hidden');
      document.getElementById('challenge-failed-modal')?.classList.add('hidden');
      this.openChallengesScreen();
    }

    openChallengesScreen() {
      this.initializeChallenges();
      this.menuBattle?.pause();
      this.syncStats();
      this.renderChallenges();
      this.showScreen('challenges-screen');
    }

    renderChallenges() {
      this.initializeChallenges();

      const moneyEl = document.getElementById('challenges-money-val');
      if (moneyEl) moneyEl.textContent = `Rs ${this.money}`;

      const completedCount = this.challenges.filter(c => c.completed).length;
      const countEl = document.getElementById('challenges-count-badge');
      if (countEl) countEl.textContent = `Completed: ${completedCount} / 100`;

      // Update unlock status for all challenges
      this.challenges.forEach(c => {
        c.unlocked = (c.id <= 5) || !!c.completed || (completedCount >= (c.reqCompleted || c.req || 0));
      });

      const list = document.getElementById('challenges-grid-list');
      if (!list) return;
      list.innerHTML = '';

      this.challenges.forEach(ch => {
        const card = document.createElement('div');
        const isCompleted = !!ch.completed;
        const isClaimed = !!ch.claimed;
        const isUnlocked = !!ch.unlocked;

        let cardClass = 'challenge-card';
        if (isCompleted) cardClass += ' completed';
        else if (!isUnlocked) cardClass += ' locked';

        let statusBadgeClass = 'ch-card-status-badge';
        let statusText = 'LOCKED';
        if (isCompleted) {
          if (isClaimed) {
            statusBadgeClass += ' status-completed';
            statusText = 'COMPLETED';
          } else {
            statusBadgeClass += ' status-claimable';
            statusText = 'CLAIM REWARD';
          }
        } else if (isUnlocked) {
          statusBadgeClass += ' status-available';
          statusText = 'AVAILABLE';
        } else {
          statusBadgeClass += ' status-locked';
          const reqNum = ch.reqCompleted || ch.req || 0;
          statusText = `REQ: ${reqNum} CLEARED`;
        }

        let actionBtnHtml = '';
        if (isCompleted && !isClaimed) {
          actionBtnHtml = `
            <div class="ch-actions-row">
              <button class="btn-challenge-claim-card" data-claim-id="${ch.id}">CLAIM +Rs ${ch.reward}</button>
              <button class="btn-challenge-play btn-replay" data-play-id="${ch.id}">REPLAY</button>
            </div>
          `;
        } else if (isCompleted && isClaimed) {
          actionBtnHtml = `<button class="btn-challenge-play btn-replay" data-play-id="${ch.id}">REPLAY</button>`;
        } else {
          actionBtnHtml = `<button class="btn-challenge-play" data-play-id="${ch.id}" ${isUnlocked ? '' : 'disabled'}>${isUnlocked ? 'PLAY' : 'LOCKED'}</button>`;
        }

        const currentProg = isCompleted ? ch.target : (typeof ch.progress === 'number' ? ch.progress : 0);
        const numLabel = ch.numStr || (`Challenge ${ch.id < 10 ? '0' + ch.id : ch.id}`);

        card.className = cardClass;
        card.innerHTML = `
          <div class="ch-card-header">
            <span class="ch-card-num">${numLabel}</span>
            <span class="${statusBadgeClass}">${statusText}</span>
          </div>
          <div class="ch-card-title">${ch.title}</div>
          <div class="ch-card-desc">${ch.desc}</div>
          <div class="ch-card-progress-row">
            <span class="ch-progress-text">Progress: ${currentProg} / ${ch.target}</span>
            <span class="ch-card-reward">Reward: Rs ${ch.reward}</span>
          </div>
          <div class="ch-card-bottom">
            ${actionBtnHtml}
          </div>
        `;

        const claimBtn = card.querySelector(`[data-claim-id="${ch.id}"]`);
        if (claimBtn) {
          claimBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.sound.coinCollect();
            ch.claimed = true;
            this.addMoney(ch.reward);
            Storage.saveChallenges(this.challenges);
            this.saveAll();
            this.renderMenuBadges();
            this.renderChallenges();
          });
        }

        const playBtn = card.querySelector(`[data-play-id="${ch.id}"]`);
        if (playBtn && (isUnlocked || isCompleted)) {
          playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.sound.buttonClick();
            this.startChallenge(ch.id);
          });
        }

        list.appendChild(card);
      });
    }

    startChallenge(challengeId) {
      const ch = this.challenges.find(c => c.id === challengeId);
      if (!ch || !ch.unlocked) return;

      this.sound.init();
      this.isChallengeMode = true;
      this.activeChallenge = ch;

      this.challengeKills = 0;
      this.challengeWavesCompleted = 0;
      this.challengeBossKills = 0;
      this.challengeTowerKills = { archer: 0, cannon: 0, magic: 0, lightning: 0 };
      this.challengeCastleDamaged = false;
      this.challengeStartTime = Date.now();
      this.challengeTimeElapsed = 0;
      this.challengeTimeLimit = ch.timeLimit || 0;

      // Close all modals
      document.getElementById('challenge-complete-modal')?.classList.add('hidden');
      document.getElementById('challenge-failed-modal')?.classList.add('hidden');
      document.getElementById('challenges-modal')?.classList.add('hidden');
      document.getElementById('pause-modal')?.classList.add('hidden');

      // Money setup for challenge
      const sMoney = ch.startMoney !== undefined ? ch.startMoney : 450;
      if (ch.type === 'budget') {
        this.money = sMoney;
      } else {
        this.money = Math.max(this.money, sMoney);
      }

      this.isPlaying = true;
      this.castleHealth = 100;
      this.maxCastleHealth = 100;
      this.castleHitTimer = 0;
      this.wave = 1;
      this.isPaused = false;
      this.gameSpeed = 1;
      this.prepTimer = 6;
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

      this.selectedTile = null;
      this.selectedTower = null;
      this.selectedBuildType = null;
      this.hoverTile = null;
      this.cameraY = 0;
      this.targetCameraY = 0;
      document.getElementById('tile-selection-hint')?.classList.add('hidden');
      document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
      this.closeInspector();

      this.updateTowerCardsAvailability();
      this.updateHud();
      this.updateChallengeProgressUI();
      this.showScreen('gameplay-screen');
      this.showWaveBanner(ch.numStr || 'CHALLENGE', ch.title);
      this.sound.startMusic();
    }

    getChallengeCurrentValue() {
      if (!this.activeChallenge) return 0;
      const ch = this.activeChallenge;
      switch (ch.type) {
        case 'waves':
        case 'perfect':
        case 'timed':
        case 'archer_only':
        case 'cannon_only':
        case 'magic_only':
        case 'lightning_only':
        case 'budget':
          return this.challengeWavesCompleted;
        case 'kills':
          return this.challengeKills;
        case 'boss':
          return this.challengeBossKills;
        case 'archer_kills':
          return this.challengeTowerKills['archer'] || 0;
        case 'cannon_kills':
          return this.challengeTowerKills['cannon'] || 0;
        case 'magic_kills':
          return this.challengeTowerKills['magic'] || 0;
        case 'lightning_kills':
          return this.challengeTowerKills['lightning'] || 0;
        default:
          return this.challengeWavesCompleted;
      }
    }

    getChallengeProgressString() {
      if (!this.activeChallenge) return '';
      const current = this.getChallengeCurrentValue();
      const target = this.activeChallenge.target;
      const ch = this.activeChallenge;
      if (['waves', 'perfect', 'timed', 'archer_only', 'cannon_only', 'magic_only', 'lightning_only', 'budget'].includes(ch.type)) {
        return `Waves: ${current} / ${target}`;
      } else if (ch.type === 'boss') {
        return `Bosses: ${current} / ${target}`;
      } else {
        return `Kills: ${current} / ${target}`;
      }
    }

    updateChallengeProgressUI() {
      if (!this.isChallengeMode || !this.activeChallenge) {
        document.getElementById('active-challenge-hud')?.classList.add('hidden');
        return;
      }
      const hud = document.getElementById('active-challenge-hud');
      if (hud) hud.classList.remove('hidden');

      const titleEl = document.getElementById('challenge-hud-name');
      const descEl = document.getElementById('challenge-hud-desc');
      if (titleEl) {
        titleEl.textContent = `${this.activeChallenge.numStr}: ${this.activeChallenge.title}`;
      }
      if (descEl) {
        descEl.textContent = this.getChallengeProgressString();
      }
    }

    checkChallengeConditions() {
      if (!this.isChallengeMode || !this.activeChallenge) return;
      const ch = this.activeChallenge;

      if (ch.type === 'perfect' && this.challengeCastleDamaged) {
        this.failChallenge('Castle took damage! (Requirement: No damage taken)');
        return;
      }

      const current = this.getChallengeCurrentValue();
      ch.progress = Math.max(ch.progress || 0, current);

      this.updateChallengeProgressUI();

      if (current >= ch.target) {
        if (ch.type === 'timed' && ch.timeLimit > 0 && this.challengeTimeElapsed > ch.timeLimit) {
          this.failChallenge(`Time limit of ${ch.timeLimit}s exceeded!`);
          return;
        }
        if (ch.type === 'perfect' && this.challengeCastleDamaged) {
          this.failChallenge('Castle took damage! (Requirement: No damage taken)');
          return;
        }
        this.completeChallenge();
      }
    }

    completeChallenge() {
      this.isPlaying = false;
      this.sound.stopMusic();
      this.sound.victorySound();

      const ch = this.activeChallenge;
      if (!ch) return;

      ch.completed = true;
      ch.progress = ch.target;

      const completedCount = this.challenges.filter(c => c.completed).length;
      this.challenges.forEach(c => {
        if (c.id <= 5 || c.completed || completedCount >= (c.reqCompleted || 0)) {
          c.unlocked = true;
        }
      });

      Storage.saveChallenges(this.challenges);
      this.saveAll();
      this.renderMenuBadges();

      const modal = document.getElementById('challenge-complete-modal');
      const nameEl = document.getElementById('comp-ch-name');
      const rewardEl = document.getElementById('comp-ch-reward');
      const claimBtn = document.getElementById('btn-claim-challenge-reward');
      const backBtn = document.getElementById('btn-back-challenges-from-win');

      if (nameEl) {
        nameEl.textContent = `${ch.numStr}: ${ch.title}`;
      }
      if (rewardEl) {
        rewardEl.textContent = `+Rs ${ch.reward}`;
      }
      if (claimBtn && backBtn) {
        if (ch.claimed) {
          claimBtn.classList.add('hidden');
          backBtn.classList.remove('hidden');
        } else {
          claimBtn.classList.remove('hidden');
          backBtn.classList.add('hidden');
        }
      }

      if (modal) modal.classList.remove('hidden');
    }

    failChallenge(reason = '') {
      this.isPlaying = false;
      this.sound.stopMusic();
      this.sound.gameOverSound();

      const modal = document.getElementById('challenge-failed-modal');
      const nameEl = document.getElementById('fail-ch-name');
      const killsEl = document.getElementById('fail-ch-kills');
      const durEl = document.getElementById('fail-ch-duration');

      if (nameEl && this.activeChallenge) {
        nameEl.textContent = `${this.activeChallenge.numStr}: ${this.activeChallenge.title}`;
      }
      if (killsEl) {
        killsEl.textContent = this.challengeKills.toString();
      }
      if (durEl) {
        durEl.textContent = this.formatDuration(this.challengeTimeElapsed);
      }

      if (modal) modal.classList.remove('hidden');
    }

    updateTowerCardsAvailability() {
      document.querySelectorAll('.tower-card').forEach(card => {
        const type = card.getAttribute('data-type');
        if (this.isChallengeMode && this.activeChallenge && this.activeChallenge.allowedTowers) {
          if (!this.activeChallenge.allowedTowers.includes(type)) {
            card.classList.add('card-disabled');
            card.style.opacity = '0.35';
            card.style.pointerEvents = 'none';
          } else {
            card.classList.remove('card-disabled');
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
          }
        } else {
          card.classList.remove('card-disabled');
          card.style.opacity = '1';
          card.style.pointerEvents = 'auto';
        }
      });
    }

    openChallengesModal() {
      this.openChallengesScreen();
    }

    openSettingsModal() {
      this.menuBattle?.pause();
      document.getElementById('settings-modal')?.classList.remove('hidden');
    }
  }

  let activeGame = null;

  function resizeGame() {
    if (activeGame) {
      activeGame.resizeCanvas();
      activeGame.menuBattle?.resize();
    }
  }

  function initializeGame() {
    try {
      Storage.init();
      activeGame = new GameState();
      window.gameInstance = activeGame;
    } catch (err) {
      console.error('Game initialization failed:', err);
      const overlay = document.getElementById('fatal-error-overlay');
      const msg = document.getElementById('fatal-error-msg');
      if (overlay && msg && overlay.classList) {
        overlay.classList.remove('hidden');
        msg.textContent = 'Error: ' + (err.message || 'Game init error');
      }
    }
  }

  window.addEventListener('error', (event) => {
    const overlay = document.getElementById('fatal-error-overlay');
    const msg = document.getElementById('fatal-error-msg');
    if (overlay && msg && overlay.classList) {
      overlay.classList.remove('hidden');
      msg.textContent = 'Runtime Notice: ' + (event.message || 'Unexpected issue');
    }
  });

  const screens = {
    get mainMenu() { return document.getElementById('main-menu'); },
    get gameScreen() { return document.getElementById('gameplay-screen'); },
    get challengeScreen() { return document.getElementById('challenges-screen'); },
    get taskScreen() { return document.getElementById('tasks-modal'); },
    get settingsScreen() { return document.getElementById('settings-modal'); },
    get customizationScreen() { return document.getElementById('profile-modal'); },
    get exitScreen() { return document.getElementById('exit-screen'); },
    get gameOverScreen() { return document.getElementById('game-over-screen'); },
    get victoryScreen() { return document.getElementById('victory-screen'); }
  };

  function showScreen(screen) {
    if (activeGame) {
      activeGame.showScreen(screen);
      return;
    }
    const all = [
      document.getElementById('main-menu'),
      document.getElementById('gameplay-screen'),
      document.getElementById('challenges-screen'),
      document.getElementById('tasks-modal'),
      document.getElementById('settings-modal'),
      document.getElementById('profile-modal'),
      document.getElementById('exit-screen'),
      document.getElementById('game-over-screen'),
      document.getElementById('victory-screen')
    ];
    all.forEach(s => {
      if (s) {
        s.style.display = 'none';
        s.classList?.remove('active');
        if (s.classList?.contains('modal-overlay')) {
          s.classList.add('hidden');
        }
      }
    });

    let target = null;
    if (typeof screen === 'string') {
      target = document.getElementById(screen) || screens[screen];
    } else if (screen && (screen.nodeType || screen.style || screen.id)) {
      target = screen;
    }
    if (target) {
      target.style.display = 'flex';
      target.classList?.add('active');
      if (target.classList?.contains('modal-overlay')) {
        target.classList.remove('hidden');
      }
    }
  }

  function openExitScreen() {
    saveGameData();
    const exitScreen = document.getElementById('exit-screen');
    const mainMenu = document.getElementById('main-menu');
    if (activeGame) {
      activeGame.openExitScreen();
    } else {
      if (mainMenu) mainMenu.style.display = 'none';
      if (exitScreen) exitScreen.style.display = 'flex';
      showScreen(exitScreen);
    }
  }

  function returnToMainMenu() {
    const exitScreen = document.getElementById('exit-screen');
    const mainMenu = document.getElementById('main-menu');
    if (activeGame) {
      activeGame.returnToMainMenu();
    } else {
      if (exitScreen) exitScreen.style.display = 'none';
      if (mainMenu) mainMenu.style.display = 'flex';
      showScreen(mainMenu);
    }
  }

  function saveGameData() {
    if (activeGame) {
      activeGame.saveGameData();
    } else {
      Storage.save(Storage.load());
    }
  }

  function closeGame() {
    if (activeGame) {
      activeGame.closeGame();
    } else {
      saveGameData();
      try {
        if (window.AndroidBridge && window.AndroidBridge.closeApp) {
          window.AndroidBridge.closeApp();
          return;
        }
      } catch (e) {}
      const exitDesc = document.querySelector('.exit-desc');
      if (exitDesc) {
        exitDesc.textContent = 'Game saved successfully. You may safely return to your home screen or close the app.';
      }
    }
  }

  // Global API hooks
  window.screens = screens;
  window.showScreen = showScreen;
  window.openExitScreen = openExitScreen;
  window.returnToMainMenu = returnToMainMenu;
  window.saveGameData = saveGameData;
  window.closeGame = closeGame;
  window.create100Challenges = create100Challenges;
  window.generate100Challenges = generate100Challenges;
  window.openChallenges = () => activeGame?.openChallengesScreen();
  window.closeChallenges = () => activeGame?.closeChallenges();
  window.initializeChallenges = () => activeGame?.initializeChallenges();
  window.renderChallenges = () => activeGame?.renderChallenges();

  window.addEventListener('resize', resizeGame);
  window.addEventListener('orientationchange', resizeGame);

  function exposeGlobalElements() {
    window.mainMenu = document.getElementById('main-menu');
    window.exitScreen = document.getElementById('exit-screen');
    window.gameScreen = document.getElementById('gameplay-screen');
    window.challengeScreen = document.getElementById('challenges-screen');
    window.taskScreen = document.getElementById('tasks-modal');
    window.settingsScreen = document.getElementById('settings-modal');
    window.customizationScreen = document.getElementById('profile-modal');
    window.exitButton = document.getElementById('btn-exit');
    window.returnToGameButton = document.getElementById('btn-return-game');
  }

  function attachDirectListeners() {
    exposeGlobalElements();

    const btnCh = document.getElementById('btn-challenge');
    if (btnCh) {
      btnCh.addEventListener('click', () => {
        activeGame?.openChallengesScreen();
      });
    }
    const btnBack = document.getElementById('btn-challenges-back');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        activeGame?.closeChallenges();
      });
    }

    const btnExit = document.getElementById('btn-exit');
    if (btnExit) {
      btnExit.onclick = (e) => {
        e?.preventDefault?.();
        openExitScreen();
      };
      btnExit.addEventListener('click', openExitScreen);
    }
    const btnReturn = document.getElementById('btn-return-game');
    if (btnReturn) {
      btnReturn.onclick = (e) => {
        e?.preventDefault?.();
        returnToMainMenu();
      };
      btnReturn.addEventListener('click', returnToMainMenu);
    }
    const btnClose = document.getElementById('btn-close-game');
    if (btnClose) {
      btnClose.onclick = (e) => {
        e?.preventDefault?.();
        closeGame();
      };
      btnClose.addEventListener('click', closeGame);
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      initializeGame();
      resizeGame();
      attachDirectListeners();
    });
  } else {
    initializeGame();
    resizeGame();
    attachDirectListeners();
  }
})();
