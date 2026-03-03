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
  duration = 1.5,
  suffix = "",
  className = "",
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  useGSAP(() => {
    if (!ref.current || value === prevValue.current) return;

    const obj = { val: prevValue.current };
    gsap.to(obj, {
      val: value,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = Math.floor(obj.val).toString() + suffix;
        }
      },
      onComplete: () => {
        prevValue.current = value;
      },
    });
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
}
