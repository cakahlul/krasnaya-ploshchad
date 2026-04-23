'use client';

import { useState, useEffect, useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SKINS = ['#f5c5a3', '#e8a87c', '#fcd9a8', '#d4956a', '#f0c27a'];
const SHIRTS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const HAIRS = ['#312e81', '#064e3b', '#92400e', '#1c0a00', '#2e1065'];
const PANTS = ['#1e3a5f', '#1a2e1a', '#3b2106', '#2d0a0a', '#1a0f3c'];

const FUN_TIPS = [
  "Did you know? 73% of productivity reports are never actually read.",
  "Pro tip: The standup is 15 min. The follow-up Slack thread is 2 hours.",
  "Fun fact: 'Almost done' = 3 more sprints in agile time.",
  "Tip: Bugs filed on Fridays mysteriously survive the whole weekend.",
  "Did you know? Tech debt is just features for future-you to deal with.",
  "Loading your team's excuses... just kidding, loading real data!",
  "Pro tip: Above 100% productivity? Please share your secrets.",
  "Fun fact: Every standup runs exactly 3 minutes over schedule. Always.",
  "Tip: Coffee consumption is directly correlated with WP score.",
  "Did you know? Sprint velocity improves significantly after team lunch.",
  "Pro tip: Renaming a variable counts as a refactor. Ship it.",
  "Fun fact: The word 'sprint' was chosen to set unrealistic expectations.",
  "Tip: A bug that no one reports is just an undocumented feature.",
  "Did you know? 'Let's sync offline' means 'I have no idea either'.",
  "Pro tip: The best code review is one where nobody finds anything.",
];

type SceneVariant = 'desk' | 'standup' | 'launch';

const SCENES: SceneVariant[] = ['desk', 'standup', 'launch'];

interface ThemeColors {
  accent: string;
  accentGlow: string;
  bg1: string;
  bg2: string;
  textPrimary: string;
  textSecondary: string;
  gridColor: string;
}

function getThemeColors(theme: string): ThemeColors {
  switch (theme) {
    case 'crimson':
      return {
        accent: '#e53935',
        accentGlow: 'rgba(229,57,53,0.25)',
        bg1: '#0d0d0d',
        bg2: '#1a0a0a',
        textPrimary: '#ffffff',
        textSecondary: 'rgba(255,255,255,0.55)',
        gridColor: 'rgba(229,57,53,0.06)',
      };
    case 'light':
      return {
        accent: '#1282a2',
        accentGlow: 'rgba(18,130,162,0.18)',
        bg1: '#f4f6f8',
        bg2: '#e8ecef',
        textPrimary: '#1a1a2e',
        textSecondary: 'rgba(26,26,46,0.55)',
        gridColor: 'rgba(18,130,162,0.06)',
      };
    case 'void':
    default:
      return {
        accent: '#1282a2',
        accentGlow: 'rgba(18,130,162,0.25)',
        bg1: '#0a0a1a',
        bg2: '#0d1117',
        textPrimary: '#ffffff',
        textSecondary: 'rgba(255,255,255,0.55)',
        gridColor: 'rgba(18,130,162,0.06)',
      };
  }
}

/* ------------------------------------------------------------------ */
/*  SVG Character Builder                                              */
/* ------------------------------------------------------------------ */

interface CharacterProps {
  x: number;
  y: number;
  skin: string;
  shirt: string;
  hair: string;
  pants: string;
  seated?: boolean;
  animClass?: string;
  armAnim?: string;
  headAnim?: string;
  flip?: boolean;
}

function Character({
  x,
  y,
  skin,
  shirt,
  hair,
  pants,
  seated = false,
  animClass = '',
  armAnim = '',
  headAnim = '',
  flip = false,
}: CharacterProps) {
  const legY = seated ? 10 : 18;
  const legH = seated ? 8 : 14;
  const transform = flip
    ? `translate(${x}, ${y}) scale(-1,1) translate(-16,0)`
    : `translate(${x}, ${y})`;

  return (
    <g transform={transform}>
      {/* Head */}
      <g className={headAnim}>
        <circle cx={16} cy={8} r={8} fill={skin} />
        {/* Hair */}
        <ellipse cx={16} cy={4} rx={8} ry={5} fill={hair} />
        {/* Eyes */}
        <circle cx={13} cy={8} r={1} fill="#222" />
        <circle cx={19} cy={8} r={1} fill="#222" />
        {/* Mouth */}
        <path d="M13,11 Q16,14 19,11" fill="none" stroke="#222" strokeWidth={0.7} />
      </g>
      {/* Body / Torso */}
      <rect x={10} y={16} width={12} height={14} rx={3} fill={shirt} className={animClass} />
      {/* Arms */}
      <g className={armAnim}>
        <rect x={4} y={17} width={6} height={4} rx={2} fill={shirt} />
        <rect x={22} y={17} width={6} height={4} rx={2} fill={shirt} />
        {/* Hands */}
        <circle cx={4} cy={19} r={2} fill={skin} />
        <circle cx={28} cy={19} r={2} fill={skin} />
      </g>
      {/* Legs */}
      <rect x={11} y={legY + 16} width={4} height={legH} rx={2} fill={pants} />
      <rect x={17} y={legY + 16} width={4} height={legH} rx={2} fill={pants} />
      {/* Shoes */}
      <rect x={10} y={legY + 16 + legH - 1} width={5} height={3} rx={1.5} fill="#222" />
      <rect x={17} y={legY + 16 + legH - 1} width={5} height={3} rx={1.5} fill="#222" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene: The Office (Desk)                                           */
/* ------------------------------------------------------------------ */

function DeskScene({ accent }: { accent: string }) {
  const chars = useMemo(() => {
    const indices = [0, 1, 2, 3, 4];
    return indices.map((i) => ({
      skin: SKINS[i],
      shirt: SHIRTS[i],
      hair: HAIRS[i],
      pants: PANTS[i],
    }));
  }, []);

  return (
    <svg viewBox="0 0 480 220" style={{ width: '100%', maxWidth: 520, height: 'auto' }}>
      {/* Floor */}
      <rect x={0} y={180} width={480} height={40} fill="rgba(255,255,255,0.03)" rx={4} />

      {/* Whiteboard */}
      <rect x={350} y={20} width={80} height={50} rx={4} fill="#fff" opacity={0.9} />
      <rect x={358} y={28} width={26} height={3} rx={1} fill={accent} opacity={0.6} />
      <rect x={358} y={35} width={40} height={3} rx={1} fill={accent} opacity={0.4} />
      <rect x={358} y={42} width={32} height={3} rx={1} fill={accent} opacity={0.3} />
      <rect x={358} y={49} width={20} height={3} rx={1} fill={accent} opacity={0.2} />

      {/* Plant left */}
      <rect x={30} y={100} width={8} height={16} rx={2} fill="#8d6e63" />
      <ellipse cx={34} cy={98} rx={12} ry={10} fill="#2e7d32" />
      <ellipse cx={28} cy={94} rx={6} ry={8} fill="#388e3c" />
      <ellipse cx={40} cy={92} rx={7} ry={9} fill="#43a047" />

      {/* Desk */}
      <rect x={50} y={140} width={380} height={8} rx={3} fill="#5d4037" />
      <rect x={60} y={148} width={6} height={32} fill="#4e342e" />
      <rect x={414} y={148} width={6} height={32} fill="#4e342e" />

      {/* Monitors */}
      {[90, 170, 250, 330].map((mx, i) => (
        <g key={i}>
          <rect x={mx} y={110} width={40} height={28} rx={3} fill="#263238" />
          <rect x={mx + 3} y={113} width={34} height={22} rx={1} fill={accent} opacity={0.15} />
          <rect x={mx + 16} y={138} width={8} height={4} fill="#37474f" />
        </g>
      ))}

      {/* Lamp */}
      <rect x={440} y={90} width={3} height={50} fill="#ffd54f" />
      <ellipse cx={441} cy={88} rx={12} ry={6} fill="#ffd54f" opacity={0.8} />
      <ellipse cx={441} cy={86} rx={8} ry={3} fill="#fff9c4" opacity={0.5} />

      {/* Characters (seated) */}
      <Character {...chars[0]} x={72} y={82} seated animClass="" armAnim="anim-typing" headAnim="" />
      <Character {...chars[1]} x={152} y={82} seated armAnim="anim-coffee" headAnim="" />
      <Character {...chars[2]} x={232} y={82} seated armAnim="anim-celebrate" headAnim="" />
      <Character {...chars[3]} x={312} y={82} seated armAnim="" headAnim="anim-nod" />
      <Character {...chars[4]} x={382} y={82} seated armAnim="anim-point" headAnim="" flip />

      {/* Coffee cup on desk */}
      <rect x={195} y={130} width={8} height={10} rx={2} fill="#fff" opacity={0.7} />
      <path d="M203,133 Q208,135 203,139" fill="none" stroke="#fff" strokeWidth={0.8} opacity={0.5} />

      {/* Headphones on char 3 */}
      <path d="M320,86 Q316,78 320,80" fill="none" stroke="#444" strokeWidth={2} />
      <path d="M336,86 Q340,78 336,80" fill="none" stroke="#444" strokeWidth={2} />
      <path d="M320,80 Q328,72 336,80" fill="none" stroke="#444" strokeWidth={2.5} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene: Daily Standup                                               */
/* ------------------------------------------------------------------ */

function StandupScene({ accent }: { accent: string }) {
  const chars = useMemo(() => {
    const indices = [0, 1, 2, 3, 4];
    return indices.map((i) => ({
      skin: SKINS[(i + 2) % 5],
      shirt: SHIRTS[(i + 1) % 5],
      hair: HAIRS[(i + 3) % 5],
      pants: PANTS[(i + 1) % 5],
    }));
  }, []);

  return (
    <svg viewBox="0 0 480 240" style={{ width: '100%', maxWidth: 520, height: 'auto' }}>
      {/* Floor */}
      <rect x={0} y={200} width={480} height={40} fill="rgba(255,255,255,0.03)" rx={4} />

      {/* Wall clock */}
      <circle cx={420} cy={40} r={18} fill="#263238" />
      <circle cx={420} cy={40} r={15} fill="#37474f" />
      <circle cx={420} cy={40} r={1.5} fill="#fff" />
      <line x1={420} y1={40} x2={420} y2={30} stroke="#fff" strokeWidth={1.5} />
      <line x1={420} y1={40} x2={428} y2={38} stroke="#fff" strokeWidth={1} className="anim-clock" />
      {/* Clock numbers */}
      <text x={420} y={29} textAnchor="middle" fontSize={4} fill="#aaa">12</text>
      <text x={433} y={42} textAnchor="middle" fontSize={4} fill="#aaa">3</text>
      <text x={420} y={54} textAnchor="middle" fontSize={4} fill="#aaa">6</text>
      <text x={407} y={42} textAnchor="middle" fontSize={4} fill="#aaa">9</text>

      {/* Sticky notes board / easel */}
      <rect x={200} y={30} width={80} height={60} rx={3} fill="#fff" opacity={0.9} />
      {/* Easel legs */}
      <line x1={220} y1={90} x2={210} y2={130} stroke="#5d4037" strokeWidth={3} />
      <line x1={260} y1={90} x2={270} y2={130} stroke="#5d4037" strokeWidth={3} />
      {/* Sticky notes */}
      <rect x={208} y={38} width={18} height={16} rx={1} fill="#ffd54f" />
      <rect x={230} y={38} width={18} height={16} rx={1} fill="#81d4fa" />
      <rect x={252} y={38} width={18} height={16} rx={1} fill="#a5d6a7" />
      <rect x={208} y={58} width={18} height={16} rx={1} fill="#ef9a9a" />
      <rect x={230} y={58} width={18} height={16} rx={1} fill="#ce93d8" />
      <rect x={252} y={58} width={18} height={16} rx={1} fill="#ffcc80" />
      {/* Tiny lines on stickies */}
      {[212, 234, 256].map((sx, i) => (
        <g key={i}>
          <rect x={sx} y={42} width={10} height={1.5} rx={0.5} fill="rgba(0,0,0,0.15)" />
          <rect x={sx} y={46} width={7} height={1.5} rx={0.5} fill="rgba(0,0,0,0.1)" />
        </g>
      ))}

      {/* Characters (standing) */}
      <Character {...chars[0]} x={40} y={130} headAnim="anim-bounce" />
      <Character {...chars[1]} x={110} y={130} headAnim="anim-nod" />
      {/* Speaker */}
      <Character {...chars[2]} x={180} y={130} armAnim="anim-point" headAnim="anim-bounce" />
      <Character {...chars[3]} x={310} y={130} headAnim="anim-nod" />
      <Character {...chars[4]} x={380} y={130} armAnim="anim-celebrate" />

      {/* Speech bubble from speaker */}
      <g className="anim-float">
        <rect x={190} y={105} width={50} height={22} rx={8} fill="white" opacity={0.9} />
        <polygon points="205,127 210,127 200,135" fill="white" opacity={0.9} />
        <text x={215} y={119} textAnchor="middle" fontSize={8} fill={accent} fontWeight="bold">
          LGTM!
        </text>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene: Launch Day                                                  */
/* ------------------------------------------------------------------ */

function LaunchScene({ accent }: { accent: string }) {
  const chars = useMemo(() => {
    const indices = [0, 1, 2, 3, 4];
    return indices.map((i) => ({
      skin: SKINS[(i + 1) % 5],
      shirt: SHIRTS[(i + 3) % 5],
      hair: HAIRS[(i + 2) % 5],
      pants: PANTS[(i + 4) % 5],
    }));
  }, []);

  const confettiColors = ['#ffd54f', '#ef5350', '#42a5f5', '#66bb6a', '#ab47bc', accent];

  return (
    <svg viewBox="0 0 480 260" style={{ width: '100%', maxWidth: 520, height: 'auto' }}>
      {/* Stars */}
      {[
        [40, 20], [100, 35], [150, 10], [320, 15], [400, 30], [450, 12],
        [70, 50], [260, 25], [380, 50], [200, 5],
      ].map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r={1.2 + (i % 3) * 0.4} fill="#fff" opacity={0.3 + (i % 4) * 0.15} className="anim-twinkle" style={{ animationDelay: `${i * 0.3}s` }} />
      ))}

      {/* Floor / launch pad */}
      <rect x={0} y={220} width={480} height={40} fill="rgba(255,255,255,0.03)" rx={4} />
      <rect x={190} y={210} width={100} height={14} rx={4} fill="#37474f" />
      <rect x={210} y={206} width={60} height={6} rx={2} fill="#546e7a" />

      {/* Rocket */}
      <g className="anim-rocket">
        {/* Body */}
        <rect x={225} y={80} width={30} height={70} rx={6} fill="#eceff1" />
        {/* Nose cone */}
        <polygon points="240,50 225,90 255,90" fill={accent} />
        {/* Window */}
        <circle cx={240} cy={110} r={8} fill="#263238" />
        <circle cx={240} cy={110} r={5.5} fill="#4fc3f7" opacity={0.7} />
        {/* Fins */}
        <polygon points="225,140 210,160 225,155" fill={accent} opacity={0.8} />
        <polygon points="255,140 270,160 255,155" fill={accent} opacity={0.8} />
        {/* Flame — transform-origin anchored to flame center */}
        <g className="anim-flame" style={{ transformOrigin: '240px 170px' }}>
          <ellipse cx={240} cy={168} rx={10} ry={18} fill="#ff9800" opacity={0.9} />
          <ellipse cx={240} cy={172} rx={6} ry={14} fill="#ffd54f" opacity={0.8} />
          <ellipse cx={240} cy={175} rx={3} ry={10} fill="#fff" opacity={0.6} />
        </g>
      </g>

      {/* SHIPPED banner */}
      <g className="anim-float">
        <rect x={160} y={35} width={160} height={32} rx={6} fill={accent} />
        <text x={240} y={57} textAnchor="middle" fontSize={18} fill="#fff" fontWeight="bold" fontFamily="monospace">
          SHIPPED!
        </text>
      </g>

      {/* Confetti */}
      {Array.from({ length: 24 }).map((_, i) => {
        const cx = 40 + (i * 17.5) % 400;
        const cy = 20 + (i * 23) % 180;
        const color = confettiColors[i % confettiColors.length];
        const size = 2 + (i % 3);
        const rotation = (i * 37) % 360;
        return (
          <rect
            key={i}
            x={cx}
            y={cy}
            width={size}
            height={size * 0.5}
            rx={0.5}
            fill={color}
            opacity={0.6 + (i % 3) * 0.15}
            transform={`rotate(${rotation}, ${cx}, ${cy})`}
            className="anim-confetti"
            style={{ animationDelay: `${(i * 0.15) % 2}s` }}
          />
        );
      })}

      {/* Team cheering - left side */}
      <Character {...chars[0]} x={30} y={160} armAnim="anim-celebrate" headAnim="anim-bounce" />
      <Character {...chars[1]} x={90} y={155} armAnim="anim-celebrate" headAnim="anim-bounce" />

      {/* Team cheering - right side */}
      <Character {...chars[2]} x={340} y={155} armAnim="anim-celebrate" headAnim="anim-bounce" flip />
      <Character {...chars[3]} x={400} y={160} armAnim="anim-celebrate" headAnim="anim-bounce" flip />
      <Character {...chars[4]} x={140} y={162} armAnim="anim-celebrate" headAnim="anim-bounce" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  TERE Logo                                                          */
/* ------------------------------------------------------------------ */

function TereLogo({ accent }: { accent: string }) {
  const letters = ['T', 'E', 'R', 'E'];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
      {letters.map((letter, i) => (
        <span
          key={i}
          className="anim-letter-in"
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: '#fff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            animationDelay: `${i * 0.12}s`,
            animationFillMode: 'both',
            display: 'inline-block',
          }}
        >
          {letter}
        </span>
      ))}
      <span
        className="anim-badge-spring"
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: accent,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 6,
          padding: '2px 8px',
          marginLeft: 6,
          marginBottom: 8,
          display: 'inline-block',
          animationDelay: '0.6s',
          animationFillMode: 'both',
        }}
      >
        2.0
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CSS Keyframes (injected via style tag)                             */
/* ------------------------------------------------------------------ */

const KEYFRAMES_CSS = `
@keyframes typing {
  0%, 100% { transform: translateY(0); }
  25% { transform: translateY(-2px); }
  50% { transform: translateY(0); }
  75% { transform: translateY(-1px); }
}
@keyframes coffee {
  0%, 70%, 100% { transform: rotate(0deg); }
  30% { transform: rotate(-15deg) translateY(-3px); }
  50% { transform: rotate(-15deg) translateY(-3px); }
}
@keyframes celebrate {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(-10deg); }
  50% { transform: translateY(-4px) rotate(5deg); }
  75% { transform: translateY(-8px) rotate(-5deg); }
}
@keyframes nod {
  0%, 100% { transform: rotate(0deg); }
  30% { transform: rotate(5deg); }
  60% { transform: rotate(-3deg); }
}
@keyframes bounce-head {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@keyframes point {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(4px); }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
@keyframes rocket-launch {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes flame-flicker {
  0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.9; }
  33% { transform: scaleY(1.15) scaleX(0.9); opacity: 1; }
  66% { transform: scaleY(0.9) scaleX(1.1); opacity: 0.8; }
}
@keyframes confetti-fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
  100% { transform: translateY(30px) rotate(360deg); opacity: 0; }
}
@keyframes twinkle {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.9; }
}
@keyframes clock-tick {
  0% { transform: rotate(0deg); transform-origin: 420px 40px; }
  100% { transform: rotate(360deg); transform-origin: 420px 40px; }
}
@keyframes letter-in {
  0% { transform: translateY(24px); opacity: 0; }
  60% { transform: translateY(-4px); opacity: 1; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes badge-spring {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); opacity: 1; }
  80% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes tip-fade-in {
  0% { opacity: 0; transform: translateY(6px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes tip-fade-out {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-6px); }
}
.anim-typing { animation: typing 0.6s ease-in-out infinite; }
.anim-coffee { animation: coffee 2.5s ease-in-out infinite; }
.anim-celebrate { animation: celebrate 1s ease-in-out infinite; }
.anim-nod { animation: nod 1.8s ease-in-out infinite; }
.anim-bounce { animation: bounce-head 0.9s ease-in-out infinite; }
.anim-point { animation: point 1.2s ease-in-out infinite; }
.anim-float { animation: float 2.5s ease-in-out infinite; }
.anim-rocket { animation: rocket-launch 2s ease-in-out infinite; }
.anim-flame { animation: flame-flicker 0.4s ease-in-out infinite; }
.anim-confetti { animation: confetti-fall 2.5s ease-in-out infinite; }
.anim-twinkle { animation: twinkle 2s ease-in-out infinite; }
.anim-clock { animation: clock-tick 12s linear infinite; }
.anim-letter-in { animation: letter-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.anim-badge-spring { animation: badge-spring 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.anim-tip-in { animation: tip-fade-in 0.4s ease-out both; }
.anim-tip-out { animation: tip-fade-out 0.4s ease-in both; }
`;

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

interface LoadingScreenProps {
  onComplete: () => void;
  theme?: string;
}

export default function LoadingScreen({ onComplete, theme = 'void' }: LoadingScreenProps) {
  const colors = useMemo(() => getThemeColors(theme), [theme]);
  const [scene] = useState<SceneVariant>(() => SCENES[Math.floor(Math.random() * SCENES.length)]);

  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * FUN_TIPS.length));
  const [tipFading, setTipFading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [opacity, setOpacity] = useState(1);

  // Progress bar advancement
  useEffect(() => {
    if (progress >= 100) return;
    const timeout = setTimeout(() => {
      const increment = Math.random() * 8 + 2;
      setProgress((prev) => Math.min(prev + increment, 100));
    }, 200 + Math.random() * 300);
    return () => clearTimeout(timeout);
  }, [progress]);

  // Cycling tips
  useEffect(() => {
    const interval = setInterval(() => {
      setTipFading(true);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % FUN_TIPS.length);
        setTipFading(false);
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Fade-out and onComplete
  useEffect(() => {
    if (progress < 100 || fadeOut) return;
    const waitTimer = setTimeout(() => {
      setFadeOut(true);
      setOpacity(0);
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 600);
      return () => clearTimeout(completeTimer);
    }, 500);
    return () => clearTimeout(waitTimer);
  }, [progress, fadeOut, onComplete]);

  const renderScene = () => {
    switch (scene) {
      case 'desk':
        return <DeskScene accent={colors.accent} />;
      case 'standup':
        return <StandupScene accent={colors.accent} />;
      case 'launch':
        return <LaunchScene accent={colors.accent} />;
    }
  };

  const sceneLabel =
    scene === 'desk'
      ? 'The Office'
      : scene === 'standup'
        ? 'Daily Standup'
        : 'Launch Day';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${colors.bg1} 0%, ${colors.bg2} 100%)`,
          opacity,
          transition: fadeOut ? 'opacity 600ms ease-out' : 'none',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(${colors.gridColor} 1px, transparent 1px),
              linear-gradient(90deg, ${colors.gridColor} 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />

        {/* Accent glow */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.accentGlow} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Content container */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            padding: '0 24px',
            maxWidth: 580,
            width: '100%',
          }}
        >
          {/* Logo */}
          <TereLogo accent={colors.accent} />

          {/* Scene label */}
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 2,
              color: colors.accent,
              opacity: 0.7,
            }}
          >
            {sceneLabel}
          </span>

          {/* SVG Scene */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            {renderScene()}
          </div>

          {/* Fun tip */}
          <div
            style={{
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <p
              key={tipIndex}
              className={tipFading ? 'anim-tip-out' : 'anim-tip-in'}
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                lineHeight: 1.5,
                maxWidth: 420,
                margin: 0,
              }}
            >
              {FUN_TIPS[tipIndex]}
            </p>
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              maxWidth: 320,
              height: 3,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(progress, 100)}%`,
                background: colors.accent,
                borderRadius: 2,
                transition: 'width 300ms ease-out',
              }}
            />
          </div>

          {/* Progress text */}
          <span
            style={{
              fontSize: 11,
              color: colors.textSecondary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.round(Math.min(progress, 100))}%
          </span>

          {/* Tagline */}
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: colors.textSecondary,
              letterSpacing: 0.5,
              marginTop: 4,
            }}
          >
            Your team. Your data. Your vibe.
          </p>
        </div>
      </div>
    </>
  );
}
