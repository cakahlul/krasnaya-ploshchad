'use client';

import { useEffect, useState } from 'react';
import Sidebar from './sidebar';
import Topbar from './topbar';
import { getCurrentUser } from '@src/lib/auth';
import SignIn from './signIn';
import LoadingScreen from './loadingScreen';

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then(currentUser => {
      if (!currentUser) {
        setUser(null);
      } else {
        setUser(currentUser.email);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <SignIn />;
  }

  return (
    <div className="flex min-h-screen bg-white text-gray-800">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 bg-white">{children}</main>
        <footer className="bg-muted text-center text-sm py-1.5">
          Created by <strong>Esasjana</strong> © 2025
        </footer>
      </div>
    </div>
  );
}
