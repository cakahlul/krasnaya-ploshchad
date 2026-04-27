import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'Space Grotesk', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'IBM Plex Mono', 'monospace'],
      },
      colors: {
        primary: '#011d4d',
        secondary: '#034078',
        accent: '#1282a2',
        'accent-light': '#22b8d4',
        muted: '#e4dfda',
        darkBrown: '#63372c',
        card: '#ffffff',
        'primary-brand': '#0f4c81',
        'primary-hover': '#0a3a63',
        'background-light': '#f8f9fa',
        'background-dark': '#111827',
        'card-light': '#ffffff',
        'card-dark': '#1f2937',
        'input-border-light': '#e5e7eb',
        'input-border-dark': '#374151',
        'text-main-light': '#1f2937',
        'text-main-dark': '#f9fafb',
        'text-sub-light': '#6b7280',
        'text-sub-dark': '#9ca3af',
        // TERE 2.0 theme colors
        'tere-page': '#f2f4f9',
        'tere-card': '#ffffff',
        'tere-navy': '#011d4d',
        'tere-void-bg': '#080f1e',
        'tere-void-card': '#101e32',
        'tere-crimson': '#e53935',
        'tere-crimson-light': '#ff6659',
      },
      animation: {
        'bounce-up-down': 'bounce-up-down 0.4s ease-in-out',
        'slide-up': 'slide-up 0.4s ease-in-out',
        'float-drop': 'floatDrop 1.2s ease-out forwards',
        'bounce-left-right': 'bounce-left-right 1s infinite',
        'fade-in': 'fade-in 0.4s ease-in-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        bounce: 'bounce 1s infinite',
        'slide-up-login': 'slideUpLogin 0.5s ease-out',
        'float-login': 'floatLogin 6s ease-in-out infinite',
        // TERE 2.0 animations
        'topbar-wave': 'topbarWave 2.5s ease-in-out infinite',
        'topbar-pulse': 'topbarPulse 2s ease-in-out infinite',
        'skel-shim': 'skelShim 1.2s ease-in-out infinite',
        'spin-it': 'spinIt 0.7s linear infinite',
        // Loading screen animations
        'ls-type': 'lsType 0.3s ease-in-out infinite',
        'ls-coffee': 'lsCoffee 2.5s ease-in-out infinite',
        'ls-nod': 'lsNod 1.5s ease-in-out infinite',
        'ls-nod-sm': 'lsNodSm 2s ease-in-out infinite',
        'ls-bounce': 'lsBounce 0.65s ease-in-out infinite',
        'ls-celeb-l': 'lsCelebL 0.65s ease-in-out infinite',
        'ls-celeb-r': 'lsCelebR 0.65s ease-in-out infinite',
        'ls-point': 'lsPoint 2s ease-in-out infinite',
        'ls-speak-l': 'lsSpeakL 1.2s ease-in-out infinite',
        'ls-speak-r': 'lsSpeakR 1.2s ease-in-out infinite',
        'ls-flame': 'lsFlame 0.15s ease-in-out infinite alternate',
        'ls-rocket': 'lsRocket 1.2s ease-in-out infinite',
        'ls-confetti': 'lsConfetti 1.5s ease-in infinite',
        'ls-star-twinkle': 'lsStarTwinkle 1.5s ease-in-out infinite',
      },
      keyframes: {
        'bounce-up-down': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8%)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '50%': { transform: 'translateY(-10%)', opacity: '1' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        floatDrop: {
          '0%': { transform: 'translateY(-100%) scale(0.8)', opacity: '0' },
          '50%': { transform: 'translateY(-40%) scale(1.2)', opacity: '1' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'bounce-left-right': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(6px)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        slideUpLogin: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        floatLogin: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        bounce: {
          '0%, 100%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8,0,1,1)',
          },
          '50%': {
            transform: 'none',
            animationTimingFunction: 'cubic-bezier(0,0,0.2,1)',
          },
        },
        // TERE 2.0 keyframes
        topbarWave: {
          '0%, 60%, 100%': { transform: 'rotate(0)' },
          '10%': { transform: 'rotate(14deg)' },
          '20%': { transform: 'rotate(-8deg)' },
          '30%': { transform: 'rotate(14deg)' },
          '40%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(10deg)' },
        },
        topbarPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.75)' },
        },
        skelShim: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        spinIt: {
          to: { transform: 'rotate(360deg)' },
        },
        // Loading screen keyframes
        lsType: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        lsCoffee: {
          '0%,60%,100%': { transform: 'rotate(0)' },
          '30%': { transform: 'rotate(-52deg)' },
        },
        lsNod: {
          '0%,100%': { transform: 'rotate(0)' },
          '50%': { transform: 'rotate(7deg)' },
        },
        lsNodSm: {
          '0%,100%': { transform: 'rotate(0)' },
          '50%': { transform: 'rotate(4deg)' },
        },
        lsBounce: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        lsCelebL: {
          '0%,100%': { transform: 'rotate(0)' },
          '50%': { transform: 'rotate(-38deg)' },
        },
        lsCelebR: {
          '0%,100%': { transform: 'rotate(0)' },
          '50%': { transform: 'rotate(38deg)' },
        },
        lsPoint: {
          '0%,100%': { transform: 'rotate(0)' },
          '50%': { transform: 'rotate(-35deg)' },
        },
        lsSpeakL: {
          '0%,100%': { transform: 'rotate(0)' },
          '50%': { transform: 'rotate(-25deg)' },
        },
        lsSpeakR: {
          '0%,100%': { transform: 'rotate(0)' },
          '50%': { transform: 'rotate(20deg)' },
        },
        lsFlame: {
          '0%': { transform: 'scaleX(1) scaleY(1)' },
          '100%': { transform: 'scaleX(0.75) scaleY(1.2)' },
        },
        lsRocket: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        lsConfetti: {
          '0%': { transform: 'translateY(0) rotate(0)' },
          '100%': { transform: 'translateY(220px) rotate(360deg)' },
        },
        lsStarTwinkle: {
          '0%,100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.5)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
