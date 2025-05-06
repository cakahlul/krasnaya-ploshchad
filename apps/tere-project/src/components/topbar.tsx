'use client';

import {
  LockOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Menu, Space } from 'antd';

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const items = (
    <Menu>
      <Menu.Item key="password" icon={<LockOutlined />}>
        Change Password
      </Menu.Item>
      <Menu.Item key="logout" danger icon={<LogoutOutlined />}>
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
      <div className="hidden lg:block" /> {/* Left spacer on desktop */}
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
