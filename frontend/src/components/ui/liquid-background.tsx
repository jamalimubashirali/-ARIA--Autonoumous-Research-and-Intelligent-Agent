"use client";

import { motion } from "framer-motion";

export function LiquidBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-zinc-950">
      {/* 
        Heavy blur applied to the container of the shapes.
        Using a large blur creates the "liquid" or "aurora" effect.
      */}
      <div className="absolute inset-0 blur-[120px] saturate-150">
        <motion.div
          animate={{
            x: ["0%", "20%", "-10%", "0%"],
            y: ["0%", "-20%", "10%", "0%"],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-600/30"
        />

        <motion.div
          animate={{
            x: ["0%", "-30%", "20%", "0%"],
            y: ["0%", "30%", "-20%", "0%"],
            scale: [1, 1.1, 0.8, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/30"
        />

        <motion.div
          animate={{
            x: ["0%", "40%", "-30%", "0%"],
            y: ["0%", "20%", "40%", "0%"],
            scale: [1, 1.3, 0.9, 1],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          className="absolute top-[20%] left-[30%] w-[40%] h-[40%] rounded-full bg-violet-600/20"
        />
      </div>

      {/* Subtle noise overlay to give it some texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
