'use client';

import {
  LockOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { logout } from '@src/lib/auth';
import { Avatar, Dropdown, Space, Typography, message } from 'antd';
import type { MenuProps } from 'antd';
import useUser from '../hooks/useUser';

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

  const getGreeting = () => {
    return `Hey, ${getUserEmail()}! 👋`;
  };

  return (
    <header className="flex justify-between items-center px-4 py-4 shadow-sm bg-stone-100">
      <div className="lg:hidden">
        <MenuOutlined
          className="text-xl cursor-pointer"
          onClick={onMenuClick}
        />
      </div>
      <div className="hidden lg:block" />
      <Space size="middle">
        <Text className="font-medium text-base text-gray-800">
          {getGreeting()}
        </Text>
        <Dropdown
          menu={{ items: menuItems, onClick: handleMenuClick }}
          trigger={['click']}
        >
          <Avatar
            style={{ backgroundColor: '#63372c', cursor: 'pointer' }}
            icon={<UserOutlined />}
          />
        </Dropdown>
      </Space>
    </header>
  );
}
