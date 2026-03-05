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

    // Wireframe-style particles — nodes + connecting lines
    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
    }
    const nodes: Node[] = [];
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

      // Ring — slower follow
      ringX += (mouseX - ringX) * 0.06;
      ringY += (mouseY - ringY) * 0.06;
      ring.style.transform = `translate(${ringX - 100}px, ${ringY - 100}px)`;

      // Spawn nodes every 4 frames
      if (frameCount % 4 === 0 && mouseX > 0) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 60;
        nodes.push({
          x: mouseX + Math.cos(angle) * dist,
          y: mouseY + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6 - 0.2,
          life: 0,
          maxLife: 50 + Math.random() * 50,
          size: 1.5 + Math.random() * 1.5,
        });
      }

      // Draw wireframe pattern
      ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

      // Update nodes
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        n.life++;
        if (n.life >= n.maxLife) {
          nodes.splice(i, 1);
        }
      }

      // Draw connections between nearby nodes (wireframe lines)
      const connectDist = 120;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const alphaA = 1 - a.life / a.maxLife;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectDist) {
            const alphaB = 1 - b.life / b.maxLife;
            const lineAlpha =
              (1 - dist / connectDist) * Math.min(alphaA, alphaB) * 0.35;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw node dots
      for (const n of nodes) {
        const alpha = (1 - n.life / n.maxLife) * 0.7;
        ctx.beginPath();
        ctx.arc(
          n.x,
          n.y,
          n.size * (1 - (n.life / n.maxLife) * 0.5),
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = `rgba(6, 182, 212, ${alpha})`;
        ctx.fill();
      }

      // Cap nodes
      if (nodes.length > 100) {
        nodes.splice(0, nodes.length - 100);
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
      {/* Wireframe particle canvas — behind content */}
      <canvas
        ref={particlesRef}
        className="fixed top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />
    </>
  );
}
