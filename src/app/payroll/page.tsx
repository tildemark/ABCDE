'use client';

import React, { useState, useEffect } from 'react';
import { 
  CircleDollarSign, 
  Search, 
  ShieldCheck, 
  Cpu, 
  FileText, 
  Upload, 
  Lock,
  ExternalLink,
  FileSpreadsheet,
  Settings,
  Scale
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Link from 'next/link';

interface Employee {
  id: string;
  name: string;
  position: string;
  dailyRate: number;
  hoursWorked: number;
}

const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'EMP-001', name: 'Adam Roy', position: 'Principal Engineer', dailyRate: 2500, hoursWorked: 88 },
  { id: 'EMP-002', name: 'Maria Santos', position: 'HR Manager', dailyRate: 1800, hoursWorked: 80 },
  { id: 'EMP-003', name: 'Devon Lane', position: 'Senior Frontend Dev', dailyRate: 1900, hoursWorked: 16 },
  { id: 'EMP-004', name: 'Sarah Jenkins', position: 'Growth Lead', dailyRate: 1500, hoursWorked: 80 },
  { id: 'EMP-005', name: 'Ronald Richards', position: 'Financial Analyst', dailyRate: 1600, hoursWorked: 84 },
];

function calculateStatutoryDeductions(grossPay: number) {
  let sss = grossPay * 0.045;
  if (sss > 1350) sss = 1350;

  let philhealth = grossPay * 0.025; 
  if (philhealth > 1600) philhealth = 1600;

  const pagibig = grossPay > 1500 ? 200 : 100;

  const totalStatutory = sss + philhealth + pagibig;
  const taxableIncome = grossPay - totalStatutory;
  
  let tax = 0;
  if (taxableIncome > 20833) {
    if (taxableIncome <= 33333) {
      tax = (taxableIncome - 20833) * 0.15;
    } else if (taxableIncome <= 66667) {
      tax = 1875 + (taxableIncome - 33333) * 0.20;
    } else {
      tax = 8542 + (taxableIncome - 66667) * 0.25;
    }
  }

  return { sss, philhealth, pagibig, tax };
}

