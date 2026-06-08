'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  Users,
  User,
  Clock,
  CircleDollarSign,
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  Building2,
  Sliders,
  Database,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { mockUsers } from '@/lib/accessControlClient';

export default function Sidebar() {
  return (
    <Suspense fallback={<div className="w-60 bg-white border-r border-slate-200 shrink-0"></div>}>
      <SidebarContent />
    </Suspense>
  );
}

interface NavTab {
  id: string;
  name: string;
  level: string;
  path: string;
}

interface NavSubmodule {
  id: string;
  name: string;
  level: string;
  path: string;
  tabs: NavTab[];
}

interface NavModule {
  id: string;
  name: string;
  level: string;
  path: string;
  submodules: NavSubmodule[];
}

const iconMap: Record<string, any> = {
  'menu-core': Settings,
  'menu-hris': Users,
  'menu-payroll': CircleDollarSign,
  'menu-core-profile': User,
  'menu-core-company': Building2,
  'menu-core-users': Users,
  'menu-core-roles': ShieldCheck,
  'menu-core-settings': Sliders,
  'menu-core-privacy': ShieldAlert,
  'menu-core-workflows': Cpu,
  'menu-core-logs': Database,
  'menu-core-licensing': ShieldCheck,
  'menu-hris-employees': Users,
  'menu-payroll-salaries': Database
};

