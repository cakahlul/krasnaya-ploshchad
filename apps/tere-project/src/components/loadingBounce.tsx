'use client';

import { useEffect, useState } from 'react';
import {
  SmileOutlined,
  CoffeeOutlined,
  FireOutlined,
  RocketOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

const messages = [
  'Heating up the server oven...',
  'Rolling the dice of deployment...',
  'Brewing code coffee...',
  'Shaking the cloud...',
  'Feeding the AI hamsters...',
  'Typing semicolons manually...',
  'Refactoring the universe...',
  'Bouncing bits back into place...',
  'Summoning the front-end sorcery...',
  'Sweeping tech debt under the rug...',
];

const icons = [
  { key: 'smile', element: <SmileOutlined style={{ color: '#000' }} /> },
  { key: 'coffee', element: <CoffeeOutlined style={{ color: '#000' }} /> },
  { key: 'fire', element: <FireOutlined style={{ color: '#000' }} /> },
  { key: 'rocket', element: <RocketOutlined style={{ color: '#000' }} /> },
  { key: 'thunderbolt', element: <ThunderboltOutlined style={{ color: '#000' }} /> },
];

export default function LoadingBounce() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    setMessageIndex(Math.floor(Math.random() * messages.length));
    setIconIndex(Math.floor(Math.random() * icons.length));
  }, []);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 1500); // every 1.5 seconds

    const iconInterval = setInterval(() => {
      setIconIndex(prev => (prev + 1) % icons.length);
    }, 1500); // every 1.5 seconds

    return () => {
      clearInterval(messageInterval);
      clearInterval(iconInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg flex flex-col items-center justify-center z-50 space-y-4">
      <div className="text-4xl animate-bounce text-black">
        {icons[iconIndex].element}
      </div>
      <p className="text-lg text-primary font-semibold animate-pulse">
        {messages[messageIndex]}
      </p>
    </div>
  );
}
