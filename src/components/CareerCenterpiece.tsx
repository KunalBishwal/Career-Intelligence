"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface CareerCenterpieceProps {
  className?: string;
}

export default function CareerCenterpiece({ className = "" }: CareerCenterpieceProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 280;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // Group for interwoven forms
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. Primary Lavender Interwoven Knot (TorusKnot)
    // Palette: Lavender #CBB3E8
    const primaryGeometry = new THREE.TorusKnotGeometry(1.4, 0.38, 128, 32, 2, 3);
    const primaryMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#CBB3E8"),
      roughness: 0.18,
      metalness: 0.25,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
    });
    const primaryMesh = new THREE.Mesh(primaryGeometry, primaryMaterial);
    rootGroup.add(primaryMesh);

    // 2. Secondary Chartreuse Satellite Ribbon
    // Palette: Chartreuse #D4FF3F
    const chartreuseGeometry = new THREE.TorusGeometry(2.05, 0.07, 24, 100);
    const chartreuseMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#D4FF3F"),
      roughness: 0.2,
      metalness: 0.3,
      emissive: new THREE.Color("#D4FF3F"),
      emissiveIntensity: 0.22,
      clearcoat: 1.0,
    });
    const chartreuseRing = new THREE.Mesh(chartreuseGeometry, chartreuseMaterial);
    chartreuseRing.rotation.x = Math.PI / 3;
    chartreuseRing.rotation.y = Math.PI / 6;
    rootGroup.add(chartreuseRing);

    // 3. Selective Tomato Red Accent Orb / Core
    // Palette: Tomato Red #E34234 (used with restraint as focal point)
    const tomatoGeometry = new THREE.SphereGeometry(0.32, 32, 32);
    const tomatoMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#E34234"),
      roughness: 0.1,
      metalness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      emissive: new THREE.Color("#E34234"),
      emissiveIntensity: 0.18,
    });
    const tomatoOrb = new THREE.Mesh(tomatoGeometry, tomatoMaterial);
    tomatoOrb.position.set(0.65, 0.45, 0.5);
    rootGroup.add(tomatoOrb);

    // 4. Deep Aubergine Accent Ring
    // Palette: Deep Aubergine #21152B
    const aubergineGeometry = new THREE.TorusGeometry(1.85, 0.05, 16, 80);
    const aubergineMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#3B264E"),
      roughness: 0.4,
      metalness: 0.6,
      clearcoat: 0.6,
    });
    const aubergineRing = new THREE.Mesh(aubergineGeometry, aubergineMaterial);
    aubergineRing.rotation.x = -Math.PI / 4;
    aubergineRing.rotation.z = Math.PI / 5;
    rootGroup.add(aubergineRing);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    // Key Light (Warm off-white from top right)
    const keyLight = new THREE.DirectionalLight("#F5F0EA", 2.2);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    // Fill Light (Lavender from bottom left)
    const fillLight = new THREE.DirectionalLight("#CBB3E8", 1.8);
    fillLight.position.set(-4, -3, 2);
    scene.add(fillLight);

    // Rim Light (Chartreuse from behind for sharp rim reflections)
    const rimLight = new THREE.DirectionalLight("#D4FF3F", 2.0);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // Accent Point Light for Tomato Red sparkle
    const pointLight = new THREE.PointLight("#E34234", 1.5, 8);
    pointLight.position.set(1.5, 1, 2);
    scene.add(pointLight);

    // Mouse parallax tracking
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 0.45;
      targetY = y * 0.45;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let isVisible = true;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Smooth mouse parallax lerp
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      // Base rotation + mouse interaction
      primaryMesh.rotation.x = elapsed * 0.22 + currentY;
      primaryMesh.rotation.y = elapsed * 0.28 + currentX;

      chartreuseRing.rotation.z = -elapsed * 0.35;
      chartreuseRing.rotation.y = Math.PI / 6 + currentX * 0.5;

      aubergineRing.rotation.z = elapsed * 0.25;

      // Tomato orb floats in gentle harmonic orbit
      tomatoOrb.position.x = Math.sin(elapsed * 0.9) * 0.85;
      tomatoOrb.position.y = Math.cos(elapsed * 0.7) * 0.7;
      tomatoOrb.position.z = Math.sin(elapsed * 0.5) * 0.55;

      rootGroup.rotation.y = currentX * 0.2;
      rootGroup.rotation.x = currentY * 0.2;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      primaryGeometry.dispose();
      primaryMaterial.dispose();
      chartreuseGeometry.dispose();
      chartreuseMaterial.dispose();
      tomatoGeometry.dispose();
      tomatoMaterial.dispose();
      aubergineGeometry.dispose();
      aubergineMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  if (!hasWebGL) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-gradient-to-tr from-aubergine via-aubergine-700 to-charcoal border border-lavender/20 p-6 ${className}`}
      >
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-full bg-lavender/20 border border-lavender/40 mx-auto flex items-center justify-center text-lavender font-serif font-bold text-lg">
            3D
          </div>
          <p className="text-xs text-lavender/80 font-mono">Career Intelligence Mesh</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={`relative overflow-hidden cursor-grab active:cursor-grabbing select-none ${className}`}
      title="Interactive Career Intelligence 3D Sculpture"
    />
  );
}
