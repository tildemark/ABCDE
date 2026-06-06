'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CircleDollarSign, 
  Cpu, 
  ShieldCheck, 
  Lock, 
  ArrowRight,
  ExternalLink,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function UnifiedGateway() {
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [licenseStatus, setLicenseStatus] = useState<string>('Verifying...');

  useEffect(() => {
    fetch('/api/system/license')
      .then(res => res.json())
      .then(data => {
        if (data.activeModules) {
          setActiveModules(data.activeModules);
          setLicenseStatus('Verified');
        } else {
          setLicenseStatus('Invalid/Error');
        }
      })
      .catch(() => {
        setLicenseStatus('Error loading license');
      });
  }, []);

  const isTimekeepingLicensed = activeModules.includes('TIMEKEEPING');
  const isPayrollLicensed = activeModules.includes('PAYROLL');
  const isHrisLicensed = activeModules.includes('HUMAN_RESOURCES');

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans p-6 md:p-12">
      {/* Background decor */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-550/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8 mb-12">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 text-white font-extrabold text-lg">
            A
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              ABCD ERP System
            </h1>
            <p className="text-sm text-slate-500">All Business Centralized Data ERP System</p>
          </div>
        </div>

        {/* License Verification Badge */}
        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-550/20 text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                License: {licenseStatus}
              </span>
              <span className="text-xs text-slate-450 font-mono">acme-corp</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active Modules: <strong className="text-slate-700">{activeModules.join(', ') || 'None'}</strong>
            </p>
          </div>
        </div>
      </header>

      {/* Main Module Selection Grid */}
      <main className="space-y-8 w-full max-w-7xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Select Application Module</h2>
          <p className="text-xs text-slate-505">Navigate to your permitted administrative workspaces below.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {/* Card 1: Core Setup */}
          <Link href="/core" className="group">
            <Card className="bg-white border-slate-250 hover:border-indigo-500 transition-all duration-200 h-full shadow-2xs group-hover:shadow-md cursor-pointer flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-555/5 text-indigo-650 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Settings className="w-5 h-5" />
                </span>
                <div>
                  <CardTitle className="text-base font-bold text-slate-800">Core Setup & Settings</CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-1">
                    Configure company metadata, currency, regional settings, and check licensing status.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0 border-t border-slate-50 mt-4 flex items-center justify-between text-xs font-semibold text-indigo-600">
                <span>Enter Settings</span>
                <ArrowRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1.5 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          {/* Card 2: HRIS Directory */}
          <Link href="/hris" className="group">
            <Card className="bg-white border-slate-250 hover:border-indigo-500 transition-all duration-200 h-full shadow-2xs group-hover:shadow-md cursor-pointer flex flex-col justify-between relative">
              {!isHrisLicensed && (
                <span className="absolute top-4 right-4 bg-amber-50 text-amber-700 p-1.5 rounded-full border border-amber-500/20">
                  <Lock className="w-3.5 h-3.5" />
                </span>
              )}
              <CardHeader className="space-y-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-555/5 text-indigo-650 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </span>
                <div>
                  <CardTitle className="text-base font-bold text-slate-800">HRIS Directory</CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-1">
                    Manage organizational structures, branch offices, and detailed employee roster profiles.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0 border-t border-slate-50 mt-4 flex items-center justify-between text-xs font-semibold text-indigo-600">
                <span>{isHrisLicensed ? 'Enter Directory' : 'Request Upgrade'}</span>
                <ArrowRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1.5 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          {/* Card 3: Timekeeping */}
          <Link href="/timekeeping" className="group">
            <Card className="bg-white border-slate-250 hover:border-indigo-500 transition-all duration-200 h-full shadow-2xs group-hover:shadow-md cursor-pointer flex flex-col justify-between relative">
              {!isTimekeepingLicensed && (
                <span className="absolute top-4 right-4 bg-amber-50 text-amber-700 p-1.5 rounded-full border border-amber-500/20">
                  <Lock className="w-3.5 h-3.5" />
                </span>
              )}
              <CardHeader className="space-y-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-555/5 text-indigo-650 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Clock className="w-5 h-5" />
                </span>
                <div>
                  <CardTitle className="text-base font-bold text-slate-800">Timekeeping & Biometrics</CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-1">
                    Sync attendance timestamps from edge ZKTeco terminals and configure worker shift schedules.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0 border-t border-slate-50 mt-4 flex items-center justify-between text-xs font-semibold text-indigo-600">
                <span>{isTimekeepingLicensed ? 'Enter Timekeeping' : 'Request Upgrade'}</span>
                <ArrowRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1.5 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          {/* Card 4: Payroll */}
          <Link href="/payroll" className="group">
            <Card className="bg-white border-slate-250 hover:border-indigo-500 transition-all duration-200 h-full shadow-2xs group-hover:shadow-md cursor-pointer flex flex-col justify-between relative">
              {!isPayrollLicensed && (
                <span className="absolute top-4 right-4 bg-amber-50 text-amber-700 p-1.5 rounded-full border border-amber-500/20">
                  <Lock className="w-3.5 h-3.5" />
                </span>
              )}
              <CardHeader className="space-y-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-555/5 text-indigo-650 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <CircleDollarSign className="w-5 h-5" />
                </span>
                <div>
                  <CardTitle className="text-base font-bold text-slate-800">Payroll & Ledger</CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-1">
                    Process Philippine statutory deductions and generate compliant payslips.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0 border-t border-slate-50 mt-4 flex items-center justify-between text-xs font-semibold text-indigo-600">
                <span>{isPayrollLicensed ? 'Enter Payroll' : 'Request Upgrade'}</span>
                <ArrowRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1.5 transition-transform" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
