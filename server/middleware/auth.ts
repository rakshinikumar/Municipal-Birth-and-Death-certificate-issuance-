import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/index.js';
import prisma from '../prisma/client.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'CITIZEN' | 'HOSPITAL' | 'OFFICER' | 'ADMIN';
  name: string;
  profileId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as {
      id: string;
      email: string;
      role: 'CITIZEN' | 'HOSPITAL' | 'OFFICER' | 'ADMIN';
      name: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        citizenProfile: true,
        hospitalProfile: true,
        officerProfile: true,
      },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid token: User not found.' });
      return;
    }

    let profileId: string | undefined;
    if (user.role === 'CITIZEN' && user.citizenProfile) profileId = user.citizenProfile.id;
    if (user.role === 'HOSPITAL' && user.hospitalProfile) profileId = user.hospitalProfile.id;
    if (user.role === 'OFFICER' && user.officerProfile) profileId = user.officerProfile.id;

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as AuthenticatedUser['role'],
      name: user.name,
      profileId,
    };

    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Invalid or expired session token.' });
  }
};

export const requireRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to authorized ${roles.join(' or ')} personnel.`,
      });
      return;
    }

    next();
  };
};
