'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useMediaQuery } from 'react-responsive';
import { LayoutDashboard, MonitorCheck, Calendar, Bug } from 'lucide-react'; // Fun, clean icon set
import clsx from 'clsx';
import { useUserAccess } from '@src/hooks/useUserAccess';
import { useMemo } from 'react';

const menuItems = [
  {
    key: '/dashboard/reports',
    label: 'Team Reporting',
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ['Lead', 'Member'], // Both roles can access
  },
  {
    key: '/dashboard/bug-monitoring',
    label: 'Bug Monitoring',
    icon: <Bug className="w-5 h-5" />,
    roles: ['Lead'], // Only Lead can access
  },
  {
    key: '/dashboard/talent-leave',
    label: 'Talent Leave',
    icon: <Calendar className="w-5 h-5" />,
    roles: ['Lead', 'Member'], // Both roles can access
  },
];

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const isDesktop = useMediaQuery({ minWidth: 1024 });
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useUserAccess();

  // Filter menu items based on user role
  const filteredMenuItems = useMemo(() => {
    if (!role) return [];
    return menuItems.filter(item => item.roles.includes(role));
  }, [role]);

  const handleClick = (path: string) => {
    router.push(path);
    if (!isDesktop) onClose();
  };

  const SidebarContent = () => (
    <div className="min-h-screen w-64 bg-gradient-to-b from-primary to-accent text-white p-4 space-y-8 shadow-lg">
      <h1 className="text-2xl font-bold mb-4">📊 Team Reporting</h1>
      <nav className="flex flex-col space-y-2">
        {filteredMenuItems.map(item => (
          <button
            key={item.key}
            onClick={() => handleClick(item.key)}
            className={clsx(
              'flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-left',
              pathname === item.key
                ? 'bg-white text-primary font-semibold shadow'
                : 'hover:bg-white/10 hover:translate-x-1',
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );

  if (isDesktop) return <SidebarContent />;

  return (
    <>
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 bg-secondary',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarContent />
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
    </>
  );
}
