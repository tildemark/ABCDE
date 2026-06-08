import { AccessContext } from './accessControl';

/**
 * Builds a dynamic Prisma WHERE clause based on the horizontal scope (OWN, DEPARTMENT, GLOBAL).
 */
export function buildScopedWhere(ctx: AccessContext, initialWhere: Record<string, any> = {}): Record<string, any> {
  const scopeFilters: Record<string, any> = {
    tenantId: ctx.tenantId,
  };

  if (ctx.dataScope === 'OWN') {
    // Filter records belonging directly to this user (e.g. employee linked to person/user, or record matching user id)
    // Note: We'll construct standard checks. For employees, this usually means filtering by personId or user identity.
    // We can filter where user's employee matches the record, or we support employeeId checks.
    // In our case, standard demographic and payroll records will filter employee's personId or userId.
    // Let's check employee structure or assign: userId matches User's person employee.
    scopeFilters.OR = [
      { id: ctx.userId },
      { employee: { person: { user: { id: ctx.userId } } } },
      // Support if query targets employee table directly
      { person: { user: { id: ctx.userId } } }
    ];
  } else if (ctx.dataScope === 'DEPARTMENT') {
    // Include user's own department plus any explicitly assigned scopes from role assignment
    const departments = [ctx.departmentId].filter((id): id is string => !!id);
    if (ctx.scopeIds && ctx.scopeIds.length > 0) {
      departments.push(...ctx.scopeIds);
    }
    const uniqueDepts = Array.from(new Set(departments));

    if (uniqueDepts.length > 0) {
      scopeFilters.OR = [
        { departmentId: { in: uniqueDepts } },
        // If checking employees departmentId
        { employee: { departmentId: { in: uniqueDepts } } }
      ];
    } else {
      // If department scope but user belongs to no department and has no scopes assigned, restrict all
      scopeFilters.id = '00000000-0000-0000-0000-000000000000';
    }
  }

  return {
    ...initialWhere,
    ...scopeFilters,
  };
}

/**
 * Builds a query filter enforcing sensitivity level constraints.
 */
export function buildSensitivityWhere(ctx: AccessContext, initialWhere: Record<string, any> = {}): Record<string, any> {
  return {
    ...initialWhere,
    sensitivityLevel: {
      lte: ctx.clearanceLevel,
    },
  };
}
