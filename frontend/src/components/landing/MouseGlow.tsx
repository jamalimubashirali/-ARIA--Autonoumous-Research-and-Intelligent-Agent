"use client";

import { useEffect, useRef } from "react";

export function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    const ring = ringRef.current;
    const particleCanvas = particlesRef.current;
    if (!glow || !ring || !particleCanvas) return;

    const ctx = particleCanvas.getContext("2d");
    if (!ctx) return;

    // Size particle canvas to viewport
    const resize = () => {
      particleCanvas.width = window.innerWidth;
      particleCanvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let mouseX = -500;
    let mouseY = -500;
    let currentX = -500;
    let currentY = -500;
    let ringX = -500;
    let ringY = -500;

    // Floating particles around cursor
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
    }[] = [];
    let frameCount = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      frameCount++;

      // Primary glow — smooth follow
      currentX += (mouseX - currentX) * 0.12;
      currentY += (mouseY - currentY) * 0.12;
      glow.style.transform = `translate(${currentX - 250}px, ${currentY - 250}px)`;

      // Ring — slower follow for parallax
      ringX += (mouseX - ringX) * 0.06;
      ringY += (mouseY - ringY) * 0.06;
      ring.style.transform = `translate(${ringX - 100}px, ${ringY - 100}px)`;

      // Spawn particles every 3 frames
      if (frameCount % 3 === 0 && mouseX > 0) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.3 + Math.random() * 0.7;
        particles.push({
          x: mouseX + (Math.random() - 0.5) * 40,
          y: mouseY + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.3,
          life: 0,
          maxLife: 40 + Math.random() * 40,
          size: 1 + Math.random() * 2,
        });
      }

      // Draw particles
      ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        const alpha = 1 - p.life / p.maxLife;
        const fade = alpha * 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 182, 212, ${fade})`;
        ctx.fill();
      }

      // Keep particles bounded
      if (particles.length > 80) {
        particles.splice(0, particles.length - 80);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      {/* Subtle glow — behind content */}
      <div
        ref={glowRef}
        className="fixed top-0 left-0 pointer-events-none"
        style={{
          width: 500,
          height: 500,
          zIndex: 0,
          background:
            "radial-gradient(circle, rgba(6,182,212,0.12) 0%, rgba(6,182,212,0.05) 30%, transparent 65%)",
          borderRadius: "50%",
          willChange: "transform",
        }}
      />
      {/* Soft ring outline — slower follow */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none"
        style={{
          width: 200,
          height: 200,
          zIndex: 0,
          border: "1px solid rgba(6, 182, 212, 0.12)",
          borderRadius: "50%",
          willChange: "transform",
          boxShadow: "0 0 30px rgba(6,182,212,0.05)",
        }}
      />
      {/* Particle canvas — behind content */}
      <canvas
        ref={particlesRef}
        className="fixed top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />
    </>
  );
}
