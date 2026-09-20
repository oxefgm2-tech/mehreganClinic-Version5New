import { Request, Response, NextFunction } from 'express';
import { sessionUser } from '../auth/session';
import { getUserPermissions } from '../utils/rbac';

export interface AuthenticatedRequest extends Request {
  user?: ReturnType<typeof sessionUser>;
}

export function unauthorized(res: Response, message = 'ابتدا وارد شوید') {
  return res.status(401).json({
    success: false,
    error: { code: 'UNAUTHORIZED', message }
  });
}

export function forbidden(res: Response, message = 'دسترسی غیرمجاز') {
  return res.status(403).json({
    success: false,
    error: { code: 'FORBIDDEN', message }
  });
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = sessionUser(req);
    if (!user) return unauthorized(res);
    
    (req as any).user = user;
    
    const perms = getUserPermissions(user.role);
    if (!perms.includes(permission)) {
      return forbidden(res, `دسترسی غیرمجاز: نیاز به ${permission}`);
    }
    next();
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = sessionUser(req);
  if (!user) return unauthorized(res);
  (req as any).user = user;
  next();
}

export function requireOwnership(getResourceOwnerId: (req: Request) => Promise<string>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = sessionUser(req);
    if (!user) return unauthorized(res);
    
    if (['admin', 'it_developer'].includes(user.role)) return next();
    
    const resourceOwnerId = await getResourceOwnerId(req);
    if (user.ownerId !== resourceOwnerId && user.id !== resourceOwnerId) {
      return forbidden(res, 'دسترسی به این داده غیرمجاز است');
    }
    next();
  };
}