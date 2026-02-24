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
      colors: {
        primary: '#011d4d',
        secondary: '#034078',
        accent: '#1282a2',
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
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
