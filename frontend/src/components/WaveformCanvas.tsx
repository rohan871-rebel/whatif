import React, { useRef, useEffect } from 'react';

interface WaveformCanvasProps {
  height?: number;
  noiseLevel?: number; // 0.0 to 1.0
  heartRate?: number;
  isStale?: boolean;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  height = 120,
  noiseLevel = 0.0,
  heartRate = 75,
  isStale = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let offset = 0;

    const render = () => {
      const width = canvas.width;
      const h = canvas.height;

      // Dark background
      ctx.fillStyle = '#070B14';
      ctx.fillRect(0, 0, width, h);

      // Draw subtle telemetry grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 20;

      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Telemetry Waveform calculation
      const midY = h / 2;
      const speed = isStale ? 0.2 : 2.5;
      offset += speed;

      ctx.beginPath();
      const waveColor = isStale
        ? '#F59E0B'
        : noiseLevel > 0.4
        ? '#F43F5E'
        : '#06B6D4';

      ctx.strokeStyle = waveColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = waveColor;
      ctx.shadowBlur = 8;

      const wavelength = Math.max(80, (60 / (heartRate || 75)) * 140);

      for (let x = 0; x < width; x += 2) {
        const t = (x + offset) % wavelength;
        let y = midY;

        // P-Q-R-S-T synthetic physiological waveform
        if (t > 15 && t < 30) {
          // P wave
          y -= Math.sin(((t - 15) / 15) * Math.PI) * (h * 0.08);
        } else if (t >= 35 && t < 40) {
          // Q dip
          y += Math.sin(((t - 35) / 5) * Math.PI) * (h * 0.06);
        } else if (t >= 40 && t < 50) {
          // R spike
          y -= Math.sin(((t - 40) / 10) * Math.PI) * (h * 0.42);
        } else if (t >= 50 && t < 56) {
          // S dip
          y += Math.sin(((t - 50) / 6) * Math.PI) * (h * 0.14);
        } else if (t >= 65 && t < 85) {
          // T wave
          y -= Math.sin(((t - 65) / 20) * Math.PI) * (h * 0.12);
        }

        // Add Noise / Artifacts
        if (noiseLevel > 0) {
          const noise = (Math.random() - 0.5) * (h * 0.5) * noiseLevel;
          // Baseline wander
          const wander = Math.sin((x + offset) * 0.02) * (h * 0.15) * noiseLevel;
          y += noise + wander;
        }

        // Stale warning flatline or slow drift
        if (isStale) {
          y = midY + Math.sin((x + offset) * 0.01) * 3;
        }

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Reset shadow for performance
      ctx.shadowBlur = 0;

      // Draw sweeping scanner beam
      const sweepX = (offset * 1.5) % width;
      const gradient = ctx.createLinearGradient(sweepX - 40, 0, sweepX, 0);
      gradient.addColorStop(0, 'rgba(7, 11, 20, 0)');
      gradient.addColorStop(1, 'rgba(7, 11, 20, 0.85)');
      ctx.fillStyle = gradient;
      ctx.fillRect(sweepX - 40, 0, 40, h);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [noiseLevel, heartRate, isStale, height]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-navy-950 shadow-apple">
      <canvas
        ref={canvasRef}
        width={700}
        height={height}
        className="w-full h-full block"
      />
      <div className="absolute top-2 left-3 flex items-center gap-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          LEAD II TELEMETRY • {isStale ? 'STALE BUFFER' : noiseLevel > 0 ? `NOISE INJECTED (${Math.round(noiseLevel * 100)}%)` : 'FILTERED 0.05-40Hz'}
        </span>
      </div>
      <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-500 pointer-events-none">
        {heartRate} BPM • 25 mm/s • 10 mm/mV
      </div>
    </div>
  );
};
