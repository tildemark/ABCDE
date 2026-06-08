import { prisma } from './db';
import { NextResponse } from 'next/server';
import { resolveUserPermissions, tenantHasModule } from './permissions';

const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  STANDARD = 'STANDARD'
}
export enum EntityType {
  HOLDING = 'HOLDING',
  SUBSIDIARY = 'SUBSIDIARY',
  BRANCH = 'BRANCH'
}
export enum MenuLevel {
  MODULE = 'MODULE',
  SUBMODULE = 'SUBMODULE',
  TAB = 'TAB'
}
export enum DataClassification {
  STANDARD = 'STANDARD',
  CONFIDENTIAL = 'CONFIDENTIAL',
  SENSITIVE = 'SENSITIVE'
}
export enum ConsentStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED'
}
export enum CascadeScope {
  DOWNWARD_CASCADE = 'DOWNWARD_CASCADE',
  EXACT_ENTITY = 'EXACT_ENTITY'
}

// Legacy exports for compatibility with existing code
export interface AccessContext {
  userId: string;
  tenantId: string;
  departmentId: string | null;
  clearanceLevel: number;
  dataScope: 'OWN' | 'DEPARTMENT' | 'GLOBAL';
  scopeIds: string[];
}

export interface RequireAccessOptions {
  userId: string;
  tenantId: string;
  moduleCode: string;
  action: 'canRead' | 'canCreate' | 'canWrite' | 'canDelete' | 'canExport' | 'canPrint' | 'canReport' | 'canImport' | 'canShare' | 'canEmail';
  requiredClearance?: number;
}

export async function requireAccess(opts: RequireAccessOptions): Promise<{ authorized: true; ctx: AccessContext } | { authorized: false; response: NextResponse }> {
  const { userId, tenantId, moduleCode, action, requiredClearance = 1 } = opts;

  const hasModule = await tenantHasModule(tenantId, moduleCode);
  if (!hasModule) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: `Module '${moduleCode}' is not active or licensed.` },
        { status: 403 }
      ),
    };
  }

  let userClearance = 1;
  let userDepartmentId: string | null = null;
  if (prisma && isUuid(userId)) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { actionLevel: true, departmentId: true },
      });
      if (dbUser) {
        userClearance = dbUser.actionLevel;
        userDepartmentId = dbUser.departmentId;
      }
    } catch (err) {
      console.error('requireAccess: failed to fetch user metadata', err);
    }
  }

  if (userClearance < requiredClearance) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: `Insufficient clearance level.` },
        { status: 403 }
      ),
    };
  }

  const effPerms = await resolveUserPermissions(userId, tenantId);
  const modulePerms = effPerms.permissions[moduleCode];
  
  if (!modulePerms || !modulePerms[action]) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: `Insufficient permissions for action.` },
        { status: 403 }
      ),
    };
  }

  const context: AccessContext = {
    userId,
    tenantId,
    departmentId: userDepartmentId,
    clearanceLevel: userClearance,
    dataScope: modulePerms.scope === 'BRANCH' ? 'DEPARTMENT' : (modulePerms.scope as 'OWN' | 'DEPARTMENT' | 'GLOBAL'),
    scopeIds: modulePerms.scopeIds || [],
  };

  return { authorized: true, ctx: context };
}

// Mock DB Fallback storage for local runtime when PostgreSQL is offline
export let mockEntities = [
  { id: 'ent-holding', name: 'ACME Holding Group', type: EntityType.HOLDING, parentId: null as string | null },
  { id: 'ent-sub-ph', name: 'ACME Philippines Corp', type: EntityType.SUBSIDIARY, parentId: 'ent-holding' },
  { id: 'ent-branch-mnl', name: 'ACME Manila Branch', type: EntityType.BRANCH, parentId: 'ent-sub-ph' },
  { id: 'ent-branch-cebu', name: 'ACME Cebu Branch', type: EntityType.BRANCH, parentId: 'ent-sub-ph' }
];

