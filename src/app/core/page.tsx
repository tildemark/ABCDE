'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  Building2,
  LayoutGrid,
  Sliders,
  Database,
  ShieldCheck,
  CheckCircle,
  Plus,
  Edit2,
  Trash2,
  Lock,
  User,
  Key,
  Mail,
  FileCode,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Search,
  Eye,
  Settings
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

interface Branch {
  id: string;
  name: string;
  region: string;
  isHeadquarters: boolean;
  address: string;
  parentId?: string | null;
  registeredTin?: string;
  sssId?: string;
  philhealthId?: string;
  pagibigId?: string;
  birBranchCode?: string;
  rdoCode?: string;
  entityType?: string;
}

interface Department {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  managerId: string;
  managerName: string;
  staffCount: number;
}

interface Employee {
  id: string;
  name: string;
}

interface AuditLog {
  logId: string;
  tableName: string;
  recordId: string;
  actionType: string;
  actorId: string;
  actorName: string;
  createdAt: string;
  oldData: any;
  newData: any;
}

interface ConsentLog {
  id: string;
  employeeId: string;
  employeeName: string;
  policyVersion: string;
  consentPi: boolean;
  consentSpi: boolean;
  granularPermissions: any;
  ipAddress: string;
  consentedAt: string;
}

interface Workflow {
  id: string;
  workflowType: string;
  status: string;
  currentStep: string;
  payload: any;
  createdAt: string;
}

interface AppUser {
  id: string;
  personId: string;
  name: string;
  email: string;
  isActive: boolean;
  roleId: string;
  roleName: string;
  employeeCode: string;
  overrides?: any;
}

interface AppRole {
  id: string;
  name: string;
  description: string;
  permissions: any;
}

export default function CoreSetupPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 font-semibold">Loading Core Setup...</div>}>
      <CoreSetupContent />
    </Suspense>
  );
}

function CoreSetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sectionParam = searchParams.get('section');
  const activeSection = (sectionParam || 'company') as 'company' | 'departments' | 'users' | 'roles' | 'settings' | 'logs' | 'licensing' | 'privacy' | 'workflows';

  const companyTab = (searchParams.get('tab') || 'metadata') as 'metadata' | 'branches' | 'departments';

  const setActiveSection = (sec: string) => {
    router.push(`/core?section=${sec}`);
  };

  const setCompanyTab = (tab: string) => {
    router.push(`/core?section=company&tab=${tab}`);
  };

  useEffect(() => {
    if (activeSection === 'departments') {
      router.replace('/core?section=company&tab=departments');
    }
  }, [activeSection, router]);

  // License & Tenant States
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [licenseStatus, setLicenseStatus] = useState<string>('Verifying...');
  const [tenant, setTenant] = useState({
    id: '',
    corporateName: '',
    registeredTin: '',
    industry: '',
    logoUrl: '',
    address: '',
    telephone: '',
    email: '',
    website: '',
    secRegistration: '',
    sssId: '',
    philhealthId: '',
    pagibigId: '',
    birBranchCode: '',
    rdoCode: '',
    companyType: 'OPERATING',
    parentTenantId: '',
  });

  const [isTenantDirty, setIsTenantDirty] = useState(false);
  const [originalTenant, setOriginalTenant] = useState<any>(null);

  const [allTenants, setAllTenants] = useState<any[]>([]);

  // Data Lists State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [consentLogs, setConsentLogs] = useState<ConsentLog[]>([]);
  const [activeWorkflows, setActiveWorkflows] = useState<Workflow[]>([]);
  const [workflowHistory, setWorkflowHistory] = useState<Workflow[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<AppRole[]>([]);

  // Modals Controlling State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState({
    name: '',
    region: '',
    isHeadquarters: false,
    address: '',
    parentId: '',
    registeredTin: '',
    sssId: '',
    philhealthId: '',
    pagibigId: '',
    birBranchCode: '',
    rdoCode: '',
    entityType: 'BRANCH'
  });

  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ name: '', branchId: '', managerId: '' });

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [selectedConsent, setSelectedConsent] = useState<ConsentLog | null>(null);

  const [isWfModalOpen, setIsWfModalOpen] = useState(false);
  const [wfType, setWfType] = useState('DATA_RETENTION_SCRUB');
  const [wfEmployeeId, setWfEmployeeId] = useState('');
  const [wfPurgeDate, setWfPurgeDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    return d.toISOString().split('T')[0];
  });
  const [wfEscalationHours, setWfEscalationHours] = useState('48');
  const [wfManagerId, setWfManagerId] = useState('');
  const [wfTerminalId, setWfTerminalId] = useState('ZKT-K14-HQ');

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '', roleId: '', employeeCode: '' });

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] as string[] });

  const [userSearch, setUserSearch] = useState('');

  const [systemModules, setSystemModules] = useState<{ id: string; code: string; name: string; category: string; description: string }[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideUser, setOverrideUser] = useState<AppUser | null>(null);
  const [overrideModule, setOverrideModule] = useState<string>('');
  const [overrideAction, setOverrideAction] = useState<string>('read');
  const [overrideValue, setOverrideValue] = useState<string>('INHERIT');

  const [licenseExpiry, setLicenseExpiry] = useState<string>('9999-12-31');
  const [licenseKeyInput, setLicenseKeyInput] = useState<string>('');
  const [isReplacingLicense, setIsReplacingLicense] = useState<boolean>(false);

  // Status Alerts
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Sub-tabs state
  const [privacyTab, setPrivacyTab] = useState<'consent' | 'retention'>('consent');
  const [workflowTab, setWorkflowTab] = useState<'queue' | 'history'>('queue');

  // General Settings States (Persisting from original page.tsx)
  const [activeTab, setActiveTab] = useState('Details');
  const tabs = ['Details', 'Login', 'Password', 'Email', 'Files', 'App', 'Display', 'Backups', 'Advanced'];

  const [country, setCountry] = useState('Philippines');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('Asia/Manila');
  const [currency, setCurrency] = useState('PHP');
  const [enableOnboarding, setEnableOnboarding] = useState(true);
  const [disableDocSharing, setDisableDocSharing] = useState(false);
  const [floatPrecision, setFloatPrecision] = useState('3');
  const [currencyPrecision, setCurrencyPrecision] = useState('2');
  const [roundingMethod, setRoundingMethod] = useState("Banker's Rounding");
  const [showAbsoluteDatetime, setShowAbsoluteDatetime] = useState(false);
  const [firstDayOfWeek, setFirstDayOfWeek] = useState('Sunday');
  const [applyStrictPermissions, setApplyStrictPermissions] = useState(false);
  const [showExternalWarning, setShowExternalWarning] = useState('All External Links');

  const [allowGoogleLogin, setAllowGoogleLogin] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('3605');
  const [minPasswordLength, setMinPasswordLength] = useState('8');
  const [smtpServer, setSmtpServer] = useState('smtp.atomic-hr.com');
  const [maxFileSize, setMaxFileSize] = useState('10MB');

  // Data Privacy settings
  const [retentionYears, setRetentionYears] = useState('5');
  const [enableAutoPurge, setEnableAutoPurge] = useState(true);
  const [maskingLevel, setMaskingLevel] = useState('ANONYMIZE');

  // Log Data Privacy settings
  const [logRetentionYears, setLogRetentionYears] = useState('5');
  const [enableLogAutoPurge, setEnableLogAutoPurge] = useState(true);
  const [logMaskingLevel, setLogMaskingLevel] = useState('ANONYMIZE');

  // Search & Filters inside lists
  const [branchSearch, setBranchSearch] = useState('');
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});
  const [deptSearch, setDeptSearch] = useState('');
  const [selectedDeptBranchId, setSelectedDeptBranchId] = useState<string>('');
  const [logSearch, setLogSearch] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('ALL');
  const [logTab, setLogTab] = useState<'all' | 'transactions' | 'access' | 'actions' | 'violations' | 'archives'>('all');
  const [consentSearch, setConsentSearch] = useState('');

  const [archiveFiles, setArchiveFiles] = useState<{ fileName: string; fileSize: string; dateRange: string; recordsCount: number; bucket: string; purgeDate: string }[]>([]);
  const [selectedArchiveName, setSelectedArchiveName] = useState<string>('');
  const [selectedArchiveContents, setSelectedArchiveContents] = useState<any[]>([]);
  const [archiveSearch, setArchiveSearch] = useState<string>('');

  // Fetch initial data
  useEffect(() => {
    // License
    fetch('/api/system/license')
      .then(res => res.json())
      .then(data => {
        if (data.activeModules) {
          setActiveModules(data.activeModules);
          setLicenseStatus(data.status || 'Verified & Active');
          setLicenseExpiry(data.expires || '9999-12-31');
          setLicenseKeyInput(data.licenseKey || '');
        } else {
          setLicenseStatus(data.status || 'Invalid License');
          setLicenseExpiry(data.expires || 'Unknown');
          setLicenseKeyInput(data.licenseKey || '');
        }
      }).catch(() => setLicenseStatus('Offline License Verification'));

    // Tenant metadata
    fetch('/api/core/tenant')
      .then(res => res.json())
      .then(data => {
        setTenant(data);
        setOriginalTenant(data);
      })
      .catch(err => console.error('Error fetching tenant:', err));

    // Fetch all tenants
    fetch('/api/core/tenant?list=true')
      .then(res => res.json())
      .then(data => setAllTenants(data))
      .catch(err => console.error('Error fetching list of tenants:', err));

    // Branches
    fetch('/api/core/branches')
      .then(res => res.json())
      .then(data => {
        setBranches(data);
        if (data && data.length > 0) {
          setSelectedDeptBranchId(data[0].id);
        }
      })
      .catch(err => console.error('Error fetching branches:', err));

    // Departments
    fetch('/api/core/departments')
      .then(res => res.json())
      .then(data => setDepartments(data))
      .catch(err => console.error('Error fetching departments:', err));

    // Employees list (for dropdowns)
    fetch('/api/core/employees')
      .then(res => res.json())
      .then(data => {
        setEmployees(data);
        if (data && data.length > 0) {
          setWfEmployeeId(data[0].id);
          setWfManagerId(data[0].id);
        }
      })
      .catch(err => console.error('Error fetching employees:', err));

    // Audit Logs
    fetch('/api/core/audit-logs')
      .then(res => res.json())
      .then(data => setAuditLogs(data))
      .catch(err => console.error('Error fetching audit logs:', err));

    // Consent Logs
    fetch('/api/core/consent-logs')
      .then(res => res.json())
      .then(data => setConsentLogs(data))
      .catch(err => console.error('Error fetching consent logs:', err));

    // Workflows
    fetch('/api/core/workflows')
      .then(res => res.json())
      .then(data => {
        if (data.active) {
          setActiveWorkflows(data.active);
          setWorkflowHistory(data.history);
        }
      })
      .catch(err => console.error('Error fetching workflows:', err));

    // Users
    fetch('/api/core/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Error fetching users:', err));

    // Roles
    fetch('/api/core/roles')
      .then(res => res.json())
      .then(data => {
        setRoles(data);
        if (data.length > 0) {
          setSelectedRoleId(data[0].id);
        }
      })
      .catch(err => console.error('Error fetching roles:', err));

    // Modules
    fetch('/api/core/modules')
      .then(res => res.json())
      .then(data => {
        setSystemModules(data);
        if (data.length > 0) {
          setOverrideModule(data[0].code);
        }
      })
      .catch(err => console.error('Error fetching modules:', err));

  }, []);

  useEffect(() => {
    fetch(`/api/system/archives?retentionYears=${logRetentionYears}`)
      .then(res => res.json())
      .then(data => setArchiveFiles(data))
      .catch(err => console.error('Error fetching archives:', err));
  }, [logRetentionYears]);

  const triggerAlert = (message: string) => {
    setAlertMessage(message);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setAlertMessage('');
    }, 3000);
  };

  const handleInspectArchive = async (fileName: string) => {
    try {
      const res = await fetch(`/api/system/archives?file=${fileName}`);
      const data = await res.json();
      setSelectedArchiveName(fileName);
      setSelectedArchiveContents(data.contents || []);
      setArchiveSearch('');
    } catch (err) {
      console.error(err);
      alert('Failed to load archive details');
    }
  };

  const handleUpdateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/system/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: licenseKeyInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveModules(data.activeModules);
        setLicenseStatus(data.status || 'Verified & Active');
        setLicenseExpiry(data.expires || '9999-12-31');
        setIsReplacingLicense(false);
        triggerAlert('License replaced and validated successfully');
      } else {
        alert(data.error || 'Failed to replace license key');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error updating license: ' + err.message);
    }
  };

  // User Operations
  const handleOpenUserModal = (usr: AppUser | null = null) => {
    if (usr) {
      setEditingUser(usr);
      const nameParts = usr.name.split(' ');
      setUserForm({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: usr.email,
        roleId: usr.roleId || '',
        employeeCode: usr.employeeCode || ''
      });
    } else {
      setEditingUser(null);
      setUserForm({ firstName: '', lastName: '', email: '', roleId: roles[0]?.id || '', employeeCode: '' });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/core/users';
      const method = editingUser ? 'PUT' : 'POST';
      const payload = editingUser ? { id: editingUser.id, ...userForm } : userForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const saved = await res.json();

      if (editingUser) {
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...saved } : u));
        triggerAlert('User updated successfully');
      } else {
        setUsers([...users, saved]);
        triggerAlert('User created successfully');
      }
      setIsUserModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserStatus = async (usr: AppUser) => {
    try {
      const res = await fetch('/api/core/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: usr.id, isActive: !usr.isActive })
      });
      const updated = await res.json();
      setUsers(users.map(u => u.id === usr.id ? { ...u, isActive: updated.isActive } : u));
      triggerAlert(`User status set to ${updated.isActive ? 'Active' : 'Inactive'}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user account?')) return;
    try {
      await fetch(`/api/core/users?id=${id}`, { method: 'DELETE' });
      setUsers(users.filter(u => u.id !== id));
      triggerAlert('User account deleted');
    } catch (err) {
      console.error(err);
    }
  };

  // Role Operations
  const handleOpenRoleModal = (role: AppRole | null = null) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({ name: role.name, description: role.description || '', permissions: role.permissions });
    } else {
      setEditingRole(null);
      setRoleForm({ name: '', description: '', permissions: [] });
    }
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/core/roles';
      const method = editingRole ? 'PUT' : 'POST';
      const payload = editingRole ? { id: editingRole.id, ...roleForm } : roleForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const saved = await res.json();

      if (editingRole) {
        setRoles(roles.map(r => r.id === editingRole.id ? saved : r));
        triggerAlert('Role updated successfully');
      } else {
        setRoles([...roles, saved]);
        triggerAlert('Role created successfully');
      }
      setIsRoleModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleRoleModulePermission = async (roleId: string, moduleCode: string, verb: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const updatedPermissions = { ...role.permissions };
    if (!updatedPermissions[moduleCode]) {
      updatedPermissions[moduleCode] = {
        read: false, create: false, write: false, delete: false,
        print: false, report: false, import: false, export: false,
        share: false, email: false
      };
    }

    updatedPermissions[moduleCode][verb] = !updatedPermissions[moduleCode][verb];

    try {
      const res = await fetch('/api/core/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roleId, permissions: updatedPermissions })
      });
      const saved = await res.json();
      setRoles(roles.map(r => r.id === roleId ? saved : r));
      triggerAlert('Role module permissions matrix updated');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideUser) return;

    const currentOverrides = { ...(overrideUser.overrides || {}) };
    if (!currentOverrides[overrideModule]) {
      currentOverrides[overrideModule] = {};
    }

    if (overrideValue === 'INHERIT') {
      currentOverrides[overrideModule][overrideAction] = null;
    } else {
      currentOverrides[overrideModule][overrideAction] = overrideValue === 'ALLOW';
    }

    try {
      const res = await fetch('/api/core/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: overrideUser.id,
          overrides: currentOverrides
        })
      });
      const savedUser = await res.json();
      setUsers(users.map(u => u.id === overrideUser.id ? { ...u, overrides: savedUser.overrides } : u));
      setIsOverrideModalOpen(false);
      triggerAlert('User custom permission override updated');
    } catch (err) {
      console.error(err);
    }
  };

  // Tenant Operations
  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/core/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenant),
      });
      const data = await res.json();
      setTenant(data);
      setOriginalTenant(data);
      setIsTenantDirty(false);
      triggerAlert('Tenant profile updated successfully');

      // Refresh list of tenants
      fetch('/api/core/tenant?list=true')
        .then(res => res.json())
        .then(list => setAllTenants(list))
        .catch(err => console.error('Error fetching list of tenants:', err));
    } catch (err) {
      console.error(err);
      triggerAlert('Failed to update tenant profile');
    }
  };

  const handleDiscardTenantChanges = () => {
    if (originalTenant) {
      setTenant({ ...originalTenant });
      setIsTenantDirty(false);
      triggerAlert('Changes discarded');
    }
  };

  useEffect(() => {
    if (activeSection !== 'company' || companyTab !== 'metadata') return;
    
    const timer = setTimeout(() => {
      const form = document.getElementById('tenant-form');
      if (!form) return;

      const markDirty = () => {
        setIsTenantDirty(true);
      };

      form.addEventListener('input', markDirty);
      form.addEventListener('focusin', markDirty);
      form.addEventListener('change', markDirty);

      return () => {
        form.removeEventListener('input', markDirty);
        form.removeEventListener('focusin', markDirty);
        form.removeEventListener('change', markDirty);
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [activeSection, companyTab]);



  // Branch Operations
  const handleOpenBranchModal = (branch: Branch | null = null, parentBranchId: string | null = null) => {
    if (branch) {
      setEditingBranch(branch);
      setBranchForm({
        name: branch.name,
        region: branch.region,
        isHeadquarters: branch.isHeadquarters,
        address: branch.address || '',
        parentId: branch.parentId || '',
        registeredTin: branch.registeredTin || '',
        sssId: branch.sssId || '',
        philhealthId: branch.philhealthId || '',
        pagibigId: branch.pagibigId || '',
        birBranchCode: branch.birBranchCode || '',
        rdoCode: branch.rdoCode || '',
        entityType: branch.entityType || 'BRANCH'
      });
    } else {
      setEditingBranch(null);
      setBranchForm({
        name: '',
        region: '',
        isHeadquarters: false,
        address: '',
        parentId: parentBranchId || '',
        registeredTin: '',
        sssId: '',
        philhealthId: '',
        pagibigId: '',
        birBranchCode: '',
        rdoCode: '',
        entityType: 'BRANCH'
      });
    }
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/core/branches';
      const method = editingBranch ? 'PUT' : 'POST';
      const payload = editingBranch ? { id: editingBranch.id, ...branchForm } : branchForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const saved = await res.json();

      if (editingBranch) {
        setBranches(branches.map(b => b.id === editingBranch.id ? saved : b));
        triggerAlert('Branch updated successfully');
      } else {
        setBranches([...branches, saved]);
        triggerAlert('Branch created successfully');
      }
      setIsBranchModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    try {
      await fetch(`/api/core/branches?id=${id}`, { method: 'DELETE' });
      setBranches(branches.filter(b => b.id !== id));
      triggerAlert('Branch deleted successfully');
    } catch (err) {
      console.error(err);
    }
  };

  // Department Operations
  const handleOpenDeptModal = (dept: Department | null = null) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({ name: dept.name, branchId: dept.branchId, managerId: dept.managerId });
    } else {
      setEditingDept(null);
      setDeptForm({ name: '', branchId: selectedDeptBranchId || branches[0]?.id || '', managerId: employees[0]?.id || '' });
    }
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/core/departments';
      const method = editingDept ? 'PUT' : 'POST';
      const payload = editingDept ? { id: editingDept.id, ...deptForm } : deptForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const saved = await res.json();

      if (editingDept) {
        setDepartments(departments.map(d => d.id === editingDept.id ? saved : d));
        triggerAlert('Department updated successfully');
      } else {
        setDepartments([...departments, saved]);
        triggerAlert('Department created successfully');
      }
      setIsDeptModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await fetch(`/api/core/departments?id=${id}`, { method: 'DELETE' });
      setDepartments(departments.filter(d => d.id !== id));
      triggerAlert('Department deleted successfully');
    } catch (err) {
      console.error(err);
    }
  };

  // Workflow Operations
  const handleScheduleWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let parsedPayload: any = {};
      if (wfType === 'DATA_RETENTION_SCRUB') {
        parsedPayload = {
          employeeId: wfEmployeeId || (employees[0]?.id || 'EMP-003'),
          purgeDate: wfPurgeDate
        };
      } else if (wfType === 'LEAVE_APPROVAL_ESCALATION') {
        parsedPayload = {
          employeeId: wfEmployeeId || (employees[0]?.id || 'EMP-003'),
          managerId: wfManagerId || (employees[0]?.id || 'EMP-001'),
          escalationHours: parseInt(wfEscalationHours, 10) || 48
        };
      } else if (wfType === 'BIOMETRIC_PUNCH_SYNC') {
        parsedPayload = {
          terminalId: wfTerminalId
        };
      }

      const res = await fetch('/api/core/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowType: wfType, payload: parsedPayload }),
      });
      const saved = await res.json();
      setActiveWorkflows([saved, ...activeWorkflows]);
      setIsWfModalOpen(false);
      triggerAlert('Workflow scheduled and running');
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered branches & departments
  const filteredBranches = branches.filter(b =>
    b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
    b.region.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const filteredDepartments = departments.filter(d => {
    const matchesBranch = !selectedDeptBranchId || d.branchId === selectedDeptBranchId;
    const matchesSearch =
      d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d.branchName.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d.managerName.toLowerCase().includes(deptSearch.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  // Filtered Audit Logs
  const filteredLogs = auditLogs.filter((log: any) => {
    const matchesSearch =
      log.tableName.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.recordId.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.actorName.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.actionType.toLowerCase().includes(logSearch.toLowerCase());
    const matchesAction = logActionFilter === 'ALL' || log.actionType === logActionFilter;

    let matchesTab = true;
    if (logTab === 'transactions') {
      matchesTab = ['employees', 'departments', 'branches', 'roles', 'users'].includes(log.tableName);
    } else if (logTab === 'access') {
      matchesTab = log.tableName === 'system_access';
    } else if (logTab === 'actions') {
      matchesTab = ['documents_portal', 'reports_engine', 'payroll_registers'].includes(log.tableName);
    } else if (logTab === 'violations') {
      matchesTab = log.tableName === 'data_compliance' || log.actionType === 'LOGIN_FAILED' || log.actionType === 'VIOLATION';
    }

    return matchesSearch && matchesAction && matchesTab;
  });

  const renderBranchNode = (branch: Branch) => {
    const children = branches.filter(b => b.parentId === branch.id);
    const isExpanded = expandedBranches[branch.id] !== false;
    const toggleExpand = () => setExpandedBranches(prev => ({ ...prev, [branch.id]: !isExpanded }));

    return (
      <div key={branch.id} className="space-y-2">
        <div 
          className="flex flex-row items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:shadow-2xs transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {children.length > 0 ? (
              <button 
                type="button" 
                onClick={toggleExpand} 
                className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer shrink-0"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <div className="w-6 shrink-0" />
            )}
            
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-800 text-xs truncate">{branch.name}</span>
                {branch.isHeadquarters && (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-250 shrink-0">
                    HQ
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                {branch.region} {branch.address ? `• ${branch.address.replace(/\n/g, ', ')}` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-wider uppercase border ${
              branch.entityType === 'HOLDING' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/50' :
              branch.entityType === 'SUBSIDIARY' ? 'bg-purple-50 text-purple-700 border-purple-200/50' :
              branch.entityType === 'SISTER_COMPANY' ? 'bg-blue-50 text-blue-700 border-blue-200/50' :
              branch.entityType === 'AFFILIATE' ? 'bg-amber-50 text-amber-705 border-amber-200/50' :
              'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              {branch.entityType === 'HOLDING' ? 'Holding Company' :
               branch.entityType === 'SISTER_COMPANY' ? 'Sister Company' :
               branch.entityType === 'SUBSIDIARY' ? 'Subsidiary' :
               branch.entityType === 'AFFILIATE' ? 'Affiliate' : 'Branch'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenBranchModal(null, branch.id)}
                className="p-1 rounded hover:bg-indigo-50 text-indigo-650 cursor-pointer"
                title="Add Child Entity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleOpenBranchModal(branch)}
                className="p-1 rounded hover:bg-slate-100 text-slate-505 cursor-pointer"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeleteBranch(branch.id)}
                className="p-1 rounded hover:bg-red-50 text-red-500 cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {isExpanded && children.length > 0 && (
          <div className="border-l border-slate-200 pl-4 ml-6 space-y-2 relative">
            {children.map(child => renderBranchNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans pb-12 flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-white border-b border-slate-200 px-6 py-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center justify-center w-7 h-7 rounded bg-indigo-555/5 text-indigo-600 hover:bg-indigo-100 transition-colors">
            <Settings className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Link href="/" className="hover:text-slate-800">ABCD ERP System</Link>
            <span className="text-slate-350">/</span>
            <Link href="/core" className="hover:text-slate-800">Core Suite</Link>

            {activeSection && (
              <>
                <span className="text-slate-350">/</span>
                {activeSection === 'company' ? (
                  <>
                    <Link href="/core?section=company" className="hover:text-slate-800">Company Setup</Link>
                    <span className="text-slate-350">/</span>
                    <Link href={`/core?section=company&tab=${companyTab}`} className="text-slate-800 font-bold hover:underline">
                      {companyTab === 'metadata' ? 'Company Metadata' : companyTab === 'branches' ? 'Branches & Entities' : 'Departments'}
                    </Link>
                  </>
                ) : (
                  <Link href={`/core?section=${activeSection}`} className="text-slate-800 font-bold hover:underline">
                    {activeSection === 'users' ? 'Users' :
                      activeSection === 'roles' ? 'Roles & Permissions' :
                        activeSection === 'settings' ? 'General Settings' :
                          activeSection === 'privacy' ? 'Data Privacy' :
                            activeSection === 'workflows' ? 'Workflows' :
                              activeSection === 'logs' ? 'Audit Logs' :
                                activeSection === 'licensing' ? 'Licensing' : activeSection}
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span className="text-indigo-600 cursor-default">Core Setup</span>
            <Link href="/hris" className="hover:text-slate-800">HRIS</Link>
            <Link href="/timekeeping" className="hover:text-slate-800">Timekeeping</Link>
            <Link href="/payroll" className="hover:text-slate-800">Payroll</Link>
          </nav>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64&q=80" alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Save Status Alert Banner */}
      {saveSuccess && (
        <div className="fixed top-[72px] right-6 z-50 p-3 bg-emerald-50 border border-emerald-250 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2 max-w-md shadow-lg">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {alertMessage || 'Saved'}
        </div>
      )}

      {/* Main Core Layout: Dashboard Panel */}
      <div className="flex-1 flex flex-col mt-6 px-6 pb-12">

        {/* Module Details display */}
        <main className="flex-1 min-w-0">

          {/* SECTION 1: COMPANY SETUP (Consolidated Company Metadata, Associated Entities & Branches, and Departments) */}
          {activeSection === 'company' && (
            <Card className="bg-white border-slate-200 shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600 shrink-0" />
                    <CardTitle className="text-base font-bold text-slate-900">Company Setup</CardTitle>
                    {isTenantDirty && companyTab === 'metadata' && (
                      <span className="bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-rose-200/50 inline-flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        * Not Saved
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-xs text-slate-400">Configure global metadata profile descriptors, associated entities/branches, and cost center departments.</CardDescription>
                </div>
                {companyTab === 'metadata' && (
                  <div className="flex items-center gap-2">
                    {isTenantDirty && (
                      <Button 
                        type="button" 
                        onClick={handleDiscardTenantChanges} 
                        className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs px-3 h-8 rounded-lg cursor-pointer"
                      >
                        Discard Changes
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      form="tenant-form" 
                      className={`text-white font-semibold text-xs px-4 h-8 rounded-lg cursor-pointer shrink-0 transition-all duration-300 ${
                        isTenantDirty ? 'bg-rose-600 hover:bg-rose-500 shadow-md ring-2 ring-rose-200' : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      Update Company Profile
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Submenu tabs */}
                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1 overflow-x-auto px-1.5 py-1">
                  <button
                    onClick={() => setCompanyTab('metadata')}
                    className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-md transition-all cursor-pointer ${companyTab === 'metadata'
                        ? 'bg-slate-900 text-white font-bold'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                  >
                    Company Metadata
                  </button>
                  <button
                    onClick={() => setCompanyTab('branches')}
                    className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-md transition-all cursor-pointer ${companyTab === 'branches'
                        ? 'bg-slate-900 text-white font-bold'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                  >
                    Branches & Entities
                  </button>
                  <button
                    onClick={() => setCompanyTab('departments')}
                    className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-md transition-all cursor-pointer ${companyTab === 'departments'
                        ? 'bg-slate-900 text-white font-bold'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                  >
                    Departments
                  </button>
                </div>

                {/* Sub-tab contents */}
                {companyTab === 'metadata' && (
                  <form id="tenant-form" onSubmit={handleSaveTenant} className="space-y-6 pt-2">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left: Logo Preview & Selector */}
                      <div className="flex flex-col items-center gap-3 shrink-0 p-4 border border-slate-200 rounded-xl bg-slate-50/50 min-w-[160px]">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Company Logo</span>
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center shadow-3xs group">
                          {tenant.logoUrl ? (
                            <img src={tenant.logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-[10px] text-slate-400">No Logo</div>
                          )}
                        </div>

                        {/* Hidden File Input */}
                        <input
                          type="file"
                          id="logo-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setTenant({ ...tenant, logoUrl: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                          className="w-full bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 text-[10px] h-8 font-semibold rounded-lg shadow-3xs cursor-pointer"
                        >
                          Change Logo
                        </Button>
                        <span className="text-[9px] text-slate-400 text-center">Supports PNG, JPG (Max 2MB)</span>
                      </div>

                      {/* Right: Grid of details */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-4">
                        {/* Subsection: General Information */}
                        <div className="md:col-span-3">
                          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 mb-2.5">General Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <Label htmlFor="corporateName" className="text-xs text-slate-605 font-bold">Corporate Name</Label>
                              <Input
                                id="corporateName"
                                value={tenant.corporateName || ''}
                                onChange={(e) => setTenant({ ...tenant, corporateName: e.target.value })}
                                className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900 focus:bg-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="industry" className="text-xs text-slate-605 font-bold">Industry Sector</Label>
                              <Input
                                id="industry"
                                value={tenant.industry || ''}
                                onChange={(e) => setTenant({ ...tenant, industry: e.target.value })}
                                className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900 focus:bg-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="secRegistration" className="text-xs text-slate-605 font-bold">SEC Registration Number</Label>
                              <Input
                                id="secRegistration"
                                value={tenant.secRegistration || ''}
                                onChange={(e) => setTenant({ ...tenant, secRegistration: e.target.value })}
                                className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900 focus:bg-white"
                                placeholder="e.g. SEC-CS201509876"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="companyType" className="text-xs text-slate-605 font-bold">Company Structure</Label>
                              <Select
                                value={tenant.companyType || 'OPERATING'}
                                onValueChange={(val) => setTenant({ ...tenant, companyType: val || 'OPERATING' })}
                              >
                                <SelectTrigger id="companyType" className="bg-slate-50 border-slate-200 text-xs h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-slate-200 text-slate-707 text-xs">
                                  <SelectItem value="OPERATING">Standalone Operating Company</SelectItem>
                                  <SelectItem value="HOLDING">Parent Holding Company</SelectItem>
                                  <SelectItem value="SUBSIDIARY">Subsidiary Company</SelectItem>
                                  <SelectItem value="SISTER">Sister Company</SelectItem>
                                  <SelectItem value="BRANCH">Branch / Division Company</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="parentTenantId" className="text-xs text-slate-605 font-bold">Parent Company / Head Office</Label>
                              <Select
                                value={tenant.parentTenantId || 'none'}
                                onValueChange={(val) => setTenant({ ...tenant, parentTenantId: val === 'none' ? '' : (val || '') })}
                                disabled={!['SUBSIDIARY', 'SISTER', 'BRANCH'].includes(tenant.companyType || '')}
                              >
                                <SelectTrigger id="parentTenantId" className="bg-slate-50 border-slate-200 text-xs h-8">
                                  <SelectValue placeholder="Select parent entity..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-slate-200 text-slate-707 text-xs">
                                  <SelectItem value="none">None / Independent</SelectItem>
                                  {allTenants
                                    .filter(t => t.id !== tenant.id)
                                    .map(t => (
                                      <SelectItem key={t.id} value={t.id}>{t.corporateName}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Subsection: Tax Information */}
                        <div className="md:col-span-3 border-t border-slate-100 pt-4">
                          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 mb-2.5">Tax Registration (TIN / BIR / RDO)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <Label htmlFor="registeredTin" className="text-xs text-slate-605 font-bold">Registered TIN</Label>
                              <Input
                                id="registeredTin"
                                value={tenant.registeredTin || ''}
                                onChange={(e) => setTenant({ ...tenant, registeredTin: e.target.value })}
                                className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900 focus:bg-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="birBranchCode" className="text-xs text-slate-605 font-bold">BIR Branch Code</Label>
                              <Input
                                id="birBranchCode"
                                value={tenant.birBranchCode || ''}
                                onChange={(e) => setTenant({ ...tenant, birBranchCode: e.target.value })}
                                className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900 focus:bg-white"
                                placeholder="e.g. 00000"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="rdoCode" className="text-xs text-slate-605 font-bold">RDO Code</Label>
                              <Input
                                id="rdoCode"
                                value={tenant.rdoCode || ''}
                                onChange={(e) => setTenant({ ...tenant, rdoCode: e.target.value })}
                                className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900 focus:bg-white"
                                placeholder="e.g. 047"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Subsection: Statutory Benefits */}
                        <div className="md:col-span-3 border-t border-slate-100 pt-4">
                          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 mb-2.5">Statutory Identifiers (SSS / PhilHealth / Pag-IBIG)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <Label htmlFor="sssId" className="text-xs text-slate-605 font-bold">SSS Employer Number</Label>
                              <Input
                                id="sssId"
                                value={tenant.sssId || ''}
                                onChange={(e) => setTenant({ ...tenant, sssId: e.target.value })}
                                className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900 focus:bg-white"
                                placeholder="e.g. 03-9123456-7"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="philhealthId" className="text-xs text-slate-605 font-bold">PhilHealth Number (PEN)</Label>
                              <Input
                                id="philhealthId"
                                value={tenant.philhealthId || ''}
                                onChange={(e) => setTenant({ ...tenant, philhealthId: e.target.value })}
                                className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900 focus:bg-white"
                                placeholder="e.g. 01-023456789-1"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="pagibigId" className="text-xs text-slate-605 font-bold">Pag-IBIG Employer ID</Label>
                              <Input
                                id="pagibigId"
                                value={tenant.pagibigId || ''}
                                onChange={(e) => setTenant({ ...tenant, pagibigId: e.target.value })}
                                className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900 focus:bg-white"
                                placeholder="e.g. 1210-9876-5432"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Subsection: Contact & Location */}
                        <div className="md:col-span-3 border-t border-slate-100 pt-4">
                          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 mb-2.5">Contact & Location</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <Label htmlFor="telephone" className="text-xs text-slate-605 font-bold">Telephone Number</Label>
                              <Input
                                id="telephone"
                                value={tenant.telephone || ''}
                                onChange={(e) => setTenant({ ...tenant, telephone: e.target.value })}
                                className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900 focus:bg-white"
                                placeholder="e.g. +63 (2) 8888-1234"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="email" className="text-xs text-slate-605 font-bold">Corporate Email</Label>
                              <Input
                                id="email"
                                value={tenant.email || ''}
                                onChange={(e) => setTenant({ ...tenant, email: e.target.value })}
                                className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900 focus:bg-white"
                                placeholder="e.g. info@company.com"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="website" className="text-xs text-slate-605 font-bold">Company Website URL</Label>
                              <Input
                                id="website"
                                value={tenant.website || ''}
                                onChange={(e) => setTenant({ ...tenant, website: e.target.value })}
                                className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900 focus:bg-white"
                                placeholder="e.g. https://www.company.com"
                              />
                            </div>
                            <div className="space-y-1 md:col-span-3">
                              <Label htmlFor="address" className="text-xs text-slate-605 font-bold">Registered Corporate Address</Label>
                              <textarea
                                id="address"
                                value={tenant.address || ''}
                                onChange={(e) => setTenant({ ...tenant, address: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-805 focus:bg-white focus:outline-none min-h-[80px]"
                                placeholder="Enter full multiline address..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </form>
                )}

                {companyTab === 'branches' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-row items-center justify-between pb-1">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Associated Entities & Branches</h4>
                        <p className="text-xs text-slate-400">Manage company branches, subsidiaries, sister companies, and affiliate structures.</p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleOpenBranchModal()}
                        className="bg-indigo-600 hover:bg-indigo-505 text-white font-semibold text-xs px-3 h-8 rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        New Entity / Branch
                      </Button>
                    </div>

                    {/* Search input */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <Input
                        placeholder="Search associated entities..."
                        value={branchSearch}
                        onChange={(e) => setBranchSearch(e.target.value)}
                        className="pl-8 bg-slate-50 border-slate-200 text-xs h-8"
                      />
                    </div>

                    {branchSearch ? (
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-455">
                              <th className="px-4 py-2.5">Entity / Branch Name</th>
                              <th className="px-4 py-2.5">Geographical Region</th>
                              <th className="px-4 py-2.5">Physical Address</th>
                              <th className="px-4 py-2.5">HQ Status</th>
                              <th className="px-4 py-2.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {filteredBranches.map((branch) => (
                              <tr key={branch.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 font-semibold text-slate-800">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-semibold text-slate-805">{branch.name}</span>
                                    <span className={`self-start text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-wider uppercase border ${branch.entityType === 'SUBSIDIARY' ? 'bg-purple-50 text-purple-700 border-purple-200/50' :
                                        branch.entityType === 'SISTER_COMPANY' ? 'bg-blue-50 text-blue-700 border-blue-200/50' :
                                          branch.entityType === 'AFFILIATE' ? 'bg-amber-50 text-amber-705 border-amber-200/50' :
                                            'bg-slate-50 text-slate-700 border-slate-200'
                                      }`}>
                                      {branch.entityType === 'HOLDING' ? 'Holding Company' :
                                        branch.entityType === 'SISTER_COMPANY' ? 'Sister Company' :
                                          branch.entityType === 'SUBSIDIARY' ? 'Subsidiary' :
                                            branch.entityType === 'AFFILIATE' ? 'Affiliate' : 'Branch'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-slate-550">{branch.region || '—'}</td>
                                <td className="px-4 py-3 text-slate-500 font-medium truncate max-w-[200px]" title={branch.address}>
                                  {branch.address || '—'}
                                </td>
                                <td className="px-4 py-3">
                                  {branch.isHeadquarters ? (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                                      Headquarters
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">Regular</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleOpenBranchModal(branch)}
                                      className="p-1 rounded hover:bg-slate-100 text-slate-505 cursor-pointer"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteBranch(branch.id)}
                                      className="p-1 rounded hover:bg-red-50 text-red-500 cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {branches
                          .filter(b => !b.parentId || !branches.some(p => p.id === b.parentId))
                          .map(root => renderBranchNode(root))}
                      </div>
                    )}
                  </div>
                )}

                {companyTab === 'departments' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-row items-center justify-between pb-1">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Organizational Departments</h4>
                        <p className="text-xs text-slate-400">Configure cost centers, manager bindings, and branch mapping.</p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleOpenDeptModal()}
                        className="bg-indigo-600 hover:bg-indigo-555 text-white font-semibold text-xs px-3 h-8 rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        New Department
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="space-y-1 md:col-span-2">
                        <Label htmlFor="dept-branch-selector" className="text-xs text-slate-605 font-bold">Select Corporate Entity / Branch</Label>
                        <Select
                          value={selectedDeptBranchId || 'all'}
                          onValueChange={(val) => setSelectedDeptBranchId(val === 'all' ? '' : (val ?? ''))}
                        >
                          <SelectTrigger id="dept-branch-selector" className="bg-white border-slate-200 text-xs h-8 text-slate-900">
                            <SelectValue placeholder="All Entities">
                              {branches.find(b => b.id === selectedDeptBranchId)?.name || "All Corporate Entities & Branches"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-slate-200 text-slate-700 text-xs">
                            <SelectItem value="all">All Corporate Entities & Branches</SelectItem>
                            {branches.map(b => (
                              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="relative">
                        <Label className="text-xs text-slate-655 font-bold">Search within departments</Label>
                        <div className="relative mt-1">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <Input
                            placeholder="Search departments..."
                            value={deptSearch}
                            onChange={(e) => setDeptSearch(e.target.value)}
                            className="pl-8 bg-white border-slate-200 text-xs h-8"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left border-collapse">

                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-455">
                            <th className="px-4 py-2.5">Department</th>
                            <th className="px-4 py-2.5">Branch Location</th>
                            {activeModules.includes('HUMAN_RESOURCES') && (
                              <>
                                <th className="px-4 py-2.5">Department Manager</th>
                                <th className="px-4 py-2.5">Staff Count</th>
                              </>
                            )}
                            <th className="px-4 py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {filteredDepartments.map((dept) => (
                            <tr key={dept.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-semibold text-slate-800">{dept.name}</td>
                              <td className="px-4 py-3 text-slate-500">{dept.branchName}</td>
                              {activeModules.includes('HUMAN_RESOURCES') && (
                                <>
                                  <td className="px-4 py-3 font-mono text-[11px] text-indigo-700">{dept.managerName || '—'}</td>
                                  <td className="px-4 py-3 font-semibold text-slate-600">{dept.staffCount} Staff</td>
                                </>
                              )}
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenDeptModal(dept)}
                                    className="p-1 rounded hover:bg-slate-100 text-slate-505 cursor-pointer"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDept(dept.id)}
                                    className="p-1 rounded hover:bg-red-50 text-red-500 cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* SECTION 3: SYSTEM CONFIGS */}
          {activeSection === 'settings' && (
            <div className="space-y-6">
              {/* Tab options bar */}
              <div className="w-full bg-white border border-slate-200 rounded-lg flex items-center gap-1 overflow-x-auto px-2 py-1 shadow-2xs">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-md transition-all cursor-pointer ${activeTab === tab
                        ? 'bg-slate-900 text-white font-bold'
                        : 'text-slate-450 hover:bg-slate-50 hover:text-slate-750'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Configurations Pane */}
              <Card className="bg-white border-slate-200 shadow-2xs">
                <CardContent className="pt-6">
                  {activeTab === 'Details' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-600 font-semibold">Country</Label>
                          <Input value={country} onChange={(e) => setCountry(e.target.value)} className="bg-slate-50 text-xs h-8 text-slate-900" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-600 font-semibold">Language</Label>
                          <Select value={language} onValueChange={(val) => setLanguage(val || '')}>
                            <SelectTrigger className="bg-slate-50 text-xs h-8"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white border border-slate-200 text-slate-700 text-xs">
                              <SelectItem value="en">English (en)</SelectItem>
                              <SelectItem value="fr">Français (fr)</SelectItem>
                              <SelectItem value="fil">Filipino (fil)</SelectItem>
                              <SelectItem value="es">Español (es)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-600 font-semibold">First Day of the Week</Label>
                          <Select value={firstDayOfWeek} onValueChange={(val) => setFirstDayOfWeek(val || '')}>
                            <SelectTrigger className="bg-slate-50 text-xs h-8"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white border border-slate-200 text-slate-705 text-xs">
                              <SelectItem value="Sunday">Sunday</SelectItem>
                              <SelectItem value="Monday">Monday</SelectItem>
                              <SelectItem value="Saturday">Saturday</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-600 font-semibold">Time Zone</Label>
                          <Select value={timezone} onValueChange={(val) => setTimezone(val || '')}>
                            <SelectTrigger className="bg-slate-50 text-xs h-8"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white border border-slate-200 text-slate-705 text-xs">
                              <SelectItem value="Asia/Manila">Asia/Manila</SelectItem>
                              <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                              <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
                              <SelectItem value="UTC">UTC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-600 font-semibold">Currency</Label>
                          <Select value={currency} onValueChange={(val) => setCurrency(val || '')}>
                            <SelectTrigger className="bg-slate-50 text-xs h-8"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white border border-slate-200 text-slate-705 text-xs">
                              <SelectItem value="PHP">Philippine Peso (₱)</SelectItem>
                              <SelectItem value="USD">US Dollar ($)</SelectItem>
                              <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                              <SelectItem value="SGD">Singapore Dollar (S$)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="pt-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="onboarding" checked={enableOnboarding} onChange={(e) => setEnableOnboarding(e.target.checked)} className="rounded text-indigo-650 w-3.5 h-3.5 cursor-pointer" />
                            <Label htmlFor="onboarding" className="text-xs text-slate-700 font-semibold cursor-pointer">Enable Onboarding workflows</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="docsharing" checked={disableDocSharing} onChange={(e) => setDisableDocSharing(e.target.checked)} className="rounded text-indigo-650 w-3.5 h-3.5 cursor-pointer" />
                            <Label htmlFor="docsharing" className="text-xs text-slate-700 font-semibold cursor-pointer">Disable Document Sharing portal</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Login' && (
                    <div className="space-y-4 max-w-md">
                      <div className="flex items-center gap-2 mb-2">
                        <input type="checkbox" id="social-auth" checked={allowGoogleLogin} onChange={(e) => setAllowGoogleLogin(e.target.checked)} className="rounded text-indigo-650 w-3.5 h-3.5 cursor-pointer" />
                        <Label htmlFor="social-auth" className="text-xs text-slate-750 font-semibold cursor-pointer">Allow Social Authentication (Google OAuth)</Label>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-600 font-semibold">Portal Session Timeout (seconds)</Label>
                        <Input value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} className="bg-slate-50 text-xs h-8 text-slate-900" />
                      </div>
                    </div>
                  )}

                  {activeTab === 'Password' && (
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-600 font-semibold">Minimum Required Password Length</Label>
                        <Input type="number" value={minPasswordLength} onChange={(e) => setMinPasswordLength(e.target.value)} className="bg-slate-50 text-xs h-8" />
                      </div>
                    </div>
                  )}

                  {activeTab === 'Email' && (
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-600 font-semibold">SMTP Host Server</Label>
                        <Input value={smtpServer} onChange={(e) => setSmtpServer(e.target.value)} className="bg-slate-50 text-xs h-8" />
                      </div>
                    </div>
                  )}

                  {activeTab === 'Files' && (
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-600 font-semibold">Max Attachment Upload Limit</Label>
                        <Input value={maxFileSize} onChange={(e) => setMaxFileSize(e.target.value)} className="bg-slate-50 text-xs h-8" />
                      </div>
                    </div>
                  )}

                  {['App', 'Display', 'Backups', 'Advanced'].includes(activeTab) && (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <SlidersHorizontal className="w-8 h-8 mx-auto text-slate-300" />
                      <h4 className="text-xs font-semibold text-slate-700">{activeTab} Bindings Configuration</h4>
                      <p className="text-[11px] text-slate-450">Advanced module metadata rules will be parsed here dynamically.</p>
                    </div>
                  )}

                  <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
                    <Button onClick={() => triggerAlert(`${activeTab} configs updated successfully`)} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 h-8">
                      Save configurations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SECTION 4: AUDIT TRAIL LOGS */}
          {activeSection === 'logs' && (
            <Card className="bg-white border-slate-200 shadow-2xs">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900">Audit Trail Ledger</CardTitle>
                <CardDescription className="text-xs text-slate-400">Append-only log verifying user access changes and database transactions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sub-tabs for grouped logs */}
                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1 overflow-x-auto px-1.5 py-1">
                  {(['all', 'transactions', 'access', 'actions', 'violations', 'archives'] as const).map((tab) => {
                    const labelMap = {
                      all: 'All Logs',
                      transactions: 'DB Transactions',
                      access: 'Access & Session',
                      actions: 'User Actions',
                      violations: 'Violations & Security',
                      archives: 'Archived Backups (MinIO)',
                    };
                    return (
                      <button
                        key={tab}
                        onClick={() => {
                          setLogTab(tab);
                          if (tab !== 'archives') {
                            setSelectedArchiveName('');
                          }
                        }}
                        className={`px-3 py-1 text-xs font-semibold whitespace-nowrap rounded-md transition-all cursor-pointer ${logTab === tab
                            ? 'bg-slate-900 text-white font-bold'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                          }`}
                      >
                        {labelMap[tab]}
                      </button>
                    );
                  })}
                </div>

                {logTab !== 'archives' ? (
                  <>
                    {/* Search & Action filter bar */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input
                          placeholder="Search by table, record ID, actor, or action..."
                          value={logSearch}
                          onChange={(e) => setLogSearch(e.target.value)}
                          className="pl-8 bg-slate-50 border-slate-200 text-xs h-8"
                        />
                      </div>
                      <Select value={logActionFilter} onValueChange={(val) => setLogActionFilter(val || '')}>
                        <SelectTrigger className="w-[150px] bg-slate-50 text-xs h-8"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white border border-slate-200 text-xs text-slate-700">
                          <SelectItem value="ALL">All Action Verbs</SelectItem>
                          <SelectItem value="INSERT">INSERT</SelectItem>
                          <SelectItem value="UPDATE">UPDATE</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                          <SelectItem value="LOGIN">LOGIN</SelectItem>
                          <SelectItem value="LOGOUT">LOGOUT</SelectItem>
                          <SelectItem value="LOGIN_FAILED">LOGIN_FAILED</SelectItem>
                          <SelectItem value="VIOLATION">VIOLATION</SelectItem>
                          <SelectItem value="VIEW">VIEW</SelectItem>
                          <SelectItem value="PRINT">PRINT</SelectItem>
                          <SelectItem value="EXPORT">EXPORT</SelectItem>
                          <SelectItem value="GENERATE">GENERATE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Logs Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-450">
                            <th className="px-4 py-2.5">Date / Time</th>
                            <th className="px-4 py-2.5">Context Source</th>
                            <th className="px-4 py-2.5">Action Type</th>
                            <th className="px-4 py-2.5">Record/Context ID</th>
                            <th className="px-4 py-2.5">User Actor</th>
                            <th className="px-4 py-2.5 text-right">View Data/Payload</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {filteredLogs.map((log) => (
                            <tr key={log.logId} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 text-slate-450 font-mono text-[10px]">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-800">{log.tableName}</td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${log.actionType === 'INSERT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' :
                                    log.actionType === 'UPDATE' ? 'bg-sky-50 text-sky-700 border-sky-200/50' :
                                      log.actionType === 'DELETE' ? 'bg-rose-50 text-rose-700 border-rose-200/50' :
                                        log.actionType === 'LOGIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/50' :
                                          log.actionType === 'LOGOUT' ? 'bg-slate-100 text-slate-600 border-slate-200/50' :
                                            log.actionType === 'LOGIN_FAILED' ? 'bg-red-50 text-red-700 border-red-200/50 animate-pulse' :
                                              log.actionType === 'VIOLATION' ? 'bg-amber-50 text-amber-800 border-amber-200/50 font-extrabold animate-pulse' :
                                                log.actionType === 'PRINT' ? 'bg-teal-50 text-teal-700 border-teal-200/50' :
                                                  log.actionType === 'EXPORT' ? 'bg-orange-50 text-orange-700 border-orange-200/50' :
                                                    log.actionType === 'GENERATE' ? 'bg-purple-50 text-purple-700 border-purple-200/50' :
                                                      'bg-slate-50 text-slate-700 border-slate-200/50'
                                  }`}>
                                  {log.actionType}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{log.recordId}</td>
                              <td className="px-4 py-3 text-slate-650 font-medium">{log.actorName}</td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => setSelectedLog(log)}
                                  className="p-1 rounded hover:bg-slate-100 text-indigo-600 cursor-pointer"
                                  title="Compare Data Diff"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    {/* Archive Files List Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {archiveFiles.map((file) => (
                        <div key={file.fileName} className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${selectedArchiveName === file.fileName
                            ? 'bg-indigo-50/40 border-indigo-205 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}>
                          <div className="space-y-1">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-800 text-xs truncate max-w-[80%]">{file.fileName}</span>
                              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-mono rounded">
                                {file.fileSize}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">Date Range: <span className="font-medium text-slate-600">{file.dateRange}</span></p>
                            <p className="text-[10px] text-slate-400">MinIO Bucket: <span className="font-mono text-[9px] text-slate-500">{file.bucket}</span></p>
                            <p className="text-[10px] text-slate-400">Scheduled Purge: <span className="font-semibold text-rose-600">{file.purgeDate}</span></p>
                            <p className="text-[10px] text-indigo-650 font-semibold">{file.recordsCount.toLocaleString()} archived records</p>
                          </div>

                          <div className="flex gap-2 w-full">
                            <Button
                              onClick={() => handleInspectArchive(file.fileName)}
                              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] h-7 font-bold"
                            >
                              Inspect Archive
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => triggerAlert(`Downloading ${file.fileName} from MinIO bucket...`)}
                              className="flex-1 text-[10px] h-7 border-slate-300 text-slate-700 hover:bg-slate-100"
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Inspected Archive Contents Panel */}
                    {selectedArchiveName && (
                      <div className="border border-slate-200 rounded-xl bg-white p-4 space-y-4 shadow-3xs animate-fadeIn">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">Inspecting Cold Storage File: <span className="text-indigo-600 font-mono">{selectedArchiveName}</span></h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">Browsing in-memory stream contents parsed from gzip archive.</p>
                          </div>
                          <button
                            onClick={() => setSelectedArchiveName('')}
                            className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                          >
                            Close Inspector
                          </button>
                        </div>

                        {/* Archive Inner Search */}
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <Input
                            placeholder="Filter within this archive by source, action, or actor..."
                            value={archiveSearch}
                            onChange={(e) => setArchiveSearch(e.target.value)}
                            className="pl-8 bg-slate-50 border-slate-200 text-xs h-8"
                          />
                        </div>

                        {/* Archive Contents Table */}
                        <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[300px] overflow-y-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-450 sticky top-0">
                                <th className="px-4 py-2">Date / Time</th>
                                <th className="px-4 py-2">Context</th>
                                <th className="px-4 py-2">Action</th>
                                <th className="px-4 py-2">Record ID</th>
                                <th className="px-4 py-2">Actor</th>
                                <th className="px-4 py-2 text-right">Metadata Payload</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[11px]">
                              {selectedArchiveContents
                                .filter(r =>
                                  r.tableName.toLowerCase().includes(archiveSearch.toLowerCase()) ||
                                  r.actionType.toLowerCase().includes(archiveSearch.toLowerCase()) ||
                                  r.actorName.toLowerCase().includes(archiveSearch.toLowerCase()) ||
                                  r.recordId.toLowerCase().includes(archiveSearch.toLowerCase())
                                )
                                .map((row) => (
                                  <tr key={row.logId} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-2.5 font-mono text-[9px] text-slate-400">
                                      {new Date(row.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2.5 font-semibold text-slate-750">{row.tableName}</td>
                                    <td className="px-4 py-2.5">
                                      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full border ${row.actionType === 'LOGIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/50' :
                                          row.actionType === 'VIOLATION' ? 'bg-amber-50 text-amber-800 border-amber-200/50' :
                                            row.actionType === 'EXPORT' ? 'bg-orange-50 text-orange-700 border-orange-200/50' :
                                              'bg-slate-50 text-slate-700 border-slate-200/50'
                                        }`}>
                                        {row.actionType}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-[10px] text-slate-450">{row.recordId}</td>
                                    <td className="px-4 py-2.5 text-slate-600">{row.actorName}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-[9px] text-slate-400">
                                      {JSON.stringify(row.newData)}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* SECTION 5: LICENSE CARD */}
          {activeSection === 'licensing' && (
            <Card className="bg-white border-slate-200 shadow-2xs">
              <CardHeader className="border-b border-slate-100 bg-slate-50/40">
                <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-650" />
                  Active Tenant License Binding
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 text-xs space-y-4">
                <div>
                  <h4 className="font-bold text-slate-805 text-sm">Authentication Signature Verified</h4>
                  <p className="text-slate-400 text-[10px] mt-0.5">RSA-256 cryptographically authenticated active module parameters.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Client Tenant registration</span>
                    <strong className="text-slate-800 text-sm block mt-1">{tenant.corporateName || 'acme-corp'}</strong>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">License Status</span>
                    <strong className={`text-sm block mt-1 ${licenseStatus.includes('Invalid') ? 'text-rose-600' : 'text-emerald-700'}`}>{licenseStatus}</strong>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Validity / Expiry Date</span>
                    <strong className="text-slate-805 text-sm block mt-1">{licenseExpiry}</strong>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h5 className="font-bold text-slate-700 mb-2">Licensed Modules</h5>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full font-semibold border ${activeModules.includes('HUMAN_RESOURCES')
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-850 border-amber-200'
                      }`}>
                      Human Resources Module {activeModules.includes('HUMAN_RESOURCES') ? '• Active' : '• Locked'}
                    </span>
                    <span className={`px-3 py-1 rounded-full font-semibold border ${activeModules.includes('TIMEKEEPING')
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-850 border-amber-200'
                      }`}>
                      Timekeeping Module {activeModules.includes('TIMEKEEPING') ? '• Active' : '• Locked'}
                    </span>
                    <span className={`px-3 py-1 rounded-full font-semibold border ${activeModules.includes('PAYROLL')
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-850 border-amber-200'
                      }`}>
                      Payroll Module {activeModules.includes('PAYROLL') ? '• Active' : '• Locked'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <div>
                    <h5 className="font-bold text-slate-700">Update / Replace License Key</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Paste a raw, base64-encoded signature token to unlock enterprise submodules.</p>
                  </div>

                  <form onSubmit={handleUpdateLicense} className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="space-y-1">
                      <Label htmlFor="license-key-input" className="text-xs font-semibold text-slate-700">RSA License Cryptotoken</Label>
                      <textarea
                        id="license-key-input"
                        rows={4}
                        value={licenseKeyInput}
                        onChange={(e) => setLicenseKeyInput(e.target.value)}
                        placeholder="eyJ0ZW5hbnRfaWQiOiJhY21lLWNvcnAiLCJtb2R1bGVzIjpbIlBBWVJPTEwiLCJUSU1FS0VFUElORyJdLCJleHBpcmVzIjoiOTk5OS0xMi0zMSJ9.agB0pPFK..."
                        className="w-full text-xs font-mono p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 resize-y"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-550 text-white text-xs h-8 px-4 font-semibold"
                      >
                        Validate & Apply License
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 6: DATA PRIVACY */}
          {activeSection === 'privacy' && (
            <div className="space-y-6">
              {/* Sub-tabs menu */}
              <div className="w-full bg-white border border-slate-200 rounded-lg flex items-center gap-1 overflow-x-auto px-2 py-1 shadow-2xs">
                <button
                  onClick={() => setPrivacyTab('consent')}
                  className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-md transition-all cursor-pointer ${privacyTab === 'consent'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-455 hover:bg-slate-50 hover:text-slate-750'
                    }`}
                >
                  Consent Logs Register
                </button>
                <button
                  onClick={() => setPrivacyTab('retention')}
                  className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-md transition-all cursor-pointer ${privacyTab === 'retention'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-455 hover:bg-slate-50 hover:text-slate-750'
                    }`}
                >
                  Retention & Shredding Rules
                </button>
              </div>

              {/* Consent Tab */}
              {privacyTab === 'consent' && (
                <Card className="bg-white border-slate-200 shadow-2xs">
                  <CardHeader>
                    <CardTitle className="text-base font-bold text-slate-900">DPA 2012 Consent Log Register</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Verifiable, immutable registry of employee data processing consents.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <Input
                        placeholder="Search by Employee or IP..."
                        value={consentSearch}
                        onChange={(e) => setConsentSearch(e.target.value)}
                        className="pl-8 bg-slate-50 border-slate-200 text-xs h-8"
                      />
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-450">
                            <th className="px-4 py-2.5">Date Accepted</th>
                            <th className="px-4 py-2.5">Employee Name</th>
                            <th className="px-4 py-2.5">Policy Version</th>
                            <th className="px-4 py-2.5">PI Consent</th>
                            <th className="px-4 py-2.5">SPI Consent</th>
                            <th className="px-4 py-2.5">IP Address</th>
                            <th className="px-4 py-2.5 text-right">Settings Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {consentLogs
                            .filter(log =>
                              log.employeeName.toLowerCase().includes(consentSearch.toLowerCase()) ||
                              log.ipAddress.toLowerCase().includes(consentSearch.toLowerCase())
                            )
                            .map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 font-mono text-[10px] text-slate-400">
                                  {new Date(log.consentedAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-800">{log.employeeName} ({log.employeeId})</td>
                                <td className="px-4 py-3 text-slate-505 font-medium">{log.policyVersion}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${log.consentPi ? 'bg-emerald-50 text-emerald-750 border-emerald-250/20' : 'bg-rose-50 text-rose-750 border-rose-250/20'
                                    }`}>
                                    {log.consentPi ? 'Granted' : 'Revoked'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${log.consentSpi ? 'bg-emerald-50 text-emerald-750 border-emerald-250/20' : 'bg-rose-50 text-rose-750 border-rose-250/20'
                                    }`}>
                                    {log.consentSpi ? 'Granted' : 'Revoked'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-500">{log.ipAddress}</td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedConsent(log)}
                                    className="p-1 rounded hover:bg-slate-100 text-indigo-650 cursor-pointer"
                                    title="View Granular Permissions"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Retention Tab */}
              {privacyTab === 'retention' && (
                <div className="space-y-6">
                  <Card className="bg-white border-slate-200 shadow-2xs">
                    <CardHeader>
                      <CardTitle className="text-base font-bold text-slate-900">Resigned Data Shredding & Retention Rules</CardTitle>
                      <CardDescription className="text-xs text-slate-400">Configure compliance policies for automatic purging of personal records.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-600 font-semibold">Post-Resignation Retention Period (years)</Label>
                            <Select value={retentionYears} onValueChange={(val) => setRetentionYears(val || '')}>
                              <SelectTrigger className="bg-slate-50 text-xs h-8"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white border border-slate-200 text-slate-705 text-xs">
                                <SelectItem value="3">3 Years</SelectItem>
                                <SelectItem value="5">5 Years (Recommended)</SelectItem>
                                <SelectItem value="7">7 Years</SelectItem>
                                <SelectItem value="10">10 Years</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Records are masked/shredded after this buffer period.</span>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs text-slate-600 font-semibold">Metadata Anonymization Level</Label>
                            <Select value={maskingLevel} onValueChange={(val) => setMaskingLevel(val || '')}>
                              <SelectTrigger className="bg-slate-50 text-xs h-8"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white border border-slate-200 text-slate-705 text-xs">
                                <SelectItem value="ANONYMIZE">Full Anonymization (Recommended)</SelectItem>
                                <SelectItem value="PSEUDONYMIZE">Pseudonymization</SelectItem>
                                <SelectItem value="HARD_DELETE">Hard DB Deletion</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="pt-6 space-y-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="auto-purge"
                              checked={enableAutoPurge}
                              onChange={(e) => setEnableAutoPurge(e.target.checked)}
                              className="rounded text-indigo-650 w-3.5 h-3.5 cursor-pointer"
                            />
                            <Label htmlFor="auto-purge" className="text-xs text-slate-700 font-semibold cursor-pointer">Enable Background Purge Cron Job</Label>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            If checked, a background task automatically wakes up weekly, evaluates resigned employee profiles, scrubs physical files in MinIO storage, and masks relational records.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
                        <Button
                          onClick={() => triggerAlert('Retention policies updated successfully')}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 h-8"
                        >
                          Update Policies
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-slate-200 shadow-2xs">
                    <CardHeader>
                      <CardTitle className="text-base font-bold text-slate-900">System Activity & Security Logs Policy</CardTitle>
                      <CardDescription className="text-xs text-slate-400">Configure data privacy policies, retention periods, and automated purging for system activity logs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-600 font-semibold">Log Retention Period (years)</Label>
                            <Select value={logRetentionYears} onValueChange={(val) => setLogRetentionYears(val || '')}>
                              <SelectTrigger className="bg-slate-50 text-xs h-8"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white border border-slate-200 text-slate-705 text-xs">
                                <SelectItem value="1">1 Year</SelectItem>
                                <SelectItem value="3">3 Years</SelectItem>
                                <SelectItem value="5">5 Years (Recommended)</SelectItem>
                                <SelectItem value="7">7 Years</SelectItem>
                                <SelectItem value="10">10 Years</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Historical activity and audit logs are archived/purged after this period.</span>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs text-slate-600 font-semibold">Log Anonymization Level</Label>
                            <Select value={logMaskingLevel} onValueChange={(val) => setLogMaskingLevel(val || '')}>
                              <SelectTrigger className="bg-slate-50 text-xs h-8"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white border border-slate-200 text-slate-705 text-xs">
                                <SelectItem value="ANONYMIZE">Full Anonymization</SelectItem>
                                <SelectItem value="PSEUDONYMIZE">Pseudonymization (Recommended)</SelectItem>
                                <SelectItem value="HARD_DELETE">Hard Purge (Delete from MinIO/DB)</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Define how personal details in log events are masked.</span>
                          </div>
                        </div>

                        <div className="pt-6 space-y-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="log-auto-purge"
                              checked={enableLogAutoPurge}
                              onChange={(e) => setEnableLogAutoPurge(e.target.checked)}
                              className="rounded text-indigo-650 w-3.5 h-3.5 cursor-pointer"
                            />
                            <Label htmlFor="log-auto-purge" className="text-xs text-slate-700 font-semibold cursor-pointer">Enable Automatic Cron Purge</Label>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            When enabled, a background cron job runs automatically to purge or anonymize expired system logs and clean up corresponding cold storage backups in MinIO/DB.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
                        <Button
                          onClick={() => triggerAlert('Log retention and privacy policies updated successfully')}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 h-8"
                        >
                          Update Log Policies
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* SECTION 7: WORKFLOWS */}
          {activeSection === 'workflows' && (
            <div className="space-y-6">
              {/* Sub-tabs menu */}
              <div className="w-full bg-white border border-slate-200 rounded-lg flex items-center gap-1 overflow-x-auto px-2 py-1 shadow-2xs">
                <button
                  onClick={() => setWorkflowTab('queue')}
                  className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-md transition-all cursor-pointer ${workflowTab === 'queue'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-455 hover:bg-slate-50 hover:text-slate-755'
                    }`}
                >
                  Active State Queue
                </button>
                <button
                  onClick={() => setWorkflowTab('history')}
                  className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-md transition-all cursor-pointer ${workflowTab === 'history'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-455 hover:bg-slate-50 hover:text-slate-755'
                    }`}
                >
                  Execution Run History
                </button>
              </div>

              {/* Active queue tab */}
              {workflowTab === 'queue' && (
                <Card className="bg-white border-slate-200 shadow-2xs">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">Active Workflow Machine</CardTitle>
                      <CardDescription className="text-xs text-slate-400">Durable background state machine monitoring running or sleeping processes.</CardDescription>
                    </div>
                    <Button
                      onClick={() => setIsWfModalOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-505 text-white font-semibold text-xs px-3 h-8 rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Schedule Workflow Run
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {activeWorkflows.map((wf) => (
                        <div key={wf.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-2xs transition-all">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-xs">{wf.workflowType}</span>
                              <span className="text-[10px] font-mono text-slate-400">• ID: {wf.id}</span>
                            </div>
                            <p className="text-[11px] text-slate-500">Current Step: <span className="font-mono text-indigo-700 font-bold">{wf.currentStep}</span></p>
                            <pre className="text-[9px] font-mono bg-white border border-slate-250/60 p-2 rounded text-slate-450 mt-1 max-h-[80px] overflow-auto">
                              {JSON.stringify(wf.payload, null, 2)}
                            </pre>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-250/40">
                              {wf.status}
                            </span>
                            <span className="text-[9px] text-slate-400">{new Date(wf.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* History logs tab */}
              {workflowTab === 'history' && (
                <Card className="bg-white border-slate-200 shadow-2xs">
                  <CardHeader>
                    <CardTitle className="text-base font-bold text-slate-900">Execution History Logs</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Completed or terminated state transition records.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-450">
                            <th className="px-4 py-2.5">Scheduled Date</th>
                            <th className="px-4 py-2.5">Workflow Engine Context</th>
                            <th className="px-4 py-2.5">Completion State</th>
                            <th className="px-4 py-2.5">Payload Results</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {workflowHistory.map((wf) => (
                            <tr key={wf.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-mono text-[10px] text-slate-450">
                                {new Date(wf.createdAt).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-800">{wf.workflowType}</td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${wf.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-800 border-emerald-250/20' : 'bg-rose-50 text-rose-800 border-rose-250/20'
                                  }`}>
                                  {wf.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <pre className="text-[9px] font-mono p-1 bg-slate-50 rounded text-slate-500 truncate max-w-[250px]">
                                  {JSON.stringify(wf.payload)}
                                </pre>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* SECTION 8: USERS */}
          {activeSection === 'users' && (
            <Card className="bg-white border-slate-200 shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">User Accounts Directory</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Manage login credentials, active status, and role assignments.</CardDescription>
                </div>
                <Button
                  onClick={() => handleOpenUserModal()}
                  className="bg-indigo-600 hover:bg-indigo-550 text-white font-semibold text-xs px-3 h-8 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New User
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-8 bg-slate-50 border-slate-200 text-xs h-8"
                  />
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-450">
                        <th className="px-4 py-2.5">User Details</th>
                        <th className="px-4 py-2.5">Login Email</th>
                        <th className="px-4 py-2.5">Access Role</th>
                        <th className="px-4 py-2.5">Employee ID</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {users
                        .filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                        .map((usr) => (
                          <tr key={usr.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-semibold text-slate-800">{usr.name}</td>
                            <td className="px-4 py-3 text-slate-550">{usr.email}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 text-[10px] font-bold border-slate-200">
                                {usr.roleName}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{usr.employeeCode}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleToggleUserStatus(usr)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${usr.isActive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                                    : 'bg-slate-100 text-slate-450 border-slate-200'
                                  }`}
                              >
                                {usr.isActive ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setOverrideUser(usr);
                                    if (systemModules.length > 0) {
                                      setOverrideModule(systemModules[0].code);
                                    }
                                    setOverrideAction('read');
                                    setOverrideValue('INHERIT');
                                    setIsOverrideModalOpen(true);
                                  }}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold rounded border border-amber-200/50 cursor-pointer"
                                  title="Custom Overrides"
                                >
                                  Overrides
                                </button>
                                <button
                                  onClick={() => handleOpenUserModal(usr)}
                                  className="p-1 rounded hover:bg-slate-100 text-slate-550 cursor-pointer"
                                  title="Edit User"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(usr.id)}
                                  className="p-1 rounded hover:bg-red-50 text-red-500 cursor-pointer"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
          {activeSection === 'roles' && (
            <Card className="bg-white border-slate-200 shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Roles & System Permissions</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Configure role descriptions and check/uncheck permissions matrix.</CardDescription>
                </div>
                <Button
                  onClick={() => handleOpenRoleModal()}
                  className="bg-indigo-600 hover:bg-indigo-550 text-white font-semibold text-xs px-3 h-8 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Role
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Active Role Selector */}
                <div className="flex items-center gap-3 bg-slate-50 p-4 border border-slate-200 rounded-xl max-w-xs">
                  <Label htmlFor="active-role-select" className="text-xs text-slate-650 font-bold shrink-0">Configure Role:</Label>
                  <Select value={selectedRoleId} onValueChange={(val) => setSelectedRoleId(val || '')}>
                    <SelectTrigger id="active-role-select" className="bg-white border-slate-200 text-xs h-8">
                      <SelectValue placeholder="Select a role">
                        {roles.find(r => r.id === selectedRoleId)?.name || selectedRoleId}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 text-slate-750 text-xs">
                      {roles.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-455">
                        <th className="px-4 py-3">Module / Document Type</th>
                        {['read', 'create', 'write', 'delete', 'print', 'report', 'import', 'export', 'share', 'email'].map((verb) => (
                          <th key={verb} className="px-3 py-3 text-center min-w-[70px] capitalize">{verb}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {systemModules.map((sMod) => {
                        const activeRole = roles.find(r => r.id === selectedRoleId);
                        const rolePerms = activeRole?.permissions?.[sMod.code] || {};
                        return (
                          <tr key={sMod.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-800">{sMod.name}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{sMod.description}</div>
                            </td>
                            {['read', 'create', 'write', 'delete', 'print', 'report', 'import', 'export', 'share', 'email'].map((verb) => {
                              const checked = !!rolePerms[verb];
                              return (
                                <td key={verb} className="px-3 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleToggleRoleModulePermission(selectedRoleId, sMod.code, verb)}
                                    className="w-4 h-4 text-indigo-655 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

        </main>
      </div>

      {/* --- BRANCH DIALOG --- */}
      <Dialog open={isBranchModalOpen} onOpenChange={setIsBranchModalOpen}>
        <DialogContent className="bg-white border border-slate-200 text-slate-755 sm:max-w-[560px] rounded-xl shadow-lg">
          <DialogHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              {editingBranch ? 'Edit Associated Entity / Branch' : 'Add New Associated Entity / Branch'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Configure classification, operations region, address, and statutory details.
            </CardDescription>
          </DialogHeader>


          <form onSubmit={handleSaveBranch} className="space-y-4 py-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="branch-name" className="text-xs text-slate-700 font-semibold">Entity / Branch Name</Label>
                <Input
                  id="branch-name"
                  required
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  placeholder="e.g. Cebu Branch"
                  className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="branch-region" className="text-xs text-slate-700 font-semibold">Geographical Region</Label>
                <Input
                  id="branch-region"
                  required
                  value={branchForm.region}
                  onChange={(e) => setBranchForm({ ...branchForm, region: e.target.value })}
                  placeholder="e.g. Visayas"
                  className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="branch-entity-type" className="text-xs text-slate-700 font-semibold">Structure Type</Label>
                <Select
                  value={branchForm.entityType || 'BRANCH'}
                  onValueChange={(val) => setBranchForm({ ...branchForm, entityType: val || 'BRANCH' })}
                >
                  <SelectTrigger id="branch-entity-type" className="bg-slate-50 border-slate-200 text-xs h-8 text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 text-slate-700 text-xs">
                    <SelectItem value="HOLDING">Holding Company</SelectItem>
                    <SelectItem value="SUBSIDIARY">Subsidiary</SelectItem>
                    <SelectItem value="SISTER_COMPANY">Sister Company</SelectItem>
                    <SelectItem value="AFFILIATE">Affiliate</SelectItem>
                    <SelectItem value="BRANCH">Branch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="branch-parent" className="text-xs text-slate-700 font-semibold">Parent Entity / Company</Label>
                <Select
                  value={branchForm.parentId || 'none'}
                  onValueChange={(val) => setBranchForm({ ...branchForm, parentId: val === 'none' ? '' : (val ?? '') })}
                >

                  <SelectTrigger id="branch-parent" className="bg-slate-50 border-slate-200 text-xs h-8 text-slate-900">
                    <SelectValue placeholder="None (Independent / Root)">
                      {branches.find(b => b.id === branchForm.parentId)?.name || "None (Independent / Root)"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 text-slate-705 text-xs">
                    <SelectItem value="none">None (Independent / Root)</SelectItem>
                    {branches
                      .filter(b => !editingBranch || b.id !== editingBranch.id)
                      .map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subsection: Statutory & Tax Identifiers */}
            <div className="border-t border-slate-100 pt-3 space-y-3">
              <h5 className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-600">Statutory & Tax Identifiers</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="branch-tin" className="text-xs text-slate-700">Registered TIN</Label>
                  <Input
                    id="branch-tin"
                    value={branchForm.registeredTin}
                    onChange={(e) => setBranchForm({ ...branchForm, registeredTin: e.target.value })}
                    placeholder="e.g. 123-456-789-001"
                    className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="branch-bir" className="text-xs text-slate-700">BIR Branch Code</Label>
                  <Input
                    id="branch-bir"
                    value={branchForm.birBranchCode}
                    onChange={(e) => setBranchForm({ ...branchForm, birBranchCode: e.target.value })}
                    placeholder="e.g. 00001"
                    className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="branch-rdo" className="text-xs text-slate-700">RDO Code</Label>
                  <Input
                    id="branch-rdo"
                    value={branchForm.rdoCode}
                    onChange={(e) => setBranchForm({ ...branchForm, rdoCode: e.target.value })}
                    placeholder="e.g. 083"
                    className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="branch-sss" className="text-xs text-slate-700">SSS Employer Number</Label>
                  <Input
                    id="branch-sss"
                    value={branchForm.sssId}
                    onChange={(e) => setBranchForm({ ...branchForm, sssId: e.target.value })}
                    placeholder="e.g. 03-9123456-8"
                    className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="branch-philhealth" className="text-xs text-slate-700">PhilHealth PEN</Label>
                  <Input
                    id="branch-philhealth"
                    value={branchForm.philhealthId}
                    onChange={(e) => setBranchForm({ ...branchForm, philhealthId: e.target.value })}
                    placeholder="e.g. 01-023456789-2"
                    className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="branch-pagibig" className="text-xs text-slate-700">Pag-IBIG Employer ID</Label>
                  <Input
                    id="branch-pagibig"
                    value={branchForm.pagibigId}
                    onChange={(e) => setBranchForm({ ...branchForm, pagibigId: e.target.value })}
                    placeholder="e.g. 1210-9876-5433"
                    className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1 border-t border-slate-100 pt-3">
              <Label htmlFor="branch-address" className="text-xs text-slate-700">Branch Address</Label>
              <textarea
                id="branch-address"
                value={branchForm.address}
                onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                placeholder="Enter full multiline address..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:outline-none min-h-[50px] text-slate-800"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="branch-hq"
                checked={branchForm.isHeadquarters}
                onChange={(e) => setBranchForm({ ...branchForm, isHeadquarters: e.target.checked })}
                className="rounded text-indigo-650 w-3.5 h-3.5 cursor-pointer"
              />
              <Label htmlFor="branch-hq" className="text-xs text-slate-755 cursor-pointer font-semibold">Set as Corporate Headquarters</Label>
            </div>
            <DialogFooter className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsBranchModalOpen(false)} className="bg-transparent border-slate-300 text-xs py-1 h-8">
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1 h-8">
                {editingBranch ? 'Apply Changes' : 'Save Entity / Branch'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DEPARTMENT DIALOG --- */}
      <Dialog open={isDeptModalOpen} onOpenChange={setIsDeptModalOpen}>
        <DialogContent className="bg-white border border-slate-200 text-slate-750 sm:max-w-[420px] rounded-xl shadow-lg">
          <DialogHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              {editingDept ? 'Edit Department' : 'Create New Department'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Map department to cost centers, branch offices, and select managers.
            </CardDescription>
          </DialogHeader>
          <form onSubmit={handleSaveDept} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="dept-name" className="text-xs text-slate-700">Department Name</Label>
              <Input
                id="dept-name"
                required
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                placeholder="e.g. Sales"
                className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dept-branch" className="text-xs text-slate-700">Branch Office</Label>
              <Select value={deptForm.branchId} onValueChange={(val) => setDeptForm({ ...deptForm, branchId: val || '' })}>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-8">
                  <SelectValue placeholder="Select Branch...">
                    {branches.find(b => b.id === deptForm.branchId)?.name || "Select Branch..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 text-slate-700 text-xs">
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeModules.includes('HUMAN_RESOURCES') ? (
              <div className="space-y-1">
                <Label htmlFor="dept-manager" className="text-xs text-slate-700">Department Manager</Label>
                <Select value={deptForm.managerId} onValueChange={(val) => setDeptForm({ ...deptForm, managerId: val || '' })}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-8">
                    <SelectValue placeholder="Select Manager...">
                      {employees.find(e => e.id === deptForm.managerId)?.name || "Select Manager..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 text-slate-700 text-xs">
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name} ({e.id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between text-slate-500">
                <div className="flex items-center gap-1.5 font-medium">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Department Manager binding
                </div>
                <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shrink-0">HRIS Required</span>
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsDeptModalOpen(false)} className="bg-transparent border-slate-300 text-xs py-1 h-8">
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1 h-8">
                {editingDept ? 'Apply Changes' : 'Create Department'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- AUDIT LOG DIFF DIALOG --- */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="bg-white border border-slate-200 text-slate-750 sm:max-w-[540px] rounded-xl shadow-lg">
          <DialogHeader>
            <CardTitle className="text-sm font-bold text-slate-900">
              Audit Data Diff Context
            </CardTitle>
            <CardDescription className="text-xs text-slate-450">
              JSON data before and after the modification transaction.
            </CardDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-[10px] font-semibold text-slate-450 uppercase">
                <span>Before Transaction (Old Data)</span>
                <span>After Transaction (New Data)</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <pre className="p-3 bg-red-50/50 border border-red-100 rounded-lg text-[10px] font-mono text-red-750 overflow-auto max-h-[200px]">
                  {selectedLog.oldData ? JSON.stringify(selectedLog.oldData, null, 2) : 'NULL'}
                </pre>
                <pre className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg text-[10px] font-mono text-emerald-750 overflow-auto max-h-[200px]">
                  {selectedLog.newData ? JSON.stringify(selectedLog.newData, null, 2) : 'NULL'}
                </pre>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 font-semibold">
                Transaction ID: <span className="font-mono">{selectedLog.logId}</span> • Actor: {selectedLog.actorName} ({selectedLog.actorId})
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- CONSENT DETAILS DIALOG --- */}
      <Dialog open={!!selectedConsent} onOpenChange={(open) => !open && setSelectedConsent(null)}>
        <DialogContent className="bg-white border border-slate-200 text-slate-750 sm:max-w-[420px] rounded-xl shadow-lg">
          <DialogHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              Granular Consent Settings
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Employee selections for specific data sharing interfaces.
            </CardDescription>
          </DialogHeader>
          {selectedConsent && (
            <div className="space-y-4 py-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-450 font-semibold">Employee</span>
                <span className="font-semibold text-slate-805">{selectedConsent.employeeName} ({selectedConsent.employeeId})</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-450 font-semibold">Accepted Version</span>
                <span className="font-semibold text-slate-805">{selectedConsent.policyVersion}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-450 font-semibold">IP Address</span>
                <span className="font-mono text-slate-600">{selectedConsent.ipAddress}</span>
              </div>
              <div className="space-y-2 pt-2">
                <span className="text-slate-450 font-bold block uppercase text-[10px]">Granular Permissions</span>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span>HMO Provider Data Sharing</span>
                    <span className="font-bold">{selectedConsent.granularPermissions.hmoSharing ? '✅ Allowed' : '❌ Restrained'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bank Payroll API Sharing</span>
                    <span className="font-bold">{selectedConsent.granularPermissions.bankPayrollSharing ? '✅ Allowed' : '❌ Restrained'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biometric Template Sync</span>
                    <span className="font-bold">{selectedConsent.granularPermissions.biometricCloudSync ? '✅ Allowed' : '❌ Restrained'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button onClick={() => setSelectedConsent(null)} className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 w-full sm:w-auto">
              Close Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- SCHEDULE WORKFLOW DIALOG --- */}
      <Dialog open={isWfModalOpen} onOpenChange={setIsWfModalOpen}>
        <DialogContent className="bg-white border border-slate-200 text-slate-750 sm:max-w-[420px] rounded-xl shadow-lg">
          <DialogHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              Schedule Workflow Engine Run
            </CardTitle>
            <CardDescription className="text-xs text-slate-450">
              Trigger a long-running transaction or batch job on the durable state machine.
            </CardDescription>
          </DialogHeader>
          <form onSubmit={handleScheduleWorkflow} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="wf-type" className="text-xs text-slate-750 font-semibold">Workflow Template</Label>
              <Select value={wfType} onValueChange={(val) => setWfType(val || '')}>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-8"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 text-xs text-slate-705">
                  <SelectItem value="DATA_RETENTION_SCRUB">DATA_RETENTION_SCRUB (Anonymize Resigned Employees)</SelectItem>
                  <SelectItem value="LEAVE_APPROVAL_ESCALATION">LEAVE_APPROVAL_ESCALATION (Escalate Overdue Leaves)</SelectItem>
                  <SelectItem value="BIOMETRIC_PUNCH_SYNC">BIOMETRIC_PUNCH_SYNC (Pull Edge Biometrics logs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {wfType === 'DATA_RETENTION_SCRUB' && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="wf-employee-id" className="text-xs text-slate-755 font-semibold">Target Employee</Label>
                  <Select value={wfEmployeeId} onValueChange={(val) => setWfEmployeeId(val || '')}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-8"><SelectValue placeholder="Select Employee" /></SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 text-xs text-slate-700">
                      {employees.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name} ({e.id})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wf-purge-date" className="text-xs text-slate-755 font-semibold">Purge Date Limit</Label>
                  <Input
                    type="date"
                    id="wf-purge-date"
                    value={wfPurgeDate}
                    onChange={(e) => setWfPurgeDate(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-xs h-8"
                  />
                </div>
              </>
            )}

            {wfType === 'LEAVE_APPROVAL_ESCALATION' && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="wf-employee-id" className="text-xs text-slate-755 font-semibold">Target Employee</Label>
                  <Select value={wfEmployeeId} onValueChange={(val) => setWfEmployeeId(val || '')}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-8"><SelectValue placeholder="Select Employee" /></SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 text-xs text-slate-700">
                      {employees.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name} ({e.id})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wf-manager-id" className="text-xs text-slate-755 font-semibold">Escalation Manager</Label>
                  <Select value={wfManagerId} onValueChange={(val) => setWfManagerId(val || '')}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-8"><SelectValue placeholder="Select Manager" /></SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 text-xs text-slate-700">
                      {employees.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name} ({e.id})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wf-escalation-hours" className="text-xs text-slate-755 font-semibold">Escalation Timeout (Hours)</Label>
                  <Input
                    type="number"
                    id="wf-escalation-hours"
                    value={wfEscalationHours}
                    onChange={(e) => setWfEscalationHours(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-xs h-8"
                  />
                </div>
              </>
            )}

            {wfType === 'BIOMETRIC_PUNCH_SYNC' && (
              <div className="space-y-1">
                <Label htmlFor="wf-terminal-id" className="text-xs text-slate-755 font-semibold">Edge Biometrics Terminal</Label>
                <Select value={wfTerminalId} onValueChange={(val) => setWfTerminalId(val || '')}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-8"><SelectValue placeholder="Select Terminal" /></SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 text-xs text-slate-700">
                    <SelectItem value="ZKT-K14-HQ">ZKT-K14-HQ (Main Headquarters)</SelectItem>
                    <SelectItem value="ZKT-Cebu">ZKT-Cebu (Visayas Hub)</SelectItem>
                    <SelectItem value="ZKT-Manila">ZKT-Manila (South Branch)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsWfModalOpen(false)} className="bg-transparent border-slate-300 text-xs py-1 h-8">
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1 h-8">
                Run State Machine
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- USER DIALOG --- */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="bg-white border border-slate-200 text-slate-750 sm:max-w-[420px] rounded-xl shadow-lg">
          <DialogHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              {editingUser ? 'Edit User Account' : 'Invite New User'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Configure personal credentials and assign system roles.
            </CardDescription>
          </DialogHeader>
          <form onSubmit={handleSaveUser} className="space-y-4 py-2">
            {!editingUser && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="usr-first-name" className="text-xs text-slate-700">First Name</Label>
                    <Input
                      id="usr-first-name"
                      required
                      value={userForm.firstName}
                      onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                      placeholder="e.g. John"
                      className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="usr-last-name" className="text-xs text-slate-700">Last Name</Label>
                    <Input
                      id="usr-last-name"
                      required
                      value={userForm.lastName}
                      onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                      placeholder="e.g. Doe"
                      className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="usr-email" className="text-xs text-slate-700">Login Email Address</Label>
                  <Input
                    id="usr-email"
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="e.g. john.doe@atomic-hr.com"
                    className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900"
                  />
                </div>
              </>
            )}
            <div className="space-y-1">
              <Label htmlFor="usr-role" className="text-xs text-slate-700">System Role</Label>
              <Select value={userForm.roleId} onValueChange={(val) => setUserForm({ ...userForm, roleId: val || '' })}>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-8">
                  <SelectValue placeholder="Select Role">
                    {roles.find(r => r.id === userForm.roleId)?.name || userForm.roleId}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 text-slate-700 text-xs">
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="usr-employee-code" className="text-xs text-slate-700">Link Employee Code (Optional)</Label>
              <Input
                id="usr-employee-code"
                value={userForm.employeeCode}
                onChange={(e) => setUserForm({ ...userForm, employeeCode: e.target.value })}
                placeholder="e.g. EMP-001"
                className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900"
              />
            </div>
            <DialogFooter className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)} className="bg-transparent border-slate-300 text-xs py-1 h-8">
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1 h-8">
                {editingUser ? 'Save Changes' : 'Invite User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- ROLE DIALOG --- */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="bg-white border border-slate-200 text-slate-750 sm:max-w-[420px] rounded-xl shadow-lg">
          <DialogHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              {editingRole ? 'Edit Role Details' : 'Create Custom Role'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Configure name descriptor and target permission boundary.
            </CardDescription>
          </DialogHeader>
          <form onSubmit={handleSaveRole} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="role-name" className="text-xs text-slate-700">Role Name</Label>
              <Input
                id="role-name"
                required
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="e.g. Finance Coordinator"
                className="bg-slate-50 border-slate-200 text-xs py-1 h-8 text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role-description" className="text-xs text-slate-700">Description</Label>
              <textarea
                id="role-description"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Write a brief overview of this role's purpose..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:outline-none min-h-[60px] text-slate-800"
              />
            </div>
            <DialogFooter className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsRoleModalOpen(false)} className="bg-transparent border-slate-300 text-xs py-1 h-8">
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1 h-8">
                {editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- USER OVERRIDES DIALOG --- */}
      <Dialog open={isOverrideModalOpen} onOpenChange={setIsOverrideModalOpen}>
        <DialogContent className="bg-white border border-slate-200 text-slate-750 sm:max-w-[420px] rounded-xl shadow-lg">
          <DialogHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              Custom Permission Overrides
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Override default role settings directly for <strong>{overrideUser?.name}</strong>.
            </CardDescription>
          </DialogHeader>
          <form onSubmit={handleSaveOverride} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="ov-module" className="text-xs text-slate-700">Module / Document Type</Label>
              <Select value={overrideModule} onValueChange={(val) => setOverrideModule(val || '')}>
                <SelectTrigger id="ov-module" className="bg-slate-50 border-slate-200 text-xs h-8"><SelectValue placeholder="Select Module" /></SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 text-slate-700 text-xs">
                  {systemModules.map(m => (
                    <SelectItem key={m.id} value={m.code}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="ov-action" className="text-xs text-slate-700">Action Verb</Label>
              <Select value={overrideAction} onValueChange={(val) => setOverrideAction(val || '')}>
                <SelectTrigger id="ov-action" className="bg-slate-50 border-slate-200 text-xs h-8"><SelectValue placeholder="Select Action" /></SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 text-slate-700 text-xs">
                  {['read', 'create', 'write', 'delete', 'print', 'report', 'import', 'export', 'share', 'email'].map(act => (
                    <SelectItem key={act} value={act} className="capitalize">{act}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="ov-value" className="text-xs text-slate-700">Override Mode</Label>
              <Select value={overrideValue} onValueChange={(val) => setOverrideValue(val || '')}>
                <SelectTrigger id="ov-value" className="bg-slate-50 border-slate-200 text-xs h-8"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 text-slate-700 text-xs">
                  <SelectItem value="ALLOW">✅ Explicit Grant (Force Allow)</SelectItem>
                  <SelectItem value="DENY">❌ Explicit Deny (Force Block)</SelectItem>
                  <SelectItem value="INHERIT">⚪ Inherit (Default from Role)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Current Active Overrides Readout */}
            {overrideUser?.overrides && Object.keys(overrideUser.overrides).length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Active Overrides list</span>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[10px] font-mono space-y-1 max-h-[100px] overflow-auto">
                  {Object.keys(overrideUser.overrides).map(modCode => {
                    const actRules = overrideUser.overrides[modCode];
                    return Object.keys(actRules).map(act => {
                      const ruleVal = actRules[act];
                      if (ruleVal === null || ruleVal === undefined) return null;
                      return (
                        <div key={`${modCode}-${act}`} className="flex justify-between">
                          <span>{modCode} ({act})</span>
                          <span className={ruleVal ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                            {ruleVal ? 'Force Allow' : 'Force Block'}
                          </span>
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsOverrideModalOpen(false)} className="bg-transparent border-slate-300 text-xs py-1 h-8">
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1 h-8">
                Apply Override
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
