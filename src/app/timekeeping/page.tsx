'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Search, 
  ShieldCheck, 
  Cpu, 
  RefreshCw, 
  Lock,
  ExternalLink,
  ArrowRight,
  Database,
  Calendar,
  Settings,
  HardDrive
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

interface Employee {
  id: string;
  name: string;
  position: string;
}

interface AttendanceLog {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'IN' | 'OUT';
  timestamp: string;
  device: string;
}

const MOCK_EMPLOYEES: Employee[] = [
  { id: 'EMP-001', name: 'Adam Roy', position: 'Principal Engineer' },
  { id: 'EMP-002', name: 'Maria Santos', position: 'HR Manager' },
  { id: 'EMP-003', name: 'Devon Lane', position: 'Senior Frontend Dev' },
  { id: 'EMP-004', name: 'Sarah Jenkins', position: 'Growth Lead' },
];

const INITIAL_ATTENDANCE: AttendanceLog[] = [
  { id: 'LOG-101', employeeId: 'EMP-001', employeeName: 'Adam Roy', type: 'IN', timestamp: '2026-06-04T08:02:11', device: 'ZKTeco K14 Edge-01' },
  { id: 'LOG-102', employeeId: 'EMP-002', employeeName: 'Maria Santos', type: 'IN', timestamp: '2026-06-04T08:15:34', device: 'ZKTeco K14 Edge-01' },
  { id: 'LOG-103', employeeId: 'EMP-004', employeeName: 'Sarah Jenkins', type: 'IN', timestamp: '2026-06-04T08:24:55', device: 'ZKTeco K14 Edge-02' },
  { id: 'LOG-104', employeeId: 'EMP-005', employeeName: 'Ronald Richards', type: 'IN', timestamp: '2026-06-04T08:30:02', device: 'ZKTeco K14 Edge-01' },
  { id: 'LOG-105', employeeId: 'EMP-001', employeeName: 'Adam Roy', type: 'OUT', timestamp: '2026-06-04T17:05:40', device: 'ZKTeco K14 Edge-01' },
];

