'use client';

import { useEffect, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import {
  SmileOutlined,
  CoffeeOutlined,
  FireOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  CloudOutlined,
  LoadingOutlined,
  GiftOutlined,
  ApiOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Progress } from 'antd';

const iconSet = [
  <SmileOutlined key="smile" className="text-3xl text-white" />,
  <CoffeeOutlined key="coffee" className="text-3xl text-white" />,
  <FireOutlined key="fire" className="text-3xl text-white" />,
  <RocketOutlined key="rocket" className="text-3xl text-white" />,
  <ThunderboltOutlined key="bolt" className="text-3xl text-white" />,
  <CloudOutlined key="cloud" className="text-3xl text-white" />,
  <LoadingOutlined key="loading" className="text-3xl text-white" />,
  <GiftOutlined key="gift" className="text-3xl text-white" />,
  <ApiOutlined key="api" className="text-3xl text-white" />,
  <ToolOutlined key="tool" className="text-3xl text-white" />,
];

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

export default function LoadingBar() {
  const isFetching = useIsFetching();
  const [visible, setVisible] = useState(false);
  const [currentIcons, setCurrentIcons] = useState(iconSet.slice(0, 3));
  const [animatedIndex, setAnimatedIndex] = useState<number | null>(null);
  const [message, setMessage] = useState(messages[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isFetching > 0) setVisible(true);
  }, [isFetching]);

  useEffect(() => {
    const iconInterval = setInterval(() => {
      const indexToChange = Math.floor(Math.random() * 3);
      let newIcon;
      do {
        newIcon = iconSet[Math.floor(Math.random() * iconSet.length)];
      } while (newIcon.key === currentIcons[indexToChange].key);

      const updatedIcons = [...currentIcons];
      updatedIcons[indexToChange] = newIcon;
      setCurrentIcons(updatedIcons);
      setAnimatedIndex(indexToChange);
      setTimeout(() => setAnimatedIndex(null), 400);
    }, 500);

    const messageInterval = setInterval(() => {
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 500);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (isFetching > 0 && prev < 100) {
          return prev + Math.floor(Math.random() * 25);
        } else if (isFetching === 0 && prev < 100) {
          return prev + (100 - prev);
        } else {
          return prev;
        }
      });
    }, 500);

    if (isFetching === 0 && progress >= 100) {
      // Hide after short delay when fetching is done
      const hideTimeout = setTimeout(() => {
        setProgress(99);
        setVisible(false);
      }, 1000);
      return () => clearTimeout(hideTimeout);
    }

    return () => {
      clearInterval(iconInterval);
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [isFetching, visible, currentIcons, progress]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-white/20">
      <div className="flex flex-col items-center justify-center text-center space-y-4 w-[300px]">
        <div className="flex justify-center gap-4">
          {currentIcons.map((icon, idx) => {
            const isAnimating = animatedIndex === idx;
            const uniqueKey = isAnimating
              ? `${icon.key}-${Date.now()}`
              : `${icon.key}-${idx}`;

            return (
              <div
                key={uniqueKey}
                className={isAnimating ? 'animate-slot-in' : ''}
              >
                {icon}
              </div>
            );
          })}
        </div>

        <div className="text-primary text-sm font-medium">{message}</div>

        <Progress
          percent={progress}
          showInfo={false}
          strokeColor="bg-primary"
          trailColor="rgba(255,255,255,0.2)"
        />
      </div>
    </div>
  );
}
