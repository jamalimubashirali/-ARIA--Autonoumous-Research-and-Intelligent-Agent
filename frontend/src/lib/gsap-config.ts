"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Fade-up animation for elements entering the viewport.
 */
export function fadeUp(
  element: gsap.TweenTarget,
  options?: { delay?: number; duration?: number; y?: number },
) {
  return gsap.fromTo(
    element,
    {
      y: options?.y ?? 40,
      opacity: 0,
    },
    {
      y: 0,
      opacity: 1,
      duration: options?.duration ?? 0.8,
      delay: options?.delay ?? 0,
      ease: "power3.out",
    },
  );
}

/**
 * Stagger animation for a batch of elements.
 */
export function staggerIn(
  elements: gsap.TweenTarget,
  options?: { stagger?: number; duration?: number; y?: number },
) {
  return gsap.fromTo(
    elements,
    {
      y: options?.y ?? 30,
      opacity: 0,
    },
    {
      y: 0,
      opacity: 1,
      duration: options?.duration ?? 0.6,
      stagger: options?.stagger ?? 0.1,
      ease: "power3.out",
    },
  );
}

/**
 * Animate a number counting up from 0 to target.
 */
export function countUp(
  element: HTMLElement,
  target: number,
  options?: { duration?: number; suffix?: string },
) {
  const obj = { val: 0 };
  return gsap.to(obj, {
    val: target,
    duration: options?.duration ?? 1.5,
    ease: "power2.out",
    onUpdate: () => {
      element.textContent =
        Math.floor(obj.val).toString() + (options?.suffix ?? "");
    },
  });
}

/**
 * Glow pulse animation (e.g., for active status indicators).
 */
export function glowPulse(element: gsap.TweenTarget) {
  return gsap.to(element, {
    boxShadow: "0 0 20px oklch(0.65 0.25 265 / 30%)",
    duration: 1.2,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
}

export { gsap, ScrollTrigger };
