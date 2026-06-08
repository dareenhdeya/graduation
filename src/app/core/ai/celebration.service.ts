import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CelebrationService {

  private audioCtx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.audioCtx) this.audioCtx = new AudioContext();
    return this.audioCtx;
  }

  /** Synthesised clap — 3 quick noise bursts, no audio file needed */
  playClap() {
    const ctx = this.getCtx();
    const now = ctx.currentTime;
  
    // 🎉 Celebration fanfare — ascending happy notes
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const delay = i * 0.12;
  
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
  
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      // slight pitch rise for excitement
      osc.frequency.exponentialRampToValueAtTime(freq * 1.02, now + delay + 0.15);
  
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.4, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);
  
      osc.connect(gain);
      gain.connect(ctx.destination);
  
      osc.start(now + delay);
      osc.stop(now + delay + 0.3);
    });
  
    // 🥁 add a little shimmer on top
    const shimmerBuf  = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const shimmerData = shimmerBuf.getChannelData(0);
    for (let j = 0; j < shimmerData.length; j++) {
      shimmerData[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / shimmerData.length, 2) * 0.08;
    }
    const shimmerSrc = ctx.createBufferSource();
    shimmerSrc.buffer = shimmerBuf;
  
    const shimmerFilter = ctx.createBiquadFilter();
    shimmerFilter.type = 'highpass';
    shimmerFilter.frequency.value = 6000;
  
    shimmerSrc.connect(shimmerFilter);
    shimmerFilter.connect(ctx.destination);
    shimmerSrc.start(now);
  }
  /** Confetti cannon drawn on the provided canvas overlay */
  launchConfetti(canvas: HTMLCanvasElement) {
    const ctx    = canvas.getContext('2d')!;
    const W      = canvas.width;
    const H      = canvas.height;
    const COLORS = ['#f4c542','#7c6ef7','#00ff88','#ff6b6b','#4ecdc4','#ffe66d','#ff9ff3'];

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      color: string; size: number;
      angle: number; spin: number;
      shape: 'rect' | 'circle' | 'star';
      life: number;
    }

    const particles: Particle[] = Array.from({ length: 120 }, () => ({
      x:     W / 2 + (Math.random() - 0.5) * W * 0.4,
      y:     H * 0.4,
      vx:    (Math.random() - 0.5) * 14,
      vy:    -(Math.random() * 12 + 6),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size:  Math.random() * 10 + 5,
      angle: Math.random() * Math.PI * 2,
      spin:  (Math.random() - 0.5) * 0.25,
      shape: (['rect', 'circle', 'star'] as const)[Math.floor(Math.random() * 3)],
      life:  1
    }));

    let frame = 0;
    const TOTAL = 90;

    const tick = () => {
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        p.vy    += 0.45;
        p.x     += p.vx;
        p.y     += p.vy;
        p.angle += p.spin;
        p.life   = Math.max(0, 1 - frame / TOTAL);

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            const a = (s * 4 * Math.PI) / 5 - Math.PI / 2;
            const r = s % 2 === 0 ? p.size / 2 : p.size / 4;
            ctx[s === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      frame++;
      if (frame < TOTAL) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    };

    tick();
  }
}