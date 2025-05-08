'use client';

import { LockOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons';
import { logout } from '@src/lib/auth';
import { Dropdown, Space, Typography, message } from 'antd';
import type { MenuProps } from 'antd';
import useUser from '../hooks/useUser';
import { UserRound } from 'lucide-react';
import { useIsFetching } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const { Text } = Typography;

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { getUserEmail, setLoginPageMessage } = useUser();
  const handleLogout = async () => {
    try {
      await logout();
      setLoginPageMessage('✌️ Logged out! The keyboard misses you already.');
    } catch (error) {
      message.error('Logout failed');
      console.error(error);
    }
  };
  const isFetching = useIsFetching();
  const [greetings, setGreetings] = useState('Hey, you! 👋');

  useEffect(() => {
    if (isFetching) {
      setGreetings(`Be patient, ${getUserEmail()}.. ⏳`);
    } else {
      setGreetings(`Hey, ${getUserEmail() ?? 'User'}! 👋`);
    }
  }, [isFetching, getUserEmail]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      handleLogout();
    } else if (key === 'password') {
      message.info('Change password clicked');
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'password',
      icon: <LockOutlined />,
      label: 'Change Password',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  return (
    <header className="flex justify-between items-center px-4 py-4 shadow-sm bg-white/60 backdrop-blur-md">
      <div className="lg:hidden">
        <MenuOutlined
          className="text-xl cursor-pointer"
          onClick={onMenuClick}
        />
      </div>
      <div className="hidden lg:block" />
      <Space size="middle">
        <Text className="font-medium text-base text-gray-800 animate-slot-in">
          {greetings}
        </Text>
        <Dropdown
          menu={{ items: menuItems, onClick: handleMenuClick }}
          trigger={['click']}
        >
          <button
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white hover:animate-bounce-up-down shadow-md cursor-pointer transition-transform"
            title="Account options"
          >
            <UserRound className="w-5 h-5" />
          </button>
        </Dropdown>
      </Space>
    </header>
  );
}
