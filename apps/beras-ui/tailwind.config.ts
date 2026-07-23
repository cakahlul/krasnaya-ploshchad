import type { Config } from 'tailwindcss';

const config: Config = {
  content: {
    relative: true,
    files: ['./src/**/*.{ts,tsx,mdx}'],
  },
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
