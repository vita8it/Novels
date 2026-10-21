"use client";

import { useEffect, useRef } from "react";

export default function InteractiveDotGrid({
  className = "pointer-events-none fixed inset-0 z-0",
  baseOpacity = 0.13,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const mouse = { x: -1000, y: -1000, active: false };

    const SPACING = 32; // Distance between dots
    const INFLUENCE_RADIUS = 150; // Proximity radius where animation triggers
    const DOT_RADIUS = 0.8; // Base dot size

    class Dot {
      constructor(x, y) {
        this.baseX = x;
        this.baseY = y;
        this.x = x;
        this.y = y;
        this.currentRadius = DOT_RADIUS;
        this.targetRadius = DOT_RADIUS;
        this.currentAlpha = baseOpacity;
        this.targetAlpha = baseOpacity;
      }

      update(mx, my, active) {
        if (active) {
          const dx = mx - this.baseX;
          const dy = my - this.baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < INFLUENCE_RADIUS) {
            const factor = 1 - dist / INFLUENCE_RADIUS;
            // Do NOT increase brightness: keep alpha at baseOpacity
            this.targetAlpha = baseOpacity;
            // Reduce dot size when mouse is nearby (shrinks smoothly down to ~35% of base size)
            this.targetRadius = DOT_RADIUS * Math.max(0.35, 1 - factor * 0.65);

            // Subtle elastic push away from cursor
            const angle = Math.atan2(dy, dx);
            const push = factor * 4.5;
            this.x = this.baseX - Math.cos(angle) * push;
            this.y = this.baseY - Math.sin(angle) * push;
          } else {
            this.targetRadius = DOT_RADIUS;
            this.targetAlpha = baseOpacity;
            this.x += (this.baseX - this.x) * 0.12;
            this.y += (this.baseY - this.y) * 0.12;
          }
        } else {
          this.targetRadius = DOT_RADIUS;
          this.targetAlpha = baseOpacity;
          this.x += (this.baseX - this.x) * 0.12;
          this.y += (this.baseY - this.y) * 0.12;
        }

        // Smooth spring interpolation
        this.currentRadius += (this.targetRadius - this.currentRadius) * 0.14;
        this.currentAlpha += (this.targetAlpha - this.currentAlpha) * 0.14;
      }

      draw(context) {
        context.beginPath();
        context.arc(this.x, this.y, Math.max(0.1, this.currentRadius), 0, Math.PI * 2);
        context.fillStyle = `rgba(255, 255, 255, ${this.currentAlpha})`;
        context.fill();
      }
    }

    let dots = [];
    const initDots = () => {
      dots = [];
      const cols = Math.floor(width / SPACING);
      const rows = Math.floor(height / SPACING);
      const startX = (width - cols * SPACING) / 2;
      const startY = (height - rows * SPACING) / 2;

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          dots.push(new Dot(startX + i * SPACING, startY + j * SPACING));
        }
      }
    };

    initDots();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < dots.length; i++) {
        dots[i].update(mouse.x, mouse.y, mouse.active);
        dots[i].draw(ctx);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handlePointerMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handlePointerLeave = () => {
      mouse.active = false;
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      initDots();
    };

    window.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, [baseOpacity]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  );
}