export default function PayrollDashboard() {
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  
  const [csvFile, setCsvFile] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPayslipEmp, setSelectedPayslipEmp] = useState<Employee | null>(null);

  const [activeTab, setActiveTab] = useState('Salary Ledger');
  const tabs = ['Salary Ledger', 'CSV Imports', 'Compliance', 'Advanced'];

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

  const isPayrollLicensed = activeModules.includes('PAYROLL');

  const handleCsvImport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setTimeout(() => {
      setEmployees(prev => prev.map(emp => {
        return { ...emp, hoursWorked: emp.hoursWorked + 16 };
      }));
      setIsUploading(false);
      setCsvFile('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans pb-12">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-white border-b border-slate-200 px-6 py-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center justify-center w-7 h-7 rounded bg-indigo-50 text-indigo-650 hover:bg-indigo-100 transition-colors">
            <CircleDollarSign className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-slate-550 font-semibold">
            <Link href="/" className="hover:text-slate-800">ABCD ERP System</Link>
            <span className="text-slate-350">/</span>
            <span className="cursor-pointer hover:text-slate-800" onClick={() => setSelectedPayslipEmp(null)}>Payroll</span>
            {selectedPayslipEmp && (
              <>
                <span className="text-slate-350">/</span>
                <span className="text-slate-700 font-mono">{selectedPayslipEmp.id}</span>
              </>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <Link href="/core" className="hover:text-slate-800">Core Setup</Link>
            <Link href="/hris" className="hover:text-slate-800">HRIS</Link>
            <Link href="/timekeeping" className="hover:text-slate-800">Timekeeping</Link>
            <Link href="/payroll" className="text-indigo-600">Payroll</Link>
          </nav>
          
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64&q=80" alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Title & Short Description */}
      <div className="w-full px-6 mt-6 flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Payroll & statutory Computations</h2>
          <p className="text-xs text-slate-400 mt-0.5">Generate payslips, process statutory contributions, and import CSV manual overrides.</p>
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

      {/* Main Container */}
      <div className="w-full px-6 mt-6">
        {!isPayrollLicensed ? (
          <Card className="bg-white border-amber-200 rounded-xl p-8 text-center shadow-sm max-w-xl mx-auto space-y-4 mt-12">
            <div className="w-14 h-14 bg-amber-100 border border-amber-200 rounded-full flex items-center justify-center text-amber-600 mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-xl font-bold text-slate-900">Payroll Module Locked</CardTitle>
              <CardDescription className="text-sm text-slate-505">
                Your tenant license for **acme-corp** does not contain authorization for the payroll & salary statutory computations module.
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

            {/* SALARY LEDGER TAB */}
            {activeTab === 'Salary Ledger' && (
              <Card className="bg-white border-slate-200 shadow-xs overflow-hidden rounded-xl">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <CardTitle className="text-sm font-semibold text-slate-750">Compensation Ledger</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50/40 border-b border-slate-100">
                      <TableRow className="border-b border-slate-100 hover:bg-transparent">
                        <TableHead className="text-slate-500 font-semibold py-3 pl-6">ID</TableHead>
                        <TableHead className="text-slate-500 font-semibold py-3">Employee</TableHead>
                        <TableHead className="text-slate-500 font-semibold py-3">Hourly Equiv.</TableHead>
                        <TableHead className="text-slate-500 font-semibold py-3">Hours Worked</TableHead>
                        <TableHead className="text-slate-500 font-semibold py-3">Gross Salary</TableHead>
                        <TableHead className="text-slate-500 font-semibold py-3">Statutory Deductions</TableHead>
                        <TableHead className="text-slate-500 font-semibold py-3">Net Take-Home</TableHead>
                        <TableHead className="text-slate-500 font-semibold py-3 text-right pr-6">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((emp) => {
                        const gross = (emp.dailyRate / 8) * emp.hoursWorked;
                        const deductions = calculateStatutoryDeductions(gross);
                        const totalDeductions = deductions.sss + deductions.philhealth + deductions.pagibig + deductions.tax;
                        const net = gross - totalDeductions;

                        return (
                          <TableRow key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/30">
                            <TableCell className="font-mono text-xs text-indigo-600 pl-6 py-3">{emp.id}</TableCell>
                            <TableCell className="py-3">
                              <p className="font-semibold text-slate-800">{emp.name}</p>
                              <p className="text-[10px] text-slate-400">{emp.position}</p>
                            </TableCell>
                            <TableCell className="text-slate-600 font-mono text-xs py-3">₱{Math.round(emp.dailyRate / 8).toLocaleString()}/hr</TableCell>
                            <TableCell className="text-slate-700 font-mono text-xs py-3">{emp.hoursWorked} hrs</TableCell>
                            <TableCell className="text-slate-700 font-mono text-xs py-3">₱{Math.round(gross).toLocaleString()}</TableCell>
                            <TableCell className="text-rose-650 font-mono text-xs py-3">-₱{Math.round(totalDeductions).toLocaleString()}</TableCell>
                            <TableCell className="text-emerald-600 font-bold font-mono text-xs py-3">₱{Math.round(net).toLocaleString()}</TableCell>
                            <TableCell className="text-right pr-6 py-3">
                              <Button 
                                onClick={() => setSelectedPayslipEmp(emp)}
                                className="bg-indigo-50 hover:bg-indigo-600 border border-indigo-250 text-indigo-650 hover:text-white text-[11px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-semibold"
                              >
                                Payslip
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* CSV IMPORTS TAB */}
            {activeTab === 'CSV Imports' && (
              <div className="max-w-xl">
                <Card className="bg-white border-slate-200 shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-650" />
                      Manual CSV Overrides
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">Upload attendance hours for remote/off-site staff</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCsvImport} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="csv-input" className="text-slate-500 text-xs font-semibold">Choose CSV Data File</Label>
                        <Input 
                          id="csv-input" type="file" accept=".csv" value={csvFile}
                          onChange={(e) => setCsvFile(e.target.value)}
                          className="bg-slate-50 border-slate-200 text-slate-700 text-xs file:bg-slate-200 file:text-slate-800 file:border-0 file:rounded-md file:px-2 file:py-0.5"
                        />
                      </div>
                      <Button 
                        type="submit" disabled={isUploading || !csvFile}
                        className="w-full bg-slate-900 hover:bg-slate-850 text-white text-xs rounded-lg py-1.5 flex items-center justify-center gap-2 shadow-xs transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {isUploading ? 'Importing Override...' : 'Import Timecard CSV'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* COMPLIANCE TAB */}
            {activeTab === 'Compliance' && (
              <div className="max-w-4xl space-y-6">
                <Card className="bg-white border-slate-200 shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-indigo-650" />
                      TRAIN Law Withholding & Contributions
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">2026 BIR tax regulations & SSS/PhilHealth/Pag-IBIG tables</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-slate-650 space-y-4 leading-relaxed">
                    <p>
                      Statutory calculations are dynamically computed during the ledger generation process. Tax exemptions apply for base compensation up to ₱20,833/month.
                    </p>
                    <div className="grid grid-cols-3 gap-4 pt-1">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                        <span className="text-slate-400 block font-semibold">SSS Cap</span>
                        <strong className="text-slate-800 text-xs block mt-1">₱1,350 max employee</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                        <span className="text-slate-400 block font-semibold">PhilHealth Rate</span>
                        <strong className="text-slate-800 text-xs block mt-1">2.5% share</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                        <span className="text-slate-400 block font-semibold">Tax Exemption</span>
                        <strong className="text-slate-800 text-xs block mt-1">₱250k annual base</strong>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ADVANCED TAB */}
            {activeTab === 'Advanced' && (
              <div className="max-w-4xl">
                <Card className="bg-white border-slate-200 shadow-xs p-8 text-center">
                  <Settings className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-slate-850">Reporting Engine Parameters</h4>
                  <p className="text-xs text-slate-400 mt-1">Setup BIR Form 2316 auto-generation rules and 13th month bonus computation parameters.</p>
                </Card>
              </div>
            )}

          </div>
        )}
      </div>

      {/* --- PAYSLIP DETAILED DIALOG --- */}
      <Dialog open={!!selectedPayslipEmp} onOpenChange={() => setSelectedPayslipEmp(null)}>
        <DialogContent className="bg-white border-slate-200 text-slate-750 sm:max-w-[485px] rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-650" />
              Itemized Employee Payslip
            </DialogTitle>
            <DialogDescription className="text-slate-505 text-xs">
              Official salary computation document for BIR & statutory compliance audits.
            </DialogDescription>
          </DialogHeader>
          {selectedPayslipEmp && (() => {
            const gross = (selectedPayslipEmp.dailyRate / 8) * selectedPayslipEmp.hoursWorked;
            const deductions = calculateStatutoryDeductions(gross);
            const totalDeductions = deductions.sss + deductions.philhealth + deductions.pagibig + deductions.tax;
            const net = gross - totalDeductions;

            return (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Name</span>
                    <strong className="text-slate-800 block mt-0.5">{selectedPayslipEmp.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Employee ID</span>
                    <strong className="text-indigo-650 font-mono block mt-0.5">{selectedPayslipEmp.id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Daily Rate</span>
                    <strong className="text-slate-800 block mt-0.5">₱{selectedPayslipEmp.dailyRate.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Total Hours</span>
                    <strong className="text-slate-800 block mt-0.5">{selectedPayslipEmp.hoursWorked} hours</strong>
                  </div>
                </div>

                <div className="space-y-2 border-t border-b border-slate-100 py-3 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Gross Compensation</span>
                    <span className="text-slate-800">₱{Math.round(gross).toLocaleString()}</span>
                  </div>

                  <div className="border-t border-slate-100 my-2 pt-2 space-y-1">
                    <span className="text-slate-400 block mb-1 font-semibold">Deductions (PH Statutory):</span>
                    <div className="flex justify-between pl-2">
                      <span className="text-slate-605">SSS Contribution</span>
                      <span className="text-rose-600 font-mono">-₱{Math.round(deductions.sss).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pl-2">
                      <span className="text-slate-650">PhilHealth Contribution</span>
                      <span className="text-rose-600 font-mono">-₱{Math.round(deductions.philhealth).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pl-2">
                      <span className="text-slate-650">Pag-IBIG contribution</span>
                      <span className="text-rose-600 font-mono">-₱{Math.round(deductions.pagibig).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pl-2 font-semibold">
                      <span className="text-slate-655">Withholding Tax (BIR)</span>
                      <span className="text-rose-600 font-mono">-₱{Math.round(deductions.tax).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <div>
                    <span className="text-slate-550 text-xs block">Net Take-Home Pay</span>
                    <strong className="text-emerald-600 text-base font-bold block mt-0.5">₱{Math.round(net).toLocaleString()}</strong>
                  </div>
                  <Button 
                    onClick={() => window.print()}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    Print Payslip
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
