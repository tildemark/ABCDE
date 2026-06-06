'use client';

import React, { useState, Suspense } from 'react';
import {
  Users,
  Clock,
  CircleDollarSign,
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  HelpCircle,
  Cpu,
  Building2,
  LayoutGrid,
  Sliders,
  Database,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export default function Sidebar() {
  return (
    <Suspense fallback={<div className="w-60 bg-white border-r border-slate-200 shrink-0"></div>}>
      <SidebarContent />
    </Suspense>
  );
}

function SidebarContent() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get('section') || 'company';

  const menuItems = [
    { name: 'Core Setup', href: '/core', icon: Settings },
    { name: 'HRIS Directory', href: '/hris', icon: Users },
    { name: 'Timekeeping', href: '/timekeeping', icon: Clock },
    { name: 'Payroll', href: '/payroll', icon: CircleDollarSign },
  ];

  const coreSubItems = [
    { name: 'Company Setup', href: '/core?section=company', key: 'company', icon: Building2 },
    { name: 'Users', href: '/core?section=users', key: 'users', icon: Users },
    { name: 'Roles & Permissions', href: '/core?section=roles', key: 'roles', icon: ShieldCheck },
    { name: 'General Settings', href: '/core?section=settings', key: 'settings', icon: Sliders },
    { name: 'Data Privacy', href: '/core?section=privacy', key: 'privacy', icon: ShieldAlert },
    { name: 'Workflows', href: '/core?section=workflows', key: 'workflows', icon: Cpu },
    { name: 'Audit Logs', href: '/core?section=logs', key: 'logs', icon: Database },
    { name: 'Licensing', href: '/core?section=licensing', key: 'licensing', icon: ShieldCheck },
  ];

  return (
    <div
      className={`h-screen bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-all duration-350 ${isCollapsed ? 'w-16' : 'w-60'
        }`}
    >
      <div className="flex flex-col">
        {/* Top Header */}
        <div className={`p-4 flex items-center border-b border-slate-100 ${isCollapsed ? 'justify-center' : 'gap-3'
          }`}>
          <div className="flex items-center justify-center w-8 h-8 rounded bg-slate-900 text-white font-extrabold text-sm shrink-0">
            A
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm text-slate-900 truncate">ABCD ERP System</h2>
              <p className="text-[10px] text-slate-400 font-medium truncate">acme-corp</p>
            </div>
          )}
        </div>

        {/* Search command bar */}
        {!isCollapsed && (
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search (Ctrl + K)"
                disabled
                className="w-full bg-slate-100/60 border border-slate-200/50 rounded-md py-1 pl-8 pr-3 text-[11px] text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        )}

        {/* Navigation Menu Links */}
        <nav className="p-2 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <React.Fragment key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-all ${isActive
                    ? 'bg-slate-100 text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-650' : 'text-slate-400'}`} />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>

                {/* Render Core submodules if active & not collapsed */}
                {item.name === 'Core Setup' && isActive && !isCollapsed && (
                  <div className="pl-4 pr-1 py-0.5 space-y-0.5 border-l border-slate-200 ml-5 mt-1 mb-2 flex flex-col">
                    {coreSubItems.map((sub) => {
                      const isSubActive = activeSection === sub.key;
                      const SubIcon = sub.icon;
                      return (
                        <React.Fragment key={sub.name}>
                          <Link
                            href={sub.href}
                            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[11px] font-semibold transition-all ${isSubActive
                              ? 'bg-indigo-50 text-indigo-700 shadow-3xs'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-755'
                              }`}
                          >
                            <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <span>{sub.name}</span>
                          </Link>
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Bottom widgets */}
      <div className="flex flex-col border-t border-slate-100">
        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex items-center gap-3 px-5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 border-b border-slate-100 transition-all cursor-pointer ${isCollapsed ? 'justify-center' : ''
            }`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-450" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 text-slate-450" />
              <span>Collapse</span>
            </>
          )}
        </button>

        {/* User profile card */}
        <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'
          }`}>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64&q=80"
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-800 truncate">Karen Marites</h4>
              <p className="text-[9px] text-slate-450 font-mono truncate">karen@marites.group</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
