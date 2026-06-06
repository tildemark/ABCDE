'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Edit2, 
  ShieldCheck, 
  Briefcase, 
  Clock, 
  CircleDollarSign, 
  Cpu, 
  FileText, 
  UserPlus,
  Heart,
  MessageSquare,
  Share2,
  Printer,
  ChevronLeft,
  Paperclip,
  Lock,
  ArrowRight,
  MoreHorizontal,
  Users,
  Building,
  Key,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Link from 'next/link';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  status: 'Active' | 'On Leave' | 'Suspended' | 'Resigned';
  hireDate: string;
  dailyRate: number;
  hoursWorked: number;
  avatarUrl: string;
}

const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'EMP-001', name: 'Adam Roy', email: 'adam.roy@atomic-hr.com', phone: '+63 917 123 4567', department: 'Engineering', position: 'Principal Engineer', status: 'Active', hireDate: '2022-03-15', dailyRate: 2500, hoursWorked: 88, avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80' },
  { id: 'EMP-002', name: 'Maria Santos', email: 'm.santos@atomic-hr.com', phone: '+63 918 234 5678', department: 'Human Resources', position: 'HR Manager', status: 'Active', hireDate: '2021-06-01', dailyRate: 1800, hoursWorked: 80, avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80' },
  { id: 'EMP-003', name: 'Devon Lane', email: 'd.lane@atomic-hr.com', phone: '+63 919 345 6789', department: 'Engineering', position: 'Senior Frontend Dev', status: 'On Leave', hireDate: '2023-01-10', dailyRate: 1900, hoursWorked: 16, avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80' },
  { id: 'EMP-004', name: 'Sarah Jenkins', email: 's.jenkins@atomic-hr.com', phone: '+63 920 456 7890', department: 'Marketing', position: 'Growth Lead', status: 'Active', hireDate: '2023-08-24', dailyRate: 1500, hoursWorked: 80, avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&h=256&q=80' },
  { id: 'EMP-005', name: 'Ronald Richards', email: 'r.richards@atomic-hr.com', phone: '+63 921 567 8901', department: 'Finance', position: 'Financial Analyst', status: 'Active', hireDate: '2020-11-12', dailyRate: 1600, hoursWorked: 84, avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80' },
  { id: 'EMP-006', name: 'Bessie Cooper', email: 'b.cooper@atomic-hr.com', phone: '+63 922 678 9012', department: 'Sales', position: 'Account Executive', status: 'Resigned', hireDate: '2019-04-05', dailyRate: 1400, hoursWorked: 0, avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80' },
];

export default function HRISDirectory() {
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const isHrisLicensed = activeModules.includes('HUMAN_RESOURCES');
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  
  const [selectedEmpDetail, setSelectedEmpDetail] = useState<Employee | null>(null);
  const [detailSubTab, setDetailSubTab] = useState('connections');

  const [activeTab, setActiveTab] = useState('Roster');
  const tabs = ['Roster', 'Departments', 'Job Titles', 'Security', 'Advanced'];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Engineering',
    position: '',
    status: 'Active' as Employee['status'],
    hireDate: new Date().toISOString().split('T')[0],
    dailyRate: 1500,
    hoursWorked: 80
  });

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

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
      const matchesStatus = selectedStatus === 'All' || emp.status === selectedStatus;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchTerm, selectedDept, selectedStatus]);

  const handleEditClick = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      department: emp.department,
      position: emp.position,
      status: emp.status,
      hireDate: emp.hireDate,
      dailyRate: emp.dailyRate,
      hoursWorked: emp.hoursWorked
    });
    setIsEditOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextId = `EMP-${String(employees.length + 1).padStart(3, '0')}`;
    const newEmp: Employee = {
      id: nextId,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      department: formData.department,
      position: formData.position,
      status: formData.status,
      hireDate: formData.hireDate,
      dailyRate: Number(formData.dailyRate) || 1200,
      hoursWorked: Number(formData.hoursWorked) || 80,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80'
    };
    setEmployees([...employees, newEmp]);
    setIsAddOpen(false);
    resetForm();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const updated = employees.map(emp => 
      emp.id === editingEmployee.id 
        ? { ...emp, ...formData, dailyRate: Number(formData.dailyRate), hoursWorked: Number(formData.hoursWorked) }
        : emp
    );
    setEmployees(updated);
    
    if (selectedEmpDetail && selectedEmpDetail.id === editingEmployee.id) {
      const target = updated.find(x => x.id === editingEmployee.id);
      if (target) setSelectedEmpDetail(target);
    }
    
    setIsEditOpen(false);
    setEditingEmployee(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: 'Engineering',
      position: '',
      status: 'Active',
      hireDate: new Date().toISOString().split('T')[0],
      dailyRate: 1500,
      hoursWorked: 80
    });
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans pb-12">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-white border-b border-slate-200 px-6 py-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center justify-center w-7 h-7 rounded bg-indigo-50 text-indigo-650 hover:bg-indigo-100 transition-colors">
            <Users className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-slate-505 font-semibold">
            <Link href="/" className="hover:text-slate-800">ABCD ERP System</Link>
            <span className="text-slate-350">/</span>
            <span className="cursor-pointer hover:text-slate-800" onClick={() => { setSelectedEmpDetail(null); setActiveTab('Roster'); }}>HRIS</span>
            {selectedEmpDetail && (
              <>
                <span className="text-slate-350">/</span>
                <span className="text-slate-700 font-mono">{selectedEmpDetail.id}</span>
              </>
            )}
          </div>
        </div>

        {/* Global Actionable Search box */}
        <div className="hidden md:flex items-center w-96 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search or type a command (Ctrl + G)" 
            className="w-full bg-slate-100/70 border border-slate-200 rounded-md py-1.5 pl-9 pr-4 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-700 font-medium placeholder:text-slate-400"
          />
        </div>

        {/* Account widget / Nav Links */}
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <Link href="/core" className="hover:text-slate-800">Core Setup</Link>
            <Link href="/hris" className="text-indigo-600">HRIS</Link>
            <Link href="/timekeeping" className="hover:text-slate-800">Timekeeping</Link>
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {selectedEmpDetail ? selectedEmpDetail.name : 'HRIS Directory'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedEmpDetail ? `Employee profile directory card for ${selectedEmpDetail.id}` : 'Manage active company directory staff and classifications.'}
          </p>
        </div>
      </div>

      {/* Tabs Menu List (Visible only if not viewing single employee detail) */}
      {!selectedEmpDetail && (
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
      )}

      {/* MAIN CONTAINER */}
      <div className="w-full px-6 mt-6">
        {!isHrisLicensed ? (
          <Card className="bg-white border-amber-200 rounded-xl p-8 text-center shadow-sm max-w-xl mx-auto space-y-4 mt-12">
            <div className="w-14 h-14 bg-amber-100 border border-amber-200 rounded-full flex items-center justify-center text-amber-600 mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-xl font-bold text-slate-900">Human Resources Module Locked</CardTitle>
              <CardDescription className="text-sm text-slate-505">
                Your tenant license for **acme-corp** does not contain authorization for the human resources directory module.
              </CardDescription>
            </div>
            <div className="pt-2">
              <Button className="bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center gap-2 mx-auto shadow-sm shadow-amber-600/10">
                Contact Sales to Upgrade
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        ) : selectedEmpDetail ? (
          /* DETAIL SCREEN VIEW (Employee selected) */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedEmpDetail(null)} 
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-505 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-slate-900">{selectedEmpDetail.name}</h2>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-250/60 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                  Active
                </span>
              </div>

              {/* Action options */}
              <div className="flex items-center gap-2 text-xs">
                <button className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-500" onClick={() => window.print()}>
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-500">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => handleEditClick(selectedEmpDetail)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-1.5 rounded shadow-xs cursor-pointer"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Left and Right Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* LEFT COL: PROFILE MEDIA & METADATA */}
              <div className="space-y-6">
                <div className="w-full aspect-square rounded-xl overflow-hidden border border-slate-200/80 bg-white shadow-2xs">
                  <img src={selectedEmpDetail.avatarUrl} alt={selectedEmpDetail.name} className="w-full h-full object-cover" />
                </div>

                <div className="space-y-4 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400" /> Assigned To</span>
                    <button className="text-slate-400 hover:text-slate-800 text-sm font-bold">+</button>
                  </div>
                  
                  <div className="pb-2.5 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2"><Paperclip className="w-4 h-4 text-slate-400" /> Attachments</span>
                      <button className="text-slate-400 hover:text-slate-800 text-sm font-bold">+</button>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 flex items-center justify-between font-mono text-[10px] text-slate-500">
                      <span>adam7bc121.jpeg</span>
                      <button className="text-slate-400 hover:text-slate-700">×</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COL: DETAILS */}
              <div className="lg:col-span-3 space-y-6">
                {/* Horizontal Tab Bar inside employee card */}
                <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
                  <button
                    onClick={() => setDetailSubTab('connections')}
                    className={`px-4 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                      detailSubTab === 'connections' ? 'text-slate-900 border-indigo-600' : 'text-slate-450 border-transparent hover:text-slate-700'
                    }`}
                  >
                    Connections
                  </button>
                  <button
                    onClick={() => setDetailSubTab('overview')}
                    className={`px-4 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                      detailSubTab === 'overview' ? 'text-slate-900 border-indigo-600' : 'text-slate-450 border-transparent hover:text-slate-700'
                    }`}
                  >
                    Overview
                  </button>
                </div>

                {detailSubTab === 'connections' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-white border-slate-200 shadow-2xs rounded-xl">
                      <CardHeader className="pb-3"><CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Attendance</CardTitle></CardHeader>
                      <CardContent className="space-y-2 text-xs text-slate-500">
                        <div className="flex items-center justify-between">
                          <span>Biometric Logs</span>
                          <Link href="/timekeeping" className="text-indigo-600 hover:underline flex items-center gap-1">
                            View in Timekeeping Module <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-2xs rounded-xl">
                      <CardHeader className="pb-3"><CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Compensations</CardTitle></CardHeader>
                      <CardContent className="space-y-2 text-xs text-slate-500">
                        <div className="flex items-center justify-between">
                          <span>Payslips & Ledger</span>
                          <Link href="/payroll" className="text-indigo-600 hover:underline flex items-center gap-1">
                            View in Payroll Module <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {detailSubTab === 'overview' && (
                  <Card className="bg-white border-slate-200 shadow-2xs rounded-xl">
                    <CardHeader><CardTitle className="text-sm font-bold text-slate-700">Contract Parameters</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-400 block font-medium">Job Title / Role</span>
                          <strong className="text-slate-800 block mt-1">{selectedEmpDetail.position}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Department</span>
                          <strong className="text-slate-800 block mt-1">{selectedEmpDetail.department}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Date Hired</span>
                          <strong className="text-slate-800 block mt-1">{selectedEmpDetail.hireDate}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Primary Contact</span>
                          <strong className="text-slate-800 block mt-1">{selectedEmpDetail.phone}</strong>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* LIST SCREEN VIEWS BASED ON SELECTED TAB */
          <div className="space-y-6">
            
            {/* 1. ROSTER TAB */}
            {activeTab === 'Roster' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Active Employee Directory</h3>
                  </div>
                  <div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                      <DialogTrigger render={
                        <Button className="bg-indigo-600 hover:bg-indigo-505 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95">
                          <UserPlus className="w-3.5 h-3.5" />
                          Add Employee
                        </Button>
                      } />
                      <DialogContent className="bg-white border-slate-200 text-slate-750 sm:max-w-[480px] rounded-xl shadow-lg">
                        <DialogHeader>
                          <DialogTitle className="text-lg font-bold text-slate-900">Add New Employee</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
                          <div className="space-y-1">
                            <Label htmlFor="name" className="text-xs text-slate-700">Full Name</Label>
                            <Input id="name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Adam Roy" className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label htmlFor="email" className="text-xs text-slate-700">Work Email</Label>
                              <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-slate-50 border-slate-200 text-xs py-1 h-8" />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="phone" className="text-xs text-slate-700">Phone</Label>
                              <Input id="phone" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-50 border-slate-200 text-xs py-1 h-8" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label htmlFor="department" className="text-xs text-slate-700">Department</Label>
                              <Select value={formData.department} onValueChange={(val) => setFormData({...formData, department: val || 'Engineering'})}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-8"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-xs text-slate-700">
                                  <SelectItem value="Engineering">Engineering</SelectItem>
                                  <SelectItem value="Human Resources">HR</SelectItem>
                                  <SelectItem value="Marketing">Marketing</SelectItem>
                                  <SelectItem value="Finance">Finance</SelectItem>
                                  <SelectItem value="Sales">Sales</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="position" className="text-xs text-slate-700">Job Title</Label>
                              <Input id="position" required value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="bg-slate-50 border-slate-200 text-xs py-1 h-8" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label htmlFor="dailyRate" className="text-xs text-slate-700">Daily Salary Rate (₱)</Label>
                              <Input id="dailyRate" type="number" required value={formData.dailyRate} onChange={(e) => setFormData({...formData, dailyRate: Number(e.target.value)})} className="bg-slate-50 border-slate-200 text-xs py-1 h-8" />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="status" className="text-xs text-slate-705">Status</Label>
                              <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val || 'Active'})}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-8"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-xs text-slate-700">
                                  <SelectItem value="Active">Active</SelectItem>
                                  <SelectItem value="On Leave">On Leave</SelectItem>
                                  <SelectItem value="Suspended">Suspended</SelectItem>
                                  <SelectItem value="Resigned">Resigned</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter className="pt-3 border-t border-slate-100">
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="bg-transparent border-slate-300 text-xs py-1 h-8">Cancel</Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1 h-8">Save Profile</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by name, ID, position or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900 rounded-lg text-xs placeholder:text-slate-400 focus:bg-white"
                    />
                  </div>

                  <Select value={selectedDept} onValueChange={(val) => setSelectedDept(val || 'All')}>
                    <SelectTrigger className="w-full md:w-[180px] bg-slate-50 border-slate-200 text-slate-700 rounded-lg text-xs h-9">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-700 text-xs">
                      <SelectItem value="All">All Departments</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Human Resources">HR</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val || 'All')}>
                    <SelectTrigger className="w-full md:w-[180px] bg-slate-50 border-slate-200 text-slate-700 rounded-lg text-xs h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-705 text-xs">
                      <SelectItem value="All">All Statuses</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                      <SelectItem value="Resigned">Resigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Profiles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEmployees.map((emp) => (
                    <div 
                      key={emp.id}
                      onClick={() => setSelectedEmpDetail(emp)}
                      className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all duration-200 flex items-start gap-4 shadow-2xs relative group"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-100 shrink-0">
                        <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{emp.name}</h4>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            emp.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-250/50' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {emp.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{emp.position}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-2">{emp.id} • {emp.department}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. DEPARTMENTS TAB */}
            {activeTab === 'Departments' && (
              <div className="space-y-4 max-w-4xl">
                <Card className="bg-white border-slate-200 shadow-2xs">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Building className="w-4 h-4 text-indigo-650" />
                      Organizational Departments
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">Headcount distribution stats per department</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="pl-6 text-xs text-slate-500">Department</TableHead>
                          <TableHead className="text-xs text-slate-500">Staff Count</TableHead>
                          <TableHead className="text-xs text-slate-500">Key Roles</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="pl-6 font-semibold text-slate-800 text-xs">Engineering</TableCell>
                          <TableCell className="font-mono text-xs">2 Employees</TableCell>
                          <TableCell className="text-xs text-slate-500">Principal Engineer, Senior Dev</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6 font-semibold text-slate-800 text-xs">Human Resources</TableCell>
                          <TableCell className="font-mono text-xs">1 Employee</TableCell>
                          <TableCell className="text-xs text-slate-500">HR Manager</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6 font-semibold text-slate-800 text-xs">Marketing</TableCell>
                          <TableCell className="font-mono text-xs">1 Employee</TableCell>
                          <TableCell className="text-xs text-slate-500">Growth Lead</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6 font-semibold text-slate-800 text-xs">Finance</TableCell>
                          <TableCell className="font-mono text-xs">1 Employee</TableCell>
                          <TableCell className="text-xs text-slate-500">Financial Analyst</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 3. JOB TITLES TAB */}
            {activeTab === 'Job Titles' && (
              <div className="space-y-4 max-w-4xl">
                <Card className="bg-white border-slate-200 shadow-2xs">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-650" />
                      Standard Corporate Positions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="pl-6 text-xs text-slate-500">Job Title</TableHead>
                          <TableHead className="text-xs text-slate-500">Base Level</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow><TableCell className="pl-6 font-medium text-xs">Principal Engineer</TableCell><TableCell className="text-xs">L6 - Executive Staff</TableCell></TableRow>
                        <TableRow><TableCell className="pl-6 font-medium text-xs">HR Manager</TableCell><TableCell className="text-xs">L4 - Management</TableCell></TableRow>
                        <TableRow><TableCell className="pl-6 font-medium text-xs">Senior Frontend Dev</TableCell><TableCell className="text-xs">L3 - Senior Staff</TableCell></TableRow>
                        <TableRow><TableCell className="pl-6 font-medium text-xs">Growth Lead</TableCell><TableCell className="text-xs">L3 - Senior Staff</TableCell></TableRow>
                        <TableRow><TableCell className="pl-6 font-medium text-xs">Financial Analyst</TableCell><TableCell className="text-xs">L2 - Associate</TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 4. SECURITY TAB */}
            {activeTab === 'Security' && (
              <div className="space-y-4 max-w-4xl">
                <Card className="bg-white border-slate-200 shadow-2xs">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-indigo-650" />
                      Access Controls & Roles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs p-6">
                    <p className="text-slate-500">Enable profile edit controls specifically for HR Department managers only.</p>
                    <div className="flex items-center gap-2 pt-2">
                      <input type="checkbox" id="strict-hr" defaultChecked className="rounded border-slate-300 text-indigo-650 w-3.5 h-3.5 cursor-pointer" />
                      <Label htmlFor="strict-hr" className="font-semibold text-slate-700 cursor-pointer">Restrict Directory Editing to HR Manager Role</Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 5. ADVANCED TAB */}
            {activeTab === 'Advanced' && (
              <div className="max-w-4xl">
                <Card className="bg-white border-slate-200 shadow-2xs p-8 text-center">
                  <Cpu className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-slate-800">Advanced HRIS Data Engines</h4>
                  <p className="text-xs text-slate-400 mt-1">Setup scheduled automated synchronization rules for LDAP profiles or edge endpoints.</p>
                </Card>
              </div>
            )}

          </div>
        )}
      </div>

      {/* --- EDIT EMPLOYEE DIALOG --- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-750 sm:max-w-[480px] rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Edit Employee Profile</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="edit-name" className="text-xs text-slate-700">Full Name</Label>
                <Input id="edit-name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-email" className="text-xs text-slate-700">Email Address</Label>
                  <Input id="edit-email" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-slate-50 border-slate-200 text-xs py-1 h-8" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-phone" className="text-xs text-slate-700">Phone Number</Label>
                  <Input id="edit-phone" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-50 border-slate-200 text-xs py-1 h-8" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-department" className="text-xs text-slate-700">Department</Label>
                  <Select value={formData.department} onValueChange={(val) => setFormData({...formData, department: val || 'Engineering'})}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-8"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-xs text-slate-700">
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Human Resources">HR</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-position" className="text-xs text-slate-700">Job Title</Label>
                  <Input id="edit-position" required value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="bg-slate-50 border-slate-200 text-xs py-1 h-8" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-dailyRate" className="text-xs text-slate-700">Daily Salary Rate (₱)</Label>
                  <Input id="edit-dailyRate" type="number" required value={formData.dailyRate} onChange={(e) => setFormData({...formData, dailyRate: Number(e.target.value)})} className="bg-slate-50 border-slate-200 text-xs py-1 h-8" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-hoursWorked" className="text-xs text-slate-700">Hours Worked</Label>
                  <Input id="edit-hoursWorked" type="number" required value={formData.hoursWorked} onChange={(e) => setFormData({...formData, hoursWorked: Number(e.target.value)})} className="bg-slate-50 border-slate-200 text-xs py-1 h-8" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-status" className="text-xs text-slate-705">Status</Label>
                <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val || 'Active'})}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-xs text-slate-700">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                    <SelectItem value="Resigned">Resigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="bg-transparent border-slate-300 text-xs py-1 h-8">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1 h-8">Apply Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