export default function TimekeepingDashboard() {
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [attendance, setAttendance] = useState<AttendanceLog[]>(INITIAL_ATTENDANCE);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deviceOnline, setDeviceOnline] = useState(true);

  const [activeTab, setActiveTab] = useState('Terminal Logs');
  const tabs = ['Terminal Logs', 'Shifts', 'Holidays', 'Advanced'];

  useEffect(() => {
    fetch('/api/system/license')
      .then(res => res.json())
      .then(data => {
        if (data.activeModules) {
          setActiveModules(data.activeModules);
        }
      })
      .catch(err => console.error("Failed to load license details", err));
  }, []);

  const isTimekeepingLicensed = activeModules.includes('TIMEKEEPING');

  const triggerDeviceSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const timeIn = new Date().toISOString().replace('Z', '').split('.')[0];
      const newPunch: AttendanceLog = {
        id: `LOG-${Math.floor(Math.random() * 900 + 100)}`,
        employeeId: 'EMP-002',
        employeeName: 'Maria Santos',
        type: 'OUT',
        timestamp: timeIn,
        device: 'ZKTeco K14 Edge-01'
      };
      setAttendance(prev => [newPunch, ...prev]);
      setIsSyncing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans pb-12">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-white border-b border-slate-200 px-6 py-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center justify-center w-7 h-7 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
            <Clock className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Link href="/" className="hover:text-slate-800">ABCD ERP System</Link>
            <span className="text-slate-350">/</span>
            <span className="text-slate-800">Timekeeping</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <Link href="/core" className="hover:text-slate-800">Core Setup</Link>
            <Link href="/hris" className="hover:text-slate-800">HRIS</Link>
            <Link href="/timekeeping" className="text-indigo-600">Timekeeping</Link>
            <Link href="/payroll" className="hover:text-slate-800">Payroll</Link>
          </nav>
          
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64&q=80" alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Title & Short Description */}
      <div className="w-full px-6 mt-6 flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Timekeeping Dashboard</h2>
          <p className="text-xs text-slate-400 mt-0.5">Sync attendance timestamps from edge biometrics and manage shift configurations.</p>
        </div>
      </div>

      {/* Sub tabs list */}
      <div className="w-full px-6 bg-white border-b border-slate-200 flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === tab 
                ? 'text-slate-900 border-indigo-650 font-bold' 
                : 'text-slate-400 border-transparent hover:text-slate-650'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main content body */}
      <div className="w-full px-6 mt-6">
        {!isTimekeepingLicensed ? (
          <Card className="bg-white border-amber-200 rounded-xl p-8 text-center shadow-sm max-w-xl mx-auto space-y-4 mt-12">
            <div className="w-14 h-14 bg-amber-100 border border-amber-200 rounded-full flex items-center justify-center text-amber-600 mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-xl font-bold text-slate-900">Timekeeping Module Locked</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Your tenant license for **acme-corp** does not contain authorization for the biometric timekeeping synchronization module.
              </CardDescription>
            </div>
            <div className="pt-2">
              <Button className="bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center gap-2 mx-auto shadow-sm shadow-amber-600/10">
                Contact Sales to Upgrade
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            
            {/* TERMINAL LOGS TAB */}
            {activeTab === 'Terminal Logs' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="bg-white border-slate-200 shadow-xs lg:col-span-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-bold text-slate-700">ZKTeco Biometric SDK Integration</CardTitle>
                          <CardDescription className="text-xs text-slate-400">Edge Agent deployed via Tauri on Raspberry Pi 5</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${deviceOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          <span className="text-xs text-slate-500 font-semibold">{deviceOnline ? 'ZKTeco K14 Online' : 'Device Offline'}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/50 text-xs">
                          <span className="text-slate-400 block font-semibold">Active Templates</span>
                          <strong className="text-lg font-bold text-slate-800 mt-1 block">42 Fingerprints</strong>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/50 text-xs">
                          <span className="text-slate-400 block font-semibold">Unsynced Edge Logs</span>
                          <strong className="text-lg font-bold text-indigo-650 mt-1 block">0 Logs Pending</strong>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/50 text-xs">
                          <span className="text-slate-400 block font-semibold">FFI Binding</span>
                          <strong className="text-lg font-bold text-emerald-600 mt-1 block">Tauri Rust</strong>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-100 pt-4 text-xs">
                        <p className="text-slate-400 max-w-md leading-relaxed">
                          Fingerprint templates remain encrypted locally to guarantee compliance. Only timecard timestamps are uploaded.
                        </p>
                        <Button 
                          onClick={triggerDeviceSync} 
                          disabled={isSyncing} 
                          className="bg-indigo-600 hover:bg-indigo-505 text-white rounded-lg flex items-center gap-1.5 shadow-sm text-xs py-1.5 transition-all"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                          {isSyncing ? 'Syncing...' : 'Sync Raw Punches'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-slate-200 shadow-xs">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold text-slate-700">Edge Terminals Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-xs">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-slate-500">Local IP Bind</span>
                        <span className="font-mono text-slate-850">192.168.1.185</span>
                      </div>
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-slate-500">Firmware Build</span>
                        <span className="font-mono text-slate-850">v4.8.2-Tauri</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Audit Status</span>
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">Secure</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Attendance logs table */}
                <Card className="bg-white border-slate-200 shadow-xs overflow-hidden rounded-xl">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <CardTitle className="text-sm font-semibold text-slate-750">Real-Time Biometric Punch Logs</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-50/40 border-b border-slate-100">
                        <TableRow className="border-b border-slate-100 hover:bg-transparent">
                          <TableHead className="text-slate-500 font-semibold py-3 pl-6">Log ID</TableHead>
                          <TableHead className="text-slate-500 font-semibold py-3">Employee ID</TableHead>
                          <TableHead className="text-slate-500 font-semibold py-3">Employee Name</TableHead>
                          <TableHead className="text-slate-500 font-semibold py-3">Punch Type</TableHead>
                          <TableHead className="text-slate-500 font-semibold py-3">Timestamp</TableHead>
                          <TableHead className="text-slate-500 font-semibold py-3 pr-6">Source Terminal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendance.map((log) => (
                          <TableRow key={log.id} className="border-b border-slate-100 hover:bg-slate-50/30">
                            <TableCell className="font-mono text-xs text-slate-400 pl-6 py-3">{log.id}</TableCell>
                            <TableCell className="font-mono text-xs text-indigo-600 py-3">{log.employeeId}</TableCell>
                            <TableCell className="text-slate-850 font-semibold py-3">{log.employeeName}</TableCell>
                            <TableCell className="py-3">
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                                log.type === 'IN' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-500/10' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-500/10'
                              }`}>
                                {log.type}
                              </span>
                            </TableCell>
                            <TableCell className="text-slate-600 font-mono text-xs py-3">{log.timestamp.replace('T', ' ')}</TableCell>
                            <TableCell className="text-slate-505 text-xs py-3 pr-6">{log.device}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SHIFTS TAB */}
            {activeTab === 'Shifts' && (
              <div className="space-y-4 max-w-4xl">
                <Card className="bg-white border-slate-200 shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-650" />
                      Shift Assignments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {MOCK_EMPLOYEES.map(emp => (
                        <div key={emp.id} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                          <div>
                            <p className="font-semibold text-slate-800">{emp.name}</p>
                            <p className="text-[10px] text-slate-400">{emp.position}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 font-semibold border border-indigo-500/10">
                            Regular Shift (08:00 - 17:00)
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* HOLIDAYS TAB */}
            {activeTab === 'Holidays' && (
              <div className="max-w-4xl">
                <Card className="bg-white border-slate-200 shadow-xs p-8 text-center">
                  <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-slate-850">Holiday Calendar</h4>
                  <p className="text-xs text-slate-400 mt-1">Manage state holidays and auto-approved rest day rules.</p>
                </Card>
              </div>
            )}

            {/* ADVANCED TAB */}
            {activeTab === 'Advanced' && (
              <div className="max-w-4xl">
                <Card className="bg-white border-slate-200 shadow-xs p-8 text-center">
                  <HardDrive className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-slate-850">Tauri Hardware SDK settings</h4>
                  <p className="text-xs text-slate-400 mt-1">Configure serial ports, baud rate speeds, and SQLite cache size limits on edge hosts.</p>
                </Card>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
