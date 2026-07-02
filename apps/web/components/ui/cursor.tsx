"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE = "a, button, [role='button'], input, textarea, select, [data-cursor]";

/**
 * Custom cursor: a crisp dot that rides the pointer, a spring-lagged ring
 * that swells over interactive elements, and a soft additive particle trail
 * drawn on a full-screen canvas. Only activates on fine pointers, and stays
 * out of the way for prefers-reduced-motion users.
 */
export function CursorFX() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    document.documentElement.classList.add("custom-cursor");

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const mouse = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    let hoverScale = 1;
    let pressScale = 1;

    interface Spark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
    }
    const sparks: Spark[] = [];
    let lastSpawn = 0;

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      const now = performance.now();
      if (now - lastSpawn > 26 && sparks.length < 40) {
        lastSpawn = now;
        sparks.push({
          x: mouse.x,
          y: mouse.y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5 - 0.2,
          life: 1,
        });
      }
    };
    const onOver = (e: MouseEvent) => {
      hoverScale = (e.target as Element | null)?.closest?.(INTERACTIVE) ? 2.4 : 1;
    };
    const onDown = () => { pressScale = 0.7; };
    const onUp = () => { pressScale = 1; };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    let raf = 0;
    let ringScale = 1;
    const loop = () => {
      // dot snaps, ring glides
      dot.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%, -50%)`;
      ringPos.x += (mouse.x - ringPos.x) * 0.16;
      ringPos.y += (mouse.y - ringPos.y) * 0.16;
      ringScale += (hoverScale * pressScale - ringScale) * 0.14;
      ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%, -50%) scale(${ringScale})`;

      // trail
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= 0.028;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        s.x += s.vx;
        s.y += s.vy;
        const r = 2.2 * s.life;
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 4);
        grad.addColorStop(0, `rgba(255, 200, 150, ${0.28 * s.life})`);
        grad.addColorStop(1, "rgba(255, 200, 150, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      document.documentElement.classList.remove("custom-cursor");
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <div aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[9997] hidden [html.custom-cursor_&]:block"
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[9998] hidden h-8 w-8 rounded-full border border-white/50 mix-blend-difference transition-[border-color] duration-300 [html.custom-cursor_&]:block"
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] hidden h-1.5 w-1.5 rounded-full bg-white mix-blend-difference [html.custom-cursor_&]:block"
      />
    </div>
  );
}