export let mockUsers = [
  { id: 'usr-ceo', entityId: 'ent-holding', departmentId: 'dept-executive', systemRole: SystemRole.STANDARD, actionLevel: 10, managerId: null as string | null, name: 'CEO Boss', email: 'ceo@acme.com' },
  { id: 'usr-super-admin', entityId: 'ent-holding', departmentId: 'dept-it', systemRole: SystemRole.SUPER_ADMIN, actionLevel: 8, managerId: 'usr-ceo', name: 'System Admin', email: 'admin@acme.com' },
  { id: 'usr-hr-mgr', entityId: 'ent-sub-ph', departmentId: 'dept-hr', systemRole: SystemRole.ADMIN, actionLevel: 6, managerId: 'usr-ceo', name: 'HR Manager', email: 'hr.mgr@acme.com' },
  { id: 'usr-hr-spec', entityId: 'ent-branch-mnl', departmentId: 'dept-hr', systemRole: SystemRole.STANDARD, actionLevel: 3, managerId: 'usr-hr-mgr', name: 'HR Specialist', email: 'hr.spec@acme.com' },
  { id: 'usr-auditor', entityId: 'ent-holding', departmentId: 'dept-audit', systemRole: SystemRole.STANDARD, actionLevel: 4, managerId: 'usr-ceo', name: 'External Auditor', email: 'auditor@acme.com' }
];

export let mockRoles = [
  { id: 'role-super-admin', name: 'Super Admin', complianceBypass: false },
  { id: 'role-hr-mgr', name: 'HR Manager', complianceBypass: false },
  { id: 'role-hr-spec', name: 'HR Specialist', complianceBypass: false },
  { id: 'role-auditor', name: 'External Compliance Auditor', complianceBypass: true }
];

export let mockUserRoleAssignments = [
  { id: 'ura-1', userId: 'usr-super-admin', roleId: 'role-super-admin', inheritanceScope: CascadeScope.DOWNWARD_CASCADE },
  { id: 'ura-2', userId: 'usr-hr-mgr', roleId: 'role-hr-mgr', inheritanceScope: CascadeScope.DOWNWARD_CASCADE },
  { id: 'ura-3', userId: 'usr-hr-spec', roleId: 'role-hr-spec', inheritanceScope: CascadeScope.EXACT_ENTITY },
  { id: 'ura-4', userId: 'usr-auditor', roleId: 'role-auditor', inheritanceScope: CascadeScope.EXACT_ENTITY }
];

export let mockMenus = [
  // Module level
  { id: 'menu-core', name: 'Core Setup', level: MenuLevel.MODULE, path: '/core', parentId: null as string | null },
  { id: 'menu-hris', name: 'HR Directory', level: MenuLevel.MODULE, path: '/hris', parentId: null as string | null },
  { id: 'menu-payroll', name: 'Payroll Center', level: MenuLevel.MODULE, path: '/payroll', parentId: null as string | null },

  // Submodule level (Core Setup)
  { id: 'menu-core-profile', name: 'My Profile', level: MenuLevel.SUBMODULE, path: '/core?section=profile', parentId: 'menu-core' },
  { id: 'menu-core-company', name: 'Company Setup', level: MenuLevel.SUBMODULE, path: '/core?section=company', parentId: 'menu-core' },
  { id: 'menu-core-users', name: 'Users', level: MenuLevel.SUBMODULE, path: '/core?section=users', parentId: 'menu-core' },
  { id: 'menu-core-roles', name: 'Roles & Permissions', level: MenuLevel.SUBMODULE, path: '/core?section=roles', parentId: 'menu-core' },
  { id: 'menu-core-settings', name: 'General Settings', level: MenuLevel.SUBMODULE, path: '/core?section=settings', parentId: 'menu-core' },
  { id: 'menu-core-privacy', name: 'Data Privacy', level: MenuLevel.SUBMODULE, path: '/core?section=privacy', parentId: 'menu-core' },
  { id: 'menu-core-workflows', name: 'Workflows', level: MenuLevel.SUBMODULE, path: '/core?section=workflows', parentId: 'menu-core' },
  { id: 'menu-core-logs', name: 'Audit Logs', level: MenuLevel.SUBMODULE, path: '/core?section=logs', parentId: 'menu-core' },
  { id: 'menu-core-licensing', name: 'Licensing', level: MenuLevel.SUBMODULE, path: '/core?section=licensing', parentId: 'menu-core' },

  // Submodule level (HR Directory)
  { id: 'menu-hris-employees', name: 'Employees Directory', level: MenuLevel.SUBMODULE, path: '/hris/employees', parentId: 'menu-hris' },

  // Submodule level (Payroll Center)
  { id: 'menu-payroll-salaries', name: 'Salaries & Registers', level: MenuLevel.SUBMODULE, path: '/payroll/salaries', parentId: 'menu-payroll' },

  // Tab level
  { id: 'menu-payroll-executive-tab', name: 'Executive Compensation', level: MenuLevel.TAB, path: '/payroll/salaries/executive', parentId: 'menu-payroll-salaries' }
];

