'use client';

import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import {
  Environment,
  Float,
  Html,
  Lightformer,
  RoundedBox,
  Sparkles,
} from '@react-three/drei';
import { useSpring, animated, config } from '@react-spring/three';
import * as THREE from 'three';

type BarConfig = {
  x: number;
  height: number;
  colorBody: string;       // dark saturated body (the moody base)
  colorBright: string;     // light accent (for emissive, tooltip, hover glow)
  introOffset: [number, number, number];
  introRotY: number;
  factTitle: string;
  factBody: string;
};

// Mainframe vibe: dark saturated bodies + colored iridescent reflections.
const BARS: BarConfig[] = [
  {
    x: -1.4,
    height: 1.3,
    colorBody: '#3a1d7e',     // dark saturated violet
    colorBright: '#a78bfa',
    introOffset: [-4, 7, -2],
    introRotY: Math.PI * 2,
    factTitle: 'Sprint Tracking',
    factBody: 'One source of truth for sprint WP across every team board.',
  },
  {
    x: 0,
    height: 2.1,
    colorBody: '#0e4258',     // dark saturated teal
    colorBright: '#7fd8ee',
    introOffset: [0, 8, -1],
    introRotY: Math.PI * 2.5,
    factTitle: 'Productivity Analytics',
    factBody: 'Velocity, WP attainment & slowdown alerts at a glance.',
  },
  {
    x: 1.4,
    height: 3.0,
    colorBody: '#5e1a40',     // dark saturated magenta
    colorBright: '#fbb6ce',
    introOffset: [4, 7, -2],
    introRotY: -Math.PI * 2,
    factTitle: 'Team Health',
    factBody: 'Bug monitoring + leave management, all in one dashboard.',
  },
];

const RIM = '#7fd8ee';

function Bar({ config: cfg, index }: { config: BarConfig; index: number }) {
  const [hovered, setHovered] = useState(false);

  // Phase 1: drop from scattered position + spin
  const drop = useSpring({
    from: {
      offX: cfg.introOffset[0],
      offY: cfg.introOffset[1],
      offZ: cfg.introOffset[2],
      rotY: cfg.introRotY,
    },
    to: { offX: 0, offY: 0, offZ: 0, rotY: 0 },
    delay: 500 + index * 280,
    config: { tension: 60, friction: 26, mass: 1.3 },
  });

  // Phase 2: grow from 0 height after landing
  const grow = useSpring({
    from: { sy: 0.05 },
    to: { sy: 1 },
    delay: 1200 + index * 280,
    config: { tension: 90, friction: 22, mass: 1.1 },
  });

  // Continuous: hover feedback
  const hover = useSpring({
    hs: hovered ? 1.08 : 1,
    lift: hovered ? 0.32 : 0,
    emissive: hovered ? 0.55 : 0.12,
    config: config.gentle,
  });

  return (
    <animated.group
      position-x={drop.offX.to((v) => cfg.x + v)}
      position-y={drop.offY}
      position-z={drop.offZ}
      rotation-y={drop.rotY}
    >
      <animated.group position-y={hover.lift} scale={hover.hs}>
        <animated.group
          scale-y={grow.sy}
          position-y={grow.sy.to((s) => (cfg.height / 2) * s + 0.06)}
        >
          {/* Mainframe-style material: dark saturated frosted-matte body with
              high clearcoat for sharp colored reflections on top. Slight
              transmission lets the dark navy bg show through for that
              "polished obsidian reflecting the room" look. */}
          <RoundedBox
            args={[0.92, cfg.height, 0.92]}
            radius={0.1}
            smoothness={10}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setHovered(true);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHovered(false);
              document.body.style.cursor = 'auto';
            }}
          >
            <animated.meshPhysicalMaterial
              color={cfg.colorBody}
              metalness={0.18}
              roughness={0.32}
              clearcoat={1}
              clearcoatRoughness={0.08}
              transmission={0.25}
              thickness={1.1}
              ior={1.5}
              attenuationColor={cfg.colorBright}
              attenuationDistance={2.2}
              emissive={cfg.colorBright}
              emissiveIntensity={hover.emissive}
              envMapIntensity={1.8}
              transparent
              opacity={0.95}
            />
          </RoundedBox>
        </animated.group>

        {/* Hover tooltip — TERE feature fact, animated reveal */}
        <Html
          position={[0, cfg.height + 0.45, 0]}
          center
          style={{ pointerEvents: 'none', zIndex: 50 }}
        >
          <div
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered
                ? 'translateY(0) scale(1)'
                : 'translateY(10px) scale(0.92)',
              transition: 'opacity 0.22s ease-out, transform 0.22s ease-out',
              background: 'rgba(6, 13, 26, 0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${cfg.colorBright}66`,
              borderRadius: '14px',
              padding: '11px 16px',
              width: 'max-content',
              maxWidth: '240px',
              boxShadow: `0 12px 40px ${cfg.colorBody}55, 0 2px 8px rgba(0,0,0,0.5)`,
              fontFamily:
                'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {/* Accent line */}
            <div
              style={{
                width: '28px',
                height: '2px',
                background: cfg.colorBright,
                borderRadius: '2px',
                marginBottom: '8px',
                boxShadow: `0 0 8px ${cfg.colorBright}`,
              }}
            />
            <div
              style={{
                fontSize: '9.5px',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                fontWeight: 700,
                color: cfg.colorBright,
                marginBottom: '5px',
              }}
            >
              {cfg.factTitle}
            </div>
            <div
              style={{
                fontSize: '12.5px',
                color: 'rgba(255,255,255,0.88)',
                lineHeight: 1.45,
              }}
            >
              {cfg.factBody}
            </div>
          </div>
        </Html>
      </animated.group>
    </animated.group>
  );
}

