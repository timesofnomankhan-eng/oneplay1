import React, { useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';

const CrashGraph = () => {
  const canvasRef = useRef(null);
  const { gameStatus, multiplier, crashPoint, countdownSeconds } = useGame();
  
  const pointsRef = useRef([]);
  const startTimeRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Handle canvas resizing
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Track points when game runs
  useEffect(() => {
    if (gameStatus === 'waiting') {
      pointsRef.current = [];
      particlesRef.current = [];
      startTimeRef.current = null;
    } else if (gameStatus === 'running' && !startTimeRef.current) {
      startTimeRef.current = Date.now();
      pointsRef.current = [];
    }
  }, [gameStatus]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let running = true;

    const render = () => {
      if (!running) return;

      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // 1. Clear Canvas (keep background translucent so casino artwork shows through)
      ctx.clearRect(0, 0, width, height);

      // Subtle atmospheric grid
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.lineWidth = 1;

      const gridSize = 45;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Origin point (bottom-left offset)
      const originX = 50;
      const originY = height - 50;
      const plotWidth = width - originX - 60;
      const plotHeight = originY - 40;

      // Draw Axes with reddish glow
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(originX, 20);
      ctx.lineTo(originX, originY);
      ctx.lineTo(width - 20, originY);
      ctx.stroke();

      if (gameStatus === 'running' || gameStatus === 'crashed') {
        const progress = Math.min(1, Math.log(multiplier) / Math.log(15));
        const currentX = originX + progress * plotWidth;
        const currentY = originY - Math.pow(progress, 0.85) * plotHeight;

        pointsRef.current.push({ x: currentX, y: currentY });

        if (pointsRef.current.length > 250) {
          pointsRef.current.shift();
        }

        // Draw Filled Area under Curve with rich crimson/ruby gradient
        if (pointsRef.current.length > 1) {
          const areaGrad = ctx.createLinearGradient(originX, 0, currentX, originY);
          if (gameStatus === 'crashed') {
            areaGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
            areaGrad.addColorStop(1, 'rgba(153, 27, 27, 0.05)');
          } else {
            areaGrad.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
            areaGrad.addColorStop(0.7, 'rgba(224, 36, 36, 0.18)');
            areaGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
          }

          ctx.fillStyle = areaGrad;
          ctx.beginPath();
          ctx.moveTo(originX, originY);
          for (let i = 0; i < pointsRef.current.length; i++) {
            ctx.lineTo(pointsRef.current[i].x, pointsRef.current[i].y);
          }
          ctx.lineTo(currentX, originY);
          ctx.closePath();
          ctx.fill();

          // Draw Glowing Curve Line
          ctx.beginPath();
          ctx.moveTo(originX, originY);
          for (let i = 0; i < pointsRef.current.length; i++) {
            ctx.lineTo(pointsRef.current[i].x, pointsRef.current[i].y);
          }
          ctx.strokeStyle = gameStatus === 'crashed' ? '#ef4444' : '#ff2a4b';
          ctx.lineWidth = 4;
          ctx.shadowColor = gameStatus === 'crashed' ? '#ef4444' : '#ff4d6d';
          ctx.shadowBlur = 20;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Spawn Jet Particles (Golden & Crimson Sparks)
        if (gameStatus === 'running') {
          for (let i = 0; i < 2; i++) {
            particlesRef.current.push({
              x: currentX - 12,
              y: currentY + 4,
              vx: (Math.random() - 0.7) * 3,
              vy: (Math.random() + 0.2) * 2,
              life: 1.0,
              size: Math.random() * 4 + 2,
              color: Math.random() > 0.5 ? '#ef4444' : '#fbbf24'
            });
          }
        }

        // Update and draw particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.04;

          if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
          } else {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }
        }

        // Draw Plane at Tip
        if (gameStatus === 'running') {
          ctx.save();
          ctx.translate(currentX, currentY);
          const angle = -Math.PI / 8;
          ctx.rotate(angle);

          // Plane Body
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(24, 0);
          ctx.lineTo(-18, -9);
          ctx.lineTo(-12, 0);
          ctx.lineTo(-18, 9);
          ctx.closePath();
          ctx.fill();

          // Wings & Details (Red & Gold)
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(2, 0);
          ctx.lineTo(-14, -24);
          ctx.lineTo(-8, -24);
          ctx.lineTo(10, 0);
          ctx.lineTo(-8, 24);
          ctx.lineTo(-14, 24);
          ctx.closePath();
          ctx.fill();

          // Gold Wing Tips
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-14, -24, 6, 2);
          ctx.fillRect(-14, 22, 6, 2);

          // Jet Engine Thruster Glow
          const flameGrad = ctx.createRadialGradient(-16, 0, 1, -16, 0, 14);
          flameGrad.addColorStop(0, '#ffffff');
          flameGrad.addColorStop(0.3, '#fbbf24');
          flameGrad.addColorStop(0.8, '#ef4444');
          flameGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = flameGrad;
          ctx.beginPath();
          ctx.arc(-16, 0, 14, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
    };
  }, [gameStatus, multiplier]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block'
      }}
    />
  );
};

export default CrashGraph;
