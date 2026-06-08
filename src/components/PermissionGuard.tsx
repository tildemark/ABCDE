'use client';

import React, { useState, useEffect } from 'react';
import { getMergedFormPermissions, FormActions } from '@/lib/accessControlClient';

interface PermissionGuardProps {
  resource: string;
  action: keyof FormActions;
  userId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  resource,
  action,
  userId = 'usr-super-admin', // Default to a standard active user for preview
  fallback = null,
  children
}: PermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkPermission() {
      try {
        const perms = await getMergedFormPermissions(userId, resource);
        setHasPermission(!!perms[action]);
      } catch (err) {
        console.error('PermissionGuard check failed:', err);
        setHasPermission(false);
      }
    }
    checkPermission();
  }, [userId, resource, action]);

  if (hasPermission === null) {
    return null; // or loading spinner
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