export let mockMenuPermissions = [
  // HR Manager menu views
  { id: 'mp-1', roleId: 'role-hr-mgr', menuId: 'menu-hris', canView: true },
  { id: 'mp-2', roleId: 'role-hr-mgr', menuId: 'menu-hris-employees', canView: true },
  { id: 'mp-3', roleId: 'role-hr-mgr', menuId: 'menu-payroll', canView: true },
  { id: 'mp-4', roleId: 'role-hr-mgr', menuId: 'menu-payroll-salaries', canView: true },
  { id: 'mp-5', roleId: 'role-hr-mgr', menuId: 'menu-payroll-executive-tab', canView: true },
  { id: 'mp-8', roleId: 'role-hr-mgr', menuId: 'menu-core', canView: true },
  { id: 'mp-9', roleId: 'role-hr-mgr', menuId: 'menu-core-company', canView: true },
  { id: 'mp-10', roleId: 'role-hr-mgr', menuId: 'menu-core-users', canView: true },
  { id: 'mp-11', roleId: 'role-hr-mgr', menuId: 'menu-core-roles', canView: true },
  { id: 'mp-12', roleId: 'role-hr-mgr', menuId: 'menu-core-settings', canView: true },
  { id: 'mp-13', roleId: 'role-hr-mgr', menuId: 'menu-core-privacy', canView: true },
  { id: 'mp-14', roleId: 'role-hr-mgr', menuId: 'menu-core-workflows', canView: true },
  { id: 'mp-15', roleId: 'role-hr-mgr', menuId: 'menu-core-logs', canView: true },
  { id: 'mp-16', roleId: 'role-hr-mgr', menuId: 'menu-core-licensing', canView: true },

  // HR Specialist menu views
  { id: 'mp-6', roleId: 'role-hr-spec', menuId: 'menu-hris', canView: true },
  { id: 'mp-7', roleId: 'role-hr-spec', menuId: 'menu-hris-employees', canView: true }
];

export let mockFormPermissions = [
  {
    id: 'fp-1',
    roleId: 'role-hr-mgr',
    resourceId: 'Payroll',
    actions: { view: true, create: true, write: true, delete: false, print: true, report: true, import: true, export: true, share: false, email: true }
  },
  {
    id: 'fp-2',
    roleId: 'role-hr-spec',
    resourceId: 'Payroll',
    actions: { view: true, create: true, write: false, delete: false, print: true, report: false, import: false, export: false, share: false, email: false }
  },
  {
    id: 'fp-3',
    roleId: 'role-auditor',
    resourceId: 'Payroll',
    actions: { view: true, create: false, write: false, delete: false, print: true, report: true, import: false, export: true, share: false, email: false }
  }
];

export let mockConsentLedger: any[] = [
  { id: 'con-1', dataSubjectId: 'usr-ceo', grantedToRoleId: 'role-auditor', grantedToUserId: null, purpose: 'External Financial Auditing', status: ConsentStatus.ACTIVE, timestamp: new Date() }
];

export let mockAuditLogs: any[] = [];

