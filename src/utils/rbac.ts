import { UserRole } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export type Permission =
  | 'patients.read' | 'patients.write' | 'patients.delete' | 'patients.read.own'
  | 'owners.read' | 'owners.write' | 'owners.delete'
  | 'visits.read' | 'visits.write' | 'visits.delete'
  | 'vaccinations.read' | 'vaccinations.write' | 'vaccinations.delete'
  | 'appointments.read' | 'appointments.write' | 'appointments.delete'
  | 'queues.read' | 'queues.write' | 'queues.delete'
  | 'invoices.read' | 'invoices.write' | 'invoices.delete' | 'invoices.pay'
  | 'boarding.read' | 'boarding.write' | 'boarding.delete'
  | 'surgery.read' | 'surgery.write' | 'surgery.delete'
  | 'attendance.read' | 'attendance.write' | 'attendance.my_read' | 'attendance.clock'
  | 'petshop.read' | 'petshop.write' | 'petshop.delete'
  | 'users.manage' | 'roles.manage' | 'settings.manage' | 'audit.view';

interface RoleConfig {
  id: UserRole;
  name: string;
  permissions: Permission[];
}

let roleConfigCache: RoleConfig[] | null = null;

function validateRoleConfig(roles: RoleConfig[]): void {
  const allPerms = new Set<string>();
  let totalPerms = 0;
  
  for (const roleConfig of roles) {
    if (!roleConfig.id || !roleConfig.name || !Array.isArray(roleConfig.permissions)) {
      throw new Error(`Invalid role config: ${JSON.stringify(roleConfig)}`);
    }
    for (const perm of roleConfig.permissions) {
      if (typeof perm !== 'string' || !perm.includes('.')) {
        throw new Error(`Invalid permission format: ${perm} in role ${roleConfig.id}`);
      }
      allPerms.add(perm);
      totalPerms++;
    }
  }
  
  console.log(`[RBAC] Loaded ${roles.length} roles`);
  console.log(`[RBAC] Loaded ${allPerms.size} unique permissions (${totalPerms} total)`);
  console.log(`[RBAC] Configuration valid`);
}

function loadRoles(): Array<{ id: UserRole; name: string; permissions: Permission[] }> {
  if (roleConfigCache) return roleConfigCache;
  
  const filePath = path.resolve(process.cwd(), 'config', 'roles.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`RBAC config not found: ${filePath}`);
  }
  
  const raw = fs.readFileSync(filePath, 'utf-8');
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON in roles.json: ${e}`);
  }
  
  if (!data.roles || !Array.isArray(data.roles)) {
    throw new Error('roles.json must have "roles" array');
  }
  
  const roles = data.roles.map((r: any) => ({
    id: r.id as UserRole,
    name: r.name,
    permissions: Array.isArray(r.permissions) ? r.permissions : []
  }));
  
  const allPerms = new Set<string>();
  let totalPerms = 0;
  for (const r of roles) {
    if (!r.id || !r.name || !Array.isArray(r.permissions)) {
      throw new Error(`Invalid role config: ${JSON.stringify(r)}`);
    }
    for (const perm of r.permissions) {
      if (typeof perm !== 'string' || !perm.includes('.')) {
        throw new Error(`Invalid permission format: ${perm} in role ${r.id}`);
      }
      allPerms.add(perm);
      totalPerms++;
    }
  }
  
  console.log(`[RBAC] Loaded ${roles.length} roles`);
  console.log(`[RBAC] Loaded ${allPerms.size} unique permissions (${totalPerms} total)`);
  console.log(`[RBAC] Configuration valid`);
  
  roleConfigCache = roles;
  return roleConfigCache;
}

export function initRBAC(): void {
  loadRoles();
}

export function getUserPermissions(role: string): string[] {
  const roles = loadRoles();
  const roleConfig = roles.find((r) => r.id === role);
  return roleConfig?.permissions || [];
}

export function canAccess(role: string, permission: string): boolean {
  const perms = getUserPermissions(role);
  return perms.includes(permission);
}

export function getAllRoles() {
  return loadRoles();
}