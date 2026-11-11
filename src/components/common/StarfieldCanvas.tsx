import { useEffect, useRef } from 'react';

export function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Generate static stars
    const starCount = Math.floor((width * height) / 3200);
    const stars: { x: number; y: number; r: number; alpha: number; speed: number }[] = [];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.2 + 0.3,
        alpha: Math.random() * 0.7 + 0.2,
        speed: Math.random() * 0.05 + 0.01,
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle celestial nebula gradient washes
      const grad1 = ctx.createRadialGradient(
        width * 0.2,
        height * 0.3,
        50,
        width * 0.2,
        height * 0.3,
        width * 0.6
      );
      grad1.addColorStop(0, 'rgba(30, 27, 75, 0.18)'); // deep indigo
      grad1.addColorStop(1, 'rgba(5, 7, 14, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(
        width * 0.8,
        height * 0.7,
        100,
        width * 0.8,
        height * 0.7,
        width * 0.5
      );
      grad2.addColorStop(0, 'rgba(8, 47, 73, 0.15)'); // deep cyan
      grad2.addColorStop(1, 'rgba(5, 7, 14, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Draw stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        // Gentle twinkle
        star.alpha += (Math.random() - 0.5) * 0.02;
        if (star.alpha < 0.1) star.alpha = 0.1;
        if (star.alpha > 0.85) star.alpha = 0.85;

        ctx.fillStyle = `rgba(226, 232, 240, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
}