// Helper to determine if an entity is a child of a parent entity (cascading support)
export function getChildEntityIds(entityId: string): string[] {
  const children: string[] = [entityId];
  let searchQueue = [entityId];

  while (searchQueue.length > 0) {
    const current = searchQueue.shift();
    if (!current) continue;
    const matches = mockEntities.filter(e => e.parentId === current).map(e => e.id);
    for (const match of matches) {
      if (!children.includes(match)) {
        children.push(match);
        searchQueue.push(match);
      }
    }
  }
  return children;
}

// ==========================================
// GATE 1: NAVIGATION VERIFICATION
// ==========================================
export async function checkNavigationAccess(userId: string, targetMenuId: string): Promise<boolean> {
  if (targetMenuId === 'menu-core' || targetMenuId === 'menu-core-profile') {
    return true;
  }
  // 1. Resolve User via DB
  if (prisma && isUuid(userId)) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          clearanceLevel: true,
          // systemRole not in schema — use clearanceLevel >= 8 as super admin heuristic
        }
      });
      if (user) {
        // Treat clearance level >= 8 as super admin (full access)
        if (user.clearanceLevel >= 8) return true;
        // For other DB users, fall through to mock logic
        // (menuPermissions table not in schema yet)
      }
    } catch (err) {
      console.warn('DB disconnected, falling back to mock navigation check.');
    }
  }

  // Fallback Mock Logic
  const mockUser = mockUsers.find(u => u.id === userId);
  if (!mockUser) return false;
  if (mockUser.systemRole === SystemRole.SUPER_ADMIN) return true;

  const userAssignments = mockUserRoleAssignments.filter(ura => ura.userId === userId);
  const userRoleIds = userAssignments.map(a => a.roleId);

  return mockMenuPermissions.some(mp =>
    userRoleIds.includes(mp.roleId) && mp.menuId === targetMenuId && mp.canView
  );
}

// ==========================================
// GATE 2: FORM ACTION UNION
// ==========================================
export interface FormActions {
  view: boolean;
  create: boolean;
  write: boolean;
  delete: boolean;
  print: boolean;
  report: boolean;
  import: boolean;
  export: boolean;
  share: boolean;
  email: boolean;
}

export const defaultFormActions: FormActions = {
  view: false,
  create: false,
  write: false,
  delete: false,
  print: false,
  report: false,
  import: false,
  export: false,
  share: false,
  email: false
};

export async function getMergedFormPermissions(userId: string, resourceId: string): Promise<FormActions> {
  const merged = { ...defaultFormActions };

  if (prisma && isUuid(userId)) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roleAssignments: {
            include: {
              role: {
                include: {
                  rolePermissions: { include: { systemModule: true } }
                }
              }
            }
          }
        }
      });
      if (user) {
        // Treat clearance level >= 8 as super admin
        if ((user as any).clearanceLevel >= 8) {
          return Object.keys(merged).reduce((acc, val) => {
            acc[val as keyof FormActions] = true;
            return acc;
          }, {} as FormActions);
        }

        // Map rolePermissions → FormActions using systemModule.code === resourceId
        user.roleAssignments.forEach((assignment: any) => {
          const rp = assignment.role.rolePermissions.find((p: any) => p.systemModule.code === resourceId);
          if (rp) {
            if (rp.canRead) merged.view = true;
            if (rp.canCreate) merged.create = true;
            if (rp.canWrite) merged.write = true;
            if (rp.canDelete) merged.delete = true;
            if (rp.canPrint) merged.print = true;
            if (rp.canReport) merged.report = true;
            if (rp.canImport) merged.import = true;
            if (rp.canExport) merged.export = true;
            if (rp.canShare) merged.share = true;
            if (rp.canEmail) merged.email = true;
          }
        });
        return merged;
      }
    } catch (err) {
      console.warn('DB disconnected, falling back to mock form permission logic.');
    }
  }

  // Fallback Mock Logic
  const mockUser = mockUsers.find(u => u.id === userId);
  if (!mockUser) return merged;

  if (mockUser.systemRole === SystemRole.SUPER_ADMIN) {
    return Object.keys(merged).reduce((acc, val) => {
      acc[val as keyof FormActions] = true;
      return acc;
    }, {} as FormActions);
  }

  const assignedRoleIds = mockUserRoleAssignments.filter(ura => ura.userId === userId).map(a => a.roleId);
  mockFormPermissions
    .filter(fp => assignedRoleIds.includes(fp.roleId) && fp.resourceId === resourceId)
    .forEach(fp => {
      const actionsObj = fp.actions as any;
      Object.keys(merged).forEach(actionKey => {
        if (actionsObj[actionKey] === true) {
          merged[actionKey as keyof FormActions] = true;
        }
      });
    });

  return merged;
}

