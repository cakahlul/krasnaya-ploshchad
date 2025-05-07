'use client';

import { Menu, Drawer } from 'antd';
import { TeamOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { usePathname, useRouter } from 'next/navigation';

const items = [
  {
    key: '/dashboard/reports',
    icon: <TeamOutlined />,
    label: 'Team Reporting',
  },
  {
    key: '/dashboard/monitoring',
    icon: <AppstoreOutlined />,
    label: 'Application Monitoring',
  },
];

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const isDesktop = useMediaQuery({ minWidth: 1024 }); // Tailwind lg
  const pathname = usePathname();
  const router = useRouter();

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
    if (!isDesktop) onClose();
  };

  const sidebarContent = (
    <div className="w-64 bg-secondary text-white p-4">
      <div className="text-2xl font-bold mb-6">📊 Team Reporting</div>
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        onClick={handleMenuClick}
        items={items}
        className="bg-transparent text-white custom-menu"
      />
    </div>
  );

  if (isDesktop) {
    return sidebarContent;
  }

  return (
    <Drawer
      placement="left"
      closable={false}
      onClose={onClose}
      open={isOpen}
      width={260}
      styles={{ body: { padding: 0, backgroundColor: 'secondary' } }}
    >
      {sidebarContent}
    </Drawer>
  );
}
