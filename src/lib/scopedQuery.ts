import { AccessContext } from './accessControl';

const isUuid = (val: string | null | undefined): val is string =>
  !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

/**
 * Builds a dynamic Prisma WHERE clause based on the horizontal scope (OWN, DEPARTMENT, GLOBAL).
 * Guards against non-UUID mock IDs to prevent P2007 driver errors.
 */
export function buildScopedWhere(ctx: AccessContext, initialWhere: Record<string, any> = {}): Record<string, any> {
  // If tenantId is not a real UUID (e.g. 't1-uuid' mock default), skip the DB entirely
  // by returning a filter that will match zero rows — caller should fall through to mock.
  if (!isUuid(ctx.tenantId)) {
    return { ...initialWhere, id: '00000000-0000-0000-0000-000000000000' };
  }

  const scopeFilters: Record<string, any> = {
    tenantId: ctx.tenantId,
  };

  if (ctx.dataScope === 'OWN') {
    if (!isUuid(ctx.userId)) {
      // userId is also a mock — restrict to nothing
      scopeFilters.id = '00000000-0000-0000-0000-000000000000';
    } else {
      scopeFilters.OR = [
        { id: ctx.userId },
        { employee: { person: { user: { id: ctx.userId } } } },
        { person: { user: { id: ctx.userId } } }
      ];
    }
  } else if (ctx.dataScope === 'DEPARTMENT') {
    const departments = [ctx.departmentId].filter(isUuid);
    if (ctx.scopeIds && ctx.scopeIds.length > 0) {
      departments.push(...ctx.scopeIds.filter(isUuid));
    }
    const uniqueDepts = Array.from(new Set(departments));

    if (uniqueDepts.length > 0) {
      scopeFilters.OR = [
        { departmentId: { in: uniqueDepts } },
        { employee: { departmentId: { in: uniqueDepts } } }
      ];
    } else {
      // No valid department IDs — restrict all
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
