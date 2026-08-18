'use client';

import { LogOut, Search, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { Dropdown, message, type MenuProps } from 'antd';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import useUser from '@src/hooks/useUser';
import { useMemberProfile } from '@src/features/dashboard/hooks/useMemberProfile';
import GlobalSearch from '@src/features/dashboard/components/GlobalSearch';
import { logout } from '@src/lib/auth';
import { isSpotlightShortcut } from './spotlight-shortcut';
import { ThemeToggle } from './ThemeToggle';

const TITLES: Record<string, string> = {
  dashboard: 'Overview',
  reports: 'Team reports',
  'epic-explorer': 'Epic explorer',
  'productivity-summary': 'Productivity',
  'bug-monitoring': 'Bug monitoring',
  'talent-leave': 'Talent leave',
  'team-members': 'Team members',
  configuration: 'Configuration',
  'mcp-connection': 'MCP connection',
};

export default function Topbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const { member } = useMemberProfile();
  const { getDisplayName, getUserPhoto, setLoginPageMessage } = useUser();
  const title = TITLES[pathname.split('/').filter(Boolean).at(-1) ?? 'dashboard'] ?? 'Overview';
  const name = member?.name || getDisplayName() || 'User';
  const photo = getUserPhoto();
  const date = useMemo(() => new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date()), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isSpotlightShortcut(event)) {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const frame = requestAnimationFrame(() => window.dispatchEvent(new Event('tere:search')));
    return () => cancelAnimationFrame(frame);
  }, [searchOpen]);

  const menu: MenuProps = {
    items: [
      { key: 'security', icon: <ShieldCheck size={15} />, label: 'Account security' },
      { type: 'divider' },
      { key: 'logout', icon: <LogOut size={15} />, label: 'Sign out', danger: true },
    ],
    onClick: async ({ key }) => {
      if (key !== 'logout') return message.info('Account security is managed by your identity provider.');
      await logout();
      setLoginPageMessage('Signed out successfully.');
    },
  };

  return (
    <>
      <header className="mac-toolbar" aria-label="Page toolbar">
        <div className="toolbar-leading liquid-group">
          <div className="toolbar-title"><strong>{title}</strong><span>{date}</span></div>
        </div>

        <button
          type="button"
          className="toolbar-search liquid-glass"
          aria-label="Search TERE"
          aria-haspopup="dialog"
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen(true)}
        >
          <Search size={15} />
          <span>Search</span>
          <kbd>⌘ K</kbd>
        </button>

        <div className="toolbar-trailing liquid-group">
          <ThemeToggle />
          <Dropdown menu={menu} trigger={['click']} placement="bottomRight">
            <button type="button" className="profile-button" aria-label="Account menu">
              {photo ? <Image src={photo} alt="" width={30} height={30} /> : <span>{name.charAt(0).toUpperCase()}</span>}
              <span className="profile-copy">
                <strong>{name.split(' ')[0]}</strong>
                <small>{member?.isLead ? 'Team lead' : 'Member'}</small>
              </span>
            </button>
          </Dropdown>
        </div>
      </header>

      {searchOpen && (
        <div className="spotlight-backdrop" onMouseDown={() => setSearchOpen(false)}>
          <section
            className="spotlight-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Search TERE"
            onMouseDown={event => event.stopPropagation()}
          >
            <GlobalSearch />
            <span className="spotlight-hint"><kbd>Esc</kbd> to close</span>
          </section>
        </div>
      )}
    </>
  );
}
