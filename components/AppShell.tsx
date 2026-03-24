'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname === '/login' || pathname === '/landing';

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 flex flex-col" style={{ marginLeft: '256px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}