function BarsGroup() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const { x, y } = state.pointer;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, x * 0.25, 0.05);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      -y * 0.1 + 0.06,
      0.05,
    );
  });

  return (
    <group ref={groupRef} position={[-2.5, -1.6, 0]}>
      <Float speed={0.9} rotationIntensity={0.04} floatIntensity={0.15}>
        {BARS.map((b, i) => (
          <Bar key={i} config={b} index={i} />
        ))}
      </Float>
    </group>
  );
}

function SparkleField() {
  return (
    <>
      <Sparkles count={70} scale={[18, 10, 6]} position={[0, 1, -1]} size={2.2} speed={0.3} opacity={0.55} color={RIM} />
      <Sparkles count={35} scale={[20, 12, 6]} position={[2, 0.5, -0.5]} size={2.4} speed={0.25} opacity={0.45} color="#c4b5fd" />
      <Sparkles count={35} scale={[20, 12, 6]} position={[-2, -0.5, 0]} size={2.4} speed={0.28} opacity={0.45} color="#fbb6ce" />
    </>
  );
}

export default function Stat3DScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 9], fov: 36 }}
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={1.0} color="#c8dce8" />
      <directionalLight position={[4, 6, 5]} intensity={1.4} color="#ffffff" />
      <directionalLight position={[-5, 3, -2]} intensity={0.8} color={RIM} />
      <directionalLight position={[0, -3, 4]} intensity={0.4} color="#ffffff" />

      <Suspense fallback={null}>
        <Environment resolution={512} background={false}>
          {/* Top diffuse white — soft sheen on top edges */}
          <Lightformer intensity={1.6} color="#ffffff" position={[0, 4, 3]} scale={[7, 2, 1]} />
          {/* Iridescent colored panels — these create the vivid colored
              streaks visible on the dark bars' clearcoat (Mainframe look) */}
          <Lightformer intensity={1.5} color="#a78bfa" position={[-4, 2, 2]} scale={[2.5, 4.5, 1]} />
          <Lightformer intensity={1.5} color={RIM} position={[0, 1.5, -3]} scale={[3, 4, 1]} />
          <Lightformer intensity={1.5} color="#fbb6ce" position={[4, 2, 2]} scale={[2.5, 4.5, 1]} />
          {/* Soft accent fills from below */}
          <Lightformer intensity={0.7} color="#22b8d4" position={[0, -2, 3]} scale={[4, 1.5, 1]} />
          <Lightformer intensity={0.6} color="#c4b5fd" position={[-3, 0, -3]} scale={[2, 3, 1]} />
          <Lightformer intensity={0.6} color="#f472b6" position={[3, 0, -3]} scale={[2, 3, 1]} />
          {/* Dark navy backdrop — exact match to page bg darkest tone, so the
              subtle transmission through the bars reads as page-bg reflection */}
          <mesh scale={50}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial color="#060d1a" side={THREE.BackSide} />
          </mesh>
        </Environment>

        <SparkleField />
        <BarsGroup />

      </Suspense>
    </Canvas>
  );
}
