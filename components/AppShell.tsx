'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hideSidebar = pathname === '/login' || pathname === '/landing';

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:ml-64">
          {/* We'll pass setSidebarOpen down or handle toggle in TopBar if TopBar is inside children or separate */}
          {/* Note: TopBar is currently inside children in most pages or handled differently? */}
          {/* Let's check page structure in page.tsx */}
          {children}
        </div>
      </div>
    </div>
  );
}