import { AccessContext } from './accessControl';

export interface CompensationRecord {
  id: string;
  employeeId: string;
  basicPay: number | null;
  allowances: any;
  deductions: any;
  sensitivityLevel: number;
}

/**
 * Redacts compensation details on a single record or array of records if user clearance is insufficient.
 */
export function redactCompensation<T extends Record<string, any>>(
  recordOrArray: T | T[],
  ctx: AccessContext
): any {
  const redactSingle = (item: T): T => {
    // If sensitivityLevel exists, compare it to user clearance level.
    const level = typeof item.sensitivityLevel === 'number' ? item.sensitivityLevel : 5;
    if (ctx.clearanceLevel < level) {
      return {
        ...item,
        basicPay: null,
        allowances: null,
        deductions: null,
      };
    }
    return item;
  };

  if (Array.isArray(recordOrArray)) {
    return recordOrArray.map(redactSingle);
  }
  return redactSingle(recordOrArray);
}