function SidebarContent() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [navigation, setNavigation] = useState<NavModule[]>([]);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandedSubmodules, setExpandedSubmodules] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Pick user dynamically to preview different hats (e.g. HR Manager vs HR Specialist vs Auditor)
  const currentUserId = searchParams.get('userId') || 'usr-super-admin';

  // Helper: check if a nav path (possibly with ?query) matches current location
  const isPathActive = (navPath: string): boolean => {
    if (navPath.includes('?')) {
      const [navBase, navQuery] = navPath.split('?');
      if (pathname !== navBase) return false;
      const navParams = new URLSearchParams(navQuery);
      return Array.from(navParams.entries()).every(([key, value]) => searchParams.get(key) === value);
    }
    return pathname === navPath || pathname.startsWith(navPath + '/');
  };

  // Helper: check if current path is under a module (even via query-param submodule)
  const isModuleActive = (mod: NavModule): boolean => {
    if (pathname.startsWith(mod.path)) return true;
    return mod.submodules.some(sub => isPathActive(sub.path) || sub.tabs.some(t => isPathActive(t.path)));
  };

  useEffect(() => {
    async function fetchNavigation() {
      try {
        const res = await fetch(`/api/system/navigation?userId=${currentUserId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setNavigation(data);
          
          // Auto-expand modules/submodules that contain current path
          const initialExpandedMods: Record<string, boolean> = {};
          const initialExpandedSubs: Record<string, boolean> = {};
          
          data.forEach((mod: NavModule) => {
            // Expand module if pathname matches its base path
            if (pathname.startsWith(mod.path)) {
              initialExpandedMods[mod.id] = true;
            }
            mod.submodules.forEach((sub: NavSubmodule) => {
              // Handle query-param submodule paths (e.g., /core?section=company)
              const subIsActive = sub.path.includes('?')
                ? (() => {
                    const [subBase] = sub.path.split('?');
                    return pathname === subBase || pathname.startsWith(subBase + '/');
                  })()
                : pathname.startsWith(sub.path);
              
              if (subIsActive) {
                initialExpandedMods[mod.id] = true;
                initialExpandedSubs[sub.id] = true;
              }
            });
          });
          
          setExpandedModules(prev => ({ ...initialExpandedMods, ...prev }));
          setExpandedSubmodules(prev => ({ ...initialExpandedSubs, ...prev }));
        }
      } catch (err) {
        console.error('Sidebar: Failed to fetch navigation hierarchy', err);
      }
    }
    fetchNavigation();
  }, [currentUserId, pathname, searchParams]);

  const toggleModule = (modId: string) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  const toggleSubmodule = (subId: string) => {
    setExpandedSubmodules(prev => ({ ...prev, [subId]: !prev[subId] }));
  };

  return (
    <div
      className={`h-screen bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-60'}`}
    >
      <div className="flex flex-col overflow-y-auto">
        {/* Top Header */}
        <div className={`p-4 flex items-center border-b border-slate-100 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="flex items-center justify-center w-8 h-8 rounded bg-slate-900 text-white font-extrabold text-sm shrink-0">
            A
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm text-slate-900 truncate">ABCD ERP</h2>
              <p className="text-[10px] text-slate-400 font-medium truncate">5-Pillar Refactored</p>
            </div>
          )}
        </div>


        {/* Navigation Menu Links */}
        <nav className="p-2 space-y-1.5">
          {navigation.map((mod) => {
            const isModActive = isModuleActive(mod);
            const isExpanded = expandedModules[mod.id];
            const Icon = iconMap[mod.id] || Settings;

            return (
              <div key={mod.id} className="space-y-1">
                {/* 1. MODULE LEVEL */}
                <div className="flex items-center justify-between">
                  <Link
                    href={mod.path}
                    className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all ${isModActive
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-605 hover:bg-slate-50 hover:text-slate-800'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? mod.name : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isModActive ? 'text-indigo-400' : 'text-slate-450'}`} />
                    {!isCollapsed && <span>{mod.name}</span>}
                  </Link>

                  {!isCollapsed && mod.submodules.length > 0 && (
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="p-1.5 hover:bg-slate-100 rounded-md transition-all text-slate-400"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>

                {/* 2. SUBMODULE LEVEL */}
                {!isCollapsed && isExpanded && mod.submodules.length > 0 && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l border-slate-100 ml-5 flex flex-col">
                    {mod.submodules.map((sub) => {
                      const isSubActive = isPathActive(sub.path);
                      const isSubExpanded = expandedSubmodules[sub.id];
                      const SubIcon = iconMap[sub.id] || Sliders;

                      return (
                        <div key={sub.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Link
                              href={sub.path}
                              className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded text-[11px] font-semibold transition-all ${
                                isSubActive
                                  ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-500'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                              }`}
                            >
                              <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                              <span>{sub.name}</span>
                            </Link>

                            {sub.tabs.length > 0 && (
                              <button
                                onClick={() => toggleSubmodule(sub.id)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400"
                              >
                                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isSubExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            )}
                          </div>

                          {/* 3. TAB LEVEL */}
                          {isSubExpanded && sub.tabs.length > 0 && (
                            <div className="pl-4 py-0.5 space-y-0.5 border-l border-slate-100 ml-3 flex flex-col">
                              {sub.tabs.map((tab) => {
                                const isTabActive = (() => {
                                 if (tab.path.includes('?')) {
                                   const [tabPathBase, tabPathQuery] = tab.path.split('?');
                                   if (pathname === tabPathBase) {
                                     const tabParams = new URLSearchParams(tabPathQuery);
                                     return Array.from(tabParams.entries()).every(([key, value]) => searchParams.get(key) === value);
                                   }
                                   return false;
                                 }
                                 return pathname === tab.path;
                                })();
                                return (
                                  <Link
                                    key={tab.id}
                                    href={tab.path}
                                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${isTabActive
                                      ? 'text-indigo-600 font-bold bg-indigo-50/50'
                                      : 'text-slate-400 hover:text-slate-650'
                                      }`}
                                  >
                                    • {tab.name}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom widgets */}
      <div className="flex flex-col border-t border-slate-100">
        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex items-center gap-3 px-5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 border-b border-slate-100 transition-all cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-450" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 text-slate-450" />
              <span>Collapse Menu</span>
            </>
          )}
        </button>

        {/* User profile card */}
        <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64&q=80"
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-800 truncate">
                {mockUsers.find(u => u.id === currentUserId)?.name || 'Unknown User'}
              </h4>
              <p className="text-[9px] text-slate-450 font-mono truncate">
                {mockUsers.find(u => u.id === currentUserId)?.email || 'karen@marites.group'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
