import React, { useEffect, useRef } from 'react';

interface LivingCanvasBackgroundProps {
  opacity?: number;
  speed?: number;
  colorTheme?: 'emerald' | 'amber' | 'cyan';
  className?: string;
}

export const LivingCanvasBackground: React.FC<LivingCanvasBackgroundProps> = ({
  opacity = 0.35,
  speed = 0.0012,
  colorTheme = 'emerald',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 200);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Strand definitions (soft reeds / gentle organic waves)
    const strandsCount = 14;
    const strands = Array.from({ length: strandsCount }, (_, i) => ({
      xRatio: (i + 0.5) / strandsCount,
      length: height * (0.6 + Math.random() * 0.35),
      thickness: 1.5 + Math.random() * 2.2,
      phaseOffset: (i * Math.PI) / 4 + Math.random(),
      frequency: 1.2 + Math.random() * 0.8,
      swayRange: 22 + Math.random() * 28,
    }));

    let time = 0;

    const render = () => {
      time += speed;
      ctx.clearRect(0, 0, width, height);

      // Color paletting for soft organic glow
      const strokeColor =
        colorTheme === 'emerald'
          ? 'rgba(16, 185, 129, 0.45)'
          : colorTheme === 'amber'
          ? 'rgba(245, 158, 11, 0.40)'
          : 'rgba(6, 182, 212, 0.40)';

      const tipColor =
        colorTheme === 'emerald'
          ? 'rgba(52, 211, 153, 0.85)'
          : colorTheme === 'amber'
          ? 'rgba(251, 191, 36, 0.85)'
          : 'rgba(103, 232, 249, 0.85)';

      strands.forEach((strand) => {
        const rootX = strand.xRatio * width;
        const rootY = height;
        const sway = Math.sin(time * strand.frequency + strand.phaseOffset) * strand.swayRange;
        const midX = rootX + sway * 0.45;
        const midY = height - strand.length * 0.55;
        const tipX = rootX + sway * 1.15;
        const tipY = height - strand.length;

        const gradient = ctx.createLinearGradient(rootX, rootY, tipX, tipY);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.02)');
        gradient.addColorStop(0.6, strokeColor);
        gradient.addColorStop(1, tipColor);

        ctx.beginPath();
        ctx.moveTo(rootX, rootY);
        ctx.quadraticCurveTo(midX, midY, tipX, tipY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = strand.thickness;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Delicate organic particle at the tip (glowing node)
        ctx.beginPath();
        ctx.arc(tipX, tipY, strand.thickness * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = tipColor;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [speed, colorTheme]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
