import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'lexmind_super_secret_jwt_key_2026_indian_legal_advocate';

export interface AuthenticatedUser {
  id: string;
  lawyerId: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  lawyerId?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      lawyerId: decoded.lawyerId || decoded.id,
      email: decoded.email,
      role: decoded.role,
      fullName: decoded.fullName,
    };
    req.lawyerId = req.user.lawyerId;
    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired token', message: err.message });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized. Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden. Role '${req.user.role}' does not have sufficient permissions.`,
      });
      return;
    }

    next();
  };
}

export function signToken(user: { id: string; email: string; role: UserRole; full_name: string }): string {
  const secret: jwt.Secret = JWT_SECRET;
  const options: jwt.SignOptions = { expiresIn: '7d' };
  return jwt.sign(
    {
      id: user.id,
      lawyerId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    },
    secret,
    options
  );
}
