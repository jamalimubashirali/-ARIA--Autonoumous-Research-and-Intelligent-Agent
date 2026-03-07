"use client";

import { useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, countUp } from "@/lib/gsap-config";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1.2,
  suffix = "",
  className = "",
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  useGSAP(() => {
    if (!ref.current || value === prevValue.current) return;

    // Fast-forward animation if difference is just 1 or 2
    const currentDuration =
      Math.abs(value - prevValue.current) <= 2 ? 0.6 : duration;

    const obj = { val: prevValue.current };
    gsap.to(obj, {
      val: value,
      duration: currentDuration,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = Math.round(obj.val).toString() + suffix;
        }
      },
      onComplete: () => {
        if (ref.current) {
          ref.current.textContent = value.toString() + suffix;
        }
        prevValue.current = value;
      },
    });
  }, [value, duration, suffix]);

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
}
