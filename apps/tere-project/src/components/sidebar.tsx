'use client';

import { useMemo, useState, type ComponentType } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  Blocks,
  Bug,
  CalendarDays,
  Gauge,
  KeyRound,
  LayoutDashboard,
  Settings2,
  Users,
} from 'lucide-react';
import { useMemberProfile } from '@src/features/dashboard/hooks/useMemberProfile';
import {
  CONFIG_TABS,
  DEFAULT_CONFIG_TAB,
  type ConfigTabId,
} from '@src/shared/constants/configuration-tabs';

interface NavItem {
  href: string;
  label: string;
  tone: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  leadOnly?: boolean;
  children?: { tab: ConfigTabId; label: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', tone: 'blue', icon: LayoutDashboard },
  { href: '/dashboard/reports', label: 'Team reports', tone: 'cyan', icon: BarChart3 },
  { href: '/dashboard/epic-explorer', label: 'Epic explorer', tone: 'violet', icon: Blocks },
  { href: '/dashboard/productivity-summary', label: 'Productivity', tone: 'green', icon: Gauge, leadOnly: true },
  { href: '/dashboard/bug-monitoring', label: 'Bug monitoring', tone: 'red', icon: Bug, leadOnly: true },
  { href: '/dashboard/talent-leave', label: 'Talent leave', tone: 'orange', icon: CalendarDays },
  { href: '/dashboard/team-members', label: 'Team members', tone: 'indigo', icon: Users, leadOnly: true },
  {
    href: '/dashboard/configuration',
    label: 'Configuration',
    tone: 'slate',
    icon: Settings2,
    leadOnly: true,
    children: CONFIG_TABS.map(tab => ({ tab: tab.id, label: tab.label })),
  },
  { href: '/dashboard/mcp-connection', label: 'MCP connection', tone: 'teal', icon: KeyRound },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { member } = useMemberProfile();
  const [configurationOpen, setConfigurationOpen] = useState(false);
  const activeTab = searchParams.get('tab') as ConfigTabId | null;
  const items = useMemo(
    () => NAV_ITEMS.filter(item => !item.leadOnly || member?.isLead),
    [member?.isLead],
  );

  const navigate = (href: string) => {
    setConfigurationOpen(false);
    router.push(href);
  };

  return (
    <aside className="mac-dock liquid-glass" aria-label="Primary navigation">
      <nav className="mac-dock-items">
        {items.map(item => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <div className="mac-dock-slot" key={item.href}>
              <button
                type="button"
                className={`mac-dock-item tone-${item.tone} ${active ? 'is-active' : ''}`}
                data-label={item.label}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                aria-expanded={item.children ? configurationOpen : undefined}
                onClick={() => item.children ? setConfigurationOpen(open => !open) : navigate(item.href)}
              >
                <span className="mac-dock-icon"><Icon size={24} strokeWidth={1.8} /></span>
              </button>

            </div>
          );
        })}
      </nav>

      {configurationOpen && (
        <div className="mac-dock-menu liquid-glass">
          <strong>Configuration</strong>
          {CONFIG_TABS.map(tab => {
            const active = pathname === '/dashboard/configuration'
              && (activeTab === tab.id || (!activeTab && tab.id === DEFAULT_CONFIG_TAB));
            return (
              <button
                type="button"
                key={tab.id}
                className={active ? 'is-active' : ''}
                onClick={() => navigate(`/dashboard/configuration?tab=${tab.id}`)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
