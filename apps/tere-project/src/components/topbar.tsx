'use client';

import {
  LockOutlined,
  LogoutOutlined,
  SettingOutlined,
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
    <header className="flex justify-between items-center px-4 py-4 shadow-sm bg-white border-b">
      {/* Mobile menu icon */}
      <div className="lg:hidden">
        <MenuOutlined
          className="text-xl cursor-pointer"
          onClick={onMenuClick}
        />
      </div>
      <div className="hidden lg:block" /> {/* Left spacer on desktop */}
      <Space size="large">
        <SettingOutlined className="text-xl text-[#1282A2] cursor-pointer" />
        <Dropdown overlay={items} trigger={['click']}>
          <Avatar
            size="large"
            className="bg-[#63372C] cursor-pointer"
            icon={<UserOutlined />}
          />
        </Dropdown>
      </Space>
    </header>
  );
}