// ==========================================
// GATE 3: DATA PRIVACY & COMPLIANCE GATEWAY
// ==========================================
export interface RowData {
  id: string;
  entityId: string;
  departmentId: string;
  classification: DataClassification;
  actionLevel: number;
  dataSubjectId: string; // Employee who owns the data record
}

export async function checkDataPrivacy(
  viewerId: string,
  row: RowData,
  action: string
): Promise<{ allowed: boolean; isRedacted: boolean; reason?: string }> {
  // Fetch viewer details
  let viewer = mockUsers.find(u => u.id === viewerId);

  if (prisma && isUuid(viewerId)) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: viewerId },
        select: { id: true, clearanceLevel: true }
      });
      if (dbUser) {
        // Synthesize a viewer-compatible object from DB fields
        viewer = {
          ...viewer,
          id: dbUser.id,
          actionLevel: dbUser.clearanceLevel,
          systemRole: dbUser.clearanceLevel >= 8 ? SystemRole.SUPER_ADMIN
            : dbUser.clearanceLevel >= 5 ? SystemRole.ADMIN
            : SystemRole.STANDARD,
        } as any;
      }
    } catch (err) {
      // Fallback used
    }
  }

  if (!viewer) {
    return { allowed: false, isRedacted: true, reason: 'Viewer not found' };
  }

  const isSuperAdmin = viewer.systemRole === SystemRole.SUPER_ADMIN;
  const isAdmin = viewer.systemRole === SystemRole.ADMIN;

  // 1. STANDARD DATA GATE
  if (row.classification === DataClassification.STANDARD) {
    if (isSuperAdmin) {
      return { allowed: true, isRedacted: false };
    }

    if (isAdmin) {
      if (row.departmentId === viewer.departmentId) {
        return { allowed: true, isRedacted: false };
      }
      return { allowed: false, isRedacted: true, reason: 'Admin restricted to department records' };
    }

    // Standard User: check entity cascading
    let allowedEntities: string[] = [viewer.entityId];
    
    // Resolve roleAssignments to check for DOWNWARD_CASCADE scope
    let hasCascade = false;
    if (prisma && isUuid(viewerId)) {
      try {
        const assignments = await prisma.userRoleAssignment.findMany({ where: { userId: viewerId } });
        hasCascade = assignments.some((a: any) => a.inheritanceScope === CascadeScope.DOWNWARD_CASCADE);
      } catch (err) {
        hasCascade = mockUserRoleAssignments.filter(a => a.userId === viewerId).some(a => a.inheritanceScope === CascadeScope.DOWNWARD_CASCADE);
      }
    } else {
      hasCascade = mockUserRoleAssignments.filter(a => a.userId === viewerId).some(a => a.inheritanceScope === CascadeScope.DOWNWARD_CASCADE);
    }

    if (hasCascade) {
      allowedEntities = getChildEntityIds(viewer.entityId);
    }

    if (allowedEntities.includes(row.entityId)) {
      return { allowed: true, isRedacted: false };
    }

    return { allowed: false, isRedacted: true, reason: 'Access denied: Entity boundary restriction' };
  }

  // 2. CONFIDENTIAL DATA GATE
  if (row.classification === DataClassification.CONFIDENTIAL) {
    // Evaluate strictly on actionLevel. Ignore SUPER_ADMIN software privilege
    if (row.actionLevel <= viewer.actionLevel) {
      return { allowed: true, isRedacted: false };
    }

    // Action level too low. Evaluate complianceBypass exception (Auditors)
    let bypassAllowed = false;
    if (prisma && isUuid(viewerId)) {
      try {
        const dbAssignments = await prisma.userRoleAssignment.findMany({
          where: { userId: viewerId },
          include: { role: true }
        });
        bypassAllowed = dbAssignments.some((a: any) => a.role.complianceBypass === true);
      } catch (err) {
        const roleIds = mockUserRoleAssignments.filter(a => a.userId === viewerId).map(a => a.roleId);
        bypassAllowed = mockRoles.filter(r => roleIds.includes(r.id)).some(r => r.complianceBypass === true);
      }
    } else {
      const roleIds = mockUserRoleAssignments.filter(a => a.userId === viewerId).map(a => a.roleId);
      bypassAllowed = mockRoles.filter(r => roleIds.includes(r.id)).some(r => r.complianceBypass === true);
    }

    if (bypassAllowed) {
      // Create system audit log
      const logMsg = `AUDIT_BYPASS: View CONFIDENTIAL data belonging to Subject ${row.dataSubjectId}`;
      if (prisma && isUuid(viewerId)) {
        try {
          await prisma.auditLog.create({
            data: {
              tableName: 'Bypass',
              recordId: row.id,
              actionType: 'BYPASS',
              newData: { logMsg, userId: viewerId },
            }
          });
        } catch (err) {
          mockAuditLogs.push({ id: `log-${Date.now()}`, userId: viewerId, action: logMsg, resourceId: row.id, timestamp: new Date() });
        }
      } else {
        mockAuditLogs.push({ id: `log-${Date.now()}`, userId: viewerId, action: logMsg, resourceId: row.id, timestamp: new Date() });
      }

      return { allowed: true, isRedacted: false, reason: 'Bypassed by External Compliance Audit' };
    }

    return { allowed: false, isRedacted: true, reason: `Insufficient human actionLevel (Required: ${row.actionLevel}, User: ${viewer.actionLevel})` };
  }

  // 3. SENSITIVE DATA GATE (SPI)
  if (row.classification === DataClassification.SENSITIVE) {
    // Must pass Rank check (Confidential check) first
    if (row.actionLevel > viewer.actionLevel) {
      return { allowed: false, isRedacted: true, reason: `Insufficient Rank for SENSITIVE data` };
    }

    // Query active consent ledger record from dataSubjectId explicitly granting access to viewer (or viewer role)
    let activeConsent = false;
    const viewerRoleIds = mockUserRoleAssignments.filter(a => a.userId === viewerId).map(a => a.roleId);

    if (prisma && isUuid(viewerId) && isUuid(row.dataSubjectId)) {
      try {
        const consent = await prisma.consentLedger.findFirst({
          where: {
            dataSubjectId: row.dataSubjectId,
            status: ConsentStatus.ACTIVE,
            OR: [
              { grantedToUserId: viewerId },
              { grantedToRoleId: { in: viewerRoleIds } }
            ]
          }
        });
        consent;
        activeConsent = !!consent;
      } catch (err) {
        activeConsent = mockConsentLedger.some(c =>
          c.dataSubjectId === row.dataSubjectId &&
          c.status === ConsentStatus.ACTIVE &&
          (c.grantedToUserId === viewerId || viewerRoleIds.includes(c.grantedToRoleId))
        );
      }
    } else {
      activeConsent = mockConsentLedger.some(c =>
        c.dataSubjectId === row.dataSubjectId &&
        c.status === ConsentStatus.ACTIVE &&
        (c.grantedToUserId === viewerId || viewerRoleIds.includes(c.grantedToRoleId))
      );
    }

    if (activeConsent) {
      return { allowed: true, isRedacted: false };
    }

    // No active consent => Redact field
    return { allowed: true, isRedacted: true, reason: 'Redacted: SPI Consent missing or revoked' };
  }

  return { allowed: false, isRedacted: true, reason: 'Unknown classification' };
}
