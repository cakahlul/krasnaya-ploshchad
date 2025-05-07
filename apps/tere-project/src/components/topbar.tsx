'use client';

import {
  LockOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { logout } from '@src/lib/auth';
import { Avatar, Dropdown, Menu, Space } from 'antd';

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      alert(error);
    }
  };

  const items = (
    <Menu>
      <Menu.Item key="password" icon={<LockOutlined />}>
        Change Password
      </Menu.Item>
      <Menu.Item
        key="logout"
        onClick={handleLogout}
        danger
        icon={<LogoutOutlined />}
      >
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <header className="flex justify-between items-center px-4 py-4 shadow-sm bg-stone-100">
      {/* Mobile menu icon */}
      <div className="lg:hidden">
        <MenuOutlined
          className="text-xl cursor-pointer"
          onClick={onMenuClick}
        />
      </div>
      <div className="hidden lg:block" />
      <Space size="large">
        <Dropdown overlay={items} trigger={['click']}>
          <Avatar
            style={{ backgroundColor: '#63372c', cursor: 'pointer' }}
            icon={<UserOutlined />}
          />
        </Dropdown>
      </Space>
    </header>
  );
}
