"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ThreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Create dramatic terrain with high vertex density
    const geometry = new THREE.PlaneGeometry(80, 80, 150, 150);

    // Custom shader material for gradient coloring (dark blue base → bright cyan peaks)
    const material = new THREE.ShaderMaterial({
      wireframe: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying float vElevation;
        varying vec3 vPosition;
        uniform float uTime;
        
        // Simplex-like noise using sin combinations
        float noise(vec2 p) {
          return sin(p.x * 0.3 + uTime * 0.4) * sin(p.y * 0.4 + uTime * 0.3) * 0.5
               + sin(p.x * 0.7 - uTime * 0.2) * sin(p.y * 0.5 + uTime * 0.5) * 0.3
               + sin((p.x + p.y) * 0.2 + uTime * 0.15) * 0.4
               + sin(p.x * 1.1 + p.y * 0.9 + uTime * 0.25) * 0.15;
        }
        
        void main() {
          vec3 pos = position;
          
          // Create dramatic mountainous terrain
          float n = noise(pos.xy);
          
          // Add secondary noise for roughness
          float detail = sin(pos.x * 1.5 + uTime * 0.3) * cos(pos.y * 1.2 - uTime * 0.2) * 0.8;
          
          // Combine for dramatic peaks
          pos.z = n * 6.0 + detail + abs(sin(pos.x * 0.15) * cos(pos.y * 0.12)) * 4.0;
          
          // Fade edges to flat
          float edgeFade = smoothstep(38.0, 25.0, length(pos.xy));
          pos.z *= edgeFade;
          
          vElevation = pos.z;
          vPosition = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying float vElevation;
        varying vec3 vPosition;
        
        void main() {
          // Color gradient: deep dark blue at base → bright cyan at peaks
          vec3 deepBlue = vec3(0.02, 0.05, 0.15);
          vec3 midBlue = vec3(0.05, 0.2, 0.5);
          vec3 brightCyan = vec3(0.0, 0.85, 0.95);
          vec3 white = vec3(0.7, 0.95, 1.0);
          
          float t = clamp(vElevation / 8.0, 0.0, 1.0);
          
          vec3 color;
          if (t < 0.3) {
            color = mix(deepBlue, midBlue, t / 0.3);
          } else if (t < 0.7) {
            color = mix(midBlue, brightCyan, (t - 0.3) / 0.4);
          } else {
            color = mix(brightCyan, white, (t - 0.7) / 0.3);
          }
          
          // Fade opacity based on distance from center for soft edges
          float dist = length(vPosition.xy);
          float alpha = smoothstep(40.0, 15.0, dist) * (0.25 + t * 0.55);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2.2;
    plane.position.y = -8;
    plane.position.z = -5;
    scene.add(plane);

    // ── Drone camera path ──
    // Start position (hero view — high above, looking down at terrain)
    const startCam = { x: 0, y: 12, z: 28, lookY: -2 };
    // End position (scrolled — swooped low and forward over the terrain)
    const endCam = { x: -8, y: 6, z: 10, lookY: -6 };

    // Animated values driven by scroll
    const droneState = {
      x: startCam.x,
      y: startCam.y,
      z: startCam.z,
      lookY: startCam.lookY,
    };

    camera.position.set(startCam.x, startCam.y, startCam.z);
    camera.lookAt(0, startCam.lookY, 0);

    // GSAP ScrollTrigger — scrub the camera along the path as user scrolls
    const droneTween = gsap.to(droneState, {
      x: endCam.x,
      y: endCam.y,
      z: endCam.z,
      lookY: endCam.lookY,
      ease: "none",
      scrollTrigger: {
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5, // smooth 1.5s lag
      },
    });

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Update shader time uniform
      material.uniforms.uTime.value = time;

      // Combine drone scroll position with subtle mouse parallax
      const targetX = droneState.x + mouseX * 2;
      const targetY = droneState.y + mouseY * 1.5;
      camera.position.x += (targetX - camera.position.x) * 0.03;
      camera.position.y += (targetY - camera.position.y) * 0.03;
      camera.position.z += (droneState.z - camera.position.z) * 0.03;
      camera.lookAt(0, droneState.lookY, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      droneTween.kill();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />
      <div className="terrain-overlay" />
    </>
  );
}
