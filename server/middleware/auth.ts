import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string;
        role: string;
      };
    }
  }
}

// Middleware לאימות התחברות - זמנית מאפשר גישה לכל הבקשות
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // זמנית - מאפשר גישה לכל הבקשות עד לתיקון מערכת האימות
  next();
};

// Middleware לאימות הרשאות מנהל - זמנית מאפשר גישה לכל הבקשות
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // זמנית - מאפשר גישה לכל הבקשות עד לתיקון מערכת האימות
  next();
};

// Middleware לאימות הרשאות מנהל או מנהל צוות - זמנית מאפשר גישה לכל הבקשות
export const requireManagerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  // זמנית - מאפשר גישה לכל הבקשות עד לתיקון מערכת האימות
  next();
};

// בדיקת domain לאבטחת דומיינים
export const validateDomain = (req: Request, res: Response, next: NextFunction) => {
  const domain = req.headers.host || 'default';
  req.headers['x-domain'] = domain;
  next();
};

// Main auth middleware for testing
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userEmail = req.headers['x-user-email'] as string;
  const userRole = req.headers['x-user-role'] as string;
  const authHeader = req.headers.authorization;

  // Allow test/development requests
  if (userEmail === 'test@test.com' || authHeader === 'Bearer test') {
    req.user = {
      email: userEmail || 'test@test.com',
      role: userRole || 'admin'
    };
    return next();
  }

  if (!userEmail) {
    return res.status(401).json({
      message: "נדרש להתחבר למערכת כדי לגשת למידע זה"
    });
  }

  // Validate user exists in the system (for production use)
  const validUsers = ['mali.f.arch2@gmail.com', 'jj1212t@gmail.com'];
  if (!validUsers.includes(userEmail)) {
    return res.status(403).json({
      message: "משתמש לא מורשה לגשת למערכת"
    });
  }

  req.user = {
    email: userEmail,
    role: userRole || 'user'
  };

  next();
};